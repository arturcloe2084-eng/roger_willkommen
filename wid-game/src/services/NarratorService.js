/**
 * NarratorService.js
 * Servicio para narración en alemán con subtítulos multiidioma
 * Usa Web Speech API para síntesis de voz (TTS)
 */

class NarratorService {
    constructor() {
        // Web Speech API
        const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || window.webkitSpeechSynthesisUtterance;
        const speechSynthesis = window.speechSynthesis || window.webkitSpeechSynthesis;
        
        this.synth = speechSynthesis;
        this.SpeechSynthesisUtterance = SpeechSynthesisUtterance;
        
        this.isPlaying = false;
        this.currentUtterance = null;
        this.subtitleCallbacks = [];
        this.onCompleteCallback = null;
        this.subtitleIndex = 0;
        this.subtitleInterval = null;
    }

    /**
     * Narración en alemán con subtítulos sincronizados
     * @param {string} narration - Texto a narrar
     * @param {function} onSubtitle - Callback para actualizar subtítulos
     * @param {function} onComplete - Callback cuando termina la narración
     */
    narrateInGerman(narration, onSubtitle, onComplete) {
        if (!this.SpeechSynthesisUtterance || !this.synth) {
            console.warn('Web Speech API not available');
            if (onComplete) onComplete();
            return;
        }

        if (this.isPlaying) {
            this.stop();
        }

        // Soporta tanto string como objeto con propiedad 'text'
        const narrationText = typeof narration === 'string' ? narration : (narration.text || narration);
        
        this.isPlaying = true;
        this.onCompleteCallback = onComplete;
        this.currentNarration = narrationText; // Guardar narración para subtítulos
        this.narrationObject = narration; // Guardar objeto completo para traducciones
        this.subtitleCallbacks = onSubtitle ? [onSubtitle] : [];

        const utterance = new this.SpeechSynthesisUtterance(narrationText);
        utterance.lang = 'de-DE';
        utterance.rate = 0.9; // Velocidad 90% para claridad
        utterance.pitch = 0.9;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            console.log('Narración comenzó');
            this._scheduleSubtitleTransitions();
        };

        utterance.onend = () => {
            console.log('Narración terminada');
            this.isPlaying = false;
            if (this.subtitleInterval) clearInterval(this.subtitleInterval);
            if (onComplete) onComplete();
        };

        utterance.onerror = (error) => {
            console.error('Error en narración:', error.error);
            this.isPlaying = false;
            if (this.subtitleInterval) clearInterval(this.subtitleInterval);
            if (onComplete) onComplete();
        };

        this.currentUtterance = utterance;
        this.synth.cancel();
        this.synth.speak(utterance);
    }

    /**
     * Detiene la narración actual
     */
    stop() {
        if (this.synth) {
            this.synth.cancel();
        }
        this.isPlaying = false;
        if (this.subtitleInterval) {
            clearInterval(this.subtitleInterval);
        }
    }

    /**
     * Genera narración usando IA (mock por ahora)
     * @param {object} context - Contexto para generar narración
     * @returns {string} Texto narrado
     */
    async generateNarration(context) {
        // TODO: Implementar integración con Gemini API
        // Por ahora retorna un mock
        return `Willkommen in dieser Szene. Dies ist eine automatisch generierte Narration.`;
    }

    /**
     * Planifica transiciones de subtítulos
     * Rota entre idiomas cada 2 segundos
     */
    _scheduleSubtitleTransitions() {
        const languages = ['de', 'es', 'en']; // Alemán, Español, Inglés
        
        // Obtener traducciones del objeto si existen
        const translations = {
            'de': this.currentNarration,
            'es': (this.narrationObject?.translations?.es) || `${this.currentNarration}`,
            'en': (this.narrationObject?.translations?.en) || `${this.currentNarration}`
        };
        
        this.subtitleIndex = 0;

        this.subtitleInterval = setInterval(() => {
            const currentLang = languages[this.subtitleIndex % languages.length];
            const subtitleText = translations[currentLang] || this.currentNarration;
            
            if (this.subtitleCallbacks.length > 0) {
                this.subtitleCallbacks.forEach(cb => {
                    if (typeof cb === 'function') {
                        cb(subtitleText, currentLang);
                    }
                });
            }

            this.subtitleIndex++;
        }, 2000);
    }
}

// Singleton instance
export const narratorService = new NarratorService();
