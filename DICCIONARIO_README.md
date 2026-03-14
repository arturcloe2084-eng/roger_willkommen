# 📖 Sistema de Diccionario Persistente

## Overview

Se ha reconstruido el sistema de **Diccionario Persistente** del juego "Willkommen in Deutschland". Este diccionario permite:

✅ **Ver todas las palabras** (base + personalizadas)  
✅ **Agregar palabras nuevas manualmente**  
✅ **Buscar por término** (palabra o traducción)  
✅ **Filtrar por categoría**  
✅ **Persistencia en localStorage** (no se borra al reiniciar)  
✅ **Acceso desde el menú principal** (Tecla D o botón)  

---

## Estructura de Archivos Creados

```
src/
├── services/
│   └── DictionaryManager.js      ← Gestor centralizado del diccionario
└── scenes/core/
    └── DictionaryScene.js         ← Interfaz visual del diccionario
```

---

## Funcionalidades

### 1. **DictionaryManager** (`src/services/DictionaryManager.js`)

Gestor centralizado que:
- Carga palabras base de `vocabulary.json`
- Permite agregar palabras personalizadas
- Persiste datos en `localStorage`
- Proporciona búsqueda, filtrado y consultas

#### Métodos principales:

```javascript
// Obtener instancia del diccionario
const dict = await DictionaryManager.getInstance();

// Obtener todas las palabras
dict.getAll()

// Agregar nueva palabra (retorna boolean)
dict.addWord('Hallo', 'Hola', 'saludo', 'Hallo, ich bin neu.');

// Buscar palabras
dict.search('Hallo');

// Filtrar por categoría
dict.getByCategory('saludo');

// Obtener categorías disponibles
dict.getCategories();

// Contar palabras
dict.count();           // Total
dict.countCustom();     // Solo personalizadas

// Eliminar palabra personalizada
dict.removeCustomWord(index);

// Actualizar palabra personalizada
dict.updateCustomWord(index, word, translation, category, example);

// Importar lista de palabras
dict.importWords([{word: 'Danke', translation: 'Gracias', ...}]);

// Exportar diccionario personalizado
dict.exportCustom();

// Limpiar todas las personalizadas
dict.clearCustomWords();
```

---

### 2. **DictionaryScene** (`src/scenes/core/DictionaryScene.js`)

Interfaz visual del diccionario con:

- **Búsqueda en tiempo real**: Filtra palabras mientras escribes
- **Filtro de categorías**: Selecciona "TODAS" o una categoría específica
- **Paginación**: Navega entre páginas de palabras (8 por página)
- **Formulario de agregar**: Introduce palabra, traducción, categoría y ejemplo
- **Estadísticas**: Muestra total, personalizadas y mostradas
- **Navegación**: ESC para volver, D desde menú para abrir

---

## Uso en el Menú Principal

### Acceso al Diccionario:

1. **Tecla D**: Presiona `D` en el menú principal
2. **Botón**: Click en `[ D ] 📖 VER DICCIONARIO`

### Salir del Diccionario:

1. **Tecla ESC**: Presiona `ESC`
2. **Botón**: Click en `[ ESC ] VOLVER`

---

## Datos Persistentes

### Ubicación de almacenamiento:

- **Base de palabras**: `/public/data/vocabulary.json` (no se modifica)
- **Palabras personalizadas**: `localStorage['customDictionaryWords']` (JSON)

### Recuperar palabras personalizadas:

```javascript
const custom = JSON.parse(localStorage.getItem('customDictionaryWords'));
console.log(custom);
```

### Limpiar datos personalizados:

```javascript
localStorage.removeItem('customDictionaryWords');
```

---

## Integración con Otras Escenas

### Acceder al diccionario desde cualquier escena:

```javascript
import { DictionaryManager } from '../../services/DictionaryManager.js';

// En una escena
async create() {
    const dict = await DictionaryManager.getInstance();
    const palabras = dict.getAll();
    const porCategoria = dict.getByCategory('saludo');
}
```

---

## Estructura de una Palabra

Cada palabra tiene esta estructura:

```json
{
  "word": "Hallo",
  "translation": "Hola",
  "category": "saludo",
  "example": "Hallo, ich bin neu hier.",
  "isCustom": false,  // true si es personalizada
  "addedAt": 1234567890000  // timestamp (solo custom)
}
```

---

## Próximos Pasos (Sugerencias)

1. **Importar palabras desde imagen/CSV**: 
   - Agregar OCR o parser CSV
   - Función en el formulario

2. **Categorías personalizadas**:
   - Crear nuevas categorías mientras se agregan palabras
   - Gestionar categorías

3. **Exportar diccionario**:
   - Descargar como JSON o CSV
   - Hacer backup

4. **Sincronización con diálogos**:
   - Las palabras del diccionario usan automáticamente en conversaciones
   - Los nuevos diálogos pueden usar la estructura de guiones (teatro)

5. **Sistema de etapas/hitos**:
   - Marcar palabras por día/hito del juego
   - Progreso narrativo vinculado a vocabulario

---

## Prueba Rápida

1. Abre el juego en el navegador
2. Presiona `D` o click en el botón de diccionario
3. Agrega una palabra: `Danke | Gracias | saludo | Danke schön!`
4. Cierra el diccionario (ESC)
5. Abre nuevamente el diccionario (D)
6. **Verifica que tu palabra persiste** ✅

---

## Notas Técnicas

- **LocalStorage**: Límite típico ~5-10MB por dominio
- **Singleton Pattern**: `DictionaryManager.getInstance()` devuelve siempre la misma instancia
- **Persistencia automática**: Cada agregar/eliminar guarda automáticamente
- **Compatible con VocabularyManager**: Usa `vocabulary.json` como base

---

Ahora el diccionario está **listo para ser llenado** con la base de palabras del aprendizaje y las conversaciones con guiones de teatro para cada hito. 🎭📚
