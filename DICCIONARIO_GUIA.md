# 📚 Guía de Uso del Diccionario

## Inicio Rápido

### 1. **Dentro del Juego**

1. Presiona **D** en el menú principal
2. Se abrirá la interfaz del diccionario
3. Navega con las flechas o usa búsqueda para encontrar palabras
4. Agrega nuevas palabras usando el formulario
5. Presiona **ESC** para salir

### 2. **Desde la Herramienta Web**

1. Abre `/wid-game/public/diccionario-gestor.html` en el navegador
2. Usa la interfaz para:
   - Ver todas las palabras
   - Importar listas CSV
   - Exportar datos
   - Administrar el almacenamiento

---

## Importar Palabras

### Opción A: CSV en la Herramienta Web

Formato por línea:
```
Palabra,Traducción,Categoría,Ejemplo
```

Ejemplo:
```
Hallo,Hola,saludo,Hallo, ich bin neu.
Danke,Gracias,cortesía,Danke schön!
Wasser,Agua,sustantivos,Ein Glas Wasser, bitte.
```

### Opción B: JSON en la Herramienta Web

Estructura:
```json
[
  {
    "word": "Hallo",
    "translation": "Hola",
    "category": "saludo",
    "example": "Hallo, ich bin neu."
  }
]
```

### Opción C: Consola del Navegador

```javascript
// 1. Abre la consola (F12)
// 2. Ve a pestaña "Console"
// 3. Pega este código:

import { DictionaryHelper } from './src/services/DictionaryHelper.js';

// Importar palabras de inicio
await DictionaryHelper.loadStarterWords();

// O importar tu lista
await DictionaryHelper.importBatch([
  { word: 'Danke', translation: 'Gracias', category: 'saludo', example: 'Danke schön!' },
  { word: 'Ja', translation: 'Sí', category: 'básico', example: 'Ja, das stimmt.' }
]);
```

---

## Datos Persistentes

### Dónde se guardan

- **Palabras base**: `/wid-game/public/data/vocabulary.json` (no se modifica)
- **Palabras personalizadas**: `localStorage['customDictionaryWords']`

### Ver datos en la consola

```javascript
// Ver todas las personalizadas
console.log(JSON.parse(localStorage.getItem('customDictionaryWords')));

// Ver solo una categoría
const dict = await DictionaryManager.getInstance();
console.log(dict.getByCategory('saludo'));
```

### Hacer backup

```javascript
// Descargar JSON del diccionario
const custom = JSON.parse(localStorage.getItem('customDictionaryWords'));
const json = JSON.stringify(custom, null, 2);
const blob = new Blob([json], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'diccionario-backup.json';
a.click();
```

---

## Flujo de Trabajo Recomendado

1. **Semana 1**: Carga palabras de saludo y comunicación básica
2. **Semana 2**: Agrega vocabulario de lugares y direcciones
3. **Semana 3**: Incorpora palabras de diálogos de hitos específicos
4. **Semana 4**: Refuerzo de palabras problemáticas

---

## Categorías Sugeridas

- `saludo` - Saludos formales e informales
- `cortesía` - Por favor, gracias, disculpe
- `comunicación` - No entiendo, ¿puede repetir?
- `lugares` - Baño, café, estación
- `trámites` - Formularios, registros, documentos
- `sustantivos` - Objetos, personas, conceptos
- `verbos` - Acciones
- `adjetivos` - Descripción
- `números` - Contar
- `tiempo` - Días, horas, momentos

---

## Preguntas Frecuentes

### P: ¿Se borra el diccionario si limpio el caché?
**R:** Sí, los datos están en localStorage. Haz backup regularmente.

### P: ¿Puedo compartir mi diccionario con otros?
**R:** Sí, exporta como JSON y comparte. Otros pueden importarlo.

### P: ¿Cuántas palabras puedo agregar?
**R:** localStorage típicamente permite ~5-10MB. Aproximadamente 50,000+ palabras.

### P: ¿Cómo vinculo palabras a diálogos?
**R:** Las palabras que agregues aparecerán automáticamente en diálogos futuros que usen esas categorías.

---

## Próximas Integraciones

- [ ] Sistema de etapas (Día 1, Día 2, etc.)
- [ ] Vinculación automática con diálogos
- [ ] Marcado de palabras por hito del juego
- [ ] Sistema de revisión con el diccionario
- [ ] Exportar como guión de teatro para cada hito

---

**Ahora el diccionario está listo para ser poblado con la base de palabras que necesitas aprender.** 🎓📚
