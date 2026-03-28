/**
 * StudyRoomService.js
 * 
 * Servicio para la Sala de Estudio con múltiples estrategias de aprendizaje:
 * - Juego de Memoria (Memory Cards)
 * - Crucigrama (Crossword)
 * - Karaoke (Canciones generadas con IA)
 * - Quiz rápido
 * - Flashcards animadas
 * 
 * Las palabras se etiquetan con historia/escena: ej. "2/3" = Historia 2, Escena 3
 */

import { generateSong } from './ScriptEditorService.js';

// ── Estado de la sala de estudio ──────────────────────────────
const STUDY_STRATEGIES = [
    {
        id: 'memory',
        title: 'Juego de Memoria',
        icon: '🃏',
        description: 'Empareja palabras alemanas con sus traducciones.',
        color: '#00d7ff'
    },
    {
        id: 'crossword',
        title: 'Crucigrama',
        icon: '✏️',
        description: 'Rellena las casillas con las palabras correctas.',
        color: '#ffcc00'
    },
    {
        id: 'karaoke',
        title: 'Karaoke',
        icon: '🎤',
        description: 'Canta y repite canciones con el vocabulario de la escena.',
        color: '#ff7777'
    },
    {
        id: 'flashcard',
        title: 'Flashcards',
        icon: '📇',
        description: 'Voltea tarjetas y practica vocabulario.',
        color: '#00ff41'
    },
    {
        id: 'quiz',
        title: 'Examen Rápido',
        icon: '📝',
        description: 'Test de opción múltiple para evaluar tu nivel.',
        color: '#da83ff'
    }
];

/**
 * Etiqueta las palabras con referencia a historia/escena
 */
function tagWordsWithStoryRef(words, storyNumber, sceneNumber) {
    return (words || []).map(w => ({
        ...w,
        storyRef: `${storyNumber}/${sceneNumber}`,
        taggedCategory: w.category ? `${w.category} [${storyNumber}/${sceneNumber}]` : `historia_${storyNumber}`,
    }));
}

/**
 * Genera el layout HTML de la sala de estudio
 */
function renderStudyRoomHTML(words, storyTitle, storyNumber, sceneNumber, currentStrategy = null) {
    const taggedWords = tagWordsWithStoryRef(words, storyNumber, sceneNumber);

    const strategyCards = STUDY_STRATEGIES.map(s => `
        <button class="sr-strategy-card ${currentStrategy === s.id ? 'active' : ''}" 
                data-strategy="${s.id}"
                style="--strategy-color: ${s.color}">
            <div class="sr-strategy-icon">${s.icon}</div>
            <div class="sr-strategy-info">
                <div class="sr-strategy-title">${s.title}</div>
                <div class="sr-strategy-desc">${s.description}</div>
            </div>
            <div class="sr-strategy-badge">${taggedWords.length} Wörter</div>
        </button>
    `).join('');

    const wordList = taggedWords.map(w => `
        <div class="sr-word-chip" title="${w.example || ''}">
            <span class="sr-word-ref">${w.storyRef}</span>
            <span class="sr-word-de">${_escape(w.word)}</span>
            <span class="sr-word-tr">${_escape(w.translation)}</span>
        </div>
    `).join('');

    return `
        <div class="sr-room-wrap">
            <div class="sr-room-header">
                <div class="sr-room-bg" style="background: linear-gradient(135deg, rgba(30,15,5,0.72), rgba(10,20,10,0.68)), url('assets/study-room-balcony.jpg'); background-size: cover; background-position: center;">
                    <div class="sr-room-ambience">
                        <div class="sr-lamp">💡</div>
                        <div class="sr-room-title">
                            <div class="sr-room-kicker">SALA DE ESTUDIO · LERNZIMMER</div>
                            <div class="sr-room-name">${_escape(storyTitle)}</div>
                            <div class="sr-room-meta">Historia ${storyNumber} · ${taggedWords.length} palabras para estudiar</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="sr-vocab-strip">
                <div class="sr-vocab-strip-title">📚 Vocabulario de la escena ${storyNumber}/${sceneNumber}</div>
                <div class="sr-word-chips">${wordList}</div>
            </div>

            <div class="sr-strategies-grid">
                <div class="sr-strategies-title">🎯 Elige tu estrategia de aprendizaje</div>
                <div class="sr-strategies-list">${strategyCards}</div>
            </div>

            <div id="sr-game-area" class="sr-game-area">
                ${currentStrategy ? '' : '<div class="sr-game-placeholder">Selecciona una estrategia para comenzar a estudiar</div>'}
            </div>
        </div>
    `;
}

// ── JUEGO DE MEMORIA ──────────────────────────────────────────
function renderMemoryGame(words) {
    const gameWords = _shuffle(words).slice(0, 6);
    const cards = [];

    gameWords.forEach((w, i) => {
        cards.push({ id: `de_${i}`, text: w.word, pairId: i, type: 'de', matched: false });
        cards.push({ id: `tr_${i}`, text: w.translation, pairId: i, type: 'tr', matched: false });
    });

    const shuffled = _shuffle(cards);

    return `
        <div class="sr-memory-wrap">
            <div class="sr-game-header">
                <span class="sr-game-icon">🃏</span>
                <span>Juego de Memoria — Empareja palabra y traducción</span>
                <span id="sr-memory-score" class="sr-score">0 / ${gameWords.length}</span>
            </div>
            <div class="sr-memory-grid" data-pairs="${gameWords.length}">
                ${shuffled.map(card => `
                    <button class="sr-memory-card" 
                            data-card-id="${card.id}" 
                            data-pair="${card.pairId}" 
                            data-type="${card.type}">
                        <div class="sr-card-front">?</div>
                        <div class="sr-card-back">${_escape(card.text)}</div>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

// ── CRUCIGRAMA SIMPLIFICADO ───────────────────────────────────
function renderCrosswordGame(words) {
    const gameWords = _shuffle(words).slice(0, 5);

    return `
        <div class="sr-crossword-wrap">
            <div class="sr-game-header">
                <span class="sr-game-icon">✏️</span>
                <span>Crucigrama — Escribe la palabra alemana correcta</span>
                <span id="sr-crossword-score" class="sr-score">0 / ${gameWords.length}</span>
            </div>
            <div class="sr-crossword-clues">
                ${gameWords.map((w, i) => `
                    <div class="sr-crossword-clue" data-index="${i}">
                        <div class="sr-clue-number">${i + 1}</div>
                        <div class="sr-clue-content">
                            <div class="sr-clue-hint">${_escape(w.translation)}</div>
                            <div class="sr-clue-example">${_escape(w.example || '')}</div>
                            <div class="sr-clue-input-wrap">
                                <input type="text" 
                                       class="sr-clue-input" 
                                       data-answer="${_escapeAttr(w.word)}"
                                       data-index="${i}"
                                       placeholder="${'_ '.repeat(Math.min(w.word.length, 15)).trim()}"
                                       autocomplete="off"
                                       spellcheck="false" />
                                <span class="sr-clue-result"></span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button id="sr-crossword-check" class="sr-action-btn">Comprobar respuestas</button>
        </div>
    `;
}

// ── FLASHCARDS ────────────────────────────────────────────────
function renderFlashcardGame(words) {
    const gameWords = _shuffle(words);
    return `
        <div class="sr-flashcard-wrap">
            <div class="sr-game-header">
                <span class="sr-game-icon">📇</span>
                <span>Flashcards — Toca para voltear</span>
                <span id="sr-flash-counter" class="sr-score">1 / ${gameWords.length}</span>
            </div>
            <div class="sr-flashcard-stage">
                <div class="sr-flashcard" id="sr-flashcard-current" data-flipped="false">
                    <div class="sr-flash-front">
                        <div class="sr-flash-word" id="sr-flash-word"></div>
                        <div class="sr-flash-hint">Toca para ver la traducción</div>
                    </div>
                    <div class="sr-flash-back">
                        <div class="sr-flash-translation" id="sr-flash-translation"></div>
                        <div class="sr-flash-example" id="sr-flash-example"></div>
                    </div>
                </div>
            </div>
            <div class="sr-flash-controls">
                <button id="sr-flash-prev" class="sr-action-btn" disabled>← Anterior</button>
                <button id="sr-flash-flip" class="sr-action-btn">Voltear</button>
                <button id="sr-flash-next" class="sr-action-btn">Siguiente →</button>
            </div>
            <div class="sr-flash-progress">
                ${gameWords.map((_, i) => `<div class="sr-flash-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></div>`).join('')}
            </div>
        </div>
    `;
}

// ── KARAOKE ───────────────────────────────────────────────────
function renderKaraokeGame(words, songData = null) {
    const song = songData || {
        title: 'Generando canción...',
        lines: ['Cargando...'],
        translation: ['Cargando...'],
        source: 'loading'
    };

    return `
        <div class="sr-karaoke-wrap">
            <div class="sr-game-header">
                <span class="sr-game-icon">🎤</span>
                <span>Karaoke — Canta y aprende</span>
                <button id="sr-karaoke-regenerate" class="sr-action-btn-small">🔄 Nueva canción</button>
            </div>
            <div class="sr-karaoke-stage" id="sr-karaoke-stage">
                <div class="sr-karaoke-title">${_escape(song.title)}</div>
                <div class="sr-karaoke-lyrics">
                    ${(song.lines || []).map((line, i) => `
                        <div class="sr-lyric-line ${i === 0 ? 'active' : ''}" data-line="${i}">
                            <div class="sr-lyric-de">${_escape(line)}</div>
                            <div class="sr-lyric-tr">${_escape((song.translation || [])[i] || '')}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="sr-karaoke-controls">
                    <button id="sr-karaoke-play" class="sr-karaoke-btn">▶ Reproducir</button>
                    <button id="sr-karaoke-mic" class="sr-karaoke-btn">🎙️ Grabar voz</button>
                    <div class="sr-karaoke-source">${_escape(song.source === 'ai-generated' ? 'Canción generada por IA' : 'Canción local')}</div>
                </div>
            </div>
        </div>
    `;
}

// ── QUIZ RÁPIDO ───────────────────────────────────────────────
function renderQuizGame(words) {
    const pool = _shuffle(words);
    const questions = pool.slice(0, 5).map(w => {
        const distractors = _shuffle(pool.filter(c => c.word !== w.word))
            .slice(0, 3)
            .map(c => c.translation);
        const options = _shuffle([w.translation, ...distractors]);
        return { prompt: w.word, correct: w.translation, options };
    });

    return `
        <div class="sr-quiz-wrap">
            <div class="sr-game-header">
                <span class="sr-game-icon">📝</span>
                <span>Examen Rápido</span>
                <span id="sr-quiz-score" class="sr-score">0 / ${questions.length}</span>
            </div>
            <div id="sr-quiz-area">
                ${_renderQuizQuestion(questions, 0)}
            </div>
        </div>
    `;
}

function _renderQuizQuestion(questions, index) {
    if (index >= questions.length) {
        return `
            <div class="sr-quiz-complete">
                <div class="sr-quiz-complete-icon">🎉</div>
                <div class="sr-quiz-complete-text">¡Quiz completado!</div>
            </div>
        `;
    }
    const q = questions[index];
    return `
        <div class="sr-quiz-question-wrap" data-q-index="${index}">
            <div class="sr-quiz-progress">Pregunta ${index + 1} de ${questions.length}</div>
            <div class="sr-quiz-prompt">${_escape(q.prompt)}</div>
            <div class="sr-quiz-options-grid">
                ${q.options.map((opt, i) => `
                    <button class="sr-quiz-opt" 
                            data-answer="${_escapeAttr(opt)}" 
                            data-correct="${opt === q.correct}"
                            data-q="${index}">${_escape(opt)}</button>
                `).join('')}
            </div>
        </div>
    `;
}

// ── CSS de la Sala de Estudio ─────────────────────────────────
function getStudyRoomCSS() {
    return `
        /* ─── Study Room Modern UI ─── */

        .sr-room-wrap {
            display: flex;
            flex-direction: column;
            font-family: 'Inter', sans-serif;
            background: #0f172a;
            color: #f1f5f9;
            min-height: 100%;
        }

        /* Room Header with Photo */
        .sr-room-header {
            position: relative;
            height: 200px;
            overflow: hidden;
            border-bottom: 2px solid rgba(56, 189, 248, 0.2);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
        }

        .sr-room-bg {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            display: flex;
            align-items: flex-end;
            padding: 30px;
        }

        .sr-room-bg::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 60%, transparent 100%);
            z-index: 1;
        }

        .sr-room-ambience {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: 20px;
            width: 100%;
        }

        .sr-lamp {
            font-size: 48px;
            filter: drop-shadow(0 0 15px rgba(255, 204, 0, 0.4));
            animation: sr-lamp-pulse 4s ease-in-out infinite alternate;
        }

        @keyframes sr-lamp-pulse {
            from { transform: scale(1); filter: drop-shadow(0 0 10px rgba(255, 204, 0, 0.3)); }
            to { transform: scale(1.05); filter: drop-shadow(0 0 25px rgba(255, 204, 0, 0.6)); }
        }

        .sr-room-title {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .sr-room-kicker {
            font-family: 'Inter', sans-serif;
            font-size: 11px;
            font-weight: 800;
            color: #38bdf8;
            text-transform: uppercase;
            letter-spacing: 2.5px;
        }

        .sr-room-name {
            font-family: 'Outfit', sans-serif;
            font-size: 28px;
            font-weight: 700;
            color: #f8fafc;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }

        .sr-room-meta {
            font-size: 14px;
            color: #94a3b8;
            font-weight: 500;
        }

        /* Vocab Strip */
        .sr-vocab-strip {
            background: #1e293b;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .sr-vocab-strip-title {
            font-size: 12px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .sr-word-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .sr-word-chip {
            background: #0f172a;
            border: 1px solid rgba(255,255,255,0.08);
            padding: 6px 14px;
            border-radius: 99px;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: border-color 0.2s, background 0.2s;
            cursor: default;
        }
        .sr-word-chip:hover { border-color: #38bdf8; background: #161e31; }

        .sr-word-ref {
            font-size: 10px;
            font-weight: 700;
            color: #a855f7;
            background: rgba(168, 85, 247, 0.15);
            padding: 2px 6px;
            border-radius: 4px;
        }

        .sr-word-de { font-weight: 700; color: #f8fafc; }
        .sr-word-tr { color: #38bdf8; font-weight: 500; }

        /* Strategies Grid */
        .sr-strategies-grid {
            padding: 24px 20px;
            background: #0f172a;
        }

        .sr-strategies-title {
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 700;
            color: #f1f5f9;
            margin-bottom: 18px;
        }

        .sr-strategies-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 12px;
        }

        .sr-strategy-card {
            background: #1e293b;
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 14px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
            position: relative;
            overflow: hidden;
            width: 100%;
            font: inherit;
        }
        .sr-strategy-card:hover {
            transform: translateY(-3px);
            border-color: var(--strategy-color);
            background: #243049;
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .sr-strategy-card.active {
            border-color: var(--strategy-color);
            background: #162032;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
        }

        .sr-strategy-icon { font-size: 32px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); }
        
        .sr-strategy-info { flex: 1; }
        .sr-strategy-title {
            font-weight: 700;
            font-size: 16px;
            color: #f8fafc;
            margin-bottom: 2px;
        }
        .sr-strategy-desc {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.4;
        }

        .sr-strategy-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 9px;
            font-weight: 800;
            background: rgba(255,255,255,0.08);
            color: #64748b;
            padding: 3px 8px;
            border-radius: 99px;
            text-transform: uppercase;
        }

        /* Game Area */
        .sr-game-area {
            flex: 1;
            padding: 24px 20px;
            background: #1e293b;
            min-height: 400px;
            border-top: 1px solid rgba(255,255,255,0.05);
        }

        .sr-game-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 300px;
            color: #475569;
            text-align: center;
            gap: 16px;
        }
        .sr-game-placeholder::before {
            content: '🧪';
            font-size: 40px;
            opacity: 0.3;
        }

        /* Games Common Styles */
        .sr-game-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .sr-game-header span { font-weight: 700; color: #f1f5f9; }
        .sr-score { margin-left: auto; color: #38bdf8 !important; font-family: 'Outfit', sans-serif; font-size: 20px !important; }

        .sr-action-btn {
            background: #38bdf8;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 700;
            cursor: pointer;
            transition: opacity 0.2s;
            font-family: inherit;
        }
        .sr-action-btn:hover:not(:disabled) { opacity: 0.85; }
        .sr-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Memory Game */
        .sr-memory-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            max-width: 800px;
            margin: 0 auto;
        }
        .sr-memory-card {
            aspect-ratio: 1/1;
            background: #0f172a;
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            color: #38bdf8;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            padding: 10px;
            text-align: center;
            font-family: inherit;
        }
        .sr-memory-card:hover { border-color: #38bdf8; transform: scale(1.02); }
        .sr-memory-card.flipped { background: #1e293b; color: #f8fafc; border-color: #38bdf8; }
        .sr-memory-card.matched { background: #064e3b; color: #34d399; border-color: #059669; opacity: 0.8; pointer-events: none; }
        
        /* Crossword */
        .sr-crossword-clues { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .sr-crossword-clue {
            background: #0f172a;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.08);
            display: flex;
            gap: 16px;
        }
        .sr-clue-number {
            width: 34px; height: 34px;
            background: #334155;
            color: #f1f5f9;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            flex-shrink: 0;
        }
        .sr-clue-hint { font-size: 18px; font-weight: 700; color: #38bdf8; margin-bottom: 4px; }
        .sr-clue-input {
            width: 100%;
            background: #1e293b;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 10px 14px;
            color: #f1f5f9;
            font-family: inherit;
            font-size: 18px;
            letter-spacing: 1px;
            margin-top: 8px;
        }
        .sr-clue-input:focus { border-color: #38bdf8; outline: none; }
        .sr-clue-input.correct { border-color: #059669; color: #10b981; }
        .sr-clue-input.wrong { border-color: #ef4444; color: #f87171; }

        /* Flashcards */
        .sr-flashcard {
            width: 100%;
            max-width: 400px;
            height: 250px;
            background: #0f172a;
            border: 2px solid #334155;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            cursor: pointer;
            transition: transform 0.6s;
            margin: 0 auto;
        }
        .sr-flash-word { font-family: 'Outfit', sans-serif; font-size: 36px; font-weight: 700; color: #f8fafc; }
        .sr-flash-translation { font-size: 24px; color: #38bdf8; font-weight: 600; }
        .sr-flash-example { font-style: italic; color: #94a3b8; margin-top: 10px; font-size: 14px; }

        @media (max-width: 600px) {
            .sr-room-name { font-size: 20px; }
            .sr-strategies-list { grid-template-columns: 1fr; }
            .sr-memory-grid { grid-template-columns: repeat(3, 1fr); }
        }
    `;
}

// ── Helpers ───────────────────────────────────────────────────
function _escape(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _escapeAttr(v) {
    return _escape(v).replace(/`/g, '&#96;');
}

function _shuffle(arr) {
    const c = [...arr];
    for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
    }
    return c;
}

export {
    STUDY_STRATEGIES,
    tagWordsWithStoryRef,
    renderStudyRoomHTML,
    renderMemoryGame,
    renderCrosswordGame,
    renderFlashcardGame,
    renderKaraokeGame,
    renderQuizGame,
    getStudyRoomCSS,
    _renderQuizQuestion
};
