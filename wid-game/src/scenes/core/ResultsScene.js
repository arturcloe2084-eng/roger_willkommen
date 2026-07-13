/**
 * ResultsScene — Pantalla de resultados con shell NEUROVITA.
 * Especificación: DESAFIO_ANMELDUNG_2026.md §6, PROMPT_RECONSTRUIR_GUI.md §5
 */
import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { FundaShell, THEME } from '../../ui/FundaShell.js';

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

const VERDICT_STYLES = {
    aprobado: { text: 'APROBADO', color: THEME.success, accent: 0x00ff88 },
    aprobado_con_ayuda: { text: 'APROBADO CON AYUDA', color: THEME.warning, accent: 0xffaa44 },
    no_aprobado: { text: 'NO APROBADO', color: THEME.danger, accent: 0xff4466 },
};

export class ResultsScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.RESULTS);
    }

    init(data) {
        this.result = data.result || { ...DEFAULT_RESULT };
    }

    create() {
        this.cameras.main.setBackgroundColor(THEME.bg);
        const r = this.result;

        const shell = new FundaShell(this, { activeId: 'challenge', showQuickStart: false });
        const area = shell.build('Vaclav');
        const compact = area.w < 760;

        const vStyle = VERDICT_STYLES[r.veredicto] || VERDICT_STYLES.no_aprobado;

        // Panel veredicto
        const verdictPanel = shell.createPanel(area.x + 4, area.y + 4, area.w - 8, compact ? 52 : 56, 'VEREDICTO', {
            accentColor: vStyle.accent,
        });

        this.add.text(verdictPanel.x + verdictPanel.w / 2, verdictPanel.y + 4, vStyle.text, {
            fontFamily: THEME.fontTitle,
            fontSize: compact ? '11px' : '14px',
            color: vStyle.color,
            fontStyle: 'bold',
        }).setOrigin(0.5, 0).setDepth(8);

        this.add.text(verdictPanel.x + verdictPanel.w / 2, verdictPanel.y + 26,
            `Consultas: ${r.consultas_clientes}  •  Confianza: ${Math.round(r.confianza * 100)}%`, {
                fontFamily: THEME.fontBody,
                fontSize: compact ? '8px' : '9px',
                color: THEME.textDim,
            }).setOrigin(0.5, 0).setDepth(8);

        // Puntuaciones (izquierda)
        const scoreX = area.x + 4;
        const scoreY = area.y + (compact ? 62 : 68);
        const scoreW = compact ? area.w - 8 : area.w * 0.48;
        const scoreH = compact ? 224 : area.h - 156;
        const scorePanel = shell.createPanel(scoreX, scoreY, scoreW, scoreH, 'PUNTUACIONES');
        const rowH = compact ? 22 : 28;
        const labelW = compact ? 82 : 90;
        const barW = compact ? Math.max(96, scorePanel.w - 142) : 100;

        Object.entries(r.puntos).forEach(([key, value], i) => {
            const sy = scorePanel.y + i * rowH;
            const color = value >= 80 ? THEME.success : value >= 50 ? THEME.warning : THEME.danger;

            this.add.text(scorePanel.x, sy, CRITERIO_LABELS[key] || key, {
                fontFamily: THEME.fontBody,
                fontSize: compact ? '7px' : '8px',
                color: THEME.textDim,
            }).setDepth(8);

            shell.drawProgressBar(scorePanel.x + labelW, sy + 2, barW, 9, value,
                parseInt(color.replace('#', ''), 16));

            this.add.text(scorePanel.x + labelW + barW + 8, sy - 1, `${value}`, {
                fontFamily: THEME.fontMono,
                fontSize: compact ? '10px' : '11px',
                color: color,
            }).setDepth(8);
        });

        // Evidencias + errores (derecha)
        const sideX = compact ? area.x + 4 : area.x + area.w * 0.52;
        const sideW = compact ? area.w - 8 : area.w * 0.46;
        const evY = compact ? scoreY + scoreH + 8 : area.y + 68;
        const evPanel = shell.createPanel(sideX, evY, sideW, compact ? 78 : 120, 'EVIDENCIAS');
        (r.evidencias || []).slice(0, compact ? 2 : 4).forEach((ev, i) => {
            this.add.text(evPanel.x, evPanel.y + i * (compact ? 16 : 20), `• ${ev}`, {
                fontFamily: THEME.fontBody,
                fontSize: compact ? '7px' : '8px',
                color: THEME.textDim,
                wordWrap: { width: evPanel.w },
            }).setDepth(8);
        });

        const errPanel = shell.createPanel(sideX, compact ? evY + 86 : area.y + 196, sideW, compact ? 58 : 70, 'ERRORES');
        const allErrors = [...(r.errores_administrativos || []), ...(r.errores_linguisticos || [])];
        if (allErrors.length === 0) {
            this.add.text(errPanel.x, errPanel.y, 'Sin errores detectados', {
                fontFamily: THEME.fontBody,
                fontSize: compact ? '8px' : '9px',
                color: THEME.success,
            }).setDepth(8);
        } else {
            allErrors.slice(0, compact ? 1 : 2).forEach((err, i) => {
                this.add.text(errPanel.x, errPanel.y + i * (compact ? 16 : 20), `⚠ ${err}`, {
                    fontFamily: THEME.fontBody,
                    fontSize: compact ? '7px' : '8px',
                    color: THEME.warning,
                    wordWrap: { width: errPanel.w },
                }).setDepth(8);
            });
        }

        // Ejercicios recomendados
        const recY = compact ? errPanel.y + errPanel.h + 50 : area.y + area.h - 92;
        const recPanel = shell.createPanel(area.x + 4, recY, area.w - 8, compact ? 58 : 58, 'EJERCICIOS RECOMENDADOS');
        (r.ejercicios_recomendados || []).slice(0, compact ? 2 : 3).forEach((ej, i) => {
            this.add.text(recPanel.x, recPanel.y + i * (compact ? 15 : 16), `▸ ${ej}`, {
                fontFamily: THEME.fontBody,
                fontSize: compact ? '7px' : '8px',
                color: THEME.textDim,
            }).setDepth(8);
        });

        const prog = r.progreso_otorgado?.alean || {};
        this.add.text(area.x + area.w - 8, compact ? recY - 12 : area.y + area.h - 100,
            `+${prog.xp || 0} XP  •  +${prog.palabras || 0} palabras`, {
                fontFamily: THEME.fontMono,
                fontSize: compact ? '8px' : '10px',
                color: THEME.success,
            }).setOrigin(1, 0).setDepth(8);

        // Botones
        const btnY = compact ? Math.min(area.y + area.h - 14, recY + 76) : area.y + area.h - 16;
        this._createActionBtn(area.x + area.w / 2 - 130, btnY, 120, 26,
            '← MENÚ', () => this.scene.start(SCENE_KEYS.CONTRACT_MENU), false, compact);
        this._createActionBtn(area.x + area.w / 2 + 10, btnY, 120, 26,
            'REINTENTAR ▸', () => {
                this.scene.start(SCENE_KEYS.SCENE_ENGINE, { sceneId: 'amt', challengeMode: true });
            }, true, compact);

        this.cameras.main.fadeIn(400, 5, 10, 15);
    }

    _createActionBtn(x, y, w, h, label, callback, primary = false, compact = false) {
        const g = this.add.graphics().setDepth(8);
        g.fillStyle(primary ? 0x0a2840 : 0x0a1520, 0.9);
        g.fillRoundedRect(x, y - h / 2, w, h, 4);
        g.lineStyle(1, primary ? THEME.cyan : THEME.border, primary ? 0.9 : 0.5);
        g.strokeRoundedRect(x, y - h / 2, w, h, 4);

        const zone = this.add.zone(x + w / 2, y, w, h)
            .setInteractive({ useHandCursor: true }).setDepth(9);

        const text = this.add.text(x + w / 2, y, label, {
            fontFamily: THEME.fontTitle,
            fontSize: compact ? '7px' : '8px',
            color: primary ? THEME.textCyan : THEME.text,
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(10);

        zone.on('pointerover', () => text.setColor(THEME.textCyan));
        zone.on('pointerout', () => text.setColor(primary ? THEME.textCyan : THEME.text));
        zone.on('pointerdown', callback);
    }
}
