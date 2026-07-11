# PROMPT PARA LLM — Reconstruir GUI de roger_willkommen

Copia TODO el contenido de este bloque y pégalo como prompt inicial a un LLM
con acceso al repositorio clonado de roger_willkommen.

---

Eres un desarrollador senior con acceso al código fuente completo del juego
roger_willkommen. Tu misión es reconstruir la GUI para que coincida con el
nuevo flujo del producto. Tienes mano libre para diseñar menús, pantallas,
colores, transiciones y maquetación. La única restricción es que el flujo
de usuario y los datos mostrados deben seguir esta especificación.

---

### PASO 0 — Clonar y entender el código base

```bash
git clone https://github.com/arturcloe2084-eng/roger_willkommen.git
cd roger_willkommen/wid-game
npm install
npm run dev          # abre http://localhost:5173
```

Explora el juego corriendo para entender qué hace cada pantalla.
Luego lee estos archivos en orden para entender la arquitectura:

1. `src/main.js`                         (entry point, 4 líneas)
2. `src/config/gameConfig.js`            (registro de escenas)
3. `src/config/sceneKeys.js`             (constantes de nombres)
4. `src/scenes/core/BootScene.js`        (carga assets → MainMenuScene)
5. `src/scenes/core/MainMenuScene.js`    (menú actual, 1384 líneas)
6. `src/scenes/core/SceneEngineScene.js` (motor genérico de escenas)
7. `src/scenes/core/GameHudScene.js`     (HUD: nivel, XP, palabras, día)
8. `public/data/scenes.json`             (definiciones de escenas)
9. `src/services/player/PlayerProgressStore.js`  (estado del jugador)
10. `src/services/ai/NpcDialogueService.js`      (diálogo con NPCs)
11. `src/services/i18n.js`               (traducciones)

### PASO 1 — Documentos de dirección (LEER PRIMERO)

En la raíz del proyecto hay estos .md que definen QUÉ construir:

- `PRODUCT_BRIEF.md`         → dirección de producto, el flujo nuevo
- `DESAFIO_ANMELDUNG_2026.md` → especificación del primer desafío como examen
- `AGENTS.md`                → reglas de trabajo
- `INFORME_PROGRESO_01.md`   → estado actual verificado

El antiguo `PROJECT_GENESIS.md` es histórico. No lo uses como fuente.

---

### LO QUE YA NO VA (flujo viejo que debes REEMPLAZAR)

El flujo actual es:
```
MainMenuScene → SceneEngineScene("apartamento") → escalera → calle → amt → oficina
```

Ese flujo de apartamento/vecinos/calle QUEDA ELIMINADO del menú inicial.
**NO borres los archivos.** Solo desconéctalos del flujo principal.
Las escenas antiguas pueden quedar accesibles desde un botón secundario
tipo "Contenido histórico" o "Misiones archivadas", pero NUNCA como ruta
principal.

---

### LO QUE SÍ VA (flujo nuevo)

El jugador inicia directamente en el menú de contrato Anmeldung 2026.
El recorrido es lineal y guiado:

#### 1. NUEVO MENÚ INICIAL
- Muestra el CONTRATO activo: "Anmeldung 2026 — Bürgeramt Berlin"
- Muestra la funda activa con su perfil resumido
- Opciones visibles:
  ```
  [▶ EMPEZAR DESAFÍO]  [📋 PREPARARME]  [👤 MI FUNDA]  [⚙️]
  ```

#### 2. PANTALLA "MI FUNDA"
- Perfil editable con campos de DESAFIO_ANMELDUNG_2026.md sección 1
- Idiomas con niveles (declarado vs comprobado)
- Datos para el formulario (dirección, fecha nacimiento, etc.)
- Documentos disponibles (pasaporte, contrato alquiler)
- Selector: usar perfil ficticio (seguro) o perfil personal

#### 3. PANTALLA "PREPARARME"
- Vocabulario clave del Bürgeramt (del DESAFIO_ANMELDUNG_2026.md)
- Quiz rápido del formulario de Anmeldung
- Diálogo de práctica con Marcus (Krankenkasse, NPC amable)
- Crucigrama de vocabulario burocrático
- Reutiliza: DictionaryScene, QuizScene, CrosswordScene, DialogScene

#### 4. PANTALLA DEL DESAFÍO
- Escena del Bürgeramt (usa la definición "amt" de scenes.json,
  que YA TIENE a Frau Meier, Marcus, formulario, crucigrama, radio)
- NO uses la puerta "volver_escalera" (target: escalera) — esa ruta
  vieja debe ser reemplazada o deshabilitada en el modo desafío
- Frau Meier evalúa según los criterios de DESAFIO_ANMELDUNG_2026.md
- El jugador PUEDE pedir ayuda a CLIENTES de la sala (NPCs pasivos)
- Cada consulta a un cliente distinto penaliza la puntuación de
  autonomía (fórmula en DESAFIO_ANMELDUNG_2026.md sección 5)

#### 5. PANTALLA DE RESULTADOS
- Muestra el veredicto (aprobado / aprobado con ayuda / no aprobado)
- Desglose de 8 criterios con puntuaciones y colores
- Errores encontrados con evidencias del diálogo
- Ejercicios recomendados
- Progreso otorgado a la funda

---

### ARQUITECTURA TÉCNICA — Lo que NO debes romper

El juego usa Phaser 3 con escenas. La arquitectura actual es sólida:

- `gameConfig.js` → array `scene` registra TODAS las escenas. Si creas una
  escena nueva, REGÍSTRALA aquí.
- `sceneKeys.js` → constantes. Añade las nuevas aquí.
- `BootScene.js` → termina con `this.scene.start(SCENE_KEYS.MAIN_MENU)`.
  Si cambias el nombre de la escena inicial, actualiza esta línea.
- `SceneEngineScene.js` → motor genérico. Lee scenes.json dinámicamente.
  ÚSALO para la escena del Bürgeramt (sceneId='amt'). NO lo reescribas
  entero: solo necesitas que el desafío lo llame con el sceneId correcto
  y que oculte/reemplace hotspots problemáticos (como la puerta a escalera).
- `GameHudScene.js` → HUD que muestra nivel, XP, palabras, día. Reutilízalo
  pero actualiza los textos para que hablen de "contrato" en vez de "día"
  cuando esté activo el modo desafío.
- `PlayerProgressStore.js` → singleton con todo el estado. NO lo rompas.
  La migración a multi-funda es para otra fase. Por ahora, sigue usando
  playerProgressStore.level, .xp, .learnedWords, .story, etc.
- `NpcDialogueService.js` → askNPC() llama al proxy LLM. Si el proxy no
  responde, usa fallback local. NO lo rompas. El evaluador de diálogo
  nuevo debe ser una capa POR ENCIMA de esto, que procesa la respuesta.

---

### CREA estas escenas/archivos nuevos

#### `src/scenes/core/ContractMenuScene.js`
- Reemplaza a MainMenuScene como escena inicial
- Muestra el contrato activo + perfil de funda + botones principales
- Al hacer clic en [EMPEZAR DESAFÍO] → transición a la escena amt
- Al hacer clic en [PREPARARME] → PreparationScene
- Al hacer clic en [MI FUNDA] → ProfileScene
- Tienes mano libre total en diseño visual, animaciones, colores

#### `src/scenes/core/ProfileScene.js`
- Formulario editable con los campos del perfil
- Basado en DESAFIO_ANMELDUNG_2026.md sección 1

#### `src/scenes/core/PreparationScene.js`
- Menú de preparación que enlaza a:
  - DictionaryScene (vocabulario)
  - QuizScene (quiz del formulario)
  - DialogScene (práctica con Marcus)
  - CrosswordScene (crucigrama burocrático)
- Puede ser un menú simple con 4 botones grandes

#### `src/scenes/core/ResultsScene.js`
- Recibe los datos del evaluador y los muestra visualmente
- Botón para volver al menú de contrato
- Si aprobó → celebración + créditos ganados
- Si no aprobó → ánimo + ejercicios recomendados

#### `src/services/ai/DialogueEvaluator.js`
- Función PURA (sin Phaser, sin DOM) que recibe:
  - historial del diálogo (array de mensajes)
  - perfil de la funda
  - campos del formulario rellenados
  - número de consultas a clientes
- Devuelve el objeto JSON con veredicto + 8 puntuaciones + evidencias
- Formato de salida: DESAFIO_ANMELDUNG_2026.md sección 6
- Debe funcionar con las 3 fixtures de prueba
- NO depende de LLM: es lógica de evaluación, no generación

---

### MODIFICA estos archivos existentes (mínimo necesario)

#### `src/config/sceneKeys.js`
Añade: CONTRACT_MENU, PROFILE, PREPARATION, RESULTS

#### `src/config/gameConfig.js`
- Añade las nuevas escenas al array `scene`
- NO borres escenas antiguas del array (seguirán compilando)

#### `src/scenes/core/BootScene.js`
- Cambia SCENE_KEYS.MAIN_MENU por SCENE_KEYS.CONTRACT_MENU
  (o mantén SCENE_KEYS.MAIN_MENU si decides reescribir MainMenuScene
   en vez de crear ContractMenuScene)

#### `src/scenes/core/MainMenuScene.js`
- Opción A: reescríbelo completamente como el nuevo menú de contrato
- Opción B: déjalo como está y crea ContractMenuScene aparte
- Si eliges B, MainMenuScene puede quedar accesible desde un botón
  secundario "Menú clásico" o "Contenido histórico"

#### `src/scenes/core/SceneEngineScene.js`
- Cuando el sceneId es 'amt' y estamos en modo desafío:
  - Oculta el hotspot 'volver_escalera' (target: escalera)
  - Añade hotspots para CLIENTES de la sala (3-4 NPCs pasivos
    que el jugador puede consultar)
  - Cada cliente clickeado incrementa contador de consultas
- NO toques la lógica de otros sceneId

#### `src/scenes/core/GameHudScene.js`
- Añade indicador de CONSULTAS A CLIENTES (ej. "Ayudas: 0/4")
- Cambia "Día X/30" por "Contrato: día X/30" en modo desafío

---

### REGLAS ESTRICTAS

- Toda la UI debe estar en español (idioma del jugador Vaclav).
  El alemán SOLO aparece en el contenido educativo (diálogos, formulario).
- NO borres archivos. Desconecta rutas, no elimines código.
- NO toques wid-proxy/ (está vacío, se reconstruye en otra fase).
- NO envíes datos del perfil al LLM sin que el jugador lo acepte
  explícitamente. Usa perfiles simulados por defecto.
- Cada escena nueva debe compilar con `npm run build` sin errores.
- El bundle de Vite no debe crecer desproporcionadamente.
- Si necesitas añadir dependencias npm, justifícalo.
- Documenta en comentarios de código qué hace cada escena nueva y por qué.

---

### VERIFICACIÓN

Al terminar, confirma que:
1. `npm run build` termina sin errores
2. Al abrir el juego se ve el nuevo menú de contrato
3. El flujo [MI FUNDA] → [PREPARARME] → [EMPEZAR DESAFÍO] → [RESULTADOS]
   es navegable de principio a fin
4. Frau Meier y los clientes están presentes en la escena del Bürgeramt
5. El HUD muestra consultas a clientes y estado del contrato
6. Las escenas antiguas (apartamento, escalera, calle) no son accesibles
   desde el flujo principal

---

### NOTA SOBRE EL PROXY LLM

El frontend espera un proxy en http://localhost:8080 con estos endpoints:
- POST /npc  → NpcDialogueService.js
- POST /narrate → NarradorService.js

El proxy NO EXISTE hoy (carpeta wid-proxy/ vacía).
NO intentes arreglarlo en esta fase. El fallback local de
NpcDialogueService.js (palabras clave) funciona para desarrollo.
Solo asegúrate de que la GUI no se bloquee si el proxy no responde.
