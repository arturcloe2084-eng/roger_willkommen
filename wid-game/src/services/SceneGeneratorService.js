/**
 * SceneGeneratorService — Servicio para generar escenas dinámicamente con IA
 * Comunica con wid-proxy para crear escenas completas basadas en templates
 */

import { API_CONFIG } from '../../config/apiConfig.js';

export class SceneGeneratorService {
    /**
     * Genera una escena completa usando LLM (Gemini vía proxy)
     * @param {Object} prompt - {theme, level, objective, language}
     * @returns {Object} - Escena completa con estructura roger_example
     */
    static async generateScene(prompt) {
        try {
            const response = await fetch(`${API_CONFIG.PROXY_URL}/generate-scene`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-game-secret': API_CONFIG.GAME_SECRET,
                },
                body: JSON.stringify({
                    theme: prompt.theme,
                    level: prompt.level,
                    objective: prompt.objective,
                    language: prompt.language || 'de',
                    targetLanguages: ['es', 'en'],
                    includeAudio: true,
                    audioLanguage: 'de-DE',
                    template: 'roger_example'
                })
            });

            if (!response.ok) {
                throw new Error(`Generation failed: ${response.status}`);
            }

            const scene = await response.json();
            return this._validateSceneStructure(scene);
        } catch (error) {
            console.error('[SceneGenerator] Error:', error);
            return null;
        }
    }

    /**
     * Valida que la escena generada siga el schema correcto
     */
    static _validateSceneStructure(scene) {
        const required = ['id', 'name', 'chapter', 'objective', 'metadata'];
        const hasRequired = required.every(key => scene.hasOwnProperty(key));

        if (!hasRequired) {
            console.warn('[SceneGenerator] Scene missing required fields');
            return null;
        }

        if (!scene.metadata.acts || scene.metadata.acts.length === 0) {
            console.warn('[SceneGenerator] Scene has no acts');
            return null;
        }

        return scene;
    }

    /**
     * Genera solo la narración para un acto específico
     * @param {Object} actContext - {theme, character, action, mood}
     * @returns {Object} - {text, translations, audioUrl}
     */
    static async generateActNarration(actContext) {
        try {
            const response = await fetch(`${API_CONFIG.PROXY_URL}/narration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-game-secret': API_CONFIG.GAME_SECRET,
                },
                body: JSON.stringify({
                    theme: actContext.theme,
                    character: actContext.character,
                    action: actContext.action,
                    mood: actContext.mood,
                    languages: ['de', 'es', 'en'],
                    audioLanguage: 'de-DE'
                })
            });

            if (!response.ok) throw new Error('Narration generation failed');

            return await response.json();
        } catch (error) {
            console.error('[SceneGenerator] Narration error:', error);
            return {
                text: actContext.action,
                translations: { es: actContext.action, en: actContext.action }
            };
        }
    }

    /**
     * Genera diálogos dinámicos para un NPC
     * @param {Object} npcContext - {personality, dialogue, languages}
     * @returns {Object} - {responses: []}
     */
    static async generateNPCDialogues(npcContext) {
        try {
            const response = await fetch(`${API_CONFIG.PROXY_URL}/npc-dialogues`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-game-secret': API_CONFIG.GAME_SECRET,
                },
                body: JSON.stringify({
                    personality: npcContext.personality,
                    baseDialogue: npcContext.dialogue,
                    count: 3,
                    languages: ['de', 'es', 'en']
                })
            });

            if (!response.ok) throw new Error('NPC dialogue generation failed');

            return await response.json();
        } catch (error) {
            console.error('[SceneGenerator] NPC dialogue error:', error);
            return { responses: [] };
        }
    }

    /**
     * Compila todos los audio URLs para una escena
     * @param {Object} scene - Escena generada
     * @returns {Object} - Mapeo de audio URLs
     */
    static extractAudioAssets(scene) {
        const audioAssets = {};

        if (scene.metadata.acts) {
            scene.metadata.acts.forEach((act, idx) => {
                if (act.audioUrl) {
                    audioAssets[`act_${idx + 1}`] = act.audioUrl;
                }
            });
        }

        return audioAssets;
    }

    /**
     * Prepara una escena generada para ser integrada en scenes.json
     * @param {Object} generatedScene - Escena del LLM
     * @returns {Object} - Escena lista para scenes.json
     */
    static prepareSceneForIntegration(generatedScene) {
        return {
            id: generatedScene.id,
            name: generatedScene.name,
            chapter: generatedScene.chapter,
            objective: generatedScene.objective,
            background: generatedScene.background || 'assets/scene-generated.png',
            ambientText: generatedScene.ambientText || '',
            isRogerExample: false,
            sceneType: 'narrative_interactive',
            narrationLanguage: 'de',
            hotspots: generatedScene.hotspots || [
                {
                    id: 'generated_main',
                    x: 200,
                    y: 200,
                    width: 600,
                    height: 400,
                    type: 'roger_scene',
                    label: 'Experience the Scene'
                }
            ],
            metadata: {
                description: generatedScene.description || '',
                template: 'roger_example',
                generatedBy: 'LLM',
                timestamp: new Date().toISOString(),
                acts: generatedScene.metadata.acts
            }
        };
    }
}

export const sceneGeneratorService = new SceneGeneratorService();
