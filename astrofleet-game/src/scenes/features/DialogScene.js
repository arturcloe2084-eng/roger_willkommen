import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { askNpcDialogue } from '../../services/ai/NpcDialogueService.js';
import { voiceService } from '../../services/audio/VoiceService.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';

/**
 * DialogScene — Diálogo con NPC vía IA (Gemini).
 * Ahora funciona con cualquier NPC definido en scenes.json.
 * Solo necesita: npcName, displayName, personality, returnScene
 */
export class DialogScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.DIALOG);
    }

    init(data) {
        this.npcData = data;
        this.returnScene = data.returnScene || SCENE_KEYS.SCENE_ENGINE;
        this.lastResponse = null;
    }

    create() {
        const { width, height } = this.cameras.main;

        // Overlay oscuro
        this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

        // Caja de diálogo
        const dialogBox = this.add.rectangle(width / 2, height / 2, 700, 450, 0x0a0a2a, 0.95);
        dialogBox.setStrokeStyle(4, 0x00ff41);

        this.titleText = this.add.text(width / 2, height / 2 - 190, `💬 ${this.npcData.displayName}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            fill: '#00ff41',
            wordWrap: { width: 640 }
        }).setOrigin(0.5);

        this.historyText = this.add.text(width / 2 - 320, height / 2 - 140, 'Estableciendo conexión...', {
            fontFamily: 'VT323',
            fontSize: '24px',
            fill: '#ffffff',
            wordWrap: { width: 640 }
        });

        // Input del usuario
        this.inputText = this.add.text(width / 2 - 320, height / 2 + 80, '> Escribe o usa el Micro...', {
            fontFamily: 'VT323',
            fontSize: '24px',
            fill: '#00ffff'
        });

        // --- BOTÓN DE MICRÓFONO ---
        this.micButton = this.add.container(width / 2 + 280, height / 2 + 100);
        const micBg = this.add.circle(0, 0, 30, 0x00ff41, 0.2);
        micBg.setStrokeStyle(2, 0x00ff41);
        const micIcon = this.add.text(0, 0, '🎤', { fontSize: '32px' }).setOrigin(0.5);
        this.micButton.add([micBg, micIcon]);
        this.micButton.setInteractive(new Phaser.Geom.Circle(0, 0, 30), Phaser.Geom.Circle.Contains);

        this.micButton.on('pointerdown', () => this.startVoiceInput());
        this.micButton.on('pointerover', () => micBg.setFillStyle(0x00ff41, 0.5));
        this.micButton.on('pointerout', () => micBg.setFillStyle(0x00ff41, 0.2));

        // --- Nivel del jugador visible ---
        this.add.text(width / 2 + 280, height / 2 - 190, `LVL ${playerProgressStore.level}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            fill: '#888888'
        }).setOrigin(0.5);

        // --- Palabras aprendidas (recordatorio) ---
        const recentWords = playerProgressStore.learnedWords.slice(-3).map(w => w.word).join(', ');
        if (recentWords) {
            this.add.text(width / 2 - 320, height / 2 + 120, `📖 Últimas palabras: ${recentWords}`, {
                fontFamily: 'VT323',
                fontSize: '16px',
                fill: '#555555'
            });
        }

        this.userInput = '';

        // Listener de teclado
        this.input.keyboard.on('keydown', (event) => {
            if (event.keyCode === 27) { // ESC
                this.closeDialog();
                return;
            }
            if (event.keyCode === 8 && this.userInput.length > 0) {
                this.userInput = this.userInput.slice(0, -1);
            } else if (event.keyCode === 13 && this.userInput.length > 0) {
                this.sendMessage();
            } else if (event.key.length === 1 && this.userInput.length < 80) {
                this.userInput += event.key;
            }
            this.inputText.setText(`> ${this.userInput}_`);
        });

        // Saludo inicial según idioma
        const greetings = {
            'German': 'Was kann ich für Sie tun?',
            'English': 'What can I do for you?',
            'Spanish': '¿Qué puedo hacer por usted?'
        };
        const greeting = greetings[playerProgressStore.targetLanguage] || greetings['German'];
        const initialText = `${this.npcData.displayName}: "${greeting}"`;

        this.updateHistory(initialText);
        voiceService.speak(greeting);
    }

    startVoiceInput() {
        this.inputText.setText('> ESCUCHANDO... (Habla ahora)');
        this.micButton.setAlpha(0.5);
        this.tweens.add({
            targets: this.micButton,
            scale: 1.2,
            duration: 200,
            yoyo: true,
            repeat: -1
        });

        voiceService.startListening(
            (text) => {
                this.userInput = text;
                this.inputText.setText(`> ${this.userInput}`);
                this.tweens.killTweensOf(this.micButton);
                this.micButton.setScale(1).setAlpha(1);
                this.sendMessage();
            },
            (error) => {
                console.error('Error Mic:', error);
                this.inputText.setText(`> ERROR MIC: ${error}. Escribe manual.`);
                this.tweens.killTweensOf(this.micButton);
                this.micButton.setScale(1).setAlpha(1);
            }
        );
    }

    updateHistory(text) {
        this.historyText.setText(text);
    }

    async sendMessage() {
        const message = this.userInput;
        this.userInput = '';
        this.inputText.setText('> ...PROCESANDO...');
        this.updateHistory(`Tú: "${message}"\n\nEsperando respuesta...`);

        const storyContext = `Contexto narrativo actual: Día ${playerProgressStore.story.day}, Capítulo "${playerProgressStore.story.chapter}", Objetivo "${playerProgressStore.story.activeObjective}".`;
        const response = await askNpcDialogue(`${this.npcData.personality}\n${storyContext}`, message, {
            targetLanguage: playerProgressStore.targetLanguage,
            level: playerProgressStore.level
        });
        this.lastResponse = response;

        // Procesar resultado
        playerProgressStore.recordResult(response.evaluation);
        if (response.xp_reward) {
            playerProgressStore.addXP(response.xp_reward);
            this.game.events.emit('update-hud');
        }

        // Leer respuesta en voz alta
        voiceService.speak(response.npc_dialogue);

        // Mostrar respuesta
        let fullText = `${this.npcData.displayName}: "${response.npc_dialogue}"\n\n`;
        fullText += `[EVALUACIÓN]: ${response.evaluation.toUpperCase()}\n`;
        fullText += `[CONSEJO]: ${response.feedback_es}\n\n`;
        fullText += `Escribe otra respuesta o ESC para salir.`;

        this.updateHistory(fullText);
        this.inputText.setText('> _');

        // Si hay acción de juego (abrir puerta, etc.)
        if (response.game_action === 'open_door') {
            const engine = this.scene.get(this.returnScene);
            if (engine && engine.events) {
                engine.events.emit('open-door', this.npcData.npcName);
            }

            this.time.delayedCall(2000, () => {
                this.closeDialog();
            });
        }
    }

    closeDialog() {
        const engine = this.scene.get(this.returnScene);
        if (engine && engine.events) {
            engine.events.emit('dialog-closed', {
                npcName: this.npcData?.npcName || this.npcData?.name || this.npcData?.displayName,
                displayName: this.npcData?.displayName,
                evaluation: this.lastResponse?.evaluation || null,
                gameAction: this.lastResponse?.game_action || null,
            });
        }

        this.scene.stop();
        this.scene.resume(this.returnScene);
    }
}
