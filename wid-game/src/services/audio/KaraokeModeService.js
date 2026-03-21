/**
 * KaraokeModeService — Modo karaoke para escenas de Roger
 * El jugador habla/canta las líneas del protagonista mientras el narrador guía
 */

import { voiceService } from './VoiceService.js';
import { playerProgressStore } from '../player/PlayerProgressStore.js';

export class KaraokeModeService {
    constructor() {
        this.isActive = false;
        this.currentLine = null;
        this.onLineComplete = null;
        this.recognitionResults = [];
        this.lineStartTime = 0;
    }

    /**
     * Inicia modo karaoke para una línea del protagonista
     * @param {Object} line - {text: string, character: "Roger", duration: number}
     * @param {Function} onMatch - Callback(confidence) cuando el jugador dice algo
     * @param {Function} onComplete - Callback() cuando termina
     */
    startLine(line, onMatch, onComplete) {
        if (!line || !line.text) return;

        this.isActive = true;
        this.currentLine = line;
        this.lineStartTime = Date.now();
        this.recognitionResults = [];

        // Mostrar la línea con efecto de "karaoke" (palabra por palabra)
        this._displayKaraokeLine(line.text);

        // Comenzar a escuchar al jugador
        this._startListening(onMatch, onComplete);

        // Temporizador: si no habla en X segundos, es fail
        const timeout = setTimeout(() => {
            if (this.isActive && this.recognitionResults.length === 0) {
                console.log('[Karaoke] Sin respuesta del jugador');
                this.isActive = false;
                if (onComplete) onComplete(false);
            }
        }, line.duration || 5000);

        this.currentTimeout = timeout;
    }

    /**
     * Muestra la línea con efecto de scroll tipo karaoke
     */
    _displayKaraokeLine(text) {
        // Esto se maneja desde la escena que invoca este servicio
        // Aquí solo almacenamos el estado
        this.currentLineText = text;
    }

    /**
     * Inicia reconocimiento de voz para capturar lo que dice el jugador
     */
    _startListening(onMatch, onComplete) {
        if (!voiceService.recognition) return;

        voiceService.recognition.continuous = false;
        voiceService.recognition.lang = 'de-DE';

        voiceService.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const confidence = event.results[0][0].confidence;

            console.log(`[Karaoke] Jugador dijo: "${transcript}" (${(confidence * 100).toFixed(0)}%)`);

            this.recognitionResults.push({
                text: transcript,
                confidence,
                timestamp: Date.now() - this.lineStartTime
            });

            // Evaluar similitud con la línea esperada
            const similarity = this._calculateSimilarity(transcript, this.currentLine.text);
            console.log(`[Karaoke] Similitud: ${(similarity * 100).toFixed(0)}%`);

            if (similarity > 0.6) {
                // ✓ El jugador lo hizo bien
                this.isActive = false;
                clearTimeout(this.currentTimeout);
                if (onMatch) onMatch({ confidence, similarity });
                if (onComplete) onComplete(true);
            } else {
                // ✗ Intentar de nuevo (dar feedback)
                if (onMatch) onMatch({ confidence, similarity, retry: true });
            }
        };

        voiceService.recognition.onerror = (event) => {
            console.warn(`[Karaoke] Error: ${event.error}`);
            if (onComplete) onComplete(false);
        };

        try {
            voiceService.recognition.start();
        } catch (e) {
            console.warn('[Karaoke] Recognition busy');
        }
    }

    /**
     * Calcula similitud entre dos strings (simple Levenshtein-like)
     */
    _calculateSimilarity(text1, text2) {
        const s1 = text1.toLowerCase().trim().split(/\s+/);
        const s2 = text2.toLowerCase().trim().split(/\s+/);

        const matches = s1.filter(word => 
            s2.some(w => this._levenshteinDistance(word, w) < 2)
        ).length;

        return matches / Math.max(s1.length, s2.length);
    }

    /**
     * Distancia de Levenshtein simple (hasta 2 caracteres)
     */
    _levenshteinDistance(a, b) {
        if (a === b) return 0;
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        let matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    stop() {
        this.isActive = false;
        clearTimeout(this.currentTimeout);
        if (voiceService.recognition) {
            voiceService.recognition.stop();
        }
    }

    /**
     * Obtiene resumen de lo que el jugador dijo
     */
    getPerformanceSummary() {
        if (this.recognitionResults.length === 0) {
            return { attempts: 0, bestMatch: 0 };
        }

        const bestMatch = Math.max(
            ...this.recognitionResults.map(r => 
                this._calculateSimilarity(r.text, this.currentLine.text)
            )
        );

        return {
            attempts: this.recognitionResults.length,
            bestMatch,
            allAttempts: this.recognitionResults
        };
    }
}

export const karaokeModeService = new KaraokeModeService();
