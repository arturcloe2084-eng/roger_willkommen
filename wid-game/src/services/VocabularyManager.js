/**
 * VocabularyManager
 * 
 * Gestor centralizado de vocabulario.
 * - Lee de vocabulary.json
 * - Distribuye palabras a todos los mini-juegos
 * - Permite agregar palabras sin tocar código
 * 
 * USO:
 * const vocab = await VocabularyManager.load();
 * const wordsByCategory = vocab.getByCategory('supermercado');
 * const randomWords = vocab.getRandom(5);
 */

export class VocabularyManager {
  constructor(vocabData) {
    this.data = vocabData;
    this.words = vocabData.words || [];
  }

  static async load() {
    try {
      const response = await fetch('/data/vocabulary.json');
      const data = await response.json();
      return new VocabularyManager(data);
    } catch (err) {
      console.error('Error loading vocabulary:', err);
      return new VocabularyManager({ words: [] });
    }
  }

  /**
   * Obtener palabras por categoría
   */
  getByCategory(category) {
    return this.words.filter(w => w.category === category);
  }

  /**
   * Obtener todas las categorías disponibles
   */
  getCategories() {
    const categories = new Set(this.words.map(w => w.category));
    return Array.from(categories);
  }

  /**
   * Obtener N palabras aleatorias
   */
  getRandom(count = 5) {
    const shuffled = [...this.words].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, this.words.length));
  }

  /**
   * Obtener N palabras aleatorias de una categoría
   */
  getRandomByCategory(category, count = 5) {
    const categoryWords = this.getByCategory(category);
    const shuffled = [...categoryWords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, categoryWords.length));
  }

  /**
   * Obtener palabra específica
   */
  getWord(word) {
    return this.words.find(w => w.word === word);
  }

  /**
   * Contar palabras totales
   */
  count() {
    return this.words.length;
  }

  /**
   * Agregar palabra (para test, no persiste)
   */
  addWord(word, translation, category = 'general', example = '') {
    this.words.push({
      word,
      translation,
      category,
      example
    });
  }

  /**
   * Filtrar palabras por nivel de dificultad (si tiene propiedad level)
   */
  getByLevel(level) {
    return this.words.filter(w => w.level === level);
  }

  /**
   * Exportar lista de palabras para copiar a vocabulary.json
   */
  export() {
    return JSON.stringify({
      meta: this.data.meta,
      words: this.words
    }, null, 2);
  }
}
