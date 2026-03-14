/**
 * QuizGenerator
 * 
 * Genera tests de 4 opciones a partir de vocabulary.json
 * Automatiza completamente a partir de tus palabras
 * 
 * USO:
 * const quiz = new QuizGenerator(vocabularyManager);
 * const questions = await quiz.generate(10); // 10 preguntas
 * const categoryQuiz = await quiz.generateByCategory('burocracia', 5);
 */

export class QuizGenerator {
  constructor(vocabularyManager) {
    this.vocab = vocabularyManager;
  }

  /**
   * Generar N preguntas aleatorias (4 opciones cada una)
   */
  async generate(questionCount = 10) {
    const words = this.vocab.getRandom(questionCount);
    return this._buildQuestions(words);
  }

  /**
   * Generar preguntas de una categoría específica
   */
  async generateByCategory(category, questionCount = 5) {
    const words = this.vocab.getRandomByCategory(category, questionCount);
    return this._buildQuestions(words);
  }

  /**
   * Construir las preguntas con 4 opciones cada una
   */
  _buildQuestions(words) {
    const questions = words.map((word, idx) => {
      // Opción correcta
      const correctAnswer = word.translation;

      // 3 opciones incorrectas: otras traducciones aleatorias
      const allWords = this.vocab.words
        .filter(w => w.word !== word.word)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [
        correctAnswer,
        ...allWords.map(w => w.translation)
      ].sort(() => 0.5 - Math.random());

      return {
        id: `question_${idx}`,
        question: `¿Qué significa "${word.word}"?`,
        example: word.example || '',
        options: options,
        correctAnswer: correctAnswer,
        category: word.category,
        explanation: `"${word.word}" = ${word.translation}`
      };
    });

    return {
      id: `quiz_${Date.now()}`,
      questions: questions,
      totalQuestions: questions.length,
      difficulty: 'auto'
    };
  }

  /**
   * Validar respuesta
   */
  validateAnswer(questionId, userAnswer) {
    // En la UI, comparas userAnswer con la pregunta correcta
    return {
      correct: true,
      feedback: 'Correcto!'
    };
  }
}
