import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { narratorService } from '../../services/NarratorService.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';
import { i18n } from '../../services/i18n.js';
import { ROGER_EXAMPLE_STEPS, ROGER_EXAMPLE_SUPPORTED_LANGS } from '../../content/rogerExampleStory.js';

const UI_TEXT = {
    es: {
        headerKicker: 'ROGER: HISTORIA DE EJEMPLO',
        headerTitle: 'La confusion en el Burgeramt',
        headerCaption: 'Un recorrido amable para aprender aleman y ver como se construye una escena util.',
        learnTitle: 'Lo que aprendes aqui',
        builderTitle: 'Como copiar esta idea',
        vocabTitle: 'Vocabulario util',
        lineTitle: 'Frase en aleman',
        meaningTitle: 'Significado',
        promptTitle: 'Pista amable',
        controls: 'Usa <- y ->, A/D o los botones. Pulsa L para escuchar y ESC para volver al menu.',
        listening: 'Escuchando aleman...',
        ready: 'Pulsa L para volver a escuchar la frase.',
        finishHint: 'Historia completa. Pulsa Menu para volver al escritorio.',
        prev: 'Anterior',
        next: 'Siguiente',
        listen: 'Escuchar',
        finish: 'Menu',
        sceneWord: 'ESCENA',
    },
    en: {
        headerKicker: 'ROGER: EXAMPLE STORY',
        headerTitle: 'The Burgeramt Confusion',
        headerCaption: 'A friendly walkthrough to learn German and see how a useful scene is built.',
        learnTitle: 'What you learn here',
        builderTitle: 'How to copy this idea',
        vocabTitle: 'Useful vocabulary',
        lineTitle: 'German line',
        meaningTitle: 'Meaning',
        promptTitle: 'Friendly hint',
        controls: 'Use <- and ->, A/D or the buttons. Press L to listen and ESC to return to the menu.',
        listening: 'Listening to German...',
        ready: 'Press L to hear the line again.',
        finishHint: 'Story complete. Press Menu to return to the desktop.',
        prev: 'Previous',
        next: 'Next',
        listen: 'Listen',
        finish: 'Menu',
        sceneWord: 'SCENE',
    },
    de: {
        headerKicker: 'ROGER: BEISPIELGESCHICHTE',
        headerTitle: 'Die Burgeramt-Verwirrung',
        headerCaption: 'Eine freundliche Tour zum Deutschlernen und als Vorlage fur eigene Szenen.',
        learnTitle: 'Das lernst du hier',
        builderTitle: 'So kopierst du die Idee',
        vocabTitle: 'Nutzlicher Wortschatz',
        lineTitle: 'Satz auf Deutsch',
        meaningTitle: 'Bedeutung',
        promptTitle: 'Freundlicher Hinweis',
        controls: 'Nutze <- und ->, A/D oder die Buttons. Drucke L zum Horen und ESC fur das Menu.',
        listening: 'Deutsch wird abgespielt...',
        ready: 'Drucke L, um den Satz noch einmal zu horen.',
        finishHint: 'Geschichte fertig. Drucke Menu, um zum Desktop zuruckzugehen.',
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
        this._navHandlers = [];
    }

    create() {
        const { width, height } = this.cameras.main;

        this._createBackdrop(width, height);
        this._createHeader(width);
        this._createImageStage();
        this._createLearningPanel();
        this._createDialoguePanel(width, height);
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

        const scanlines = this.add.graphics().setAlpha(0.12);
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
            fontSize: '12px',
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
        this.imageCard = this._createCard(20, 92, 474, 246, {
            fillColor: 0x0c1119,
            fillAlpha: 0.95,
            strokeColor: 0x607089,
            accentColor: 0xf2c166,
            bottomColor: 0x7a8ba3,
        });

        this.imageFrame = this.add.rectangle(16, 20, 442, 184, 0x05070c, 1)
            .setOrigin(0)
            .setStrokeStyle(1, 0x8897a9, 0.8);
        this.storyImage = this.add.image(237, 112, ROGER_EXAMPLE_STEPS[0].imageKey);
        this._fitImageToStage(ROGER_EXAMPLE_STEPS[0].imageKey);

        this.imageTitleChip = this.add.rectangle(16, 212, 442, 18, 0x101a28, 0.98)
            .setOrigin(0)
            .setStrokeStyle(1, 0x536479, 0.65);
        this.imageTitleText = this.add.text(24, 213, '', {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#e6edf7',
        });

        this.imageCard.add([this.imageFrame, this.storyImage, this.imageTitleChip, this.imageTitleText]);
    }

    _createLearningPanel() {
        this.learnCard = this._createCard(512, 92, 268, 246, {
            fillColor: 0x0e1725,
            fillAlpha: 0.95,
            strokeColor: 0x607089,
            accentColor: 0x8ecae6,
            bottomColor: 0x7a8ba3,
        });

        this.learnTitleText = this.add.text(16, 16, this._t('learnTitle').toUpperCase(), {
            fontFamily: 'VT323',
            fontSize: '20px',
            color: '#8ecae6',
        });
        this.promptText = this.add.text(16, 42, '', {
            fontFamily: 'VT323',
            fontSize: '16px',
            color: '#eef4ff',
            lineSpacing: 1,
            wordWrap: { width: 236 },
        });

        this.builderHeading = this.add.text(16, 102, this._t('builderTitle').toUpperCase(), {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#f6c96f',
        });
        this.builderText = this.add.text(16, 124, '', {
            fontFamily: 'VT323',
            fontSize: '15px',
            color: '#c5d3e4',
            lineSpacing: 1,
            wordWrap: { width: 236 },
        });

        this.vocabHeading = this.add.text(16, 180, this._t('vocabTitle').toUpperCase(), {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#9ef0bf',
        });
        this.vocabContainer = this.add.container(16, 202);

        this.learnCard.add([
            this.learnTitleText,
            this.promptText,
            this.builderHeading,
            this.builderText,
            this.vocabHeading,
            this.vocabContainer,
        ]);
    }

    _createDialoguePanel(width, height) {
        this.dialogueCard = this._createCard(20, height - 250, width - 40, 230, {
            fillColor: 0x0b1320,
            fillAlpha: 0.96,
            strokeColor: 0x607089,
            accentColor: 0xf2c166,
            bottomColor: 0x7a8ba3,
        });

        this.sceneBadge = this.add.rectangle(18, 16, 116, 22, 0x1b2433, 0.98)
            .setOrigin(0)
            .setStrokeStyle(1, 0x607089, 0.65);
        this.sceneBadgeText = this.add.text(76, 18, '', {
            fontFamily: 'VT323',
            fontSize: '17px',
            color: '#f2c166',
        }).setOrigin(0.5, 0);

        this.speakerChip = this.add.rectangle(146, 16, 132, 22, 0x142033, 0.98)
            .setOrigin(0)
            .setStrokeStyle(1, 0x8ecae6, 0.65);
        this.speakerText = this.add.text(212, 18, '', {
            fontFamily: 'VT323',
            fontSize: '17px',
            color: '#eef4ff',
        }).setOrigin(0.5, 0);

        this.dialogueDivider = this.add.rectangle(418, 50, 1, 152, 0x42566d, 0.85).setOrigin(0);

        this.lineHeading = this.add.text(18, 50, this._t('lineTitle').toUpperCase(), {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#8ecae6',
        });
        this.germanLineText = this.add.text(18, 72, '', {
            fontFamily: 'VT323',
            fontSize: '22px',
            color: '#fff6d9',
            lineSpacing: 2,
            wordWrap: { width: 382 },
        });

        this.meaningHeading = this.add.text(442, 50, this._t('meaningTitle').toUpperCase(), {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#f2c166',
        });
        this.translationText = this.add.text(442, 72, '', {
            fontFamily: 'VT323',
            fontSize: '18px',
            color: '#d9e4f2',
            lineSpacing: 1,
            wordWrap: { width: 284 },
        });

        this.statusText = this.add.text(442, 156, '', {
            fontFamily: 'VT323',
            fontSize: '16px',
            color: '#8ecae6',
            lineSpacing: 1,
            wordWrap: { width: 284 },
        }).setOrigin(0, 0);

        this.dialogueCard.add([
            this.sceneBadge,
            this.sceneBadgeText,
            this.speakerChip,
            this.speakerText,
            this.dialogueDivider,
            this.lineHeading,
            this.germanLineText,
            this.meaningHeading,
            this.translationText,
            this.statusText,
        ]);
    }

    _createControls() {
        this.prevButton = this._createButton(446, 188, 86, this._t('prev'), () => this._goPrev(), 0x223043, 0x8ecae6);
        this.listenButton = this._createButton(544, 188, 96, this._t('listen'), () => this._speakCurrentLine(), 0x2a281a, 0xf2c166);
        this.nextButton = this._createButton(652, 188, 86, this._t('next'), () => this._goNext(), 0x1f3326, 0x8fe3b0);

        this.controlsHint = this.add.text(18, 186, this._t('controls'), {
            fontFamily: 'VT323',
            fontSize: '15px',
            color: '#9fb0c4',
            lineSpacing: 1,
            wordWrap: { width: 392 },
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
        this._fitText(this.promptText, this._pick(step.coach), {
            maxFontSize: 16,
            minFontSize: 13,
            maxHeight: 48,
            wordWrapWidth: 236,
        });
        this._fitText(this.builderText, this._pick(step.builder), {
            maxFontSize: 15,
            minFontSize: 12,
            maxHeight: 52,
            wordWrapWidth: 236,
        });
        this.sceneBadgeText.setText(`${this._t('sceneWord')} ${index}`);
        this.speakerText.setText(this._pick(step.speaker).toUpperCase());
        this._fitText(this.germanLineText, step.lineDe, {
            maxFontSize: 22,
            minFontSize: 18,
            maxHeight: 92,
            wordWrapWidth: 382,
        });
        this._fitText(this.translationText, this._pick(step.translation), {
            maxFontSize: 18,
            minFontSize: 15,
            maxHeight: 72,
            wordWrapWidth: 284,
        });
        this._fitImageToStage(step.imageKey);
        this._fitText(this.statusText, this._t('ready'), {
            maxFontSize: 16,
            minFontSize: 14,
            maxHeight: 34,
            wordWrapWidth: 284,
        });

        this.progressDots.forEach((dot, dotIndex) => {
            dot.setFillStyle(dotIndex <= this.currentStepIndex ? step.accentColor : 0x334155, dotIndex <= this.currentStepIndex ? 1 : 0.65);
        });

        this._refreshButtonState();
        this._renderVocabulary(step);

        const isLast = this.currentStepIndex === total - 1;
        this._fitText(this.statusText, isLast ? this._t('finishHint') : this._t('ready'), {
            maxFontSize: 16,
            minFontSize: 14,
            maxHeight: 34,
            wordWrapWidth: 284,
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
            targets: [this.storyImage, this.germanLineText, this.translationText, this.promptText, this.builderText],
            alpha: { from: 0.35, to: 1 },
            duration: 240,
            ease: 'Quad.easeOut',
        });

        this.tweens.add({
            targets: [this.imageTitleChip, this.sceneBadge, this.speakerChip],
            scaleX: { from: 0.98, to: 1 },
            scaleY: { from: 0.98, to: 1 },
            duration: 180,
            ease: 'Back.easeOut',
        });

        this.sceneBadge.setStrokeStyle(1, accentColor, 0.8);
    }

    _renderVocabulary(step) {
        this.vocabContainer.removeAll(true);

        let currentY = 0;
        step.vocab.forEach((item) => {
            const label = `${item.de}  -  ${item[this.locale] || item.es || item.en}`;
            const width = Math.min(226, Math.max(150, label.length * 5.8));
            const chipBg = this.add.rectangle(0, currentY, width, 18, 0x142033, 0.98)
                .setOrigin(0)
                .setStrokeStyle(1, step.accentColor, 0.5);
            const chipText = this.add.text(8, currentY + 2, label, {
                fontFamily: 'VT323',
                fontSize: '15px',
                color: '#eef4ff',
            });

            this.vocabContainer.add([chipBg, chipText]);
            currentY += 20;
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
        const sourceWidth = frame?.width || 442;
        const sourceHeight = frame?.height || 184;
        const targetWidth = 442;
        const targetHeight = 184;
        const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
        const cropWidth = targetWidth / scale;
        const cropHeight = targetHeight / scale;
        const cropX = Math.max(0, (sourceWidth - cropWidth) / 2);
        const cropY = Math.max(0, (sourceHeight - cropHeight) / 2);

        this.storyImage.setCrop(cropX, cropY, cropWidth, cropHeight);
        this.storyImage.setDisplaySize(targetWidth, targetHeight);
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
            maxFontSize: 16,
            minFontSize: 14,
            maxHeight: 34,
            wordWrapWidth: 284,
        });

        narratorService.stop();
        narratorService.narrateInGerman(step.lineDe, null, () => {
            if (!this.statusText?.active) return;
            this._fitText(this.statusText, this._restingStatusText(auto), {
                maxFontSize: 16,
                minFontSize: 14,
                maxHeight: 34,
                wordWrapWidth: 284,
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
