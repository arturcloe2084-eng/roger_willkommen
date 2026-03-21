/**
 * RogerExampleScene — Escena de ejemplo interactiva que sirve como template para LLM
 * El jugador aprende a crear escenas viendo este ejemplo.
 * Incluye: narración en alemán, diálogos con personajes, modo karaoke
 */

import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { narratorService } from '../../services/NarratorService.js';
import { karaokeModeService } from '../../services/KaraokeModeService.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';
import { askNpcDialogue } from '../../services/ai/NpcDialogueService.js';
import { i18n } from '../../services/i18n.js';

/**
 * ESTRUCTURA DE LA ESCENA ROGER:
 * Act 1: Introductory narration + protagonist karaoke
 * Act 2: Dialogue with NPC (dynamic via IA)
 * Act 3: Karaoke finale
 */
export class RogerExampleScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.ROGER_EXAMPLE);
    }

    init(data) {
        this.actStep = 0;
        this.dialogueIndex = 0;
        this.xpEarned = 0;
        this.isProcessing = false;
        this.currentKeyboardListener = null;
    }

    create() {
        const { width, height } = this.cameras.main;

        // ═══ SETUP BASE ═══
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

        // Backdrop con efecto crt
        this.createCRTOverlay(width, height);

        // UI básica
        this.createUI(width, height);

        // Logging
        console.log('[RogerExampleScene] Created successfully');

        // Iniciar ACT 1
        this.time.delayedCall(500, () => this.startAct1(width, height));
    }

    createCRTOverlay(width, height) {
        const scanlines = this.add.graphics().setDepth(90).setAlpha(0.3);
        scanlines.fillStyle(0x000000, 0.08);
        for (let y = 0; y < height; y += 4) {
            scanlines.fillRect(0, y, width, 2);
        }
    }

    createUI(width, height) {
        // Title
        this.titleText = this.add.text(width / 2, 20, '📖 ROGER EXAMPLE SCENE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            fill: '#00ff41',
            align: 'center'
        }).setOrigin(0.5).setDepth(80);

        // Subtitle: Act indicator
        this.actIndicator = this.add.text(20, 50, 'ACT 1: INTRODUCTION', {
            fontFamily: 'VT323',
            fontSize: '16px',
            fill: '#00ffff'
        }).setDepth(80);

        // XP Counter
        this.xpText = this.add.text(width - 20, 20, `XP: 0`, {
            fontFamily: 'VT323',
            fontSize: '14px',
            fill: '#ffaa00',
            align: 'right'
        }).setOrigin(1, 0).setDepth(80);

        // Subtitle box
        this.subtitleBox = this.add.rectangle(width / 2, height - 60, width - 40, 80, 0x0a0a0a, 0.9);
        this.subtitleBox.setStrokeStyle(2, 0x00ff41);
        this.subtitleBox.setDepth(70);

        this.subtitleText = this.add.text(width / 2, height - 60, '', {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#ffffff',
            wordWrap: { width: width - 80 },
            align: 'center'
        }).setOrigin(0.5).setDepth(71);

        // Narrator indicator
        this.narratorLabel = this.add.text(20, height - 30, '🎙️ NARRATOR', {
            fontFamily: 'VT323',
            fontSize: '12px',
            fill: '#00ff41'
        }).setDepth(80);

        // Control info
        this.controlText = this.add.text(width / 2, height - 20, 'Press SPACE to continue or speak to interact', {
            fontFamily: 'VT323',
            fontSize: '11px',
            fill: '#555555',
            align: 'center'
        }).setOrigin(0.5).setDepth(80);
    }

    startAct1(width, height) {
        // ACT 1: Introducción narrativa
        this.isProcessing = true;
        this.actStep = 1;
        this.actIndicator.setText('ACT 1: INTRODUCTION');

        const act1Narration = {
            text: 'Willkommen in Berlin. Der Protagonist steht vor der Wohnung. Es ist kalt und regnet.',
            duration: 6000,
            translations: {
                es: 'Bienvenido a Berlín. El protagonista está frente al apartamento. Hace frío y llueve.',
                en: 'Welcome to Berlin. The protagonist stands before the apartment. It is cold and raining.'
            }
        };

        // Permitir saltar presionando SPACE
        const spaceListener = () => {
            narratorService.stop();
            this.isProcessing = false;
            this.input.keyboard.off('keydown-SPACE', spaceListener);
            this.time.delayedCall(300, () => this.startProtagonistKaraoke(width, height));
        };
        this.input.keyboard.on('keydown-SPACE', spaceListener);
        this.currentKeyboardListener = spaceListener;

        // Reproducir narración
        narratorService.narrateInGerman(act1Narration, (subtitle, lang) => {
            this.updateSubtitle(subtitle, lang);
        }, () => {
            // Cuando termina la narración, pasar a karaoke del protagonista
            this.isProcessing = false;
            this.input.keyboard.off('keydown-SPACE', spaceListener);
            this.time.delayedCall(500, () => this.startProtagonistKaraoke(width, height));
        });
    }

    startProtagonistKaraoke(width, height) {
        // El jugador debe decir la línea del protagonista en modo karaoke
        if (this.isProcessing) return;
        this.isProcessing = true;
        this.actStep = 2;

        this.narratorLabel.setText('🎤 YOUR TURN (KARAOKE)');
        this.controlText.setText('Speak now: "Es tut mir leid, können Sie mir helfen?" or similar');

        const protagonistLine = {
            text: 'Es tut mir leid, können Sie mir helfen?',
            character: 'Roger (Protagonist)',
            duration: 5000
        };

        karaokeModeService.startLine(
            protagonistLine,
            (result) => {
                console.log('[Roger] Karaoke result:', result);
                if (result.similarity > 0.6) {
                    // ✓ Éxito
                    this.xpEarned += 25;
                    this.updateXP();
                    this.showFeedback(`✓ GREAT! ${(result.similarity * 100).toFixed(0)}% similar!`, 0x00ff00);
                    this.time.delayedCall(1500, () => {
                        this.isProcessing = false;
                        this.startAct2(width, height);
                    });
                } else if (result.similarity >= 0.4) {
                    // Retry - similitud entre 40-60%
                    this.showFeedback(`⚠️ ${(result.similarity * 100).toFixed(0)}% - Try again!`, 0xff6600);
                    this.time.delayedCall(800, () => {
                        this.isProcessing = false;
                        this.startProtagonistKaraoke(width, height);
                    });
                } else {
                    // Fallo - similitud < 40%
                    this.showFeedback(`✗ ${(result.similarity * 100).toFixed(0)}% - Moving on...`, 0xff3333);
                    this.time.delayedCall(1500, () => {
                        this.isProcessing = false;
                        this.startAct2(width, height);
                    });
                }
            },
            (success) => {
                if (!success) {
                    this.showFeedback('⏱️ Time\'s up! Moving on...', 0xffaa00);
                    this.time.delayedCall(1500, () => {
                        this.isProcessing = false;
                        this.startAct2(width, height);
                    });
                }
            }
        );
    }

    async startAct2(width, height) {
        // ACT 2: Diálogo con un NPC
        if (this.isProcessing) return;
        this.isProcessing = true;
        this.actStep = 3;

        this.actIndicator.setText('ACT 2: DIALOGUE WITH NPC');
        this.narratorLabel.setText('🎙️ DOORMAN');
        this.controlText.setText('Listen to the response and decide what to do next');

        // Simular respuesta de IA (o usar API real)
        const npcResponse = {
            npc_dialogue: 'Ah ja? Du brauchst Hilfe? Was ist denn los?',
            feedback_es: 'El portero quiere saber más detalles.',
            translations: {
                es: '¿Ah sí? ¿Necesitas ayuda? ¿Qué pasa?',
                en: 'Ah yes? You need help? What\'s going on?'
            }
        };

        // Reproducir respuesta del NPC
        narratorService.narrateInGerman(npcResponse, (subtitle, lang) => {
            this.updateSubtitle(subtitle, lang);
        }, () => {
            this.time.delayedCall(500, () => this.showDialogueOptions(width, height));
        });
    }

    showDialogueOptions(width, height) {
        // Mostrar opciones de diálogo
        const options = [
            'Ich habe die Wohnung verloren...',
            'Können Sie mir die Adresse geben?',
            'Danke für Ihre Hilfe'
        ];

        const y = height / 2;
        const optionTexts = [];

        options.forEach((option, idx) => {
            const optY = y - 50 + idx * 50;
            const optText = this.add.text(width / 2 - 300, optY, `[${idx + 1}] ${option}`, {
                fontFamily: 'VT323',
                fontSize: '14px',
                fill: '#00ffff',
                wordWrap: { width: 600 }
            }).setInteractive().setDepth(80);

            optText.on('pointerover', () => optText.setFill('#ffff00'));
            optText.on('pointerout', () => optText.setFill('#00ffff'));
            optText.on('pointerdown', () => {
                // Limpiar opciones
                optionTexts.forEach(t => {
                    t.destroy();
                });
                this.handleDialogueChoice(option, width, height);
            });

            optionTexts.push(optText);
        });
    }

    handleDialogueChoice(choice, width, height) {
        // Feedback de la opción elegida
        this.showFeedback(`You chose: "${choice}"`, 0x00ffff);

        // Simular respuesta dinámica
        const npcResponse = 'Gute Frage! Lass mich helfen...'; // El texto en alemán

        narratorService.narrateInGerman(npcResponse, (subtitle, lang) => {
            this.updateSubtitle(subtitle, lang);
        }, () => {
            this.xpEarned += 15;
            this.updateXP();
            this.time.delayedCall(1000, () => {
                this.isProcessing = false;
                this.startAct3(width, height);
            });
        });
    }

    startAct3(width, height) {
        // ACT 3: Karaoke final + conclusión
        if (this.isProcessing) return;
        this.isProcessing = true;
        this.actStep = 4;

        this.actIndicator.setText('ACT 3: FINALE');
        this.narratorLabel.setText('🎤 FINAL KARAOKE');
        this.controlText.setText('Final practice: Say the closing line');

        const finalLine = {
            text: 'Danke schön für Ihre Hilfe!',
            character: 'Roger (Protagonist)',
            duration: 5000
        };

        karaokeModeService.startLine(
            finalLine,
            (result) => {
                if (result.similarity > 0.5) {
                    this.xpEarned += 30;
                    this.updateXP();
                    this.showFeedback('✓ EXCELLENT! Scene completed!', 0x00ff00);
                    this.time.delayedCall(2000, () => this.endScene(width, height));
                } else {
                    this.time.delayedCall(2000, () => this.endScene(width, height));
                }
            },
            (success) => {
                this.time.delayedCall(2000, () => this.endScene(width, height));
            }
        );
    }

    endScene(width, height) {
        // Pantalla final
        this.isProcessing = false;
        this.actStep = 5;
        
        // Parar narración y karaoke
        narratorService.stop();
        karaokeModeService.stop();

        const endBox = this.add.rectangle(width / 2, height / 2, width - 80, height - 80, 0x0a0a2a, 0.95);
        endBox.setStrokeStyle(3, 0x00ff41);
        endBox.setDepth(80);

        this.add.text(width / 2, height / 2 - 80, 'SCENE COMPLETED!', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            fill: '#00ff41',
            align: 'center'
        }).setOrigin(0.5).setDepth(81);

        this.add.text(width / 2, height / 2 - 20, `Total XP earned: +${this.xpEarned}`, {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#ffaa00',
            align: 'center'
        }).setOrigin(0.5).setDepth(81);

        this.add.text(width / 2, height / 2 + 30, 'You can now create your own scenes using this as a template', {
            fontFamily: 'VT323',
            fontSize: '12px',
            fill: '#888888',
            wordWrap: { width: 400 },
            align: 'center'
        }).setOrigin(0.5).setDepth(81);

        this.add.text(width / 2, height / 2 + 100, 'Press SPACE to return to menu', {
            fontFamily: 'VT323',
            fontSize: '14px',
            fill: '#00ffff',
            align: 'center'
        }).setOrigin(0.5).setDepth(81);

        // Listener para salir
        const exitListener = () => {
            this.input.keyboard.off('keydown-SPACE', exitListener);
            this.scene.stop();
            this.scene.start(SCENE_KEYS.MAIN_MENU);
        };

        this.input.keyboard.once('keydown-SPACE', exitListener);
    }

    updateSubtitle(text, language) {
        this.subtitleText.setText(text);

        // Cambiar color según idioma
        const colors = { de: '#ffffff', es: '#ffcc00', en: '#00ffff' };
        this.subtitleText.setFill(colors[language] || '#ffffff');
    }

    showFeedback(message, color) {
        const feedbackText = this.add.text(
            this.cameras.main.width / 2,
            100,
            message,
            {
                fontFamily: 'VT323',
                fontSize: '16px',
                fill: color,
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(85);

        this.tweens.add({
            targets: feedbackText,
            alpha: 0,
            duration: 2000,
            delay: 500,
            ease: 'Power1.easeOut',
            onComplete: () => feedbackText.destroy()
        });
    }

    updateXP() {
        this.xpText.setText(`XP: ${this.xpEarned}`);

        // Pequeña animación
        this.tweens.add({
            targets: this.xpText,
            scale: 1.3,
            duration: 200,
            yoyo: true
        });
    }

    shutdown() {
        // Cleanup cuando la escena se cierra
        narratorService.stop();
        if (karaokeModeService) karaokeModeService.stop();
        if (this.currentKeyboardListener) {
            this.input.keyboard.off('keydown-SPACE', this.currentKeyboardListener);
        }
        console.log('[RogerExampleScene] Cleaned up');
    }

    sleep() {
        // Cleanup cuando la escena se pausa
        narratorService.stop();
        if (karaokeModeService) karaokeModeService.stop();
    }
}

export default RogerExampleScene;
