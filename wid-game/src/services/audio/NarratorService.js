/**
 * NarratorService — Servicio de narración en alemán con subtítulos sincronizados.
 * Genera audio mediante TTS (Text-To-Speech) y gestiona subtítulos.
 * Estructura: {text, duration, translations}
 */

import { playerProgressStore } from '../player/PlayerProgressStore.js';
import { API_CONFIG } from '../../config/apiConfig.js';

export class NarratorService {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.currentUtterance = null;
        this.isPlaying = false;
        this.subtitleCallback = null;
        this.onCompleteCallback = null;

        const loadVoices = () => {
            this.voices = this.synth.getVoices();
        };
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
        loadVoices();
    }

    /**
     * Reproduce narración en alemán con subtítulos sincronizados
     * @param {Object} narration - {text: string, duration: number, translations?: {es?: string, en?: string}}
     * @param {Function} onSubtitle - Callback(subtitle, language) para actualizar UI
     * @param {Function} onComplete - Callback() cuando termina la narración
     */
    async narrateInGerman(narration, onSubtitle, onComplete) {
        if (!narration || !narration.text) return;

        this.isPlaying = true;
        this.subtitleCallback = onSubtitle;
        this.onCompleteCallback = onComplete;

        // Mostrar subtítulo inicial
        if (onSubtitle) {
            onSubtitle(narration.text, 'de');
        }

        // Crear y reproducir utterance
        this.currentUtterance = new SpeechSynthesisUtterance(narration.text);

        // Seleccionar voz de Alemania
        const germanVoices = this.voices.filter(v =>
            v.lang.startsWith('de') || v.lang === 'de-DE'
        );
        const selectedVoice = germanVoices.find(v => v.name.includes('Google')) || germanVoices[0];
        
        if (selectedVoice) {
            this.currentUtterance.voice = selectedVoice;
        }

        this.currentUtterance.lang = 'de-DE';
        this.currentUtterance.pitch = 0.9;
        this.currentUtterance.rate = 0.9;
        this.currentUtterance.volume = 1;

        this.currentUtterance.onend = () => {
            this.isPlaying = false;
            if (onComplete) onComplete();
        };

        this.currentUtterance.onerror = (error) => {
            console.error('[NarratorService] Error:', error);
            this.isPlaying = false;
        };

        this.synth.speak(this.currentUtterance);

        // Si hay traducciones, mostrar subtítulos alternos
        if (narration.translations && narration.duration) {
            this._scheduleSubtitleTransitions(narration, onSubtitle, narration.duration);
        }
    }

    /**
     * Alterna subtítulos en diferentes idiomas durante la reproducción
     */
    _scheduleSubtitleTransitions(narration, callback, totalDuration) {
        const langs = Object.keys(narration.translations).filter(
            lang => narration.translations[lang]
        );

        if (langs.length === 0) return;

        // Cambiar subtítulo cada 2 segundos
        const interval = 2000;
        let currentLangIndex = 0;

        const subtitleInterval = setInterval(() => {
            if (!this.isPlaying) {
                clearInterval(subtitleInterval);
                return;
            }

            const lang = langs[currentLangIndex];
            const text = narration.translations[lang];
            if (callback) {
                callback(text, lang);
            }
            currentLangIndex = (currentLangIndex + 1) % langs.length;
        }, interval);
    }

    stop() {
        if (this.synth) {
            this.synth.cancel();
            this.isPlaying = false;
        }
    }

    pause() {
        if (this.synth && this.synth.pause) {
            this.synth.pause();
        }
    }

    resume() {
        if (this.synth && this.synth.resume) {
            this.synth.resume();
        }
    }

    /**
     * Genera texto narrativo usando IA (Gemini vía proxy)
     * @param {Object} context - {character, action, mood}
     * @returns {Object} - {text, translations}
     */
    async generateNarration(context) {
        try {
            const response = await fetch(`${API_CONFIG.PROXY_URL}/narration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-game-secret': API_CONFIG.GAME_SECRET,
                },
                body: JSON.stringify({
                    character: context.character,
                    action: context.action,
                    mood: context.mood,
                    languages: ['de', 'es', 'en']
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[NarratorService] Generate error:', error);
            // Fallback: simple narración
            return {
                text: context.action,
                translations: { es: context.action, en: context.action }
            };
        }
    }
}

export const narratorService = new NarratorService();
