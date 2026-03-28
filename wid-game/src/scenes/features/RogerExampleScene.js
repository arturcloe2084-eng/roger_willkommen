import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { narratorService } from '../../services/NarratorService.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';
import { i18n } from '../../services/i18n.js';
import { ROGER_EXAMPLE_STEPS, ROGER_EXAMPLE_SUPPORTED_LANGS } from '../../content/rogerExampleStory.js';

const UI_TEXT = {
    es: {
        headerKicker: 'ROGER: HISTORIA DE EJEMPLO',
        headerTitle: 'Caos del Burgeramt',
        headerCaption: 'Un recorrido amable para aprender aleman y ver como se construye una escena util.',
        learnTitle: 'Lo que aprendes aqui',
        builderTitle: 'Como copiar esta idea',
        vocabTitle: 'Vocabulario util',
        lineTitle: 'Frase en aleman',
        meaningTitle: 'Significado',
        promptTitle: 'Pista amable',
        guideClosed: 'GUIA',
        guideOpen: 'CERRAR',
        guideTitle: 'Guia de creacion',
        guideCoach: 'Por que funciona',
        guideBuilder: 'Como copiarlo',
        controls: 'Usa <- y ->, A/D o los botones. L escucha, G abre la guia y ESC vuelve al menu.',
        listening: 'Escuchando aleman...',
        ready: 'Pulsa L para volver a escuchar la frase.',
        finishHint: 'Historia completa. Pulsa Menu.',
        prev: 'Anterior',
        next: 'Siguiente',
        listen: 'Escuchar',
        finish: 'Menu',
        sceneWord: 'ESCENA',
    },
    en: {
        headerKicker: 'ROGER: EXAMPLE STORY',
        headerTitle: 'Burgeramt Mix-Up',
        headerCaption: 'A friendly walkthrough to learn German and see how a useful scene is built.',
        learnTitle: 'What you learn here',
        builderTitle: 'How to copy this idea',
        vocabTitle: 'Useful vocabulary',
        lineTitle: 'German line',
        meaningTitle: 'Meaning',
        promptTitle: 'Friendly hint',
        guideClosed: 'GUIDE',
        guideOpen: 'CLOSE',
        guideTitle: 'Scene guide',
        guideCoach: 'Why it works',
        guideBuilder: 'How to copy it',
        controls: 'Use <- and ->, A/D or the buttons. L listens, G opens the guide and ESC returns to the menu.',
        listening: 'Listening to German...',
        ready: 'Press L to hear the line again.',
        finishHint: 'Story complete. Press Menu.',
        prev: 'Previous',
        next: 'Next',
        listen: 'Listen',
        finish: 'Menu',
        sceneWord: 'SCENE',
    },
    de: {
        headerKicker: 'ROGER: BEISPIELGESCHICHTE',
        headerTitle: 'Burgeramt-Chaos',
        headerCaption: 'Eine freundliche Tour zum Deutschlernen und als Vorlage fur eigene Szenen.',
        learnTitle: 'Das lernst du hier',
        builderTitle: 'So kopierst du die Idee',
        vocabTitle: 'Nutzlicher Wortschatz',
        lineTitle: 'Satz auf Deutsch',
        meaningTitle: 'Bedeutung',
        promptTitle: 'Freundlicher Hinweis',
        guideClosed: 'GUIDE',
        guideOpen: 'ZURUCK',
        guideTitle: 'Szenenhilfe',
        guideCoach: 'Warum es klappt',
        guideBuilder: 'So kopierst du es',
        controls: 'Nutze <- und ->, A/D oder die Buttons. L hort zu, G zeigt die Hilfe und ESC geht ins Menu.',
        listening: 'Deutsch wird abgespielt...',
        ready: 'Drucke L, um den Satz noch einmal zu horen.',
        finishHint: 'Geschichte fertig. Drucke Menu.',
        prev: 'Zuruck',
        next: 'Weiter',
        listen: 'Anhoren',
        finish: 'Menu',
        sceneWord: 'SZENE',
    },
};

export class RogerExampleScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.ROGER_EXAMPLE);
    }

    preload() {
        ROGER_EXAMPLE_STEPS.forEach((step) => {
            if (!this.textures.exists(step.imageKey)) {
                this.load.image(step.imageKey, step.imagePath);
            }
        });
    }

    init() {
        this.currentStepIndex = 0;
        this.locale = this._resolveLocale();
        this._completionSaved = false;
        this.isGuideOpen = false;
        this._navHandlers = [];
    }

    create() {
        const { width, height } = this.cameras.main;

        this._createBackdrop(width, height);
        this._createHeader(width);
        this._createImageStage();
        this._createLearningPanel(width);
        this._createDialoguePanel(height);
        this._createControls();
        this._registerInputs();
        this._renderStep(true);

        this.events.once('shutdown', this._cleanupScene, this);
        this.events.once('destroy', this._cleanupScene, this);
    }

    _resolveLocale() {
        if (ROGER_EXAMPLE_SUPPORTED_LANGS.includes(i18n.gameLang)) {
            return i18n.gameLang;
        }
        return 'es';
    }

    _t(key) {
        return UI_TEXT[this.locale]?.[key] || UI_TEXT.es[key] || key;
    }

    _pick(bundle) {
        if (typeof bundle === 'string') return bundle;
        return bundle?.[this.locale] || bundle?.es || bundle?.en || bundle?.de || '';
    }

    _shortLabel(value, maxChars = 18) {
        if (!value) return '';
        return value.length > maxChars ? `${value.slice(0, maxChars - 1)}…` : value;
    }

    _fitText(textObject, content, { maxFontSize, minFontSize, maxHeight, wordWrapWidth }) {
        if (wordWrapWidth) {
            textObject.setWordWrapWidth(wordWrapWidth, true);
        }

        for (let size = maxFontSize; size >= minFontSize; size -= 1) {
            textObject.setFontSize(size);
            textObject.setText(content);
            if (!maxHeight || textObject.height <= maxHeight) {
                return;
            }
        }

        textObject.setText(content);
    }

    _currentStep() {
        return ROGER_EXAMPLE_STEPS[this.currentStepIndex];
    }

    _createBackdrop(width, height) {
        this.add.rectangle(0, 0, width, height, 0x091017).setOrigin(0);
        this.add.rectangle(width * 0.2, height * 0.18, width * 0.72, height * 0.34, 0x122033, 0.55)
            .setAngle(-10);
        this.add.rectangle(width * 0.84, height * 0.8, width * 0.56, height * 0.44, 0x1f1427, 0.4)
            .setAngle(12);
        this.add.circle(width - 90, 82, 110, 0xf4a261, 0.08);
        this.add.circle(90, height - 80, 96, 0x8ecae6, 0.1);

        const scanlines = this.add.graphics().setAlpha(0.04);
        scanlines.lineStyle(1, 0xffffff, 0.08);
        for (let y = 0; y < height; y += 4) {
            scanlines.moveTo(0, y);
            scanlines.lineTo(width, y);
        }
        scanlines.strokePath();
    }

    _createCard(x, y, width, height, opts = {}) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, width, height, opts.fillColor ?? 0x0b1320, opts.fillAlpha ?? 0.92)
            .setOrigin(0)
            .setStrokeStyle(1, opts.strokeColor ?? 0x607089, opts.strokeAlpha ?? 0.8);
        const inner = this.add.rectangle(width / 2, height / 2, width - 12, height - 12, 0xffffff, 0.015);
        const topBar = this.add.rectangle(14, 14, width - 28, 2, opts.accentColor ?? 0xf2c166, 0.95).setOrigin(0);
        const bottomBar = this.add.rectangle(14, height - 12, width - 28, 1, opts.bottomColor ?? 0x6a7b92, 0.85).setOrigin(0);

        container.add([bg, inner, topBar, bottomBar]);
        return container;
    }

    _createHeader(width) {
        this.headerCard = this._createCard(20, 16, width - 40, 60, {
            fillColor: 0x0d1624,
            fillAlpha: 0.9,
            strokeColor: 0x71839d,
            accentColor: 0xf2c166,
            bottomColor: 0x7a8ba3,
        });

        this.headerKicker = this.add.text(18, 10, this._t('headerKicker'), {
            fontFamily: 'VT323',
            fontSize: '20px',
            color: '#f6c96f',
            letterSpacing: 1,
        });
        this.headerTitle = this.add.text(18, 28, this._t('headerTitle'), {
            fontFamily: '"Press Start 2P"',
            fontSize: '11px',
            color: '#eef4ff',
        });
        this.headerCaption = this.add.text(312, 12, this._t('headerCaption'), {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#b8c5d6',
            wordWrap: { width: 430 },
        });
        this.progressLabel = this.add.text(width - 22, 14, '', {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#f6c96f',
        }).setOrigin(1, 0);

        this.progressDots = [];
        this.progressDotBg = this.add.rectangle(width - 190, 42, 168, 16, 0x121a24, 0.75).setStrokeStyle(1, 0x536479, 0.6);
        for (let i = 0; i < ROGER_EXAMPLE_STEPS.length; i++) {
            const dot = this.add.rectangle(width - 266 + (i * 20), 42, 12, 6, 0x334155, 0.75);
            this.progressDots.push(dot);
        }

        this.headerCard.add([this.headerKicker, this.headerTitle, this.headerCaption, this.progressDotBg, this.progressLabel, ...this.progressDots]);
    }

    _createImageStage() {
        this.imageCard = this._createCard(20, 88, 336, 320, {
            fillColor: 0x0c1119,
            fillAlpha: 0.95,
            strokeColor: 0x607089,
            accentColor: 0xf2c166,
            bottomColor: 0x7a8ba3,
        });

        this.photoShadow = this.add.rectangle(28, 30, 296, 262, 0x02050a, 0.42)
            .setOrigin(0)
            .setRotation(0.02);
        this.photoMatte = this.add.rectangle(18, 18, 296, 262, 0xe8ddc3, 0.96)
            .setOrigin(0)
            .setStrokeStyle(1, 0xf6ecd7, 0.9);
        this.imageFrame = this.add.rectangle(26, 26, 280, 246, 0x05070c, 1)
            .setOrigin(0)
            .setStrokeStyle(1, 0x8897a9, 0.75);
        this.storyImage = this.add.image(166, 149, ROGER_EXAMPLE_STEPS[0].imageKey);
        this._fitImageToStage(ROGER_EXAMPLE_STEPS[0].imageKey);

        this.imageTitleChip = this.add.rectangle(18, 290, 296, 16, 0x101a28, 0.98)
            .setOrigin(0)
            .setStrokeStyle(1, 0x536479, 0.65);
        this.imageTitleText = this.add.text(28, 289, '', {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#e6edf7',
        });

        this.imageCard.add([
            this.photoShadow,
            this.photoMatte,
            this.imageFrame,
            this.storyImage,
            this.imageTitleChip,
            this.imageTitleText,
        ]);
    }

    _createLearningPanel(width) {
        this.learnCard = this._createCard(width - 424, 88, 404, 320, {
            fillColor: 0x0e1725,
            fillAlpha: 0.95,
            strokeColor: 0x607089,
            accentColor: 0x8ecae6,
            bottomColor: 0x7a8ba3,
        });

        this.storyTitleText = this.add.text(18, 14, '', {
            fontFamily: 'VT323',
            fontSize: '20px',
            color: '#eef4ff',
            wordWrap: { width: 246 },
        });
        this.guideButton = this._createButton(278, 14, 108, this._t('guideClosed'), () => this._toggleGuide(), 0x1c2838, 0xf2c166);

        this.sceneBadge = this.add.rectangle(18, 60, 94, 20, 0x1b2433, 0.98)
            .setOrigin(0)
            .setStrokeStyle(1, 0x607089, 0.65);
        this.sceneBadgeText = this.add.text(65, 62, '', {
            fontFamily: 'VT323',
            fontSize: '16px',
            color: '#f2c166',
        }).setOrigin(0.5, 0);

        this.speakerChip = this.add.rectangle(122, 60, 124, 20, 0x142033, 0.98)
            .setOrigin(0)
            .setStrokeStyle(1, 0x8ecae6, 0.65);
        this.speakerText = this.add.text(184, 62, '', {
            fontFamily: 'VT323',
            fontSize: '16px',
            color: '#eef4ff',
        }).setOrigin(0.5, 0);

        this.progressChip = this.add.rectangle(256, 60, 130, 20, 0x16202e, 0.98)
            .setOrigin(0)
            .setStrokeStyle(1, 0x607089, 0.65);
        this.progressText = this.add.text(321, 62, '', {
            fontFamily: 'VT323',
            fontSize: '16px',
            color: '#b8c5d6',
        }).setOrigin(0.5, 0);

        this.linePanel = this.add.rectangle(18, 92, 368, 96, 0x101822, 0.98)
            .setOrigin(0)
            .setStrokeStyle(1, 0x4d627a, 0.65);
        this.lineHeading = this.add.text(28, 98, this._t('lineTitle').toUpperCase(), {
            fontFamily: 'VT323',
            fontSize: '17px',
            color: '#f6c96f',
        });
        this.germanLineText = this.add.text(28, 116, '', {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#eef4ff',
            lineSpacing: 2,
            wordWrap: { width: 348 },
        });
        this.meaningHeading = this.add.text(28, 152, this._t('meaningTitle').toUpperCase(), {
            fontFamily: 'VT323',
            fontSize: '16px',
            color: '#8ecae6',
        });
        this.translationText = this.add.text(28, 168, '', {
            fontFamily: 'VT323',
            fontSize: '15px',
            color: '#d9e4f2',
            lineSpacing: 1,
            wordWrap: { width: 344 },
        });

        this.vocabHeading = this.add.text(18, 202, this._t('vocabTitle').toUpperCase(), {
            fontFamily: 'VT323',
            fontSize: '20px',
            color: '#9ef0bf',
        });
        this.vocabContainer = this.add.container(18, 228);

        this.guideOverlay = this.add.container(18, 92);
        this.guideOverlayBg = this.add.rectangle(0, 0, 368, 200, 0x0d1624, 0.985)
            .setOrigin(0)
            .setStrokeStyle(1, 0xf2c166, 0.7);
        this.guideOverlayTop = this.add.rectangle(14, 14, 340, 2, 0xf2c166, 0.95).setOrigin(0);
        this.guideOverlayTitle = this.add.text(18, 20, this._t('guideTitle').toUpperCase(), {
            fontFamily: 'VT323',
            fontSize: '20px',
            color: '#f6c96f',
        });
        this.guideCoachLabel = this.add.text(18, 52, this._t('guideCoach').toUpperCase(), {
            fontFamily: 'VT323',
            fontSize: '17px',
            color: '#8ecae6',
        });
        this.guideCoachText = this.add.text(18, 70, '', {
            fontFamily: 'VT323',
            fontSize: '16px',
            color: '#eef4ff',
            lineSpacing: 1,
            wordWrap: { width: 332 },
        });
        this.guideBuilderLabel = this.add.text(18, 118, this._t('guideBuilder').toUpperCase(), {
            fontFamily: 'VT323',
            fontSize: '17px',
            color: '#9ef0bf',
        });
        this.guideBuilderText = this.add.text(18, 136, '', {
            fontFamily: 'VT323',
            fontSize: '16px',
            color: '#d9e4f2',
            lineSpacing: 1,
            wordWrap: { width: 332 },
        });
        this.guideOverlay.add([
            this.guideOverlayBg,
            this.guideOverlayTop,
            this.guideOverlayTitle,
            this.guideCoachLabel,
            this.guideCoachText,
            this.guideBuilderLabel,
            this.guideBuilderText,
        ]);
        this.guideOverlay.setVisible(false);

        this.learnCard.add([
            this.storyTitleText,
            this.guideButton.container,
            this.sceneBadge,
            this.sceneBadgeText,
            this.speakerChip,
            this.speakerText,
            this.progressChip,
            this.progressText,
            this.linePanel,
            this.lineHeading,
            this.germanLineText,
            this.meaningHeading,
            this.translationText,
            this.vocabHeading,
            this.vocabContainer,
            this.guideOverlay,
        ]);
    }

    _createDialoguePanel(height) {
        this.dialogueCard = this._createCard(20, height - 92, 760, 72, {
            fillColor: 0x0b1320,
            fillAlpha: 0.96,
            strokeColor: 0x607089,
            accentColor: 0xf2c166,
            bottomColor: 0x7a8ba3,
        });

        this.statusText = this.add.text(18, 12, '', {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#8ecae6',
            lineSpacing: 1,
            wordWrap: { width: 390 },
        }).setOrigin(0, 0);

        this.dialogueCard.add([
            this.statusText,
        ]);
    }

    _createControls() {
        this.prevButton = this._createButton(454, 22, 88, this._t('prev'), () => this._goPrev(), 0x223043, 0x8ecae6);
        this.listenButton = this._createButton(554, 22, 96, this._t('listen'), () => this._speakCurrentLine(), 0x2a281a, 0xf2c166);
        this.nextButton = this._createButton(662, 22, 80, this._t('next'), () => this._goNext(), 0x1f3326, 0x8fe3b0);

        this.controlsHint = this.add.text(18, 38, this._t('controls'), {
            fontFamily: 'VT323',
            fontSize: '16px',
            color: '#9fb0c4',
            lineSpacing: 1,
            wordWrap: { width: 420 },
        });

        this.dialogueCard.add([
            this.controlsHint,
            this.prevButton.container,
            this.listenButton.container,
            this.nextButton.container,
        ]);
    }

    _createButton(x, y, width, label, onClick, fillColor, accentColor) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, width, 26, fillColor, 0.98)
            .setOrigin(0)
            .setStrokeStyle(1, accentColor, 0.82);
        const text = this.add.text(width / 2, 4, label, {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#f5f7fb',
        }).setOrigin(0.5, 0);

        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => {
            bg.setFillStyle(accentColor, 1);
            text.setColor('#081018');
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(fillColor, 0.98);
            text.setColor('#f5f7fb');
        });
        bg.on('pointerdown', onClick);

        container.add([bg, text]);
        return { container, bg, text, label, fillColor, accentColor };
    }

    _toggleGuide() {
        this.isGuideOpen = !this.isGuideOpen;
        this._updateGuideState();
    }

    _updateGuideState() {
        const isOpen = this.isGuideOpen;
        const baseVisible = !isOpen;

        [
            this.linePanel,
            this.lineHeading,
            this.germanLineText,
            this.meaningHeading,
            this.translationText,
            this.vocabHeading,
            this.vocabContainer,
        ].forEach((item) => item?.setVisible(baseVisible));

        this.guideOverlay?.setVisible(isOpen);
        this.guideButton?.text.setText(this._t(isOpen ? 'guideOpen' : 'guideClosed'));
    }

    _registerInputs() {
        const register = (eventName, handler) => {
            this.input.keyboard.on(eventName, handler);
            this._navHandlers.push({ eventName, handler });
        };

        register('keydown-RIGHT', () => this._goNext());
        register('keydown-D', () => this._goNext());
        register('keydown-LEFT', () => this._goPrev());
        register('keydown-A', () => this._goPrev());
        register('keydown-L', () => this._speakCurrentLine());
        register('keydown-G', () => this._toggleGuide());
        register('keydown-ENTER', () => this._goNext());
        register('keydown-SPACE', () => this._goNext());
        register('keydown-ESC', () => this._returnToMenu());
    }

    _renderStep(initial = false) {
        const step = this._currentStep();
        const total = ROGER_EXAMPLE_STEPS.length;
        const index = this.currentStepIndex + 1;

        this.progressLabel.setText(`${index}/${total}`);
        this.imageTitleText.setText(this._pick(step.title));
        this._fitText(this.storyTitleText, this._pick(step.title), {
            maxFontSize: 20,
            minFontSize: 16,
            maxHeight: 28,
            wordWrapWidth: 246,
        });
        this.sceneBadgeText.setText(`${this._t('sceneWord')} ${index}`);
        this.speakerText.setText(this._pick(step.speaker).toUpperCase());
        this.progressText.setText(`${index} / ${total}`);
        this._fitText(this.germanLineText, step.lineDe, {
            maxFontSize: 18,
            minFontSize: 15,
            maxHeight: 28,
            wordWrapWidth: 344,
        });
        this._fitText(this.translationText, this._pick(step.translation), {
            maxFontSize: 15,
            minFontSize: 12,
            maxHeight: 24,
            wordWrapWidth: 344,
        });
        this._fitText(this.guideCoachText, this._pick(step.coach), {
            maxFontSize: 16,
            minFontSize: 13,
            maxHeight: 40,
            wordWrapWidth: 332,
        });
        this._fitText(this.guideBuilderText, this._pick(step.builder), {
            maxFontSize: 16,
            minFontSize: 13,
            maxHeight: 48,
            wordWrapWidth: 332,
        });
        this._fitImageToStage(step.imageKey);
        this._fitText(this.statusText, this._t('ready'), {
            maxFontSize: 18,
            minFontSize: 14,
            maxHeight: 20,
            wordWrapWidth: 390,
        });

        this.progressDots.forEach((dot, dotIndex) => {
            dot.setFillStyle(dotIndex <= this.currentStepIndex ? step.accentColor : 0x334155, dotIndex <= this.currentStepIndex ? 1 : 0.65);
        });

        this._refreshButtonState();
        this._renderVocabulary(step);
        this._updateGuideState();

        const isLast = this.currentStepIndex === total - 1;
        this._fitText(this.statusText, isLast ? this._t('finishHint') : this._t('ready'), {
            maxFontSize: 18,
            minFontSize: 14,
            maxHeight: 20,
            wordWrapWidth: 390,
        });

        if (isLast) {
            this._markExampleCompleted();
        }

        if (!initial) {
            this._animateStepTransition(step.accentColor);
        }

        this.time.delayedCall(initial ? 220 : 140, () => this._speakCurrentLine(true));
    }

    _animateStepTransition(accentColor) {
        this.tweens.add({
            targets: [this.storyImage, this.storyTitleText, this.germanLineText, this.translationText, this.vocabContainer],
            alpha: { from: 0.35, to: 1 },
            duration: 240,
            ease: 'Quad.easeOut',
        });

        this.tweens.add({
            targets: [this.imageTitleChip, this.sceneBadge, this.speakerChip, this.progressChip],
            scaleX: { from: 0.98, to: 1 },
            scaleY: { from: 0.98, to: 1 },
            duration: 180,
            ease: 'Back.easeOut',
        });

        this.sceneBadge.setStrokeStyle(1, accentColor, 0.8);
        this.guideOverlayBg?.setStrokeStyle(1, accentColor, 0.7);
    }

    _renderVocabulary(step) {
        this.vocabContainer.removeAll(true);

        step.vocab.forEach((item, itemIndex) => {
            const chipY = itemIndex * 34;
            const translation = this._shortLabel(item[this.locale] || item.es || item.en, 20);
            const chipBg = this.add.rectangle(0, chipY, 368, 30, 0x142033, 0.98)
                .setOrigin(0)
                .setStrokeStyle(1, step.accentColor, 0.5);
            const chipAccent = this.add.rectangle(0, chipY, 5, 30, step.accentColor, 0.95).setOrigin(0);
            const chipDe = this.add.text(12, chipY + 2, item.de, {
                fontFamily: 'VT323',
                fontSize: '18px',
                color: '#eef4ff',
            });
            const chipTranslation = this.add.text(172, chipY + 4, translation, {
                fontFamily: 'VT323',
                fontSize: '15px',
                color: '#9fb0c4',
            });

            this.vocabContainer.add([chipBg, chipAccent, chipDe, chipTranslation]);
        });
    }

    _refreshButtonState() {
        const isFirst = this.currentStepIndex === 0;
        const isLast = this.currentStepIndex === ROGER_EXAMPLE_STEPS.length - 1;

        this.prevButton.bg.setAlpha(isFirst ? 0.4 : 1);
        this.prevButton.text.setAlpha(isFirst ? 0.4 : 1);
        this.prevButton.bg.disableInteractive();
        if (!isFirst) {
            this.prevButton.bg.setInteractive({ useHandCursor: true });
        }

        const nextLabel = isLast ? this._t('finish') : this._t('next');
        this.nextButton.text.setText(nextLabel);
    }

    _fitImageToStage(textureKey) {
        this.storyImage.setTexture(textureKey);
        this.storyImage.setCrop();

        const frame = this.storyImage.frame;
        const sourceWidth = frame?.width || 300;
        const sourceHeight = frame?.height || 266;
        const targetWidth = 280;
        const targetHeight = 246;
        const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
        const displayWidth = Math.round(sourceWidth * scale);
        const displayHeight = Math.round(sourceHeight * scale);

        this.storyImage.setDisplaySize(displayWidth, displayHeight);
        this.storyImage.setPosition(166, 149);
    }

    _goPrev() {
        if (this.currentStepIndex === 0) return;
        narratorService.stop();
        this.currentStepIndex -= 1;
        this._renderStep();
    }

    _goNext() {
        if (this.currentStepIndex >= ROGER_EXAMPLE_STEPS.length - 1) {
            this._returnToMenu();
            return;
        }

        narratorService.stop();
        this.currentStepIndex += 1;
        this._renderStep();
    }

    _speakCurrentLine(auto = false) {
        const step = this._currentStep();
        this._fitText(this.statusText, this._t('listening'), {
            maxFontSize: 18,
            minFontSize: 14,
            maxHeight: 20,
            wordWrapWidth: 390,
        });

        narratorService.stop();
        narratorService.narrateInGerman(step.lineDe, null, () => {
            if (!this.statusText?.active) return;
            this._fitText(this.statusText, this._restingStatusText(auto), {
                maxFontSize: 18,
                minFontSize: 14,
                maxHeight: 20,
                wordWrapWidth: 390,
            });
        });
    }

    _restingStatusText() {
        const isLast = this.currentStepIndex === ROGER_EXAMPLE_STEPS.length - 1;
        return isLast ? this._t('finishHint') : this._t('ready');
    }

    _markExampleCompleted() {
        if (this._completionSaved) return;
        this._completionSaved = true;

        const saved = playerProgressStore.addJournal(
            'Viste la historia de ejemplo de Roger en el Burgeramt y entendiste como una escena puede ensenar idioma con fotos reales.',
            'roger:example_viewed'
        );

        if (!saved) {
            playerProgressStore.unlockFlag('roger:example_viewed');
            playerProgressStore.save();
        }
    }

    _returnToMenu() {
        narratorService.stop();
        this.cameras.main.fadeOut(240, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(SCENE_KEYS.MAIN_MENU);
        });
    }

    _cleanupScene() {
        narratorService.stop();
        if (this.input?.keyboard) {
            this._navHandlers.forEach(({ eventName, handler }) => {
                this.input.keyboard.off(eventName, handler);
            });
        }
        this._navHandlers = [];
    }
}

export default RogerExampleScene;
