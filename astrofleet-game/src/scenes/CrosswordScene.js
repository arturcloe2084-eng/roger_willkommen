import Phaser from 'phaser';
import { PlayerState } from '../services/PlayerState.js';

/**
 * CrosswordScene — Crucigrama generado automáticamente desde vocabulary.json
 * Se alimenta de las palabras del jugador. Cada vez que se abre, genera
 * un crucigrama nuevo con palabras aleatorias de la lista.
 */
export class CrosswordScene extends Phaser.Scene {
    constructor() {
        super('CrosswordScene');
    }

    init(data) {
        this.returnScene = data.returnScene || 'SceneEngine';
    }

    create() {
        const { width, height } = this.cameras.main;
        const vocabData = this.cache.json.get('vocabularyData');
        const allWords = vocabData.words;
        this.completedPuzzle = false;

        // Seleccionar 5 palabras aleatorias (o menos si no hay suficientes)
        const count = Math.min(5, allWords.length);
        this.selectedWords = Phaser.Utils.Array.Shuffle([...allWords]).slice(0, count);

        // Overlay oscuro
        this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0).setDepth(0);

        // Marco del periódico
        const paperW = 680;
        const paperH = 420;
        const paperX = width / 2;
        const paperY = height / 2;

        // Fondo papel
        this.add.rectangle(paperX, paperY, paperW, paperH, 0xf5e6c8).setDepth(1);
        this.add.rectangle(paperX, paperY, paperW - 4, paperH - 4, 0xeadbb8).setDepth(1);

        // Título del periódico
        this.add.text(paperX, paperY - paperH / 2 + 25, '📰 BERLINER KREUZWORTRÄTSEL', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            fill: '#333333'
        }).setOrigin(0.5).setDepth(2);

        this.add.text(paperX, paperY - paperH / 2 + 45, 'Completar las palabras en alemán', {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#666666'
        }).setOrigin(0.5).setDepth(2);

        // Línea decorativa
        this.add.rectangle(paperX, paperY - paperH / 2 + 58, paperW - 40, 1, 0x999999).setDepth(2);

        // ═══ PISTAS Y CAMPOS DE ENTRADA ═══
        this.inputFields = [];
        this.currentField = 0;

        this.selectedWords.forEach((wordObj, index) => {
            const yPos = paperY - paperH / 2 + 80 + (index * 60);

            // Número de pista
            this.add.text(paperX - paperW / 2 + 30, yPos, `${index + 1}.`, {
                fontFamily: '"Press Start 2P"',
                fontSize: '10px',
                fill: '#333333'
            }).setOrigin(0, 0.5).setDepth(2);

            // Pista en español
            this.add.text(paperX - paperW / 2 + 60, yPos, wordObj.translation, {
                fontFamily: 'VT323',
                fontSize: '22px',
                fill: '#444444'
            }).setOrigin(0, 0.5).setDepth(2);

            // Categoría
            this.add.text(paperX - paperW / 2 + 60, yPos + 16, `[${wordObj.category}]`, {
                fontFamily: 'VT323',
                fontSize: '14px',
                fill: '#999999'
            }).setOrigin(0, 0.5).setDepth(2);

            // Campo de respuesta
            const fieldBg = this.add.rectangle(
                paperX + 120, yPos,
                220, 30,
                index === 0 ? 0xddffdd : 0xffffff
            ).setDepth(2);
            fieldBg.setStrokeStyle(2, index === 0 ? 0x00aa00 : 0x999999);

            const fieldText = this.add.text(paperX + 20, yPos, '> _', {
                fontFamily: '"Press Start 2P"',
                fontSize: '10px',
                fill: '#000000'
            }).setOrigin(0, 0.5).setDepth(3);

            // Indicador de resultado
            const resultIcon = this.add.text(paperX + 240, yPos, '', {
                fontSize: '20px'
            }).setOrigin(0.5).setDepth(3);

            this.inputFields.push({
                wordObj,
                bg: fieldBg,
                text: fieldText,
                resultIcon,
                userInput: '',
                solved: false
            });
        });

        // ═══ INSTRUCCIONES ═══
        this.statusText = this.add.text(paperX, paperY + paperH / 2 - 30, 'Escribe la palabra en alemán. ENTER para confirmar. TAB para siguiente. ESC para salir.', {
            fontFamily: 'VT323',
            fontSize: '16px',
            fill: '#666666'
        }).setOrigin(0.5).setDepth(2);

        // Contador de resueltas
        this.solvedText = this.add.text(paperX + paperW / 2 - 30, paperY - paperH / 2 + 25, `0/${count}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            fill: '#00aa00'
        }).setOrigin(1, 0.5).setDepth(2);

        // ═══ INPUT DE TECLADO ═══
        this.input.keyboard.on('keydown', (event) => {
            const field = this.inputFields[this.currentField];
            if (!field || field.solved) {
                // Buscar siguiente no resuelto
                this.nextField();
                return;
            }

            if (event.keyCode === 27) { // ESC
                this.closeScene();
            } else if (event.keyCode === 9) { // TAB
                event.preventDefault();
                this.nextField();
            } else if (event.keyCode === 13) { // ENTER
                this.checkAnswer(this.currentField);
            } else if (event.keyCode === 8) { // BACKSPACE
                field.userInput = field.userInput.slice(0, -1);
                field.text.setText(`> ${field.userInput}_`);
            } else if (event.key.length === 1 && field.userInput.length < 30) {
                field.userInput += event.key;
                field.text.setText(`> ${field.userInput}_`);
            }
        });
    }

    checkAnswer(index) {
        const field = this.inputFields[index];
        const correct = field.wordObj.word.toLowerCase().trim();
        const userAnswer = field.userInput.toLowerCase().trim();

        if (userAnswer === correct) {
            // ¡Correcto!
            field.solved = true;
            field.bg.setFillStyle(0xccffcc);
            field.bg.setStrokeStyle(2, 0x00aa00);
            field.text.setText(`> ${field.wordObj.word}`);
            field.text.setFill('#006600');
            field.resultIcon.setText('✅');

            PlayerState.learnWord(field.wordObj.word, field.wordObj.translation);
            PlayerState.addXP(20);
            this.game.events.emit('update-hud');

            // Actualizar contador
            const solved = this.inputFields.filter(f => f.solved).length;
            this.solvedText.setText(`${solved}/${this.inputFields.length}`);

            if (solved === this.inputFields.length) {
                this.statusText.setText('🎉 ¡CRUCIGRAMA COMPLETADO! +50 XP BONUS. Pulsa ESC para salir.');
                this.statusText.setFill('#006600');
                PlayerState.addXP(50);
                this.game.events.emit('update-hud');
                this.completedPuzzle = true;
            } else {
                this.nextField();
            }
        } else {
            // Incorrecto — mostrar pista
            field.bg.setFillStyle(0xffdddd);
            field.bg.setStrokeStyle(2, 0xcc0000);
            field.resultIcon.setText('❌');

            // Mostrar la primera letra como pista
            this.statusText.setText(`Pista: empieza con "${field.wordObj.word.charAt(0).toUpperCase()}..." — Inténtalo de nuevo.`);
            this.statusText.setFill('#cc0000');

            // Reset visual después de un momento
            this.time.delayedCall(1500, () => {
                field.bg.setFillStyle(0xffffff);
                field.bg.setStrokeStyle(2, 0x00aa00);
                field.resultIcon.setText('');
                field.userInput = '';
                field.text.setText('> _');
                this.statusText.setText('Escribe la palabra en alemán. ENTER para confirmar.');
                this.statusText.setFill('#666666');
            });
        }
    }

    nextField() {
        // Ir al siguiente campo no resuelto
        for (let i = 1; i <= this.inputFields.length; i++) {
            const next = (this.currentField + i) % this.inputFields.length;
            if (!this.inputFields[next].solved) {
                this.highlightField(next);
                return;
            }
        }
    }

    highlightField(index) {
        // Desresaltar el actual
        if (this.inputFields[this.currentField] && !this.inputFields[this.currentField].solved) {
            this.inputFields[this.currentField].bg.setFillStyle(0xffffff);
            this.inputFields[this.currentField].bg.setStrokeStyle(2, 0x999999);
        }

        this.currentField = index;
        const field = this.inputFields[index];
        if (!field.solved) {
            field.bg.setFillStyle(0xddffdd);
            field.bg.setStrokeStyle(2, 0x00aa00);
        }
    }

    closeScene() {
        const engine = this.scene.get(this.returnScene);
        if (engine && engine.events) {
            const solvedCount = this.inputFields.filter(f => f.solved).length;
            engine.events.emit('mini-complete', {
                type: 'crossword',
                completed: this.completedPuzzle,
                solved: solvedCount,
                total: this.inputFields.length,
            });
        }

        this.scene.stop();
        this.scene.resume(this.returnScene);
    }
}
