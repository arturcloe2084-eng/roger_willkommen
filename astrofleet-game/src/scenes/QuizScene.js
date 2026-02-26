import Phaser from 'phaser';
import { PlayerState } from '../services/PlayerState.js';

/**
 * QuizScene — Test de 4 opciones generado desde vocabulary.json
 * Muestra una palabra en alemán (o español) y 4 opciones de traducción.
 * Las opciones se generan mezclando la respuesta correcta con distractores aleatorios.
 */
export class QuizScene extends Phaser.Scene {
    constructor() {
        super('QuizScene');
    }

    init(data) {
        this.returnScene = data.returnScene || 'SceneEngine';
    }

    create() {
        const { width, height } = this.cameras.main;
        const vocabData = this.cache.json.get('vocabularyData');
        const allWords = vocabData.words;

        if (allWords.length < 4) {
            // No hay suficientes palabras para un quiz
            this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0);
            this.add.text(width / 2, height / 2, 'Necesitas al menos 4 palabras en tu lista\npara hacer un quiz.\n\n¡Sigue explorando y hablando!\n\nPulsa ESC para volver.', {
                fontFamily: 'VT323',
                fontSize: '22px',
                fill: '#ffcc00',
                align: 'center',
                lineSpacing: 8
            }).setOrigin(0.5);
            this.input.keyboard.once('keydown-ESC', () => this.closeScene());
            return;
        }

        // Estado del quiz
        this.allWords = allWords;
        this.questionIndex = 0;
        this.totalQuestions = Math.min(5, allWords.length);
        this.questionsPool = Phaser.Utils.Array.Shuffle([...allWords]).slice(0, this.totalQuestions);
        this.score = 0;
        this.quizFinished = false;
        this.resultPercent = 0;

        // ═══ UI ═══
        this.add.rectangle(0, 0, width, height, 0x000000, 0.88).setOrigin(0).setDepth(0);

        // Marco del test
        const panelW = 700;
        const panelH = 400;
        this.add.rectangle(width / 2, height / 2, panelW, panelH, 0x0a0a2a, 0.95).setDepth(1);
        this.add.rectangle(width / 2, height / 2, panelW, panelH).setStrokeStyle(3, 0x00ff41).setDepth(1).setFillStyle(0x000000, 0);

        // Título
        this.add.text(width / 2, height / 2 - panelH / 2 + 25, '📝 SPRACHTEST — Quiz de vocabulario', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            fill: '#00ff41'
        }).setOrigin(0.5).setDepth(2);

        // Progreso
        this.progressText = this.add.text(width / 2 + panelW / 2 - 20, height / 2 - panelH / 2 + 25, `1/${this.totalQuestions}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '9px',
            fill: '#888888'
        }).setOrigin(1, 0.5).setDepth(2);

        // Pregunta
        this.questionText = this.add.text(width / 2, height / 2 - 80, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            fill: '#ffffff',
            wordWrap: { width: 600 },
            align: 'center'
        }).setOrigin(0.5).setDepth(2);

        // Subtítulo de pregunta
        this.questionSubtext = this.add.text(width / 2, height / 2 - 50, '', {
            fontFamily: 'VT323',
            fontSize: '20px',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(2);

        // Botones de respuesta (4)
        this.optionButtons = [];
        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const bx = width / 2 - 150 + col * 300;
            const by = height / 2 + row * 65;

            const bg = this.add.rectangle(bx, by, 270, 50, 0x111133).setDepth(2);
            bg.setStrokeStyle(2, 0x334466);
            bg.setInteractive({ useHandCursor: true });

            const label = this.add.text(bx, by, '', {
                fontFamily: 'VT323',
                fontSize: '20px',
                fill: '#ffffff',
                wordWrap: { width: 250 },
                align: 'center'
            }).setOrigin(0.5).setDepth(3);

            const key = this.add.text(bx - 120, by, `${i + 1}`, {
                fontFamily: '"Press Start 2P"',
                fontSize: '10px',
                fill: '#00ff41'
            }).setOrigin(0.5).setDepth(3);

            bg.on('pointerover', () => {
                if (!this._answered) {
                    bg.setFillStyle(0x222255);
                    bg.setStrokeStyle(2, 0x00ff41);
                }
            });
            bg.on('pointerout', () => {
                if (!this._answered) {
                    bg.setFillStyle(0x111133);
                    bg.setStrokeStyle(2, 0x334466);
                }
            });
            bg.on('pointerdown', () => this.selectAnswer(i));

            this.optionButtons.push({ bg, label, key });
        }

        // Feedback
        this.feedbackText = this.add.text(width / 2, height / 2 + 155, '', {
            fontFamily: 'VT323',
            fontSize: '20px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setDepth(2);

        // Teclado numérico
        this.input.keyboard.on('keydown', (event) => {
            if (event.key >= '1' && event.key <= '4') {
                this.selectAnswer(parseInt(event.key) - 1);
            }
            if (event.keyCode === 27) this.closeScene();
        });

        // Mostrar primera pregunta
        this.showQuestion();
    }

    showQuestion() {
        if (this.questionIndex >= this.totalQuestions) {
            this.showResults();
            return;
        }

        this._answered = false;
        const current = this.questionsPool[this.questionIndex];

        // Decidir dirección: alemán → español o español → alemán (alternado)
        this.isGermanToSpanish = this.questionIndex % 2 === 0;

        if (this.isGermanToSpanish) {
            this.questionText.setText(`"${current.word}"`);
            this.questionSubtext.setText('¿Qué significa esta palabra en español?');
            this.correctAnswer = current.translation;
        } else {
            this.questionText.setText(`"${current.translation}"`);
            this.questionSubtext.setText('¿Cómo se dice en alemán?');
            this.correctAnswer = current.word;
        }

        // Generar opciones: 1 correcta + 3 distractores
        const distractors = this.allWords
            .filter(w => w.word !== current.word)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(w => this.isGermanToSpanish ? w.translation : w.word);

        this.options = [this.correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
        this.correctIndex = this.options.indexOf(this.correctAnswer);

        // Actualizar botones
        this.optionButtons.forEach((btn, i) => {
            btn.label.setText(this.options[i] || '—');
            btn.bg.setFillStyle(0x111133);
            btn.bg.setStrokeStyle(2, 0x334466);
        });

        this.progressText.setText(`${this.questionIndex + 1}/${this.totalQuestions}`);
        this.feedbackText.setText('');
    }

    selectAnswer(index) {
        if (this._answered) return;
        this._answered = true;

        const isCorrect = index === this.correctIndex;
        const current = this.questionsPool[this.questionIndex];

        if (isCorrect) {
            this.score++;
            this.optionButtons[index].bg.setFillStyle(0x003300);
            this.optionButtons[index].bg.setStrokeStyle(2, 0x00ff41);
            this.feedbackText.setText('✅ ¡Richtig! (Correcto)');
            this.feedbackText.setFill('#00ff41');

            PlayerState.learnWord(current.word, current.translation);
            PlayerState.addXP(15);
            PlayerState.recordResult('correct');
        } else {
            this.optionButtons[index].bg.setFillStyle(0x330000);
            this.optionButtons[index].bg.setStrokeStyle(2, 0xff3333);
            this.optionButtons[this.correctIndex].bg.setFillStyle(0x003300);
            this.optionButtons[this.correctIndex].bg.setStrokeStyle(2, 0x00ff41);
            this.feedbackText.setText(`❌ La respuesta era: ${this.correctAnswer}`);
            this.feedbackText.setFill('#ff6666');

            PlayerState.recordResult('incorrect');
        }

        this.game.events.emit('update-hud');

        // Siguiente pregunta tras breve pausa
        this.time.delayedCall(1800, () => {
            this.questionIndex++;
            this.showQuestion();
        });
    }

    showResults() {
        const { width, height } = this.cameras.main;
        const percent = Math.round((this.score / this.totalQuestions) * 100);
        this.quizFinished = true;
        this.resultPercent = percent;

        this.questionText.setText(`Resultado: ${this.score}/${this.totalQuestions} (${percent}%)`);
        this.questionText.setFill(percent >= 60 ? '#00ff41' : '#ffcc00');
        this.questionSubtext.setText(
            percent >= 80 ? '¡Ausgezeichnet! (¡Excelente!)' :
                percent >= 60 ? 'Gut gemacht! (¡Bien hecho!)' :
                    'Weiter üben! (¡Sigue practicando!)'
        );

        this.optionButtons.forEach(btn => {
            btn.bg.setVisible(false);
            btn.label.setVisible(false);
            btn.key.setVisible(false);
        });

        if (percent >= 60) {
            PlayerState.addXP(30);
            this.game.events.emit('update-hud');
        }

        this.feedbackText.setText('Pulsa ESC para volver.');
        this.feedbackText.setFill('#888888');
    }

    closeScene() {
        const engine = this.scene.get(this.returnScene);
        if (engine && engine.events) {
            engine.events.emit('mini-complete', {
                type: 'quiz',
                completed: this.quizFinished,
                score: this.score,
                total: this.totalQuestions,
                percent: this.resultPercent,
            });
        }

        this.scene.stop();
        this.scene.resume(this.returnScene);
    }
}
