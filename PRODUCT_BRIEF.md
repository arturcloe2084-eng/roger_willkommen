# Entrenador de Fundas — Dirección de producto

Este documento reemplaza como dirección principal cualquier propuesta anterior que describa un recorrido por apartamento, edificio, vecinos, calle u oficina. Ese contenido puede conservarse en Git como material histórico, pero **no forma parte del primer desafío**.

## 1. Primer desafío: Contrato Anmeldung 2026

El juego comienza directamente con un contrato profesional:

> Un cliente necesita una funda capaz de acudir a un Bürgeramt en Alemania durante 2026, comunicarse con sus empleados y completar correctamente el formulario de Anmeldung. Puede recibir ayuda de una persona acompañante dentro de la oficina.

No hace falta justificar quién era Roger, dónde vive ni cómo llegó a Alemania. El contrato es una unidad de aprendizaje, equivalente a una lección convencional, pero presentada como un encargo realista con riesgo, preparación y evaluación.

### Lo que se elimina del recorrido inicial

- edificio y escalera;
- interacciones con vecinos;
- calle y oficina laboral;
- menú interactivo del cuarto/apartamento;
- misterio del inquilino anterior;
- obligación de explicar narrativamente por qué se llega al Bürgeramt.

Los archivos y recursos actuales no se borran de inmediato. Primero se desconectan del recorrido inicial y se conserva la posibilidad de reutilizarlos en otros contratos.

## 2. Qué debe enseñar la GUI con este ejemplo

La GUI debe demostrar que la aplicación es más realista de lo que parece a primera vista.

El usuario debe entender, mediante una guía visible y breve:

1. **Leer el contrato:** qué debe lograr la funda y cómo se medirá.
2. **Revisar la funda:** idiomas actuales, nivel de cada idioma, conocimientos relevantes y datos personales necesarios para el formulario.
3. **Prepararse:** practicar vocabulario, escuchar preguntas típicas, revisar documentos y ensayar respuestas.
4. **Entrar al desafío:** dialogar con los empleados del Bürgeramt y pedir ayuda al acompañante cuando sea necesario.
5. **Rellenar la Anmeldung:** trasladar datos del perfil al formulario sin inventarlos.
6. **Ser evaluado:** recibir una explicación de qué se hizo bien, qué faltó, qué errores fueron graves y qué practicar después.
7. **Actualizar la funda:** registrar progreso real, nueva experiencia, reputación y evidencia de competencia.

La interfaz no debe empezar enseñando todos los sistemas del universo. Debe enseñar una sola secuencia completa: **contrato → preparación → actuación → evaluación → mejora**.

## 3. Perfil del usuario = currículum vivo de la funda

Al crear su perfil, el usuario no rellena una configuración abstracta. Está construyendo el currículum de su propia funda.

Debe incluir, con controles de privacidad y edición:

- nombre o alias;
- país y ciudad de origen;
- datos requeridos por el desafío de Anmeldung;
- idiomas conocidos;
- nivel independiente en cada idioma;
- objetivos de aprendizaje;
- conocimientos profesionales y licencias;
- experiencias y certificaciones obtenidas dentro del juego.

Los datos sensibles no deben enviarse a un LLM ni publicarse por defecto. Para demostraciones se debe ofrecer un perfil ficticio. La app debe distinguir entre:

- **dato personal real**, usado para practicar un formulario realista;
- **dato simulado**, usado para jugar sin exponer información privada;
- **competencia comprobada**, respaldada por una evaluación dentro del juego;
- **declaración del usuario**, todavía no comprobada.

## 4. Funda multilingüe

Una funda puede conocer y practicar varios idiomas simultáneamente. No existe un único `targetLanguage` global.

Ejemplo inicial de Vaclav:

```text
Alemán: nivel superior a básico, en mejora activa
Inglés: nivel avanzado, en mantenimiento/práctica
Español: idioma de interfaz y apoyo
```

Cada idioma mantiene sus propios datos:

- nivel declarado;
- nivel comprobado;
- vocabulario aprendido;
- precisión de diálogo;
- comprensión oral;
- producción escrita;
- última práctica;
- objetivos y skills asociadas.

Una misión puede tener un idioma principal y permitir un idioma auxiliar. El evaluador debe distinguir entre resolver la tarea en alemán y depender demasiado del idioma auxiliar.

## 5. Evaluador de diálogo del Bürgeramt

El evaluador no debe limitarse a buscar palabras clave ni a decidir “correcto/incorrecto”. Debe valorar el cumplimiento del contrato.

### Entradas

- objetivo actual del trámite;
- perfil de la funda y datos permitidos;
- nivel esperado de alemán;
- historial completo del diálogo;
- intervención del acompañante, si ocurrió;
- campos del formulario;
- reglas y documentación del desafío 2026.

### Criterios separados

1. **Cumplimiento:** ¿logró completar el paso administrativo?
2. **Exactitud de información:** ¿los datos dados coinciden con el perfil/formulario?
3. **Comprensión:** ¿entendió las preguntas relevantes?
4. **Expresión:** ¿sus respuestas fueron comprensibles y apropiadas?
5. **Idioma:** vocabulario, gramática y registro formal.
6. **Autonomía:** ¿cuánta ayuda necesitó y para qué?
7. **Recuperación:** ¿pudo pedir repetición, aclaración o corregirse?
8. **Seguridad:** ¿evitó inventar información o aceptar algo que no entendía?

### Resultado estructurado

El evaluador debe devolver por separado:

- aprobado / aprobado con ayuda / no aprobado;
- puntos por criterio;
- evidencias concretas del diálogo;
- errores administrativos críticos;
- correcciones lingüísticas prioritarias;
- ejercicios recomendados;
- progreso otorgado;
- confianza de la evaluación y necesidad de revisión humana.

El LLM puede analizar el diálogo, pero **no decide directamente dinero, reputación ni propiedad de una funda**. El juego convierte el informe estructurado en recompensas mediante reglas claras.

## 6. Guiones creados por usuarios

No todas las escenas tienen el mismo valor. Un saludo con vecinos no debe puntuar igual que completar un trámite con documentos, objetivos y consecuencias.

Un futuro **Evaluador de Guiones** analizará:

- utilidad práctica;
- complejidad comunicativa;
- claridad del objetivo;
- cantidad y calidad de decisiones;
- realismo;
- posibilidad de evaluar el resultado;
- vocabulario y nivel lingüístico;
- originalidad;
- seguridad, privacidad y contenido inapropiado;
- facilidad para reutilizarlo como skill.

La IA propone una puntuación y explica sus razones. Para publicar o vender contenido, la puntuación automática no basta por sí sola: habrá controles contra plagio, contenido engañoso y generación masiva de baja calidad.

## 7. Fundas perdidas y subastas

Las fundas alquiladas pertenecen a una entidad propietaria. Si un entrenador pierde el contrato, la funda conserva parte de lo aprendido y vuelve a una subasta.

Esto crea fundas con historia real:

- conocimientos adquiridos por entrenadores anteriores;
- idiomas en niveles distintos;
- certificaciones superadas;
- puntos débiles conocidos;
- precio ajustado a su estado y demanda.

La funda personal inicial de Vaclav puede representarse como una funda previamente entrenada: inglés avanzado y alemán por encima del nivel básico. Así el producto se prueba con progreso real, no únicamente desde nivel cero.

Para evitar abuso futuro, la subasta deberá registrar procedencia, cambios de propietario, evaluaciones y límites a transferencias artificiales entre cuentas.

## 8. Quién contrata y quién posee las fundas

La respuesta definitiva queda abierta, pero el prototipo usará dos roles neutrales:

- **Cliente contratante:** organización o persona que necesita una capacidad demostrable. En el primer desafío solicita autonomía para completar la Anmeldung.
- **Entidad de custodia:** empresa/institución que posee o administra fundas alquiladas, contratos, recuperaciones y subastas.

No es necesario revelar todavía si estas organizaciones son públicas, privadas o controladas por una IA. Esa ambigüedad permite cambiar el tono del mundo después sin bloquear el prototipo.

Opciones a explorar más adelante:

- agencias de integración y movilidad;
- empresas que preparan trabajadores para destinos internacionales;
- cooperativas de propietarios de fundas;
- aseguradoras de capacidades cognitivas;
- una autoridad que licencia entrenadores y certifica skills;
- clientes individuales que publican contratos en un mercado.

## 9. Licencias del entrenador

El entrenamiento lingüístico es la primera licencia, no la única actividad posible.

Una licencia define qué tipo de mejora mental puede ofrecer un entrenador:

- idiomas;
- programación;
- matemáticas/ciencias;
- trading y análisis financiero;
- otras especialidades futuras.

La mención accidental de trading en `krk9` no se integra ahora como código ni documentación del proyecto público. Se conserva como posible **licencia futura**. Cada licencia puede convertirse en una aplicación o módulo especializado conectado al mismo mundo económico.

El primer producto valida solamente la licencia de idiomas. No se debe distraer el desarrollo inicial construyendo trading.

## 10. Modelo económico de producción

Principio confirmado:

> No habrá una tarifa mensual fija obligatoria. El coste para el usuario se ajustará al progreso o al uso real.

Este principio necesita una implementación justa. Progreso no puede significar “cobrar más por aprender mejor” ni permitir que un LLM facture sin límite.

Opciones a experimentar:

- pagar créditos sólo al iniciar evaluaciones certificadas;
- paquetes de intentos para desafíos concretos;
- coste basado en consumo real de voz/IA, con límite visible;
- contenido básico y práctica local gratuitos;
- comisión sólo cuando se venda una skill o se cierre un contrato dentro del mercado;
- becas/créditos ganados por progreso comprobado.

Requisitos no negociables:

- mostrar el coste antes de cada acción pagada;
- permitir fijar un límite máximo;
- no cobrar por días de inactividad;
- no castigar errores lingüísticos con costes ocultos;
- separar moneda del juego de dinero real;
- evitar mecanismos de azar, apuestas o *pay-to-win*;
- ofrecer exportación y eliminación de datos.

La fórmula comercial concreta queda pendiente de pruebas de coste y regulación.

## 11. Alcance del primer prototipo

### Incluido

- entrada directa al contrato Anmeldung 2026;
- perfil/currículum con varios idiomas;
- preparación lingüística específica;
- formulario de Anmeldung simulado;
- diálogo con empleados;
- acompañante opcional;
- evaluador estructurado de diálogo;
- informe de resultados y actualización del progreso de la funda;
- recorrido guiado por la GUI.

### No incluido todavía

- apartamento, edificio, vecinos y calle como trama obligatoria;
- mercado multijugador real;
- subastas operativas;
- creación y venta pública de skills;
- otras licencias (incluido trading);
- pagos reales;
- entrenamiento físico.

## 12. Próximo paso recomendado

Antes de programar la pantalla, escribir el contrato completo del desafío Anmeldung como datos verificables:

1. qué perfil ficticio o real se usará;
2. qué formulario 2026 se simulará y qué campos tendrá;
3. qué documentos se esperan;
4. qué empleados/interacciones habrá;
5. cuándo puede intervenir el acompañante;
6. qué cuenta como éxito, éxito con ayuda o fracaso;
7. qué debe devolver exactamente el Evaluador de Diálogo.

Después se construye una prueba mínima del evaluador con conversaciones preparadas: una aprobada, una aprobada con ayuda y una fallida. Sólo cuando distinga correctamente esos tres casos se conecta a la GUI.
