# 📖 ROGER EXAMPLE SCENE - Guía para crear escenas con LLM

## Descripción General

La **RogerExampleScene** es una escena narrativa interactiva que sirve como plantilla y ejemplo para que el LLM genere automáticamente nuevas escenas educativas. Está diseñada para enseñar al jugador los componentes clave de una escena narrativa mientras practica alemán.

## Componentes Principales

### 1. **NarratorService** (`src/services/audio/NarratorService.js`)

Servicio que gestiona la narración en alemán con subtítulos sincronizados.

**Funcionalidades:**
- Reproduce audio TTS en alemán de Alemania (de-DE)
- Sincroniza subtítulos en múltiples idiomas
- Genera narración dinámica mediante IA (Gemini)

**Uso:**
```javascript
import { narratorService } from '../../services/audio/NarratorService.js';

const narration = {
    text: 'Willkommen in Berlin. Der Protagonist steht vor der Wohnung.',
    duration: 6000,
    translations: {
        es: 'Bienvenido a Berlín. El protagonista está frente al apartamento.',
        en: 'Welcome to Berlin. The protagonist stands before the apartment.'
    }
};

narratorService.narrateInGerman(narration, 
    (subtitle, lang) => {
        // Callback para actualizar subtítulos
        console.log(`[${lang}] ${subtitle}`);
    },
    () => {
        // Callback cuando termina la narración
        console.log('Narration complete!');
    }
);
```

### 2. **KaraokeModeService** (`src/services/audio/KaraokeModeService.js`)

Servicio que permite al jugador practicar hablando las líneas del protagonista.

**Funcionalidades:**
- Reconocimiento de voz en alemán
- Evaluación de similitud entre lo que dice el jugador y la línea esperada
- Feedback en tiempo real
- Contador de intentos

**Uso:**
```javascript
import { karaokeModeService } from '../../services/audio/KaraokeModeService.js';

const line = {
    text: 'Es tut mir leid, können Sie mir helfen?',
    character: 'Roger (Protagonist)',
    duration: 5000
};

karaokeModeService.startLine(
    line,
    (result) => {
        console.log(`Similarity: ${(result.similarity * 100).toFixed(0)}%`);
        if (result.similarity > 0.6) {
            console.log('✓ Great!');
        } else {
            console.log('Try again...');
        }
    },
    (success) => {
        console.log(`Line complete: ${success}`);
    }
);
```

### 3. **Mejoras a DialogScene** (`src/scenes/features/DialogScene.js`)

La escena de diálogos ahora incluye:
- **Representación visual del personaje** (cabeza y cuerpo simple)
- **Subtítulos sincronizados en tiempo real** con la narración
- **Mejor interacción con NPCs** mediante narración

**Característica nueva: Subtítulos en vivo**
```javascript
this.subtitleBox = this.add.rectangle(...);
this.subtitleText = this.add.text(...);

narratorService.narrateInGerman(narration, (subtitle, lang) => {
    this.subtitleText.setText(subtitle);
    // Cambiar color según idioma
    const colors = { de: '#ffffff', es: '#ffcc00', en: '#00ffff' };
    this.subtitleText.setFill(colors[lang] || '#ffffff');
}, () => {
    // Ocultar subtítulos cuando termina
    this.tweens.add({ targets: [this.subtitleBox, this.subtitleText], alpha: 0 });
});
```

## Estructura de la RogerExampleScene

La escena se divide en **5 actos**:

### **Act 1: Introducción Narrativa**
- Narrador introduce el escenario en alemán
- Subtítulos en 3 idiomas (alemán, español, inglés)
- Duración: ~8 segundos
- XP: +0

### **Act 2: Karaoke del Protagonista**
- El jugador practica la línea: *"Es tut mir leid, können Sie mir helfen?"*
- Modo karaoke con reconocimiento de voz
- Se evalúa similitud y pronunciación
- Duración: 5 segundos por intento
- XP: +25 si tiene éxito (>60% similitud)

### **Act 3: Diálogo con NPC**
- Aparece Hans (portero)
- NPC responde dinámicamente vía IA
- Se ofrecen opciones de diálogo al jugador
- Duración: ~6 segundos
- XP: +15 por opción elegida

### **Act 4: Karaoke Final**
- El jugador practica: *"Danke schön für Ihre Hilfe!"*
- Similar a Act 2
- Duración: 5 segundos
- XP: +30 si tiene éxito

### **Act 5: Conclusión**
- Narrador cierra la historia
- Pantalla final con XP total
- Opción para volver al menú

## JSON Schema para nuevas escenas (generadas por LLM)

Cuando el LLM genere nuevas escenas, debe seguir este schema en `scenes.json`:

```json
{
    "id": "scene_id_unico",
    "name": "Nombre de la escena",
    "chapter": "Capítulo narrativo",
    "objective": "Objetivo de aprendizaje",
    "background": "assets/scene-nombre.png",
    "ambientText": "Descripción ambiental",
    "isRogerExample": false,
    "sceneType": "narrative_interactive",
    "narrationLanguage": "de",
    "hotspots": [...],
    "metadata": {
        "description": "Descripción detallada",
        "template": "true",
        "acts": [
            {
                "number": 1,
                "title": "Título del acto",
                "duration": 8000,
                "type": "narration|karaoke|dialogue",
                "content": "Texto narrativo o línea de karaoke",
                "npc": { ... },
                "dialogueOptions": [ ... ]
            }
        ]
    }
}
```

## Cómo acceder a la escena Roger desde el menú

La escena está configurada como hotspot especial. Desde `MainMenuScene` o `SceneEngineScene`, se puede lanzar así:

```javascript
this.scene.start(SCENE_KEYS.ROGER_EXAMPLE);
```

O desde el menú:
```javascript
this.scene.start(SCENE_KEYS.ROGER_EXAMPLE);
```

## Flujo de generación de escenas por LLM (Implementación futura)

1. **LLM recibe contexto**: Tema, nivel, objetivo
2. **LLM genera JSON**: Estructura completa de actos
3. **LLM genera audio**: Narración en alemán (vía API TTS)
4. **LLM genera NPCs**: Personalidades y diálogos
5. **Juego renderiza**: Escena dinámicamente

Ejemplo de prompt para LLM:
```
Genera una escena educativa en JSON siguiendo el schema roger_example.
Tema: Visita a la farmacia
Nivel: A2
Objetivo: Aprender vocabulario de síntomas y medicinas
Idioma: Alemán (A2)
Incluye 5 actos con narración, karaoke y diálogo con NPC.
```

## Sistemas de subtítulos

Las escenas Roger soportan **subtítulos multiidioma en tiempo real**:

- **Alemán (de)**: Texto original narrado
- **Español (es)**: Traducción educativa
- **Inglés (en)**: Referencia rápida

Los subtítulos cambian cada 2 segundos, permitiendo al jugador seguir la narración en su idioma preferido.

## Sistema de karaoke

El modo karaoke evalúa:

1. **Reconocimiento de voz**: Captura lo que dice el jugador
2. **Similitud léxica**: Compara palabras usando distancia Levenshtein
3. **Puntuación de confianza**: Seguridad del reconocimiento (0-100%)
4. **Feedback inmediato**: ✓ Bien o ✗ Intenta de nuevo

Ejemplo de evaluación:
```
Esperado: "Es tut mir leid, können Sie mir helfen?"
Jugador:  "Es tut mir leid können Sie mir helfen"
Similitud: 95% ✓ EXCELENTE
```

## Integración con PlayerProgressStore

Cada acción en una escena Roger registra progreso:

```javascript
playerProgressStore.recordResult('correct');  // Evaluación
playerProgressStore.addXP(25);               // XP
playerProgressStore.addLearnedWord({         // Vocabulario
    word: 'Wohnung',
    context: 'roger_example',
    frequency: 1
});
```

## Archivos modificados/creados

1. ✅ `/src/services/audio/NarratorService.js` - Nuevo servicio de narración
2. ✅ `/src/services/audio/KaraokeModeService.js` - Nuevo servicio de karaoke
3. ✅ `/src/scenes/features/RogerExampleScene.js` - Nueva escena de ejemplo
4. ✅ `/src/scenes/features/DialogScene.js` - Mejorado con narración y subtítulos
5. ✅ `/src/config/gameConfig.js` - Registrada la nueva escena
6. ✅ `/src/config/sceneKeys.js` - Añadida constante ROGER_EXAMPLE
7. ✅ `/public/data/scenes.json` - Añadida definición de roger_example

## Próximos pasos para LLM

Para que el LLM genere escenas automáticamente:

1. **Crear endpoint `/generate-scene`** en wid-proxy
   - Recibe: tema, nivel, idioma
   - Devuelve: JSON de escena + URLs de audio TTS

2. **Crear `SceneGeneratorService`**
   - Valida JSON generado
   - Carga dinámicamente en scenes.json
   - Genera assets (backgrounds, audio)

3. **Mejorar `NarratorService`**
   - Guardar audio generado en caché
   - Sincronizar mejor con subtítulos
   - Soportar diferentes voces de personajes

4. **Panel de creación de escenas**
   - UI en el menú para que usuarios generen escenas
   - Preview antes de guardar
   - Librería de escenas compartidas

---

**Versión:** 1.0  
**Última actualización:** 21 de marzo de 2026  
**Status:** Prototipo funcional
