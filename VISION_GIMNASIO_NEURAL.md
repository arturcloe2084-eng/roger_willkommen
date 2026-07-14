# VISIÓN: EL GIMNASIO NEURAL — entrena la mente antes del desafío

**Proyecto:** Entrenador de Fundas (`roger_willkommen`)
**Fecha:** 2026-07-12
**Contexto:** el jugador, antes de enfrentar el desafío (ej. Anmeldung 2026),
debe pasar por un **gimnasio mental** donde estudia palabras clave y frases.
Este documento describe cómo sería según la dirección ya trazada (neural sleeve,
sci-fi command dashboard, language-room, skills por nivel).

---

## 1. Concepto central

> **La mente de la funda es un músculo.** Antes de la cita en el Bürgeramt,
> la funda se conecta a una cámara de entrenamiento neural. Allí no se "repite
> vocabulario" aburridamente: se **carga memoria** en la mente de la funda, se
> **forge** frases en un banco de sparring, y se mide el **reflejo** lingüístico.

El gimnasio es el puente obligado entre "tengo un contrato" y "estoy listo para
la cita". No es opcional: el desafío exige un **nivel mínimo de carga neural**
para abrirse.

---

## 2. Cómo se entra

Desde el menú de contrato (la pantalla que ya tenemos), el botón **NEURAL PREP**
lleva al gimnasio en vez de directo al desafío. El flujo queda:

```
CONTRATO  ──▶  GIMNASIO NEURAL  ──▶  DESAFÍO (Bürgeramt)
 (briefing)      (cargar mente)        (evaluación real)
```

Si intentas el desafío sin carga suficiente, el juego avisa: *"Carga neural
insuficiente — entra al gimnasio"*. Esto resuelve el hueco de la "presión de
tiempo" que señaló el tío: la ventana de preparación es la propia carga.

---

## 3. Estaciones del gimnasio

El gimnasio tiene **4 estaciones**, cada una un panel hexagonal en el dashboard:

### 3.1 Banco de Memoria (flashcards neurales)
Palabras clave flotan como **nodos luminosos** en el void. Tocas uno → se
despliega la traducción + un ejemplo real del trámite. Al acertar, el nodo se
"fija" en la mente de la funda (pasa a `learnedWords`). Las que fallas quedan
tenues, para repasar.

- Fuente: `vocabulary.json` filtrado al vocabulario del contrato (Anmeldung).
- Mecánica: spacing repetition ligero — las palabras olvidadas vuelven más seguido.

### 3.2 Forja de Frases (sparring con bot de entrenamiento)
Un **holo-entrenador** (distinto de Frau Meier) te pide frases. Es un language-room
**privado**: puedes pedir "más despacio" infinitas veces, el bot nunca te juzga,
no hay veredicto. Sirve para ensayar las frases clave antes de usarlas en serio.

- Ejemplo: el bot dice *"Diga: Ich möchte mich anmelden"*, tú repites, el bot
  confirma y la frase pasa a tu "frasebook" de la funda.
- Diferencia con el desafío: aquí `consultas_clientes` no sube, no hay presión.

### 3.3 Drill de Reflejos (reconocimiento cronometrado)
Palabras y frases del trámite **destellan** en pantalla; tienes X segundos para
elegir la traducción correcta. Mide tu **velocidad de comprensión** — que luego
se refleja en el criterio `comprension` del desafío real.

- Barra de reflejo sube con cada acierto.
- A mayor nivel, el drill es más rápido (más difícil, más recompensa).

### 3.4 Simulacro (Bürgeramt a presión cero)
Una **réplica del Bürgeramt** pero en modo ensayo: Frau Meier aparece, pero los
errores no cuentan para el veredicto real, solo te dan feedback. Es el "calentamiento"
antes de la cita de verdad.

- Usa la misma language-room que el desafío → lo que ensayas es lo que enfrentas.
- Al salir, el juego calcula tu "carga neural" estimada.

---

## 4. La barra de "Carga Neural"

Todo el gimnasio alimenta **una sola barra**: la carga neural de la funda para
este contrato.

```
CARGA NEURAL:  [▓▓▓▓▓▓░░░░] 60%   ·   mínimo para cita: 70%
```

Sube con: palabras fijadas, frases del frasebook, drill de reflejos alto,
simulacro sin errores graves.

Cuando llega al mínimo, el botón **EMPEZAR DESAFÍO** se ilumina y se desbloquea.

---

## 5. Conexión con el desafío (lo que "se lleva")

Lo entrenado en el gimnasio NO se olvida al salir:

- `learnedWords` y `frasebook` alimentan el **criterio de idioma** del evaluador.
- El drill de reflejos alimenta **comprensión**.
- El simulacro entrena **expresión** y **autonomía** (sin penalización).
- El formulario que rellenaste en el simulacro puede traerse pre-cargado al real
  (la funda "recuerda" sus datos), bajando el riesgo de error administrativo.

Es decir: **el gimnasio es donde se gana la mitad del veredicto antes de jugar.**

---

## 6. Skills y niveles que desbloquean el gimnasio

| Nivel | Skill de gimnasio | Efecto |
|---|---|---|
| 1 | Acceso al Banco de Memoria | puedes estudiar vocabulario |
| 3 | Forja de Frases | desbloquea el sparring con bot |
| 5 | Drill de Reflejos + | el drill da el doble de carga |
| 7 | Simulacro Libre | puedes repetir el simulacro sin límite |
| 9 | "Memoria Eidética" | las palabras fijadas no se olvidan entre sesiones |

Esto conecta con el árbol de skills de `VISION_CREADOR_ESCENAS.md`: el gimnasio
es donde esas skills se usan de verdad.

---

## 7. Estética (coherente con el dashboard)

El gimnasio usa la **misma paleta y hex grid** que el menú, pero con un matiz:
en vez de un único núcleo central, hay **4 pods de entrenamiento** dispuestos
en arco, cada uno con su anillo orbital propio. La "carga neural" se muestra
como un anillo que se llena alrededor de la funda.

- Banco de Memoria → cyan
- Forja de Frases → amber
- Drill de Reflejos → magenta
- Simulacro → green

Al entrar a una estación, la cámara hace un *zoom* suave al pod (efecto de
"conectar la funda al puerto").

---

## 8. Riesgo y mitigación

| Riesgo | Mitigación |
|---|---|
| El gimnasio se vuelva grind aburrido | Drill de reflejos da variedad; simulacro es "jugar de verdad" sin castigo |
| Carga neural sea solo un número vacío | Se descompone en 4 fuentes visibles (palabras, frases, reflejo, simulacro) |
| Jugador salte el gimnasio siempre | El mínimo de carga es una *puerta* dura, no sugerencia |

---

## 9. Siguiente paso concreto

1. Crear `GimnasioScene.js` con las 4 estaciones (reusa `PreparationScene` actual
   como semilla: ya tiene vocab/quiz/dialog/crossword).
2. Añadir `frasebook` y `neuralLoad` al perfil de la funda (`PlayerProgressStore`).
3. Cablear la "puerta de carga mínima" en `ContractMenuScene` / `SceneEngineScene`.
4. El simulacro reusa la language-room del desafío con flag `modo_ensayo: true`.

---

*Documento vivo. Cuando se implemente, mover de "propuesta" a "hecho" y enlazar commit.*
