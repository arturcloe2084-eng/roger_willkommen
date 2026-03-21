/**
 * KaraokeModeService.js
 * Servicio para modo karaoke con evaluación de voz
 * Usa Web Speech API para reconocimiento de voz
 */

class KaraokeModeService {
    constructor() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.SpeechRecognition = SpeechRecognition;
        
        this.isListening = false;
        this.recognition = null;
        this.currentLine = '';
        this.attempts = [];
        this.bestMatch = null;
        this.bestSimilarity = 0;
    }

    /**
     * Inicia karaoke para una línea
     * @param {string|object} line - Línea a repetir (string o {text: string, ...})
     * @param {function} onMatch - Callback cuando se detecta coincidencia
     * @param {function} onComplete - Callback cuando termina
     */
    startLine(line, onMatch, onComplete) {
        if (!this.SpeechRecognition) {
            console.warn('Web Speech Recognition not available');
            if (onComplete) onComplete();
            return;
        }

        // Soporta tanto string como objeto con propiedad 'text'
        const lineText = typeof line === 'string' ? line : (line.text || line);
        
        this.currentLine = lineText;
        this.attempts = [];
        this.bestMatch = null;
        this.bestSimilarity = 0;

        this._startListening(onMatch, onComplete);
    }

    /**
     * Inicia reconocimiento de voz
     */
    _startListening(onMatch, onComplete) {
        if (!this.recognition) {
            this.recognition = new this.SpeechRecognition();
            this.recognition.lang = 'de-DE';
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 5;
        }

        this.isListening = true;

        this.recognition.onstart = () => {
            console.log('Reconocimiento de voz iniciado');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    // Resultado final - evaluar similitud
                    const similarity = this._calculateSimilarity(this.currentLine, transcript);
                    
                    this.attempts.push({
                        text: transcript,
                        similarity: similarity,
                        timestamp: Date.now()
                    });

                    if (similarity > this.bestSimilarity) {
                        this.bestSimilarity = similarity;
                        this.bestMatch = transcript;
                    }

                    console.log(`Intento: "${transcript}" - Similitud: ${(similarity * 100).toFixed(1)}%`);

                    // Callback con el resultado
                    if (onMatch && typeof onMatch === 'function') {
                        onMatch({
                            transcript: transcript,
                            similarity: similarity,
                            isSuccess: similarity > 0.6
                        });
                    }
                } else {
                    interimTranscript += transcript;
                }
            }

            // Mostrar transcript interim
            if (interimTranscript) {
                console.log(`Interim: "${interimTranscript}"`);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Error en reconocimiento:', event.error);
            if (onComplete) onComplete();
        };

        this.recognition.onend = () => {
            console.log('Reconocimiento finalizado');
            this.isListening = false;
            if (onComplete) onComplete();
        };

        this.recognition.start();
    }

    /**
     * Calcula similitud entre dos textos usando distancia Levenshtein
     * @param {string} text1 - Texto esperado
     * @param {string} text2 - Texto reconocido
     * @returns {number} Similitud entre 0 y 1
     */
    _calculateSimilarity(text1, text2) {
        const normalized1 = text1.toLowerCase().trim();
        const normalized2 = text2.toLowerCase().trim();

        const distance = this._levenshteinDistance(normalized1, normalized2);
        const maxLength = Math.max(normalized1.length, normalized2.length);

        if (maxLength === 0) return 1;
        return 1 - (distance / maxLength);
    }

    /**
     * Calcula distancia de Levenshtein entre dos strings
     * @param {string} a - String 1
     * @param {string} b - String 2
     * @returns {number} Distancia
     */
    _levenshteinDistance(a, b) {
        const matrix = [];

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
                        matrix[i - 1][j - 1] + 1, // substitución
                        matrix[i][j - 1] + 1,     // inserción
                        matrix[i - 1][j] + 1      // eliminación
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    /**
     * Detiene el reconocimiento de voz
     */
    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    /**
     * Retorna el resumen de desempeño
     * @returns {object} Historial de intentos
     */
    getPerformanceSummary() {
        return {
            attempts: this.attempts,
            bestMatch: this.bestMatch,
            bestSimilarity: this.bestSimilarity,
            totalAttempts: this.attempts.length
        };
    }
}

// Singleton instance
export const karaokeModeService = new KaraokeModeService();
