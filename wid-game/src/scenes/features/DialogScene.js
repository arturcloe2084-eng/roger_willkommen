import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { askNpcDialogue } from '../../services/ai/NpcDialogueService.js';
import { voiceService } from '../../services/audio/VoiceService.js';
import { narratorService } from '../../services/NarratorService.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';
import { i18n } from '../../services/i18n.js';

/**
 * DialogScene — Diálogo con NPC vía IA (Gemini).
 * Ahora funciona con cualquier NPC definido en scenes.json.
 * Incluye: narración, subtítulos, interacción mejorada, opciones de diálogo
 * Solo necesita: npcName, displayName, personality, returnScene
 */
export class DialogScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.DIALOG);
    }

    init(data) {
        this.npcData = data;
        this.returnScene = data.returnScene || SCENE_KEYS.SCENE_ENGINE;
        this.lastResponse = null;
    }

    create() {
        const { width, height } = this.cameras.main;

        // Overlay oscuro
        this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

        // ═══ PERSONAJE VISUAL (representación simple) ═══
        this.createCharacterVisual(width, height);

        // Caja de diálogo principal
        const dialogBox = this.add.rectangle(width / 2, height / 2 - 30, 700, 350, 0x0a0a2a, 0.95);
        dialogBox.setStrokeStyle(4, 0x00ff41);

        this.titleText = this.add.text(width / 2, height / 2 - 180, `💬 ${this.npcData.displayName}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            fill: '#00ff41',
            wordWrap: { width: 640 }
        }).setOrigin(0.5);

        this.historyText = this.add.text(width / 2 - 320, height / 2 - 130, i18n.t('dialog_connecting'), {
            fontFamily: 'VT323',
            fontSize: '24px',
            fill: '#ffffff',
            wordWrap: { width: 640 }
        });

        this.historyTextT1 = this.add.text(width / 2 - 320, height / 2 - 90, '', {
            fontFamily: 'VT323',
            fontSize: '16px',
            fill: '#aaaaaa',
            wordWrap: { width: 620 }
        });

        this.historyTextT2 = this.add.text(width / 2 - 320, height / 2 - 70, '', {
            fontFamily: 'VT323',
            fontSize: '12px',
            fill: '#888888',
            wordWrap: { width: 620 }
        });

        // ═══ CAJA DE SUBTÍTULOS EN TIEMPO REAL ═══
        this.subtitleBox = this.add.rectangle(width / 2, height - 80, width - 40, 60, 0x0a0a2a, 0.9);
        this.subtitleBox.setStrokeStyle(2, 0x00ffff);
        this.subtitleBox.setAlpha(0);

        this.subtitleText = this.add.text(width / 2, height - 80, '', {
            fontFamily: 'VT323',
            fontSize: '14px',
            fill: '#00ffff',
            wordWrap: { width: width - 80 },
            align: 'center'
        }).setOrigin(0.5).setAlpha(0);

        // Input del usuario
        this.inputText = this.add.text(width / 2 - 320, height / 2 + 80, `> ${i18n.t('dialog_input_hint')}`, {
            fontFamily: 'VT323',
            fontSize: '24px',
            fill: '#00ffff'
        });

        // --- BOTÓN DE MICRÓFONO ---
        this.micButton = this.add.container(width / 2 + 280, height / 2 + 100);
        const micBg = this.add.circle(0, 0, 30, 0x00ff41, 0.2);
        micBg.setStrokeStyle(2, 0x00ff41);
        const micIcon = this.add.text(0, 0, '🎤', { fontSize: '32px' }).setOrigin(0.5);
        this.micButton.add([micBg, micIcon]);
        this.micButton.setInteractive(new Phaser.Geom.Circle(0, 0, 30), Phaser.Geom.Circle.Contains);

        this.micButton.on('pointerdown', () => this.startVoiceInput());
        this.micButton.on('pointerover', () => micBg.setFillStyle(0x00ff41, 0.5));
        this.micButton.on('pointerout', () => micBg.setFillStyle(0x00ff41, 0.2));

        // --- Nivel del jugador visible ---
        this.add.text(width / 2 + 280, height / 2 - 180, `LVL ${playerProgressStore.level}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            fill: '#888888'
        }).setOrigin(0.5);

        // --- Palabras aprendidas (recordatorio) ---
        const recentWords = playerProgressStore.learnedWords.slice(-3).map(w => w.word).join(', ');
        if (recentWords) {
            this.add.text(width / 2 - 320, height / 2 + 120, `📖 Últimas palabras: ${recentWords}`, {
                fontFamily: 'VT323',
                fontSize: '16px',
                fill: '#555555'
            });
        }

        this.userInput = '';

        // Listener de teclado
        this.input.keyboard.on('keydown', (event) => {
            if (event.keyCode === 27) { // ESC
                this.closeDialog();
                return;
            }
            if (event.keyCode === 8 && this.userInput.length > 0) {
                this.userInput = this.userInput.slice(0, -1);
            } else if (event.keyCode === 13 && this.userInput.length > 0) {
                this.sendMessage();
            } else if (event.key.length === 1 && this.userInput.length < 80) {
                this.userInput += event.key;
            }
            this.inputText.setText(`> ${this.userInput}_`);
        });

        this.updateHistory(`${this.npcData.displayName}: "Hello!"`);
        voiceService.speak("Hello");
    }

    /**
     * Crea una representación visual simple del personaje
     */
    createCharacterVisual(width, height) {
        const charX = 150;
        const charY = height / 2 - 50;

        // Cabeza simple
        this.add.circle(charX, charY - 30, 25, 0x88ccff, 0.7)
            .setStrokeStyle(2, 0x00ff41);

        // Cuerpo simple
        this.add.rectangle(charX, charY + 20, 40, 50, 0x00aa88, 0.6)
            .setStrokeStyle(2, 0x00ff41);

        // Nombre del personaje
        this.add.text(charX, charY + 70, this.npcData.displayName, {
            fontFamily: 'VT323',
            fontSize: '12px',
            fill: '#00ffff',
            align: 'center'
        }).setOrigin(0.5);
    }

    startVoiceInput() {
        this.inputText.setText('> ESCUCHANDO... (Habla ahora)');
        this.micButton.setAlpha(0.5);
        this.tweens.add({
            targets: this.micButton,
            scale: 1.2,
            duration: 200,
            yoyo: true,
            repeat: -1
        });

        voiceService.startListening(
            (text) => {
                this.userInput = text;
                this.inputText.setText(`> ${this.userInput}`);
                this.tweens.killTweensOf(this.micButton);
                this.micButton.setScale(1).setAlpha(1);
                this.sendMessage();
            },
            (error) => {
                console.error('Error Mic:', error);
                this.inputText.setText(`> ERROR MIC: ${error}. Escribe manual.`);
                this.tweens.killTweensOf(this.micButton);
                this.micButton.setScale(1).setAlpha(1);
            }
        );
    }

    updateHistory(text, t1 = '', t2 = '') {
        this.historyText.setText(text);
        this.historyTextT1.setText(t1);
        this.historyTextT2.setText(t2);

        // Dynamic positioning
        const bounds = this.historyText.getBounds();
        this.historyTextT1.setY(bounds.bottom + 10);
        const bounds1 = this.historyTextT1.getBounds();
        this.historyTextT2.setY(bounds1.bottom + 5);
    }

    async sendMessage() {
        const message = this.userInput;
        this.userInput = '';
        this.inputText.setText('> ...PROCESANDO...');
        this.updateHistory(`Tú: "${message}"\n\nEsperando respuesta...`);

        const storyContext = `Contexto narrativo actual: Día ${playerProgressStore.story.day}, Capítulo "${playerProgressStore.story.chapter}", Objetivo "${playerProgressStore.story.activeObjective}".`;
        const response = await askNpcDialogue(`${this.npcData.personality}\n${storyContext}`, message, {
            targetLanguage: playerProgressStore.targetLanguage,
            level: playerProgressStore.level
        });
        this.lastResponse = response;

        // Procesar resultado
        playerProgressStore.recordResult(response.evaluation);
        if (response.xp_reward) {
            playerProgressStore.addXP(response.xp_reward);
            this.game.events.emit('update-hud');
        }

        // ═══ REPRODUCIR NARRACIÓN CON SUBTÍTULOS ═══
        const narration = {
            text: response.npc_dialogue,
            duration: 3000,
            translations: {
                es: response.npc_dialogue_t1 || response.feedback_es,
                en: response.npc_dialogue_t2 || 'NPC response'
            }
        };

        // Mostrar subtítulos en tiempo real
        this.tweens.add({
            targets: this.subtitleBox,
            alpha: 0.9,
            duration: 200
        });

        narratorService.narrateInGerman(narration, (subtitle, lang) => {
            this.subtitleText.setText(subtitle);
            const colors = { de: '#ffffff', es: '#ffcc00', en: '#00ffff' };
            this.subtitleText.setFill(colors[lang] || '#ffffff');
            this.tweens.add({
                targets: this.subtitleText,
                alpha: 1,
                duration: 100
            });
        }, () => {
            // Cuando termina la narración, ocultar subtítulos
            this.tweens.add({
                targets: [this.subtitleBox, this.subtitleText],
                alpha: 0,
                duration: 300,
                delay: 500
            });
        });

        // Leer respuesta en voz alta también
        voiceService.speak(response.npc_dialogue);

        // Mostrar respuesta con traducciones
        const fullText = `${this.npcData.displayName}: "${response.npc_dialogue}"`;
        const t1 = response.npc_dialogue_t1 || '';
        const t2 = response.npc_dialogue_t2 || '';

        this.updateHistory(fullText, t1, t2);
        this.inputText.setText('> _');

        // Mostrar evaluación y feedback
        if (this._feedbackText) this._feedbackText.destroy();
        const { width, height } = this.cameras.main;
        this._feedbackText = this.add.text(width / 2 - 320, height / 2 + 30,
            `[${response.evaluation.toUpperCase()}] ${response.feedback_es}`, {
            fontFamily: 'VT323', fontSize: '14px', fill: '#00ff41'
        });

        // Si hay acción de juego (abrir puerta, etc.)
        if (response.game_action === 'open_door') {
            const engine = this.scene.get(this.returnScene);
            if (engine && engine.events) {
                engine.events.emit('open-door', this.npcData.npcName);
            }

            this.time.delayedCall(2000, () => {
                this.closeDialog();
            });
        }
    }

    closeDialog() {
        const engine = this.scene.get(this.returnScene);
        if (engine && engine.events) {
            engine.events.emit('dialog-closed', {
                npcName: this.npcData?.npcName || this.npcData?.name || this.npcData?.displayName,
                displayName: this.npcData?.displayName,
                evaluation: this.lastResponse?.evaluation || null,
                gameAction: this.lastResponse?.game_action || null,
            });
        }

        this.scene.stop();
        this.scene.resume(this.returnScene);
    }
}
