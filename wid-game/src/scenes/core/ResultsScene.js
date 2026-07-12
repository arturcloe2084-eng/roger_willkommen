/**
 * ResultsScene — Pantalla de resultados tras completar un desafío.
 * Muestra veredicto, 8 criterios con puntuaciones y colores,
 * errores con evidencias, ejercicios recomendados, y progreso otorgado.
 *
 * Especificación: DESAFIO_ANMELDUNG_2026.md §6, PROMPT_RECONSTRUIR_GUI.md §5
 */
import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';

const C = Object.freeze({
    bg: 0x0c1020,
    panel: 0x111828,
    panelStroke: 0x4a6080,
    accent: 0xffd64f,
    textTitle: '#f7f0d1',
    textSub: '#c8d0de',
    textDim: '#7a8494',
    verdictColors: {
        aprobado: { fill: 0x1a5c2a, stroke: 0x44cc66, text: '#44ff66' },
        aprobado_con_ayuda: { fill: 0x2a4010, stroke: 0xaacc44, text: '#bbdd55' },
        no_aprobado: { fill: 0x3a1010, stroke: 0xcc4444, text: '#ff5555' },
    },
    scoreColors: {
        high: '#44ff66',    // >= 80
        mid: '#ffcc44',     // >= 50
        low: '#ff4444',     // < 50
    },
});

// Resultado simulado para demo (se reemplazará por datos reales del evaluador)
const DEFAULT_RESULT = {
    veredicto: 'aprobado_con_ayuda',
    puntos: {
        cumplimiento: 95, exactitud: 92, comprension: 72,
        expresion: 68, idioma: 70, autonomia: 92,
        recuperacion: 85, seguridad: 80,
    },
    consultas_clientes: 1,
    errores_administrativos: [],
    errores_linguisticos: ['Posible confusión entre Geburtsort y Wohnort'],
    evidencias: [
        'Saludo formal correcto: "Guten Tag. Ich möchte mich anmelden."',
        'Pidió repetición/aclaración: "Wie bitte?"',
        'Mencionó pasaporte: "Hier ist mein Reisepass."',
    ],
    ejercicios_recomendados: [
        'Diferenciar Geburtsort y Wohnort',
        'Practicar respuestas solo en alemán',
        'Reducir consultas a terceros',
    ],
    progreso_otorgado: { alean: { xp: 110, palabras: 8 } },
    confianza: 0.75,
    requiere_revision_humana: false,
};

const CRITERIO_LABELS = {
    cumplimiento: 'Cumplimiento',
    exactitud: 'Exactitud',
    comprension: 'Comprensión',
    expresion: 'Expresión',
    idioma: 'Idioma',
    autonomia: 'Autonomía',
    recuperacion: 'Recuperación',
    seguridad: 'Seguridad',
};

export class ResultsScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.RESULTS);
    }

    init(data) {
        this.result = data.result || { ...DEFAULT_RESULT };
    }

    create() {
        const { width, height } = this.cameras.main;
        this.cameras.main.setBackgroundColor(C.bg);
        const r = this.result;

        // ─── Fondo decorativo ─────────────────────────────────────────
        const bgDecor = this.add.graphics().setDepth(0);
        bgDecor.fillStyle(0x0a0e18, 1);
        bgDecor.fillRect(0, 0, width, height);

        // ─── Veredicto (panel superior grande) ────────────────────────
        const vStyle = C.verdictColors[r.veredicto] || C.verdictColors.no_aprobado;

        const verdictPanel = this.add.graphics().setDepth(5);
        const vpx = 40, vpy = 14, vpw = width - 80, vph = 62;
        verdictPanel.fillStyle(vStyle.fill, 0.9);
        verdictPanel.fillRoundedRect(vpx, vpy, vpw, vph, 10);
        verdictPanel.lineStyle(3, vStyle.stroke, 0.9);
        verdictPanel.strokeRoundedRect(vpx, vpy, vpw, vph, 10);

        const verdictLabel = r.veredicto === 'aprobado' ? '✅ APROBADO' :
            r.veredicto === 'aprobado_con_ayuda' ? '✅ APROBADO CON AYUDA' : '❌ NO APROBADO';

        this.add.text(width / 2, vpy + 18, verdictLabel, {
            fontFamily: '"Press Start 2P"', fontSize: '14px', color: vStyle.text,
        }).setOrigin(0.5).setDepth(6);

        this.add.text(width / 2, vpy + 42,
            `Consultas a clientes: ${r.consultas_clientes}  •  Confianza: ${Math.round(r.confianza * 100)}%`, {
            fontFamily: 'VT323', fontSize: '16px', color: C.textSub,
        }).setOrigin(0.5).setDepth(6);

        // ─── Puntuaciones (8 criterios) ──────────────────────────────
        const scorePanel = this.add.graphics().setDepth(5);
        const spx = 40, spy = 88, spw = 360, sph = 260;
        scorePanel.fillStyle(C.panel, 0.85);
        scorePanel.fillRoundedRect(spx, spy, spw, sph, 8);
        scorePanel.lineStyle(1, C.panelStroke, 0.5);
        scorePanel.strokeRoundedRect(spx, spy, spw, sph, 8);
        scorePanel.fillStyle(C.accent, 0.8);
        scorePanel.fillRect(spx + 12, spy + 8, spw - 24, 2);

        this.add.text(spx + 14, spy + 14, 'PUNTUACIONES', {
            fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#aa8830',
        }).setDepth(6);

        Object.entries(r.puntos).forEach(([key, value], i) => {
            const sy = spy + 32 + i * 28;
            const color = value >= 80 ? C.scoreColors.high :
                value >= 50 ? C.scoreColors.mid : C.scoreColors.low;

            // Barra de fondo
            const barBg = this.add.graphics().setDepth(6);
            barBg.fillStyle(0x222233, 0.8);
            barBg.fillRect(spx + 18, sy + 6, 180, 14);

            // Barra rellena
            const barFill = this.add.graphics().setDepth(7);
            const barColor = value >= 80 ? 0x44cc66 : value >= 50 ? 0xccaa44 : 0xcc4444;
            barFill.fillStyle(barColor, 0.9);
            barFill.fillRect(spx + 18, sy + 6, Math.round(180 * value / 100), 14);

            this.add.text(spx + 206, sy + 4, `${value}`, {
                fontFamily: 'VT323', fontSize: '18px', color: color,
            }).setDepth(7);

            this.add.text(spx + 18, sy - 8, CRITERIO_LABELS[key] || key, {
                fontFamily: 'VT323', fontSize: '14px', color: C.textDim,
            }).setDepth(6);
        });

        // ─── Evidencias ───────────────────────────────────────────────
        const evPanel = this.add.graphics().setDepth(5);
        const epx = 420, epy = 88, epw = 340, eph = 120;
        evPanel.fillStyle(C.panel, 0.85);
        evPanel.fillRoundedRect(epx, epy, epw, eph, 8);
        evPanel.lineStyle(1, C.panelStroke, 0.5);
        evPanel.strokeRoundedRect(epx, epy, epw, eph, 8);
        evPanel.fillStyle(C.accent, 0.8);
        evPanel.fillRect(epx + 12, epy + 8, epw - 24, 2);

        this.add.text(epx + 14, epy + 14, 'EVIDENCIAS', {
            fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#aa8830',
        }).setDepth(6);

        (r.evidencias || []).slice(0, 4).forEach((ev, i) => {
            this.add.text(epx + 18, epy + 32 + i * 20, `• ${ev}`, {
                fontFamily: 'VT323', fontSize: '13px', color: C.textSub,
                wordWrap: { width: epw - 40 },
            }).setDepth(6);
        });

        // ─── Errores ──────────────────────────────────────────────────
        const errPanel = this.add.graphics().setDepth(5);
        const erx = 420, ery = 220, erw = 340, erh = 70;
        errPanel.fillStyle(C.panel, 0.85);
        errPanel.fillRoundedRect(erx, ery, erw, erh, 8);
        errPanel.lineStyle(1, C.panelStroke, 0.5);
        errPanel.strokeRoundedRect(erx, ery, erw, erh, 8);

        this.add.text(erx + 14, ery + 10, 'ERRORES', {
            fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#cc4444',
        }).setDepth(6);

        const allErrors = [...(r.errores_administrativos || []), ...(r.errores_linguisticos || [])];
        allErrors.slice(0, 2).forEach((err, i) => {
            this.add.text(erx + 18, ery + 26 + i * 18, `⚠ ${err}`, {
                fontFamily: 'VT323', fontSize: '14px', color: '#ff8844',
                wordWrap: { width: erw - 40 },
            }).setDepth(6);
        });

        if (allErrors.length === 0) {
            this.add.text(erx + 18, ery + 28, 'Sin errores detectados', {
                fontFamily: 'VT323', fontSize: '14px', color: '#44cc66',
            }).setDepth(6);
        }

        // ─── Ejercicios recomendados ──────────────────────────────────
        const recPanel = this.add.graphics().setDepth(5);
        const rpx = 40, rpy = 360, rpw = width - 80, rph = 80;
        recPanel.fillStyle(C.panel, 0.85);
        recPanel.fillRoundedRect(rpx, rpy, rpw, rph, 8);
        recPanel.lineStyle(1, C.panelStroke, 0.5);
        recPanel.strokeRoundedRect(rpx, rpy, rpw, rph, 8);

        this.add.text(rpx + 14, rpy + 10, 'EJERCICIOS RECOMENDADOS', {
            fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#44aadd',
        }).setDepth(6);

        (r.ejercicios_recomendados || []).slice(0, 3).forEach((ej, i) => {
            this.add.text(rpx + 18, rpy + 28 + i * 18, `▸ ${ej}`, {
                fontFamily: 'VT323', fontSize: '16px', color: C.textSub,
            }).setDepth(6);
        });

        // ─── Progreso otorgado ────────────────────────────────────────
        const prog = r.progreso_otorgado?.alean || {};
        this.add.text(width / 2, rpy + rph + 10,
            `Progreso: +${prog.xp || 0} XP  •  +${prog.palabras || 0} palabras`, {
            fontFamily: 'VT323', fontSize: '18px', color: '#44cc66',
        }).setOrigin(0.5).setDepth(6);

        // ─── Botones ──────────────────────────────────────────────────
        // Volver al menú de contrato
        const btn1X = width / 2 - 130, btn1Y = height - 40, btn1W = 130, btn1H = 30;
        this._createActionBtn(btn1X, btn1Y, btn1W, btn1H, '← MENÚ', 0x1a1a28, 0xff6666, () => {
            this.scene.start(SCENE_KEYS.CONTRACT_MENU);
        });

        // Reintentar desafío
        const btn2X = width / 2 + 10, btn2Y = height - 40, btn2W = 130, btn2H = 30;
        this._createActionBtn(btn2X, btn2Y, btn2W, btn2H, 'REINTENTAR ▸', 0x1a5030, 0x44cc66, () => {
            this.scene.start(SCENE_KEYS.SCENE_ENGINE, { sceneId: 'amt', challengeMode: true });
        });

        // ─── Fade in ──────────────────────────────────────────────────
        this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    _createActionBtn(x, y, w, h, label, fill, stroke, callback) {
        const g = this.add.graphics().setDepth(5);
        g.fillStyle(fill, 0.85);
        g.fillRoundedRect(x, y, w, h, 6);
        g.lineStyle(2, stroke, 0.8);
        g.strokeRoundedRect(x, y, w, h, 6);

        const zone = this.add.zone(x + w / 2, y + h / 2, w, h)
            .setInteractive({ useHandCursor: true }).setDepth(6);

        const text = this.add.text(x + w / 2, y + h / 2, label, {
            fontFamily: 'VT323', fontSize: '17px', color: '#ffffff',
        }).setOrigin(0.5).setDepth(7);

        zone.on('pointerover', () => text.setColor('#ffffcc'));
        zone.on('pointerout', () => text.setColor('#ffffff'));
        zone.on('pointerdown', () => callback());
    }
}
