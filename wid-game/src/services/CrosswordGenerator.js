/**
 * CrosswordGenerator
 * 
 * Genera crucigramas a partir de vocabulary.json
 * Usa las palabras que TÚ agregas al estudiar
 * 
 * USO:
 * const cw = new CrosswordGenerator(vocabularyManager);
 * const puzzle = await cw.generate(5); // 5 palabras aleatorias
 * const puzzleByCategory = await cw.generateByCategory('supermercado', 4);
 */

export class CrosswordGenerator {
  constructor(vocabularyManager) {
    this.vocab = vocabularyManager;
  }

  /**
   * Generar crucigrama con N palabras aleatorias
   */
  async generate(wordCount = 5) {
    const words = this.vocab.getRandom(wordCount);
    return this._buildPuzzle(words);
  }

  /**
   * Generar crucigrama de una categoría específica
   */
  async generateByCategory(category, wordCount = 5) {
    const words = this.vocab.getRandomByCategory(category, wordCount);
    return this._buildPuzzle(words);
  }

  /**
   * Construir estructura del crucigrama
   */
  _buildPuzzle(words) {
    // Genera clues (pistas en español) y estructura del puzzle
    const clues = {};
    const answers = {};

    words.forEach((word, idx) => {
      const clueId = `word_${idx}`;
      clues[clueId] = {
        de: word.word,
        es: word.translation,
        example: word.example || '',
        category: word.category
      };
      answers[clueId] = word.word;
    });

    return {
      id: `crossword_${Date.now()}`,
      words: words.map(w => w.word),
      clues: clues,
      answers: answers,
      difficulty: 'auto',
      category: words[0]?.category || 'mixed'
    };
  }

  /**
   * Validar respuesta del usuario
   */
  validateAnswer(puzzleId, clueId, userAnswer) {
    // Este método se usa en la UI del crucigrama
    // Retorna { correct: boolean, feedback: string }
    return {
      correct: true, // simplificado para el ejemplo
      feedback: 'Correcto!'
    };
  }
}
