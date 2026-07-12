/**
 * ContractMenuScene — Nuevo menú inicial del Entrenador de Fundas.
 * Reemplaza a MainMenuScene como pantalla de entrada del juego.
 *
 * Muestra:
 *   - Contrato activo: "Anmeldung 2026 — Bürgeramt Berlin"
 *   - Perfil resumido de la funda activa
 *   - 4 botones: [EMPEZAR DESAFÍO] [PREPARARME] [MI FUNDA] [⚙️]
 *   - Acceso secundario al menú clásico (escenas históricas)
 *
 * Especificación: PRODUCT_BRIEF.md, DESAFIO_ANMELDUNG_2026.md, PROMPT_RECONSTRUIR_GUI.md
 */
import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';

// ─── Colores del tema ────────────────────────────────────────────────────
const C = Object.freeze({
    bg: 0x0c1020,
    panel: 0x111828,
    panelStroke: 0x4a6080,
    accent: 0xffd64f,
    accentDim: 0xb89a30,
    textTitle: '#f7f0d1',
    textSub: '#c8d0de',
    textDim: '#7a8494',
    btnPlay: 0x1a5c2a,
    btnPlayStroke: 0x44cc66,
    btnPrep: 0x1a3050,
    btnPrepStroke: 0x44aadd,
    btnProfile: 0x3a2040,
    btnProfileStroke: 0xaa66cc,
    btnSettings: 0x1a1a28,
    btnSettingsStroke: 0x667788,
    btnClassic: 0x222222,
    btnClassicStroke: 0x555555,
});

export class ContractMenuScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.CONTRACT_MENU);
    }

    create() {
        const { width, height } = this.cameras.main;
        this.cameras.main.setBackgroundColor(C.bg);

        // ─── Fondo decorativo ─────────────────────────────────────────
        const bgDecor = this.add.graphics().setDepth(0);
        bgDecor.fillStyle(0x0a0e18, 1);
        bgDecor.fillRect(0, 0, width, height);
        // Grid sutil
        bgDecor.lineStyle(1, 0x1a2840, 0.15);
        for (let x = 0; x < width; x += 40) {
            bgDecor.moveTo(x, 0); bgDecor.lineTo(x, height);
        }
        for (let y = 0; y < height; y += 40) {
            bgDecor.moveTo(0, y); bgDecor.lineTo(width, y);
        }
        // Línea de acento superior
        bgDecor.fillStyle(C.accent, 0.9);
        bgDecor.fillRect(width / 2 - 180, 8, 360, 3);

        // ─── Título ───────────────────────────────────────────────────
        this.add.text(width / 2, 40, 'ENTRENADOR DE FUNDAS', {
            fontFamily: '"Press Start 2P"', fontSize: '14px', color: C.textTitle,
        }).setOrigin(0.5).setDepth(10);

        this.add.text(width / 2, 62, 'Sistema de Entrenamiento Cognitivo', {
            fontFamily: 'VT323', fontSize: '20px', color: C.textDim,
        }).setOrigin(0.5).setDepth(10);

        // ─── Panel de contrato activo ─────────────────────────────────
        const contractPanel = this.add.graphics().setDepth(5);
        const cpx = 40, cpy = 95, cpw = width - 80, cph = 130;
        contractPanel.fillStyle(C.panel, 0.9);
        contractPanel.fillRoundedRect(cpx, cpy, cpw, cph, 10);
        contractPanel.lineStyle(2, C.panelStroke, 0.7);
        contractPanel.strokeRoundedRect(cpx, cpy, cpw, cph, 10);
        // Acento superior del panel
        contractPanel.fillStyle(C.accent, 0.85);
        contractPanel.fillRect(cpx + 16, cpy + 10, cpw - 32, 2);

        this.add.text(cpx + 20, cpy + 22, '📋 CONTRATO ACTIVO', {
            fontFamily: '"Press Start 2P"', fontSize: '9px', color: C.accentDim,
        }).setDepth(6);

        this.add.text(cpx + 20, cpy + 46, 'Anmeldung 2026 — Bürgeramt Berlin', {
            fontFamily: 'VT323', fontSize: '22px', color: '#ffffff',
        }).setDepth(6);

        this.add.text(cpx + 20, cpy + 74,
            'Preparar una funda para completar el empadronamiento (Anmeldung)\n' +
            'en un Bürgeramt alemán. Diálogo con empleados del registro.', {
            fontFamily: 'VT323', fontSize: '16px', color: C.textSub,
            lineSpacing: 4,
        }).setDepth(6);

        this.add.text(cpx + 20, cpy + 110, 'Día del contrato: 1/30  •  Estado: PENDIENTE', {
            fontFamily: 'VT323', fontSize: '16px', color: '#88aaff',
        }).setDepth(6);

        // ─── Panel de funda resumida ──────────────────────────────────
        const fundaPanel = this.add.graphics().setDepth(5);
        const fpx = 40, fpy = 240, fpw = width - 80, fph = 60;
        fundaPanel.fillStyle(C.panel, 0.85);
        fundaPanel.fillRoundedRect(fpx, fpy, fpw, fph, 10);
        fundaPanel.lineStyle(1, C.panelStroke, 0.5);
        fundaPanel.strokeRoundedRect(fpx, fpy, fpw, fph, 10);

        this.add.text(fpx + 16, fpy + 10, '👤 FUNDA ACTIVA', {
            fontFamily: '"Press Start 2P"', fontSize: '8px', color: C.accentDim,
        }).setDepth(6);

        this.add.text(fpx + 16, fpy + 26,
            'Vaclav S.  •  Alemán: A2+  •  Inglés: C1  •  Español: nativo  •  Nivel: ' +
            (playerProgressStore.level || 1), {
            fontFamily: 'VT323', fontSize: '18px', color: C.textSub,
        }).setDepth(6);

        this.add.text(fpx + 16, fpy + 44,
            `Palabras: ${playerProgressStore.learnedWords?.length || 0}  •  XP: ${playerProgressStore.xp || 0}`, {
            fontFamily: 'VT323', fontSize: '15px', color: C.textDim,
        }).setDepth(6);

        // ─── Botones principales ───────────────────────────────────────
        const btnDefs = [
            {
                id: 'play', label: '▶ EMPEZAR DESAFÍO', x: 50, y: 320,
                w: 320, h: 52, fill: C.btnPlay, stroke: C.btnPlayStroke,
                scene: () => this.startChallenge(),
            },
            {
                id: 'prep', label: '📋 PREPARARME', x: 390, y: 320,
                w: 360, h: 52, fill: C.btnPrep, stroke: C.btnPrepStroke,
                scene: () => this.scene.start(SCENE_KEYS.PREPARATION),
            },
            {
                id: 'profile', label: '👤 MI FUNDA', x: 50, y: 386,
                w: 320, h: 52, fill: C.btnProfile, stroke: C.btnProfileStroke,
                scene: () => this.scene.start(SCENE_KEYS.PROFILE),
            },
            {
                id: 'settings', label: '⚙️ CONFIGURACIÓN', x: 390, y: 386,
                w: 360, h: 52, fill: C.btnSettings, stroke: C.btnSettingsStroke,
                scene: () => {}, // TODO: pantalla de configuración futura
            },
        ];

        for (const def of btnDefs) {
            this._createButton(def);
        }

        // ─── Botón secundario: menú clásico ───────────────────────────
        const classicBtn = this.add.graphics().setDepth(5);
        classicBtn.fillStyle(C.btnClassic, 0.7);
        classicBtn.fillRoundedRect(width - 170, height - 34, 150, 24, 6);
        classicBtn.lineStyle(1, C.btnClassicStroke, 0.5);
        classicBtn.strokeRoundedRect(width - 170, height - 34, 150, 24, 6);

        const classicZone = this.add.zone(width - 95, height - 22, 150, 24)
           .setInteractive({ useHandCursor: true }).setDepth(6);
        classicZone.on('pointerdown', () => {
            this.scene.start(SCENE_KEYS.MAIN_MENU);
        });

        this.add.text(width - 95, height - 22, 'Menú clásico ▸', {
            fontFamily: 'VT323', fontSize: '14px', color: C.textDim,
        }).setOrigin(0.5).setDepth(6);

        // ─── Version ──────────────────────────────────────────────────
        this.add.text(12, height - 18, 'v0.6.0-funda', {
            fontFamily: 'VT323', fontSize: '14px', color: '#444455',
        }).setDepth(6);

        // ─── Fade in ──────────────────────────────────────────────────
        this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    _createButton(def) {
        const g = this.add.graphics().setDepth(5);
        g.fillStyle(def.fill, 0.85);
        g.fillRoundedRect(def.x, def.y, def.w, def.h, 8);
        g.lineStyle(2, def.stroke, 0.8);
        g.strokeRoundedRect(def.x, def.y, def.w, def.h, 8);

        const zone = this.add.zone(
            def.x + def.w / 2, def.y + def.h / 2, def.w, def.h
        ).setInteractive({ useHandCursor: true }).setDepth(6);

        const label = this.add.text(def.x + def.w / 2, def.y + def.h / 2, def.label, {
            fontFamily: 'VT323', fontSize: '22px', color: '#ffffff',
        }).setOrigin(0.5).setDepth(7);

        zone.on('pointerover', () => {
            g.clear();
            g.fillStyle(def.fill, 1);
            g.fillRoundedRect(def.x, def.y, def.w, def.h, 8);
            g.lineStyle(2, def.stroke, 1);
            g.strokeRoundedRect(def.x, def.y, def.w, def.h, 8);
            label.setColor('#ffffcc');
        });

        zone.on('pointerout', () => {
            g.clear();
            g.fillStyle(def.fill, 0.85);
            g.fillRoundedRect(def.x, def.y, def.w, def.h, 8);
            g.lineStyle(2, def.stroke, 0.8);
            g.strokeRoundedRect(def.x, def.y, def.w, def.h, 8);
            label.setColor('#ffffff');
        });

        zone.on('pointerdown', () => def.scene());
    }

    startChallenge() {
        // Lanzar la escena del Bürgeramt con modo desafío activado
        this.scene.start(SCENE_KEYS.SCENE_ENGINE, {
            sceneId: 'amt',
            challengeMode: true,
        });
    }
}
