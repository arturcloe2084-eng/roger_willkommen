import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';
import { tuneSignalRadio } from '../../services/radio/SignalRadioService.js';

const DEFAULT_SIGNALS = [
    { word: 'Achtung', translation: 'Atención', category: 'señales', example: 'Achtung, Zug fährt ein.' },
    { word: 'Meldung', translation: 'Aviso', category: 'señales', example: 'Neue Meldung im Radio.' },
    { word: 'Empfang', translation: 'Recepción (señal)', category: 'señales', example: 'Der Empfang ist stabil.' },
    { word: 'Störung', translation: 'Interferencia/Fallo', category: 'señales', example: 'Wir haben eine Störung.' },
    { word: 'Sendung', translation: 'Emisión/Programa', category: 'señales', example: 'Die Sendung beginnt jetzt.' },
    { word: 'Frequenz', translation: 'Frecuencia', category: 'señales', example: 'Die Frequenz ist 88,4.' },
];

/**
 * SignalLocatorScene — Mini-juego "Localizador de señales".
 * El jugador ajusta la frecuencia y bloquea señales para descubrir vocabulario.
 * Puede abrirse desde cualquier hotspot `type: "radio"` definido en scenes.json.
 */
export class SignalLocatorScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.SIGNAL_LOCATOR);
    }

    init(data) {
        this.returnScene = data.returnScene || SCENE_KEYS.SCENE_ENGINE;
        this.stationName = data.stationName || 'Kiezfunk 88.4';
        this.requiredCaptures = Phaser.Math.Clamp(Number(data.requiredCaptures) || 2, 1, 6);
        this.tolerance = Phaser.Math.Clamp(Number(data.tolerance) || 2.5, 0.8, 8);
        this.theme = data.theme || 'barrio';
    }

    create() {
        const { width, height } = this.cameras.main;

        const vocabData = this.cache.json.get('vocabularyData');
        const words = Array.isArray(vocabData?.words) ? vocabData.words : [];
        this.wordPool = Phaser.Utils.Array.Shuffle([...words]).slice(0, Math.min(14, words.length));
        if (this.wordPool.length === 0) this.wordPool = DEFAULT_SIGNALS;

        this.captured = [];
        this.failedAttempts = 0;
        this.completed = false;
        this.isTuningRadio = false;
        this.lastTuneAt = 0;
        this.frequency = Phaser.Math.FloatBetween(15, 85);
        this.targetFrequency = 0;
        this.currentSignal = null;
        this.previewSource = null;

        // Overlay base
        this.add.rectangle(0, 0, width, height, 0x000000, 0.86).setOrigin(0).setDepth(0);

        // Panel principal
        const panel = this.add.rectangle(width / 2, height / 2, 710, 430, 0x09101f, 0.96).setDepth(1);
        panel.setStrokeStyle(3, 0x00ccff, 0.8);

        this.add.text(width / 2, 70, '🛰 LOCALIZADOR DE SEÑALES', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            fill: '#00ccff'
        }).setOrigin(0.5).setDepth(2);

        this.add.text(width / 2, 94, `Canal: ${this.stationName}  |  Tema: ${this.theme}`, {
            fontFamily: 'VT323',
            fontSize: '20px',
            fill: '#7fb6d8'
        }).setOrigin(0.5).setDepth(2);

        this.progressText = this.add.text(width / 2, 122, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            fill: '#88ffaa'
        }).setOrigin(0.5).setDepth(2);

        // Barra de sintonía
        this.barX = width / 2 - 240;
        this.barY = height / 2 + 15;
        this.barWidth = 480;
        this.barHeight = 18;

        const barBg = this.add.rectangle(width / 2, this.barY, this.barWidth + 8, this.barHeight + 8, 0x101620).setDepth(1);
        barBg.setStrokeStyle(2, 0x334455, 1);

        this.barFill = this.add.rectangle(this.barX, this.barY, this.barWidth, this.barHeight, 0x0c1420).setOrigin(0, 0.5).setDepth(2);
        this.barFill.setStrokeStyle(1, 0x3a4f60, 0.7);
        this.barFill.setInteractive({ useHandCursor: true });
        this.barFill.on('pointerdown', (pointer) => {
            if (this.completed) return;
            const localX = Phaser.Math.Clamp(pointer.x - this.barX, 0, this.barWidth);
            this.frequency = (localX / this.barWidth) * 100;
            this.refreshTuner();
        });

        this.frequencyMarker = this.add.triangle(0, 0, 0, 14, 7, 0, 14, 14, 0x00ff41).setOrigin(0.5, 1).setDepth(4);

        this.noiseBars = [];
        const bars = 42;
        const step = this.barWidth / bars;
        for (let i = 0; i < bars; i++) {
            const x = this.barX + (i * step) + 2;
            const noise = this.add.rectangle(x, this.barY, Math.max(2, step - 2), 6, 0x88aaff, 0.35).setDepth(3);
            this.noiseBars.push(noise);
        }

        // UI textual
        this.frequencyText = this.add.text(width / 2, height / 2 - 56, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(2);

        this.strengthText = this.add.text(width / 2, height / 2 - 30, '', {
            fontFamily: 'VT323',
            fontSize: '24px',
            fill: '#88ffaa'
        }).setOrigin(0.5).setDepth(2);

        this.statusText = this.add.text(width / 2, height / 2 + 55, '', {
            fontFamily: 'VT323',
            fontSize: '22px',
            fill: '#cccccc'
        }).setOrigin(0.5).setDepth(2);

        this.signalText = this.add.text(width / 2, height / 2 + 120, '', {
            fontFamily: 'VT323',
            fontSize: '20px',
            fill: '#e0f5ff',
            align: 'center',
            wordWrap: { width: 640 }
        }).setOrigin(0.5).setDepth(2);

        this.radioStatusText = this.add.text(width / 2, height / 2 + 175, '', {
            fontFamily: 'VT323',
            fontSize: '17px',
            fill: '#8ab0cc',
            align: 'center',
            wordWrap: { width: 640 }
        }).setOrigin(0.5).setDepth(2);

        this.add.text(width / 2, height - 58, 'A/D o ←/→ ajustar · ESPACIO bloquear · R sintonizar IA · M mutear · N nueva · ESC salir', {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#6e7f8f'
        }).setOrigin(0.5).setDepth(2);

        this.add.text(width / 2, height - 34, 'Objetivo: bloquea señales para convertir estudio en progreso real de partida.', {
            fontFamily: 'VT323',
            fontSize: '17px',
            fill: '#4e6070'
        }).setOrigin(0.5).setDepth(2);

        this.noiseEvent = this.time.addEvent({
            delay: 120,
            loop: true,
            callback: () => this.refreshNoise()
        });

        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
        });

        this.input.keyboard.on('keydown', this.handleKeydown, this);
        this.startNewSignal();
    }

    update(_time, delta) {
        if (this.completed) return;

        const step = delta * 0.018;
        const left = this.keys.left.isDown || this.keys.a.isDown;
        const right = this.keys.right.isDown || this.keys.d.isDown;

        if (left) {
            this.frequency = Phaser.Math.Clamp(this.frequency - step, 0, 100);
            this.refreshTuner();
        } else if (right) {
            this.frequency = Phaser.Math.Clamp(this.frequency + step, 0, 100);
            this.refreshTuner();
        }
    }

    handleKeydown(event) {
        if (event.keyCode === 27) {
            this.closeScene();
            return;
        }
        if (this.completed) return;

        if (event.keyCode === 32) {
            this.lockSignal();
            return;
        }
        if (event.keyCode === 82) {
            this.requestRadioPreview();
            return;
        }
        if (event.keyCode === 77) {
            this.stopRadioPreview();
            this.radioStatusText.setText('Audio detenido.');
            this.radioStatusText.setFill('#90a4b7');
            return;
        }
        if (event.keyCode === 78) {
            this.startNewSignal();
            return;
        }
        if (event.keyCode === 37 || event.keyCode === 65) {
            this.frequency = Phaser.Math.Clamp(this.frequency - 0.9, 0, 100);
            this.refreshTuner();
            return;
        }
        if (event.keyCode === 39 || event.keyCode === 68) {
            this.frequency = Phaser.Math.Clamp(this.frequency + 0.9, 0, 100);
            this.refreshTuner();
        }
    }

    startNewSignal() {
        const remaining = this.wordPool.filter((w) => !this.captured.some((c) => c.word === w.word));
        this.currentSignal = Phaser.Utils.Array.GetRandom(remaining.length > 0 ? remaining : this.wordPool);
        this.targetFrequency = Phaser.Math.FloatBetween(8, 92);

        // Evitar que aparezca ya "resuelto" por suerte.
        if (Math.abs(this.targetFrequency - this.frequency) < 9) {
            this.targetFrequency = (this.targetFrequency + 27) % 100;
        }

        this.progressText.setText(`SEÑALES CAPTURADAS ${this.captured.length}/${this.requiredCaptures}`);
        this.signalText.setText('Canal abierto. Ajusta frecuencia y bloquea la transmisión.');
        this.statusText.setFill('#a4b8c8');
        this.refreshTuner();
    }

    lockSignal() {
        const distance = Math.abs(this.frequency - this.targetFrequency);
        if (distance <= this.tolerance) {
            const current = this.currentSignal;
            const isNewWord = playerProgressStore.learnWord(current.word, current.translation);
            let xp = isNewWord ? 25 : 10;
            if (distance <= this.tolerance * 0.5) xp += 5;

            playerProgressStore.addXP(xp);
            this.game.events.emit('update-hud');

            if (!this.captured.some((c) => c.word === current.word)) {
                this.captured.push(current);
            }

            this.statusText.setText(`SEÑAL BLOQUEADA  ·  +${xp} XP`);
            this.statusText.setFill('#88ffaa');
            this.signalText.setText(
                `Palabra: ${current.word} (${current.category || 'general'})\n` +
                `Significado: ${current.translation}\n` +
                `${current.example || ''}`
            );

            this.progressText.setText(`SEÑALES CAPTURADAS ${this.captured.length}/${this.requiredCaptures}`);

            if (this.captured.length >= this.requiredCaptures) {
                const bonus = 20;
                playerProgressStore.addXP(bonus);
                this.game.events.emit('update-hud');
                this.completed = true;
                this.statusText.setText(`BARRIDO COMPLETO · +${bonus} XP BONUS`);
                this.statusText.setFill('#00ffcc');
                this.signalText.setText(
                    `${this.captured.length} señales registradas.\n` +
                    'Pulsa ESC para volver al mapa y seguir explorando.'
                );
                this.requestRadioPreview(current);
                return;
            }

            this.requestRadioPreview(current);
            this.time.delayedCall(1300, () => this.startNewSignal());
            return;
        }

        this.failedAttempts += 1;
        this.statusText.setText(`INTERFERENCIA (${this.failedAttempts}) — afina más la frecuencia`);
        this.statusText.setFill('#ff6666');
        this.cameras.main.shake(140, 0.0015);
    }

    refreshTuner() {
        const distance = Math.abs(this.frequency - this.targetFrequency);
        const strength = Phaser.Math.Clamp(100 - (distance * 8.5), 0, 100);

        this.frequencyText.setText(`Frecuencia: ${this.frequency.toFixed(1)} MHz`);
        this.strengthText.setText(`Intensidad de señal: ${Math.round(strength)}%`);

        if (strength >= 90) {
            this.statusText.setText('SEÑAL CASI ESTABLE · BLOQUEA CON [ESPACIO]');
            this.statusText.setFill('#b6ff9f');
        } else if (strength >= 65) {
            this.statusText.setText('Patrón legible. Ajusta fino.');
            this.statusText.setFill('#d3ff9f');
        } else if (strength >= 35) {
            this.statusText.setText('Interferencia moderada.');
            this.statusText.setFill('#ffc96a');
        } else {
            this.statusText.setText('Ruido de fondo. Sigue escaneando...');
            this.statusText.setFill('#9aa7b3');
        }

        const markerX = this.barX + ((this.frequency / 100) * this.barWidth);
        this.frequencyMarker.setPosition(markerX, this.barY - 10);
        this.refreshNoise(strength);
    }

    refreshNoise(forcedStrength = null) {
        const distance = Math.abs(this.frequency - this.targetFrequency);
        const strength = forcedStrength ?? Phaser.Math.Clamp(100 - (distance * 8.5), 0, 100);
        const noiseFactor = Phaser.Math.Clamp(1 - (strength / 100), 0.08, 1);

        this.noiseBars.forEach((bar) => {
            const h = Phaser.Math.Between(4, Math.max(6, Math.floor(30 * noiseFactor + 8)));
            bar.height = h;
            bar.alpha = Phaser.Math.FloatBetween(0.18, 0.55 + (noiseFactor * 0.2));

            if (noiseFactor > 0.65) {
                bar.fillColor = 0x88aaff;
            } else if (noiseFactor > 0.35) {
                bar.fillColor = 0x66ccff;
            } else {
                bar.fillColor = 0x55ff99;
            }
        });
    }

    async requestRadioPreview(forceSignal = null) {
        if (this.isTuningRadio) return;

        const now = Date.now();
        if (now - this.lastTuneAt < 3500) {
            return;
        }
        this.lastTuneAt = now;
        this.isTuningRadio = true;

        const signal = forceSignal || this.currentSignal;
        const learnedSlice = playerProgressStore.learnedWords.slice(-4).map((w) => ({
            word: w.word,
            translation: w.translation
        }));
        const words = [
            ...(signal ? [{ word: signal.word, translation: signal.translation }] : []),
            ...this.captured.slice(-3).map((w) => ({ word: w.word, translation: w.translation })),
            ...learnedSlice
        ];

        this.radioStatusText.setText('Sintonizando emisión IA...');
        this.radioStatusText.setFill('#66ccff');

        try {
            const response = await tuneSignalRadio({
                style: this.stationName,
                words,
            });

            if (!response?.audio_base64) {
                throw new Error('La respuesta no trajo audio_base64.');
            }

            await this.playRadioPreview(response.audio_base64);

            if (response.warning) {
                this.radioStatusText.setText(`Señal activa (${response.backend}). ${response.warning}`);
                this.radioStatusText.setFill('#ffd27a');
            } else {
                const source = response.source ? ` · ${response.source}` : '';
                this.radioStatusText.setText(`Señal activa (${response.backend}${source}).`);
                this.radioStatusText.setFill('#7dffb5');
            }
        } catch (error) {
            console.warn('[SignalLocatorScene] Radio preview failed:', error);
            this.radioStatusText.setText('No se pudo obtener audio IA. El localizador sigue en modo mecánico.');
            this.radioStatusText.setFill('#ff8c8c');
        } finally {
            this.isTuningRadio = false;
        }
    }

    async playRadioPreview(base64Audio) {
        if (!this.sound?.context) {
            throw new Error('AudioContext de Phaser no disponible.');
        }

        if (this.sound.context.state === 'suspended') {
            await this.sound.context.resume();
        }

        this.stopRadioPreview();

        const arrayBuffer = this.base64ToArrayBuffer(base64Audio);
        const decodedBuffer = await this.sound.context.decodeAudioData(arrayBuffer.slice(0));
        const source = this.sound.context.createBufferSource();
        source.buffer = decodedBuffer;
        source.loop = true;
        source.connect(this.sound.context.destination);
        source.start(0);
        this.previewSource = source;
    }

    stopRadioPreview() {
        if (!this.previewSource) return;
        try {
            this.previewSource.stop(0);
        } catch {
            // Ignore stop race conditions.
        }
        this.previewSource.disconnect();
        this.previewSource = null;
    }

    base64ToArrayBuffer(base64) {
        const cleaned = String(base64 || '').replace(/\s/g, '');
        const binary = window.atob(cleaned);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    closeScene() {
        const engine = this.scene.get(this.returnScene);
        if (engine && engine.events) {
            engine.events.emit('mini-complete', {
                type: 'radio',
                completed: this.completed,
                station: this.stationName,
                capturedCount: this.captured.length,
                capturedWords: this.captured.map((w) => w.word)
            });
        }

        if (this.noiseEvent) this.noiseEvent.remove(false);
        this.input.keyboard.off('keydown', this.handleKeydown, this);
        this.stopRadioPreview();
        this.scene.stop();
        this.scene.resume(this.returnScene);
    }
}
