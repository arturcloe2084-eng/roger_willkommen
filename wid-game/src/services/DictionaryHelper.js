/**
 * DictionaryHelper
 * 
 * Utilidad para importar, exportar y gestionar el diccionario
 * desde la consola del navegador durante desarrollo
 * 
 * USO EN CONSOLA:
 * 
 * // Cargar el helper
 * import { DictionaryHelper } from './DictionaryHelper.js';
 * 
 * // Importar lista de palabras
 * await DictionaryHelper.importBatch([...]);
 * 
 * // Exportar diccionario
 * DictionaryHelper.exportAsJSON();
 * 
 * // Ver estadísticas
 * DictionaryHelper.showStats();
 */

import { DictionaryManager } from './DictionaryManager.js';

export class DictionaryHelper {
  /**
   * Importar lote de palabras desde array
   */
  static async importBatch(words) {
    const dict = await DictionaryManager.getInstance();
    let added = 0;
    let skipped = 0;

    words.forEach(word => {
      if (dict.addWord(word.word, word.translation, word.category, word.example)) {
        added++;
      } else {
        skipped++;
      }
    });

    console.log(`✅ Importadas ${added} palabras. Duplicadas: ${skipped}`);
    return added;
  }

  /**
   * Importar desde lista CSV (formato: palabra,traducción,categoría,ejemplo)
   */
  static async importFromCSV(csvText) {
    const dict = await DictionaryManager.getInstance();
    const lines = csvText.trim().split('\n');
    let added = 0;

    lines.forEach((line, idx) => {
      if (!line) return;
      const [word, translation, category, example] = line.split(',').map(s => s.trim());
      
      if (word && translation) {
        if (dict.addWord(word, translation, category || 'general', example || '')) {
          added++;
        }
      }
    });

    console.log(`✅ Importadas ${added} palabras desde CSV`);
    return added;
  }

  /**
   * Exportar diccionario como JSON descargable
   */
  static async exportAsJSON(filename = 'diccionario.json') {
    const dict = await DictionaryManager.getInstance();
    const data = {
      exportDate: new Date().toISOString(),
      totalWords: dict.count(),
      customWords: dict.countCustom(),
      words: dict.getAll()
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    console.log(`✅ Diccionario exportado: ${filename}`);
  }

  /**
   * Exportar solo palabras personalizadas como JSON
   */
  static async exportCustomAsJSON(filename = 'diccionario-personalizado.json') {
    const dict = await DictionaryManager.getInstance();
    const custom = dict.getCustomWords();
    
    const json = JSON.stringify(custom, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    console.log(`✅ Diccionario personalizado exportado: ${filename}`);
  }

  /**
   * Mostrar estadísticas del diccionario
   */
  static async showStats() {
    const dict = await DictionaryManager.getInstance();
    const all = dict.getAll();
    const categories = dict.getCategories();

    console.group('📊 Estadísticas del Diccionario');
    console.log(`Total de palabras: ${dict.count()}`);
    console.log(`Palabras personalizadas: ${dict.countCustom()}`);
    console.log(`Categorías: ${categories.join(', ')}`);
    
    categories.forEach(cat => {
      const count = dict.getByCategory(cat).length;
      console.log(`  - ${cat}: ${count} palabras`);
    });
    console.groupEnd();
  }

  /**
   * Mostrar todas las palabras en tabla
   */
  static async showTable() {
    const dict = await DictionaryManager.getInstance();
    const words = dict.getAll();

    const data = words.map(w => ({
      Palabra: w.word,
      Traducción: w.translation,
      Categoría: w.category,
      Personalizada: w.isCustom ? '⭐' : ''
    }));

    console.table(data);
  }

  /**
   * Buscar palabras
   */
  static async search(term) {
    const dict = await DictionaryManager.getInstance();
    const results = dict.search(term);
    
    console.log(`🔍 Resultados para "${term}" (${results.length}):`);
    console.table(results.map(w => ({
      Palabra: w.word,
      Traducción: w.translation,
      Categoría: w.category
    })));

    return results;
  }

  /**
   * Obtener palabras por categoría
   */
  static async showCategory(category) {
    const dict = await DictionaryManager.getInstance();
    const words = dict.getByCategory(category);
    
    console.log(`📚 Palabras en "${category}" (${words.length}):`);
    console.table(words.map(w => ({
      Palabra: w.word,
      Traducción: w.translation,
      Ejemplo: w.example || '-'
    })));

    return words;
  }

  /**
   * Limpiar todas las palabras personalizadas
   */
  static async clearCustom() {
    const dict = await DictionaryManager.getInstance();
    if (confirm('⚠️  ¿Eliminar todas las palabras personalizadas? (No se puede deshacer)')) {
      dict.clearCustomWords();
      console.log('✅ Palabras personalizadas eliminadas');
    }
  }

  /**
   * Ejemplo: palabras comunes para empezar
   */
  static getStarterWords() {
    return [
      { word: 'Guten Morgen', translation: 'Buenos días', category: 'saludo', example: 'Guten Morgen, Herr Schmidt!' },
      { word: 'Guten Abend', translation: 'Buenas noches', category: 'saludo', example: 'Guten Abend, meine Damen!' },
      { word: 'Wie geht es dir?', translation: '¿Cómo estás?', category: 'saludo', example: 'Wie geht es dir heute?' },
      { word: 'Mir geht es gut', translation: 'Me va bien', category: 'saludo', example: 'Mir geht es gut, danke!' },
      { word: 'Entschuldigung', translation: 'Perdón / Disculpe', category: 'cortesía', example: 'Entschuldigung, wo ist die Bushaltestelle?' },
      { word: 'Bitte schön', translation: 'De nada / Por supuesto', category: 'cortesía', example: 'Bitte schön, gerne!' },
      { word: 'Ich verstehe nicht', translation: 'No entiendo', category: 'comunicación', example: 'Entschuldigung, ich verstehe nicht.' },
      { word: 'Können Sie mir helfen?', translation: '¿Puede ayudarme?', category: 'ayuda', example: 'Können Sie mir helfen, bitte?' },
      { word: 'Wo ist die Toilette?', translation: '¿Dónde está el baño?', category: 'lugares', example: 'Wo ist die Toilette, bitte?' },
      { word: 'Ich bin neu hier', translation: 'Soy nuevo aquí', category: 'presentación', example: 'Hallo, ich bin neu hier.' }
    ];
  }

  /**
   * Cargar palabras de inicio
   */
  static async loadStarterWords() {
    const words = this.getStarterWords();
    return this.importBatch(words);
  }

  /**
   * Mostrar ayuda
   */
  static showHelp() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║          🎓 DICCIONARIO HELPER - COMANDOS                  ║
╚════════════════════════════════════════════════════════════╝

📚 GESTIÓN:
  showStats()                - Ver estadísticas
  showTable()                - Tabla de todas las palabras
  search('term')             - Buscar palabras
  showCategory('category')   - Mostrar palabras de una categoría

📥 IMPORTAR:
  importBatch([...])         - Importar array de palabras
  importFromCSV('csv')       - Importar desde CSV
  loadStarterWords()         - Cargar 10 palabras de inicio

📤 EXPORTAR:
  exportAsJSON()             - Descargar diccionario completo
  exportCustomAsJSON()       - Descargar solo personalizadas

⚙️  ADMINISTRACIÓN:
  clearCustom()              - Eliminar palabras personalizadas

💡 EJEMPLO CSV:
  Danke,Gracias,saludo,Danke schön!
  Wasser,Agua,sustantivo,Ein Glas Wasser, bitte.

💡 EJEMPLO BATCH:
  [{word: 'Hallo', translation: 'Hola', category: 'saludo', example: '...'}]
    `);
  }
}

// Hacer disponible globalmente en consola (desarrollo)
if (typeof window !== 'undefined') {
  window.DictionaryHelper = DictionaryHelper;
}
