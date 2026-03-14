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
    return this.instance;
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
  addWord(word, translation, category = 'general', example = '') {
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
  updateWord(originalWord, newWord, newTranslation, newCategory, newExample) {
    // Buscar en custom
    const customIdx = this.customWords.findIndex(w => w.word === originalWord);
    if (customIdx >= 0) {
      this.customWords[customIdx] = {
        ...this.customWords[customIdx],
        word: newWord,
        translation: newTranslation,
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

    words.forEach(item => {
      try {
        if (!item.word || !item.translation) {
          errors++;
          return;
        }
        if (this.addWord(item.word.trim(), item.translation.trim(),
          (item.category || 'importado').trim(),
          (item.example || '').trim())) {
          added++;
        } else {
          skipped++;
        }
      } catch (e) {
        errors++;
      }
    });

    return { added, skipped, errors };
  }

  /**
   * Parsear texto CSV a array de objetos {word, translation, category?, example?}
   * Formato esperado: word;translation;category;example (punto y coma o coma)
   * También soporta tab-separated
   */
  static parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const results = [];

    // Detectar delimitador
    const firstLine = lines[0] || '';
    let delimiter = ';';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (!firstLine.includes(';') && firstLine.includes(',')) delimiter = ',';

    // Detectar si la primera línea es header
    const headerLike = firstLine.toLowerCase();
    const hasHeader = headerLike.includes('word') || headerLike.includes('palabra') ||
      headerLike.includes('translation') || headerLike.includes('traducción');
    const startIdx = hasHeader ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map(p => p.trim());
      if (parts.length >= 2) {
        results.push({
          word: parts[0],
          translation: parts[1],
          category: parts[2] || 'importado',
          example: parts[3] || ''
        });
      }
    }

    return results;
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
