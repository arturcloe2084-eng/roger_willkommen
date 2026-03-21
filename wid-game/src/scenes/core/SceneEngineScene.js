import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';
import { interactWithPC } from '../../services/SceneBuilderUI.js';

/**
 * SceneEngine — Motor genérico de escenas.
 * Lee la definición de escena del registro global y crea:
 *   - Imagen de fondo
 *   - Hotspots interactivos (puertas, diálogos, crucigramas, quizzes, radio)
 *   - Navegación entre escenas
 *
 * Para añadir una escena nueva, solo edita /public/data/scenes.json
 */
export class SceneEngineScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.SCENE_ENGINE);
    }

    init(data) {
        this.sceneId = data.sceneId || 'apartamento';
    }

    create() {
        const { width, height } = this.cameras.main;

        const allScenes = this.cache.json.get('scenesData');
        this.allScenes = allScenes?.scenes || {};
        this.sceneDef = this.allScenes[this.sceneId];

        if (!this.sceneDef) {
            console.error(`[SceneEngine] Escena "${this.sceneId}" no encontrada en scenes.json`);
            return;
        }

        console.log(`[SceneEngine] Cargando escena: ${this.sceneDef.name}`);

        const storyChanged = playerProgressStore.setStoryContext({
            chapter: this.sceneDef.chapter,
            objective: this.sceneDef.objective
        });
        if (storyChanged) this.game.events.emit('update-story');

        // ═══ 1. FONDO ═══
        this.bg = this.add.image(width / 2, height / 2, `bg_${this.sceneId}`)
            .setDisplaySize(width, height)
            .setDepth(0);

        this.tweens.add({
            targets: this.bg,
            scale: this.bg.scaleX * 1.008,
            duration: 8000,
            yoyo: true,
            loop: -1,
            ease: 'Sine.easeInOut'
        });

        // ═══ 2. OVERLAY CRT ═══
        const scanlines = this.add.graphics().setDepth(90).setAlpha(0.5);
        scanlines.fillStyle(0x000000, 0.08);
        for (let y = 0; y < height; y += 4) {
            scanlines.fillRect(0, y, width, 2);
        }

        // ═══ 3. NOMBRE + CAPÍTULO ═══
        const locationText = this.add.text(width / 2, 28, this.sceneDef.name, {
            fontFamily: '"Press Start 2P"',
            fontSize: '9px',
            fill: '#00ff41',
            stroke: '#003311',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(80).setAlpha(0);

        const chapterText = this.add.text(width / 2, 46, this.sceneDef.chapter || '', {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#88aaff',
        }).setOrigin(0.5).setDepth(80).setAlpha(0);

        this.tweens.add({
            targets: [locationText, chapterText],
            alpha: 1,
            duration: 700,
            ease: 'Power2.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: [locationText, chapterText],
                    alpha: 0,
                    duration: 900,
                    delay: 3200
                });
            }
        });

        // ═══ 4. TEXTO AMBIENTAL + OBJETIVO ═══
        if (this.sceneDef.ambientText) {
            const ambient = this.add.text(width / 2, height - 20, this.sceneDef.ambientText, {
                fontFamily: 'VT323',
                fontSize: '16px',
                fill: '#888888',
                fontStyle: 'italic'
            }).setOrigin(0.5).setDepth(80).setAlpha(0);

            this.tweens.add({
                targets: ambient,
                alpha: 0.7,
                duration: 1200,
                delay: 1500,
                onComplete: () => {
                    this.tweens.add({
                        targets: ambient,
                        alpha: 0,
                        delay: 5000,
                        duration: 800
                    });
                }
            });
        }

        if (this.sceneDef.objective) {
            this.objectiveHint = this.add.text(width / 2, 68, `OBJETIVO: ${this.sceneDef.objective}`, {
                fontFamily: 'VT323',
                fontSize: '18px',
                fill: '#ccffcc',
                backgroundColor: '#001a00bb',
                padding: { x: 6, y: 3 },
                wordWrap: { width: 760 }
            }).setOrigin(0.5).setDepth(80).setAlpha(0);

            this.tweens.add({
                targets: this.objectiveHint,
                alpha: 0.95,
                duration: 500,
                delay: 300
            });
        }

        // ═══ 5. HOTSPOTS ═══
        this.hotspotGraphics = [];
        (this.sceneDef.hotspots || []).forEach((hs) => this.createHotspot(hs));
        this._setupSceneBuilderShortcut();

        // ═══ 6. FADE IN ═══
        this.cameras.main.fadeIn(600, 0, 0, 0);

        // ═══ 7. HUD ═══
        if (!this.scene.isActive(SCENE_KEYS.GAME_HUD)) {
            this.scene.launch(SCENE_KEYS.GAME_HUD);
        }
        this.game.events.emit('update-story');

        // ═══ 8. EVENTOS DE RETORNO ═══
        this.events.off('open-door');
        this.events.off('mini-complete');
        this.events.off('dialog-closed');
        this.events.on('open-door', (targetSceneId) => {
            if (!targetSceneId || !this.allScenes[targetSceneId]) return;
            this.navigateTo(targetSceneId);
        });
        this.events.on('mini-complete', (payload) => this.handleMiniComplete(payload));
        this.events.on('dialog-closed', (payload) => this.handleDialogClosed(payload));
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this._cleanupSceneBuilderShortcut());
    }

    createHotspot(hs) {
        const zone = this.add.zone(hs.x, hs.y, hs.width, hs.height)
            .setInteractive({ useHandCursor: true })
            .setDepth(50);

        const indicator = this.add.graphics().setDepth(49);
        const color = {
            door: 0x00ff41,
            dialog: 0x00ccff,
            crossword: 0xffcc00,
            quiz: 0xff8800,
            radio: 0xbb88ff,
            sceneBuilder: 0x66ff88
        }[hs.type] || 0xffffff;

        indicator.lineStyle(1, color, 0.3);
        indicator.strokeRect(hs.x - hs.width / 2, hs.y - hs.height / 2, hs.width, hs.height);

        const icon = {
            door: '🚪',
            dialog: '💬',
            crossword: '📰',
            quiz: '📝',
            radio: '🛰',
            sceneBuilder: '💾'
        }[hs.type] || '❓';

        const iconText = this.add.text(hs.x, hs.y - hs.height / 2 - 12, icon, {
            fontSize: '16px'
        }).setOrigin(0.5).setDepth(51).setAlpha(0.5);

        const label = this.add.text(hs.x, hs.y + hs.height / 2 + 10, hs.label || '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '7px',
            fill: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(51).setAlpha(0);

        this.tweens.add({
            targets: iconText,
            alpha: 0.9,
            duration: 1200,
            yoyo: true,
            loop: -1,
            ease: 'Sine.easeInOut'
        });

        zone.on('pointerover', () => {
            label.setAlpha(1);
            indicator.clear();
            indicator.lineStyle(2, color, 0.7);
            indicator.strokeRect(hs.x - hs.width / 2, hs.y - hs.height / 2, hs.width, hs.height);
        });

        zone.on('pointerout', () => {
            label.setAlpha(0);
            indicator.clear();
            indicator.lineStyle(1, color, 0.3);
            indicator.strokeRect(hs.x - hs.width / 2, hs.y - hs.height / 2, hs.width, hs.height);
        });

        zone.on('pointerdown', () => {
            this.registerHotspotStory(hs);

            switch (hs.type) {
                case 'door':
                    this.navigateTo(hs.target, {
                        advanceDay: hs.advanceDay,
                        travelLabel: hs.label
                    });
                    break;
                case 'dialog':
                    this.openDialog(hs);
                    break;
                case 'crossword':
                    this.openCrossword();
                    break;
                case 'quiz':
                    this.openQuiz();
                    break;
                case 'radio':
                    this.openSignalLocator(hs);
                    break;
                case 'sceneBuilder':
                    this.openSceneBuilder(hs);
                    break;
            }
        });

        this.hotspotGraphics.push({ indicator, iconText, label, zone });
    }

    navigateTo(targetSceneId, options = {}) {
        const daySteps = Math.max(0, Number(options.advanceDay) || 0);
        if (daySteps > 0) {
            playerProgressStore.advanceDay(daySteps);
            this.game.events.emit('update-story');
        }

        if (options.travelLabel) {
            playerProgressStore.addJournal(
                `Te desplazas hacia: ${options.travelLabel}.`,
                `travel:${this.sceneId}:${targetSceneId}`
            );
            this.game.events.emit('update-story');
        }

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.restart({ sceneId: targetSceneId });
        });
    }

    openDialog(hs) {
        this.scene.pause();
        this.scene.launch(SCENE_KEYS.DIALOG, {
            npcName: hs.npc.name,
            displayName: hs.npc.displayName || hs.npc.name,
            personality: hs.npc.personality,
            returnScene: SCENE_KEYS.SCENE_ENGINE
        });
    }

    openCrossword() {
        this.scene.pause();
        this.scene.launch(SCENE_KEYS.CROSSWORD, {
            returnScene: SCENE_KEYS.SCENE_ENGINE
        });
    }

    openQuiz() {
        this.scene.pause();
        this.scene.launch(SCENE_KEYS.QUIZ, {
            returnScene: SCENE_KEYS.SCENE_ENGINE
        });
    }

    openSignalLocator(hs) {
        const options = hs.signalLocator || {};
        this.scene.pause();
        this.scene.launch(SCENE_KEYS.SIGNAL_LOCATOR, {
            returnScene: SCENE_KEYS.SCENE_ENGINE,
            stationName: options.station || hs.label || 'Kiezfunk 88.4',
            requiredCaptures: options.requiredCaptures,
            tolerance: options.tolerance,
            theme: options.theme || this.sceneDef.id
        });
    }

    openSceneBuilder(hs = {}) {
        interactWithPC(this, { source: 'pc', label: hs.label || 'Ordenador antiguo' });
        this.showStoryToast('PC retro activado');
    }

    _setupSceneBuilderShortcut() {
        this._cleanupSceneBuilderShortcut();

        this.sceneBuilderHotspot = (this.sceneDef.hotspots || []).find((hs) => hs.type === 'sceneBuilder') || null;
        if (!this.sceneBuilderHotspot || !this.input?.keyboard) return;

        const { width, height } = this.cameras.main;
        const hintLabel = this.sceneBuilderHotspot.label || 'Encender el ordenador antiguo';
        const hintWidth = 292;
        const hintX = width - 170;
        const hintY = height - 42;

        this.sceneBuilderHintBg = this.add.rectangle(hintX, hintY, hintWidth, 42, 0x001100, 0.82)
            .setStrokeStyle(1, 0x66ff88, 0.75)
            .setDepth(84)
            .setInteractive({ useHandCursor: true });

        this.sceneBuilderHintText = this.add.text(hintX, hintY, `[ ENTER ] ${hintLabel}`, {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#66ff88'
        }).setOrigin(0.5).setDepth(85);

        this.sceneBuilderHintBg.on('pointerdown', () => this.openSceneBuilder(this.sceneBuilderHotspot));

        this._sceneBuilderEnterHandler = () => this.openSceneBuilder(this.sceneBuilderHotspot);
        this.input.keyboard.on('keydown-ENTER', this._sceneBuilderEnterHandler);
    }

    _cleanupSceneBuilderShortcut() {
        if (this._sceneBuilderEnterHandler && this.input?.keyboard) {
            this.input.keyboard.off('keydown-ENTER', this._sceneBuilderEnterHandler);
            this._sceneBuilderEnterHandler = null;
        }

        this.sceneBuilderHintBg?.destroy();
        this.sceneBuilderHintBg = null;
        this.sceneBuilderHintText?.destroy();
        this.sceneBuilderHintText = null;
        this.sceneBuilderHotspot = null;
    }

    registerHotspotStory(hs) {
        const story = hs.story || {};
        let updated = false;

        if (story.objective) {
            updated = playerProgressStore.setObjective(story.objective) || updated;
        }

        if (story.chapter) {
            updated = playerProgressStore.setChapter(story.chapter) || updated;
        }

        if (story.advanceDay) {
            playerProgressStore.advanceDay(story.advanceDay);
            updated = true;
        }

        if (story.journal) {
            const flag = story.flag || `story:${this.sceneId}:${hs.id}`;
            const added = playerProgressStore.addJournal(story.journal, flag);
            if (added) {
                this.showStoryToast('Diario actualizado');
                updated = true;
            }
        }

        if (updated) this.game.events.emit('update-story');
    }

    handleDialogClosed(payload = {}) {
        if (!payload?.npcName) return;
        if (payload.evaluation !== 'correct') return;

        const added = playerProgressStore.addJournal(
            `Conversación productiva con ${payload.displayName || payload.npcName}.`,
            `dialog:ok:${payload.npcName}`
        );

        if (added) this.game.events.emit('update-story');
    }

    handleMiniComplete(payload = {}) {
        if (!payload?.type) return;

        let journal = null;
        let flag = null;

        if (payload.type === 'crossword' && payload.completed) {
            journal = 'Resuelves un crucigrama de contexto real. El vocabulario ya se queda.';
            flag = `mini:crossword:${this.sceneId}`;
        } else if (payload.type === 'quiz' && payload.completed) {
            journal = `Superas el test (${payload.score || 0}/${payload.total || 0}).`;
            flag = `mini:quiz:${this.sceneId}`;
        } else if (payload.type === 'radio' && payload.completed) {
            journal = `Interceptas señales de ${payload.station || 'radio local'} y recuperas pistas lingüísticas.`;
            flag = `mini:radio:${this.sceneId}:${payload.station || 'station'}`;
        }

        if (!journal) return;

        const added = playerProgressStore.addJournal(journal, flag);
        if (added) {
            this.showStoryToast('Nuevo apunte en el diario');
            this.game.events.emit('update-story');
        }
    }

    showStoryToast(text) {
        const { width } = this.cameras.main;
        const toast = this.add.text(width / 2, 56, text, {
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            fill: '#aaffaa',
            backgroundColor: '#001100cc',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5).setDepth(85).setAlpha(0);

        this.tweens.add({
            targets: toast,
            alpha: 1,
            duration: 180,
            yoyo: true,
            hold: 1200,
            onComplete: () => toast.destroy()
        });
    }
}
