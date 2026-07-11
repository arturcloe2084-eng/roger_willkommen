# Proyecto Génesis — Entrenador de Fundas

> Documento base de producto y arquitectura. Define el primer vertical slice jugable del videojuego de idiomas. No convierte los bocetos futuros en requisitos inmediatos.

## 1. Visión

Construir un juego narrativo para aprender idiomas en el que el progreso lingüístico tenga consecuencias económicas dentro del mundo.

El jugador administra y entrena **fundas**: cuerpos con una capacidad mental que puede aumentar mediante práctica de idioma, comprensión, diálogo y resolución de situaciones. Cada funda se alquila con un plazo limitado. Si mejora lo suficiente, puede venderse con beneficio o comprarse; si no alcanza el valor mínimo antes del vencimiento, el contrato se pierde.

La diferencia frente a una app de rachas es central:

> Practicar no mantiene una barra abstracta: aumenta el valor verificable de una mente bajo contrato.

La inspiración de ciencia ficción debe quedarse en el tono y en la premisa de conciencia/cuerpo intercambiable. Mundo, nombres, reglas y trama deben ser originales; no se reutilizarán personajes, argumentos ni terminología distintiva de obras ajenas.

---

## 2. Decisión narrativa: quién es el jugador

El jugador es una **Conciencia de Continuidad**: una mente sin cuerpo propio que posee una licencia para entrenar y certificar capacidades cognitivas de fundas.

- Sabe entrenar, evaluar, contratar y vender, pero no recuerda con certeza su origen.
- Al principio no se confirma si es una IA, una persona copiada, una conciencia sin cuerpo o una mezcla. Esta ambigüedad es un misterio narrativo intencional, no un hueco sin explicar.
- Cada funda tiene identidad, límites, contexto y contrato propios. La conciencia del jugador no toma posesión de ella: la acompaña y la entrena.
- Perder una funda no es un *game over*: la Conciencia de Continuidad sigue activa, pero pierde inversión, reputación y acceso a mejores contratos.

Esto permite una narrativa de largo plazo y también justifica un futuro modo multijugador: cada jugador es otra Conciencia con licencia; compiten por contratos, reputación y mercado sin necesitar inventar miles de protagonistas humanos idénticos.

### Dos progresiones separadas

| Entidad | Qué progresa | Riesgo |
|---|---|---|
| **Funda** | idioma, vocabulario, precisión, contratos superados, skills adquiridas | puede venderse, comprarse o perderse |
| **Entrenador / Conciencia** | créditos, reputación, historial comercial, acceso a contratos | no desaparece, pero puede quedar sin capital |

No se debe mezclar valor de funda con reputación del entrenador: una funda excelente puede ser vendida; la reputación queda con quien la entrenó.

---

## 3. Primer contrato: Roger

`roger_willkommen` no se desecha ni se reescribe: se convierte en el tutorial y **Contrato 01: Roger**.

Roger deja de ser la identidad del jugador. Es la primera funda alquilada y su objetivo es lograr autonomía funcional en alemán para vivir y trabajar en Alemania durante un contrato de 30 días.

El contenido existente conserva su función:

- apartamento, escalera y calle: vocabulario cotidiano y primeras interacciones;
- Bürgeramt: prueba de diálogo dirigida y burocracia realista;
- oficina: transferencia de idioma a un contexto laboral;
- sala de aprendizaje: preparación antes de conversaciones de riesgo;
- Scene Builder: semilla futura para contratos/historias creadas por usuarios.

El contrato de Roger debe enseñar el ciclo entero sin exigir que el jugador entienda todos los sistemas futuros.

---

## 4. Vertical slice inicial (único objetivo de la primera versión)

La primera versión debe responder: **¿es divertido y útil entrenar una funda bajo presión de contrato?**

### Recorrido completo

1. El jugador recibe a Roger, una funda alquilada con 30 días disponibles.
2. Ve una ficha simple: nivel, palabras aprendidas, precisión, día, renta acumulada y valor estimado.
3. Practica en la sala de aprendizaje y gana vocabulario/XP como ya hace el juego.
4. Entra en un diálogo con un NPC; su resultado actualiza precisión, XP y palabras aprendidas.
5. Supera al menos una prueba narrativa importante, inicialmente Frau Meier en el Bürgeramt.
6. El juego muestra de forma transparente por qué Roger ganó valor.
7. Al final del contrato, el jugador recibe una decisión clara:
   - vender a Roger y obtener créditos + reputación;
   - comprar la funda si tiene créditos suficientes;
   - perderla si vence el plazo sin cumplir el mínimo establecido.

### Criterio de éxito de producto

Un jugador nuevo debe poder completar ese recorrido en una sesión corta y explicar con sus palabras:

- qué acciones aumentaron el valor de Roger;
- cuánto tiempo le queda;
- qué necesita para vender o comprar;
- por qué practicar alemán le ayudó a conseguirlo.

### Fuera de alcance de esta versión

- cuentas reales, base de datos o mercado multijugador;
- precios dinámicos entre jugadores;
- creación/publicación de skills por usuarios;
- entrenamiento físico como sistema separado;
- diálogo multiagente dentro de Phaser;
- migración o acoplamiento de código entre `krk9` y `roger_willkommen`.

Estos elementos son fases posteriores, no dependencias para validar el ciclo central.

---

## 5. Economía inicial

Las constantes son deliberadamente provisionales: deben calibrarse con partidas reales, no discutirse como valores definitivos.

```text
valorBase        = nivel × 50 + vocabularioAprendido × 2
precision        = correct / (correct + partial + incorrect), o 0 si no hay resultados
multiplicador    = 0.5 + precision
bonusContratos   = suma(dificultadContrato × 40)
valorDeMercado   = valorBase × multiplicador + bonusContratos
precioDeCompra   = max(valorDeMercado × 0.30,
                       valorDeMercado - rentaPagadaAcumulada)
```

Reglas iniciales:

- Al avanzar un día, una funda alquilada suma `costeDiario` a `rentaPagadaAcumulada`.
- La renta pasada reduce el precio de compra, pero nunca por debajo del 30% del valor de mercado.
- Una venta acreditará el `valorDeMercado` al entrenador y aumentará reputación en aproximadamente el 10% de ese valor.
- El precio, la precisión y los bonos deben mostrarse desglosados en la UI; no se permiten cifras mágicas opacas.

Todavía no se incluye `bonusSkills`: primero se valida el sistema base con nivel, vocabulario, precisión y contratos.

---

## 6. Modelo de dominio base

```js
// Funda: estado de una persona entrenada, no del jugador.
{
  id, nombre, contrato, idiomaObjetivo,
  origen: 'tutorial' | 'generada',
  estado: 'alquilada' | 'propia' | 'vendida' | 'perdida',

  level, xp, xpToNextLevel,
  learnedWords: [],
  stats: { correct, partial, incorrect },
  story: { day, chapter, activeObjective, journal: [], flags: {} },

  contratosSuperados: [{ id, dificultad }],
  skillsEntrenadas: [], // reservada; no se usa todavía
  alquiler: { diaLimite: 30, costeDiario: 15, rentaPagadaAcumulada: 0 }
}

// Estado permanente del entrenador.
{
  creditos: 0,
  reputacion: 0,
  fundasVendidas: 0,
  fundasPerdidas: 0
}
```

### Compatibilidad obligatoria

El juego actual usa `wid-game/src/services/player/PlayerProgressStore.js` como singleton exportando `playerProgressStore` y `PlayerState`.

La migración no debe reescribir escenas de forma masiva. La estrategia propuesta es:

1. mover la forma y métodos actuales de progreso a `createFunda()`;
2. crear un `FundaManager` que guarda entrenador, fundas y funda activa en una sola clave de `localStorage`;
3. mantener una fachada compatible, `playerProgressStore`, que delegue propiedades y métodos a la funda activa;
4. migrar automáticamente el guardado legacy `widPlayerProgress` hacia la funda tutorial Roger una sola vez.

Antes de implementar la fachada `Proxy`, hay que comprobar mediante búsqueda de código que no existan consumidores que dependan de identidad/referencias del objeto, enumeración de propiedades o serialización directa del singleton. La compatibilidad debe demostrarse con pruebas, no suponerse.

---

## 7. Orden técnico de trabajo

### Hito A — Recuperar diálogo real y crear red de seguridad

El repositorio actual contiene `wid-game` y `wid-proxy/` vacío. El frontend intenta usar:

- `POST /npc`;
- `POST /narrate`;
- cabecera `x-game-secret`;
- `VITE_PROXY_URL` y `VITE_GAME_SECRET` en `src/config/apiConfig.js`.

Antes de añadir una economía compleja hay que localizar el servidor perdido o reconstruir un proxy mínimo compatible. El fallback local permite navegar, pero no valida aprendizaje con LLM.

Acciones:

1. buscar una copia local/no versionada de `wid-proxy/server.js` antes de reconstruirlo;
2. si no existe, especificar y construir un proxy Express mínimo con endpoints `/health`, `/npc` y `/narrate`;
3. no incluir claves en Git; usar `.env.example`;
4. añadir pruebas de contrato para los cuerpos JSON esperados por `NpcDialogueService.js`;
5. hacer que el proxy pueda ejecutarse sin LLM mediante un modo de desarrollo explícito y seguro.

### Hito B — Migrar a funda única con retrocompatibilidad

Implementar el modelo `Funda` y el guardado nuevo, pero crear solo Roger. No crear pantalla de mercado todavía.

La migración está completa si el juego existente conserva XP, palabras, estadísticas, flags, diario y día para una partida anterior.

### Hito C — Mostrar contrato y economía

Añadir una ficha de contrato al HUD o al menú existente:

- nombre de funda y contrato;
- día actual / límite;
- renta acumulada;
- valor estimado y su desglose;
- siguiente objetivo.

El día debe avanzar sólo mediante hitos narrativos controlados, nunca por un temporizador real ni por visitar una pantalla. El vencimiento se comprueba en esos mismos puntos de transición y al cargar una partida.

### Hito D — Cierre de contrato de Roger

Añadir la primera prueba certificable (Bürgeramt/Frau Meier) y registrar `contratosSuperados`. Al final, presentar vender/comprar/perder de forma controlada. Esta pantalla es la primera validación real del bucle.

---

## 8. Skills y futuro mercado

Una **skill** es un paquete de entrenamiento reutilizable, no una palabra suelta. Puede incluir vocabulario, objetivo comunicativo, ejercicios, nivel recomendado y una certificación final. Ejemplos: `alemán_burocrático_A2`, `vocabulario_médico_de`, `presentaciones_ingles_B1`.

Fases:

1. **Catálogo curado local:** skills fijas, compradas con créditos ganados al superar evaluaciones.
2. **Publicación moderada:** extender Scene Builder para empaquetar historias y pruebas como una skill publicable.
3. **Mercado multijugador:** cuentas, servidor, auditoría, transacciones, moderación y precios dinámicos.

Una historia generada por un jugador no debe pasar automáticamente a ser una skill vendible: necesitará objetivos de aprendizaje, vocabulario verificable, prueba final y revisión de seguridad/calidad.

---

## 9. Papel de krk9

`krk9` es un producto open source independiente y será la primera carta pública para atraer colaboradores.

Su propuesta pública debe permanecer genérica: práctica conversacional por voz/texto con varios personajes, moderación de turnos, corrección amable y modelos intercambiables. No debe mencionar Roger, el Bürgeramt ni este juego narrativo.

Ruta de integración posterior, sin acoplar repositorios:

- **corto plazo:** desde la sala de aprendizaje, un enlace opcional a una práctica libre en Discord;
- **largo plazo:** extraer patrones útiles (turnos, personas, evaluación) como un protocolo o servicio independiente que pueda consumir el juego, sin importar ni depender del bot de Discord.

Antes de presentar krk9 a colaboradores se deben completar: configuración sin IDs hardcodeados de un solo usuario, `.env.example`, instalación reproducible, pruebas básicas, licencia explícita y una GUI demostrable.

---

## 10. Riesgos y principios

1. **No construir mercado antes de validar el contrato.** Multiplayer, pagos y contenido generado aumentan drásticamente alcance y riesgo de moderación.
2. **No depender de un LLM para reglas deterministas.** Progreso, renta, precio, estado y permisos se calculan localmente/en servidor con código explícito. El LLM interpreta diálogo y da feedback, no controla dinero.
3. **No castigar por tiempo real.** Los 30 días son días narrativos, controlados por progreso. Un jugador no pierde por no abrir el juego durante una semana.
4. **No ocultar el valor.** Fórmulas y fuentes de puntos deben ser comprensibles en la UI.
5. **No romper las partidas existentes.** La migración desde `widPlayerProgress` tiene que ser idempotente y reversible durante desarrollo.
6. **Privacidad y coste.** Ningún texto del jugador debe enviarse a un proveedor LLM sin aviso y configuración clara. Las claves viven sólo en variables de entorno.

---

## 11. Definición de “inicio terminado”

Esta fundación está lista cuando existe una demo local reproducible en la que:

- Roger carga como funda tutorial;
- se conserva el progreso de una partida anterior;
- un diálogo real o un modo de desarrollo explícito devuelve evaluación estructurada;
- las acciones actualizan XP, vocabulario, precisión y valor;
- la UI muestra plazo, renta y valor explicable;
- el Bürgeramt registra una certificación;
- una pantalla final permite vender o comprar y modifica créditos/reputación;
- el build de Vite termina sin errores y las pruebas cubren fórmulas, migración y estados límite.

Hasta ese punto, el proyecto no necesita mercado multijugador, ejercicio físico ni integración interna de krk9 para demostrar su propuesta de valor.

---

## 12. Decisión inmediata recomendada

El próximo paso concreto es **Hito A: localizar o reconstruir `wid-proxy`** y definir sus contratos de respuesta. Sin un backend funcional, cualquier mejora económica se puede desarrollar, pero el núcleo educativo seguirá dependiendo de mocks por palabras clave.

En paralelo, se puede diseñar y probar el dominio `Funda` de manera aislada, pero no se debe conectar todavía a todas las escenas hasta comprobar retrocompatibilidad con `PlayerProgressStore`.
