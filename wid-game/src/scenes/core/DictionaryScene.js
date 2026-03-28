import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { DictionaryManager } from '../../services/DictionaryManager.js';
import { API_CONFIG } from '../../config/apiConfig.js';
import { i18n } from '../../services/i18n.js';
import {
  renderStudyRoomHTML,
  renderMemoryGame,
  renderCrosswordGame,
  renderFlashcardGame,
  renderKaraokeGame,
  renderQuizGame,
  getStudyRoomCSS,
  _renderQuizQuestion
} from '../../services/StudyRoomService.js';
import { generateSong } from '../../services/ScriptEditorService.js';
import { playerProgressStore } from '../../services/player/PlayerProgressStore.js';

/* ─────────────────────────────────────────────────────────────
   DictionaryScene  v2
   Overlay HTML completo con:
   - Responsive (flex column, scroll correcto)
   - Ordenación por alfabeto, fecha, categoría, chinche
   - Pin/chinche para marcar palabras no aprendidas
   - Edición inline de palabras
   - Audio TTS (Web Speech API) + grabación de pronunciación
   - Importación desde archivo externo (CSV/JSON/TXT)
───────────────────────────────────────────────────────────── */
export class DictionaryScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.DICTIONARY);
    this._overlay = null;
    this._isTranslating = false;
    this._sortBy = 'alpha-asc';   // alpha-asc, alpha-desc, date-new, date-old, category, pinned
    this._editingWord = null;     // palabra actualmente en modo edición
    this._mediaRecorder = null;
    this._audioChunks = [];
    this._recordings = {};        // { word: blobURL }
    this._sceneFilter = 'all';    // 'all' or specific scene ref like 'H1/E1'
    this._viewMode = 'dictionary';
    this._studyStrategy = null;
    this._studyGeneratedSong = null;
    this._studyFlashcardIndex = 0;
  }

  init(data) {
    this.returnScene = data?.returnScene || SCENE_KEYS.MAIN_MENU;
  }

  /* ── create ─────────────────────────────────────────── */

  async create() {
    this.dictionary = await DictionaryManager.getInstance();

    const { width, height } = this.cameras.main;
    this.add.rectangle(width / 2, height / 2, width, height, 0x05050f).setDepth(0);

    const uiOverlay = document.getElementById('ui-overlay');
    if (uiOverlay) {
      uiOverlay.style.position = 'absolute';
      uiOverlay.style.inset = '0';
      uiOverlay.style.zIndex = '50';
      uiOverlay.style.pointerEvents = 'none';
    }

    // Cargar grabaciones guardadas en localStorage
    this._loadRecordings();

    this._mountOverlay();
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.events.on('wake', (sys, data) => {
      if (data?.returnScene) this.returnScene = data.returnScene;
      this._loadRecordings();
      this._mountOverlay();
      this.cameras.main.fadeIn(300, 0, 0, 0);
    });

    this.input.keyboard.on('keydown-ESC', () => {
      this._close();
    });
  }

  /* ── Overlay HTML ──────────────────────────────────── */

  _mountOverlay() {
    const container = document.getElementById('ui-overlay') || document.getElementById('game-container');
    if (!container) return;

    this._unmountOverlay();

    const el = document.createElement('div');
    el.id = 'dict-overlay';
    el.innerHTML = this._getHTML();
    container.appendChild(el);
    this._overlay = el;

    const existingStyle = document.getElementById('dict-styles-v8');
    if (existingStyle) existingStyle.remove();
    if (!document.getElementById('dict-styles-v8')) {
      const style = document.createElement('style');
      style.id = 'dict-styles-v8';
      style.textContent = this._getCSS();
      document.head.appendChild(style);
    }

    this._bindEvents();
    this._renderWordList();
    this._syncViewMode();
  }

  _unmountOverlay() {
    const old = document.getElementById('dict-overlay');
    if (old) old.remove();
    this._overlay = null;
    this._stopRecording();
  }

  /* ── Recordings persistence ────────────────────────── */

  _loadRecordings() {
    try {
      const stored = localStorage.getItem('dictRecordings');
      if (stored) {
        this._recordings = JSON.parse(stored);
      }
    } catch (e) { this._recordings = {}; }
  }

  _saveRecordingBlob(word, blob) {
    const reader = new FileReader();
    reader.onloadend = () => {
      this._recordings[word] = reader.result; // base64 data URL
      try {
        localStorage.setItem('dictRecordings', JSON.stringify(this._recordings));
      } catch (e) {
        console.warn('No se pudo guardar grabación en localStorage (límite de tamaño)');
      }
    };
    reader.readAsDataURL(blob);
  }

  /* ── Filtro + Ordenación ────────────────────────────── */

  _getFiltered() {
    const term = (document.getElementById('dict-search')?.value || '').toLowerCase().trim();
    let all = this.dictionary.getAll();

    // Filtro por escena
    if (this._sceneFilter !== 'all') {
      const lowerScene = this._sceneFilter.toLowerCase();
      all = all.filter(w =>
        w.sceneRef && w.sceneRef.toLowerCase().split(',').map(r => r.trim()).includes(lowerScene)
      );
    }

    if (term) {
      all = all.filter(w =>
        w.word.toLowerCase().includes(term) ||
        w.translation.toLowerCase().includes(term) ||
        (w.category && w.category.toLowerCase().includes(term)) ||
        (w.sceneRef && w.sceneRef.toLowerCase().includes(term))
      );
    }
    return this._applySorting(all);
  }

  _applySorting(words) {
    const sorted = [...words];
    switch (this._sortBy) {
      case 'alpha-asc':
        sorted.sort((a, b) => a.word.localeCompare(b.word, 'de'));
        break;
      case 'alpha-desc':
        sorted.sort((a, b) => b.word.localeCompare(a.word, 'de'));
        break;
      case 'date-new':
        sorted.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
        break;
      case 'date-old':
        sorted.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
        break;
      case 'category':
        sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
      case 'pinned':
        sorted.sort((a, b) => {
          if (a.pinned === b.pinned) return a.word.localeCompare(b.word, 'de');
          return a.pinned ? -1 : 1;
        });
        break;
    }
    return sorted;
  }

  /* ── Render lista ───────────────────────────────────── */

  _renderWordList() {
    const words = this._getFiltered();
    const listEl = document.getElementById('dict-list');
    if (!listEl) return;

    if (words.length === 0) {
      listEl.innerHTML = `<div class="dict-empty">
        <div class="dict-empty-icon">📖</div>
        <div>Sin palabras — agrega con el formulario de arriba o importa un archivo</div>
      </div>`;
      this._updateStats(words);
      if (this._viewMode === 'study') this._renderStudyRoom();
      return;
    }

    listEl.innerHTML = words.map(w => {
      const pinClass = w.pinned ? 'dict-pin-active' : 'dict-pin-inactive';
      const pinIcon = w.pinned ? '📌' : '📍';
      const hasRec = !!this._recordings[w.word];
      const t1 = String(w.translation1 || '').trim();
      const t2 = String(w.translation2 || '').trim();
      const legacy = String(w.translation || '').trim();

      const langInfo1 = i18n.trans1 ? i18n.getLangInfo(i18n.trans1) : null;
      const langInfo2 = i18n.trans2 ? i18n.getLangInfo(i18n.trans2) : null;
      const flag1 = langInfo1?.flag || '🌐';
      const flag2 = langInfo2?.flag || '🌐';
      const langName1 = langInfo1?.nativeName || '';

      // Translation derivation logic:
      // Canonical fields: translation1 (trans1 lang), translation2 (trans2 lang)
      // Legacy field: historically Spanish. Place it in the best available slot.
      let display1 = t1;
      let display2 = t2;

      if (!t1 && !t2 && legacy) {
        // Only legacy exists: put it where it belongs
        if (i18n.trans2) {
          display2 = legacy; // Spanish goes to secondary slot
        } else {
          display1 = legacy; // No secondary slot — use primary
        }
      } else if (!t1 && legacy) {
        // t2 may or may not exist. Legacy fills primary slot.
        display1 = legacy;
      }

      // Nifty: show a placeholder tag if primary translation is missing
      const missingPrimary = !display1 && i18n.trans1;
      const catLabel = this._esc(i18n.tCategory(w.category));

      return `
      <div class="dict-card" data-word="${this._escAttr(w.word)}">
        <div class="dict-card-header">
          <button class="dict-pin-btn ${pinClass}" data-pin="${this._escAttr(w.word)}" title="${w.pinned ? 'Quitar chinche' : 'Marcar para estudiar'}">${pinIcon}</button>
          <span class="dict-badge">${catLabel}</span>
          ${w.sceneRef ? `<span class="dict-badge-scene">${this._esc(w.sceneRef)}</span>` : ''}
        </div>
        <div class="dict-card-body">
          <span class="dict-word-text">${this._esc(w.word)}</span>
          <div class="dict-trans-box">
            ${display1 ? `<div class="dict-trans-row"><span class="dict-flag">${flag1}</span><span class="dict-trans-main">${this._esc(display1)}</span></div>` : ''}
            ${missingPrimary ? `<div class="dict-trans-row pending"><span class="dict-flag">${flag1}</span><span class="dict-trans-pending">⏳ ${langName1}...</span></div>` : ''}
            ${display2 ? `<div class="dict-trans-row"><span class="dict-flag">${flag2}</span><span class="dict-trans-sub">${this._esc(display2)}</span></div>` : ''}
            ${(!display1 && !display2 && !missingPrimary) ? `<span class="dict-trans-empty">(sin traducción)</span>` : ''}
          </div>
        </div>
        <div class="dict-card-footer">
          <button class="dict-icon-btn dict-speak-btn" data-speak="${this._escAttr(w.word)}" title="Escuchar">🔊</button>
          <button class="dict-icon-btn dict-rec-btn ${hasRec ? 'has-rec' : ''}" data-rec="${this._escAttr(w.word)}" title="Grabar">🎙️</button>
          ${hasRec ? `<button class="dict-icon-btn dict-play-btn" data-play="${this._escAttr(w.word)}" title="Reproducir">▶️</button>` : ''}
          <button class="dict-icon-btn dict-edit-btn" data-edit="${this._escAttr(w.word)}" title="Editar">✏️</button>
          ${w.isCustom ? `<button class="dict-icon-btn dict-del-btn" data-del="${this._escAttr(w.word)}" title="Eliminar">🗑️</button>` : ''}
        </div>
      </div>`;
    }).join('');

    this._bindCardEvents(listEl);
    this._updateStats(words);
    if (this._viewMode === 'study') this._renderStudyRoom();
  }

  _updateStats(words) {
    const total = this.dictionary.getAll().length;
    const custom = this.dictionary.getCustomWords().length;
    const pinned = this.dictionary.getPinnedWords().length;
    const found = words ? words.length : total;
    const statsEl = document.getElementById('dict-stats');
    if (statsEl) {
      const wLabel = i18n.t('dict_stats_words');
      const mLabel = i18n.t('dict_stats_mine');
      const sLabel = i18n.t('dict_stats_study');
      const fLabel = i18n.t('dict_stats_filtered');

      let text = `${total} ${wLabel} · ${custom} ${mLabel} · 📌${pinned} ${sLabel}`;
      if (found < total) text += ` · ${found} ${fLabel}`;
      statsEl.textContent = text;
    }
  }

  _getStudyWords() {
    const pinnedWords = this.dictionary.getPinnedWords().filter((item) => item?.word && (item?.translation || item?.translation1));
    const allWords = this.dictionary.getAll().filter((item) => item?.word && (item?.translation || item?.translation1));
    const seen = new Set();
    const merged = [];

    [...pinnedWords, ...allWords].forEach((item) => {
      const word = String(item.word || '').trim();
      const translation = String(item.translation || item.translation1 || '').trim();
      if (!word || !translation) return;

      const key = `${word.toLowerCase()}::${translation.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);

      merged.push({
        ...item,
        word,
        translation,
        example: item.example || '',
        category: item.category || 'diccionario'
      });
    });

    return merged;
  }

  _updateStudyStats(words) {
    const statsEl = document.getElementById('dict-stats');
    if (!statsEl) return;

    const pinned = this.dictionary.getPinnedWords().length;
    statsEl.textContent = `Sala de estudios · ${words.length} palabras y frases · 📌${pinned} fijadas`;
  }

  _setViewMode(mode = 'dictionary') {
    this._viewMode = mode;
    this._syncViewMode();
  }

  _syncViewMode() {
    const isStudyMode = this._viewMode === 'study';
    ['dict-form-section', 'dict-toolbar', 'dict-list-wrap'].forEach((id) => {
      document.getElementById(id)?.classList.toggle('dict-section-hidden', isStudyMode);
    });
    document.getElementById('dict-study-section')?.classList.toggle('dict-section-hidden', !isStudyMode);
    document.getElementById('dict-mode-dictionary')?.classList.toggle('active', !isStudyMode);
    document.getElementById('dict-mode-study')?.classList.toggle('active', isStudyMode);

    if (isStudyMode) {
      this._renderStudyRoom();
      return;
    }

    this._updateStats(this._getFiltered());
  }

  _renderStudyRoom() {
    const sectionEl = document.getElementById('dict-study-section');
    if (!sectionEl) return;

    const words = this._getStudyWords();
    this._updateStudyStats(words);

    if (!words.length) {
      sectionEl.innerHTML = `
        <div class="dict-study-empty">
          <div class="dict-study-empty-icon">📚</div>
          <div class="dict-study-empty-title">Tu sala de estudios todavía está vacía</div>
          <div class="dict-study-empty-copy">Agrega palabras o importa vocabulario al diccionario y aquí aparecerán las 5 opciones de repaso.</div>
        </div>
      `;
      return;
    }

    sectionEl.innerHTML = renderStudyRoomHTML(
      words,
      'Diccionario personal',
      'DICT',
      '01',
      this._studyStrategy,
      {
        roomKicker: 'SALA DE ESTUDIOS · DICCIONARIO',
        roomMeta: `${words.length} palabras y frases listas para repasar`,
        showVocabStrip: false,
        strategyTitle: '🎯 Las 5 opciones de estudio del diccionario',
        emptyState: 'Elige una actividad: memoria, crucigrama, karaoke, flashcards o test rápido',
      }
    );

    this._bindStudyRoomEvents();
    if (this._studyStrategy) {
      this._loadStudyGame(this._studyStrategy);
    }
  }

  _bindStudyRoomEvents() {
    document.querySelectorAll('[data-strategy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._studyStrategy = btn.dataset.strategy;
        this._loadStudyGame(btn.dataset.strategy);
      });
    });
  }

  /* ── Card event binding ─────────────────────────────── */

  _bindCardEvents(listEl) {
    // Pin buttons
    listEl.querySelectorAll('.dict-pin-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const word = e.currentTarget.dataset.pin;
        this.dictionary.togglePin(word);
        this._renderWordList();
      });
    });

    // Speak buttons (TTS)
    listEl.querySelectorAll('.dict-speak-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._speakWord(e.currentTarget.dataset.speak);
      });
    });

    // Record buttons
    listEl.querySelectorAll('.dict-rec-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._startRecording(e.currentTarget.dataset.rec, e.currentTarget);
      });
    });

    // Play recorded audio
    listEl.querySelectorAll('.dict-play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._playRecording(e.currentTarget.dataset.play);
      });
    });

    // Edit buttons
    listEl.querySelectorAll('.dict-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openEditModal(e.currentTarget.dataset.edit);
      });
    });

    // Delete buttons
    listEl.querySelectorAll('.dict-del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const word = e.currentTarget.dataset.del;
        this._deleteWord(word);
      });
    });

    // Card click selection (Reflejar en menú superior)
    listEl.querySelectorAll('.dict-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.addEventListener('click', (e) => {
        // Ignorar si se clicó en un botón de acción
        if (e.target.closest('button')) return;
        const word = card.dataset.word;
        this._selectWord(word);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const word = card.dataset.word;
        this._selectWord(word);
      });
    });
  }

  async _loadStudyGame(strategyId) {
    const gameArea = document.getElementById('sr-game-area');
    const words = this._getStudyWords();
    if (!gameArea || !words.length) return;

    document.querySelectorAll('.sr-strategy-card').forEach((card) => card.classList.remove('active'));
    document.querySelector(`[data-strategy="${strategyId}"]`)?.classList.add('active');

    switch (strategyId) {
      case 'memory':
        gameArea.innerHTML = renderMemoryGame(words);
        this._bindMemoryGame();
        break;
      case 'crossword':
        gameArea.innerHTML = renderCrosswordGame(words);
        this._bindCrosswordGame();
        break;
      case 'flashcard':
        this._studyFlashcardIndex = 0;
        gameArea.innerHTML = renderFlashcardGame(words);
        this._bindFlashcardGame(words);
        break;
      case 'karaoke':
        gameArea.innerHTML = renderKaraokeGame(words, this._studyGeneratedSong);
        this._bindKaraokeGame(words);
        if (!this._studyGeneratedSong) {
          await this._generateStudySong(words);
        }
        break;
      case 'quiz':
        gameArea.innerHTML = renderQuizGame(words);
        this._bindQuizGame(words);
        break;
      default:
        break;
    }
  }

  _bindMemoryGame() {
    let flippedCards = [];
    let matchCount = 0;
    const totalPairs = parseInt(document.querySelector('.sr-memory-grid')?.dataset.pairs) || 6;

    document.querySelectorAll('.sr-memory-card').forEach((card) => {
      card.addEventListener('click', () => {
        if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
        if (flippedCards.length >= 2) return;

        card.classList.add('flipped');
        flippedCards.push(card);

        if (flippedCards.length === 2) {
          const [a, b] = flippedCards;
          if (a.dataset.pair === b.dataset.pair && a.dataset.type !== b.dataset.type) {
            setTimeout(() => {
              a.classList.add('matched');
              b.classList.add('matched');
              matchCount++;
              const scoreEl = document.getElementById('sr-memory-score');
              if (scoreEl) scoreEl.textContent = `${matchCount} / ${totalPairs}`;
              if (matchCount >= totalPairs) {
                this._showToast('🎉 Juego de memoria completado');
                playerProgressStore.addXP(15);
              }
              flippedCards = [];
            }, 400);
          } else {
            setTimeout(() => {
              a.classList.remove('flipped');
              b.classList.remove('flipped');
              flippedCards = [];
            }, 800);
          }
        }
      });
    });
  }

  _bindCrosswordGame() {
    document.getElementById('sr-crossword-check')?.addEventListener('click', () => {
      let correct = 0;
      const inputs = document.querySelectorAll('.sr-clue-input');
      inputs.forEach((input) => {
        const answer = input.dataset.answer;
        const userVal = input.value.trim();
        const result = input.closest('.sr-clue-input-wrap')?.querySelector('.sr-clue-result');
        if (userVal.toLowerCase() === answer.toLowerCase()) {
          input.classList.add('correct');
          input.classList.remove('wrong');
          if (result) result.textContent = '✅';
          correct++;
        } else {
          input.classList.add('wrong');
          input.classList.remove('correct');
          if (result) result.textContent = '❌';
        }
      });
      const scoreEl = document.getElementById('sr-crossword-score');
      if (scoreEl) scoreEl.textContent = `${correct} / ${inputs.length}`;
      if (correct === inputs.length && inputs.length) {
        this._showToast('✏️ Crucigrama perfecto');
        playerProgressStore.addXP(20);
      }
    });
  }

  _bindFlashcardGame(words) {
    const gameWords = words;
    const updateCard = () => {
      const word = gameWords[this._studyFlashcardIndex];
      if (!word) return;
      const wordEl = document.getElementById('sr-flash-word');
      const transEl = document.getElementById('sr-flash-translation');
      const exEl = document.getElementById('sr-flash-example');
      const counterEl = document.getElementById('sr-flash-counter');
      const card = document.getElementById('sr-flashcard-current');
      if (wordEl) wordEl.textContent = word.word;
      if (transEl) transEl.textContent = word.translation;
      if (exEl) exEl.textContent = word.example || '';
      if (counterEl) counterEl.textContent = `${this._studyFlashcardIndex + 1} / ${gameWords.length}`;
      if (card) card.dataset.flipped = 'false';
      document.querySelectorAll('.sr-flash-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === this._studyFlashcardIndex);
      });
      const prevBtn = document.getElementById('sr-flash-prev');
      const nextBtn = document.getElementById('sr-flash-next');
      if (prevBtn) prevBtn.disabled = this._studyFlashcardIndex === 0;
      if (nextBtn) nextBtn.disabled = this._studyFlashcardIndex >= gameWords.length - 1;
    };
    updateCard();

    document.getElementById('sr-flashcard-current')?.addEventListener('click', () => {
      const card = document.getElementById('sr-flashcard-current');
      if (card) card.dataset.flipped = card.dataset.flipped === 'true' ? 'false' : 'true';
    });
    document.getElementById('sr-flash-flip')?.addEventListener('click', () => {
      const card = document.getElementById('sr-flashcard-current');
      if (card) card.dataset.flipped = card.dataset.flipped === 'true' ? 'false' : 'true';
    });
    document.getElementById('sr-flash-prev')?.addEventListener('click', () => {
      if (this._studyFlashcardIndex > 0) {
        this._studyFlashcardIndex--;
        updateCard();
      }
    });
    document.getElementById('sr-flash-next')?.addEventListener('click', () => {
      if (this._studyFlashcardIndex < gameWords.length - 1) {
        this._studyFlashcardIndex++;
        updateCard();
      }
    });
    document.querySelectorAll('.sr-flash-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        this._studyFlashcardIndex = parseInt(dot.dataset.idx) || 0;
        updateCard();
      });
    });
  }

  async _bindKaraokeGame(words) {
    document.getElementById('sr-karaoke-regenerate')?.addEventListener('click', async () => {
      this._studyGeneratedSong = null;
      await this._generateStudySong(words);
    });

    document.getElementById('sr-karaoke-play')?.addEventListener('click', () => {
      const lines = document.querySelectorAll('.sr-lyric-line');
      let idx = 0;
      const interval = setInterval(() => {
        lines.forEach((line) => line.classList.remove('active'));
        if (idx >= lines.length) {
          clearInterval(interval);
          return;
        }
        lines[idx].classList.add('active');
        idx++;
      }, 2500);
    });
  }

  async _generateStudySong(words) {
    const gameArea = document.getElementById('sr-game-area');
    if (!gameArea) return;

    try {
      this._studyGeneratedSong = await generateSong(words, 'Diccionario personal');
      gameArea.innerHTML = renderKaraokeGame(words, this._studyGeneratedSong);
      this._bindKaraokeGame(words);
    } catch (error) {
      console.error('Study karaoke error:', error);
      this._showToast('⚠️ No se pudo generar la canción');
    }
  }

  _bindQuizGame(words) {
    const pool = [...words];
    document.querySelectorAll('.sr-quiz-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.correct === 'true';
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        const siblings = btn.closest('.sr-quiz-options-grid')?.querySelectorAll('.sr-quiz-opt');
        siblings?.forEach((item) => {
          item.style.pointerEvents = 'none';
          if (item.dataset.correct === 'true') item.classList.add('correct');
        });
        playerProgressStore.recordResult(isCorrect ? 'correct' : 'incorrect');
        setTimeout(() => {
          const currentIndex = parseInt(btn.dataset.q);
          const area = document.getElementById('sr-quiz-area');
          if (!area) return;
          const questions = this._generateStudyQuizQuestions(pool);
          if (currentIndex + 1 < questions.length) {
            area.innerHTML = _renderQuizQuestion(questions, currentIndex + 1);
            this._bindQuizGame(words);
          } else {
            area.innerHTML = '<div class="sr-quiz-complete"><div class="sr-quiz-complete-icon">🎉</div><div class="sr-quiz-complete-text">¡Quiz completado!</div></div>';
            this._showToast('📝 Test completado');
            playerProgressStore.addXP(15);
          }
        }, 1200);
      });
    });
  }

  _generateStudyQuizQuestions(words) {
    return words.slice(0, 5).map((word) => {
      const distractors = words.filter((candidate) => candidate.word !== word.word).slice(0, 3).map((candidate) => candidate.translation);
      const options = [...distractors, word.translation].sort(() => Math.random() - 0.5);
      return { prompt: word.word, correct: word.translation, options };
    });
  }

  _selectWord(wordName) {
    const w = this.dictionary.getAll().find(x => x.word === wordName);
    if (!w) return;

    const wordEl = document.getElementById('dict-in-word');
    const transEl = document.getElementById('dict-in-trans');
    const t2El = document.getElementById('dict-in-t2');
    const catEl = document.getElementById('dict-in-cat');
    const exEl = document.getElementById('dict-in-ex');

    // Lógica para derivar traducciones
    let t1 = String(w.translation1 || '').trim();
    let t2 = String(w.translation2 || '').trim();
    const legacy = String(w.translation || '').trim();

    if (legacy && !t1 && !t2) {
      if (i18n.trans2) { t2 = legacy; } else { t1 = legacy; }
    } else if (legacy && !t1 && t2) {
      t1 = legacy;
    }

    if (wordEl) wordEl.value = w.word;
    if (transEl) transEl.value = t1;
    if (t2El) t2El.value = t2;
    if (catEl) catEl.value = w.category || '';
    if (exEl) exEl.value = w.example || '';

    const sceneInput = document.getElementById('dict-in-scene');
    if (sceneInput) sceneInput.value = w.sceneRef || '';

    // Auto-traducir si falta translation1 (inglés)
    if (!t1 && w.word) {
      // Limpiar el campo inglés para mostrar que está cargando
      if (transEl) transEl.placeholder = '⏳ Traduciendo...';
      this._translateWord('dict-in-word', 'de').then(() => {
        if (transEl) transEl.placeholder = '';
        // Guardar la traducción obtenida en el campo canonical translation1
        const newT1 = transEl?.value?.trim();
        const newT2 = t2El?.value?.trim();
        if (newT1) {
          this.dictionary.updateWord(w.word, w.word, legacy || newT2 || newT1, w.category, w.example, newT1, newT2 || t2, w.sceneRef);
          this._renderWordList();
        }
      });
    }

    // Asegurar que se vean los extras
    const extraRows = document.getElementById('dict-form-extras');
    if (extraRows) extraRows.classList.remove('hidden');

    // Efecto visual de selección
    document.querySelectorAll('.dict-card').forEach(c => c.classList.remove('selected'));
    const card = document.querySelector(`.dict-card[data-word="${this._escAttr(wordName)}"]`);
    if (card) {
      card.classList.add('selected');
      this._showWordDetail(w, t1, t2, card);
    }

    this._showToast(`📖 ${w.word}`);
  }

  _showWordDetail(w, t1, t2, cardEl) {
    // Eliminar panel anterior si existe
    document.getElementById('dict-word-detail')?.remove();

    const legacy = String(w.translation || '').trim();
    const displayT1 = t1 || '';
    const displayT2 = t2 || legacy || '';
    const lang1Info = i18n.trans1 ? i18n.getLangInfo(i18n.trans1) : null;
    const lang2Info = i18n.trans2 ? i18n.getLangInfo(i18n.trans2) : null;

    const panel = document.createElement('div');
    panel.id = 'dict-word-detail';
    panel.className = 'dict-detail-panel';
    panel.innerHTML = `
      <div class="dict-detail-header">
        <span class="dict-detail-word">🇩🇪 ${this._esc(w.word)}</span>
        <button class="dict-detail-close" id="dict-detail-close-btn" title="Cerrar">✕</button>
      </div>
      <div class="dict-detail-body">
        ${displayT1 ? `<div class="dict-detail-row">
          <span class="dict-detail-flag">${lang1Info?.flag || '🌐'}</span>
          <span class="dict-detail-text primary">${this._esc(displayT1)}</span>
        </div>` : `<div class="dict-detail-row loading" id="dict-detail-t1-row">
          <span class="dict-detail-flag">${lang1Info?.flag || '🌐'}</span>
          <span class="dict-detail-text" style="color:#64748b;">⏳ Traduciendo al ${lang1Info?.nativeName || 'inglés'}...</span>
        </div>`}
        ${displayT2 ? `<div class="dict-detail-row">
          <span class="dict-detail-flag">${lang2Info?.flag || '🌐'}</span>
          <span class="dict-detail-text secondary">${this._esc(displayT2)}</span>
        </div>` : ''}
        ${w.example ? `<div class="dict-detail-example">
          <span class="dict-detail-example-label">📝</span>
          <span class="dict-detail-example-text">${this._esc(w.example)}</span>
        </div>` : ''}
        ${w.category ? `<div class="dict-detail-cat">${this._esc(i18n.tCategory(w.category))}</div>` : ''}
      </div>
    `;

    // Insertar después de la tarjeta
    cardEl.insertAdjacentElement('afterend', panel);

    panel.querySelector('#dict-detail-close-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.remove();
      document.querySelectorAll('.dict-card').forEach(c => c.classList.remove('selected'));
    });

    // Si no había t1, escuchar mutaciones en el input para actualizar el panel cuando llegue la traducción
    if (!displayT1) {
      const transEl = document.getElementById('dict-in-trans');
      if (transEl) {
        const observer = new MutationObserver(() => { });
        const onInput = () => {
          const newT1 = transEl.value.trim();
          if (newT1) {
            const t1Row = document.getElementById('dict-detail-t1-row');
            if (t1Row) {
              t1Row.id = '';
              t1Row.classList.remove('loading');
              t1Row.innerHTML = `<span class="dict-detail-flag">${lang1Info?.flag || '🌐'}</span>
                <span class="dict-detail-text primary">${this._esc(newT1)}</span>`;
            }
            transEl.removeEventListener('input', onInput);
          }
        };
        // Poll en primer input o cuando cambie
        transEl.addEventListener('input', onInput);
        // También observar cambio de valor directo
        const checkVal = setInterval(() => {
          if (transEl.value.trim()) { onInput(); clearInterval(checkVal); }
        }, 500);
        setTimeout(() => clearInterval(checkVal), 15000);
      }
    }
  }

  _swapTranslationsInForm() {
    const transEl = document.getElementById('dict-in-trans');
    const t2El = document.getElementById('dict-in-t2');
    if (!transEl || !t2El) return;
    const tmp = transEl.value;
    transEl.value = t2El.value;
    t2El.value = tmp;
    this._showToast('⇄ Traducciones intercambiadas');
  }

  /* ── TTS (Text-to-Speech) ───────────────────────────── */

  _speakWord(word) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'de-DE';
    utterance.rate = 0.85;

    // Intentar buscar voz alemana
    const voices = window.speechSynthesis.getVoices();
    const deVoice = voices.find(v => v.lang.startsWith('de'));
    if (deVoice) utterance.voice = deVoice;

    window.speechSynthesis.speak(utterance);
  }

  /* ── Recording ──────────────────────────────────────── */

  async _startRecording(word, btnEl) {
    // Si ya está grabando, parar
    if (this._mediaRecorder && this._mediaRecorder.state === 'recording') {
      this._stopRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._audioChunks = [];
      this._mediaRecorder = new MediaRecorder(stream);

      this._mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this._audioChunks.push(e.data);
      };

      this._mediaRecorder.onstop = () => {
        const blob = new Blob(this._audioChunks, { type: 'audio/webm' });
        this._saveRecordingBlob(word, blob);

        // Reproducir grabación inmediatamente para feedback
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play().catch(() => { });

        // Limpiar stream
        stream.getTracks().forEach(t => t.stop());

        // Re-render para mostrar botón de play
        setTimeout(() => this._renderWordList(), 500);
      };

      // Cambiar UI del botón
      if (btnEl) {
        btnEl.textContent = '⏹️';
        btnEl.classList.add('recording');
      }

      this._mediaRecorder.start();

      // Auto-stop después de 5 segundos
      setTimeout(() => {
        if (this._mediaRecorder && this._mediaRecorder.state === 'recording') {
          this._stopRecording();
        }
      }, 5000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      this._showToast('⚠️ No se pudo acceder al micrófono');
    }
  }

  _stopRecording() {
    if (this._mediaRecorder && this._mediaRecorder.state === 'recording') {
      this._mediaRecorder.stop();
    }
    this._mediaRecorder = null;
  }

  _playRecording(word) {
    const dataUrl = this._recordings[word];
    if (!dataUrl) return;
    const audio = new Audio(dataUrl);
    audio.play().catch(() => { });
  }

  /* ── Comparar audio ─────────────────────────────────── */

  _compareAudio(word) {
    // Primero reproducir pronunciación original, luego la grabación
    this._speakWord(word);
    setTimeout(() => {
      this._playRecording(word);
    }, 1500);
  }

  /* ── Edit Modal ─────────────────────────────────────── */

  _openEditModal(word) {
    const allWords = this.dictionary.getAll();
    const w = allWords.find(x => x.word === word);
    if (!w) return;

    // Crear modal overlay
    const modal = document.createElement('div');
    modal.id = 'dict-edit-modal';

    // Nombres de idiomas para labels
    const lang1 = i18n.trans1 ? i18n.getLangInfo(i18n.trans1).nativeName : i18n.t('dict_ph_trans');
    const lang2 = i18n.trans2 ? i18n.getLangInfo(i18n.trans2).nativeName : null;

    // Lógica consistente para datos antiguos
    let t1 = String(w.translation1 || '').trim();
    let t2 = String(w.translation2 || '').trim();
    const legacy = String(w.translation || '').trim();
    if (legacy && !t1 && !t2) {
      if (i18n.trans2 === 'es') { t2 = legacy; } else { t1 = legacy; }
    }

    modal.innerHTML = `
      <div class="dict-modal-backdrop"></div>
      <div class="dict-modal-content">
        <div class="dict-modal-title">✏️ EDITAR PALABRA</div>
        <div class="dict-modal-fields">
          <label>Palabra (alemán)</label>
          <input id="edit-word" type="text" value="${this._escAttr(w.word)}" />
          
          <label>${lang1}</label>
          <div style="display: flex; gap: 6px; align-items: center;">
            <input id="edit-trans" type="text" style="flex: 1;" value="${this._escAttr(t1)}" />
            ${lang2 ? `<button id="edit-swap-btn" type="button" class="dict-icon-btn" style="padding: 4px; font-size: 14px;" title="Intercambiar">⇄</button>` : ''}
          </div>
          
          ${lang2 ? `<label>${lang2}</label><input id="edit-t2" type="text" value="${this._escAttr(t2)}" />` : ''}
          
          <label>${i18n.t('dict_ph_cat')}</label>
          <input id="edit-cat" type="text" value="${this._escAttr(i18n.tCategory(w.category))}" />
          
          <label>Escena (Ref)</label>
          <input id="edit-scene" type="text" value="${this._escAttr(w.sceneRef || '')}" />

          <label>${i18n.t('dict_ph_ex')}</label>
          <input id="edit-ex" type="text" value="${this._escAttr(w.example || '')}" />
        </div>
        <div class="dict-modal-actions">
          <button id="edit-save-btn" class="dict-modal-save">✔ ${i18n.t('dict_save').toUpperCase()}</button>
          <button id="edit-cancel-btn" class="dict-modal-cancel">${i18n.t('dict_close').toUpperCase()}</button>
        </div>
      </div>
    `;

    this._overlay.appendChild(modal);

    // Disable Phaser keyboard
    if (this.input?.keyboard) this.input.keyboard.enabled = false;

    // Bind modal inputs to stop propagation
    modal.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          modal.remove();
          if (this.input?.keyboard) this.input.keyboard.enabled = true;
          return;
        }
        e.stopPropagation();
      });
      inp.addEventListener('keyup', e => e.stopPropagation());
    });

    // Swap in modal
    modal.querySelector('#edit-swap-btn')?.addEventListener('click', () => {
      const transEl = document.getElementById('edit-trans');
      const t2El = document.getElementById('edit-t2');
      if (transEl && t2El) {
        const tmp = transEl.value;
        transEl.value = t2El.value;
        t2El.value = tmp;
        this._showToast('⇄ Intercambiadas');
      }
    });

    // Save
    modal.querySelector('#edit-save-btn').addEventListener('click', () => {
      const newWord = document.getElementById('edit-word').value.trim();
      const newTrans = document.getElementById('edit-trans').value.trim();
      const t2Input = document.getElementById('edit-t2');
      const newT1 = newTrans; // Sincronizar principal con T1
      const newT2 = t2Input ? t2Input.value.trim() : t2;
      const newCat = document.getElementById('edit-cat').value.trim();
      const newEx = document.getElementById('edit-ex').value.trim();
      const newScene = (document.getElementById('edit-scene')?.value || '').trim();

      if (newWord && newTrans) {
        this.dictionary.updateWord(word, newWord, newTrans, newCat, newEx, newT1, newT2, newScene);
        this._renderWordList();
      }
      modal.remove();
      if (this.input?.keyboard) this.input.keyboard.enabled = true;
    });

    // Cancel
    modal.querySelector('#edit-cancel-btn').addEventListener('click', () => {
      modal.remove();
      if (this.input?.keyboard) this.input.keyboard.enabled = true;
    });
    modal.querySelector('.dict-modal-backdrop').addEventListener('click', () => {
      modal.remove();
      if (this.input?.keyboard) this.input.keyboard.enabled = true;
    });
  }

  /* ── Import Options ────────────────────────────────── */

  _openImportChoices() {
    if (document.getElementById('dict-import-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'dict-import-modal';
    modal.innerHTML = `
      <div class="dict-modal-backdrop"></div>
      <div class="dict-modal-content">
        <div class="dict-modal-title">📥 ${i18n.t('dict_import').toUpperCase()}</div>
        <div class="dict-modal-fields">
           <button id="import-file-btn" class="dict-modal-save" style="width: 100%; margin-bottom: 8px;">📂 ABRIR ARCHIVO (CSV/JSON/TXT/JPG)</button>
           <button id="import-paste-btn" class="dict-modal-save" style="width: 100%; margin-bottom: 8px; background: #1a3a3a; border-color: #00ccff; color: #00ccff;">📋 PEGAR TEXTO (CSV)</button>
        </div>
        <div class="dict-modal-actions" style="margin-top: 15px;">
          <button id="import-close-btn" class="dict-modal-cancel">${i18n.t('dict_close').toUpperCase()}</button>
        </div>
      </div>
    `;
    this._overlay.appendChild(modal);

    if (this.input?.keyboard) this.input.keyboard.enabled = false;

    modal.querySelector('#import-file-btn').addEventListener('click', () => {
      modal.remove();
      if (this.input?.keyboard) this.input.keyboard.enabled = true;
      this._openImportDialog();
    });

    modal.querySelector('#import-paste-btn').addEventListener('click', () => {
      modal.remove();
      if (this.input?.keyboard) this.input.keyboard.enabled = true;
      this._openPasteCSVModal();
    });

    modal.querySelector('#import-close-btn').addEventListener('click', () => {
      modal.remove();
      if (this.input?.keyboard) this.input.keyboard.enabled = true;
    });
  }

  /* ── Import from file ───────────────────────────────── */

  _openImportDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json,.txt,.tsv,.jpg,.jpeg,.png,.webp,image/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        let words = [];
        const lowerName = (file.name || '').toLowerCase();

        if (this._isImageFile(file)) {
          this._showToast('🧠 Leyendo imagen y extrayendo palabras...');
          words = await this._extractWordsFromImage(file);
        } else {
          const text = await file.text();
          if (lowerName.endsWith('.json')) {
            words = DictionaryManager.parseJSON(text);
          } else {
            // CSV, TSV, TXT
            words = DictionaryManager.parseCSV(text);
          }
        }

        if (words.length === 0) {
          this._showToast('⚠️ No se encontraron palabras en el archivo');
        } else {
          const result = this.dictionary.importWords(words);
          const updatedInfo = result.updated ? ` · Actualizadas: ${result.updated}` : '';
          this._showToast(`✔ Importadas: ${result.added}${updatedInfo} · Duplicadas: ${result.skipped} · Errores: ${result.errors}`);
          this._renderWordList();
        }

      } catch (err) {
        console.error('Import error:', err);
        this._showToast(err?.message || '⚠️ Error al leer el archivo. Verifica el formato.');
      } finally {
        input.remove();
      }
    });

    input.click();
  }

  _isImageFile(file) {
    if (!file) return false;
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    return (
      type.startsWith('image/') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.png') ||
      name.endsWith('.webp')
    );
  }

  _fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('⚠️ No se pudo leer la imagen seleccionada.'));
      reader.readAsDataURL(file);
    });
  }

  async _extractWordsFromImage(file) {
    const dataUrl = await this._fileToDataURL(file);
    const base64 = String(dataUrl || '').split(',')[1];
    if (!base64) {
      throw new Error('⚠️ Formato de imagen inválido.');
    }

    const response = await fetch(`${API_CONFIG.PROXY_URL}/import/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-game-secret': API_CONFIG.GAME_SECRET
      },
      body: JSON.stringify({
        imageBase64: base64,
        mimeType: file.type || 'image/jpeg'
      }),
      signal: AbortSignal.timeout(40000)
    });

    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    if (!response.ok) {
      throw new Error(payload?.error || payload?.message || '⚠️ No se pudo procesar la imagen en el servidor.');
    }

    const words = Array.isArray(payload?.words) ? payload.words : [];
    return words;
  }

  _openPasteCSVModal() {
    // Si ya hay modal abierta, no abrir otra
    if (document.getElementById('dict-paste-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'dict-paste-modal';
    modal.innerHTML = `
      <div class="dict-modal-backdrop"></div>
      <div class="dict-modal-content" style="max-width: 500px;">
        <div class="dict-modal-title">📋 ${i18n.t('dict_paste_csv').toUpperCase()}</div>
        <div class="dict-modal-fields">
          <label>${i18n.t('dict_import_format')}</label>
          <textarea id="paste-csv-area" style="height: 180px; background: #10102e; border: 1px solid #2a2a55; color: #e0e0f0; font-family: 'VT323', monospace; padding: 10px; resize: vertical; border-radius: 4px; outline: none;" placeholder="${this._escAttr(i18n.t('dict_paste_ph'))}"></textarea>
        </div>
        <div class="dict-modal-actions">
          <button id="paste-import-btn" class="dict-modal-save">✔ ${i18n.t('dict_import_btn')}</button>
          <button id="paste-cancel-btn" class="dict-modal-cancel">${i18n.t('dict_close').toUpperCase()}</button>
        </div>
      </div>
    `;
    this._overlay.appendChild(modal);

    const area = document.getElementById('paste-csv-area');
    if (area) {
      area.focus();
      // Detener propagación para que el juego no reciba teclas mientras se escribe
      area.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          modal.remove();
          if (this.input?.keyboard) this.input.keyboard.enabled = true;
          return;
        }
        e.stopPropagation();
      });
      area.addEventListener('keyup', e => e.stopPropagation());
    }

    // Disable Phaser keyboard globalmente mientras está el modal
    if (this.input?.keyboard) this.input.keyboard.enabled = false;

    // Importar
    modal.querySelector('#paste-import-btn').addEventListener('click', () => {
      const text = area.value.trim();
      if (!text) {
        this._showToast('⚠️ Pega primero los datos');
        return;
      }

      try {
        const words = DictionaryManager.parseCSV(text);
        if (words.length === 0) {
          this._showToast('⚠️ No se encontraron palabras válidas');
        } else {
          const result = this.dictionary.importWords(words);
          const updatedInfo = result.updated ? ` · ${result.updated} actualizadas` : '';
          this._showToast(`✔ ${result.added} importadas${updatedInfo} · ${result.skipped} duplicadas`);
          this._renderWordList();
        }
      } catch (err) {
        console.error('Paste import error:', err);
        this._showToast('⚠️ Error procesando el texto');
      }
      modal.remove();
      if (this.input?.keyboard) this.input.keyboard.enabled = true;
    });

    // Cancelar
    modal.querySelector('#paste-cancel-btn').addEventListener('click', () => {
      modal.remove();
      if (this.input?.keyboard) this.input.keyboard.enabled = true;
    });
    modal.querySelector('.dict-modal-backdrop').addEventListener('click', () => {
      modal.remove();
      if (this.input?.keyboard) this.input.keyboard.enabled = true;
    });
  }

  _openMaintenanceModal() {
    if (document.getElementById('dict-maint-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'dict-maint-modal';
    modal.innerHTML = `
      <div class="dict-modal-backdrop"></div>
      <div class="dict-modal-content">
        <div class="dict-modal-title">⚙️ ${i18n.t('dict_title_options').toUpperCase()}</div>
        <div class="dict-modal-fields">
           <p style="color: #888; font-size: 11px; margin-bottom: 10px; line-height: 1.2;">
             Utiliza estas opciones para gestionar el diccionario masivamente, tal y como en el gestor externo.
           </p>
           <button id="maint-starter-btn" class="dict-modal-save" style="width: 100%; margin-bottom: 8px;">🚀 ${i18n.t('dict_btn_starter').toUpperCase()}</button>
           <button id="maint-autofill-btn" class="dict-modal-save" style="width: 100%; margin-bottom: 8px; background: #22c55e;">✨ AUTO-RELLENAR TRADUCCIONES</button>
           <button id="maint-migrate-btn" class="dict-modal-save" style="width: 100%; margin-bottom: 8px; background: #6366f1;">🧹 MIGRAR DICCIONARIO ANTIGUO</button>
           <button id="maint-swap-all" class="dict-modal-save" style="width: 100%; margin-bottom: 8px; background: #4f46e5;">⇄ INTERCAMBIAR T1/T2 (TODO)</button>
           <button id="maint-clear-custom" class="dict-modal-cancel" style="width: 100%; margin-bottom: 8px;">🗑️ ${i18n.t('dict_btn_clear_custom').toUpperCase()}</button>
           <button id="maint-clear-all" class="dict-btn-danger" style="width: 100%; height: 32px;">⚠️ ${i18n.t('dict_btn_clear_all').toUpperCase()}</button>
        </div>
        <div class="dict-modal-actions" style="margin-top: 15px;">
          <button id="maint-close-btn" class="dict-modal-cancel">${i18n.t('dict_close').toUpperCase()}</button>
        </div>
      </div>
    `;
    this._overlay.appendChild(modal);

    if (this.input?.keyboard) this.input.keyboard.enabled = false;

    // Starter Words
    modal.querySelector('#maint-starter-btn').addEventListener('click', () => {
      const starter = [
        { word: 'Hallo', translation: 'Hola', category: 'saludo', example: 'Hallo, wie geht es?' },
        { word: 'Guten Morgen', translation: 'Buenos días', category: 'saludo', example: 'Guten Morgen!' },
        { word: 'Danke', translation: 'Gracias', category: 'cortesía', example: 'Danke schön!' },
        { word: 'Bitte', translation: 'De nada / Por favor', category: 'cortesía', example: 'Bitte sehr!' },
        { word: 'Ja', translation: 'Sí', category: 'básico', example: 'Ja, ich komme.' },
        { word: 'Nein', translation: 'No', category: 'básico', example: 'Nein, danke.' },
        { word: 'Entschuldigung', translation: 'Perdón', category: 'cortesía', example: 'Entschuldigung!' }
      ];
      const result = this.dictionary.importWords(starter);
      const updatedInfo = result.updated ? ` · ${result.updated} actualizadas` : '';
      this._showToast(`✔ Cargadas ${result.added} palabras iniciales${updatedInfo}`);
      this._renderWordList();
      modal.remove();
      if (this.input?.keyboard) this.input.keyboard.enabled = true;
    });

    // Clear Custom
    modal.querySelector('#maint-clear-custom').addEventListener('click', () => {
      if (confirm(i18n.t('dict_confirm_clear'))) {
        this.dictionary.clearCustomWords();
        this._showToast('🗑️ Palabras personalizadas eliminadas');
        this._renderWordList();
        modal.remove();
        if (this.input?.keyboard) this.input.keyboard.enabled = true;
      }
    });

    // Clear ALL
    modal.querySelector('#maint-clear-all').addEventListener('click', () => {
      if (confirm('⚠️⚠️⚠️ ' + i18n.t('dict_confirm_clear').toUpperCase())) {
        this.dictionary.clearCustomWords();
        // In game "baseWords" are usually kept, but we can clear them in the instance if we อยาก
        this.dictionary.baseWords = [];
        this._showToast('🔥 Diccionario purgado (completo)');
        this._renderWordList();
        modal.remove();
        if (this.input?.keyboard) this.input.keyboard.enabled = true;
      }
    });

    // Autofill
    modal.querySelector('#maint-autofill-btn').addEventListener('click', async () => {
      const words = this.dictionary.getAll();
      const missing = words.filter(w => !w.translation1 || !w.translation2);
      if (missing.length === 0) {
        this._showToast('✔ Todas las palabras están completas');
        return;
      }

      if (confirm(`¿Auto-completar traducciones para ${missing.length} palabras? (Usará IA)`)) {
        this._showToast(`⏳ Rellenando ${missing.length} palabras...`);
        modal.remove();

        // Ejecutar en lotes/secuencia para no saturar
        let count = 0;
        for (const w of missing) {
          try {
            // Llamamos al proxy individualmente por ahora
            const res = await fetch(`${i18n.PROXY}/translate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-game-secret': 'wid-secret-2026'
              },
              body: JSON.stringify({
                word: w.word,
                trans1: i18n.trans1,
                trans2: i18n.trans2
              })
            });
            if (res.ok) {
              const data = await res.json();
              this.dictionary.updateWord(w.word, w.word, data.translation1 || data.translation || '', data.category || w.category, data.example || w.example, data.translation1, data.translation2, w.sceneRef);
              count++;
            }
          } catch (e) { console.warn('Bulk fail:', w.word); }
          // Un pequeño respiro
          await new Promise(r => setTimeout(r, 200));
        }

        this._showToast(`✔ ${count} palabras actualizadas`);
        this._renderWordList();
        if (this.input?.keyboard) this.input.keyboard.enabled = true;
      }
    });

    // Migrate Legacy
    modal.querySelector('#maint-migrate-btn').addEventListener('click', () => {
      if (confirm('¿Mover traducciones antiguas al campo secundario para habilitar inglés automático?')) {
        const changed = this.dictionary.migrateLegacyTranslations();
        this._showToast(`✔ ${changed} palabras migradas`);
        this._renderWordList();
        modal.remove();
        if (this.input?.keyboard) this.input.keyboard.enabled = true;
      }
    });

    // Swap All
    modal.querySelector('#maint-swap-all').addEventListener('click', () => {
      if (confirm('¿Intercambiar todas las traducciones primarias y secundarias del diccionario?')) {
        const words = this.dictionary.getAll();
        let changed = 0;
        words.forEach(w => {
          const t1 = String(w.translation || w.translation1 || '').trim();
          const t2 = String(w.translation2 || '').trim();
          this.dictionary.updateWord(w.word, w.word, t2, w.category, w.example, t2, t1, w.sceneRef);
          changed++;
        });
        this._showToast(`✔ ${changed} palabras actualizadas`);
        this._renderWordList();
        modal.remove();
        if (this.input?.keyboard) this.input.keyboard.enabled = true;
      }
    });

    modal.querySelector('#maint-close-btn').addEventListener('click', () => {
      modal.remove();
      if (this.input?.keyboard) this.input.keyboard.enabled = true;
    });
  }

  /* ── Translate + Add ────────────────────────────────── */

  async _translateWord(sourceField = 'dict-in-word', sourceLang = 'de') {
    const sourceEl = document.getElementById(sourceField);
    const word = (sourceEl?.value || '').trim();
    if (!word || this._isTranslating) return;

    const wordEl = document.getElementById('dict-in-word');
    const transEl = document.getElementById('dict-in-trans');
    const t2El = document.getElementById('dict-in-t2');
    const catEl = document.getElementById('dict-in-cat');
    const exEl = document.getElementById('dict-in-ex');

    // Si el usuario ya rellenó la traducción principal manualmente, no sobreescribir
    if (sourceField === 'dict-in-word' && transEl && transEl.value.trim().length > 0) return;

    this._isTranslating = true;
    this._showToast('🔍 Traduciendo...');

    try {
      const response = await fetch(`${API_CONFIG.PROXY_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-game-secret': API_CONFIG.GAME_SECRET
        },
        body: JSON.stringify({
          word, // The word to translate
          trans1: i18n.trans1,
          trans2: i18n.trans2,
          sourceLang
        })
      });

      if (!response.ok) throw new Error('Proxy error');
      const data = await response.json();
      console.log('[Dictionary] AI Translation Data:', data);

      // Si es una búsqueda inversa (desde un idioma que no es alemán) o si el campo alemán está vacío
      const detectedWord = data.word_german || data.word || data.word_de || null;
      if (detectedWord && wordEl && (!wordEl.value || sourceLang !== 'de')) {
        wordEl.value = detectedWord;
        console.log('[Dictionary] Auto-filled German word:', detectedWord);
      }

      // Rellenar traducciones
      // Rellenar traducciones
      if (sourceField !== 'dict-in-trans' && transEl) {
        transEl.value = data.translation1 || '';
      }

      if (sourceField !== 'dict-in-t2' && t2El) {
        t2El.value = data.translation2 || '';
      }

      if (catEl) catEl.value = i18n.tCategory(data.category);
      if (exEl) exEl.value = data.example || '';

      this._showToast('✨ Traducida automáticamente');
    } catch (err) {
      console.error('Translation error:', err);
      this._showToast('⚠️ No se pudo traducir');
    } finally {
      this._isTranslating = false;
    }
  }

  _addWord() {
    const wordEl = document.getElementById('dict-in-word');
    const transEl = document.getElementById('dict-in-trans');
    const t2El = document.getElementById('dict-in-t2');
    const catEl = document.getElementById('dict-in-cat');
    const exEl = document.getElementById('dict-in-ex');

    const word = (wordEl?.value || '').trim();
    const trans = (transEl?.value || '').trim();
    const t2 = (t2El?.value || '').trim();
    const cat = ((catEl?.value || '').trim() || 'general').toLowerCase();
    const ex = (exEl?.value || '').trim();

    if (!word || !trans) {
      this._showToast('⚠️ Completa la palabra y la traducción');
      return;
    }

    const ok = this.dictionary.addWord(word, trans, cat, ex, trans, t2);
    if (ok) {
      this._showToast(`✔ "${word}" agregada`);
      if (wordEl) wordEl.value = '';
      if (transEl) transEl.value = '';
      if (t2El) t2El.value = '';
      if (catEl) catEl.value = '';
      if (exEl) exEl.value = '';

      const extraRows = document.getElementById('dict-form-extras');
      if (extraRows) extraRows.classList.add('hidden');

      wordEl?.focus();
      this._renderWordList();
    } else {
      this._showToast(`⚠️ "${word}" ya existe`);
    }
  }

  _deleteWord(word) {
    const ok = this.dictionary.removeCustomWord(word);
    if (ok) {
      // También borrar grabación si existe
      delete this._recordings[word];
      try { localStorage.setItem('dictRecordings', JSON.stringify(this._recordings)); } catch (e) { }
      this._renderWordList();
    }
  }

  _clearForm() {
    ['dict-in-word', 'dict-in-trans', 'dict-in-t2', 'dict-in-cat', 'dict-in-ex'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this._showToast('🧹 Formulario limpio');
  }

  /* ── Toast ──────────────────────────────────────────── */

  _showToast(msg) {
    let toast = document.getElementById('dict-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'dict-toast';
      this._overlay?.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), 3500);
  }

  /* ── Close ──────────────────────────────────────────── */

  _close() {
    this._unmountOverlay();
    if (this.input?.keyboard) this.input.keyboard.enabled = true;
    this.scene.sleep(SCENE_KEYS.DICTIONARY);
    this.scene.wake(this.returnScene);
  }

  shutdown() { this._unmountOverlay(); }
  sleep() { this._unmountOverlay(); }

  /* ── Helpers ────────────────────────────────────────── */

  _esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  _escAttr(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  /* ── Bind events ────────────────────────────────────── */

  _bindEvents() {
    // ESC global
    this._overlay?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Si hay modal abierta, cerrar modal primero
        const modal = document.getElementById('dict-edit-modal');
        if (modal) { modal.remove(); if (this.input?.keyboard) this.input.keyboard.enabled = true; return; }
        e.preventDefault();
        e.stopPropagation();
        this._close();
      }
    });

    // Search
    const searchEl = document.getElementById('dict-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => this._renderWordList());
      searchEl.addEventListener('keydown', (e) => { if (e.key !== 'Escape') e.stopPropagation(); });
      searchEl.addEventListener('keyup', (e) => e.stopPropagation());
    }

    // Sort buttons
    document.querySelectorAll('.dict-sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._sortBy = btn.dataset.sort;
        // Update active state
        document.querySelectorAll('.dict-sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderWordList();
      });
    });

    // Scene filter
    const sceneSel = document.getElementById('dict-scene-sel');
    if (sceneSel) {
      sceneSel.addEventListener('change', (e) => {
        this._sceneFilter = e.target.value;
        this._renderWordList();
      });
    }

    // Add button
    document.getElementById('dict-add-btn')?.addEventListener('click', () => this._addWord());

    // Clear button
    document.getElementById('dict-clear-btn')?.addEventListener('click', () => this._clearForm());

    // Dictionary Settings
    document.getElementById('dict-settings-btn')?.addEventListener('click', () => this._openSettings());
    document.getElementById('dict-mode-dictionary')?.addEventListener('click', () => this._setViewMode('dictionary'));
    document.getElementById('dict-mode-study')?.addEventListener('click', () => this._setViewMode('study'));

    // Swap button in form
    document.getElementById('dict-swap-btn')?.addEventListener('click', () => this._swapTranslationsInForm());

    // Maintenance button (Gestor options)
    document.getElementById('dict-maint-btn')?.addEventListener('click', () => this._openMaintenanceModal());

    // Auto-translate on blur
    document.getElementById('dict-in-word')?.addEventListener('blur', (e) => {
      if (e.target.value.trim()) this._translateWord('dict-in-word', 'de');
    });
    document.getElementById('dict-in-trans')?.addEventListener('blur', (e) => {
      if (e.target.value.trim() && !document.getElementById('dict-in-word').value) {
        this._translateWord('dict-in-trans', i18n.trans1 || 'en');
      }
    });
    document.getElementById('dict-in-t2')?.addEventListener('blur', (e) => {
      if (e.target.value.trim() && !document.getElementById('dict-in-word').value) {
        this._translateWord('dict-in-t2', i18n.trans2 || 'es');
      }
    });

    // Enter in form inputs
    ['dict-in-word', 'dict-in-trans', 'dict-in-t2', 'dict-in-cat', 'dict-in-ex'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this._addWord(); return; }
        if (e.key === 'Escape') return;
        e.stopPropagation();
      });
      el.addEventListener('keyup', (e) => e.stopPropagation());
      el.addEventListener('focus', () => { if (this.input?.keyboard) this.input.keyboard.enabled = false; });
      el.addEventListener('blur', () => { if (this.input?.keyboard) this.input.keyboard.enabled = true; });
    });

    searchEl?.addEventListener('focus', () => { if (this.input?.keyboard) this.input.keyboard.enabled = false; });
    searchEl?.addEventListener('blur', () => { if (this.input?.keyboard) this.input.keyboard.enabled = true; });

    // Back button
    document.getElementById('dict-back-btn')?.addEventListener('click', () => this._close());

    // Import button (Unified choices)
    document.getElementById('dict-import-btn')?.addEventListener('click', () => this._openImportChoices());

    // Export button
    document.getElementById('dict-export-btn')?.addEventListener('click', () => {
      const data = this.dictionary.exportCustom();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diccionario_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this._showToast('📥 Diccionario exportado');
    });
  }

  /* ── Dictionary Settings Modal ─────────────────────── */

  _openSettings() {
    if (document.getElementById('dict-settings-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'dict-settings-modal';
    modal.innerHTML = this._getSettingsHTML();
    this._overlay.appendChild(modal);

    // Bind save/cancel
    modal.querySelector('#dict-settings-save').addEventListener('click', () => this._saveSettings());
    modal.querySelector('#dict-settings-cancel').addEventListener('click', () => {
      modal.remove();
    });
  }

  _saveSettings() {
    const t1 = document.getElementById('ds-trans1').value;
    const t2 = document.getElementById('ds-trans2').value;

    i18n.trans1 = t1 || null;
    i18n.trans2 = t2 || null;
    i18n.saveSettings();

    // Reload UI
    this._mountOverlay();
    this._showToast('✔ Configuración guardada');
  }

  _getSettingsHTML() {
    const langOptions = (selected, includeNone = false) => {
      let html = '';
      if (includeNone) {
        html += `<option value="" ${!selected ? 'selected' : ''}>— ${i18n.t('settings_none').toUpperCase()} —</option>`;
      }
      for (const code of i18n.getAvailableLangs()) {
        const info = i18n.getLangInfo(code);
        html += `<option value="${code}" ${selected === code ? 'selected' : ''}>${info.flag} ${info.nativeName}</option>`;
      }
      return html;
    };

    return `
      <div class="dict-modal-backdrop"></div>
      <div class="dict-modal-content">
        <div class="dict-modal-title">⚙️ TRADUCCIONES DEL DICCIONARIO</div>
        <div class="dict-modal-fields">
          <label>${i18n.t('settings_trans1')}</label>
          <select id="ds-trans1" class="dict-select">${langOptions(i18n.trans1, true)}</select>
          
          <label>${i18n.t('settings_trans2')}</label>
          <select id="ds-trans2" class="dict-select">${langOptions(i18n.trans2, true)}</select>
        </div>
        <div class="dict-modal-actions">
          <button id="dict-settings-save" class="dict-modal-save">✔ ${i18n.t('dict_save').toUpperCase()}</button>
          <button id="dict-settings-cancel" class="dict-modal-cancel">${i18n.t('dict_close').toUpperCase()}</button>
        </div>
      </div>
    `;
  }

  /* ── HTML template ──────────────────────────────────── */

  _getHTML() {
    const t1Info = i18n.trans1 ? i18n.getLangInfo(i18n.trans1) : null;
    const t2Info = i18n.trans2 ? i18n.getLangInfo(i18n.trans2) : null;
    const t1Placeholder = t1Info ? `${t1Info.flag} ${t1Info.nativeName}` : 'Traducción 1';
    const t2Placeholder = t2Info ? `${t2Info.flag} ${t2Info.nativeName}` : 'Traducción 2';

    return `
      <div id="dict-panel">
        <!-- Header -->
        <div id="dict-header">
          <div id="dict-title">
            <span class="dict-title-icon">📖</span>
            <span>${i18n.t('dict_title')}</span>
          </div>
          <div id="dict-header-modes">
            <button id="dict-mode-dictionary" class="dict-mode-btn ${this._viewMode === 'dictionary' ? 'active' : ''}">📖 Diccionario</button>
            <button id="dict-mode-study" class="dict-mode-btn ${this._viewMode === 'study' ? 'active' : ''}">📚 Sala de estudios</button>
          </div>
          <div id="dict-stats">${i18n.t('dict_loading')}</div>
          <div id="dict-header-actions">
            <button id="dict-maint-btn" class="dict-header-btn" title="Opciones de gestor">📂</button>
            <button id="dict-settings-btn" class="dict-header-btn" title="Configuración de traducciones">⚙️</button>
            <button id="dict-back-btn" class="dict-back">✕ ${i18n.t('dict_close')}</button>
          </div>
        </div>

        <!-- Form -->
        <div id="dict-form-section" class="${this._viewMode === 'study' ? 'dict-section-hidden' : ''}">
          <div id="dict-form-row">
            <div class="dict-form-group" style="flex: 2; min-width: 100px;">
              <input id="dict-in-word" type="text" placeholder="🇩🇪 Wort (Deutsch)" autocomplete="off" spellcheck="false" />
            </div>
            <div class="dict-form-group" style="flex: 2; min-width: 100px;">
              <input id="dict-in-trans" type="text" placeholder="${t1Placeholder}" autocomplete="off" spellcheck="false" />
            </div>
            ${i18n.trans2 ? `
            <div class="dict-form-group" style="flex: 2; min-width: 100px;">
              <input id="dict-in-t2" type="text" placeholder="${t2Placeholder}" autocomplete="off" spellcheck="false" />
            </div>
            ` : ''}
            <div style="display: flex; gap: 6px; flex-shrink: 0; align-items: center;">
              ${i18n.trans2 ? `<button id="dict-swap-btn" type="button" title="Intercambiar T1/T2" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); font-size: 14px; cursor: pointer; color: #94a3b8; padding: 4px 8px; border-radius: 6px; height: 28px; display: flex; align-items: center;">⇄</button>` : ''}
              <button id="dict-add-btn" class="dict-action-btn primary" title="${i18n.t('dict_btn_add')}">+ ADD</button>
              <button id="dict-clear-btn" class="dict-action-btn secondary" title="${i18n.t('dict_btn_clear')}">✕</button>
            </div>
          </div>
          <div id="dict-form-extras" class="hidden">
            <div class="dict-form-grid">
              ${!i18n.trans2 ? `<input id="dict-in-t2" type="text" placeholder="${t2Placeholder}" autocomplete="off" spellcheck="false" />` : ''}
              <input id="dict-in-cat" type="text" placeholder="Kategorie" autocomplete="off" spellcheck="false" />
              <input id="dict-in-scene" type="text" placeholder="Szene (H1/E1)" autocomplete="off" spellcheck="false" />
              <input id="dict-in-ex" type="text" placeholder="Beispiel / Example" autocomplete="off" spellcheck="false" />
            </div>
          </div>
        </div>

        <!-- Toolbar: Search + Sort + Import -->
        <div id="dict-toolbar" class="${this._viewMode === 'study' ? 'dict-section-hidden' : ''}">
          <div id="dict-search-bar">
            <span class="dict-search-icon">🔍</span>
            <input id="dict-search" type="text" placeholder="${i18n.t('dict_search_ph')}" autocomplete="off" />
          </div>
          <div id="dict-filters">
            <div class="dict-filter-group">
              <span class="dict-filter-label">ORDEN:</span>
              <div id="dict-sort-bar">
                <button class="dict-sort-btn active" data-sort="alpha-asc" title="A→Z">A-Z</button>
                <button class="dict-sort-btn" data-sort="alpha-desc" title="Z→A">Z-A</button>
                <button class="dict-sort-btn" data-sort="date-new" title="${i18n.t('dict_sort_recent')}">RECIENTES</button>
                <button class="dict-sort-btn" data-sort="category" title="${i18n.t('dict_sort_cat')}">CAT</button>
                <button class="dict-sort-btn" data-sort="pinned" title="${i18n.t('dict_sort_pinned')}">📌</button>
              </div>
            </div>
            <div class="dict-filter-group">
              <span class="dict-filter-label">ESCENA:</span>
              <select id="dict-scene-sel" class="dict-scene-sel">
                <option value="all">TODAS</option>
                ${this.dictionary.getSceneIndex().map(s => `
                  <option value="${s.ref}" ${this._sceneFilter === s.ref ? 'selected' : ''}>${s.label} (${s.count})</option>
                `).join('')}
              </select>
            </div>
          </div>
          <div id="dict-file-bar">
            <button id="dict-import-btn" class="dict-outline-btn">📥 ${i18n.t('dict_import')}</button>
            <button id="dict-export-btn" class="dict-outline-btn">📤 ${i18n.t('dict_export')}</button>
          </div>
        </div>

        <!-- Word list (scrollable) -->
        <div id="dict-list-wrap" class="${this._viewMode === 'study' ? 'dict-section-hidden' : ''}">
          <div id="dict-list"></div>
        </div>
        <div id="dict-study-section" class="${this._viewMode === 'study' ? '' : 'dict-section-hidden'}"></div>
      </div>
    `;
  }

  /* ── CSS ────────────────────────────────────────────── */

  _getCSS() {
    return `
      /* ─── Dictionary Modern UI ─── */

      #dict-overlay {
        position: absolute;
        inset: 0;
        z-index: 500;
        display: flex;
        font-family: 'Inter', sans-serif;
        pointer-events: auto;
      }

      #dict-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #0f172a;
        color: #f1f5f9;
        overflow: hidden;
        max-height: 100%;
      }

      /* Header */
      #dict-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px;
        background: #0f172a;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        flex-shrink: 0;
        flex-wrap: wrap;
      }

      #dict-title {
        font-family: 'Outfit', sans-serif;
        font-size: 13px;
        font-weight: 700;
        color: #f8fafc;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .dict-title-icon { font-size: 15px; }

      #dict-header-modes {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .dict-mode-btn {
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.03);
        color: #94a3b8;
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        font-weight: 700;
        padding: 5px 10px;
        border-radius: 999px;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      .dict-mode-btn:hover {
        border-color: rgba(56,189,248,0.45);
        color: #38bdf8;
      }
      .dict-mode-btn.active {
        background: rgba(56,189,248,0.14);
        border-color: rgba(56,189,248,0.55);
        color: #e0f2fe;
      }

      #dict-stats {
        font-size: 11px;
        color: #94a3b8;
        flex: 1;
        font-weight: 500;
        min-width: 220px;
      }

      #dict-header-actions {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .dict-header-btn {
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 14px;
        cursor: pointer;
        padding: 3px 5px;
        border-radius: 5px;
        transition: color 0.2s, background 0.2s;
      }
      .dict-header-btn:hover { color: #38bdf8; background: rgba(56,189,248,0.1); }

      .dict-back {
        background: #334155;
        border: none;
        color: #f1f5f9;
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        font-weight: 600;
        padding: 5px 10px;
        border-radius: 7px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .dict-back:hover { background: #475569; }

      /* Form */
      #dict-form-section {
        padding: 8px 14px;
        background: #1e293b;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        flex-shrink: 0;
      }

      #dict-form-row {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .dict-form-group { flex: 2; min-width: 80px; }

      #dict-form-row input, #dict-form-extras input {
        width: 100%;
        padding: 5px 9px;
        background: #0f172a;
        border: 1px solid rgba(255,255,255,0.1);
        color: #f1f5f9;
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        border-radius: 6px;
        outline: none;
        transition: border-color 0.2s;
        box-sizing: border-box;
      }
      #dict-form-row input:focus, #dict-form-extras input:focus {
        border-color: #38bdf8;
      }
      #dict-form-row input::placeholder, #dict-form-extras input::placeholder { color: #475569; }

      .dict-form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 10px;
        margin-top: 10px;
      }

      #dict-form-extras.hidden { display: none; }

      .dict-action-btn {
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        font-weight: 700;
        padding: 5px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        white-space: nowrap;
        transition: opacity 0.2s;
        flex-shrink: 0;
      }
      .dict-action-btn:hover { opacity: 0.85; }
      .dict-action-btn.primary  { background: #38bdf8; color: #fff; }
      .dict-action-btn.secondary { background: #334155; color: #cbd5e1; }

      /* Toolbar */
      #dict-toolbar {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 14px;
        background: #1e293b;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        flex-shrink: 0;
        flex-wrap: wrap;
      }

      #dict-search-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 140px;
      }
      .dict-search-icon { font-size: 14px; color: #64748b; }

      #dict-search {
        flex: 1;
        padding: 5px 9px;
        background: #0f172a;
        border: 1px solid rgba(255,255,255,0.1);
        color: #f1f5f9;
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        border-radius: 6px;
        outline: none;
        min-width: 80px;
      }
      #dict-search:focus { border-color: #38bdf8; }
      #dict-search::placeholder { color: #475569; }

      #dict-filters {
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;
      }

      .dict-filter-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .dict-filter-label {
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }

      #dict-sort-bar {
        display: flex;
        gap: 4px;
      }

      .dict-sort-btn {
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        font-weight: 600;
        padding: 5px 10px;
        background: #0f172a;
        border: 1px solid rgba(255,255,255,0.08);
        color: #94a3b8;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .dict-sort-btn:hover { border-color: #38bdf8; color: #38bdf8; }
      .dict-sort-btn.active { background: #38bdf8; color: #fff; border-color: #38bdf8; }

      .dict-scene-sel {
        background: #0f172a;
        border: 1px solid rgba(255,255,255,0.08);
        color: #38bdf8;
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        font-weight: 600;
        padding: 5px 10px;
        border-radius: 6px;
        outline: none;
        cursor: pointer;
      }

      #dict-file-bar {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
      }

      .dict-outline-btn {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.12);
        color: #94a3b8;
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: border-color 0.2s, color 0.2s;
        white-space: nowrap;
      }
      .dict-outline-btn:hover { border-color: #38bdf8; color: #38bdf8; }

      .dict-section-hidden { display: none !important; }

      #dict-study-section {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        background: #0f172a;
      }

      .dict-study-empty {
        min-height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 48px 24px;
        text-align: center;
        color: #cbd5e1;
      }
      .dict-study-empty-icon {
        font-size: 42px;
      }
      .dict-study-empty-title {
        font-family: 'Outfit', sans-serif;
        font-size: 22px;
        font-weight: 700;
        color: #f8fafc;
      }
      .dict-study-empty-copy {
        max-width: 560px;
        font-size: 14px;
        line-height: 1.6;
        color: #94a3b8;
      }

      /* Word list */
      #dict-list-wrap {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        min-height: 0;
        background: #0f172a;
        padding: 10px;
        scrollbar-width: thin;
        scrollbar-color: #334155 #0f172a;
      }
      #dict-list-wrap::-webkit-scrollbar { width: 4px; }
      #dict-list-wrap::-webkit-scrollbar-track { background: #0f172a; }
      #dict-list-wrap::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }

      #dict-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 10px;
        align-items: start;
      }

      /* Cards — vertical layout */
      .dict-card {
        background: #1e293b;
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 12px;
        overflow: hidden;
        transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
        display: flex;
        flex-direction: column;
      }
      .dict-card:hover {
        border-color: rgba(56,189,248,0.5);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      }
      .dict-card.selected {
        border-color: rgba(56,189,248,0.7);
        box-shadow: 0 0 0 2px rgba(56,189,248,0.15);
      }

      /* Card sections */
      .dict-card-header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 10px 4px;
        border-bottom: 1px solid rgba(255,255,255,0.04);
      }

      .dict-pin-btn {
        background: transparent;
        border: none;
        font-size: 12px;
        cursor: pointer;
        opacity: 0.3;
        transition: opacity 0.2s, transform 0.15s;
        flex-shrink: 0;
        padding: 0;
        line-height: 1;
      }
      .dict-pin-btn:hover { opacity: 0.8; transform: scale(1.2); }
      .dict-pin-btn.dict-pin-active { opacity: 1; }

      .dict-card-body {
        padding: 8px 10px 7px;
        flex: 1;
      }

      .dict-word-text {
        display: block;
        font-family: 'Outfit', sans-serif;
        font-size: 15px;
        font-weight: 700;
        color: #f1f5f9;
        margin-bottom: 5px;
        line-height: 1.2;
        word-break: break-word;
      }

      .dict-trans-box {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .dict-trans-row {
        display: flex;
        align-items: baseline;
        gap: 5px;
        min-width: 0;
      }
      .dict-flag {
        font-size: 11px;
        flex-shrink: 0;
        line-height: 1.4;
      }
      .dict-trans-main {
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        font-weight: 600;
        color: #38bdf8;
        word-break: break-word;
      }
      .dict-trans-sub {
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        color: #94a3b8;
        word-break: break-word;
      }
      .dict-trans-pending {
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        color: #475569;
        font-style: italic;
      }
      .dict-trans-empty {
        font-size: 11px;
        color: #475569;
        font-style: italic;
      }

      .dict-badge {
        font-family: 'Inter', sans-serif;
        font-size: 9px;
        font-weight: 700;
        background: rgba(255,255,255,0.06);
        color: #64748b;
        padding: 2px 7px;
        border-radius: 4px;
        white-space: nowrap;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }

      .dict-badge-scene {
        font-family: 'Inter', sans-serif;
        font-size: 9px;
        font-weight: 700;
        background: rgba(168,85,247,0.12);
        color: #a855f7;
        padding: 2px 7px;
        border-radius: 4px;
        white-space: nowrap;
        letter-spacing: 0.4px;
      }

      .dict-card-footer {
        display: flex;
        align-items: center;
        gap: 3px;
        padding: 5px 8px;
        background: rgba(0,0,0,0.15);
        border-top: 1px solid rgba(255,255,255,0.04);
      }

      .dict-icon-btn {
        background: transparent;
        border: none;
        color: #475569;
        font-size: 12px;
        width: 24px;
        height: 24px;
        cursor: pointer;
        border-radius: 5px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: color 0.15s, background 0.15s;
        flex-shrink: 0;
      }
      .dict-icon-btn:hover { background: rgba(56,189,248,0.1); color: #38bdf8; }
      .dict-icon-btn.has-rec { color: #f59e0b; }
      .dict-icon-btn.recording { color: #ef4444; animation: blink 1s infinite; }

      @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

      /* Empty state */
      .dict-empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: #334155;
      }
      .dict-empty-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.3; }

      /* Modals */
      .dict-modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.7);
        z-index: 700;
        backdrop-filter: blur(4px);
      }
      .dict-modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1e293b;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 24px;
        z-index: 710;
        width: 90%;
        max-width: 380px;
        box-shadow: 0 25px 50px rgba(0,0,0,0.5);
      }
      .dict-modal-title {
        font-family: 'Outfit', sans-serif;
        font-size: 17px;
        font-weight: 700;
        color: #f8fafc;
        margin-bottom: 16px;
        text-align: center;
      }
      .dict-modal-fields {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .dict-modal-fields label {
        font-size: 12px;
        font-weight: 600;
        color: #94a3b8;
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .dict-modal-fields input {
        padding: 9px 14px;
        background: #0f172a;
        border: 1px solid rgba(255,255,255,0.1);
        color: #f1f5f9;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        border-radius: 8px;
        outline: none;
        width: 100%;
        box-sizing: border-box;
        transition: border-color 0.2s;
      }
      .dict-modal-fields input:focus { border-color: #38bdf8; }
      .dict-modal-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 18px;
      }
      .dict-modal-save {
        flex: 2;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 600;
        padding: 10px;
        background: #38bdf8;
        border: none;
        color: #fff;
        cursor: pointer;
        border-radius: 8px;
        transition: opacity 0.2s;
      }
      .dict-modal-save:hover { opacity: 0.85; }
      .dict-modal-cancel {
        flex: 1;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 600;
        padding: 10px;
        background: #334155;
        border: none;
        color: #cbd5e1;
        cursor: pointer;
        border-radius: 8px;
        transition: background 0.2s;
      }
      .dict-modal-cancel:hover { background: #475569; }

      .dict-select {
        padding: 8px 12px;
        background: #0f172a;
        border: 1px solid rgba(255,255,255,0.1);
        color: #f1f5f9;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        border-radius: 8px;
        outline: none;
        width: 100%;
        cursor: pointer;
      }
      .dict-select:focus { border-color: #38bdf8; }

      /* ── Word Detail Panel ───────────────────────────── */
      .dict-detail-panel {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid rgba(56,189,248,0.3);
        border-radius: 10px;
        margin: 4px 0 8px;
        padding: 12px 14px;
        animation: detailFadeIn 0.2s ease;
        grid-column: 1 / -1; /* span all columns */
        position: relative;
      }
      @keyframes detailFadeIn {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .dict-detail-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .dict-detail-word {
        font-family: 'Outfit', sans-serif;
        font-size: 15px;
        font-weight: 700;
        color: #f8fafc;
        letter-spacing: 0.3px;
      }
      .dict-detail-close {
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 13px;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        transition: color 0.2s;
      }
      .dict-detail-close:hover { color: #f87171; }
      .dict-detail-body {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .dict-detail-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .dict-detail-flag { font-size: 14px; flex-shrink: 0; }
      .dict-detail-text {
        font-family: 'Inter', sans-serif;
        font-size: 13px;
      }
      .dict-detail-text.primary {
        color: #e2e8f0;
        font-weight: 600;
      }
      .dict-detail-text.secondary {
        color: #94a3b8;
        font-weight: 400;
      }
      .dict-detail-example {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        margin-top: 6px;
        padding: 7px 10px;
        background: rgba(56,189,248,0.07);
        border-left: 2px solid #38bdf8;
        border-radius: 4px;
      }
      .dict-detail-example-label { font-size: 13px; flex-shrink: 0; }
      .dict-detail-example-text {
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        color: #cbd5e1;
        font-style: italic;
        line-height: 1.45;
      }
      .dict-detail-cat {
        display: inline-block;
        font-family: 'Inter', sans-serif;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #38bdf8;
        background: rgba(56,189,248,0.1);
        border-radius: 4px;
        padding: 2px 7px;
        margin-top: 4px;
        align-self: flex-start;
      }

      /* Responsive */
      @media (max-width: 500px) {
        #dict-header { padding: 8px 12px; gap: 8px; }
        #dict-title { font-size: 14px; }
        #dict-header-modes { width: 100%; order: 3; }
        #dict-stats { min-width: 100%; order: 4; }
        #dict-form-section { padding: 10px 12px; }
        #dict-toolbar { padding: 7px 12px; gap: 8px; }
        .dict-sort-btn { font-size: 10px; padding: 4px 8px; }
        .dict-outline-btn { font-size: 11px; padding: 6px 10px; }
        #dict-list { grid-template-columns: 1fr; }
      }

      ${getStudyRoomCSS()}
    `;
  }
}
