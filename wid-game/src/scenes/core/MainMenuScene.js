import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';
import { i18n, LANGUAGES } from '../../services/i18n.js';

/**
 * MainMenuScene — Menú principal redesñado con:
 * - Layout estético mejorado (botones centrados y bien distribuidos)
 * - Multi-language subtitles (2 traducciones debajo del texto principal)
 * - Acceso a configuración de idiomas
 */
export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.MAIN_MENU);
        this._settingsOverlay = null;
    }

    create() {
        const { width, height } = this.cameras.main;
        const scenesData = this.cache.json.get('scenesData');
        const startScene = scenesData?.startScene || 'apartamento';
        const menuBgKey = this.textures.exists(`bg_${startScene}`)
            ? `bg_${startScene}`
            : (this.textures.exists('roger_hangar') ? 'roger_hangar' : 'full_scene');

        // ═══ FONDO ═══
        this.add.image(width / 2, height / 2, menuBgKey)
            .setDisplaySize(width, height)
            .setDepth(0);

        // Overlay oscuro gradient
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55).setDepth(1);

        // Scanlines CRT
        const scanlines = this.add.graphics().setDepth(2);
        scanlines.fillStyle(0x000000, 0.08);
        for (let y = 0; y < height; y += 4) {
            scanlines.fillRect(0, y, width, 2);
        }

        // ═══════════════════════════════════════════════════
        //  TÍTULO   — siempre en alemán (es el idioma que se aprende)
        // ═══════════════════════════════════════════════════
        this.add.text(width / 2, 36, 'WILLKOMMEN', {
            fontFamily: '"Press Start 2P"',
            fontSize: '36px',
            fill: '#00ff41',
            stroke: '#003311',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(5);

        this.add.text(width / 2, 78, 'IN DEUTSCHLAND', {
            fontFamily: '"Press Start 2P"',
            fontSize: '18px',
            fill: '#00ccff',
            stroke: '#002244',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(5);

        // ═══ Subtítulo principal (game language) ═══
        const subtitleY = 103;
        this.add.text(width / 2, subtitleY, i18n.t('menu_subtitle'), {
            fontFamily: 'VT323',
            fontSize: '19px',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setDepth(5);

        // ═══════════════════════════════════════════════════
        //  ESTADÍSTICAS (si hay progreso)
        // ═══════════════════════════════════════════════════
        const statsY = 155;
        if (playerProgressStore.learnedWords.length > 0) {
            this.add.text(width / 2, statsY,
                `📖 ${playerProgressStore.learnedWords.length} ${i18n.t('words_learned')}  ·  ${i18n.t('level')} ${playerProgressStore.level}`, {
                fontFamily: 'VT323',
                fontSize: '18px',
                fill: '#ffcc00'
            }).setOrigin(0.5).setDepth(5);
        }

        // ═══════════════════════════════════════════════════
        //  BOTONES — Layout centrado elegante
        // ═══════════════════════════════════════════════════
        const btnCenterY = 255;
        const btnSpacing = 75;

        // ── Botón EMPEZAR ──
        this._createMenuButton(
            width / 2, btnCenterY - btnSpacing,
            i18n.t('menu_start'), 'start',
            {
                w: 360, h: 42, bgColor: 0x0a2a0a, borderColor: 0x00ff41, textColor: '#00ff41',
                fontSize: '13px', fontFamily: '"Press Start 2P"', glow: true, pulse: true
            },
            () => this._startGame()
        );

        // ── Botón DICCIONARIO ──
        this._createMenuButton(
            width / 2, btnCenterY,
            `[ D ] ${i18n.t('menu_dictionary')}`, 'dictionary',
            {
                w: 280, h: 36, bgColor: 0x0a1a2a, borderColor: 0x00ccff, textColor: '#00ccff',
                fontSize: '14px', fontFamily: 'VT323'
            },
            () => this._openDictionary()
        );

        // ── Botón CONFIGURACIÓN ──
        this._createMenuButton(
            width / 2, btnCenterY + btnSpacing,
            i18n.t('menu_settings'), 'settings',
            {
                w: 250, h: 32, bgColor: 0x1a1a2a, borderColor: 0x8888cc, textColor: '#9999cc',
                fontSize: '13px', fontFamily: 'VT323'
            },
            () => this._openSettings()
        );

        // ═══ Indicador de idioma activo ═══
        const langIndicatorY = btnCenterY + btnSpacing + 58;
        const langInfo = i18n.getLangInfo(i18n.gameLang);

        this.add.text(width / 2, langIndicatorY, `🎯 ${langInfo.flag} ${langInfo.nativeName}`, {
            fontFamily: 'VT323',
            fontSize: '16px',
            fill: '#555566'
        }).setOrigin(0.5).setDepth(5);

        // ═══ Quote at bottom ═══
        const quoteY = height - 35;
        this.add.text(width / 2, quoteY, i18n.t('menu_quote'), {
            fontFamily: 'VT323',
            fontSize: '14px',
            fill: '#445544',
            fontStyle: 'italic',
            wordWrap: { width: width - 40 },
            align: 'center'
        }).setOrigin(0.5).setDepth(5);

        // Version
        this.add.text(width - 10, height - 10, 'v0.5.0', {
            fontFamily: 'VT323', fontSize: '14px', fill: '#333333'
        }).setOrigin(1, 1).setDepth(5);

        // ═══ INPUT ═══
        this.input.keyboard.on('keydown-SPACE', () => this._startGame());
        this.input.keyboard.on('keydown-ENTER', () => this._startGame());
        this.input.keyboard.on('keydown-D', () => this._openDictionary());
        this.input.keyboard.on('keydown-S', () => this._openSettings());

        // ═══ TRANSICIÓN ENTRADA ═══
        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.events.on('wake', () => {
            console.log('MainMenuScene despertado');
            this.cameras.main.resetFX();
            this.cameras.main.fadeIn(500, 0, 0, 0);
        });
    }

    /* ── Create a styled menu button ─── */
    _createMenuButton(x, y, label, key, opts, onClick) {
        const { w, h, bgColor, borderColor, textColor, fontSize, fontFamily, glow, pulse } = opts;

        // Background
        const bg = this.add.rectangle(x, y, w, h, bgColor, 0.85).setDepth(5);
        bg.setStrokeStyle(2, borderColor);

        // Glow effect
        if (glow) {
            const glowRect = this.add.rectangle(x, y, w + 4, h + 4, borderColor, 0.08).setDepth(4);
            this.tweens.add({
                targets: glowRect, alpha: { from: 0.04, to: 0.15 },
                duration: 1200, yoyo: true, loop: -1, ease: 'Sine.easeInOut'
            });
        }

        // Text
        const text = this.add.text(x, y, label, {
            fontFamily: fontFamily || 'VT323',
            fontSize: fontSize || '14px',
            fill: textColor || '#ffffff',
        }).setOrigin(0.5).setDepth(6);

        // Pulse animation for start button
        if (pulse) {
            this.tweens.add({
                targets: text, alpha: 0.4,
                duration: 600, yoyo: true, loop: -1
            });
        }

        // Interactive
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => {
            bg.setAlpha(1);
            text.setAlpha(1);
        });
        bg.on('pointerout', () => {
            bg.setAlpha(0.85);
            if (!pulse) text.setAlpha(1);
        });
        bg.on('pointerdown', onClick);

        return { bg, text };
    }

    /* ── Start game ─── */
    _startGame() {
        if (this._settingsOverlay) return; // Don't start if settings open
        const scenesData = this.cache.json.get('scenesData');
        const startScene = scenesData.startScene || 'apartamento';

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(SCENE_KEYS.SCENE_ENGINE, { sceneId: startScene });
        });
    }

    /* ── Open dictionary ─── */
    _openDictionary() {
        if (this._settingsOverlay) return;
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.sleep(SCENE_KEYS.MAIN_MENU);
            this.scene.run(SCENE_KEYS.DICTIONARY, { returnScene: SCENE_KEYS.MAIN_MENU });
        });
    }

    /* ── Settings overlay (HTML) ───────────────────────── */
    _openSettings() {
        if (this._settingsOverlay) return;

        // Use document.body to avoid game-container overflow:hidden clipping
        const container = document.body;

        // Disable Phaser keyboard
        if (this.input?.keyboard) this.input.keyboard.enabled = false;

        const el = document.createElement('div');
        el.id = 'settings-overlay';
        el.innerHTML = this._getSettingsHTML();
        container.appendChild(el);
        this._settingsOverlay = el;

        // Inject CSS
        if (!document.getElementById('settings-styles')) {
            const style = document.createElement('style');
            style.id = 'settings-styles';
            style.textContent = this._getSettingsCSS();
            document.head.appendChild(style);
        }

        this._bindSettingsEvents();
        this._bindPreviewUpdater();
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
        if (this.input?.keyboard) this.input.keyboard.enabled = true;
    }

    _bindSettingsEvents() {
        const el = this._settingsOverlay;
        if (!el) return;

        // Close on backdrop
        el.querySelector('.settings-backdrop')?.addEventListener('click', () => this._closeSettings());

        // Close on ESC — global listener
        this._escHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this._closeSettings();
            }
        };
        document.addEventListener('keydown', this._escHandler);

        // Save
        el.querySelector('#settings-save-btn')?.addEventListener('click', () => {
            const gameLang = document.getElementById('settings-game-lang')?.value || 'de';
            i18n.gameLang = gameLang;
            i18n.saveSettings();
            this._closeSettings();
            this.scene.restart();
        });

        // Cancel
        el.querySelector('#settings-cancel-btn')?.addEventListener('click', () => this._closeSettings());
    }

    _getSettingsHTML() {
        const langOptions = (selected) => {
            let html = '';
            for (const [code, info] of Object.entries(LANGUAGES)) {
                html += `<option value="${code}" ${selected === code ? 'selected' : ''}>${info.flag} ${info.nativeName}</option>`;
            }
            return html;
        };

        return `
            <div class="settings-backdrop"></div>
            <div class="settings-panel">
                <div class="settings-title">${i18n.t('settings_title')}</div>

                <div class="settings-group">
                    <label class="settings-label">${i18n.t('settings_game_lang')}</label>
                    <select id="settings-game-lang">${langOptions(i18n.gameLang)}</select>
                    <div class="settings-hint">Idioma de la interfaz, botones y menús.</div>
                </div>

                <div class="settings-preview">
                    <div class="settings-preview-title">${i18n.t('settings_preview')}</div>
                    <div id="preview-main" class="settings-preview-main">📖 WÖRTERBUCH</div>
                </div>

                <div class="settings-actions">
                    <button id="settings-save-btn" class="settings-btn-save">${i18n.t('settings_save')}</button>
                    <button id="settings-cancel-btn" class="settings-btn-cancel">ESC</button>
                </div>
            </div>
        `;
    }

    _bindPreviewUpdater() {
        const PREVIEW_KEY = 'menu_dictionary';
        const updatePreview = () => {
            const gameLang = document.getElementById('settings-game-lang')?.value || 'de';
            const mainEl = document.getElementById('preview-main');

            if (mainEl) {
                const info = LANGUAGES[gameLang];
                const flag = info?.flag || '🌐';
                mainEl.textContent = `${flag} ${this._previewString(PREVIEW_KEY, gameLang)}`;
            }
        };

        document.getElementById('settings-game-lang')?.addEventListener('change', updatePreview);
    }

    _previewString(key, lang) {
        // Simple inline lookup for preview
        const STRINGS = {
            menu_dictionary: {
                de: '📖 WÖRTERBUCH', en: '📖 DICTIONARY', es: '📖 DICCIONARIO',
                fr: '📖 DICTIONNAIRE', pt: '📖 DICIONÁRIO', it: '📖 DIZIONARIO',
                cs: '📖 SLOVNÍK', pl: '📖 SŁOWNIK', tr: '📖 SÖZLÜK',
                ar: '📖 القاموس', uk: '📖 СЛОВНИК', ru: '📖 СЛОВАРЬ',
            }
        };
        return STRINGS[key]?.[lang] || key;
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
                background: #000000dd;
            }
            .settings-panel {
                position: relative;
                background: #0d0d28;
                border: 2px solid #8888cc;
                border-radius: 8px;
                padding: 20px 28px;
                width: 90%;
                max-width: 400px;
                box-shadow: 0 0 40px #8888cc22;
                z-index: 610;
            }
            .settings-title {
                font-family: 'Press Start 2P', monospace;
                font-size: 10px;
                color: #8888cc;
                text-align: center;
                margin-bottom: 18px;
                text-shadow: 0 0 8px #8888cc44;
            }
            .settings-group {
                margin-bottom: 14px;
            }
            .settings-label {
                display: block;
                font-size: 14px;
                color: #aaaacc;
                margin-bottom: 4px;
            }
            .settings-group select {
                width: 100%;
                padding: 6px 10px;
                background: #10102e;
                border: 1px solid #2a2a55;
                color: #e0e0f0;
                font-family: 'VT323', monospace;
                font-size: 16px;
                border-radius: 3px;
                outline: none;
                cursor: pointer;
            }
            .settings-group select:focus {
                border-color: #8888cc;
                box-shadow: 0 0 6px #8888cc44;
            }
            .settings-hint {
                font-size: 12px;
                color: #555577;
                margin-top: 2px;
            }
            .settings-preview {
                background: #08081a;
                border: 1px solid #1e1e44;
                border-radius: 4px;
                padding: 10px 14px;
                margin: 14px 0;
                text-align: center;
            }
            .settings-preview-title {
                font-size: 11px;
                color: #555577;
                margin-bottom: 6px;
            }
            .settings-preview-main {
                font-size: 18px;
                color: #00ff41;
                font-weight: bold;
            }
            .settings-preview-t1 {
                font-size: 14px;
                color: #888888;
                margin-top: 2px;
            }
            .settings-preview-t2 {
                font-size: 11px;
                color: #555555;
                margin-top: 1px;
            }
            .settings-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 8px;
            }
            .settings-btn-save {
                font-family: 'VT323', monospace;
                font-size: 15px;
                padding: 6px 20px;
                background: #0a2a0a;
                border: 2px solid #00ff41;
                color: #00ff41;
                cursor: pointer;
                border-radius: 3px;
                transition: background 0.15s;
            }
            .settings-btn-save:hover {
                background: #1a4a1a;
                box-shadow: 0 0 10px #00ff4144;
            }
            .settings-btn-cancel {
                font-family: 'VT323', monospace;
                font-size: 15px;
                padding: 6px 16px;
                background: #1a0a0a;
                border: 1px solid #ff6666;
                color: #ff6666;
                cursor: pointer;
                border-radius: 3px;
                transition: background 0.15s;
            }
            .settings-btn-cancel:hover {
                background: #2a1010;
            }
        `;
    }
}
