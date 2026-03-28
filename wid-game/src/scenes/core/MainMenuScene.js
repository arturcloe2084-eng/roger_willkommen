import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';
import { i18n, LANGUAGES } from '../../services/i18n.js';
import { interactWithPC } from '../../services/SceneBuilderUI.js';

const MENU_ART_SIZE = Object.freeze({
    width: 1536,
    height: 1024,
});

const HOTSPOT_COLOR = 0xffd64f;
const HOTSPOT_LINE_COLOR = 0xffe48a;

const MENU_HOTSPOTS = Object.freeze([
    {
        id: 'play',
        kind: 'desk',
        hotkey: 'P',
        badge: 'PLAY',
        titleKey: 'menu_hotspot_play_title',
        descriptionKey: 'menu_hotspot_play_desc',
        endpoint: '/story/start',
        action: 'start',
        frame: { x: 412, y: 396, w: 224, h: 244, rotation: -0.05 },
        hit: { x: 412, y: 396, w: 286, h: 300 },
    },
    {
        id: 'builder',
        kind: 'desk',
        hotkey: 'A',
        badge: 'DISK A',
        titleKey: 'menu_hotspot_builder_title',
        descriptionKey: 'menu_hotspot_builder_desc',
        endpoint: '/tools/scene-builder',
        action: 'builder',
        frame: { x: 918, y: 556, w: 136, h: 170, rotation: 0.0 },
        hit: { x: 918, y: 556, w: 208, h: 224 },
    },
    {
        id: 'dictionary',
        kind: 'desk',
        hotkey: 'D',
        badge: 'BOOK',
        titleKey: 'menu_hotspot_dictionary_title',
        descriptionKey: 'menu_hotspot_dictionary_desc',
        endpoint: '/tools/dictionary',
        action: 'dictionary',
        frame: { x: 884, y: 666, w: 302, h: 148, rotation: 0.08 },
        hit: { x: 884, y: 666, w: 364, h: 198 },
    },
    {
        id: 'settings',
        kind: 'corner',
        hotkey: 'S',
        badge: 'SYSTEM',
        titleKey: 'menu_hotspot_settings_title',
        descriptionKey: 'menu_hotspot_settings_desc',
        endpoint: '/system/settings',
        action: 'settings',
    },
]);

function scaleRect(width, height, rect) {
    return {
        x: (rect.x / MENU_ART_SIZE.width) * width,
        y: (rect.y / MENU_ART_SIZE.height) * height,
        w: (rect.w / MENU_ART_SIZE.width) * width,
        h: (rect.h / MENU_ART_SIZE.height) * height,
        rotation: rect.rotation || 0,
    };
}

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.MAIN_MENU);
        this._settingsOverlay = null;
    }

    create() {
        const { width, height } = this.cameras.main;
        const menuBgKey = this.textures.exists('bg_main_menu_new') ? 'bg_main_menu_new' : 'bg_fallback_generic';

        this._resetMenuState();

        this.add.image(width / 2, height / 2, menuBgKey)
            .setDisplaySize(width, height)
            .setDepth(0);

        this.add.rectangle(width / 2, height / 2, width, height, 0x040506, 0.2).setDepth(1);
        this.add.rectangle(width / 2, height - 72, width, 144, 0x000000, 0.18).setDepth(1);
        this.add.rectangle(width / 2, 44, width, 88, 0x040506, 0.1).setDepth(1);

        this._uiContainer = this.add.container(0, 0).setDepth(20);

        this._createScreenChrome(width, height);
        this._createHeaderPanel(width);
        this._createInfoDock(width, height);
        this._createShortcutDock(width, height);
        this._createHotspots(width, height);
        this._setDockIdleState();
        this._registerMenuInputs();
        this._registerSceneLifecycle();

        this.cameras.main.fadeIn(450, 0, 0, 0);

        if (this.cache.video.exists('bg_intro_video')) {
            this._startIntroSequence(width, height);
        } else {
            this._startMenuEntrance();
        }
    }

    _resetMenuState() {
        this._hotspots = [];
        this._keyboardHandlers = [];
        this._entranceTargets = [];
        this._activeHotspotId = null;
        this._focusSource = null;
        this._menuHotspotsEnabled = false;
        this._entranceStarted = false;
        this._introVideo = null;
        this._introSkipHandler = null;
        this._didCleanup = false;
    }

    _createScreenChrome(width, height) {
        const container = this.add.container(0, 0);
        const border = this.add.rectangle(width / 2, height / 2, width - 24, height - 24, 0x000000, 0)
            .setStrokeStyle(1, 0xd4dce9, 0.08);
        const lowerAccent = this.add.rectangle(width / 2, height - 26, width - 78, 1, HOTSPOT_COLOR, 0.18);
        const scanlines = this.add.graphics();

        scanlines.lineStyle(1, 0xffffff, 0.03);
        for (let y = 0; y < height; y += 4) {
            scanlines.moveTo(0, y);
            scanlines.lineTo(width, y);
        }
        scanlines.strokePath();

        container.add([scanlines, border, lowerAccent]);
        this._uiContainer.add(container);
        this._primeEntrance(container, { delay: 0, duration: 1200 });
    }

    _createHeaderPanel(width) {
        const panelWidth = Math.min(470, width - 84);
        const container = this.add.container(42, 28);
        const bg = this.add.rectangle(panelWidth / 2, 72, panelWidth, 144, 0x070a0f, 0.78)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x738297, 0.5);
        const accent = this.add.rectangle(panelWidth / 2, 18, panelWidth - 28, 2, HOTSPOT_COLOR, 0.85).setOrigin(0.5);
        const bootText = this.add.text(18, 14, 'RETRO STUDY OS', {
            fontFamily: 'VT323',
            fontSize: '16px',
            color: '#8f9db1',
            letterSpacing: 1,
        });
        const titleA = this.add.text(18, 28, 'WILLKOMMEN', {
            fontFamily: '"Press Start 2P"',
            fontSize: '17px',
            color: '#f7f0d1',
        });
        const titleB = this.add.text(18, 56, 'IN DEUTSCHLAND', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#ffd76f',
        });
        const subtitle = this.add.text(18, 82, i18n.t('menu_subtitle'), {
            fontFamily: 'VT323',
            fontSize: '22px',
            color: '#d8dee8',
            wordWrap: { width: panelWidth - 152 },
        });
        const lore = this.add.text(18, 104, i18n.t('menu_lore'), {
            fontFamily: 'VT323',
            fontSize: '15px',
            color: '#94a1b3',
            wordWrap: { width: panelWidth - 152 },
        });

        const stats = [
            { label: i18n.t('hud_day'), value: playerProgressStore.story?.day ?? 1 },
            { label: i18n.t('hud_lvl'), value: playerProgressStore.level ?? 1 },
            { label: i18n.t('hud_words'), value: playerProgressStore.learnedWords?.length ?? 0 },
        ];

        container.add([bg, accent, bootText, titleA, titleB, subtitle, lore]);

        stats.forEach((stat, index) => {
            const chip = this._createStatusChip(panelWidth - 112, 26 + (index * 34), stat.label, stat.value);
            container.add(chip);
        });

        this._uiContainer.add(container);
        this._primeEntrance(container, { offsetY: 18, delay: 160, duration: 900 });
        this._headerPanel = container;
    }

    _createStatusChip(x, y, label, value) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 96, 28, 0x10151f, 0.92)
            .setOrigin(0)
            .setStrokeStyle(1, 0x334156, 0.8);
        const labelText = this.add.text(8, 4, String(label).toUpperCase(), {
            fontFamily: 'VT323',
            fontSize: '14px',
            color: '#8d9aae',
        });
        const valueText = this.add.text(88, 4, String(value), {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#ffe28c',
        }).setOrigin(1, 0);

        container.add([bg, labelText, valueText]);
        return container;
    }

    _createInfoDock(width, height) {
        const panelWidth = Math.min(458, width - 86);
        const panelHeight = 120;
        const container = this.add.container(42, height - panelHeight - 28);
        const bg = this.add.rectangle(panelWidth / 2, panelHeight / 2, panelWidth, panelHeight, 0x05070b, 0.84)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x6d788a, 0.65);
        const accent = this.add.rectangle(panelWidth / 2, 14, panelWidth - 28, 2, HOTSPOT_COLOR, 0.85).setOrigin(0.5);
        const keyBg = this.add.rectangle(panelWidth - 46, 30, 74, 30, 0x171f2a, 0.96)
            .setStrokeStyle(1, HOTSPOT_COLOR, 0.75);
        const keyText = this.add.text(panelWidth - 46, 20, 'MOUSE', {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#ffe28c',
        }).setOrigin(0.5, 0);

        const titleText = this.add.text(18, 18, 'INTERACTIVE DESK', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#f6f3e6',
        });
        const endpointText = this.add.text(18, 38, `${i18n.t('menu_endpoint')}: /desk/main-access`, {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#ffd86f',
        });
        const descriptionText = this.add.text(18, 62, i18n.t('menu_hotspot_hint'), {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#d4dbe6',
            wordWrap: { width: panelWidth - 126 },
        });
        const actionText = this.add.text(18, 96, i18n.t('menu_hotspot_activate'), {
            fontFamily: 'VT323',
            fontSize: '15px',
            color: '#8f9aad',
            wordWrap: { width: panelWidth - 36 },
        });

        container.add([bg, accent, keyBg, keyText, titleText, endpointText, descriptionText, actionText]);
        this._uiContainer.add(container);
        this._primeEntrance(container, { offsetY: 24, delay: 260, duration: 900 });

        this._infoDock = {
            container,
            titleText,
            endpointText,
            descriptionText,
            actionText,
            keyText,
        };
    }

    _createShortcutDock(width, height) {
        const panelWidth = 258;
        const panelHeight = 110;
        const x = width - panelWidth - 34;
        const y = height - panelHeight - 36;
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(panelWidth / 2, panelHeight / 2, panelWidth, panelHeight, 0x070a0f, 0.72)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x607085, 0.45);
        const accent = this.add.rectangle(panelWidth / 2, 14, panelWidth - 24, 2, HOTSPOT_COLOR, 0.6).setOrigin(0.5);
        const title = this.add.text(16, 12, i18n.t('menu_controls_title').toUpperCase(), {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#9ba7b7',
        });

        container.add([bg, accent, title]);
        this._createShortcutChip(container, 16, 38, 'P', 'PLAY');
        this._createShortcutChip(container, 128, 38, 'A', 'DISK A');
        this._createShortcutChip(container, 16, 64, 'D', 'BOOK');
        this._createShortcutChip(container, 128, 64, 'S', 'SYSTEM');
        this._createShortcutChip(container, 16, 90, 'ENTER', i18n.t('menu_open').toUpperCase(), { keyWidth: 54, textColor: '#f7efc4' });
        this._createShortcutChip(container, 136, 90, 'SPACE', i18n.t('menu_open').toUpperCase(), { keyWidth: 54, textColor: '#f7efc4' });

        const versionText = this.add.text(panelWidth - 12, panelHeight - 14, 'v0.5.0', {
            fontFamily: 'VT323',
            fontSize: '15px',
            color: '#6f7b8e',
        }).setOrigin(1, 1);
        container.add(versionText);

        this._uiContainer.add(container);
        this._primeEntrance(container, { offsetY: 18, delay: 360, duration: 860 });
        this._shortcutDock = container;
    }

    _createShortcutChip(parent, x, y, key, label, opts = {}) {
        const keyWidth = opts.keyWidth || 32;
        const container = this.add.container(x, y);
        const keyBg = this.add.rectangle(0, 0, keyWidth, 20, 0x18212e, 0.96)
            .setOrigin(0)
            .setStrokeStyle(1, HOTSPOT_COLOR, 0.55);
        const keyText = this.add.text(keyWidth / 2, 3, key, {
            fontFamily: 'VT323',
            fontSize: '16px',
            color: '#ffe08a',
        }).setOrigin(0.5, 0);
        const labelText = this.add.text(keyWidth + 8, 1, label, {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: opts.textColor || '#d7deea',
        });

        container.add([keyBg, keyText, labelText]);
        parent.add(container);
    }

    _createHotspots(width, height) {
        this._hotspots = MENU_HOTSPOTS.map((def) => {
            if (def.kind === 'corner') {
                return this._createCornerHotspot(def, width);
            }
            return this._createDeskHotspot(def, width, height);
        });
    }

    _createDeskHotspot(def, width, height) {
        const frame = scaleRect(width, height, def.frame);
        const hit = scaleRect(width, height, def.hit);
        const frameContainer = this.add.container(frame.x, frame.y)
            .setDepth(28)
            .setAlpha(0)
            .setScale(0.96)
            .setRotation(frame.rotation);
        const glow = this.add.graphics();
        glow.fillStyle(HOTSPOT_COLOR, 0.08);
        glow.fillRoundedRect(-frame.w / 2, -frame.h / 2, frame.w, frame.h, 14);
        glow.lineStyle(5, HOTSPOT_COLOR, 0.12);
        glow.strokeRoundedRect(-frame.w / 2, -frame.h / 2, frame.w, frame.h, 14);

        const outline = this.add.graphics();
        outline.lineStyle(2, HOTSPOT_LINE_COLOR, 0.95);
        outline.strokeRoundedRect(-frame.w / 2, -frame.h / 2, frame.w, frame.h, 14);
        this._drawHighlightCorners(outline, frame.w, frame.h);

        const badgeWidth = Math.max(92, (def.badge.length * 9) + 36);
        const badgeBg = this.add.rectangle(-frame.w / 2 + (badgeWidth / 2), -frame.h / 2 - 18, badgeWidth, 24, 0x150f02, 0.98)
            .setStrokeStyle(1, HOTSPOT_COLOR, 0.78);
        const badgeText = this.add.text(badgeBg.x, badgeBg.y - 1, `[${def.hotkey}] ${def.badge}`, {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#ffe28c',
        }).setOrigin(0.5);

        frameContainer.add([glow, outline, badgeBg, badgeText]);

        const zone = this.add.zone(hit.x, hit.y, hit.w, hit.h).setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            if (!this._menuHotspotsEnabled || this._settingsOverlay) return;
            this._focusHotspot(def.id, 'pointer');
        });

        zone.on('pointerout', () => {
            if (this._activeHotspotId === def.id && this._focusSource === 'pointer') {
                this._clearHotspotFocus(true);
            }
        });

        zone.on('pointerdown', () => {
            if (!this._menuHotspotsEnabled || this._settingsOverlay) return;
            this._activateHotspot(def.id);
        });

        this._uiContainer.add(zone);
        this._uiContainer.add(frameContainer);

        return {
            ...def,
            frameContainer,
            zone,
        };
    }

    _drawHighlightCorners(graphics, width, height) {
        const halfW = width / 2;
        const halfH = height / 2;
        const corner = Math.min(26, Math.max(16, width * 0.12));

        graphics.beginPath();
        graphics.moveTo(-halfW - 4, -halfH + corner);
        graphics.lineTo(-halfW - 4, -halfH - 4);
        graphics.lineTo(-halfW + corner, -halfH - 4);

        graphics.moveTo(halfW - corner, -halfH - 4);
        graphics.lineTo(halfW + 4, -halfH - 4);
        graphics.lineTo(halfW + 4, -halfH + corner);

        graphics.moveTo(-halfW - 4, halfH - corner);
        graphics.lineTo(-halfW - 4, halfH + 4);
        graphics.lineTo(-halfW + corner, halfH + 4);

        graphics.moveTo(halfW - corner, halfH + 4);
        graphics.lineTo(halfW + 4, halfH + 4);
        graphics.lineTo(halfW + 4, halfH - corner);
        graphics.strokePath();
    }

    _createCornerHotspot(def, width) {
        const x = width - 106;
        const y = 46;
        const container = this.add.container(x, y)
            .setDepth(30)
            .setScale(1);
        const bg = this.add.rectangle(0, 0, 150, 42, 0x090c12, 0.82)
            .setStrokeStyle(1, 0x6d7d92, 0.55);
        const keyBg = this.add.rectangle(-48, 0, 34, 22, 0x192331, 0.92)
            .setStrokeStyle(1, HOTSPOT_COLOR, 0.72);
        const keyText = this.add.text(-48, -1, def.hotkey, {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#ffe08a',
        }).setOrigin(0.5);
        const labelText = this.add.text(-20, -1, 'SYSTEM', {
            fontFamily: 'VT323',
            fontSize: '21px',
            color: '#dbe2ec',
        }).setOrigin(0, 0.5);

        container.add([bg, keyBg, keyText, labelText]);
        bg.setInteractive({ useHandCursor: true });

        bg.on('pointerover', () => {
            if (!this._menuHotspotsEnabled || this._settingsOverlay) return;
            this._focusHotspot(def.id, 'pointer');
        });

        bg.on('pointerout', () => {
            if (this._activeHotspotId === def.id && this._focusSource === 'pointer') {
                this._clearHotspotFocus(true);
            }
        });

        bg.on('pointerdown', () => {
            if (!this._menuHotspotsEnabled || this._settingsOverlay) return;
            this._activateHotspot(def.id);
        });

        this._uiContainer.add(container);
        this._primeEntrance(container, { offsetY: -10, delay: 420, duration: 780 });

        return {
            ...def,
            container,
            bg,
            keyBg,
            keyText,
            labelText,
        };
    }

    _setDockIdleState() {
        if (!this._infoDock) return;
        this._infoDock.titleText.setText('INTERACTIVE DESK');
        this._infoDock.endpointText.setText(`${i18n.t('menu_endpoint')}: /desk/main-access`);
        this._infoDock.descriptionText.setText(i18n.t('menu_hotspot_hint'));
        this._infoDock.actionText.setText(i18n.t('menu_hotspot_activate'));
        this._infoDock.keyText.setText('MOUSE');
    }

    _updateInfoDock(hotspot) {
        if (!this._infoDock || !hotspot) return;
        this._infoDock.titleText.setText(i18n.t(hotspot.titleKey));
        this._infoDock.endpointText.setText(`${i18n.t('menu_endpoint')}: ${hotspot.endpoint}`);
        this._infoDock.descriptionText.setText(i18n.t(hotspot.descriptionKey));
        this._infoDock.actionText.setText(i18n.t('menu_hotspot_activate'));
        this._infoDock.keyText.setText(`[${hotspot.hotkey}]`);
    }

    _findHotspot(id) {
        return this._hotspots.find((hotspot) => hotspot.id === id) || null;
    }

    _focusOrActivateHotspot(id) {
        if (!this._menuHotspotsEnabled || this._settingsOverlay) return;
        if (this._activeHotspotId === id && this._focusSource === 'keyboard') {
            this._activateHotspot(id);
            return;
        }
        this._focusHotspot(id, 'keyboard');
    }

    _focusHotspot(id, source = 'keyboard') {
        const hotspot = this._findHotspot(id);
        if (!hotspot) return;

        if (this._activeHotspotId && this._activeHotspotId !== id) {
            const prev = this._findHotspot(this._activeHotspotId);
            this._setHotspotVisualState(prev, false);
        }

        this._activeHotspotId = id;
        this._focusSource = source;
        this._setHotspotVisualState(hotspot, true);
        this._updateInfoDock(hotspot);
    }

    _clearHotspotFocus(force = false) {
        if (!force && this._focusSource === 'keyboard') return;

        const hotspot = this._findHotspot(this._activeHotspotId);
        if (hotspot) {
            this._setHotspotVisualState(hotspot, false);
        }

        this._activeHotspotId = null;
        this._focusSource = null;
        this._setDockIdleState();
    }

    _setHotspotVisualState(hotspot, active) {
        if (!hotspot) return;

        if (hotspot.kind === 'corner') {
            hotspot.bg.setFillStyle(active ? 0x1c1405 : 0x090c12, active ? 0.98 : 0.82);
            hotspot.bg.setStrokeStyle(active ? 2 : 1, active ? HOTSPOT_COLOR : 0x6d7d92, active ? 0.95 : 0.55);
            hotspot.keyBg.setFillStyle(active ? HOTSPOT_COLOR : 0x192331, active ? 1 : 0.92);
            hotspot.keyText.setColor(active ? '#160f02' : '#ffe08a');
            hotspot.labelText.setColor(active ? '#fff0bb' : '#dbe2ec');
            this.tweens.killTweensOf(hotspot.container);
            this.tweens.add({
                targets: hotspot.container,
                scale: active ? 1.03 : 1,
                duration: active ? 130 : 110,
                ease: 'Cubic.easeOut',
            });
            return;
        }

        this.tweens.killTweensOf(hotspot.frameContainer);
        this.tweens.add({
            targets: hotspot.frameContainer,
            alpha: active ? 1 : 0,
            scale: active ? 1 : 0.96,
            duration: active ? 150 : 120,
            ease: active ? 'Back.easeOut' : 'Quad.easeIn',
        });
    }

    _cycleHotspots() {
        if (!this._menuHotspotsEnabled || this._settingsOverlay) return;

        const ids = this._hotspots.map((hotspot) => hotspot.id);
        const currentIndex = ids.indexOf(this._activeHotspotId);
        const nextId = ids[(currentIndex + 1) % ids.length];
        this._focusHotspot(nextId, 'keyboard');
    }

    _activateCurrentOrStart() {
        if (this._settingsOverlay || !this._menuHotspotsEnabled) return;

        if (this._activeHotspotId) {
            this._activateHotspot(this._activeHotspotId);
            return;
        }

        this._startGame();
    }

    _activateHotspot(id) {
        const hotspot = this._findHotspot(id);
        if (!hotspot || this._settingsOverlay) return;

        switch (hotspot.action) {
            case 'start':
                this._startGame();
                break;
            case 'builder':
                this._openSceneBuilder();
                break;
            case 'dictionary':
                this._openDictionary();
                break;
            case 'settings':
                this._openSettings();
                break;
            default:
                break;
        }
    }

    _registerMenuInputs() {
        const register = (eventName, handler) => {
            this.input.keyboard.on(eventName, handler);
            this._keyboardHandlers.push({ eventName, handler });
        };

        register('keydown-P', () => this._focusOrActivateHotspot('play'));
        register('keydown-A', () => this._focusOrActivateHotspot('builder'));
        register('keydown-D', () => this._focusOrActivateHotspot('dictionary'));
        register('keydown-S', () => this._focusOrActivateHotspot('settings'));
        register('keydown-ENTER', () => this._activateCurrentOrStart());
        register('keydown-SPACE', () => this._activateCurrentOrStart());
        register('keydown-ESC', () => {
            if (this._settingsOverlay) {
                this._closeSettings();
                return;
            }
            this._clearHotspotFocus(true);
        });
        register('keydown-TAB', (event) => {
            event.preventDefault();
            this._cycleHotspots();
        });
    }

    _registerSceneLifecycle() {
        this.events.on('wake', this._handleWake, this);
        this.events.once('shutdown', this._cleanupScene, this);
        this.events.once('destroy', this._cleanupScene, this);
    }

    _handleWake() {
        this.cameras.main.resetFX();
        this.cameras.main.fadeIn(320, 0, 0, 0);
        this._menuHotspotsEnabled = true;
        if (this.input?.keyboard) {
            this.input.keyboard.enabled = true;
        }
        this._clearHotspotFocus(true);
    }

    _cleanupScene() {
        if (this._didCleanup) return;
        this._didCleanup = true;

        this._removeIntroPointerSkip();

        if (this._introVideo?.active) {
            if (typeof this._introVideo.stop === 'function') {
                this._introVideo.stop();
            }
            this._introVideo.destroy();
        }
        this._introVideo = null;

        this._closeSettings();

        if (this.input?.keyboard) {
            this._keyboardHandlers.forEach(({ eventName, handler }) => {
                this.input.keyboard.off(eventName, handler);
            });
        }
        this._keyboardHandlers = [];
        this.events.off('wake', this._handleWake, this);
    }

    _primeEntrance(target, { offsetY = 0, delay = 0, duration = 800 }) {
        target.setAlpha(0);
        target.y += offsetY;
        this._entranceTargets.push({
            target,
            finalY: target.y - offsetY,
            delay,
            duration,
        });
    }

    _startMenuEntrance() {
        if (this._entranceStarted) return;
        this._entranceStarted = true;

        this._entranceTargets.forEach(({ target, finalY, delay, duration }) => {
            this.time.delayedCall(delay, () => {
                this.tweens.add({
                    targets: target,
                    alpha: 1,
                    y: finalY,
                    duration,
                    ease: 'Cubic.easeOut',
                });
            });
        });

        this.time.delayedCall(940, () => {
            this._menuHotspotsEnabled = true;
        });
    }

    _startIntroSequence(width, height) {
        const introVideo = this.add.video(width / 2, height / 2, 'bg_intro_video').setDepth(10);
        this._introVideo = introVideo;
        introVideo.play(false);
        introVideo.setVolume(1.0);

        const adjustScale = () => {
            const htmlVideo = introVideo.video;
            if (!introVideo.active || !htmlVideo?.videoWidth) return;

            const scale = Math.min(width / htmlVideo.videoWidth, height / htmlVideo.videoHeight) || 1;
            introVideo.setScale(scale);
        };

        [100, 450, 1000].forEach((delay) => this.time.delayedCall(delay, adjustScale));
        introVideo.on('play', adjustScale);
        introVideo.on('complete', () => {
            this._fadeOutIntroVideo(850);
            this._startMenuEntrance();
        });

        this._introSkipHandler = () => {
            if (!this._introVideo || !this._introVideo.active) return;
            const isPlaying = typeof this._introVideo.isPlaying === 'function'
                ? this._introVideo.isPlaying()
                : Boolean(this._introVideo.isPlaying);
            if (!isPlaying) return;
            this._fadeOutIntroVideo(320, true);
            this._startMenuEntrance();
        };

        this.input.on('pointerdown', this._introSkipHandler);
    }

    _fadeOutIntroVideo(duration = 800, stopVideo = false) {
        const introVideo = this._introVideo;
        if (!introVideo) return;

        this._introVideo = null;
        this._removeIntroPointerSkip();

        this.tweens.add({
            targets: introVideo,
            alpha: 0,
            duration,
            onComplete: () => {
                if (stopVideo && typeof introVideo.stop === 'function') {
                    introVideo.stop();
                }
                if (introVideo.active) {
                    introVideo.destroy();
                }
            }
        });
    }

    _removeIntroPointerSkip() {
        if (!this._introSkipHandler) return;
        this.input.off('pointerdown', this._introSkipHandler);
        this._introSkipHandler = null;
    }

    _startGame() {
        if (this._settingsOverlay) return;
        const scenesData = this.cache.json.get('scenesData') || {};
        const startScene = scenesData.startScene || 'apartamento';

        this.cameras.main.fadeOut(380, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(SCENE_KEYS.SCENE_ENGINE, { sceneId: startScene });
        });
    }

    _openDictionary() {
        if (this._settingsOverlay) return;
        this.cameras.main.fadeOut(260, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.sleep(SCENE_KEYS.MAIN_MENU);
            this.scene.run(SCENE_KEYS.DICTIONARY, { returnScene: SCENE_KEYS.MAIN_MENU });
        });
    }

    _openSceneBuilder() {
        if (this._settingsOverlay) return;
        interactWithPC(this, { source: 'menu' });
    }

    _openSettings() {
        if (this._settingsOverlay) return;

        if (this.input?.keyboard) {
            this.input.keyboard.enabled = false;
        }

        const container = document.body;
        const el = document.createElement('div');
        el.id = 'settings-overlay';
        el.innerHTML = this._getSettingsHTML();
        container.appendChild(el);
        this._settingsOverlay = el;

        if (!document.getElementById('settings-styles')) {
            const style = document.createElement('style');
            style.id = 'settings-styles';
            style.textContent = this._getSettingsCSS();
            document.head.appendChild(style);
        }

        this._bindSettingsEvents();
        this._bindPreviewUpdater();
        this._focusHotspot('settings', 'keyboard');
    }

    _closeSettings() {
        if (this._settingsOverlay) {
            this._settingsOverlay.remove();
            this._settingsOverlay = null;
        }

        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
            this._escHandler = null;
        }

        if (this.input?.keyboard) {
            this.input.keyboard.enabled = true;
        }
    }

    _bindSettingsEvents() {
        const el = this._settingsOverlay;
        if (!el) return;

        el.querySelector('.settings-backdrop')?.addEventListener('click', () => this._closeSettings());

        this._escHandler = (event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            this._closeSettings();
        };
        document.addEventListener('keydown', this._escHandler);

        el.querySelector('#settings-save-btn')?.addEventListener('click', () => {
            const gameLang = document.getElementById('settings-game-lang')?.value || 'de';
            const trans1 = document.getElementById('settings-trans1')?.value || '';
            const trans2 = document.getElementById('settings-trans2')?.value || '';

            i18n.gameLang = gameLang;
            i18n.trans1 = trans1 === 'none' ? null : trans1;
            i18n.trans2 = trans2 === 'none' ? null : trans2;

            i18n.saveSettings();
            this._closeSettings();
            this.scene.restart();
        });

        el.querySelector('#settings-cancel-btn')?.addEventListener('click', () => this._closeSettings());
    }

    _getSettingsHTML() {
        const langOptions = (selected, includeNone = false) => {
            let html = includeNone ? `<option value="none" ${!selected ? 'selected' : ''}>${i18n.t('settings_none')}</option>` : '';
            for (const [code, info] of Object.entries(LANGUAGES)) {
                html += `<option value="${code}" ${selected === code ? 'selected' : ''}>${info.flag} ${info.nativeName}</option>`;
            }
            return html;
        };

        return `
            <div class="settings-backdrop"></div>
            <div class="settings-panel">
                <div class="settings-kicker">SYSTEM ACCESS</div>
                <div class="settings-title">${i18n.t('settings_title')}</div>

                <div class="settings-group">
                    <label class="settings-label">${i18n.t('settings_game_lang')}</label>
                    <select id="settings-game-lang">${langOptions(i18n.gameLang)}</select>
                    <div class="settings-hint">Idioma de la interfaz, botones y menús.</div>
                </div>

                <div class="settings-group">
                    <label class="settings-label">${i18n.t('settings_trans1')}</label>
                    <select id="settings-trans1">${langOptions(i18n.trans1, true)}</select>
                </div>

                <div class="settings-group">
                    <label class="settings-label">${i18n.t('settings_trans2')}</label>
                    <select id="settings-trans2">${langOptions(i18n.trans2, true)}</select>
                </div>

                <div class="settings-preview">
                    <div class="settings-preview-title">${i18n.t('settings_preview')}</div>
                    <div id="preview-main" class="settings-preview-main">WORTERBUCH</div>
                    <div id="preview-t1" class="settings-preview-t1">DICTIONARY</div>
                    <div id="preview-t2" class="settings-preview-t2">DICCIONARIO</div>
                </div>

                <div class="settings-actions">
                    <button id="settings-save-btn" class="settings-btn-save">${i18n.t('settings_save')}</button>
                    <button id="settings-cancel-btn" class="settings-btn-cancel">ESC</button>
                </div>
            </div>
        `;
    }

    _bindPreviewUpdater() {
        const previewKey = 'menu_dictionary';
        const updatePreview = () => {
            const gameLang = document.getElementById('settings-game-lang')?.value || 'de';
            const trans1 = document.getElementById('settings-trans1')?.value || '';
            const trans2 = document.getElementById('settings-trans2')?.value || '';

            const mainEl = document.getElementById('preview-main');
            const t1El = document.getElementById('preview-t1');
            const t2El = document.getElementById('preview-t2');

            if (mainEl) {
                const info = LANGUAGES[gameLang];
                const flag = info?.flag || 'LANG';
                mainEl.textContent = `${flag} ${this._previewString(previewKey, gameLang)}`;
            }

            if (t1El) {
                t1El.style.display = (trans1 === 'none' || trans1 === gameLang) ? 'none' : 'block';
                t1El.textContent = trans1 === 'none' ? '' : this._previewString(previewKey, trans1);
            }

            if (t2El) {
                t2El.style.display = (trans2 === 'none' || trans2 === gameLang || trans2 === trans1) ? 'none' : 'block';
                t2El.textContent = trans2 === 'none' ? '' : this._previewString(previewKey, trans2);
            }
        };

        document.getElementById('settings-game-lang')?.addEventListener('change', updatePreview);
        document.getElementById('settings-trans1')?.addEventListener('change', updatePreview);
        document.getElementById('settings-trans2')?.addEventListener('change', updatePreview);
        updatePreview();
    }

    _previewString(key, lang) {
        const strings = {
            menu_dictionary: {
                de: 'WORTERBUCH',
                en: 'DICTIONARY',
                es: 'DICCIONARIO',
                fr: 'DICTIONNAIRE',
                pt: 'DICIONARIO',
                it: 'DIZIONARIO',
                cs: 'SLOVNIK',
                pl: 'SLOWNIK',
                tr: 'SOZLUK',
                ar: 'القاموس',
                uk: 'СЛОВНИК',
                ru: 'СЛОВАРЬ',
            }
        };

        return strings[key]?.[lang] || key;
    }

    _getSettingsCSS() {
        return `
            #settings-overlay {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'VT323', monospace;
                pointer-events: auto;
            }
            .settings-backdrop {
                position: absolute;
                inset: 0;
                background:
                    radial-gradient(circle at top, rgba(255, 211, 96, 0.08), transparent 42%),
                    rgba(0, 0, 0, 0.82);
                backdrop-filter: blur(2px);
            }
            .settings-panel {
                position: relative;
                width: min(92vw, 430px);
                padding: 22px 28px 20px;
                border-radius: 12px;
                background:
                    linear-gradient(180deg, rgba(255, 217, 122, 0.08), transparent 24%),
                    #090d13;
                border: 1px solid rgba(255, 214, 79, 0.6);
                box-shadow:
                    0 0 0 1px rgba(255, 214, 79, 0.12),
                    0 24px 60px rgba(0, 0, 0, 0.48);
                z-index: 610;
            }
            .settings-kicker {
                font-size: 14px;
                color: #8d9aae;
                letter-spacing: 1px;
                margin-bottom: 6px;
            }
            .settings-title {
                font-family: 'Press Start 2P', monospace;
                font-size: 11px;
                color: #ffe28c;
                line-height: 1.5;
                margin-bottom: 18px;
            }
            .settings-group {
                margin-bottom: 14px;
            }
            .settings-label {
                display: block;
                font-size: 17px;
                color: #e6ebf4;
                margin-bottom: 4px;
            }
            .settings-group select {
                width: 100%;
                padding: 8px 10px;
                background: #111723;
                border: 1px solid #293445;
                color: #e8edf7;
                font-family: 'VT323', monospace;
                font-size: 18px;
                border-radius: 6px;
                outline: none;
                cursor: pointer;
            }
            .settings-group select:focus {
                border-color: #ffd64f;
                box-shadow: 0 0 0 1px rgba(255, 214, 79, 0.24);
            }
            .settings-hint {
                font-size: 14px;
                color: #7f8b9c;
                margin-top: 4px;
            }
            .settings-preview {
                margin: 18px 0 16px;
                padding: 14px;
                border-radius: 8px;
                border: 1px solid rgba(83, 108, 129, 0.7);
                background:
                    linear-gradient(180deg, rgba(0, 255, 65, 0.05), transparent 35%),
                    #071019;
                text-align: center;
            }
            .settings-preview-title {
                font-size: 15px;
                color: #8f9bae;
                margin-bottom: 8px;
            }
            .settings-preview-main {
                font-size: 20px;
                color: #ffe28c;
                margin-bottom: 2px;
            }
            .settings-preview-t1 {
                font-size: 17px;
                color: #d7dee9;
                margin-top: 2px;
            }
            .settings-preview-t2 {
                font-size: 15px;
                color: #94a3b8;
                margin-top: 1px;
            }
            .settings-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 10px;
            }
            .settings-btn-save,
            .settings-btn-cancel {
                min-width: 132px;
                padding: 8px 18px;
                border-radius: 6px;
                font-family: 'VT323', monospace;
                font-size: 18px;
                cursor: pointer;
                transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
            }
            .settings-btn-save {
                background: #13341d;
                border: 1px solid #43c46c;
                color: #9df1b7;
            }
            .settings-btn-save:hover {
                background: #184726;
                box-shadow: 0 0 16px rgba(67, 196, 108, 0.18);
                transform: translateY(-1px);
            }
            .settings-btn-cancel {
                background: #171d27;
                border: 1px solid #4c5d74;
                color: #d5dde8;
            }
            .settings-btn-cancel:hover {
                background: #202735;
                box-shadow: 0 0 16px rgba(76, 93, 116, 0.18);
                transform: translateY(-1px);
            }
        `;
    }
}
