# INFORME DE PROGRESO 01 — PROYECTO "ENTRENADOR DE FUNDAS"

**Fecha de corte:** sesión actual
**Estado:** documentación de dirección completa, código base clonado y compilando, **cero código nuevo del juego tocado aún**.

---

## 1. QUÉ ES ESTE PROYECTO (resumen para un LLM externo)

Es un **videojuego para aprender idiomas** con una premisa de ciencia ficción (inspiración: *Altered Carbon*, pero el mundo debe ser original). El jugador es una **"Conciencia de Continuidad"**: una mente sin cuerpo que posee una licencia para **entrenar y certificar fundas** (cuerpos-mentes alquilados).

La mecánica central: el jugador entrena una funda para cumplir **contratos** (tareas de idioma del mundo real). Si la funda mejora lo suficiente antes de que venza su alquiler, se puede vender con beneficio o comprar; si no, se pierde. El progreso lingüístico tiene **consecuencias económicas dentro del juego**, no es una barra de racha abstracta.

El proyecto reutiliza un repositorio existente (`roger_willkommen`) como base técnica, y un segundo repositorio (`krk9`) como **carta de presentación open source** para reclutar colaboradores.

---

## 2. ESTADO ACTUAL VERIFICADO (no especulativo)

| Ítem | Estado | Evidencia |
|---|---|---|
| Repos clonados | Sí | `~/roger_willkommen` (main, commit `f546361`), `~/lenguage-room` (espejo de krk9) |
| Build del juego | Compila | `vite build` → 31 módulos, sin errores (solo warning de bundle >500KB) |
| Documentación de dirección | Escrita | 3 archivos `.md` nuevos en la raíz |
| **Cambios de código del juego** | ❌ **Ninguno** | Los `.md` están sin commitear (`git status` muestra `??`) |
| **Examen del desafío definido** | ✅ Sí | `DESAFIO_ANMELDUNG_2026.md` — perfil, campos, NPCs, flujo, regla de ayuda a clientes, 3 fixtures |
| wid-proxy (backend LLM) | **Vacío** | La carpeta `wid-proxy/` existe pero está vacía; el frontend llama a `POST /npc` y `POST /narrate` que hoy no existen |
| Contenido antiguo del juego | Presente pero descartado | `scenes.json` tiene apartamento→vecinos→calle→oficina; el nuevo diseño **elimina** ese recorrido del primer desafío |

**Conclusión honesta:** el trabajo hasta ahora es de **diseño y arquitectura**, no de implementación. El juego sigue funcional como estaba (con diálogos simulados por palabras clave), pero no refleja aún ninguna de las decisiones nuevas.

---

## 3. DOCUMENTOS CREADOS (la base que debe evaluar "tío")

### A. `PRODUCT_BRIEF.md` — dirección de producto (FUENTE DE VERDAD)
Define el **primer desafío concreto**:
- Contrato: preparar una funda para completar la **Anmeldung** (empadronamiento) en un Bürgeramt alemán en 2026.
- El jugador puede llevar un **acompañante** que ayude dentro de la oficina.
- Recorrido GUI: `Contrato → Perfil multilingüe → Preparación → Formulario + Diálogo → Evaluador → Informe de mejora`.
- **Perfil = currículum vivo** de la funda (datos reales vs. simulados, nivel declarado vs. comprobado).
- **Fundas multilingües**: cada idioma guarda progreso independiente (ej. Vaclav: alemán en mejora, inglés avanzado, español de apoyo).
- **Evaluador de Diálogo**: no "correcto/incorrecto", sino 8 criterios separados (cumplimiento, exactitud de datos, comprensión, expresión, idioma, autonomía, recuperación, seguridad) con resultado estructurado.
- **Evaluador de Guiones** (futuro): puntúa escenas creadas por usuarios según utilidad, complejidad, realismo, etc.
- **Fundas perdidas y subastas**: una funda perdida conserva lo aprendido y vuelve a subasta.
- **Licencias del entrenador**: idiomas (primera), y futuras (programación, matemáticas, trading — esto último surgió por error en krk9 y se guarda como licencia futura).
- **Modelo económico**: *NO habrá tarifa mensual fija*; el coste se ajusta al uso/progreso real, con límites visibles y sin cobros ocultos.
- **Alcance del primer prototipo**: lo que SÍ se incluye y lo que NO (mercado, subastas operativas, pagos reales, trading, físico — todos fuera por ahora).

### B. `AGENTS.md` — instrucciones para agentes
Reglas de trabajo: leer primero `PRODUCT_BRIEF.md`, verificar con herramientas antes de afirmar, TDD, no borrar escenas antiguas (desconectarlas), no enviar datos reales a LLM, el LLM analiza pero reglas deterministas controlan dinero/reputación/estado.

### C. `PROJECT_GENESIS.md` — documento histórico
La versión anterior (recorrido por apartamento, economía de funda única, identidad narrativa). **Quedó reemplazada** por `PRODUCT_BRIEF.md` en la nueva dirección, pero se conserva como contexto.

### D. Skill de Hermes `funda-game-coach`
Creado en `~/.hermes/skills/software-development/funda-game-coach/SKILL.md`. Obliga a futuras sesiones a combinar tres objetivos: (1) avance verificable del juego, (2) mentoría de programación accesible para Vaclav, (3) práctica multilingüe real desde su nivel.

---

## 4. ARQUITECTURA TÉCNICA BASE (del código existente)

**`roger_willkommen/wid-game/`** — Phaser 3 + Vite (cliente web)
- `src/services/player/PlayerProgressStore.js` — singleton con `level`, `xp`, `learnedWords[]`, `stats{correct,partial,incorrect}`, `story{day,chapter,...}`. **Este es el objeto que debe migrarse a "funda".**
- `src/services/ai/NpcDialogueService.js` — llama a `POST /npc` con fallback local por palabras clave.
- `src/services/SceneBuilderUI.js` — el jugador escribe historia + sube fotos + examen de vocabulario → desbloquea escena. (Semilla futura para crear contratos.)
- `src/config/apiConfig.js` — `VITE_PROXY_URL` (default `localhost:8080`), `VITE_GAME_SECRET`.
- `public/data/scenes.json` — grafo de escenas (hoy apartamento→oficina).
- `public/data/vocabulary.json` — **vacío** (`words: []`), hay CSVs de ejemplo sin importar.

**`roger_willkommen/wid-proxy/`** — **VACÍO**. Faltan `server.js` y endpoints `/npc`, `/narrate`.

**`lenguage-room/`** (= `krk9`) — Bot Discord Python: 4 agentes con coordinador de turnos, router multi-LLM, voz navegador↔Discord. Es el proyecto "portafolio" para reclutar devs, debe quedarse genérico y autónomo.

---

## 5. LO QUE FALTA HACER (backlog para "tío")

### Bloqueante técnico
1. **wid-proxy**: localizar el `server.js` perdido en la máquina, o reconstruir un proxy Express mínimo con `/health`, `/npc`, `/narrate` (modo dev sin LLM). Sin esto, el juego no habla con IA real.

### Primer vertical slice (según PRODUCT_BRIEF §12)
2. Definir el **contrato Anmeldung 2026** como datos verificables: perfil ficticio, campos del formulario, documentos esperados, empleados, cuándo intervene el acompañante, criterios de éxito/ayuda/fracaso.
3. **Evaluador de Diálogo mínimo**: 3 fixtures de prueba (aprobado / aprobado-con-ayuda / fallido) que el evaluador distinga correctamente *antes* de conectar a la GUI.
4. **Perfil multilingüe**: modelo de datos donde cada idioma tiene nivel declarado/comprobado independiente.
5. **GUI del recorrido**: botón de inicio → contrato → preparación → desafío → informe.
6. **Migración de PlayerProgressStore → Funda**: sin romper partidas guardadas (legacy `widPlayerProgress`).

### Futuro (fuera del primer prototipo)
- Mercado multijugador, subastas operativas, venta pública de skills, otras licencias (trading), pagos reales, entrenamiento físico.

---

## 6. PEDIDO A "TÍO" (LLM evaluador)

Por favor evalúa y actualiza:

1. **¿Es coherente el alcance del primer desafío?** El salto de "juego de apartamento" a "solo Anmeldung 2026" es grande. ¿Falta algo para que sea un bucle completo y demostrable?
2. **Evaluador de Diálogo**: propón el **esquema JSON exacto** de entrada y salida, y una implementación de referencia (puede ser pseudocódigo o Python) que tome las 3 conversaciones fixture y devuelva el veredicto correcto.
3. **Perfil multilingüe**: propón la estructura de datos concreta (JSON/TS) que reemplace `targetLanguage` global por idiomas independientes, compatible con la migración de `PlayerProgressStore`.
4. **wid-proxy mínimo**: bosqueja los endpoints `/npc` y `/narrate` con sus cuerpos, y cómo conectarlos al `NpcDialogueService.js` existente sin romper el fallback.
5. **Riesgos**: señala qué decisiones de `PRODUCT_BRIEF.md` son frágiles o necesitan calibración antes de código.

---

**Nota para quien retome:** los 3 `.md` y el skill están sin commitear. El repo `origin` apunta a `arturcloe2084-eng/roger_willkommen`. No se ha pusheado nada nuevo. El build funciona. El backend LLM (wid-proxy) es el primer bloqueante real.
