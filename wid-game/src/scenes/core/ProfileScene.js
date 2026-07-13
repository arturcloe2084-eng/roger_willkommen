/**
 * ProfileScene — Perfil editable de la funda con shell NEUROVITA.
 * Especificación: PRODUCT_BRIEF.md §3, DESAFIO_ANMELDUNG_2026.md §1
 */
import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { FundaShell, THEME } from '../../ui/FundaShell.js';

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

const LANG_COLORS = {
    principal: { dot: 0x00d2ff, text: THEME.textCyan },
    apoyo: { dot: 0x44aadd, text: '#44aadd' },
    interfaz: { dot: 0xaa88cc, text: '#aa88cc' },
};

export class ProfileScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.PROFILE);
    }

    init(data) {
        this.profileData = data.profile || { ...DEFAULT_PROFILE };
        this.useFicticio = data.profile ? false : true;
    }

    create() {
        this.cameras.main.setBackgroundColor(THEME.bg);

        const shell = new FundaShell(this, { activeId: 'profile' });
        const area = shell.build('Vaclav');

        // Selector ficticio / personal
        this._drawModeSelector(shell, area);
        const compact = area.w < 720;

        // Panel datos personales (izquierda)
        const dpH = compact ? Math.min(220, area.h * 0.42) : area.h - 44;
        const dp = shell.createPanel(
            area.x + 4,
            area.y + 36,
            compact ? area.w - 8 : area.w * 0.48,
            dpH,
            'DATOS PERSONALES',
        );

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
            const col = i < 6 ? 0 : 1;
            const row = i < 6 ? i : i - 6;
            const fx = dp.x + col * (dp.w / 2);
            const fy = dp.y + row * 22;

            this.add.text(fx, fy, label, {
                fontFamily: THEME.fontBody,
                fontSize: '8px',
                color: THEME.textMuted,
            }).setDepth(8);

            const valColor = this.useFicticio ? THEME.textDim : THEME.text;
            const valText = this.add.text(fx + 72, fy, String(value || '—'), {
                fontFamily: THEME.fontMono,
                fontSize: '9px',
                color: valColor,
                wordWrap: { width: Math.max(70, dp.w / 2 - 78) },
            }).setDepth(8);

            if (!this.useFicticio) {
                valText.setInteractive({ useHandCursor: true });
                valText.on('pointerdown', () => {
                    valText.setColor(THEME.warning);
                    this.time.delayedCall(1200, () => valText.setColor(THEME.text));
                });
            }
        });

        // Panel idiomas (derecha arriba)
        const rightX = compact ? area.x + 4 : area.x + area.w * 0.52;
        const sideW = compact ? (area.w - 18) / 2 : area.w * 0.46;
        const sideY = compact ? area.y + 46 + dpH : area.y + 36;
        const lp = shell.createPanel(rightX, sideY, sideW, compact ? Math.max(132, area.h - dpH - 56) : 130, 'IDIOMAS');

        (this.profileData.idiomas || []).forEach((lang, i) => {
            const ly = lp.y + i * 38;
            const colors = LANG_COLORS[lang.rol] || { dot: THEME.cyan, text: THEME.text };

            const dotG = this.add.graphics().setDepth(8);
            dotG.fillStyle(colors.dot, 0.9);
            dotG.fillCircle(lp.x + 6, ly + 8, 4);

            this.add.text(lp.x + 16, ly, lang.idioma, {
                fontFamily: THEME.fontTitle,
                fontSize: '9px',
                color: THEME.text,
                fontStyle: 'bold',
            }).setDepth(8);

            this.add.text(lp.x + 16, ly + 14,
                `Declarado: ${lang.nivel_declarado}  •  Comprobado: ${lang.nivel_comprobado || '—'}`, {
                    fontFamily: THEME.fontBody,
                    fontSize: compact ? '7px' : '8px',
                    color: THEME.textDim,
                    wordWrap: { width: lp.w - 20 },
                }).setDepth(8);

            this.add.text(lp.x + 16, ly + 26, `Rol: ${lang.rol}`, {
                fontFamily: THEME.fontBody,
                fontSize: '7px',
                color: colors.text,
            }).setDepth(8);
        });

        // Panel documentos (derecha abajo)
        const docp = shell.createPanel(
            compact ? rightX + sideW + 10 : rightX,
            compact ? sideY : area.y + 174,
            sideW,
            compact ? Math.max(132, area.h - dpH - 56) : area.h - 182,
            'DOCUMENTOS',
        );

        (this.profileData.documentos || []).forEach((doc, i) => {
            this.add.text(docp.x, docp.y + i * 22, `✓ ${doc}`, {
                fontFamily: THEME.fontMono,
                fontSize: '11px',
                color: THEME.success,
            }).setDepth(8);
        });

        if (this.useFicticio) {
            this.add.text(docp.x, docp.y + 50,
                'Perfil ficticio — datos seguros\npara demostración.', {
                    fontFamily: THEME.fontBody,
                    fontSize: compact ? '7px' : '8px',
                    color: THEME.textMuted,
                    lineSpacing: 3,
                    wordWrap: { width: docp.w },
                }).setDepth(8);
        }

        this.cameras.main.fadeIn(300, 5, 10, 15);
    }

    _drawModeSelector(shell, area) {
        const y = area.y + 6;

        const ficticioG = this.add.graphics().setDepth(8);
        const personalG = this.add.graphics().setDepth(8);

        const drawPill = (g, x, label, active) => {
            g.clear();
            g.fillStyle(active ? 0x0a2840 : 0x080f18, active ? 1 : 0.6);
            g.fillRoundedRect(x, y, 130, 22, 4);
            g.lineStyle(1, active ? THEME.cyan : THEME.border, active ? 0.9 : 0.4);
            g.strokeRoundedRect(x, y, 130, 22, 4);
        };

        drawPill(ficticioG, area.x + 4, 'Ficticio', this.useFicticio);
        drawPill(personalG, area.x + 142, 'Personal', !this.useFicticio);

        this.add.text(area.x + 18, y + 6, this.useFicticio ? '● Ficticio (seguro)' : '○ Ficticio', {
            fontFamily: THEME.fontBody,
            fontSize: '9px',
            color: this.useFicticio ? THEME.textCyan : THEME.textMuted,
        }).setDepth(9).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.switchMode(true));

        this.add.text(area.x + 156, y + 6, this.useFicticio ? '○ Personal' : '● Personal', {
            fontFamily: THEME.fontBody,
            fontSize: '9px',
            color: this.useFicticio ? THEME.textMuted : THEME.textCyan,
        }).setDepth(9).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.switchMode(false));
    }

    switchMode(ficticio) {
        this.useFicticio = ficticio;
        if (ficticio) {
            this.profileData = { ...DEFAULT_PROFILE };
        }
        this.scene.restart({ profile: ficticio ? null : this.profileData });
    }
}
