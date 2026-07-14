# VISIÓN: ESCENAS VIVAS, SKILLS POR NIVEL Y EL CREADOR UNIVERSAL DE HISTORIAS

**Proyecto:** Entrenador de Fundas (`roger_willkommen`)
**Fecha:** 2026-07-12
**Autor:** sesión de diseño con Vaclav
**Estado:** propuesta de dirección — no implementada todavía

---

## 0. Resumen para leer rápido

El jugador no solo "aprende alemán". Es un **entrenador de fundas** (mentes en cuerpos
alquilados, estilo *Altered Carbon*) que:

1. **Escala niveles** y, al hacerlo, **desbloquea skills** (habilidades de la funda o del
   entrenador: negociación, lectura en frío, calma bajo presión, dialecto regional…).
2. Juega primero **escenas predeterminadas** (la primera es el **Anmeldung 2026** en el
   Bürgeramt) escritas por el estudio.
3. Más adelante **crea sus propias escenas** mediante una licencia de "creador de escenas".
4. Todas las escenas usan **diálogos con arquitectura *language-room*** (una sala donde
   varios agentes de lenguaje interactúan, no un solo NPC caja-negra).
5. Cada escena se **visualiza con imágenes y videos cortos generados por LLMs** de última
   generación (difusión de vídeo + difusión de imagen).
6. Un **LLM planificador de historias** convierte *cualquier premisa* que le presente un
   creador con licencia en una escena completa, jugable y evaluable.

La pieza clave es el **Creador Universal de Escenas (CUE)**: un único motor que, dada una
historia cualquiera, produce estructura de escena, diálogos, assets visuales y criterios de
evaluación. El Anmeldung es solo *uno* de sus casos de uso.

---

## 1. Skills por niveles — la funda como personaje que crece

### 1.1 Concepto

Cada funda (y cada entrenador) tiene un árbol de **skills**. Subir de nivel otorga puntos
para desbloquearlos. Los skills no son cosméticos: **afectan mecánicamente la escena**.

```
NIVEL 1  ──▶  Skill base: "Presencia" (el NPC te toma en serio)
NIVEL 3  ──▶  "Alemán Coloquial" (desbloquea opciones de diálogo informales)
NIVEL 5  ──▶  "Ojo Clínico" (resaltas datos erróneos en el formulario antes de entregar)
NIVEL 7  ──▶  "Negociación Suave" (reducce penalización por pedir aclaración)
NIVEL 9  ──▶  "Dialecto Berlinés" (NPCs locales responden mejor)
NIVEL 12 ──▶  "Calma Bajo Presión" (el temporizador de la cita corre más lento)
```

### 1.2 Cómo se sienten en la escena

- **Sin skill:** el empleado del Bürgeramt te da respuestas cortas y formales; si dudas,
  penaliza autonomía.
- **Con "Alemán Coloquial":** aparecen ramas de diálogo tipo *"Na, wie läuft's?"* que
  humanizan la interacción y suben comprensión/expresión.
- **Con "Ojo Clínico":** al rellenar el Meldeschein, el juego marca en rojo `Geburtsort ≠
  Wohnort` antes de que Frau Meier lo vea — evitas un error administrativo.

### 1.3 Nuevas ideas en esta dirección

- **Skills de entrenador vs. skills de funda.** El entrenador (tú) desbloquea *licencias*
  (idiomas, programación, trading — ver `PRODUCT_BRIEF.md`); la funda desbloquea *skills
  conductuales*. Ambos árboles crecen en paralelo y se combinan.
- **Skills transferibles entre fundas.** Una funda "jubilada" puede legar ciertas skills a
  la siguiente (mecánica de herencia que conecta con la idea de subastas de fundas).
- **Skills que cambian la *evaluación*.** En vez de solo 8 criterios fijos, una skill puede
  añadir un criterio nuevo (ej. "Empatía" si tienes la skill de lectura emocional). El
  evaluador determinista debe leer la lista de skills activas y ajustar pesos/puertas.
- **Skill pasiva de "modo espectador".** A nivel alto desbloqueas crear escenas *para que
  otros jugadores las jueguen* — ese es el puente hacia la sección 3.

---

## 2. De escenas predeterminadas a escenas creadas por el jugador

### 2.1 Fase 1 — Escenas del estudio (predeterminadas)

El estudio entrega un catálogo pequeño pero pulido:

| Escena | Contexto | Contrato |
|---|---|---|
| **Anmeldung 2026** | Bürgeramt Berlin | Empadronamiento |
| **Arzttermin** | Clínica, pedir cita | Salud |
| **Jobcenter** | Oficina de empleo | Subsidio |
| **Mietvertrag** | Inmobiliaria | Alquiler |

Cada una tiene diálogo escrito a mano, assets generados por el estudio, y evaluación
calibrada. **Esto es lo que ya estamos construyendo** (Anmeldung es la primera).

### 2.2 Fase 2 — El jugador crea

Cuando el entrenador alcanza **nivel 10 + licencia de creador**, accede al **Modo Taller**.
Aquí no programa: **describe**. El CUE (sección 4) convierte su descripción en escena jugable.

Ejemplo de entrada de un creador:

> "Una funda recién llegada a Múnich tiene que devolver un paquete en la oficina de correos
> DHL porque llegó roto. El empleado solo habla bávaro fuerte. El reto es pedir el reembolso
> sin perder la calma."

El CUE produce: estructura de sala, 2 NPCs (empleado, otra persona en la cola que ayuda),
formulario implícito (número de seguimiento), diálogos ramificados, y criterios de evaluación
(¿consiguió el reembolso? ¿entendió el bávaro?).

### 2.3 Por qué esto es poderoso

- El juego **nunca se queda sin contenido**: la comunidad de creadores lo alimenta.
- Cada creador entrena su propio alemán **escribiendo** escenarios (vibe-coding aplicado a
  idiomas: aprendes mientras construyes).
- Las escenas creadas pueden **publicarse en el mercado** y generar créditos para el creador
  (economía ya esbozada en `PRODUCT_BRIEF.md`).

---

## 3. Arquitectura *language-room* para los diálogos

### 3.1 Qué es una "language room"

Hoy el diálogo es **1 NPC caja-negra**: envías mensaje, recibes respuesta. En una
*language room* hay **varios agentes de lenguaje en la misma sala**, cada uno con un rol,
y el jugador interactúa con la sala completa.

```
        ┌─────────────────────────────────────────┐
        │            LANGUAGE ROOM                │
        │                                           │
   NPC_A ──┐                              ┌── NPC_B │
 (Frau Meier,│                              │ (Marcus,│
  empleada)  │    ┌──────────────┐          │ ayudante)│
             ├──▶│ ORQUESTADOR   │◀─────────┤           │
             │   │ (router +     │          │           │
   NPC_C ──┘   │  memoria sala) │   NPC_D ──┘           │
 (cliente en   │                │  (cliente que         │
  la cola)     └──────┬─────────┘   molesta)            │
                      │                                   │
                      ▼                                   │
                 [JUGADOR / FUNDA] ◀─────────────────────┘
```

### 3.2 Roles dentro de la sala

- **Orquestador:** enruta quién habla, mantiene la memoria de la conversación, decide si
  interviene un NPC secundario (ej. el cliente de la cola se ofrece a ayudar → sube
  `consultas_clientes`, baja autonomía, exactamente como ya lo diseñamos).
- **NPC primario:** el que evalúa el contrato (Frau Meier).
- **NPC secundarios:** ayudantes, distractores, clientes — dan textura y opciones de ayuda.
- **Árbitro:** llama al evaluador determinista (los 8 criterios) al final, no durante.

### 3.3 Ventaja sobre el modelo 1-NPC

1. **Ayuda realista.** Pedir ayuda a un cliente de la sala es distinto a que el sistema te
   dé la respuesta: el cliente tiene *su propio* nivel de alemán y puede equivocarse.
2. **Emergencia.** Dos NPCs pueden contradirse; el jugador debe decidir a quién creer.
3. **Escalabilidad.** El CUE solo define "cuántos NPCs y qué rol" — la sala se arma sola.

### 3.4 Conexión con el evaluador existente

El evaluador determinista (`DialogueEvaluator.js`) **no cambia**. La language-room solo
produce la *transcripción* y el *estado de ayuda* (`consultas_clientes`) que el evaluador
ya consume. La frontera es limpia:

```
language-room  ──produce──▶  { dialogueHistory, consultasClientes, documentsPresented }
                                     │
                                     ▼
                            DialogueEvaluator  ──▶  veredicto + puntos
```

---

## 4. El Creador Universal de Escenas (CUE)

### 4.1 Principio

> **Una sola lógica para cualquier historia.** El creador no tiene "plantillas por tema"
> (una para médico, otra para oficina). Tiene un **schema universal de escena** y un LLM
> que mapea *cualquier premisa* a ese schema.

### 4.2 El schema universal

Toda escena, sea Anmeldung o devolver un paquete, se reduce a:

```json
{
  "meta": {
    "titulo": "string",
    "idioma_principal": "de",
    "nivel_min_recomendado": "A2",
    "licencia_requerida_para_crear": "creador_escenas"
  },
  "entorno": {
    "tipo_sala": "oficina_publica | clinica | comercio | calle | hogar",
    "ambiente": "descripción para generar imagen/vídeo",
    "objetos_interactivos": ["mostrador", "formulario", "terminal"]
  },
  "nodos_dialogo": [
    {
      "id": "recepcion",
      "rol": "empleado_principal",
      "personalidad": "formal, paciente pero apresurado",
      "idioma": "de",
      "entrada_inicial": "Guten Tag, was kann ich für Sie tun?",
      "ramas": [
        { "trigger": "saludo_formal", "respuesta": "...", "siguiente": "formulario" },
        { "trigger": "silencio", "respuesta": "Hallo? Brauchen Sie Hilfe?", "siguiente": "ayuda_sugerida" }
      ]
    },
    {
      "id": "cliente_cola",
      "rol": "secundario_ayudante",
      "personalidad": "amable, alemán básico",
      "puede_ayudar": true
    }
  ],
  "formulario": {
    "campos": [
      { "id": "vorname", "requerido": true, "del_perfil": "geburtsname" },
      { "id": "geburtsort", "requerido": true, "validacion": "≠ wohnort" }
    ]
  },
  "evaluacion": {
    "criterios": ["cumplimiento", "exactitud", "comprension", "expresion",
                  "idioma", "autonomia", "recuperacion", "seguridad"],
    "puertas": { "cumplimiento_min": 40, "exactitud_min": 40 },
    "objetivo_exito": "empleado entrega comprobante de registro"
  },
  "assets": {
    "estilo_visual": "fotorrealista gris berlinés, iluminación fría de oficina",
    "video_intro_segundos": 6,
    "imagenes_por_nodo": true
  }
}
```

### 4.3 El pipeline del CUE (el "mecanismo" que crea las escenas)

```
┌────────────────┐
│ ENTRADA        │  creador describe en lenguaje natural (o sube un guion)
└───────┬────────┘
        ▼
┌────────────────┐
│ LLM PLANIFICADOR│  (modelo razonador: descompone la historia en nodos,
│  (orquestador)  │   NPCs, formulario y criterios → JSON del schema 4.2)
└───────┬────────┘
        ▼
┌────────────────┐
│ VALIDADOR       │  (reglas duras: ¿tiene al menos 1 NPC principal? ¿tiene
│  DETERMINISTA   │   formulario o objetivo? ¿criterios válidos?) → rechaza
└───────┬────────┘     si falta algo, pide al LLM corregir (loop cerrado)
        ▼
┌────────────────┐
│ MOTOR VISUAL    │  (LLM de imagen genera fondos; LLM de vídeo genera
│  (imagen+video) │   intro de 6s y clips por nodo; se cachean en /assets)
└───────┬────────┘
        ▼
┌────────────────┐
│ COMPILADOR      │  convierte el JSON en instancias Phaser + language-room
│  DE ESCENA      │  (mapea nodos→hotspots, NPCs→agentes, formulario→UI)
└───────┬────────┘
        ▼
┌────────────────┐
│ ESCENA JUGABLE  │  el jugador entra; el evaluador determinista cierra
└────────────────┘
```

**El truco:** el LLM planificador **nunca decide el veredicto ni las recompensas** (igual
que el evaluador de diálogo actual). Solo produce *estructura*. La evaluación sigue siendo
código determinista, testeable sin LLM. Esto evita que el LLM "invente" reglas de juego.

---

## 5. El LLM planificador — ejemplo Anmeldung (y por qué es universal)

### 5.1 Entrada al planificador (lo que le presenta el creador)

```
"La funda VaUCLAV-S entra al Bürgeramt de Berlin. Tiene cita a las 10:00.
Debe entregar el Meldeschein relleno y su pasaporte. Frau Meier atiende.
Si se equivoca en la dirección, ella lo rechaza. Hay otros clientes en la
sala que pueden ayudar pero eso cuenta como dependencia."
```

### 5.2 Lo que el planificador "piensa" (razonamiento estructural)

El LLM no escribe un guion lineal. **Descompone en componentes del schema:**

1. **Entorno** → `oficina_publica`, mostrador + sala de espera + terminal.
2. **NPC principal** → Frau Meier, rol `empleado_principal`, personalidad del
   `scenes.json` ya existente (la reutiliza, no la inventa).
3. **NPCs secundarios** → 3 clientes en la sala (roles `secundario_ayudante`),
   porque la entrada dice "otros clientes pueden ayudar".
4. **Formulario** → Meldeschein: campos mapeados al perfil (`vorname`,
   `geburtsort`, `wohnort`…). Valida `geburtsort ≠ wohnort`.
5. **Objetivo de éxito** → "Frau Meier entrega el certificado de registro
   (Anmeldebestätigung)".
6. **Criterios** → los 8 estándar. Puertas: cumplimiento ≥ 40, exactitud ≥ 40.
7. **Ayuda** → cada interacción con cliente secundario incrementa
   `consultas_clientes` → baja autonomía (misma lógica que ya tiene
   `SceneEngineScene`).

### 5.3 Por qué es universal (la lógica no es de Anmeldung)

El planificador aplica **el mismo algoritmo de descomposición** a cualquier historia:

| Paso | Anmeldung | Devolver paquete DHL | Entrevista de trabajo |
|---|---|---|---|
| Entorno | oficina pública | comercio | oficina privada |
| NPC principal | empleada | empleado | reclutador |
| NPC secundario | cliente en cola | otra persona en cola | recepcionista |
| Formulario | Meldeschein | nº de seguimiento | CV / respuestas |
| Objetivo | certificado | reembolso | conseguir puesto |
| Puertas | dirección ≠ casa | nº válido | responder preguntas clave |

El **prompt del planificador** es genérico:

> "Dada la premisa, extrae: (1) entorno y objetos, (2) lista de NPCs con rol y
> personalidad, (3) formulario o condición de éxito con validación, (4) los 8
> criterios de evaluación y sus puertas, (5) qué cuenta como 'pedir ayuda'.
> Devuelve JSON conforme al schema universal. No inventes veredictos."

Eso es todo. Cambias la premisa, no el motor.

---

## 6. Generación de imágenes y vídeos con LLMs

### 6.1 Dónde entra en el pipeline

En el paso **Motor Visual** (4.3). Aprovechamos las **últimas ofertas de modelos**:

- **Imagen:** difusión de última generación (estilo fotorrealista o pintado, según
  `assets.estilo_visual`). Genera: fondo de la sala, retrato de cada NPC, iconos de
  objetos.
- **Vídeo corto:** modelos de difusión de vídeo generan la **intro de 6s** (la funda
  entra por la puerta del Bürgeramt, cámara lenta, ambiente berlinés gris) y clips
  cortos por nodo (ej. Frau Meier firma el certificado).

### 6.2 Flujo concreto

```
assets/
  scenes/
    anmeldung2026/
      bg_office.png          ← LLM imagen (prompt del entorno)
      npc_frau_meier.png     ← LLM imagen (prompt de personalidad)
      intro_6s.mp4           ← LLM vídeo (prompt: "funda entra, cámara lenta")
      node_certificate.mp4   ← LLM vídeo (prompt del nodo de éxito)
```

El compilador de escena (4.3) coloca estos assets en los hotspots correspondientes.
Si un asset falla al generarse, hay **fallback a gráficos vectoriales** (los que ya
tenemos en el juego) — el juego nunca se rompe por falta de asset.

### 6.3 Nuevas ideas en esta dirección

- **Vídeo reactivo al veredicto.** El clip final cambia: si apruebas, Frau Meier sonríe
  y entrega el certificado; si fallas, cierra la ventanilla. El LLM de vídeo recibe el
  veredicto como condición de generación (se genera bajo demanda la primera vez, luego se
  cachea).
- **Estilo coherente por creador.** Cada creador con licencia define una "paleta" (ej.
  "noir berlinés" vs. "anime suave") que se inyecta en todos los prompts de imagen/vídeo
  de sus escenas → su catálogo se reconoce visualmente.
- **Imagen como contexto para el diálogo.** El LLM de diálogo puede *ver* la imagen
  generada de la sala para anclar las respuestas ("mira el formulario que tienes en la
  mano"). Multimodalidad real, no solo texto.
- **Coste por uso real.** Como no hay tarifa fija (ver `PRODUCT_BRIEF.md`), generar
  assets para una escena nueva descuenta créditos del creador — alinear coste con valor.

---

## 7. Cómo se junta todo en la partida real

```
Jugador sube a NIVEL 10
        │
        ▼
Desbloquea SKILL "Modo Taller" + LICENCIA creador_escenas
        │
        ▼
Modo Taller: describe "devolver paquete DHL en Múnich"
        │
        ▼
CUE: LLM planificador → schema JSON → validador → motor visual (img+video) → compilador
        │
        ▼
Escena "DHL Múnich" JUGABLE con language-room (empleado + cliente en cola)
        │
        ▼
Jugador la juega → DialogueEvaluator (8 criterios) → veredicto + XP
        │
        ▼
Creador publica en MERCADO → otros jugadores la juegan → creador gana créditos
```

El ciclo cierra: **quien entrena alemán escribiendo, también entrena jugando lo que
otros escribieron.** El juego se alimenta solo.

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| LLM planificador produce JSON inválido | Validador determinista en bucle cerrado: rechaza y pide corrección hasta que pasa |
| LLM "inventa" veredictos o recompensas | El planificador **solo** estructura; evaluación queda en código determinista (como hoy) |
| Assets de vídeo caros o lentos | Cacheo agresivo + fallback a gráficos vectoriales existentes |
| Escenas creadas tóxicas/NSFW | Filtro de contenido antes del compilador + reporte de comunidad + cuarentena |
| Inconsistencia visual entre creadores | Paleta por creador obligatoria en el schema |
| Skills rompen el balance del evaluador | El evaluador lee la lista de skills activas y ajusta pesos/puertas de forma declarativa |

---

## 9. Siguiente paso concreto (si Vaclav quiere avanzar)

1. **Maquetar el schema universal** (sección 4.2) como `sceneSchema.json` en el repo.
2. **Prototipar el LLM planificador** con un prompt genérico contra la entrada de
   Anmeldung, verificando que produce el JSON correcto (sin generar assets todavía).
3. **Conectar el JSON al compilador** que ya maneja `scenes.json` hoy — reusar la
   infraestructura de `SceneEngineScene`.
4. **Añadir el árbol de skills** al `PlayerProgressStore` (fase 1: solo las 6 de 1.1).
5. **Motor visual** como paso final, detrás de un feature-flag para no bloquear el juego.

---

*Documento vivo. Cuando se implemente algo, moverlo de "propuesta" a "hecho" y enlazar
el commit.*
