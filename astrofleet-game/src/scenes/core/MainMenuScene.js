import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';

/**
 * MainMenuScene — Menú principal con la imagen de fondo y selección de idioma.
 * Al iniciar, pasa al SceneEngine con la escena definida en scenes.json.startScene.
 */
export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.MAIN_MENU);
    }

    create() {
        const { width, height } = this.cameras.main;
        const scenesData = this.cache.json.get('scenesData');
        const startScene = scenesData?.startScene || 'apartamento';
        const menuBgKey = this.textures.exists(`bg_${startScene}`)
            ? `bg_${startScene}`
            : (this.textures.exists('roger_hangar') ? 'roger_hangar' : 'full_scene');

        // ═══ FONDO ═══
        this.add.image(width / 2, height / 2, menuBgKey)
            .setDisplaySize(width, height)
            .setDepth(0);

        // Overlay oscuro
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5).setDepth(1);

        // Scanlines CRT
        const scanlines = this.add.graphics().setDepth(2);
        scanlines.fillStyle(0x000000, 0.1);
        for (let y = 0; y < height; y += 4) {
            scanlines.fillRect(0, y, width, 2);
        }

        // ═══ TÍTULO ═══
        this.add.text(width / 2, 50, 'WILLKOMMEN', {
            fontFamily: '"Press Start 2P"',
            fontSize: '40px',
            fill: '#00ff41',
            stroke: '#003311',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(5);

        this.add.text(width / 2, 100, 'IN DEUTSCHLAND', {
            fontFamily: '"Press Start 2P"',
            fontSize: '22px',
            fill: '#00ccff',
            stroke: '#002244',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(5);

        this.add.text(width / 2, 140, 'Aprende alemán viviendo para contarlo', {
            fontFamily: 'VT323',
            fontSize: '20px',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(5);

        this.add.text(width / 2, 165, '30 días · trámites reales · vecinos reales · misterio humano', {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#6e8f6e'
        }).setOrigin(0.5).setDepth(5);

        // ═══ SELECTOR DE IDIOMA ═══
        this.add.text(width / 2, 200, 'IDIOMA BASE:', {
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            fill: '#666666'
        }).setOrigin(0.5).setDepth(5);

        const langs = ['German', 'English', 'Spanish'];
        this.langButtons = [];

        langs.forEach((lang, i) => {
            const isSelected = playerProgressStore.targetLanguage === lang;
            const bx = width / 2 - 160 + (i * 165);
            const by = 240;

            const btnBg = this.add.rectangle(bx, by, 140, 40, isSelected ? 0x002200 : 0x111111).setDepth(5);
            btnBg.setStrokeStyle(2, isSelected ? 0x00ff41 : 0x333333);

            const btn = this.add.text(bx, by, lang.toUpperCase(), {
                fontFamily: '"Press Start 2P"',
                fontSize: '10px',
                fill: isSelected ? '#00ff41' : '#555555',
            }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });

            btn.on('pointerdown', () => {
                playerProgressStore.targetLanguage = lang;
                this._updateLangButtons();
            });

            this.langButtons.push({ text: btn, bg: btnBg, lang });
        });

        // ═══ ESTADÍSTICAS (si hay datos anteriores) ═══
        if (playerProgressStore.learnedWords.length > 0) {
            this.add.text(width / 2, 300, `📖 ${playerProgressStore.learnedWords.length} palabras aprendidas  |  Nivel ${playerProgressStore.level}`, {
                fontFamily: 'VT323',
                fontSize: '20px',
                fill: '#ffcc00'
            }).setOrigin(0.5).setDepth(5);
        }

        // ═══ INICIAR ═══
        const startText = this.add.text(width / 2, 370, '[ SPACE / ENTER ] — EMPEZAR', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(5);

        this.tweens.add({
            targets: startText,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            loop: -1
        });

        // ═══ LORE ═══
        this.add.text(width / 2, height - 25, '"Tienes 30 días, un apartamento vacío y cero alemán. Viel Glück."', {
            fontFamily: 'VT323',
            fontSize: '16px',
            fill: '#445544',
            fontStyle: 'italic'
        }).setOrigin(0.5).setDepth(5);

        this.add.text(width - 10, height - 10, 'v0.4.0', {
            fontFamily: 'VT323',
            fontSize: '14px',
            fill: '#333333'
        }).setOrigin(1, 1).setDepth(5);

        // ═══ INPUT ═══
        this.input.keyboard.on('keydown-SPACE', () => this._startGame());
        this.input.keyboard.on('keydown-ENTER', () => this._startGame());
    }

    _startGame() {
        const scenesData = this.cache.json.get('scenesData');
        const startScene = scenesData.startScene || 'apartamento';

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(SCENE_KEYS.SCENE_ENGINE, { sceneId: startScene });
        });
    }

    _updateLangButtons() {
        this.langButtons.forEach(b => {
            const isSelected = playerProgressStore.targetLanguage === b.lang;
            b.text.setFill(isSelected ? '#00ff41' : '#555555');
            b.bg.setStrokeStyle(2, isSelected ? 0x00ff41 : 0x333333);
            b.bg.setFillStyle(isSelected ? 0x002200 : 0x111111);
        });
    }
}
