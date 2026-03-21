/**
 * DictionaryManager
 * 
 * Gestor persistente del diccionario del jugador.
 * - Carga palabras base de vocabulary.json
 * - Permite agregar palabras nuevas manualmente
 * - Guarda en localStorage (persistente entre sesiones)
 * - Organiza palabras por categorías y permite búsqueda
 * - Soporta "pin" (chinche) para marcar palabras no aprendidas
 * - Soporta importación desde archivos externos
 * 
 * USO:
 * const dict = await DictionaryManager.getInstance();
 * dict.addWord('Hallo', 'Hola', 'saludo', 'Hallo, ich bin neu.');
 * dict.getAll();
 */

export class DictionaryManager {
  static instance = null;

  constructor(baseWords = []) {
    this.baseWords = baseWords.map(w => ({
      ...w,
      isCustom: false,
      pinned: false,
      addedAt: w.addedAt || Date.now()
    }));
    this.customWords = [];
    this.pinnedSet = new Set();      // Set of word strings that are pinned
    this.loadFromLocalStorage();
  }

  static async getInstance() {
    if (!this.instance) {
      try {
        const response = await fetch('/data/vocabulary.json');
        const data = await response.json();
        this.instance = new DictionaryManager(data.words || []);
      } catch (err) {
        console.error('Error loading base vocabulary:', err);
        this.instance = new DictionaryManager([]);
      }

    }
    await this.instance.hydrateImportExamples();
    return this.instance;
  }

  async hydrateImportExamples() {
    if (this._didHydrateImportExamples) return 0;
    this._didHydrateImportExamples = true;

    try {
      const response = await fetch('/data/IMPORTAR_DE_IMAGEN.csv', { cache: 'no-store' });
      if (!response.ok) return 0;

      const csvText = await response.text();
      const importedWords = DictionaryManager.parseCSV(csvText);
      return this.enrichExistingWords(importedWords);
    } catch (err) {
      console.warn('Could not hydrate import examples:', err);
      return 0;
    }
  }

  /**
   * Cargar palabras personalizadas y estados de pin desde localStorage
   */
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('customDictionaryWords');
      if (stored) {
        this.customWords = JSON.parse(stored);
      }
    } catch (err) {
      console.error('Error loading custom words from localStorage:', err);
      this.customWords = [];
    }

    try {
      const pinned = localStorage.getItem('dictionaryPinnedWords');
      if (pinned) {
        this.pinnedSet = new Set(JSON.parse(pinned));
      }
    } catch (err) {
      console.error('Error loading pinned words from localStorage:', err);
      this.pinnedSet = new Set();
    }
  }

  /**
   * Guardar palabras personalizadas en localStorage
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem('customDictionaryWords', JSON.stringify(this.customWords));
    } catch (err) {
      console.error('Error saving custom words to localStorage:', err);
    }
  }

  /**
   * Guardar estado de pines en localStorage
   */
  savePinnedToLocalStorage() {
    try {
      localStorage.setItem('dictionaryPinnedWords', JSON.stringify([...this.pinnedSet]));
    } catch (err) {
      console.error('Error saving pinned words to localStorage:', err);
    }
  }

  /**
   * Obtener todas las palabras (base + personalizadas) con estado de pin
   */
  getAll() {
    const all = [...this.baseWords, ...this.customWords];
    return all.map(w => ({
      ...w,
      pinned: this.pinnedSet.has(w.word)
    }));
  }

  /**
   * Obtener solo palabras personalizadas
   */
  getCustomWords() {
    return [...this.customWords];
  }

  /**
   * Obtener palabras pinneadas (para estudio preferencial)
   */
  getPinnedWords() {
    return this.getAll().filter(w => w.pinned);
  }

  /**
   * Toggle pin de una palabra
   */
  togglePin(word) {
    if (this.pinnedSet.has(word)) {
      this.pinnedSet.delete(word);
    } else {
      this.pinnedSet.add(word);
    }
    this.savePinnedToLocalStorage();
    return this.pinnedSet.has(word);
  }

  /**
   * Verificar si una palabra está pinneada
   */
  isPinned(word) {
    return this.pinnedSet.has(word);
  }

  /**
   * Agregar nueva palabra personalizada
   */
  addWord(word, translation, category = 'general', example = '', translation1 = '', translation2 = '') {
    // Verificar si ya existe
    const exists = this.getAll().find(
      w => w.word.toLowerCase() === word.toLowerCase()
    );

    if (exists) {
      console.warn(`Palabra "${word}" ya existe en el diccionario.`);
      return false;
    }

    this.customWords.push({
      word,
      translation,
      translation1: translation1 || '',
      translation2: translation2 || '',
      category: category || 'general',
      example: example || '',
      addedAt: Date.now(),
      isCustom: true
    });

    this.saveToLocalStorage();
    return true;
  }

  /**
   * Actualizar cualquier palabra (base o custom) buscando por nombre original
   */
  updateWord(originalWord, newWord, newTranslation, newCategory, newExample, newT1, newT2) {
    // Buscar en custom
    const customIdx = this.customWords.findIndex(w => w.word === originalWord);
    if (customIdx >= 0) {
      this.customWords[customIdx] = {
        ...this.customWords[customIdx],
        word: newWord,
        translation: newTranslation,
        translation1: newT1 !== undefined ? newT1 : (this.customWords[customIdx].translation1 || ''),
        translation2: newT2 !== undefined ? newT2 : (this.customWords[customIdx].translation2 || ''),
        category: newCategory || 'general',
        example: newExample || ''
      };
      // Actualizar pin si cambió el nombre
      if (originalWord !== newWord && this.pinnedSet.has(originalWord)) {
        this.pinnedSet.delete(originalWord);
        this.pinnedSet.add(newWord);
        this.savePinnedToLocalStorage();
      }
      this.saveToLocalStorage();
      return true;
    }

    // Buscar en base
    const baseIdx = this.baseWords.findIndex(w => w.word === originalWord);
    if (baseIdx >= 0) {
      this.baseWords[baseIdx] = {
        ...this.baseWords[baseIdx],
        word: newWord,
        translation: newTranslation,
        translation1: newT1 !== undefined ? newT1 : (this.baseWords[baseIdx].translation1 || ''),
        translation2: newT2 !== undefined ? newT2 : (this.baseWords[baseIdx].translation2 || ''),
        category: newCategory || 'general',
        example: newExample || ''
      };
      if (originalWord !== newWord && this.pinnedSet.has(originalWord)) {
        this.pinnedSet.delete(originalWord);
        this.pinnedSet.add(newWord);
        this.savePinnedToLocalStorage();
      }
      return true;
    }

    return false;
  }

  enrichExistingWords(words) {
    if (!Array.isArray(words) || words.length === 0) return 0;

    let updated = 0;
    let customChanged = false;

    words.forEach(item => {
      if (!item?.word) return;

      const incomingWord = String(item.word || '').trim();
      if (!incomingWord) return;

      const mainTranslation = String(item.translation || '').trim();
      const t1Raw = String(item.translation1 || '').trim();
      const t2Raw = String(item.translation2 || '').trim();
      const incomingCategory = String(item.category || '').trim();
      const incomingExample = String(item.example || '').trim();

      const mainLc = mainTranslation.toLowerCase();
      const t1Lc = t1Raw.toLowerCase();
      const t2Lc = t2Raw.toLowerCase();
      const safeT1 = t1Raw && t1Lc !== mainLc ? t1Raw : '';
      const safeT1Lc = safeT1.toLowerCase();
      const safeT2 = t2Raw && t2Lc !== mainLc && t2Lc !== safeT1Lc ? t2Raw : '';

      const customIdx = this.customWords.findIndex(
        w => String(w.word || '').toLowerCase() === incomingWord.toLowerCase()
      );
      const baseIdx = customIdx < 0
        ? this.baseWords.findIndex(w => String(w.word || '').toLowerCase() === incomingWord.toLowerCase())
        : -1;

      const targetList = customIdx >= 0 ? this.customWords : (baseIdx >= 0 ? this.baseWords : null);
      const targetIdx = customIdx >= 0 ? customIdx : baseIdx;
      if (!targetList || targetIdx < 0) return;

      const existing = targetList[targetIdx];
      const existingTranslation = String(existing.translation || '').trim();
      const existingCategory = String(existing.category || '').trim();
      const existingExample = String(existing.example || '').trim();
      const existingT1 = String(existing.translation1 || '').trim();
      const existingT2 = String(existing.translation2 || '').trim();

      const mergedTranslation = existingTranslation || mainTranslation;
      const mergedCategory = existingCategory || incomingCategory || 'importado';
      const mergedExample = (!existingExample || DictionaryManager.isPlaceholderExample(existingExample, incomingWord))
        ? incomingExample
        : existingExample;
      const mergedT1 = existingT1 || safeT1;
      const mergedT2 = existingT2 || safeT2;

      const changed =
        mergedTranslation !== existingTranslation ||
        mergedCategory !== existingCategory ||
        mergedExample !== existingExample ||
        mergedT1 !== existingT1 ||
        mergedT2 !== existingT2;

      if (!changed) return;

      targetList[targetIdx] = {
        ...existing,
        translation: mergedTranslation,
        translation1: mergedT1,
        translation2: mergedT2,
        category: mergedCategory,
        example: mergedExample
      };

      if (targetList === this.customWords) customChanged = true;
      updated++;
    });

    if (customChanged) this.saveToLocalStorage();
    return updated;
  }

  static isPlaceholderExample(example, word = '') {
    const ex = String(example || '').trim().toLowerCase();
    const w = String(word || '').trim().toLowerCase();
    if (!ex) return true;

    return (
      ex === `ich lerne das wort: ${w}.` ||
      ex === `ich lerne das wort ${w}.` ||
      ex.startsWith('ich lerne das wort:')
    );
  }

  /**
   * Eliminar palabra personalizada por nombre
   */
  removeCustomWord(wordOrIndex) {
    if (typeof wordOrIndex === 'string') {
      const idx = this.customWords.findIndex(w => w.word === wordOrIndex);
      if (idx >= 0) {
        const word = this.customWords[idx].word;
        this.customWords.splice(idx, 1);
        this.pinnedSet.delete(word);
        this.savePinnedToLocalStorage();
        this.saveToLocalStorage();
        return true;
      }
      return false;
    } else {
      if (wordOrIndex >= 0 && wordOrIndex < this.customWords.length) {
        const word = this.customWords[wordOrIndex].word;
        this.customWords.splice(wordOrIndex, 1);
        this.pinnedSet.delete(word);
        this.savePinnedToLocalStorage();
        this.saveToLocalStorage();
        return true;
      }
      return false;
    }
  }

  /**
   * Obtener palabras por categoría
   */
  getByCategory(category) {
    return this.getAll().filter(
      w => w.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Obtener todas las categorías
   */
  getCategories() {
    const categories = new Set(
      this.getAll().map(w => w.category)
    );
    return Array.from(categories).sort();
  }

  /**
   * Buscar palabras por término
   */
  search(term) {
    const lower = term.toLowerCase();
    return this.getAll().filter(w =>
      w.word.toLowerCase().includes(lower) ||
      w.translation.toLowerCase().includes(lower) ||
      (w.example && w.example.toLowerCase().includes(lower))
    );
  }

  /**
   * Contar total de palabras
   */
  count() {
    return this.getAll().length;
  }

  /**
   * Contar palabras personalizadas
   */
  countCustom() {
    return this.customWords.length;
  }

  /**
   * Importar palabras desde lista de objetos
   * Soporta formatos: {word, translation, category?, example?}
   * Retorna { added, skipped, errors }
   */
  importWords(words) {
    let added = 0;
    let skipped = 0;
    let errors = 0;
    let updated = 0;

    words.forEach(item => {
      try {
        if (!item.word || !item.translation) {
          errors++;
          return;
        }

        const mainTranslation = String(item.translation || '').trim();
        const t1Raw = String(item.translation1 || '').trim();
        const t2Raw = String(item.translation2 || '').trim();
        const mainLc = mainTranslation.toLowerCase();
        const t1Lc = t1Raw.toLowerCase();
        const t2Lc = t2Raw.toLowerCase();

        // Evitar guardar traducciones duplicadas en campos secundarios
        const safeT1 = t1Raw && t1Lc !== mainLc ? t1Raw : '';
        const safeT1Lc = safeT1.toLowerCase();
        const safeT2 = t2Raw && t2Lc !== mainLc && t2Lc !== safeT1Lc ? t2Raw : '';

        const incomingWord = item.word.trim();
        const incomingCategory = (item.category || 'importado').trim();
        const incomingExample = (item.example || '').trim();

        if (this.addWord(
          incomingWord,
          mainTranslation,
          incomingCategory,
          incomingExample,
          safeT1,
          safeT2
        )) {
          added++;
        } else {
          // Si ya existe, intentamos enriquecer la fila existente con campos faltantes.
          const existing = this.getAll().find(
            w => String(w.word || '').toLowerCase() === incomingWord.toLowerCase()
          );

          if (!existing) {
            skipped++;
            return;
          }

          const mergedTranslation = String(existing.translation || '').trim() || mainTranslation;
          const existingCategory = String(existing.category || '').trim();
          const mergedCategory = existingCategory || incomingCategory || 'importado';

          const existingExample = String(existing.example || '').trim();
          const mergedExample = (!existingExample || DictionaryManager.isPlaceholderExample(existingExample, incomingWord))
            ? incomingExample
            : existingExample;

          const existingT1 = String(existing.translation1 || '').trim();
          const existingT2 = String(existing.translation2 || '').trim();
          const mergedT1 = existingT1 || safeT1;
          const mergedT2 = existingT2 || safeT2;

          const changed =
            mergedTranslation !== String(existing.translation || '').trim() ||
            mergedCategory !== existingCategory ||
            mergedExample !== existingExample ||
            mergedT1 !== existingT1 ||
            mergedT2 !== existingT2;

          if (changed) {
            const okUpdate = this.updateWord(
              existing.word,
              existing.word,
              mergedTranslation,
              mergedCategory,
              mergedExample,
              mergedT1,
              mergedT2
            );
            if (okUpdate) {
              updated++;
            } else {
              skipped++;
            }
          } else {
            skipped++;
          }
        }
      } catch (e) {
        errors++;
      }
    });

    return { added, skipped, errors, updated };
  }

  /**
   * Parsear texto CSV a array de objetos {word, translation, category?, example?}
   * Formato esperado: word;translation;category;example (punto y coma o coma)
   * También soporta tab-separated
   */
  static parseCSV(text) {
    if (!text || typeof text !== 'string') return [];

    const lines = text
      .replace(/^\uFEFF/, '') // remove UTF-8 BOM
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l && !this._isCommentOrDividerLine(l));

    if (lines.length === 0) return [];

    const delimiter = this._detectDelimiter(lines);

    // Detectar si la primera línea es header
    const firstParts = this._splitDelimitedLine(lines[0], delimiter).map(p => p.trim().toLowerCase());
    const hasHeader = firstParts.some(h =>
      ['word', 'palabra', 'translation', 'traduccion', 'traducción', 'category', 'categoria', 'categoría', 'example', 'ejemplo'].includes(h)
    );

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const results = [];

    for (const line of dataLines) {
      const parts = this._splitDelimitedLine(line, delimiter).map(p => p.trim());
      if (parts.length < 2) continue;

      // Soportar ambos formatos:
      // A) 4 cols -> word, translation, category, example
      // B) 5 cols -> word, translation1, translation2, category, example
      // Si hay delimitadores extra en "example", los reagrupamos.
      let word = parts[0] || '';
      let translation = parts[1] || '';
      let translation1 = '';
      let translation2 = parts.length === 2 ? translation : '';
      let category = 'importado';
      let example = '';

      if (parts.length >= 5) {
        const scoreCol2 = this._categoryScore(parts[2]);
        const scoreCol3 = this._categoryScore(parts[3]);
        const joiner = delimiter === ',' ? ', ' : delimiter;

        if (scoreCol2 > scoreCol3) {
          // word, translation, category, example(+rest)
          category = parts[2] || 'importado';
          example = parts.slice(3).join(joiner);
        } else {
          // word, translation1, translation2, category, example(+rest)
          translation1 = parts[1] || '';
          translation2 = parts[2] || '';
          translation = parts[1] || parts[2] || '';
          category = parts[3] || 'importado';
          example = parts.slice(4).join(joiner);
        }
      } else if (parts.length === 4) {
        category = parts[2] || 'importado';
        example = parts[3] || '';
      } else if (parts.length === 3) {
        category = parts[2] || 'importado';
      }

      if (!word || !translation) continue;

      results.push({
        word,
        translation,
        translation1,
        translation2,
        category,
        example
      });
    }

    return results;
  }

  static _isCommentOrDividerLine(line) {
    const t = (line || '').trim();
    return (
      t.startsWith('//') ||
      t.startsWith('#') ||
      t.startsWith('/*') ||
      t.startsWith('*') ||
      t.startsWith('*/') ||
      /^=+$/.test(t) ||
      /^-+$/.test(t)
    );
  }

  static _detectDelimiter(lines) {
    const candidates = [',', ';', '\t', '|'];
    let best = ',';
    let bestScore = -1;

    for (const delim of candidates) {
      let score = 0;
      let evaluated = 0;

      for (const line of lines.slice(0, 20)) {
        const parts = this._splitDelimitedLine(line, delim);
        if (parts.length > 1) {
          score += parts.length;
          evaluated++;
        }
      }

      if (evaluated === 0) continue;
      const avg = score / evaluated;
      if (avg > bestScore) {
        bestScore = avg;
        best = delim;
      }
    }

    return best;
  }

  static _splitDelimitedLine(line, delimiter) {
    const out = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const next = line[i + 1];

      if (ch === '"' && inQuotes && next === '"') {
        current += '"';
        i++;
        continue;
      }

      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (!inQuotes && ch === delimiter) {
        out.push(current);
        current = '';
        continue;
      }

      current += ch;
    }

    out.push(current);
    return out;
  }

  static _categoryScore(value) {
    const v = String(value || '').trim();
    if (!v) return -10;

    let score = 0;
    const words = v.split(/\s+/).filter(Boolean);
    if (words.length <= 3) score += 2;
    if (v.length <= 24) score += 2;
    if (v === v.toLowerCase()) score += 1;
    if (!/[.,!?;:]/.test(v)) score += 1;
    if (/[_-]/.test(v)) score += 2;
    if (/[/\\]/.test(v)) score -= 2;
    if (/[.!?]/.test(v)) score -= 2;

    return score;
  }

  /**
   * Parsear JSON importado
   * Soporta: array de objetos, o {words: [...]}
   */
  static parseJSON(text) {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (data.words && Array.isArray(data.words)) return data.words;
    return [];
  }

  /**
   * Exportar diccionario personalizado como JSON
   */
  exportCustom() {
    return {
      exportDate: new Date().toISOString(),
      words: this.customWords
    };
  }

  /**
   * Limpiar todas las palabras personalizadas
   */
  clearCustomWords() {
    this.customWords = [];
    this.saveToLocalStorage();
  }
}
