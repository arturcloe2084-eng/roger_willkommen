/**
 * FundaShell — Shell UI compartido estilo NEUROVITA / clínica cognitiva.
 * Barra superior + área de contenido + menú inferior tipo tubo horizontal.
 * Usado por ContractMenuScene, PreparationScene, ProfileScene, ResultsScene.
 * DictionaryScene NO usa este shell (diseño propio intacto).
 */
import { SCENE_KEYS } from '../config/sceneKeys.js';
import { playerProgressStore } from '../services/player/PlayerProgressStore.js';
import { interactWithPC } from '../services/SceneBuilderUI.js';

export const THEME = Object.freeze({
    bg: 0x050a0f,
    bgPanel: 0x0a1520,
    sidebar: 0x060d14,
    cyan: 0x00d2ff,
    cyanDim: 0x0099bb,
    cyanGlow: 0x00d2ff,
    border: 0x1a3a5f,
    borderActive: 0x00d2ff,
    text: '#e8f4ff',
    textDim: '#6a8a9a',
    textMuted: '#3a5a6a',
    textCyan: '#00d2ff',
    accent: '#00d2ff',
    success: '#00ff88',
    warning: '#ffaa44',
    danger: '#ff4466',
    fontTitle: 'Inter, system-ui, sans-serif',
    fontBody: 'Inter, system-ui, sans-serif',
    fontMono: 'VT323, monospace',
    fontSizeBase: 14,
});

export const MENU_ITEMS = [
    {
        id: 'contract',
        num: '01',
        title: 'CONTRATO ACTIVO',
        desc: 'Anmeldung 2026 — Bürgeramt',
        scene: SCENE_KEYS.CONTRACT_MENU,
    },
    {
        id: 'profile',
        num: '02',
        title: 'MI FUNDA',
        desc: 'Currículum vivo de la funda',
        scene: SCENE_KEYS.PROFILE,
    },
    {
        id: 'prep',
        num: '03',
        title: 'PREPARARME',
        desc: 'Práctica antes del desafío',
        scene: SCENE_KEYS.PREPARATION,
    },
    {
        id: 'challenge',
        num: '04',
        title: 'DESAFÍO',
        desc: 'Entrar al Bürgeramt',
        scene: SCENE_KEYS.SCENE_ENGINE,
        challenge: true,
    },
    {
        id: 'progress',
        num: '05',
        title: 'PROGRESO',
        desc: 'XP, palabras y nivel',
        scene: SCENE_KEYS.CONTRACT_MENU,
        view: 'progress',
    },
    {
        id: 'builder',
        num: '06',
        title: 'CREADOR',
        desc: 'Constructor de escenas',
        action: 'builder',
    },
    {
        id: 'settings',
        num: '07',
        title: 'CONFIG',
        desc: 'Ajustes del sistema',
        action: 'settings',
    },
    {
        id: 'archive',
        num: '08',
        title: 'ARCHIVO',
        desc: 'Contenido histórico',
        scene: SCENE_KEYS.MAIN_MENU,
    },
];

const ICONS = {
    contract: '◈',
    profile: '◎',
    prep: '◇',
    challenge: '▶',
    progress: '▤',
    builder: '⚙',
    settings: '⚙',
    archive: '▣',
};

export class FundaShell {
    /**
     * @param {Phaser.Scene} scene
     * @param {{ activeId?: string, showQuickStart?: boolean }} options
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.activeId = options.activeId || 'contract';
        this.showQuickStart = options.showQuickStart !== false;
        const viewportW = Math.floor(Math.min(
            window.visualViewport?.width || Number.POSITIVE_INFINITY,
            document.documentElement.clientWidth || Number.POSITIVE_INFINITY,
            window.innerWidth || Number.POSITIVE_INFINITY,
            window.outerWidth || Number.POSITIVE_INFINITY,
            scene.cameras.main.width,
        ));
        const viewportH = Math.floor(Math.min(
            window.visualViewport?.height || Number.POSITIVE_INFINITY,
            document.documentElement.clientHeight || Number.POSITIVE_INFINITY,
            window.innerHeight || Number.POSITIVE_INFINITY,
            window.outerHeight || Number.POSITIVE_INFINITY,
            scene.cameras.main.height,
        ));
        this.width = Math.min(scene.cameras.main.width, viewportW);
        this.height = Math.min(scene.cameras.main.height, viewportH);
        this.isCompact = this.width < 720;
        this.sidebarW = 0; // Sin sidebar vertical
        this.contentX = this.isCompact ? 12 : 20;
        this.contentW = this.width - this.contentX * 2;
        this.topBarH = this.isCompact ? 68 : 80;
        this.bottomBarH = Math.min(148, Math.max(112, this.height * 0.18));
        this.depth = 5;
        this.menuIndex = Math.max(0, MENU_ITEMS.findIndex((item) => item.id === this.activeId));
        this.menuDrag = null;
        this.menuNodes = [];
    }

    /** Dibuja fondo, menú horizontal inferior y barra superior. Devuelve área de contenido. */
    build(userName = 'Vaclav') {
        this._drawBackground();
        this._drawTopBar(userName);
        this._drawHorizontalMenu();
        if (this.showQuickStart) {
            this._drawQuickStart();
        }
        this._drawFooterIcons();
        return {
            x: this.contentX,
            y: this.topBarH + 20,
            w: this.contentW,
            h: Math.max(260, this.height - this.topBarH - this.bottomBarH - 34),
        };
    }

    _drawBackground() {
        const g = this.scene.add.graphics().setDepth(0);
        g.fillStyle(THEME.bg, 1);
        g.fillRect(0, 0, this.width, this.height);

        // Grid sutil
        g.lineStyle(1, 0x0d1a28, 0.4);
        for (let x = 0; x < this.width; x += 32) {
            g.moveTo(x, 0);
            g.lineTo(x, this.height);
        }
        for (let y = 0; y < this.height; y += 32) {
            g.moveTo(0, y);
            g.lineTo(this.width, y);
        }
        g.strokePath();
    }

    _drawHorizontalMenu() {
        const menuY = this.height - this.bottomBarH;
        const centerX = this.width / 2;
        const centerY = menuY + this.bottomBarH * 0.56;
        const g = this.scene.add.graphics().setDepth(this.depth);

        g.fillStyle(0x03080d, 0.72);
        g.fillRect(0, menuY - 28, this.width, 28);
        g.fillStyle(0x060d14, 0.96);
        g.fillRoundedRect(-20, menuY, this.width + 40, this.bottomBarH + 24, 24);
        g.lineStyle(1, THEME.cyan, 0.38);
        g.strokeRoundedRect(-20, menuY, this.width + 40, this.bottomBarH + 24, 24);

        for (let i = 0; i < 4; i++) {
            g.lineStyle(1, THEME.cyan, 0.08 + i * 0.04);
            g.strokeEllipse(centerX, centerY + 26 + i * 7, this.width * (0.86 - i * 0.08), 72 - i * 10);
        }

        this.scene.add.text(centerX, menuY + 12, 'CLÍNICA DE ENTRENAMIENTO MENTAL', {
            fontFamily: THEME.fontTitle,
            fontSize: '12px',
            color: THEME.textCyan,
            fontStyle: 'bold',
        }).setOrigin(0.5, 0).setDepth(this.depth + 3);

        this.scene.add.text(centerX, menuY + 30, 'Arrastra o usa la rueda para mover el panel en ambas direcciones', {
            fontFamily: THEME.fontBody,
            fontSize: this.isCompact ? '9px' : '11px',
            color: THEME.textMuted,
        }).setOrigin(0.5, 0).setDepth(this.depth + 3);

        this.menuNodes = MENU_ITEMS.map((item, i) => this._createTubeMenuItem(item, i, centerY));
        this._layoutTubeMenu();

        const zone = this.scene.add.zone(centerX, centerY + 4, this.width, this.bottomBarH - 10)
            .setInteractive({ useHandCursor: true })
            .setDepth(this.depth + 8);

        zone.on('pointerdown', (pointer) => {
            this.menuDrag = { x: pointer.x, index: this.menuIndex, moved: false };
        });

        this.scene.input.on('pointermove', (pointer) => {
            if (!this.menuDrag) return;
            const delta = pointer.x - this.menuDrag.x;
            if (Math.abs(delta) > 4) this.menuDrag.moved = true;
            this.menuIndex = Phaser.Math.Clamp(
                this.menuDrag.index - delta / Math.max(92, this.width * 0.16),
                0,
                MENU_ITEMS.length - 1,
            );
            this._layoutTubeMenu();
        });

        this.scene.input.on('pointerup', (pointer) => {
            const drag = this.menuDrag;
            this.menuDrag = null;
            if (!drag) return;
            if (!drag.moved) {
                const nearest = this._nearestMenuIndex(pointer.x);
                const node = this.menuNodes[nearest];
                if (node && Math.abs(nearest - this.menuIndex) < 0.45) {
                    this._navigate(node.item);
                    return;
                }
                this.menuIndex = nearest;
            } else {
                this.menuIndex = Math.round(this.menuIndex);
            }
            this._tweenMenuTo(this.menuIndex);
        });

        this.scene.input.on('wheel', (_pointer, _objects, deltaX, deltaY) => {
            const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
            this.menuIndex = Phaser.Math.Clamp(this.menuIndex + delta / 420, 0, MENU_ITEMS.length - 1);
            this._layoutTubeMenu();
        });

        this._drawMenuArrow(centerX - Math.min(340, this.width * 0.36), centerY + 4, -1);
        this._drawMenuArrow(centerX + Math.min(340, this.width * 0.36), centerY + 4, 1);
    }

    _createTubeMenuItem(item, index, y) {
        const w = Math.min(170, Math.max(130, this.width * 0.16));
        const h = 72;
        const container = this.scene.add.container(this.width / 2, y).setDepth(this.depth + 2);
        const panel = this.scene.add.graphics();
        const icon = this.scene.add.text(0, -20, ICONS[item.id] || '•', {
            fontFamily: THEME.fontMono,
            fontSize: '22px',
            color: THEME.textDim,
        }).setOrigin(0.5);
        const title = this.scene.add.text(0, 2, item.title, {
            fontFamily: THEME.fontTitle,
            fontSize: '10px',
            color: THEME.textDim,
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: w - 18 },
        }).setOrigin(0.5);
        const desc = this.scene.add.text(0, 20, item.desc, {
            fontFamily: THEME.fontBody,
            fontSize: '9px',
            color: THEME.textMuted,
            align: 'center',
            wordWrap: { width: w - 20 },
            maxLines: 1,
        }).setOrigin(0.5);
        const num = this.scene.add.text(w / 2 - 16, -h / 2 + 9, item.num, {
            fontFamily: THEME.fontMono,
            fontSize: '12px',
            color: THEME.textMuted,
        }).setOrigin(0.5);

        container.add([panel, icon, title, desc, num]);
        return { item, index, container, panel, icon, title, desc, num, w, h, baseY: y };
    }

    _layoutTubeMenu() {
        const centerX = this.width / 2;
        const spread = Math.min(176, Math.max(104, this.width * 0.17));

        this.menuNodes.forEach((node) => {
            const offset = node.index - this.menuIndex;
            const clamped = Phaser.Math.Clamp(offset, -3.2, 3.2);
            const depthScale = Math.max(0.52, 1 - Math.abs(clamped) * 0.16);
            const x = centerX + Math.sin(clamped * 0.62) * spread * 1.55;
            const arcY = Math.abs(clamped) * 12;
            const alpha = Math.max(0.22, 1 - Math.abs(clamped) * 0.24);
            const isActive = Math.abs(offset) < 0.35;

            node.container.setPosition(x, node.baseY + arcY);
            node.container.setScale(depthScale);
            node.container.setAlpha(alpha);
            node.container.setDepth(this.depth + 2 + Math.round((4 - Math.abs(clamped)) * 10));

            this._redrawTubeMenuItem(node, isActive);
        });
    }

    _redrawTubeMenuItem(node, isActive) {
        const { panel, w, h } = node;
        const fill = isActive ? 0x0a2840 : 0x07111b;
        const stroke = isActive ? THEME.cyan : THEME.border;
        panel.clear();
        panel.fillStyle(fill, isActive ? 0.96 : 0.72);
        panel.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        panel.lineStyle(isActive ? 2 : 1, stroke, isActive ? 0.92 : 0.5);
        panel.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
        panel.lineStyle(1, THEME.cyan, isActive ? 0.24 : 0.08);
        panel.beginPath();
        panel.moveTo(-w / 2 + 14, h / 2 - 14);
        panel.lineTo(w / 2 - 14, h / 2 - 14);
        panel.strokePath();

        node.icon.setColor(isActive ? THEME.textCyan : THEME.textDim);
        node.title.setColor(isActive ? THEME.text : THEME.textDim);
        node.desc.setColor(isActive ? '#8bb8c8' : THEME.textMuted);
        node.num.setColor(isActive ? THEME.textCyan : THEME.textMuted);
    }

    _nearestMenuIndex(pointerX) {
        let best = 0;
        let distance = Number.POSITIVE_INFINITY;
        this.menuNodes.forEach((node) => {
            const d = Math.abs(node.container.x - pointerX);
            if (d < distance) {
                distance = d;
                best = node.index;
            }
        });
        return best;
    }

    _tweenMenuTo(index) {
        const target = Phaser.Math.Clamp(index, 0, MENU_ITEMS.length - 1);
        this.scene.tweens.addCounter({
            from: this.menuIndex,
            to: target,
            duration: 180,
            ease: 'Sine.easeOut',
            onUpdate: (tween) => {
                this.menuIndex = tween.getValue();
                this._layoutTubeMenu();
            },
            onComplete: () => {
                this.menuIndex = target;
                this._layoutTubeMenu();
            },
        });
    }

    _drawMenuArrow(x, y, direction) {
        const label = direction < 0 ? '<' : '>';
        const g = this.scene.add.graphics().setDepth(this.depth + 20);
        g.fillStyle(0x07111b, 0.72);
        g.fillCircle(x, y, 18);
        g.lineStyle(1, THEME.cyan, 0.55);
        g.strokeCircle(x, y, 18);
        this.scene.add.text(x, y - 1, label, {
            fontFamily: THEME.fontMono,
            fontSize: '24px',
            color: THEME.textCyan,
        }).setOrigin(0.5).setDepth(this.depth + 21);
        this.scene.add.zone(x, y, 40, 40)
            .setInteractive({ useHandCursor: true })
            .setDepth(this.depth + 22)
            .on('pointerdown', () => this._tweenMenuTo(Math.round(this.menuIndex) + direction));
    }

    _drawMenuItem(item, x, y, w, h) {
        const isActive = item.id === this.activeId;
        const g = this.scene.add.graphics().setDepth(this.depth + 1);

        if (isActive) {
            g.fillStyle(0x0a2030, 0.9);
            g.fillRoundedRect(x, y, w, h, 4);
            g.lineStyle(1, THEME.cyan, 0.9);
            g.strokeRoundedRect(x, y, w, h, 4);
            // Glow izquierdo
            g.fillStyle(THEME.cyan, 0.15);
            g.fillRect(x, y, 3, h);
        } else {
            g.fillStyle(0x080f18, 0.5);
            g.fillRoundedRect(x, y, w, h, 4);
            g.lineStyle(1, THEME.border, 0.4);
            g.strokeRoundedRect(x, y, w, h, 4);
        }

        const icon = ICONS[item.id] || '•';
        this.scene.add.text(x + 10, y + 10, icon, {
            fontFamily: THEME.fontMono,
            fontSize: '18px',
            color: isActive ? THEME.textCyan : THEME.textDim,
        }).setDepth(this.depth + 2);

        this.scene.add.text(x + 28, y + 8, item.title, {
            fontFamily: THEME.fontTitle,
            fontSize: '12px',
            color: isActive ? THEME.text : THEME.textDim,
            fontStyle: 'bold',
        }).setDepth(this.depth + 2);

        this.scene.add.text(x + 28, y + 24, item.desc, {
            fontFamily: THEME.fontBody,
            fontSize: '11px',
            color: THEME.textMuted,
            wordWrap: { width: w - 50 },
        }).setDepth(this.depth + 2);

        this.scene.add.text(x + w - 14, y + h / 2, item.num, {
            fontFamily: THEME.fontMono,
            fontSize: '14px',
            color: isActive ? THEME.textCyan : THEME.textMuted,
        }).setOrigin(0.5).setDepth(this.depth + 2);

        const zone = this.scene.add.zone(x + w / 2, y + h / 2, w, h)
            .setInteractive({ useHandCursor: true })
            .setDepth(this.depth + 3);

        zone.on('pointerover', () => {
            if (!isActive) {
                g.clear();
                g.fillStyle(0x0c1828, 0.8);
                g.fillRoundedRect(x, y, w, h, 4);
                g.lineStyle(1, THEME.cyanDim, 0.6);
                g.strokeRoundedRect(x, y, w, h, 4);
            }
        });

        zone.on('pointerout', () => {
            if (!isActive) {
                g.clear();
                g.fillStyle(0x080f18, 0.5);
                g.fillRoundedRect(x, y, w, h, 4);
                g.lineStyle(1, THEME.border, 0.4);
                g.strokeRoundedRect(x, y, w, h, 4);
            }
        });

        zone.on('pointerdown', () => this._navigate(item));
    }

    _navigate(item) {
        if (item.challenge) {
            this.scene.scene.start(SCENE_KEYS.SCENE_ENGINE, {
                sceneId: 'amt',
                challengeMode: true,
            });
            return;
        }
        if (item.view) {
            this.scene.scene.start(item.scene, { view: item.view });
            return;
        }
        if (item.action === 'builder') {
            this._openSceneBuilder();
            return;
        }
        if (item.action === 'settings') {
            this._openSettings();
            return;
        }
        if (item.scene && item.scene !== this.scene.scene.key) {
            this.scene.scene.start(item.scene);
        }
    }

    _openSceneBuilder() {
        interactWithPC(this.scene, { source: 'shell-menu' });
    }

    _openSettings() {
        this.scene.scene.start(SCENE_KEYS.MAIN_MENU, { openSettings: true });
    }

    _drawQuickStart() {
        // No se usa en el diseño horizontal - el botón de desafío está en el menú
    }

    _drawFooterIcons() {
        // Las acciones secundarias viven en el tubo inferior. Mantener la
        // barra superior despejada evita choques con avatar, estado y textos.
    }

    _drawTopBar(userName) {
        const y = 0;
        const g = this.scene.add.graphics().setDepth(this.depth);
        g.fillStyle(THEME.bgPanel, 0.6);
        g.fillRect(0, y, this.width, this.topBarH);
        g.lineStyle(1, THEME.border, 0.5);
        g.moveTo(0, this.topBarH);
        g.lineTo(this.width, this.topBarH);
        g.strokePath();

        this.scene.add.text(20, 12, this.isCompact ? 'Funda:' : 'Bienvenido, ', {
            fontFamily: THEME.fontBody,
            fontSize: this.isCompact ? '13px' : '16px',
            color: THEME.textDim,
        }).setDepth(this.depth + 1);

        this.scene.add.text(this.isCompact ? 70 : 120, 12, userName, {
            fontFamily: THEME.fontBody,
            fontSize: this.isCompact ? '13px' : '16px',
            color: THEME.text,
            fontStyle: 'bold',
        }).setDepth(this.depth + 1);

        if (!this.isCompact) {
            this.scene.add.text(20, 36, '¿Listo para entrenar tu funda hoy?', {
                fontFamily: THEME.fontBody,
                fontSize: '14px',
                color: THEME.textMuted,
            }).setDepth(this.depth + 1);
        }

        // Avatar + ID
        const avatarX = this.isCompact ? this.width - 118 : this.width - 220;
        const avatarG = this.scene.add.graphics().setDepth(this.depth + 1);
        avatarG.lineStyle(1, THEME.cyan, 0.7);
        avatarG.strokeCircle(avatarX, 30, 18);
        avatarG.fillStyle(0x1a3050, 0.8);
        avatarG.fillCircle(avatarX, 30, 16);

        this.scene.add.text(avatarX + 28, 18, this.isCompact ? 'V.S.' : 'VACLAV S.', {
            fontFamily: THEME.fontTitle,
            fontSize: this.isCompact ? '11px' : '14px',
            color: THEME.text,
            fontStyle: 'bold',
        }).setDepth(this.depth + 2);

        this.scene.add.text(avatarX + 28, 36, `EF-${playerProgressStore.level || 1}-0426`, {
            fontFamily: THEME.fontMono,
            fontSize: this.isCompact ? '11px' : '14px',
            color: THEME.textCyan,
        }).setDepth(this.depth + 2);

        // Status BPM equivalent → nivel XP
        if (this.isCompact) {
            this.scene.add.text(this.width - 48, 38, `Nv.${playerProgressStore.level || 1}`, {
                fontFamily: THEME.fontMono,
                fontSize: '14px',
                color: THEME.success,
            }).setDepth(this.depth + 2);
            return;
        }

        this.scene.add.text(this.width - 100, 18, 'ESTADO', {
            fontFamily: THEME.fontTitle,
            fontSize: '12px',
            color: THEME.textMuted,
        }).setDepth(this.depth + 2);

        this.scene.add.text(this.width - 100, 36, `Nv.${playerProgressStore.level || 1}`, {
            fontFamily: THEME.fontMono,
            fontSize: '18px',
            color: THEME.success,
        }).setDepth(this.depth + 2);

        // Mini pulse line
        const pulseG = this.scene.add.graphics().setDepth(this.depth + 1);
        pulseG.lineStyle(1, THEME.cyan, 0.6);
        let px = this.width - 50;
        for (let i = 0; i < 8; i++) {
            const h = 4 + Math.sin(i * 1.2) * 3;
            pulseG.moveTo(px + i * 4, 45);
            pulseG.lineTo(px + i * 4, 45 - h);
        }
        pulseG.strokePath();
    }

    /**
     * Crea un panel glassmórfico y devuelve coordenadas internas.
     */
    createPanel(x, y, w, h, title, options = {}) {
        const g = this.scene.add.graphics().setDepth(this.depth + 1);
        const alpha = options.alpha ?? 0.75;
        const accent = options.accentColor ?? THEME.cyan;

        g.fillStyle(THEME.bgPanel, alpha);
        g.fillRoundedRect(x, y, w, h, 8);
        g.lineStyle(1, accent, options.borderAlpha ?? 0.5);
        g.strokeRoundedRect(x, y, w, h, 8);

        if (title) {
            g.fillStyle(accent, 0.7);
            g.fillRect(x + 14, y + 12, w - 28, 2);
            this.scene.add.text(x + 16, y + 16, title, {
                fontFamily: THEME.fontTitle,
                fontSize: '12px',
                color: THEME.textCyan,
                fontStyle: 'bold',
            }).setDepth(this.depth + 2);
        }

        return { x: x + 14, y: y + (title ? 36 : 14), w: w - 28, h: h - (title ? 50 : 28) };
    }

    /** Gauge circular estilo NEUROVITA */
    drawGauge(x, y, radius, value, label, sublabel) {
        const g = this.scene.add.graphics().setDepth(this.depth + 2);
        const pct = Math.min(100, Math.max(0, value)) / 100;

        // Fondo
        g.lineStyle(3, 0x1a3050, 0.8);
        g.beginPath();
        g.arc(x, y, radius, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(270), false);
        g.strokePath();

        // Relleno
        g.lineStyle(3, THEME.cyan, 0.9);
        g.beginPath();
        g.arc(x, y, radius, Phaser.Math.DegToRad(-90),
            Phaser.Math.DegToRad(-90 + 360 * pct), false);
        g.strokePath();

        this.scene.add.text(x, y - 4, `${value}%`, {
            fontFamily: THEME.fontMono,
            fontSize: '14px',
            color: THEME.text,
        }).setOrigin(0.5).setDepth(this.depth + 3);

        if (label) {
            this.scene.add.text(x, y + radius + 10, label, {
                fontFamily: THEME.fontTitle,
                fontSize: '7px',
                color: THEME.textDim,
            }).setOrigin(0.5).setDepth(this.depth + 3);
        }

        if (sublabel) {
            this.scene.add.text(x, y + radius + 22, sublabel, {
                fontFamily: THEME.fontBody,
                fontSize: '8px',
                color: THEME.textCyan,
            }).setOrigin(0.5).setDepth(this.depth + 3);
        }
    }

    /** Esfera decorativa central (equivalente al cerebro 3D) */
    drawDecorSphere(cx, cy, radius) {
        const g = this.scene.add.graphics().setDepth(this.depth + 1);

        // Pedestal
        g.fillStyle(THEME.cyan, 0.08);
        g.fillEllipse(cx, cy + radius + 12, radius * 1.6, 16);
        g.lineStyle(1, THEME.cyan, 0.3);
        g.strokeEllipse(cx, cy + radius + 12, radius * 1.6, 16);

        // Anillos
        for (let i = 3; i >= 1; i--) {
            g.lineStyle(1, THEME.cyan, 0.15 * i);
            g.strokeCircle(cx, cy, radius * (i / 3.5));
        }

        // Líneas de latitud
        g.lineStyle(1, THEME.cyan, 0.25);
        for (let lat = -2; lat <= 2; lat++) {
            const ry = radius * 0.3 * Math.abs(lat);
            g.strokeEllipse(cx, cy + lat * radius * 0.25, radius, ry);
        }

        // Núcleo brillante
        g.fillStyle(THEME.cyan, 0.12);
        g.fillCircle(cx, cy, radius * 0.35);
        g.lineStyle(1, THEME.cyan, 0.6);
        g.strokeCircle(cx, cy, radius * 0.35);
    }

    /** Barra de progreso horizontal */
    drawProgressBar(x, y, w, h, value, color = THEME.cyan) {
        const g = this.scene.add.graphics().setDepth(this.depth + 2);
        const pct = Math.min(100, Math.max(0, value)) / 100;

        g.fillStyle(0x1a2030, 0.8);
        g.fillRoundedRect(x, y, w, h, 3);
        g.fillStyle(color, 0.9);
        g.fillRoundedRect(x, y, w * pct, h, 3);
        g.lineStyle(1, color, 0.5);
        g.strokeRoundedRect(x, y, w, h, 3);
    }
}
