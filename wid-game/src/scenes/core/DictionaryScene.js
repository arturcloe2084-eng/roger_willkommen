import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';
import { DictionaryManager } from '../../services/DictionaryManager.js';
import { API_CONFIG } from '../../config/apiConfig.js';
import { i18n } from '../../services/i18n.js';

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

    if (!document.getElementById('dict-styles-v2')) {
      const style = document.createElement('style');
      style.id = 'dict-styles-v2';
      style.textContent = this._getCSS();
      document.head.appendChild(style);
    }

    this._bindEvents();
    this._renderWordList();
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
    if (term) {
      all = all.filter(w =>
        w.word.toLowerCase().includes(term) ||
        w.translation.toLowerCase().includes(term) ||
        (w.category && w.category.toLowerCase().includes(term))
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
      return;
    }

    listEl.innerHTML = words.map(w => {
      const pinClass = w.pinned ? 'dict-pin-active' : 'dict-pin-inactive';
      const pinIcon = w.pinned ? '📌' : '📍';
      const hasRec = !!this._recordings[w.word];

      return `
      <div class="dict-card" data-word="${this._escAttr(w.word)}">
        <div class="dict-card-top">
          <button class="dict-pin-btn ${pinClass}" data-pin="${this._escAttr(w.word)}" title="${w.pinned ? 'Quitar chinche (aprendida)' : 'Chinche: marcar para estudiar'}">${pinIcon}</button>
          <div class="dict-card-main">
            <span class="dict-word-text">${this._esc(w.word)}</span>
            <span class="dict-trans-text">${this._esc(w.translation)}</span>
          </div>
          <span class="dict-badge">${this._esc(w.category || 'general')}</span>
          <div class="dict-card-actions">
            <button class="dict-icon-btn dict-speak-btn" data-speak="${this._escAttr(w.word)}" title="Escuchar pronunciación">🔊</button>
            <button class="dict-icon-btn dict-rec-btn ${hasRec ? 'has-rec' : ''}" data-rec="${this._escAttr(w.word)}" title="${hasRec ? 'Tiene grabación — click para grabar de nuevo' : 'Grabar mi pronunciación'}">🎙️</button>
            ${hasRec ? `<button class="dict-icon-btn dict-play-btn" data-play="${this._escAttr(w.word)}" title="Escuchar mi grabación">▶️</button>` : ''}
            <button class="dict-icon-btn dict-edit-btn" data-edit="${this._escAttr(w.word)}" title="Editar">✏️</button>
            ${w.isCustom ? `<button class="dict-icon-btn dict-del-btn" data-del="${this._escAttr(w.word)}" title="Eliminar">🗑️</button>` : ''}
          </div>
        </div>
        ${w.example ? `<div class="dict-card-example">${this._esc(w.example)}</div>` : ''}
      </div>`;
    }).join('');

    this._bindCardEvents(listEl);
    this._updateStats(words);
  }

  _updateStats(words) {
    const total = this.dictionary.getAll().length;
    const custom = this.dictionary.getCustomWords().length;
    const pinned = this.dictionary.getPinnedWords().length;
    const found = words ? words.length : total;
    const statsEl = document.getElementById('dict-stats');
    if (statsEl) {
      statsEl.textContent = `${total} palabras · ${custom} mías · 📌${pinned} para estudiar${found < total ? ` · ${found} filtradas` : ''}`;
    }
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
    modal.innerHTML = `
      <div class="dict-modal-backdrop"></div>
      <div class="dict-modal-content">
        <div class="dict-modal-title">✏️ EDITAR PALABRA</div>
        <div class="dict-modal-fields">
          <label>Palabra (alemán)</label>
          <input id="edit-word" type="text" value="${this._escAttr(w.word)}" />
          <label>Traducción</label>
          <input id="edit-trans" type="text" value="${this._escAttr(w.translation)}" />
          <label>Categoría</label>
          <input id="edit-cat" type="text" value="${this._escAttr(w.category || 'general')}" />
          <label>Ejemplo</label>
          <input id="edit-ex" type="text" value="${this._escAttr(w.example || '')}" />
        </div>
        <div class="dict-modal-actions">
          <button id="edit-save-btn" class="dict-modal-save">✔ GUARDAR</button>
          <button id="edit-cancel-btn" class="dict-modal-cancel">CANCELAR</button>
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

    // Save
    modal.querySelector('#edit-save-btn').addEventListener('click', () => {
      const newWord = document.getElementById('edit-word').value.trim();
      const newTrans = document.getElementById('edit-trans').value.trim();
      const newCat = document.getElementById('edit-cat').value.trim();
      const newEx = document.getElementById('edit-ex').value.trim();

      if (newWord && newTrans) {
        this.dictionary.updateWord(word, newWord, newTrans, newCat, newEx);
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

  /* ── Import from file ───────────────────────────────── */

  _openImportDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json,.txt,.tsv';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        let words = [];

        if (file.name.endsWith('.json')) {
          words = DictionaryManager.parseJSON(text);
        } else {
          // CSV, TSV, TXT
          words = DictionaryManager.parseCSV(text);
        }

        if (words.length === 0) {
          this._showToast('⚠️ No se encontraron palabras en el archivo');
          return;
        }

        const result = this.dictionary.importWords(words);
        this._showToast(`✔ Importadas: ${result.added} · Duplicadas: ${result.skipped} · Errores: ${result.errors}`);
        this._renderWordList();

      } catch (err) {
        console.error('Import error:', err);
        this._showToast('⚠️ Error al leer el archivo. Verifica el formato.');
      } finally {
        input.remove();
      }
    });

    input.click();
  }

  /* ── Translate + Add ────────────────────────────────── */

  async _translateWord() {
    const wordEl = document.getElementById('dict-in-word');
    const word = (wordEl?.value || '').trim();
    if (!word || this._isTranslating) return;

    const transEl = document.getElementById('dict-in-trans');
    const catEl = document.getElementById('dict-in-cat');
    const exEl = document.getElementById('dict-in-ex');

    if (transEl && transEl.value.trim().length > 0) return;

    this._isTranslating = true;
    this._showToast('🔍 Traduciendo...');

    try {
      const response = await fetch(`${API_CONFIG.PROXY_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-game-secret': API_CONFIG.GAME_SECRET
        },
        body: JSON.stringify({ word })
      });

      if (!response.ok) throw new Error('Proxy error');
      const data = await response.json();

      if (transEl) transEl.value = data.translation || '';
      if (catEl) catEl.value = data.category || 'general';
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
    const catEl = document.getElementById('dict-in-cat');
    const exEl = document.getElementById('dict-in-ex');

    const word = (wordEl?.value || '').trim();
    const trans = (transEl?.value || '').trim();
    const cat = ((catEl?.value || '').trim() || 'general').toLowerCase();
    const ex = (exEl?.value || '').trim();

    if (!word || !trans) {
      this._showToast('⚠️ Completa la palabra y la traducción');
      return;
    }

    const ok = this.dictionary.addWord(word, trans, cat, ex);
    if (ok) {
      this._showToast(`✔ "${word}" agregada`);
      if (wordEl) wordEl.value = '';
      if (transEl) transEl.value = '';
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

    // Add button
    document.getElementById('dict-add-btn')?.addEventListener('click', () => this._addWord());

    // Toggle extras
    document.getElementById('dict-form-toggle')?.addEventListener('click', (e) => {
      e.preventDefault();
      const extras = document.getElementById('dict-form-extras');
      if (extras) extras.classList.toggle('hidden');
    });

    // Auto-translate on blur
    document.getElementById('dict-in-word')?.addEventListener('blur', () => this._translateWord());

    // Enter in form inputs
    ['dict-in-word', 'dict-in-trans', 'dict-in-cat', 'dict-in-ex'].forEach(id => {
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

    // Import button
    document.getElementById('dict-import-btn')?.addEventListener('click', () => this._openImportDialog());

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

  /* ── HTML template ──────────────────────────────────── */

  _getHTML() {
    return `
      <div id="dict-panel">
        <!-- Header -->
        <div id="dict-header">
          <div id="dict-title">
            <span class="dict-title-icon">📖</span>
            <span>${i18n.t('dict_title')}</span>
          </div>
          <div id="dict-stats">${i18n.t('dict_loading')}</div>
          <button id="dict-back-btn" class="dict-back">✕ ${i18n.t('dict_close')}</button>
        </div>

        <!-- Form -->
        <div id="dict-form-section">
          <div id="dict-form-row">
            <div class="dict-form-group">
              <input id="dict-in-word" type="text" placeholder="${i18n.t('dict_ph_word')}" autocomplete="off" spellcheck="false" />
            </div>
            <div class="dict-form-group">
              <input id="dict-in-trans" type="text" placeholder="${i18n.t('dict_ph_trans')}" autocomplete="off" spellcheck="false" />
            </div>
            <button id="dict-add-btn">✔ ${i18n.t('dict_btn_add')}</button>
            <a href="#" id="dict-form-toggle" title="${i18n.t('dict_title_options')}">⚙️</a>
          </div>
          <div id="dict-form-extras" class="hidden">
            <input id="dict-in-cat" type="text" placeholder="${i18n.t('dict_ph_cat')}" autocomplete="off" spellcheck="false" />
            <input id="dict-in-ex" type="text" placeholder="${i18n.t('dict_ph_ex')}" autocomplete="off" spellcheck="false" />
          </div>
        </div>

        <!-- Toolbar: Search + Sort + Import -->
        <div id="dict-toolbar">
          <div id="dict-search-bar">
            <span class="dict-search-icon">🔍</span>
            <input id="dict-search" type="text" placeholder="${i18n.t('dict_search_ph')}" autocomplete="off" />
          </div>
          <div id="dict-sort-bar">
            <button class="dict-sort-btn active" data-sort="alpha-asc" title="A→Z">A↓</button>
            <button class="dict-sort-btn" data-sort="alpha-desc" title="Z→A">Z↓</button>
            <button class="dict-sort-btn" data-sort="date-new" title="${i18n.t('dict_sort_recent')}">🕐↓</button>
            <button class="dict-sort-btn" data-sort="category" title="${i18n.t('dict_sort_cat')}">📁</button>
            <button class="dict-sort-btn" data-sort="pinned" title="${i18n.t('dict_sort_pinned')}">📌</button>
          </div>
          <div id="dict-file-bar">
            <button id="dict-import-btn" class="dict-file-btn" title="Importar">📂 ${i18n.t('dict_import')}</button>
            <button id="dict-export-btn" class="dict-file-btn" title="Exportar">📥 ${i18n.t('dict_export')}</button>
          </div>
        </div>

        <!-- Word list (scrollable) -->
        <div id="dict-list-wrap">
          <div id="dict-list"></div>
        </div>
      </div>
    `;
  }

  /* ── CSS ────────────────────────────────────────────── */

  _getCSS() {
    return `
      /* ─── Reset old styles ─── */
      #dict-styles { display: none !important; }

      /* ─── Overlay container ─── */
      #dict-overlay {
        position: absolute;
        inset: 0;
        z-index: 500;
        display: flex;
        font-family: 'VT323', monospace;
        pointer-events: auto;
      }

      /* ─── Panel principal ─── */
      #dict-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #07071a;
        color: #c8c8d8;
        overflow: hidden;            /* IMPORTANT: panel itself doesn't scroll */
        max-height: 100%;
      }

      /* ─── Header ─── */
      #dict-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 12px;
        background: #0d0d28;
        border-bottom: 2px solid #00ff41;
        flex-shrink: 0;
        min-height: 36px;
      }

      #dict-title {
        font-family: 'Press Start 2P', monospace;
        font-size: 10px;
        color: #00ff41;
        text-shadow: 0 0 8px #00ff41;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }
      .dict-title-icon { font-size: 14px; }

      #dict-stats {
        font-size: 12px;
        color: #ffcc00;
        flex: 1;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .dict-back {
        font-family: 'VT323', monospace;
        font-size: 13px;
        background: #2a0a0a;
        border: 1px solid #ff6666;
        color: #ff6666;
        padding: 3px 10px;
        cursor: pointer;
        border-radius: 2px;
        transition: background 0.15s;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .dict-back:hover { background: #3d1010; box-shadow: 0 0 6px #ff666688; }

      /* ─── Form section ─── */
      #dict-form-section {
        padding: 6px 12px;
        background: #0a0a22;
        border-bottom: 1px solid #1e1e44;
        flex-shrink: 0;
      }

      #dict-form-row {
        display: flex;
        gap: 6px;
        align-items: center;
        flex-wrap: wrap;
      }

      .dict-form-group { flex: 2; min-width: 100px; }

      #dict-form-row input, #dict-form-extras input {
        width: 100%;
        padding: 5px 8px;
        background: #10102e;
        border: 1px solid #2a2a55;
        color: #e0e0f0;
        font-family: 'VT323', monospace;
        font-size: 15px;
        border-radius: 2px;
        outline: none;
        transition: border-color 0.15s;
        box-sizing: border-box;
      }
      #dict-form-row input:focus, #dict-form-extras input:focus {
        border-color: #00ff41;
        box-shadow: 0 0 4px #00ff4166;
      }
      #dict-form-row input::placeholder, #dict-form-extras input::placeholder { color: #555577; }

      #dict-form-extras {
        display: flex;
        gap: 6px;
        margin-top: 6px;
      }
      #dict-form-extras.hidden { display: none; }
      #dict-form-extras input { flex: 1; }

      #dict-form-toggle {
        color: #00ccff;
        text-decoration: none;
        font-size: 16px;
        opacity: 0.7;
        transition: opacity 0.2s;
        flex-shrink: 0;
      }
      #dict-form-toggle:hover { opacity: 1; }

      #dict-add-btn {
        font-family: 'VT323', monospace;
        font-size: 14px;
        padding: 4px 12px;
        background: #0a2a0a;
        border: 1px solid #00ff41;
        color: #00ff41;
        cursor: pointer;
        border-radius: 2px;
        white-space: nowrap;
        transition: background 0.15s;
        flex-shrink: 0;
      }
      #dict-add-btn:hover { background: #1a4a1a; box-shadow: 0 0 6px #00ff4188; }

      /* ─── Toolbar ─── */
      #dict-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 12px;
        background: #08082a;
        border-bottom: 1px solid #181840;
        flex-shrink: 0;
        flex-wrap: wrap;
      }

      #dict-search-bar {
        display: flex;
        align-items: center;
        gap: 4px;
        flex: 1;
        min-width: 120px;
      }
      .dict-search-icon { font-size: 13px; }

      #dict-search {
        flex: 1;
        padding: 4px 8px;
        background: #10102e;
        border: 1px solid #2a2a55;
        color: #e0e0f0;
        font-family: 'VT323', monospace;
        font-size: 15px;
        border-radius: 2px;
        outline: none;
        min-width: 80px;
      }
      #dict-search:focus { border-color: #00ccff; box-shadow: 0 0 4px #00ccff66; }
      #dict-search::placeholder { color: #444466; }

      #dict-sort-bar {
        display: flex;
        gap: 3px;
        flex-shrink: 0;
      }

      .dict-sort-btn {
        font-family: 'VT323', monospace;
        font-size: 13px;
        padding: 3px 7px;
        background: #0d0d28;
        border: 1px solid #2a2a55;
        color: #8888aa;
        cursor: pointer;
        border-radius: 2px;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .dict-sort-btn:hover { border-color: #00ccff; color: #00ccff; }
      .dict-sort-btn.active { border-color: #00ff41; color: #00ff41; background: #0a1a0a; }

      #dict-file-bar {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }

      .dict-file-btn {
        font-family: 'VT323', monospace;
        font-size: 13px;
        padding: 3px 8px;
        background: #0d0d28;
        border: 1px solid #2a2a55;
        color: #aaaacc;
        cursor: pointer;
        border-radius: 2px;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .dict-file-btn:hover { border-color: #ffcc00; color: #ffcc00; }

      /* ─── Word list wrapper — THIS IS THE KEY FIX ─── */
      #dict-list-wrap {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        min-height: 0;            /* critical for flex overflow */
        scrollbar-width: thin;
        scrollbar-color: #00ff4144 #0a0a1a;
        padding: 4px 0;
      }
      #dict-list-wrap::-webkit-scrollbar { width: 6px; }
      #dict-list-wrap::-webkit-scrollbar-track { background: #0a0a1a; }
      #dict-list-wrap::-webkit-scrollbar-thumb { background: #00ff4144; border-radius: 3px; }

      #dict-list {
        padding: 0 10px 10px 10px;
      }

      /* ─── Word cards ─── */
      .dict-card {
        background: #0c0c28;
        border: 1px solid #1a1a44;
        border-radius: 4px;
        padding: 6px 10px;
        margin-bottom: 4px;
        transition: background 0.1s, border-color 0.1s;
      }
      .dict-card:hover {
        background: #111140;
        border-color: #2a2a66;
      }

      .dict-card-top {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .dict-card-main {
        flex: 1;
        display: flex;
        gap: 8px;
        align-items: baseline;
        min-width: 0;
        flex-wrap: wrap;
      }

      .dict-word-text {
        color: #00ff41;
        font-size: 16px;
        font-weight: bold;
        white-space: nowrap;
      }
      .dict-trans-text {
        color: #00ccff;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .dict-badge {
        display: inline-block;
        padding: 1px 6px;
        background: #12123a;
        border: 1px solid #2a2a60;
        border-radius: 10px;
        font-size: 11px;
        color: #9999cc;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .dict-card-example {
        font-size: 12px;
        color: #666688;
        font-style: italic;
        margin-top: 3px;
        padding-left: 28px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* ─── Card action buttons ─── */
      .dict-card-actions {
        display: flex;
        gap: 3px;
        flex-shrink: 0;
      }

      .dict-icon-btn {
        background: none;
        border: 1px solid transparent;
        font-size: 14px;
        width: 26px;
        height: 24px;
        cursor: pointer;
        border-radius: 2px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
        padding: 0;
      }
      .dict-icon-btn:hover {
        background: #1a1a44;
        border-color: #3a3a66;
      }

      .dict-speak-btn:hover { border-color: #00ff41; }
      .dict-rec-btn:hover { border-color: #ff4444; }
      .dict-rec-btn.recording { border-color: #ff0000; background: #3a0a0a; animation: pulse-rec 0.8s infinite; }
      .dict-rec-btn.has-rec { border-color: #ff880044; }
      .dict-play-btn:hover { border-color: #ffcc00; }
      .dict-edit-btn:hover { border-color: #00ccff; }
      .dict-del-btn:hover { border-color: #ff6666; background: #2a0a0a; }

      @keyframes pulse-rec {
        0%,100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* ─── Pin button ─── */
      .dict-pin-btn {
        background: none;
        border: none;
        font-size: 15px;
        cursor: pointer;
        padding: 0 2px;
        transition: transform 0.15s;
        flex-shrink: 0;
      }
      .dict-pin-btn:hover { transform: scale(1.3); }
      .dict-pin-active { filter: drop-shadow(0 0 3px #ff6600); }
      .dict-pin-inactive { opacity: 0.3; }

      /* ─── Empty state ─── */
      .dict-empty {
        text-align: center;
        padding: 40px 20px;
        color: #444466;
        font-size: 15px;
      }
      .dict-empty-icon {
        font-size: 40px;
        margin-bottom: 12px;
        opacity: 0.4;
      }

      /* ─── Toast ─── */
      #dict-toast {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%) translateY(60px);
        background: #0d0d28ee;
        border: 1px solid #00ff41;
        color: #c8c8d8;
        padding: 6px 16px;
        font-size: 14px;
        border-radius: 4px;
        pointer-events: none;
        opacity: 0;
        transition: transform 0.25s ease-out, opacity 0.25s;
        z-index: 600;
        white-space: nowrap;
        max-width: 90%;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #dict-toast.visible {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }

      /* ─── Edit modal ─── */
      .dict-modal-backdrop {
        position: absolute;
        inset: 0;
        background: #000000aa;
        z-index: 700;
      }
      .dict-modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #0d0d28;
        border: 2px solid #00ccff;
        border-radius: 6px;
        padding: 16px 20px;
        z-index: 710;
        width: 90%;
        max-width: 380px;
        box-shadow: 0 0 30px #00ccff33;
      }
      .dict-modal-title {
        font-family: 'Press Start 2P', monospace;
        font-size: 10px;
        color: #00ccff;
        margin-bottom: 12px;
        text-align: center;
      }
      .dict-modal-fields {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .dict-modal-fields label {
        font-size: 11px;
        color: #8888aa;
        margin-top: 3px;
      }
      .dict-modal-fields input {
        padding: 5px 8px;
        background: #10102e;
        border: 1px solid #2a2a55;
        color: #e0e0f0;
        font-family: 'VT323', monospace;
        font-size: 15px;
        border-radius: 2px;
        outline: none;
        width: 100%;
        box-sizing: border-box;
      }
      .dict-modal-fields input:focus {
        border-color: #00ccff;
        box-shadow: 0 0 4px #00ccff44;
      }
      .dict-modal-actions {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-top: 14px;
      }
      .dict-modal-save {
        font-family: 'VT323', monospace;
        font-size: 14px;
        padding: 5px 16px;
        background: #0a2a0a;
        border: 1px solid #00ff41;
        color: #00ff41;
        cursor: pointer;
        border-radius: 2px;
        transition: background 0.15s;
      }
      .dict-modal-save:hover { background: #1a4a1a; }
      .dict-modal-cancel {
        font-family: 'VT323', monospace;
        font-size: 14px;
        padding: 5px 16px;
        background: #1a0a0a;
        border: 1px solid #ff6666;
        color: #ff6666;
        cursor: pointer;
        border-radius: 2px;
        transition: background 0.15s;
      }
      .dict-modal-cancel:hover { background: #2a1010; }

      /* ─── Responsive tweaks ─── */
      @media (max-width: 500px) {
        #dict-header { padding: 4px 8px; gap: 6px; }
        #dict-title { font-size: 8px; }
        #dict-stats { font-size: 10px; }
        #dict-form-section { padding: 4px 8px; }
        #dict-toolbar { padding: 4px 8px; gap: 4px; }
        .dict-sort-btn { font-size: 11px; padding: 2px 5px; }
        .dict-file-btn { font-size: 11px; padding: 2px 5px; }
        .dict-card { padding: 5px 6px; }
        .dict-card-actions { gap: 1px; }
        .dict-icon-btn { width: 22px; height: 20px; font-size: 12px; }
        .dict-badge { font-size: 10px; }
      }
    `;
  }
}
