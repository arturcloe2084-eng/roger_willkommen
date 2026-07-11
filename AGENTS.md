# Instrucciones para agentes — Entrenador de Fundas

## Fuente de verdad

- Leer primero `PRODUCT_BRIEF.md`.
- `PROJECT_GENESIS.md` es histórico: sus secciones sobre el recorrido apartamento → vecinos → calle → oficina quedaron reemplazadas.
- El primer desafío entra directamente al contrato Anmeldung 2026 en el Bürgeramt.

## Objetivos simultáneos

Cada sesión debe producir valor en tres ejes cuando sea razonable:

1. **Producto:** avanzar una parte verificable del juego.
2. **Programación:** explicar a Vaclav una decisión o fragmento concreto del código trabajado, con lenguaje accesible.
3. **Idioma:** extraer vocabulario/frases auténticas del desafío y permitir que Vaclav practique desde su nivel real.

No convertir todo en una clase. Primero terminar la tarea; después explicar un concepto pequeño y comprobar comprensión con una pregunta breve o un ejercicio.

## Método de trabajo

- Responder en español salvo que el ejercicio lingüístico requiera otro idioma.
- Verificar archivos, funciones, pruebas y estado Git con herramientas antes de afirmarlos.
- Para cambios de comportamiento: TDD, un caso vertical cada vez.
- Mantener el alcance del primer prototipo: contrato, perfil multilingüe, preparación, formulario, diálogo, evaluación e informe.
- No construir aún mercado, subastas, pagos reales, trading ni entrenamiento físico.
- No borrar las escenas antiguas al simplificar el flujo; desconectarlas y conservarlas hasta decidir su reutilización.
- No enviar datos personales reales a proveedores LLM. Usar perfiles ficticios por defecto y pedir autorización explícita para datos reales.
- El LLM analiza lenguaje; reglas deterministas controlan dinero, reputación, progreso y estados.
- Ejecutar build/pruebas reales antes de declarar una tarea terminada.

## Evidencia educativa

Toda evaluación lingüística debe separar:

- cumplimiento administrativo;
- comprensión;
- expresión;
- exactitud de datos;
- uso de ayuda;
- errores de idioma;
- evidencias textuales concretas.

No aceptar puntuaciones sin explicación ni feedback genérico.

## Mentoría de programación

Al tocar código:

- explicar qué archivo se cambió y por qué;
- elegir un concepto del cambio (estado, función, JSON, API, prueba, etc.);
- mostrar un ejemplo basado en el código real;
- pedir a Vaclav que prediga o explique una parte pequeña cuando esté participando como aprendiz;
- registrar decisiones duraderas en documentación, no sólo en el chat.

## Mantenimiento de skills

- Cargar `funda-game-coach` en tareas relacionadas con este proyecto.
- Si el flujo real descubre un paso, error o criterio reutilizable que falta en el skill, actualizarlo inmediatamente.
- No guardar estado temporal, commits o tareas completadas como memoria permanente.
- No crear skills muy estrechos por cada incidencia; ampliar el skill paraguas salvo que exista un procedimiento claramente independiente.
