/**
 * ProfileScene — Perfil editable de la funda.
 * El jugador construye el currículum de su funda: datos personales,
 * idiomas con niveles, documentos disponibles.
 *
 * Especificación: PRODUCT_BRIEF.md §3, DESAFIO_ANMELDUNG_2026.md §1
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
    inputBg: 0x1a2030,
    inputStroke: 0x445566,
    langColors: {
        principal: 0x44cc66,
        apoyo: 0x44aadd,
        interfaz: 0xaa66cc,
    },
});

// Perfil ficticio por defecto (DESAFIO_ANMELDUNG_2026.md §1)
const DEFAULT_PROFILE = {
    alias: 'Vaclav S.',
    geburtsname: 'Vaclav',
    familienname: 'Sindelaru',
    geburtsdatum: '1979-03-12',
    geburtsort: 'Bratislava',
    staatsangehorigkeit: 'Slowakei',
    geschlecht: 'männlich',
    wohnung: {
        strasse: 'Kollwitzstraße',
        hausnummer: '3',
        postleitzahl: '10405',
        ort: 'Berlin',
        einzug: '2026-01-15',
    },
    idiomas: [
        { idioma: 'Alemán', nivel_declarado: 'A2+', nivel_comprobado: null, rol: 'principal' },
        { idioma: 'Inglés', nivel_declarado: 'C1', nivel_comprobado: 'C1', rol: 'apoyo' },
        { idioma: 'Español', nivel_declarado: 'nativo', nivel_comprobado: 'nativo', rol: 'interfaz' },
    ],
    documentos: ['Reisepass', 'Mietvertrag'],
};

export class ProfileScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.PROFILE);
    }

    init(data) {
        // Permitir pasar un perfil existente o usar el ficticio
        this.profileData = data.profile || { ...DEFAULT_PROFILE };
        this.useFicticio = data.profile ? false : true;
        this.editingField = null;
    }

    create() {
        const { width, height } = this.cameras.main;
        this.cameras.main.setBackgroundColor(C.bg);

        // ─── Fondo decorativo ─────────────────────────────────────────
        const bgDecor = this.add.graphics().setDepth(0);
        bgDecor.fillStyle(0x0a0e18, 1);
        bgDecor.fillRect(0, 0, width, height);

        // ─── Título ───────────────────────────────────────────────────
        this.add.text(width / 2, 20, '👤 MI FUNDA', {
            fontFamily: '"Press Start 2P"', fontSize: '12px', color: C.textTitle,
        }).setOrigin(0.5).setDepth(10);

        this.add.text(width / 2, 42, 'Currículum vivo de la funda', {
            fontFamily: 'VT323', fontSize: '18px', color: C.textDim,
        }).setOrigin(0.5).setDepth(10);

        // ─── Selector: perfil ficticio / personal ─────────────────────
        const modeY = 62;
        this._modeFicticio = this.add.text(60, modeY, '● Ficticio (seguro)', {
            fontFamily: 'VT323', fontSize: '16px', color: this.useFicticio ? '#44cc66' : '#555555',
        }).setDepth(10).setInteractive({ useHandCursor: true });

        this._modePersonal = this.add.text(300, modeY, '○ Personal', {
            fontFamily: 'VT323', fontSize: '16px', color: this.useFicticio ? '#555555' : '#44cc66',
        }).setDepth(10).setInteractive({ useHandCursor: true });

        this._modeFicticio.on('pointerdown', () => this.switchMode(true));
        this._modePersonal.on('pointerdown', () => this.switchMode(false));

        // ─── Panel: Datos personales ──────────────────────────────────
        const dp = this.add.graphics().setDepth(5);
        const dpx = 20, dpy = 86, dpw = 360, dph = 340;
        dp.fillStyle(C.panel, 0.85);
        dp.fillRoundedRect(dpx, dpy, dpw, dph, 8);
        dp.lineStyle(1, C.panelStroke, 0.5);
        dp.strokeRoundedRect(dpx, dpy, dpw, dph, 8);
        dp.fillStyle(C.accent, 0.8);
        dp.fillRect(dpx + 12, dpy + 8, dpw - 24, 2);

        this.add.text(dpx + 14, dpy + 14, 'DATOS PERSONALES', {
            fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#aa8830',
        }).setDepth(6);

        const personalFields = [
            ['Alias', this.profileData.alias],
            ['Vorname', this.profileData.geburtsname],
            ['Familienname', this.profileData.familienname],
            ['Geburtsdatum', this.profileData.geburtsdatum],
            ['Geburtsort', this.profileData.geburtsort],
            ['Staatsangehörigkeit', this.profileData.staatsangehorigkeit],
            ['Geschlecht', this.profileData.geschlecht],
            ['Straße', this.profileData.wohnung?.strasse],
            ['Hausnr.', this.profileData.wohnung?.hausnummer],
            ['PLZ', this.profileData.wohnung?.postleitzahl],
            ['Wohnort', this.profileData.wohnung?.ort],
            ['Einzugdatum', this.profileData.wohnung?.einzug],
        ];

        personalFields.forEach(([label, value], i) => {
            const fy = dpy + 30 + i * 24;
            this.add.text(dpx + 18, fy, label + ':', {
                fontFamily: 'VT323', fontSize: '15px', color: C.textDim,
            }).setDepth(6);

            const valText = this.add.text(dpx + 160, fy, String(value || '—'), {
                fontFamily: 'VT323', fontSize: '16px', color: this.useFicticio ? '#aaaaaa' : '#ffffff',
                backgroundColor: C.inputBg.toString(16).replace(/^0x/, '#') + 'aa',
                padding: { x: 4, y: 1 },
            }).setDepth(6);

            if (!this.useFicticio) {
                valText.setInteractive({ useHandCursor: true });
                valText.on('pointerdown', () => {
                    this.editField(label, valText);
                });
            }
        });

        // ─── Panel: Idiomas ──────────────────────────────────────────
        const lp = this.add.graphics().setDepth(5);
        const lpx = 400, lpy = 86, lpw = 380, lph = 160;
        lp.fillStyle(C.panel, 0.85);
        lp.fillRoundedRect(lpx, lpy, lpw, lph, 8);
        lp.lineStyle(1, C.panelStroke, 0.5);
        lp.strokeRoundedRect(lpx, lpy, lpw, lph, 8);
        lp.fillStyle(C.accent, 0.8);
        lp.fillRect(lpx + 12, lpy + 8, lpw - 24, 2);

        this.add.text(lpx + 14, lpy + 14, 'IDIOMAS', {
            fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#aa8830',
        }).setDepth(6);

        (this.profileData.idiomas || []).forEach((lang, i) => {
            const ly = lpy + 32 + i * 40;
            const langColor = C.langColors[lang.rol] || 0xffffff;

            // Indicador de rol
            const dot = this.add.graphics().setDepth(6);
            dot.fillStyle(langColor, 0.9);
            dot.fillCircle(lpx + 20, ly + 6, 5);

            this.add.text(lpx + 32, ly - 2, lang.idioma, {
                fontFamily: 'VT323', fontSize: '20px', color: '#ffffff',
            }).setDepth(6);

            this.add.text(lpx + 32, ly + 18,
                `Declarado: ${lang.nivel_declarado}  •  Comprobado: ${lang.nivel_comprobado || '—'}  •  Rol: ${lang.rol}`, {
                fontFamily: 'VT323', fontSize: '14px', color: C.textDim,
            }).setDepth(6);
        });

        // ─── Panel: Documentos ────────────────────────────────────────
        const docp = this.add.graphics().setDepth(5);
        const docpx = 400, docpy = 260, docpw = 380, docph = 80;
        docp.fillStyle(C.panel, 0.85);
        docp.fillRoundedRect(docpx, docpy, docpw, docph, 8);
        docp.lineStyle(1, C.panelStroke, 0.5);
        docp.strokeRoundedRect(docpx, docpy, docpw, docph, 8);
        docp.fillStyle(C.accent, 0.8);
        docp.fillRect(docpx + 12, docpy + 8, docpw - 24, 2);

        this.add.text(docpx + 14, docpy + 14, 'DOCUMENTOS DISPONIBLES', {
            fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#aa8830',
        }).setDepth(6);

        (this.profileData.documentos || []).forEach((doc, i) => {
            this.add.text(docpx + 18, docpy + 34 + i * 18, `✓ ${doc}`, {
                fontFamily: 'VT323', fontSize: '17px', color: '#44cc66',
            }).setDepth(6);
        });

        // ─── Botón volver ─────────────────────────────────────────────
        this._createBackButton(width, height);

        // ─── Fade in ──────────────────────────────────────────────────
        this.cameras.main.fadeIn(300, 0, 0, 0);
    }

    switchMode(ficticio) {
        this.useFicticio = ficticio;
        if (ficticio) {
            this.profileData = { ...DEFAULT_PROFILE };
        }
        // Recrear la escena con el nuevo modo
        this.scene.restart({ profile: ficticio ? null : this.profileData });
    }

    editField(label, textObj) {
        // Simulación de edición inline: alternar resaltado
        // En una versión futura se conectará con un input real
        textObj.setColor('#ffcc00');
        this.time.delayedCall(1500, () => {
            textObj.setColor('#ffffff');
        });
    }

    _createBackButton(width, height) {
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
    }
}
