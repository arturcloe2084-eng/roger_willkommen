import { API_CONFIG } from '../../config/apiConfig.js';

const HEADERS = {
    'Content-Type': 'application/json',
    'x-game-secret': API_CONFIG.GAME_SECRET,
};

// ── Fallback local cuando el proxy no está disponible ──────────
const FALLBACKS = {
    german: {
        win: {
            npc_dialogue: 'Na gut... Sie dürfen eintreten. Aber halten Sie sich an die Hausordnung!',
            feedback_es: 'Bien. El personaje te deja pasar.',
            evaluation: 'correct',
            game_action: 'open_door',
            xp_reward: 25,
        },
        fail: [
            { npc_dialogue: 'Ich verstehe Sie nicht. Sprechen Sie bitte langsamer!', feedback_es: 'Intenta usar palabras más sencillas en alemán.' },
            { npc_dialogue: 'Was meinen Sie? Das ist kein Deutsch, das ich kenne.', feedback_es: 'Pista: prueba con "Guten Tag" o "Bitte".' },
            { npc_dialogue: 'Hm. Ich brauche ein paar Minuten. Bitte warten.', feedback_es: 'No se entendió. ¿Puedes reformularlo?' },
        ],
        keywords: ['guten', 'hallo', 'bitte', 'danke', 'entschuldigung', 'ich', 'wohnung', 'schlüssel', 'anmeldung', 'termin'],
    },
    english: {
        win: {
            npc_dialogue: 'All right, come in. But please mind the house rules.',
            feedback_es: 'Correcto. El personaje te deja pasar.',
            evaluation: 'correct',
            game_action: 'open_door',
            xp_reward: 25,
        },
        fail: [
            { npc_dialogue: "I'm sorry, I didn't quite catch that.", feedback_es: 'Intenta una frase más clara en inglés.' },
            { npc_dialogue: "Could you repeat that? I'm not sure I understood.", feedback_es: 'Prueba con "Hello" o "Please".' },
        ],
        keywords: ['hello', 'please', 'thank', 'apartment', 'key', 'excuse', 'registration'],
    },
    spanish: {
        win: {
            npc_dialogue: 'Bueno, puede pasar. Pero respete el reglamento de la comunidad.',
            feedback_es: 'Correcto. El personaje te deja pasar.',
            evaluation: 'correct',
            game_action: 'open_door',
            xp_reward: 25,
        },
        fail: [
            { npc_dialogue: 'No le entiendo. ¿Puede repetirlo más despacio?', feedback_es: 'Prueba con frases más simples.' },
        ],
        keywords: ['hola', 'por favor', 'gracias', 'disculpe', 'apartamento', 'llave'],
    },
};

function localEval(playerMessage, targetLanguage, trans1, trans2) {
    const lang = (targetLanguage || 'german').toLowerCase();
    const fb = FALLBACKS[lang] || FALLBACKS.german;
    const msg = playerMessage.toLowerCase();
    const matched = fb.keywords.some(kw => msg.includes(kw));

    const result = matched ? { ...fb.win } : { ...fb.fail[Math.floor(Math.random() * fb.fail.length)] };

    return {
        ...result,
        npc_dialogue_t1: trans1 ? `[Mock ${trans1}] ${result.npc_dialogue.slice(0, 15)}...` : null,
        npc_dialogue_t2: trans2 ? `[Mock ${trans2}] ${result.npc_dialogue.slice(0, 10)}...` : null,
        evaluation: matched ? 'correct' : 'incorrect',
        game_action: matched ? 'open_door' : 'deny_access',
        xp_reward: matched ? 25 : 0,
    };
}

import { i18n } from '../i18n.js';

/**
 * Asks an NPC via Gemini proxy.
 */
export async function askNPC(npcPersonality, playerMessage, playerProfile) {
    try {
        const response = await fetch(`${API_CONFIG.PROXY_URL}/npc`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                npcPersonality,
                playerMessage,
                targetLanguage: i18n.gameLang,
                playerLevel: playerProfile.level,
                trans1: i18n.trans1,
                trans2: i18n.trans2
            }),
            signal: AbortSignal.timeout(API_CONFIG.TIMEOUT_MS.NPC),
        });

        if (!response.ok) {
            console.warn('[NpcDialogueService] HTTP error — using local fallback.');
            return localEval(playerMessage, i18n.gameLang, i18n.trans1, i18n.trans2);
        }

        return await response.json();

    } catch (error) {
        console.warn('[NpcDialogueService] Error — using local fallback.');
        return localEval(playerMessage, i18n.gameLang, i18n.trans1, i18n.trans2);
    }
}

/**
 * Requests a narrator description.
 */
export async function narrateObject(objectName, objectDescription, playerProfile) {
    const FALLBACK = { narration: `${objectName || 'Objeto'}. Quizás lo entiendas mejor en alemán.` };

    try {
        const response = await fetch(`${API_CONFIG.PROXY_URL}/narrate`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                objectName,
                objectDescription: objectDescription || 'objeto cotidiano',
                targetLanguage: i18n.gameLang,
                playerLevel: playerProfile.level,
                trans1: i18n.trans1,
                trans2: i18n.trans2
            }),
            signal: AbortSignal.timeout(API_CONFIG.TIMEOUT_MS.NARRATION),
        });

        if (!response.ok) return FALLBACK;
        return await response.json();

    } catch {
        return FALLBACK;
    }
}

// Named aliases for convenient imports
export const askNpcDialogue = askNPC;
export const narrateGameObject = narrateObject;
