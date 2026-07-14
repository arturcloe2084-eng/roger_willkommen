# PROMPT PARA LLM — Recomendaciones de diseño para la creación de historias en krk9

> **Uso:** Este prompt está pensado para dárselo a un LLM (por ejemplo, al trabajar
> en krk9, o a un asistente de arquitectura) **como recomendación, no como orden de
> construcción**. El objetivo es que el LLM *considere* estas ideas al momento de
> añadir a krk9 la lógica de creación de historias que el cliente propondrá después
> de adquirir la skill de **entrenador-creador**, y también para las escenas que krk9
> traerá por defecto en el menú de escenas disponibles.

---

## CONTEXTO QUE DEBES TENER PRESENTE

krk9 es un proyecto de código abierto, autónomo y genérico, pensado para reclutar
colaboradores. Uno de sus posibles módulos es un "Entrenador de Fundas" (estilo
*Altered Carbon*: mentes en cuerpos alquilados) que enseña idiomas mediante desafíos
burocráticos reales (el primero: el Anmeldung 2026 en un Bürgeramt alemán).

En esa línea, el cliente (el jugador-entrenador) podrá, tras adquirir la skill
**entrenador-creador**, **proponer sus propias historias** en lenguaje natural. krk9
debe convertirlas en escenas jugables y evaluables. Además, krk9 ya trae un catálogo
de **escenas por defecto** en su menú de escenas disponibles.

Lo que sigue son **ideas recomendadas** para esa lógica de creación de historias.
No son requisitos estrictos: considéralas como buenas prácticas y arquitectura sugerida.

---

## IDEA 1 — Un Creador Universal de Escenas (CUE), no plantillas por tema

**Recomendación:** en vez de tener una plantilla distinta para "médico", "oficina",
"tienda", etc., sugiero un **schema JSON universal** al que cualquier historia se
reduce. Un LLM planificador descompone la premisa del cliente en ese schema.

**Por qué conviene:** cambias la premisa, no el motor. Una historia de devolver un
paquete DHL y una de entrevista de trabajo usan exactamente la misma lógica de
descomposición (entorno + quién atiende + qué lograr + cómo se gana/pierde).

**Esquema sugerido (resumen):**
- `meta`: título, idioma principal, nivel mínimo, licencia requerida para crear.
- `entorno`: tipo de sala, ambiente (frase para generar imagen/vídeo), objetos.
- `nodos_dialogo`: cada personaje con rol (`empleado_principal`, `secundario_ayudante`,
  `secundario_distractor`, `otro`), personalidad, idioma, ramas de diálogo.
- `formulario`: campos del trámite, qué se rellena del perfil de la funda, validaciones.
- `evaluacion`: los 8 criterios (cumplimiento, exactitud, comprensión, expresión,
  idioma, autonomía, recuperación, seguridad) + puertas mínimas.
- `assets`: estilo visual, segundos de vídeo intro, si hay imagen por nodo.

---

## IDEA 2 — El LLM planificador NUNCA decide el veredicto

**Recomendación:** el planificador solo **estructura** la historia (personajes,
formulario, criterios). Las puntuaciones, el veredicto y las recompensas las calcula
**código determinista**, no el LLM.

**Por qué conviene:** si el LLM decidiera el final, podría inventar reglas o regalar
victorias. Separar "estructura" (LLM) de "árbitro" (código fijo) mantiene el juego
justo y comprobable. Es la misma frontera que ya funciona hoy en el evaluador de
diálogo: el LLM da los 8 puntajes a partir de la transcripción; el veredicto lo
decide una función pura.

---

## IDEA 3 — Validador determinista en bucle cerrado

**Recomendación:** antes de compilar la escena, un validador sin LLM fuerza reglas
duras (debe haber ≥1 `empleado_principal`; los que `puede_ayudar` solo pueden ser
`secundario_ayudante`; los criterios deben ser válidos; las puertas en rango 0–100).
Si el JSON del planificador falla, se le devuelve el error para corregir (hasta 3
intentos).

**Por qué conviene:** el juego nunca se rompe por un JSON roto, y el LLM no necesita
acertar a la primera.

---

## IDEA 4 — Arquitectura "language-room" para los diálogos

**Recomendación:** en vez de un solo NPC caja-negra, sugiero una **sala con varios
agentes de lenguaje**: un orquestador que enruta y recuerda, un NPC principal que
evalúa, y NPCs secundarios (ayudantes o distractores). El jugador interactúa con la
sala completa.

**Por qué conviene:** permite que "pedir ayuda a un cliente de la sala" sea distinto
a que el sistema te dé la respuesta (el cliente puede equivocarse). Eso alimenta
naturalmente el criterio de **autonomía** (cada ayuda baja la autonomía), que ya está
en el diseño. La sala solo produce `dialogueHistory` + `consultas_clientes`, que el
evaluador determinista ya consume.

---

## IDEA 5 — Gimnasio neural obligatorio antes del desafío

**Recomendación:** antes de enfrentar el desafío, el jugador pase por un **gimnasio
mental** donde carga la mente de la funda estudiando palabras clave y frases.

**Estaciones sugeridas:**
1. **Banco de Memoria** — flashcards neurales; al acertar, la palabra se fija en la
   funda (`learnedWords`).
2. **Forja de Frases** — sparring con un bot de entrenamiento privado, sin veredicto,
   para ensayar frases clave.
3. **Drill de Reflejos** — reconocimiento cronometrado; mide velocidad de comprensión.
4. **Simulacro** — réplica del desafío a presión cero (mismo language-room, sin castigo).

Todo alimenta una **barra de Carga Neural**. El desafío exige un mínimo para abrirse.
Lo entrenado (palabras, frases, reflejo, simulacro) alimenta los criterios del
evaluador real: no se olvida al salir.

**Por qué conviene:** resuelve el problema de "¿de dónde viene la presión/tiempo?" —
la ventana de preparación es la propia carga. Y hace que la mitad del veredicto se
gane antes de jugar, no al azar.

---

## IDEA 6 — Generación de imágenes y vídeos con LLMs de última generación

**Recomendación:** aprovechar modelos de difusión de imagen y de vídeo para
visualizar cada escena: fondos, retratos de NPC, intro corta (ej. 6s de la funda
entrado al Bürgeramt), y clips por nodo. Con **fallback** a gráficos vectoriales si
el asset falla, para que el juego nunca se rompa.

**Extras sugeridos:**
- Vídeo **reactivo al veredicto** (apruebas → el empleado sonríe; fallas → cierra).
- **Paleta por creador** para coherencia visual de su catálogo.
- La imagen generada como **contexto multimodal** para el diálogo (el NPC "ve" la sala).
- **Coste por uso real**: generar assets descuenta créditos del creador (no hay tarifa
  fija, según la dirección del producto).

---

## IDEA 7 — Skills por niveles que desbloquean capacidades

**Recomendación:** al subir de nivel, la funda/entrenador desbloquea skills que
**afectan mecánicamente** la escena (no son cosméticas): "Alemán Coloquial" abre
ramas informales, "Ojo Clínico" marca errores en el formulario antes de entregar,
"Calma Bajo Presión" ralentiza el temporizador. Y la skill **entrenador-creador**
(desbloqueable a cierto nivel + licencia) es la que habilita proponer historias.

**Por qué conviene:** da progresión real y justifica por qué el cliente solo puede
crear historias después de entrenar, no desde el inicio.

---

## IDEA 8 — Escenas por defecto vs. escenas creadas

**Recomendación:** krk9 debería traer un **catálogo pequeño pero pulido** de escenas
por defecto (Anmeldung 2026, Arzttermin, Jobcenter, Mietvertrag) escritas a mano y
con assets del estudio. Las escenas que el cliente cree con la skill entrenador-creador
se añaden al menú como contenido comunitario, publicables en el mercado para generar
créditos.

**Por qué conviene:** el juego nunca se queda sin contenido y el creador entrena su
propio idioma *escribiendo* escenarios.

---

## CÓMO PEDIMOS AL LLM QUE LO TRATE

Cuando integres esto en krk9, sugiere al LLM que:

- **Considere** el CUE (schema universal) como base en vez de plantillas rígidas.
- **Mantenga** la separación LLM-estructura / código-árbitro.
- **Incluya** el validador determinista como muro de seguridad.
- **Diseñe** los diálogos como language-room, no como 1-NPC.
- **No olvide** el gimnasio como paso previo obligado al desafío.
- **Aproveche** imágen/vídeo por LLM con fallback y coste por uso.
- **Respete** que entrenador-creador es una skill que se adquiere, no un acceso libre.

Todo esto como **recomendación de arquitectura**, para que krk9 quede coherente,
genérico y listo para colaboradores — no como un conjunto de órdenes cerradas.

---

*Nota: este prompt es material de dirección. krk9 es open source y autónomo; no se
acopla públicamente a roger_willkommen. Las ideas aquí son compatibles con ambos.*
