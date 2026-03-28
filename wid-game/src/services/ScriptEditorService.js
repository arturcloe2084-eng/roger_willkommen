/**
 * ScriptEditorService.js
 * 
 * Servicio para el editor de guiones estructurados.
 * Interpreta formato de guión teatral/cinematográfico y lo convierte
 * en la estructura de nodos del juego.
 * 
 * Formato de guión soportado:
 * ───────────────────────────────
 * HISTORIA: Título de la historia
 * ESCENA 1: Título de la escena
 * LUGAR: Descripción del lugar
 * PERSONAJES: Nombre1, Nombre2
 * ---
 * [NARRACIÓN] Texto narrativo descriptivo
 * NOMBRE_PERSONAJE: Diálogo del personaje
 * [ACCIÓN] Descripción de la acción
 * [DECISIÓN]
 *   > Opción A -> ESCENA 2
 *   > Opción B -> ESCENA 3
 * ───────────────────────────────
 */

import { API_CONFIG } from '../config/apiConfig.js';

// ── Plantillas de guión predefinidas ──────────────────────────
const SCRIPT_TEMPLATES = [
    {
        id: 'supermercado',
        title: 'Compras en el Supermercado',
        icon: '🛒',
        description: 'Aprende vocabulario de alimentación y compras cotidianas.',
        template: `HISTORIA: Compras en el Supermercado
ESCENA 1: Llegada al supermercado
LUGAR: Entrada del supermercado Edeka, Berlín
PERSONAJES: Jugador, Cajera, Señora Mayor
---
[NARRACIÓN] Entras al supermercado Edeka de tu barrio. Necesitas comprar comida para la semana pero apenas conoces los nombres de los productos en alemán.
Cajera: Guten Tag! Brauchen Sie eine Tüte?
[NARRACIÓN] No entiendes bien la pregunta. La cajera señala una bolsa de plástico.
Jugador: Äh... ja, bitte. Eine Tüte.
[NARRACIÓN] Avanzas por los pasillos buscando pan y leche.
Señora Mayor: Entschuldigung, können Sie mir helfen? Das Regal ist zu hoch.
[DECISIÓN]
> Ayudar a la señora y practicar alemán -> ESCENA 2
> Disculparse y seguir comprando -> ESCENA 3`
    },
    {
        id: 'arztpraxis',
        title: 'Visita al Médico',
        icon: '🏥',
        description: 'Vocabulario médico y expresiones para describir síntomas.',
        template: `HISTORIA: Visita al Médico
ESCENA 1: En la sala de espera
LUGAR: Consultorio médico, Prenzlauer Berg
PERSONAJES: Jugador, Recepcionista, Doctora Müller
---
[NARRACIÓN] Llevas dos días con dolor de cabeza y decides ir al médico. La sala de espera está llena.
Recepcionista: Haben Sie einen Termin?
Jugador: Nein, ich habe keinen Termin. Ich habe Kopfschmerzen.
Recepcionista: Haben Sie Ihre Versicherungskarte dabei?
[NARRACIÓN] Buscas en tu cartera la tarjeta del seguro médico.
Jugador: Ja, hier bitte.
[NARRACIÓN] Después de 40 minutos de espera, la doctora te llama.
Doctora Müller: Herr Schmidt, bitte kommen Sie herein.
[DECISIÓN]
> Explicar los síntomas en alemán -> ESCENA 2
> Pedir que hable más despacio -> ESCENA 3`
    },
    {
        id: 'wohnungssuche',
        title: 'Buscando Piso',
        icon: '🏠',
        description: 'Vocabulario de vivienda, contratos y trámites.',
        template: `HISTORIA: Buscando Piso en Berlín
ESCENA 1: La cita para ver el piso
LUGAR: Edificio antiguo en Kreuzberg, Berlín
PERSONAJES: Jugador, Vermieter Herr Koch, Nachbarin Frau Weber
---
[NARRACIÓN] Después de semanas buscando en ImmobilienScout24, por fin tienes una cita para ver un piso. Es un Altbau en Kreuzberg con techos altos.
Vermieter Herr Koch: Willkommen! Kommen Sie herein. Die Wohnung hat drei Zimmer.
[NARRACIÓN] El piso es luminoso pero necesita reforma. El suelo cruje.
Jugador: Die Wohnung ist sehr schön. Was kostet die Miete?
Vermieter Herr Koch: Die Kaltmiete beträgt 850 Euro. Plus Nebenkosten.
[NARRACIÓN] Una vecina asoma la cabeza por la puerta de enfrente.
Nachbarin Frau Weber: Ach, ein neuer Mieter? Willkommen im Haus!
[DECISIÓN]
> Preguntar por el contrato -> ESCENA 2
> Negociar el precio -> ESCENA 3`
    },
    {
        id: 'freunde_treffen',
        title: 'Quedada con Amigos',
        icon: '🎬',
        description: 'Lenguaje informal, planes y ocio con amigos.',
        template: `HISTORIA: Ir al Cine con Amigos
ESCENA 1: Quedando por WhatsApp
LUGAR: Apartamento del jugador y luego cine en Potsdamer Platz
PERSONAJES: Jugador, Max, Lena
---
[NARRACIÓN] Max te escribe un mensaje: quiere ir al cine esta noche. Lena también viene.
Max: Hey! Hast du heute Abend Lust auf Kino? Der neue Film läuft im CineStar.
Jugador: Klar! Welcher Film denn?
Max: Ein deutscher Film mit Untertiteln. Perfekt zum Üben!
Lena: Ich bin dabei! Treffen wir uns um halb acht vor dem Kino?
[NARRACIÓN] Te preparas y sales hacia Potsdamer Platz. El metro está lleno.
Jugador: Entschuldigung, ist dieser Platz frei?
[DECISIÓN]
> Llegar puntual y comprar entradas -> ESCENA 2
> Llegar tarde y pedir perdón -> ESCENA 3`
    },
    {
        id: 'blank',
        title: 'Guión en Blanco',
        icon: '📝',
        description: 'Escribe tu propia historia desde cero.',
        template: `HISTORIA: Mi Historia Personalizada
ESCENA 1: Primer Acto
LUGAR: Describe el lugar aquí
PERSONAJES: Personaje1, Personaje2
---
[NARRACIÓN] Describe la situación inicial aquí.
Personaje1: Primer diálogo en alemán aquí.
Jugador: Respuesta del jugador aquí.
[NARRACIÓN] Continúa la narrativa.
[DECISIÓN]
> Primera opción -> ESCENA 2
> Segunda opción -> ESCENA 3`
    }
];

// ── Etiquetas de tipo de nodo ─────────────────────────────────
const NODE_TYPE_LABELS = {
    narration: { label: 'NARRACIÓN', icon: '📖', color: '#00ff41' },
    dialogue: { label: 'DIÁLOGO', icon: '💬', color: '#ffcc00' },
    action: { label: 'ACCIÓN', icon: '🎬', color: '#00d7ff' },
    decision: { label: 'DECISIÓN', icon: '🔀', color: '#ff7777' },
    system: { label: 'SISTEMA', icon: '⚙️', color: '#8bd89a' }
};

/**
 * Parsea un guión en formato teatral a estructura de nodos del juego
 */
function parseScript(scriptText) {
    const lines = String(scriptText || '')
        .split(/\r?\n/)
        .map(l => l.trim());

    const metadata = {
        storyTitle: '',
        scenes: []
    };

    let currentScene = null;
    let nodes = [];
    let nodeId = 1;
    let inHeader = true;

    for (const line of lines) {
        if (!line) continue;

        // ── Metadatos de cabecera ──
        if (line.startsWith('HISTORIA:')) {
            metadata.storyTitle = line.replace('HISTORIA:', '').trim();
            continue;
        }

        const sceneMatch = line.match(/^ESCENA\s+(\d+)\s*:\s*(.+)$/i);
        if (sceneMatch) {
            if (currentScene) {
                currentScene.nodes = nodes;
                metadata.scenes.push(currentScene);
                nodes = [];
            }
            currentScene = {
                sceneNumber: parseInt(sceneMatch[1]),
                title: sceneMatch[2].trim(),
                location: '',
                characters: [],
                nodes: []
            };
            inHeader = true;
            continue;
        }

        if (inHeader && line.startsWith('LUGAR:')) {
            if (currentScene) currentScene.location = line.replace('LUGAR:', '').trim();
            continue;
        }

        if (inHeader && line.startsWith('PERSONAJES:')) {
            if (currentScene) {
                currentScene.characters = line.replace('PERSONAJES:', '').trim()
                    .split(/,\s*/).map(c => c.trim()).filter(Boolean);
            }
            continue;
        }

        if (line === '---') {
            inHeader = false;
            continue;
        }

        if (inHeader) continue;

        // ── Narración ──
        if (line.startsWith('[NARRACIÓN]') || line.startsWith('[NARRACION]')) {
            const text = line.replace(/^\[NARRACI[OÓ]N\]\s*/, '').trim();
            if (text) {
                nodes.push({
                    id: nodeId++,
                    type: 'narration',
                    text,
                    deLine: '',
                    esHint: text,
                    focusWords: []
                });
            }
            continue;
        }

        // ── Acción ──
        if (line.startsWith('[ACCIÓN]') || line.startsWith('[ACCION]')) {
            const text = line.replace(/^\[ACCI[OÓ]N\]\s*/, '').trim();
            if (text) {
                nodes.push({
                    id: nodeId++,
                    type: 'narration',
                    text,
                    action: text.toLowerCase().replace(/\s+/g, '_').slice(0, 30),
                    deLine: '',
                    esHint: text,
                    focusWords: []
                });
            }
            continue;
        }

        // ── Decisión ──
        if (line.startsWith('[DECISIÓN]') || line.startsWith('[DECISION]')) {
            const choices = [];
            // Peek ahead for choices
            continue;
        }

        // ── Opciones de decisión ──
        if (line.startsWith('>')) {
            const choiceMatch = line.match(/^>\s*(.+?)\s*->\s*(?:ESCENA\s+)?(\d+|.+)$/i);
            if (choiceMatch && nodes.length > 0) {
                const lastNode = nodes[nodes.length - 1];
                if (lastNode.type !== 'branching') {
                    // Convert previous node or create branching node
                    nodes.push({
                        id: nodeId++,
                        type: 'branching',
                        text: 'Elige una opción:',
                        deLine: 'Wähle eine Option:',
                        esHint: 'Elige una opción:',
                        focusWords: [],
                        choices: []
                    });
                }
                const branchingNode = nodes[nodes.length - 1];
                branchingNode.choices.push({
                    text: choiceMatch[1].trim(),
                    deText: '',
                    nextNode: nodeId + 1 // Will be resolved later
                });
            }
            continue;
        }

        // ── Diálogo ──
        const dialogueMatch = line.match(/^([A-Za-zÀ-ÿ0-9 ._\-]{2,35}):\s*(.+)$/);
        if (dialogueMatch) {
            const character = dialogueMatch[1].trim();
            const text = dialogueMatch[2].trim();
            const looksGerman = _looksGerman(text);

            nodes.push({
                id: nodeId++,
                type: 'dialogue',
                character,
                text,
                deLine: looksGerman ? text : '',
                esHint: looksGerman ? '' : text,
                focusWords: []
            });
            continue;
        }

        // ── Línea genérica = narración ──
        if (line.length > 3) {
            nodes.push({
                id: nodeId++,
                type: 'narration',
                text: line,
                deLine: _looksGerman(line) ? line : '',
                esHint: _looksGerman(line) ? '' : line,
                focusWords: []
            });
        }
    }

    // Cerrar última escena
    if (currentScene) {
        currentScene.nodes = nodes;
        metadata.scenes.push(currentScene);
    }

    // Si no se detectó estructura de escenas, crear una por defecto
    if (!metadata.scenes.length && nodes.length) {
        metadata.scenes.push({
            sceneNumber: 1,
            title: metadata.storyTitle || 'Escena personalizada',
            location: '',
            characters: [],
            nodes
        });
    }

    return metadata;
}

/**
 * Detecta si un texto parece estar en alemán
 */
function _looksGerman(text) {
    const source = String(text || '').trim();
    if (!source) return false;
    if (/[aeiou]ber|[A-Za-z]+sch|[A-Za-z]+ung|[A-Za-z]+keit|[A-Za-z]+lich/.test(source)) return true;

    const normalized = ` ${source.toLowerCase()} `;
    const signals = [
        ' ich ', ' sie ', ' der ', ' die ', ' das ', ' und ', ' nicht ', ' bitte ',
        ' guten ', ' morgen ', ' termin ', ' haben ', ' einen ', ' mein ',
        ' kommen ', ' gehen ', ' hier ', ' nein ', ' ja ', ' denn '
    ];

    let hits = 0;
    for (const s of signals) {
        if (normalized.includes(s)) hits++;
    }
    return hits >= 2;
}

/**
 * Valida la estructura del guión
 */
function validateScript(scriptText) {
    const errors = [];
    const warnings = [];

    if (!scriptText || scriptText.trim().length < 20) {
        errors.push('El guión es demasiado corto. Escribe al menos una escena con diálogos.');
        return { valid: false, errors, warnings };
    }

    if (!scriptText.includes('HISTORIA:')) {
        warnings.push('Falta la línea HISTORIA: al inicio. Se usará un título genérico.');
    }

    if (!/ESCENA\s+\d+/i.test(scriptText)) {
        warnings.push('No se detectaron marcadores de ESCENA. Se creará una escena única.');
    }

    if (!scriptText.includes('---')) {
        warnings.push('Falta el separador --- entre cabecera y contenido.');
    }

    // Check for at least one dialogue
    const hasDialogue = /^[A-Za-zÀ-ÿ0-9 ._\-]{2,35}:\s*.+$/m.test(scriptText);
    if (!hasDialogue) {
        warnings.push('No se detectaron diálogos. Añade líneas con formato PERSONAJE: Texto.');
    }

    // Check for German content
    const lines = scriptText.split('\n');
    let germanLines = 0;
    for (const line of lines) {
        if (_looksGerman(line)) germanLines++;
    }
    if (germanLines === 0) {
        warnings.push('No se detectó contenido en alemán. Para aprender, incluye diálogos en alemán.');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        stats: {
            totalLines: lines.length,
            germanLines,
            dialogueLines: lines.filter(l => /^[A-Za-zÀ-ÿ]{2,}:/.test(l.trim())).length,
            narrationLines: lines.filter(l => l.trim().startsWith('[NARRACIÓN]') || l.trim().startsWith('[NARRACION]')).length
        }
    };
}

/**
 * Genera una imagen de escena a través del proxy
 */
async function generateSceneImage(sceneDescription, sceneTitle) {
    try {
        const prompt = `Create a photorealistic scene for a language learning game set in Germany. 
Scene: "${sceneTitle}". 
Description: "${sceneDescription}". 
Style: Warm, realistic, slightly cinematic lighting. Modern German city setting.
The image should feel like a still from a European indie film.`;

        const response = await fetch(`${API_CONFIG.PROXY_URL}/generate/image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-game-secret': API_CONFIG.GAME_SECRET
            },
            body: JSON.stringify({ prompt, title: sceneTitle }),
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            const err = await response.text();
            console.warn('[ScriptEditor] Image generation failed:', err);
            return { success: false, error: err };
        }

        const data = await response.json();
        return {
            success: true,
            imageUrl: data.imageUrl || data.url || null,
            imageBase64: data.imageBase64 || data.base64 || null,
            source: data.source || 'ai-generated'
        };
    } catch (error) {
        console.error('[ScriptEditor] Image generation error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Genera una canción para el modo karaoke
 */
async function generateSong(words, theme, targetLanguage = 'German') {
    try {
        const wordList = words.map(w => `${w.word} (${w.translation})`).join(', ');
        const prompt = `Write a short, catchy song (4-6 lines) in ${targetLanguage} for language learners.
Theme: "${theme}".
Include these vocabulary words naturally: ${wordList}.
Format: Return JSON with { "title": "Song title", "lines": ["Line 1", "Line 2", ...], "translation": ["Translation 1", ...] }`;

        const response = await fetch(`${API_CONFIG.PROXY_URL}/generate/song`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-game-secret': API_CONFIG.GAME_SECRET
            },
            body: JSON.stringify({ prompt, words, theme }),
            signal: AbortSignal.timeout(20000)
        });

        if (!response.ok) {
            return _fallbackSong(words, theme);
        }

        const data = await response.json();
        return {
            success: true,
            title: data.title || `Lied: ${theme}`,
            lines: data.lines || [],
            translation: data.translation || [],
            source: 'ai-generated'
        };
    } catch (error) {
        console.warn('[ScriptEditor] Song generation fallback:', error.message);
        return _fallbackSong(words, theme);
    }
}

function _fallbackSong(words, theme) {
    const w = words.slice(0, 4);
    return {
        success: true,
        title: `Lernlied: ${theme}`,
        lines: [
            `Ich lerne ${w[0]?.word || 'Deutsch'} jeden Tag,`,
            `${w[1]?.word || 'Wörter'} sind mein Schatz.`,
            `${w[2]?.word || 'Sprechen'} macht mir Spaß,`,
            `${w[3]?.word || 'Lernen'} ohne Hast.`,
            `Willkommen in Deutschland, hier bin ich zu Haus!`
        ],
        translation: [
            `Aprendo ${w[0]?.translation || 'alemán'} cada día,`,
            `${w[1]?.translation || 'Palabras'} son mi tesoro.`,
            `${w[2]?.translation || 'Hablar'} me divierte,`,
            `${w[3]?.translation || 'Aprender'} sin prisa.`,
            `Bienvenido en Alemania, aquí estoy en casa!`
        ],
        source: 'fallback'
    };
}

/**
 * Formatea un guión desde la estructura interna al formato legible
 */
function formatScriptFromNodes(storyTitle, scenes) {
    let output = `HISTORIA: ${storyTitle}\n`;

    for (const scene of scenes) {
        output += `\nESCENA ${scene.sceneNumber}: ${scene.title}\n`;
        if (scene.location) output += `LUGAR: ${scene.location}\n`;
        if (scene.characters?.length) output += `PERSONAJES: ${scene.characters.join(', ')}\n`;
        output += '---\n';

        for (const node of scene.nodes) {
            switch (node.type) {
                case 'narration':
                    output += `[NARRACIÓN] ${node.text}\n`;
                    break;
                case 'dialogue':
                    output += `${node.character}: ${node.deLine || node.text}\n`;
                    break;
                case 'branching':
                    output += '[DECISIÓN]\n';
                    if (node.choices) {
                        for (const c of node.choices) {
                            output += `> ${c.text} -> ESCENA ${c.nextNode}\n`;
                        }
                    }
                    break;
                default:
                    output += `${node.text}\n`;
            }
        }
    }

    return output;
}

export {
    SCRIPT_TEMPLATES,
    NODE_TYPE_LABELS,
    parseScript,
    validateScript,
    generateSceneImage,
    generateSong,
    formatScriptFromNodes
};
