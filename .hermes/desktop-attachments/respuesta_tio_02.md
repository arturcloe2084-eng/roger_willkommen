# Respuesta de "tío" al INFORME_PROGRESO_01 + esquema de menús y plan de reestructuración

**Verificado contra el código real** (no solo contra el resumen del informe): se re-clonaron ambos repos, se releyó `NpcDialogueService.js` línea por línea, y el evaluador de diálogo se escribió y se **ejecutó** contra 3 fixtures (no es pseudocódigo sin probar).

---

## PARTE A — Evaluación del informe (respuesta a "PEDIDO A TÍO")

### 1. ¿Es coherente el alcance del primer desafío (solo Anmeldung 2026)?

**Sí, como recorte de MVP tiene lógica** — es la escena más madura del repo (Frau Meier y Marcus ya existen con personalidad escrita), y un solo contrato de principio a fin es más demostrable que un recorrido de 30 días a medio construir. `PROJECT_GENESIS.md` conservando la dirección anterior es la decisión correcta (no se pierde nada).

Pero hay **tres huecos que sí hay que cerrar antes de programar**, porque si no, el prototipo demuestra una escena, no el juego:

1. **La presión de tiempo desaparece.** Todo el gancho original ("si no mejoras a tiempo, pierdes dinero") vivía en el contador de 30 días. Un solo contrato no tiene "30 días" de nada. Propuesta: el contrato define una **ventana de preparación** explícita (ej. "tienes 5 sesiones de preparación antes de la cita") — el mismo mecanismo de plazo, comprimido a la escala de un contrato en vez de un recorrido completo.
2. **Falta la señal de bucle.** Un solo contrato demuestra la escena, no demuestra que "entrenar → vender/quedarte → repetir" funciona más de una vez. No hace falta construir un segundo contrato completo ahora — pero el prototipo debería dejar explícito, aunque sea con una pantalla stub ("siguiente contrato: próximamente"), que después de resolver la Anmeldung el ciclo continúa. (Ver la Parte B: el diagrama del flujo ya incluye ese cierre.)
3. **El perfil declarado-vs-comprobado hoy es paralelo, no integrado.** Se vuelve mucho más fuerte si el contrato **exige** un mínimo comprobado (ej. "cliente pide alemán B1 comprobado") y la funda solo tiene B1 *declarado* — esa brecha es la tensión real del primer desafío, no un dato de fondo.

### 2. Evaluador de Diálogo — esquema JSON + implementación de referencia (probada)

**Principio de diseño** (siguiendo `AGENTS.md` al pie de la letra): el LLM únicamente produce los 8 puntajes por criterio a partir de la transcripción — nunca decide el veredicto ni las recompensas. Eso lo hace código determinista, 100% testeable sin LLM.

**Entrada al agregador determinista:**
```json
{
  "criterios": {
    "cumplimiento": 0-100, "exactitud_datos": 0-100, "comprension": 0-100,
    "expresion": 0-100, "idioma": 0-100, "autonomia": 0-100,
    "recuperacion": 0-100, "seguridad": 0-100
  },
  "ayuda": { "acompanante_intervino": true, "num_intervenciones": 2 }
}
```
`ayuda` es un hecho objetivo del estado del juego (no una opinión del LLM) — por eso vive separado de `criterios` y actúa como *gate* determinista, no como una nota más a promediar.

**Salida:**
```json
{
  "veredicto": "aprobado" | "aprobado_con_ayuda" | "fallido",
  "puntaje_global": 78.4,
  "xp_reward": 140,
  "creditos_reward": 70
}
```

**Implementación (Python — ejecutada, no solo propuesta):**
```python
PESOS = {"cumplimiento": .22, "exactitud_datos": .18, "comprension": .12, "expresion": .10,
         "idioma": .10, "autonomia": .10, "recuperacion": .10, "seguridad": .08}
UMBRAL_APROBADO, UMBRAL_AYUDA = 70, 50
GATE_CUMPLIMIENTO, GATE_EXACTITUD, GATE_INTERVENCIONES = 40, 40, 2

def evaluar(criterios, ayuda):
    promedio = sum(criterios[k] * PESOS[k] for k in PESOS)
    if criterios["cumplimiento"] < GATE_CUMPLIMIENTO or criterios["exactitud_datos"] < GATE_EXACTITUD:
        veredicto = "fallido"
    elif promedio >= UMBRAL_APROBADO:
        veredicto = "aprobado"
    elif promedio >= UMBRAL_AYUDA:
        veredicto = "aprobado_con_ayuda"
    else:
        veredicto = "fallido"
    if veredicto == "aprobado" and ayuda.get("num_intervenciones", 0) >= GATE_INTERVENCIONES:
        veredicto = "aprobado_con_ayuda"  # tope por ayuda, aunque el promedio sea alto
    xp = round(promedio * 2)
    creditos = 0 if veredicto == "fallido" else round(promedio * (1.5 if veredicto == "aprobado" else 1.0))
    return {"veredicto": veredicto, "puntaje_global": round(promedio, 1), "xp_reward": xp, "creditos_reward": creditos}
```

**Resultado real de ejecutar los 3 fixtures** (Python y su puerto a JS, idénticos):
```
OK | F1 — Anmeldung correcta, sin ayuda            -> aprobado           (promedio 91.8)
OK | F2 — Se traba, acompañante ayuda 2 veces      -> aprobado_con_ayuda (promedio 70.0)
OK | F3 — Dirección incorrecta, no procesa         -> fallido            (promedio 33.3)
```
Dato interesante de F2: su promedio (70.0) por sí solo habría dado "aprobado" — es el *gate* de intervenciones el que lo baja correctamente a "aprobado_con_ayuda". Esto confirma que el segundo gate no es decorativo, hace trabajo real.

Puerto a JS (mismo algoritmo, mismos resultados, listo para vivir en `wid-proxy`):
```js
const PESOS = { cumplimiento:.22, exactitud_datos:.18, comprension:.12, expresion:.10,
                idioma:.10, autonomia:.10, recuperacion:.10, seguridad:.08 };
export function evaluarDialogo(criterios, ayuda) {
  const promedio = Object.entries(PESOS).reduce((s,[k,w]) => s + criterios[k]*w, 0);
  let veredicto;
  if (criterios.cumplimiento < 40 || criterios.exactitud_datos < 40) veredicto = 'fallido';
  else if (promedio >= 70) veredicto = 'aprobado';
  else if (promedio >= 50) veredicto = 'aprobado_con_ayuda';
  else veredicto = 'fallido';
  if (veredicto === 'aprobado' && (ayuda?.num_intervenciones ?? 0) >= 2) veredicto = 'aprobado_con_ayuda';
  const xp_reward = Math.round(promedio * 2);
  const creditos_reward = veredicto === 'fallido' ? 0 : Math.round(promedio * (veredicto === 'aprobado' ? 1.5 : 1.0));
  return { veredicto, puntaje_global: Math.round(promedio*10)/10, xp_reward, creditos_reward };
}
```

**Falta definir antes de programar** (ver Parte A.5 — Riesgos): quién/qué es exactamente el "acompañante" — de eso depende cómo el juego rellena `ayuda.num_intervenciones`.

### 3. Perfil multilingüe — estructura de datos

Sustituye el `targetLanguage` global por un mapa de idiomas, cada uno con nivel **declarado** (autopercibido, tipo CV) y **comprobado** (verificado por el Evaluador de Diálogo):

```ts
interface NivelIdioma {
  declarado: string;              // CEFR autodeclarado, ej. "B1"
  comprobado: string | null;      // CEFR verificado; null = nunca evaluado
  xp: number;
  learnedWords: string[];
  stats: { correct: number; partial: number; incorrect: number };
  ultimaEvaluacion: string | null; // fecha ISO
}
interface PerfilMultilingue {
  idiomas: { [codigo: string]: NivelIdioma };   // 'de', 'en', 'es'...
  idiomaPrincipalContrato: string;               // qué idioma exige el contrato activo
}
```

Ejemplo (el mismo del informe): alemán en mejora, inglés avanzado, español de apoyo:
```json
{
  "idiomas": {
    "de": { "declarado": "A2", "comprobado": "A1", "xp": 120, "learnedWords": ["...87..."], "stats": {"correct":40,"partial":10,"incorrect":8}, "ultimaEvaluacion": "2026-07-05" },
    "en": { "declarado": "C1", "comprobado": "B2", "xp": 950, "learnedWords": ["..."], "stats": {"correct":300,"partial":20,"incorrect":5}, "ultimaEvaluacion": "2026-03-01" },
    "es": { "declarado": "A1", "comprobado": null, "xp": 20, "learnedWords": [], "stats": {"correct":3,"partial":1,"incorrect":2}, "ultimaEvaluacion": null }
  },
  "idiomaPrincipalContrato": "de"
}
```

**Compatibilidad con la migración Proxy ya diseñada** (conversación anterior — `FundaManager` + fachada `Proxy` para `playerProgressStore`): el `get` trap solo necesita un paso extra, indexar por el idioma activo antes de devolver `level`/`xp`/`learnedWords`/`stats`. Los 13 archivos existentes siguen sin tocarse — ven "el idioma que toca ahora mismo" como si fuera el único que hubiera.
```js
get(_, prop) {
  const f = fundaManager.fundaActiva;
  const idioma = f.idiomas[f.idiomaPrincipalContrato];
  if (['level','xp','xpToNextLevel','learnedWords','stats'].includes(prop)) return idioma[prop];
  return typeof f[prop] === 'function' ? f[prop].bind(f) : f[prop];
}
```
**Efecto en `valorDeMercado()`**: deja de ser un solo nivel — pasa a sumar por idioma, ponderado por demanda (esto es, mecánicamente, la misma pieza que hace valiosa a una mente poliglota):
`valorDeMercado = Σ_idiomas (nivel_i × 50 + vocab_i × 2) × demandaIdioma_i`

### 4. `wid-proxy` mínimo — endpoints `/npc` y `/narrate`

Confirmado leyendo `NpcDialogueService.js` directamente (no de memoria): el cliente ya envía `npcPersonality`, `playerMessage`, `targetLanguage`, `playerLevel`, `trans1`, `trans2` con header `x-game-secret`, y espera de vuelta `npc_dialogue`, `feedback_es`, `evaluation`, `game_action`, `xp_reward`, `npc_dialogue_t1`, `npc_dialogue_t2`. El fallback local ya existe y sigue intacto — solo se dispara si el proxy no responde.

**Regla de integración: solo añadir campos, nunca quitar ni renombrar los que el cliente ya lee.**

```js
// wid-proxy/server.js — mínimo, modo dev sin LLM real
import express from 'express';
import cors from 'cors';
import { evaluarDialogo } from './dialogueEvaluator.js';

const app = express();
app.use(cors(), express.json());
const GAME_SECRET = process.env.GAME_SECRET || 'dev-secret';
const GEMINI_KEY = process.env.GEMINI_API_KEY || null;

app.use((req, res, next) =>
  req.headers['x-game-secret'] === GAME_SECRET ? next() : res.status(401).json({ error: 'secret inválido' }));

app.get('/health', (req, res) => res.json({ ok: true, modo: GEMINI_KEY ? 'llm' : 'dev-stub' }));

app.post('/npc', async (req, res) => {
  const { npcPersonality, playerMessage, targetLanguage, playerLevel } = req.body;
  const criterios = GEMINI_KEY
    ? await puntuarConGemini(npcPersonality, playerMessage, targetLanguage, playerLevel)
    : puntuarStubDev(playerMessage);              // heurística simple, sin red, para desarrollar sin clave
  const ayuda = req.body.ayuda ?? { num_intervenciones: 0 };
  const v = evaluarDialogo(criterios, ayuda);

  const MAPA_EVAL = { aprobado: 'correct', aprobado_con_ayuda: 'partial', fallido: 'incorrect' };
  const MAPA_ACCION = { aprobado: 'open_door', aprobado_con_ayuda: 'open_door', fallido: 'deny_access' };

  res.json({
    npc_dialogue: construirRespuestaNPC(npcPersonality, v.veredicto, targetLanguage),
    feedback_es: v.veredicto === 'fallido' ? 'No se entendió bien — inténtalo otra vez.' : 'Bien hecho.',
    evaluation: MAPA_EVAL[v.veredicto],
    game_action: MAPA_ACCION[v.veredicto],
    xp_reward: v.xp_reward,
    npc_dialogue_t1: null, npc_dialogue_t2: null,
    _evaluacion_detallada: { ...v, criterios },   // NUEVO — el cliente actual lo ignora sin romperse
  });
});

app.post('/narrate', async (req, res) => {
  const { objectName, objectDescription } = req.body;
  res.json({ narration: `${objectName}: ${objectDescription} (modo dev, sin LLM real todavía)` });
});

app.listen(process.env.PORT || 8080);
```
`puntuarStubDev` es una heurística mínima (longitud del mensaje, presencia de palabras clave del idioma) solo para poder desarrollar y probar la GUI sin gastar cuota de ningún LLM — se reemplaza por la llamada real a Gemini cuando `GEMINI_API_KEY` esté configurada.

### 5. Riesgos y decisiones frágiles

- **El "acompañante" no está definido.** ¿Es otra funda? ¿Un NPC aliado? ¿El propio jugador controlando dos personajes? De esto depende cómo se rellena `ayuda.num_intervenciones` — hay que resolverlo antes de programar el Evaluador, no después.
- **8 criterios es mucho para calibrar a mano.** Riesgo real de que 2-3 de ellos se muevan casi siempre juntos en la práctica (p. ej. comprensión y expresión) y resulten redundantes. Recomendación: implementar los 8, pero revisar tras los primeros playtests reales si conviene fusionar alguno — no invertir tiempo afinando pesos hasta tener datos.
- **"Fundas perdidas retienen lo aprendido y van a subasta"** es una mecánica bonita pero abre una vía de abuso: fallar a propósito para "lavar" progreso hacia una funda barata en subasta. Necesita una regla explícita (ej. el entrenador original no recibe nada de la subasta, o hay un enfriamiento) antes de programar la subasta.
- **"No habrá tarifa mensual fija"** — el informe no aclara si esto describe la economía ficticia dentro del juego o el modelo de negocio real del producto. Son decisiones de diseño completamente distintas; vale la pena que quien escriba la siguiente versión de `PRODUCT_BRIEF.md` lo diga explícitamente.
- **Perfil declarado-vs-comprobado añade una segunda cifra por idioma en la UI.** No es un problema de diseño, es un riesgo de ejecución: si la interfaz no lo presenta con mucho cuidado, se vuelve ruido visual. Cuidado en la Parte B de este documento.

---

## PARTE B — Esquema de menús

*(el diagrama del bucle principal ya se mostró arriba en el chat — aquí va la versión en texto, completa, para quien no pueda ver el render)*

```
MENÚ PRINCIPAL
├── Continuar               (si hay contrato en curso)
├── Mis Fundas
│   └── [seleccionar funda] → Ficha de la Funda
│         ├── Perfil Multilingüe (por idioma: declarado vs comprobado, vocabulario, stats)
│         ├── Alquiler (días/sesiones restantes, coste, comprar si aplica)
│         ├── Historial de contratos superados
│         └── [Iniciar / Continuar Contrato] ──────────────┐
├── Mi Perfil de Entrenador                                 │
│   ├── Reputación                                          │
│   ├── Licencias (Idiomas [activa]; Programación,          │
│   │    Matemáticas, Trading [futuras, bloqueadas])        │
│   └── Créditos                                             │
├── Mercado / Subastas          [stub — "próximamente"]      │
└── Ajustes                                                  │
                                                              ▼
                                              RECORRIDO DEL CONTRATO
                                    (el diagrama de 5 pasos mostrado arriba)
                                    1. Contrato          — briefing + requisito de idioma
                                    2. Perfil Multilingüe — chequeo de brecha declarado/comprobado/requerido
                                    3. Preparación         — sala de aprendizaje (ya existe: diccionario,
                                                              crucigrama, flashcards, quiz, karaoke)
                                    4. Desafío             — formulario + diálogo (usa el /npc extendido)
                                    5. Evaluación          — informe de 8 criterios + veredicto
                                    6. Resultado           — vender / comprar / seguir alquilando
                                                              ↻ vuelve a "Mis Fundas"
```

**Nota de UX para el riesgo de la segunda cifra (declarado/comprobado):** mostrar comprobado como el número grande y principal, y declarado solo como una etiqueta pequeña tipo "(el CV dice B1)" — nunca dos números del mismo tamaño uno al lado del otro.

**Contenido antiguo (apartamento → vecinos → calle → oficina):** no aparece en este menú por ahora — sigue existiendo en `scenes.json`, solo desconectado de la navegación principal, tal como pide `AGENTS.md`. Sitio natural para reconectarlo más adelante: como una entrada más dentro de "Mercado / Subastas" o como un segundo tipo de contrato, una vez el vertical slice de Anmeldung esté demostrado.

---

## PARTE C — Plan de reestructuración de `/home/vaclav/roger_willkommen/`

*(basado en la estructura real de `wid-game/src/` verificada en el clon — si algo difiere en tu máquina por los 3 `.md` sin commitear, este plan no los toca, solo el código)*

### Acción por archivo

| Archivo / carpeta | Acción | Motivo |
|---|---|---|
| `scenes/core/MainMenuScene.js` | **AJUSTAR** | nuevos botones: Mis Fundas, Perfil de Entrenador, Mercado (stub) |
| `scenes/core/GameHudScene.js` | **AJUSTAR** | leer del idioma activo vía el Proxy extendido, no de un `level` plano |
| `scenes/core/DictionaryScene.js` | sin cambios | ya es la "Preparación" |
| `scenes/features/DialogScene.js` | **AJUSTAR** | leer `_evaluacion_detallada` si viene; si no, comportarse exactamente igual que hoy |
| `scenes/features/CrosswordScene.js`, `QuizScene.js` | sin cambios | |
| `scenes/features/RogerExampleScene.js`, `SignalLocatorScene.js` | **DESCONECTAR** del menú principal | no borrar — pertenecen al recorrido antiguo, quedan disponibles para reconectar (Parte B) |
| `scenes/entrenador/` *(carpeta nueva)* | **NUEVO** | `FundaRosterScene.js`, `FundaDetailScene.js`, `ContratoBriefingScene.js`, `EvaluacionInformeScene.js`, `ResultadoEconomicoScene.js`, `EntrenadorPerfilScene.js` |
| `services/player/PlayerProgressStore.js` | **CONVERTIR** en fachada `Proxy` delgada | ver conversación anterior — los 13 archivos que la importan no cambian |
| `services/player/Funda.js` | **NUEVO** | factory con perfil multilingüe (Parte A.3) |
| `services/player/FundaManager.js` | **NUEVO** | colección de fundas + estado del entrenador + persistencia |
| `services/evaluador/dialogueEvaluator.js` | **NUEVO** | puerto JS ya escrito y probado (Parte A.2) |
| `services/ai/NpcDialogueService.js` | **AJUSTAR (mínimo)** | enviar `playerLevel` del idioma activo; aceptar `_evaluacion_detallada` sin requerirlo |
| `services/SceneBuilderUI.js`, `StudyRoomService.js`, `DictionaryHelper.js` | sin cambios por ahora | semilla futura para crear contratos/skills, no se toca en este vertical slice |
| `content/rogerExampleStory.js` | sin cambios | pasa a ser el contenido narrativo de la funda-tutorial "Roger" |
| `wid-proxy/server.js` | **RECONSTRUIR** | mínimo con `/health`, `/npc`, `/narrate` (Parte A.4) — bloqueante |
| `public/data/vocabulary.json` | **POBLAR** | importar desde los CSV sueltos, filtrado al vocabulario de la Anmeldung |

### Orden de ejecución recomendado

1. `wid-proxy/server.js` mínimo (bloqueante — nada más funciona con LLM real sin esto).
2. `dialogueEvaluator.js` en el proxy (ya escrito y probado arriba).
3. `Funda.js` + `FundaManager.js` con perfil multilingüe.
4. Convertir `PlayerProgressStore.js` en la fachada Proxy — verificar que los 13 archivos existentes siguen funcionando sin tocarlos.
5. Ajuste mínimo de `NpcDialogueService.js`.
6. Las 6 escenas nuevas de `entrenador/`, en este orden: Roster → Ficha → Briefing → (reutilizar DialogScene para el desafío) → Informe → Resultado.
7. Desconectar `RogerExampleScene`/`SignalLocatorScene` del menú (sin borrar).
8. Poblar `vocabulary.json`.

Cada paso es probable que se pueda probar de forma aislada antes de pasar al siguiente — ideal para el objetivo de mentoría de `AGENTS.md`/el skill de Hermes, ya que cada uno es una unidad de trabajo del tamaño correcto para explicar y revisar con Vaclav.

---

## Ideas frescas (no pedidas, pero relevantes)

- **La funda propia como "compañera de práctica" para las nuevas** (ver conversación anterior sobre niveles) encaja de forma natural como una de las opciones dentro de "Preparación" — en vez de solo minijuegos, un contrato podría ofrecer practicar con una funda propia ya entrenada, tal como krk9 ya sabe hacer conversación sostenida. Vale la pena anotarlo como enganche futuro entre ambos repos.
- Dado que `AGENTS.md` ya exige TDD, los 3 fixtures de este documento (con verdicto esperado) pueden convertirse literalmente en el primer archivo de test del proyecto — ya están escritos y ya pasan.
