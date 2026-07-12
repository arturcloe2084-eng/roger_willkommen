/**
 * PreparationScene — Menú de preparación para el desafío.
 * Enlaza a: DictionaryScene, QuizScene, DialogScene, CrosswordScene.
 *
 * Especificación: PRODUCT_BRIEF.md §2.3, PROMPT_RECONSTRUIR_GUI.md §3
 */
import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';

const C = Object.freeze({
    bg: 0x0c1020,
    panel: 0x111828,
    panelStroke: 0x4a6080,
    accent: 0xffd64f,
    textTitle: '#f7f0d1',
    textSub: '#c8d0de',
    textDim: '#7a8494',
});

const PREP_ITEMS = [
    {
        id: 'vocabulary',
        label: '📖 VOCABULARIO DEL BÜRGERAMT',
        desc: 'Términos clave del Anmeldung: Postleitzahl, Geburtsort, Familienname…',
        color: 0x1a5030, stroke: 0x44cc66,
        action: (scene) => scene.scene.start(SCENE_KEYS.DICTIONARY),
    },
    {
        id: 'quiz',
        label: '📝 QUIZ DEL FORMULARIO',
        desc: '¿Podrías rellenar el Meldeschein de memoria? Pon a prueba tus datos.',
        color: 0x3a2510, stroke: 0xff8844,
        action: (scene) => scene.scene.start(SCENE_KEYS.QUIZ, { returnScene: SCENE_KEYS.PREPARATION }),
    },
    {
        id: 'dialog',
        label: '💬 PRÁCTICA CON MARCUS',
        desc: 'Diálogo simulado con el asesor de Krankenkasse. Sin presión, aprende las frases.',
        color: 0x1a3050, stroke: 0x44aadd,
        action: (scene) => scene.scene.launch(SCENE_KEYS.DIALOG, {
            npcName: 'marcus',
            displayName: 'Marcus (Krankenkasse)',
            personality: 'amable, paciente, explica el sistema alemán',
            returnScene: SCENE_KEYS.PREPARATION,
        }),
    },
    {
        id: 'crossword',
        label: '📰 CRUCIGRAMA BURÓCRATA',
        desc: 'Resuelve vocabulario de la oficina pública con un crucigrama contextual.',
        color: 0x303020, stroke: 0xccaa44,
        action: (scene) => scene.scene.start(SCENE_KEYS.CROSSWORD, { returnScene: SCENE_KEYS.PREPARATION }),
    },
];

export class PreparationScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.PREPARATION);
    }

    create() {
        const { width, height } = this.cameras.main;
        this.cameras.main.setBackgroundColor(C.bg);

        // ─── Fondo decorativo ─────────────────────────────────────────
        const bgDecor = this.add.graphics().setDepth(0);
        bgDecor.fillStyle(0x0a0e18, 1);
        bgDecor.fillRect(0, 0, width, height);

        // ─── Título ───────────────────────────────────────────────────
        this.add.text(width / 2, 22, '📋 PREPARACIÓN', {
            fontFamily: '"Press Start 2P"', fontSize: '12px', color: C.textTitle,
        }).setOrigin(0.5).setDepth(10);

        this.add.text(width / 2, 46, 'Practica antes de entrar al Bürgeramt', {
            fontFamily: 'VT323', fontSize: '20px', color: C.textDim,
        }).setOrigin(0.5).setDepth(10);

        // ─── Tarjetas de preparación ──────────────────────────────────
        PREP_ITEMS.forEach((item, i) => {
            const cy = 70 + i * 90;
            const cx = 40;
            const cw = width - 80;
            const ch = 78;

            const card = this.add.graphics().setDepth(5);
            card.fillStyle(item.color, 0.85);
            card.fillRoundedRect(cx, cy, cw, ch, 10);
            card.lineStyle(2, item.stroke, 0.7);
            card.strokeRoundedRect(cx, cy, cw, ch, 10);

            // Acento izquierdo
            card.fillStyle(item.stroke, 0.8);
            card.fillRect(cx + 6, cy + 10, 4, ch - 20);

            this.add.text(cx + 22, cy + 12, item.label, {
                fontFamily: 'VT323', fontSize: '22px', color: '#ffffff',
            }).setDepth(6);

            this.add.text(cx + 22, cy + 40, item.desc, {
                fontFamily: 'VT323', fontSize: '16px', color: C.textSub,
                wordWrap: { width: cw - 140 },
            }).setDepth(6);

            // Botón "IR" a la derecha
            const btnX = cx + cw - 80, btnY = cy + ch / 2 - 14, btnW = 64, btnH = 28;
            const btnG = this.add.graphics().setDepth(7);
            btnG.fillStyle(item.color, 1);
            btnG.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
            btnG.lineStyle(2, item.stroke, 1);
            btnG.strokeRoundedRect(btnX, btnY, btnW, btnH, 6);

            const btnZone = this.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
                .setInteractive({ useHandCursor: true }).setDepth(8);

            const btnLabel = this.add.text(btnX + btnW / 2, btnY + btnH / 2, 'IR ▸', {
                fontFamily: 'VT323', fontSize: '18px', color: '#ffffff',
            }).setOrigin(0.5).setDepth(9);

            btnZone.on('pointerover', () => {
                btnLabel.setColor('#ffffcc');
                card.clear();
                card.fillStyle(item.color, 1);
                card.fillRoundedRect(cx, cy, cw, ch, 10);
                card.lineStyle(2, item.stroke, 1);
                card.strokeRoundedRect(cx, cy, cw, ch, 10);
            });

            btnZone.on('pointerout', () => {
                btnLabel.setColor('#ffffff');
                card.clear();
                card.fillStyle(item.color, 0.85);
                card.fillRoundedRect(cx, cy, cw, ch, 10);
                card.lineStyle(2, item.stroke, 0.7);
                card.strokeRoundedRect(cx, cy, cw, ch, 10);
            });

            btnZone.on('pointerdown', () => item.action(this));
        });

        // ─── Botón volver ─────────────────────────────────────────────
        const btnX = width / 2 - 60, btnY = height - 42, btnW = 120, btnH = 32;
        const g = this.add.graphics().setDepth(5);
        g.fillStyle(0x1a1a28, 0.85);
        g.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
        g.lineStyle(2, 0xff6666, 0.8);
        g.strokeRoundedRect(btnX, btnY, btnW, btnH, 6);

        const zone = this.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
            .setInteractive({ useHandCursor: true }).setDepth(6);

        const label = this.add.text(btnX + btnW / 2, btnY + btnH / 2, '← VOLVER', {
            fontFamily: 'VT323', fontSize: '18px', color: '#ff6666',
        }).setOrigin(0.5).setDepth(7);

        zone.on('pointerover', () => label.setColor('#ff9999'));
        zone.on('pointerout', () => label.setColor('#ff6666'));
        zone.on('pointerdown', () => this.scene.start(SCENE_KEYS.CONTRACT_MENU));

        // ─── Fade in ──────────────────────────────────────────────────
        this.cameras.main.fadeIn(300, 0, 0, 0);
    }
}
