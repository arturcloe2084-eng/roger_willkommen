/**
 * PreparationScene — Menú de preparación con shell NEUROVITA.
 * Enlaza a: DictionaryScene, QuizScene, DialogScene, CrosswordScene.
 * DictionaryScene conserva su diseño propio (no usa FundaShell).
 */
import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { FundaShell, THEME } from '../../ui/FundaShell.js';

const PREP_ITEMS = [
    {
        id: 'vocabulary',
        num: '01',
        title: 'VOCABULARIO BÜRGERAMT',
        desc: 'Postleitzahl, Geburtsort, Familienname…',
        action: (scene) => scene.scene.start(SCENE_KEYS.DICTIONARY),
    },
    {
        id: 'quiz',
        num: '02',
        title: 'QUIZ DEL FORMULARIO',
        desc: '¿Podrías rellenar el Meldeschein de memoria?',
        action: (scene) => scene.scene.start(SCENE_KEYS.QUIZ, { returnScene: SCENE_KEYS.PREPARATION }),
    },
    {
        id: 'dialog',
        num: '03',
        title: 'PRÁCTICA CON MARCUS',
        desc: 'Diálogo con el asesor de Krankenkasse.',
        action: (scene) => scene.scene.launch(SCENE_KEYS.DIALOG, {
            npcName: 'marcus',
            displayName: 'Marcus (Krankenkasse)',
            personality: 'amable, paciente, explica el sistema alemán',
            returnScene: SCENE_KEYS.PREPARATION,
        }),
    },
    {
        id: 'crossword',
        num: '04',
        title: 'CRUCIGRAMA BURÓCRATA',
        desc: 'Vocabulario de la oficina pública.',
        action: (scene) => scene.scene.start(SCENE_KEYS.CROSSWORD, { returnScene: SCENE_KEYS.PREPARATION }),
    },
];

export class PreparationScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.PREPARATION);
    }

    create() {
        this.cameras.main.setBackgroundColor(THEME.bg);

        const shell = new FundaShell(this, { activeId: 'prep' });
        const area = shell.build('Vaclav');
        const compact = area.w < 680;

        const headerPanel = shell.createPanel(area.x + 4, area.y + 4, area.w - 8, compact ? 54 : 60, 'PREPARACIÓN');
        this.add.text(headerPanel.x, headerPanel.y,
            'Practica vocabulario, formulario y diálogo antes de entrar al Bürgeramt.', {
                fontFamily: THEME.fontBody,
                fontSize: compact ? '12px' : '16px',
                color: THEME.textDim,
                wordWrap: { width: headerPanel.w },
            }).setDepth(8);

        const cols = compact ? 1 : 2;
        const gap = compact ? 8 : 10;
        const cardW = compact ? area.w - 20 : (area.w - 30) / 2;
        const cardH = compact ? Math.max(70, (area.h - 78 - gap * 3) / 4) : (area.h - 100) / 2;

        PREP_ITEMS.forEach((item, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = area.x + 10 + col * (cardW + gap);
            const cy = area.y + (compact ? 68 : 80) + row * (cardH + gap);
            this._createPrepCard(shell, item, cx, cy, cardW, cardH, compact);
        });

        this.cameras.main.fadeIn(300, 5, 10, 15);
    }

    _createPrepCard(shell, item, x, y, w, h, compact = false) {
        const inner = shell.createPanel(x, y, w, h, item.title);

        this.add.text(inner.x, inner.y, item.desc, {
            fontFamily: THEME.fontBody,
            fontSize: compact ? '11px' : '16px',
            color: THEME.textDim,
            wordWrap: { width: inner.w },
            lineSpacing: compact ? 2 : 5,
        }).setDepth(8);

        this.add.text(x + w - 30, y + 20, item.num, {
            fontFamily: THEME.fontMono,
            fontSize: compact ? '14px' : '18px',
            color: THEME.textMuted,
        }).setDepth(8);

        // Botón IR (más grande)
        const btnW = compact ? 58 : 80;
        const btnH = compact ? 28 : 36;
        const btnX = x + w - btnW - 16;
        const btnY = y + h - btnH - 16;

        const g = this.add.graphics().setDepth(8);
        g.fillStyle(0x0a2840, 0.9);
        g.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
        g.lineStyle(1, THEME.cyan, 0.8);
        g.strokeRoundedRect(btnX, btnY, btnW, btnH, 6);

        const zone = this.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
            .setInteractive({ useHandCursor: true }).setDepth(9);

        const label = this.add.text(btnX + btnW / 2, btnY + btnH / 2, 'IR ▸', {
            fontFamily: THEME.fontTitle,
            fontSize: compact ? '10px' : '14px',
            color: THEME.textCyan,
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(10);

        zone.on('pointerover', () => {
            g.clear();
            g.fillStyle(0x0c3050, 1);
            g.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
            g.lineStyle(2, THEME.cyan, 1);
            g.strokeRoundedRect(btnX, btnY, btnW, btnH, 6);
            label.setColor(THEME.text);
        });

        zone.on('pointerout', () => {
            g.clear();
            g.fillStyle(0x0a2840, 0.9);
            g.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
            g.lineStyle(1, THEME.cyan, 0.8);
            g.strokeRoundedRect(btnX, btnY, btnW, btnH, 6);
            label.setColor(THEME.textCyan);
        });

        zone.on('pointerdown', () => item.action(this));

        // Toda la tarjeta también es clicable
        const cardZone = this.add.zone(x + w / 2, y + h / 2, w, h - 60)
            .setInteractive({ useHandCursor: true }).setDepth(7);
        cardZone.on('pointerdown', () => item.action(this));
    }
}
