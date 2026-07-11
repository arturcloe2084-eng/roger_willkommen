# DESAFÍO ANMELDUNG 2026 — Especificación de examen

Este documento define el primer desafío como datos verificables. Su objetivo es que una funda complete el empadronamiento (Anmeldung) en un Bürgeramt alemán. No hay acompañante fijo: el jugador puede pedir ayuda a **cualquier cliente** que esté en la sala de espera. Consultar a gente baja la puntuación según cuántas personas pregunta.

La fuente de autoridad para el formulario es el documento oficial alemán *Anmeldung / Meldeschein* (campos estándar de un Bürgeramt). No se inventan campos.

---

## 1. Perfil de prueba (ficticio, seguro)

Se usa por defecto para no exponer datos reales. El jugador puede cambiarlo por su perfil simulado.

```json
{
  "alias": "Vaclav S.",
  "geburtsname": "Vaclav",
  "familienname": "Sindelaru",
  "geburtsdatum": "1979-03-12",
  "geburtsort": "Bratislava",
  "staatsangehorigkeit": "Slowakei",
  "geschlecht": "männlich",
  "wohnung": {
    "straße": "Kollwitzstraße",
    "hausnummer": "3",
    "postleitzahl": "10405",
    "ort": "Berlin",
    "einzug": "2026-01-15"
  },
  "fruhere_namen": [],
  "kontakt": {
    "telefon": "+49 30 00000000",
    "e_mail": "vaclav.s.example@mail.de"
  },
  "idiomas": [
    { "idioma": "Alemán", "nivel_declarado": "A2+", "nivel_comprobado": null, "rol": "principal" },
    { "idioma": "Inglés", "nivel_declarado": "C1", "nivel_comprobado": "C1", "rol": "apoyo" },
    { "idioma": "Español", "nivel_declarado": "nativo", "nivel_comprobado": "nativo", "rol": "interfaz" }
  ],
  "documentos_esperados": ["Pasaporte", "Contrato de alquiler (Mietvertrag)", "Formulario rellenado"]
}
```

---

## 2. Campos del formulario (Anmeldung / Meldeschein)

Estos son los campos que la funda debe rellenar o confirmar. El evaluador comprueba **exactitud contra el perfil**, no solo si "suena bien".

| Campo (DE) | Significado | Valor esperado del perfil |
|---|---|---|
| Vorname | Nombre | Vaclav |
| Name / Familienname | Apellido | Sindelaru |
| Geburtsdatum | Fecha de nacimiento | 1979-03-12 |
| Geburtsort | Lugar de nacimiento | Bratislava |
| Staatsangehorigkeit | Nacionalidad | Slowakei |
| Geschlecht | Sexo | männlich |
| Straße + Hausnummer | Calle y número | Kollwitzstraße 3 |
| Postleitzahl (PLZ) | Código postal | 10405 |
| Wohnort | Ciudad | Berlin |
| Einzugdatum | Fecha de mudanza | 2026-01-15 |
| Frühere Namen | Nombres anteriores | (vacío) |
| Telefon / E-Mail | Contacto | ver perfil |

Documentos que debe presentar: **Pasaporte**, **Mietvertrag** (contrato de alquiler), **formulario rellenado**.

---

## 3. Personal de la oficina (NPCs)

Basado en `scenes.json` → escena `amt`.

### Frau Meier — ventanilla 3 (evaluadora principal)
- Rol: funcionaria del Einwohnermeldeamt.
- Habla solo alemán laboral, clara y directa.
- Pide datos en orden estricto.
- No improvisa fuera del procedimiento.
- Si faltan datos o son incorrectos → "tocha volver otro día" (no aprobado).

Frases típicas que debe entender/producir la funda:
- `Guten Tag. Ich möchte mich anmelden.`
- `Mein Name ist Vaclav Sindelaru.`
- `Ich bin am zwölften März neunzehnhunderneunundsiebzig geboren.`
- `Ich wohne in der Kollwitzstraße 3, Berlin.`
- `Meine Postleitzahl ist zehn vier null fünf.`
- `Ich bin slowakische Staatsangehorige.`
- `Hier ist mein Reisepass und mein Mietvertrag.`

### Marcus — asesor de Krankenkasse (apoyo opcional)
- Rol: asesor de seguro médico.
- No es parte del examen de aprobación, pero puede explicar el sistema.
- Se usa para preparación, no para el veredicto principal.

### Clientes de la sala de espera (fuente de ayuda)
- Son NPCs pasivos: el jugador puede dirigirse a ellos preguntando "¿cómo se dice X?" o "¿qué documento falta?".
- **No son evaluadores.** Su ayuda es válida dentro del juego, pero **resta puntos** (ver sección 5).
- Deben responder solo vocablos/frases cortas, no resolver el trámite por el jugador.

---

## 4. Flujo del examen

```text
1. Entrar a la sala de espera (amt).
2. Preparación opcional: crucigrama, quiz del formulario, practica con Marcus.
3. Ventanilla Frau Meier:
   a. Saludo y declaración de intención (Anmeldung).
   b. Meier pide datos en orden.
   c. El jugador responde en alemán (puede pedir ayuda a clientes).
   d. Meier pide documentos.
   e. El jugador presenta Pasaporte + Mietvertrag + formulario.
4. Rellenar el formulario simulado con los datos del perfil.
5. Evaluador de Diálogo analiza toda la conversación + formulario.
6. Resultado: aprobado / aprobado-con-ayuda / no aprobado.
```

---

## 5. Regla de ayuda a clientes (NUEVA, acordada)

- El jugador **puede** pedir ayuda a cualquier cliente de la sala.
- Cada persona diferente consultada **baja la puntuación de autonomía**.
- La penalización es proporcional al número de consultas distintas:

```text
ayuda_penalizacion = min(consultas_distintas, 4) × 8   # máximo -32 puntos
```

- 0 consultas → autonomía plena.
- 1 consulta → -8.
- 2 consultas → -16.
- 3 consultas → -24.
- 4 o más → -32 (techo).

El veredicto "aprobado" (sin sufijo) requiere **0 consultas a clientes**. Si hubo ayuda pero el resultado administrativo es correcto, el veredicto es **"aprobado con ayuda"**. Si faltan datos críticos o el formulario es incorrecto, **"no aprobado"** aunque haya consultado poco.

---

## 6. Criterios del Evaluador de Diálogo

El evaluador devuelve puntuaciones separadas (0–100) por:

1. **Cumplimiento administrativo** — ¿completó el paso en ventanilla?
2. **Exactitud de información** — ¿los datos dichos/formulario coinciden con el perfil?
3. **Comprensión** — ¿entendió las preguntas de Meier?
4. **Expresión** — ¿respuestas comprensibles y apropiadas?
5. **Idioma** — vocabulario, gramática, registro formal.
6. **Autonomía** — 100 menos penalización de ayuda (sección 5).
7. **Recuperación** — ¿pudo pedir repetición/aclaración/corrección?
8. **Seguridad** — ¿evitó inventar datos o aceptar lo que no entendía?

### Veredicto

```text
aprobado            → cumplimiento >= 80 Y exactitud >= 90 Y consultas_clientes == 0
aprobado_con_ayuda → cumplimiento >= 80 Y exactitud >= 90 Y consultas_clientes >= 1
no_aprobado        → cumplimiento < 80 O exactitud < 90
```

### Salida estructurada (esquema para el LLM)

```json
{
  "veredicto": "aprobado | aprobado_con_ayuda | no_aprobado",
  "puntos": {
    "cumplimiento": 0, "exactitud": 0, "comprension": 0,
    "expresion": 0, "idioma": 0, "autonomia": 0,
    "recuperacion": 0, "seguridad": 0
  },
  "consultas_clientes": 0,
  "errores_administrativos": ["Falta PLZ"],
  "errores_linguisticos": ["Confusión dato/ort"],
  "evidencias": ["Jugador dijo: '...' en respuesta a 'Wohnort?'"],
  "ejercicios_recomendados": ["Direcciones", "Fechas"],
  "progreso_otorgado": { "aleman": { "xp": 0, "palabras": 0 } },
  "confianza": 0.0,
  "requiere_revision_humana": false
}
```

---

## 7. Tres fixtures de prueba (para validar el evaluador antes de la GUI)

### Fixture A — Aprobado sin ayuda
- Jugador entra, saluda, da todos los datos correctos en alemán.
- Presenta los 3 documentos.
- Rellena el formulario sin errores.
- 0 consultas a clientes.
- **Esperado:** `aprobado`, autonomía 100, exactitud ~100.

### Fixture B — Aprobado con ayuda
- Jugador se traba con "Postleitzahl" y pregunta a un cliente sentado: "Wie sagt man 'código postal'?".
- Cliente le da la palabra. Jugador la usa bien.
- Resto correcto, formulario OK.
- 1 consulta.
- **Esperado:** `aprobado_con_ayuda`, autonomía 92, exactitud ~100.

### Fixture C — No aprobado
- Jugador da "Wohnort: Hamburg" (perfil dice Berlin).
- Olvida presentar el Mietvertrag.
- Meier cierra: vuelva con el contrato.
- 0 consultas.
- **Esperado:** `no_aprobado`, exactitud baja, cumplimiento < 80.

---

## 8. Próximo paso técnico

1. Escribir `DialogueEvaluator` (función pura) que tome la conversación + perfil + formulario y devuelva la salida de sección 6.
2. Probar con las 3 fixtures (A/B/C) antes de tocar la GUI.
3. Conectar la salida a `PlayerProgressStore`/Funda y al informe visible.
4. Solo después, diseñar la pantalla de contrato → preparación → desafío → informe.
