import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';
import { i18n } from '../../services/i18n.js';

export class GameHudScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.GAME_HUD);
    }

    create() {
        // Barra de XP
        this.add.rectangle(10, 10, 200, 20, 0x333333).setOrigin(0);
        this.xpBar = this.add.rectangle(10, 10, 0, 20, 0x00ff41).setOrigin(0);

        this.levelText = this.add.text(220, 10, `${i18n.t('hud_lvl')}: ${playerProgressStore.level}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            fill: '#00ffff'
        });

        this.xpText = this.add.text(10, 35, `XP: ${playerProgressStore.xp}/${playerProgressStore.xpToNextLevel}`, {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#ffffff'
        });

        this.wordsText = this.add.text(10, 60, `${i18n.t('hud_words')}: ${playerProgressStore.learnedWords.length}`, {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#ffaa00'
        });

        this.dayText = this.add.text(10, 84, `${i18n.t('hud_day')}: ${playerProgressStore.story.day}/30`, {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#88ddff'
        });

        this.chapterText = this.add.text(10, 106, `${playerProgressStore.story.chapter}`, {
            fontFamily: 'VT323',
            fontSize: '16px',
            fill: '#88aaff'
        });

        this.objectiveText = this.add.text(300, 10, `OBJ: ${playerProgressStore.story.activeObjective}`, {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#ccffcc',
            wordWrap: { width: 350 }
        }).setAlpha(0.9);

        // --- BOTÓN VOLVER AL MENÚ ---
        const { width: w } = this.cameras.main;
        this.menuButton = this.add.container(w - 70, 30);

        const btnBg = this.add.rectangle(0, 0, 100, 30, 0x1a0a0a, 0.8);
        btnBg.setStrokeStyle(2, 0xff6666);

        const btnText = this.add.text(0, 0, `🏠 ${i18n.t('menu_back')}`, {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#ff6666'
        }).setOrigin(0.5);

        this.menuButton.add([btnBg, btnText]);
        btnBg.setInteractive({ useHandCursor: true });

        btnBg.on('pointerover', () => {
            btnBg.setFillStyle(0x3d1010, 1);
            btnBg.setStrokeStyle(2, 0xff9999);
            btnText.setFillStyle('#ff9999');
        });

        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(0x1a0a0a, 0.8);
            btnBg.setStrokeStyle(2, 0xff6666);
            btnText.setFillStyle('#ff6666');
        });

        btnBg.on('pointerdown', () => this.returnToMenu());

        // Eventos para actualizar gradualmente
        this.game.events.on('update-hud', () => this.updateHUD());
        this.game.events.on('update-story', () => this.updateHUD());
        this.updateHUD();
    }

    updateHUD() {
        const percent = playerProgressStore.xpPercent;
        this.xpBar.width = (200 * percent) / 100;

        this.levelText.setText(`${i18n.t('hud_lvl')}: ${playerProgressStore.level}`);
        this.xpText.setText(`XP: ${playerProgressStore.xp}/${playerProgressStore.xpToNextLevel}`);
        this.wordsText.setText(`${i18n.t('hud_words')}: ${playerProgressStore.learnedWords.length}`);
        this.dayText.setText(`${i18n.t('hud_day')}: ${playerProgressStore.story.day}/30`);
        this.chapterText.setText(`${playerProgressStore.story.chapter}`);
        this.objectiveText.setText(`OBJ: ${playerProgressStore.story.activeObjective}`);
    }

    returnToMenu() {
        // Detener todas las posibles escenas de juego activas
        [
            SCENE_KEYS.SCENE_ENGINE,
            SCENE_KEYS.GAME_HUD,
            SCENE_KEYS.DIALOG,
            SCENE_KEYS.CROSSWORD,
            SCENE_KEYS.QUIZ,
            SCENE_KEYS.SIGNAL_LOCATOR,
            SCENE_KEYS.DICTIONARY
        ].forEach(key => {
            if (this.scene.isActive(key) || this.scene.isPaused(key) || this.scene.isSleeping(key)) {
                this.scene.stop(key);
            }
        });

        // Volver al menú principal
        this.scene.start(SCENE_KEYS.MAIN_MENU);
    }
}
