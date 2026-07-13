/**
 * ContractMenuScene — Dashboard principal del Entrenador de Fundas.
 * Layout estilo NEUROVITA: sidebar + panel de contrato + widgets de estado.
 * Especificación: PRODUCT_BRIEF.md, PROMPT_RECONSTRUIR_GUI.md
 */
import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';
import { FundaShell, THEME } from '../../ui/FundaShell.js';

export class ContractMenuScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.CONTRACT_MENU);
    }

    init(data) {
        this.view = data?.view || 'contract';
    }

    create() {
        this.cameras.main.setBackgroundColor(THEME.bg);

        const shell = new FundaShell(this, {
            activeId: this.view === 'progress' ? 'progress' : 'contract',
        });
        const area = shell.build('Vaclav');

        if (this.view === 'progress') {
            this._buildProgressView(shell, area);
        } else {
            this._buildContractDashboard(shell, area);
        }

        this.cameras.main.fadeIn(400, 5, 10, 15);
    }

    _buildContractDashboard(shell, area) {
        const { x, y, w, h } = area;
        const cx = x + w / 2;
        const compact = w < 720;

        const contractW = compact ? w - 8 : Math.min(500, w - 40);
        const contractH = compact ? 108 : 120;
        const contractPanel = shell.createPanel(x + w / 2 - contractW / 2, y + (compact ? 8 : 20), contractW, contractH, 'PROGRAMA ACTIVO');
        this.add.text(contractPanel.x, contractPanel.y,
            'Anmeldung 2026 — Bürgeramt Berlin', {
                fontFamily: THEME.fontBody,
                fontSize: compact ? '15px' : '18px',
                color: THEME.text,
                wordWrap: { width: contractPanel.w },
            }).setDepth(8);

        this.add.text(contractPanel.x, contractPanel.y + 40, 'Nivel 1 / 3  •  Día 1/30', {
            fontFamily: THEME.fontMono,
            fontSize: compact ? '14px' : '16px',
            color: THEME.textDim,
        }).setDepth(8);

        this.add.text(contractPanel.x, contractPanel.y + 70, 'Estado: PENDIENTE', {
            fontFamily: THEME.fontMono,
            fontSize: compact ? '14px' : '16px',
            color: THEME.warning,
        }).setDepth(8);

        shell.drawProgressBar(contractPanel.x, contractPanel.y + 88, contractPanel.w, 10, 33);
        this.add.text(contractPanel.x + contractPanel.w - 4, contractPanel.y + 82, '33%', {
            fontFamily: THEME.fontMono,
            fontSize: compact ? '12px' : '14px',
            color: THEME.textCyan,
        }).setOrigin(1, 0).setDepth(8);

        const btnY = y + (compact ? 132 : h - 240);
        const gap = compact ? 8 : 10;
        const btnW = compact ? (w - 32) / 3 : 150;
        const btnH = compact ? 38 : 44;
        this._createActionButton(compact ? x + 16 + btnW / 2 : cx - 160, btnY, btnW, btnH, 'PREPARARME', () => {
            this.scene.start(SCENE_KEYS.PREPARATION);
        }, false, compact);
        this._createActionButton(compact ? x + 16 + btnW * 1.5 + gap : cx, btnY, btnW, btnH, 'MI FUNDA', () => {
            this.scene.start(SCENE_KEYS.PROFILE);
        }, false, compact);
        this._createActionButton(compact ? x + 16 + btnW * 2.5 + gap * 2 : cx + 160, btnY, btnW, btnH, '▶ DESAFÍO', () => {
            this.startChallenge();
        }, true, compact);

        const widgetY = compact ? btnY + btnH + 16 : y + h - 180;
        const widgetW = compact ? w - 8 : (w - 40) / 2;
        const widgetH = compact ? Math.max(98, (h - (widgetY - y) - 8) / 2) : 140;

        const w1 = shell.createPanel(compact ? x + 4 : x + 10, widgetY, compact ? widgetW : widgetW - 10, widgetH, 'TU PROGRESO');
        const langs = ['DE A2+', 'EN C1', 'ES nativo'];
        langs.forEach((lang, i) => {
            this.add.text(w1.x, w1.y + i * 24, lang, {
                fontFamily: THEME.fontMono,
                fontSize: compact ? '15px' : '18px',
                color: i === 0 ? THEME.textCyan : THEME.textDim,
            }).setDepth(8);
        });

        this.add.text(w1.x + (compact ? 150 : 0), w1.y + (compact ? 0 : 60), `XP: ${playerProgressStore.xp || 0}`, {
            fontFamily: THEME.fontMono,
            fontSize: compact ? '17px' : '20px',
            color: THEME.textCyan,
        }).setDepth(8);

        this.add.text(w1.x + (compact ? 150 : 0), w1.y + (compact ? 24 : 82), `Nivel: ${playerProgressStore.level || 1}`, {
            fontFamily: THEME.fontMono,
            fontSize: compact ? '16px' : '18px',
            color: THEME.text,
        }).setDepth(8);

        const w2 = shell.createPanel(compact ? x + 4 : x + widgetW + 20, compact ? widgetY + widgetH + 10 : widgetY, compact ? widgetW : widgetW - 10, widgetH, 'LOGROS');
        const achievements = [
            { icon: '★', text: 'PRIMER PASO', sub: 'Contrato activo' },
            { icon: '◇', text: 'VOCABULARIO', sub: `${playerProgressStore.learnedWords?.length || 0} palabras` },
            { icon: '◎', text: 'NIVEL', sub: `Nv. ${playerProgressStore.level || 1}` },
        ];
        achievements.forEach((ach, i) => {
            this.add.text(w2.x, w2.y + i * 36, `${ach.icon} ${ach.text}`, {
                fontFamily: THEME.fontTitle,
                fontSize: compact ? '12px' : '14px',
                color: THEME.text,
            }).setDepth(8);
            this.add.text(w2.x + 20, w2.y + i * 36 + 16, ach.sub, {
                fontFamily: THEME.fontBody,
                fontSize: compact ? '11px' : '13px',
                color: THEME.textMuted,
            }).setDepth(8);
        });
    }

    _buildProgressView(shell, area) {
        const { x, y, w, h } = area;

        const mainPanel = shell.createPanel(x + 8, y + 8, w - 16, h - 16, 'CENTRO DE PROGRESO');

        const stats = [
            ['Nivel', playerProgressStore.level || 1],
            ['XP total', playerProgressStore.xp || 0],
            ['XP siguiente nivel', playerProgressStore.xpToNextLevel || 100],
            ['Palabras aprendidas', playerProgressStore.learnedWords?.length || 0],
            ['Día del contrato', `${playerProgressStore.story?.day || 1}/30`],
            ['Capítulo', playerProgressStore.story?.chapter || '—'],
        ];

        stats.forEach(([label, value], i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const px = mainPanel.x + col * (mainPanel.w / 2);
            const py = mainPanel.y + row * 60;

            const card = shell.createPanel(px + 8, py, mainPanel.w / 2 - 16, 48, null);
            this.add.text(card.x + 12, card.y + 8, label, {
                fontFamily: THEME.fontBody,
                fontSize: '14px',
                color: THEME.textDim,
            }).setDepth(8);

            this.add.text(card.x + 12, card.y + 26, String(value), {
                fontFamily: THEME.fontMono,
                fontSize: '20px',
                color: THEME.textCyan,
            }).setDepth(8);
        });

        // Gráfico de actividad (línea decorativa)
        const graphPanel = shell.createPanel(x + 8, y + h - 160, w - 16, 140, 'ACTIVIDAD — ÚLTIMOS 30 DÍAS');
        const graphG = this.add.graphics().setDepth(8);
        graphG.lineStyle(2, THEME.cyan, 0.7);
        const gx = graphPanel.x + 12;
        const gy = graphPanel.y + graphPanel.h - 12;
        const gw = graphPanel.w - 24;
        const gh = graphPanel.h - 36;

        graphG.beginPath();
        graphG.moveTo(gx, gy);
        for (let i = 0; i <= 20; i++) {
            const px = gx + (gw * i) / 20;
            const py = gy - gh * (0.3 + 0.5 * Math.sin(i * 0.5) * Math.cos(i * 0.3));
            graphG.lineTo(px, py);
        }
        graphG.strokePath();
    }

    _createActionButton(x, y, w, h, label, callback, primary = false, compact = false) {
        const g = this.add.graphics().setDepth(8);
        const fill = primary ? 0x0a2840 : 0x0a1520;
        const stroke = primary ? THEME.cyan : THEME.border;

        g.fillStyle(fill, 0.9);
        g.fillRoundedRect(x - w / 2, y, w, h, 8);
        g.lineStyle(1, stroke, primary ? 0.9 : 0.5);
        g.strokeRoundedRect(x - w / 2, y, w, h, 8);

        const zone = this.add.zone(x, y + h / 2, w, h)
            .setInteractive({ useHandCursor: true }).setDepth(9);

        const text = this.add.text(x, y + h / 2, label, {
            fontFamily: THEME.fontTitle,
            fontSize: compact ? '11px' : '16px',
            color: primary ? THEME.textCyan : THEME.text,
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(10);

        zone.on('pointerover', () => {
            g.clear();
            g.fillStyle(0x0c3050, 1);
            g.fillRoundedRect(x - w / 2, y, w, h, 8);
            g.lineStyle(2, THEME.cyan, 1);
            g.strokeRoundedRect(x - w / 2, y, w, h, 8);
            text.setColor(THEME.textCyan);
        });

        zone.on('pointerout', () => {
            g.clear();
            g.fillStyle(fill, 0.9);
            g.fillRoundedRect(x - w / 2, y, w, h, 8);
            g.lineStyle(1, stroke, primary ? 0.9 : 0.5);
            g.strokeRoundedRect(x - w / 2, y, w, h, 8);
            text.setColor(primary ? THEME.textCyan : THEME.text);
        });

        zone.on('pointerdown', callback);
    }

    startChallenge() {
        this.scene.start(SCENE_KEYS.SCENE_ENGINE, {
            sceneId: 'amt',
            challengeMode: true,
        });
    }
}
