/**
 * DialogueEvaluator — Función pura que evalúa el resultado de un desafío.
 * No depende de Phaser ni de DOM. No usa LLM: es lógica de evaluación.
 *
 * Entrada: historial de diálogo, perfil de la funda, campos del formulario,
 *          número de consultas a clientes.
 * Salida:  veredicto + 8 puntuaciones + evidencias + ejercicios recomendados.
 *
 * Especificación: DESAFIO_ANMELDUNG_2026.md sección 6.
 */

// ─── Campos obligatorios del formulario Anmeldung ───────────────────────
const REQUIRED_FORM_FIELDS = [
    'vorname', 'familienname', 'geburtsdatum', 'geburtsort',
    'staatsangehorigkeit', 'geschlecht', 'strasse', 'hausnummer',
    'postleitzahl', 'wohnort', 'einzugdatum',
];

// ─── Documentos obligatorios ─────────────────────────────────────────────
const REQUIRED_DOCUMENTS = ['Reisepass', 'Mietvertrag'];

// ─── Normalizador de texto ───────────────────────────────────────────────
function normalize(str) {
    return String(str || '').trim().toLowerCase()
        .replace(/[äæ]/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9\s@.\-/]/g, '')
        .replace(/\s+/g, ' ');
}

/**
 * Compara un valor del formulario contra el perfil.
 * Retorna true si coinciden (ignorando mayúsculas, espacios y umlauts).
 */
function fieldMatches(formValue, profileValue) {
    return normalize(formValue) === normalize(profileValue);
}

/**
 * Analiza el historial de diálogo en busca de evidencias de comprensión,
 * expresión, recuperación y seguridad.
 */
function analyzeDialogue(dialogueHistory) {
    const playerMessages = dialogueHistory.filter(m => m.role === 'player');
    const npcMessages = dialogueHistory.filter(m => m.role === 'npc');

    let comprension = 70;   // base: respondió algo
    let expresion = 65;     // base: dijo algo comprensible
    let idioma = 60;        // base: intentó hablar alemán
    let recuperacion = 50;  // base: no pidió repetición
    let seguridad = 70;    // base: no inventó datos visibles

    const evidencias = [];
    const erroresLinguisticos = [];

    for (const msg of playerMessages) {
        const text = normalize(msg.text);

        // Evidencia: saludo formal
        if (text.includes('guten tag') || text.includes('ich moechte mich anmelden')) {
            comprension += 5;
            expresion += 5;
            evidencias.push(`Saludo formal correcto: "${msg.text}"`);
        }

        // Evidencia: presentó documentos
        if (text.includes('reisepass') || text.includes('pass')) {
            evidencias.push(`Mencionó pasaporte: "${msg.text}"`);
        }
        if (text.includes('mietvertrag') || text.includes('vertrag')) {
            evidencias.push(`Mencionó contrato de alquiler: "${msg.text}"`);
        }

        // Evidencia: petición de repetición (recuperación positiva)
        if (text.includes('wie bitte') || text.includes('koennen Sie das wiederholen') ||
            text.includes('noch einmal') || text.includes('verstehe ich nicht')) {
            recuperacion += 15;
            evidencias.push(`Pidió repetición/aclaración: "${msg.text}"`);
        }

        // Evidencia: confusión entre conceptos (error lingüístico)
        if (text.includes('geburtsort') && text.includes('wohnort')) {
            // Confusión posible — se verifica más fino en field check
            erroresLinguisticos.push('Posible confusión entre Geburtsort y Wohnort');
        }

        // Penalización: no respondió a la pregunta (texto muy corto)
        if (text.length < 4 && !text.includes('ja') && !text.includes('nein')) {
            expresion -= 10;
        }

        // Penalización: respondió en español o inglés (dependencia de idioma aux)
        if (text.includes('no entiendo') || text.includes('i don') || text.includes('what')) {
            idioma -= 8;
            expresion -= 5;
            erroresLinguisticos.push(`Respuesta en idioma auxiliar: "${msg.text}"`);
        }
    }

    // Verificar si respondió a todas las preguntas del NPC
    const npcQuestions = npcMessages.filter(m =>
        m.text.includes('?') || normalize(m.text).includes('bitte')
    );
    const playerResponses = playerMessages.length;
    if (npcQuestions.length > 0 && playerResponses >= npcQuestions.length) {
        comprension += 10;
    }

    // Acotar valores 0-100
    comprension = Math.max(0, Math.min(100, comprension));
    expresion = Math.max(0, Math.min(100, expresion));
    idioma = Math.max(0, Math.min(100, idioma));
    recuperacion = Math.max(0, Math.min(100, recuperacion));
    seguridad = Math.max(0, Math.min(100, seguridad));

    return { comprension, expresion, idioma, recuperacion, seguridad, evidencias, erroresLinguisticos };
}

/**
 * Calcula la puntuación de cumplimiento administrativo.
 * Verifica que el formulario tiene los campos obligatorios rellenos
 * y que los documentos requeridos fueron presentados.
 */
function calcularCumplimiento(formFields, documentsPresented) {
    let filled = 0;
    const erroresAdmin = [];

    for (const field of REQUIRED_FORM_FIELDS) {
        if (formFields[field] && String(formFields[field]).trim().length > 0) {
            filled++;
        } else {
            erroresAdmin.push(`Falta campo: ${field}`);
        }
    }

    for (const doc of REQUIRED_DOCUMENTS) {
        if (!documentsPresented.includes(doc)) {
            erroresAdmin.push(`Falta documento: ${doc}`);
        }
    }

    const docsPresented = REQUIRED_DOCUMENTS.filter(d => documentsPresented.includes(d)).length;
    const totalRequired = REQUIRED_FORM_FIELDS.length + REQUIRED_DOCUMENTS.length;
    const totalPresent = filled + docsPresented;

    // Cumplimiento = porcentaje de ítems completos
    const cumplimiento = Math.round((totalPresent / totalRequired) * 100);

    return { cumplimiento, erroresAdmin };
}

/**
 * Calcula la puntuación de exactitud de información.
 * Compara los campos del formulario contra el perfil.
 */
function calcularExactitud(formFields, profile) {
    let correctos = 0;
    let verificados = 0;
    const erroresAdmin = [];

    const fieldMap = {
        vorname: profile.geburtsname,
        familienname: profile.familienname,
        geburtsdatum: profile.geburtsdatum,
        geburtsort: profile.geburtsort,
        staatsangehorigkeit: profile.staatsangehorigkeit,
        geschlecht: profile.geschlecht,
        strasse: profile.wohnung?.strasse,
        hausnummer: profile.wohnung?.hausnummer,
        postleitzahl: profile.wohnung?.postleitzahl,
        wohnort: profile.wohnung?.ort,
        einzugdatum: profile.wohnung?.einzug,
    };

    for (const [field, expected] of Object.entries(fieldMap)) {
        if (!expected) continue;
        if (!formFields[field] || String(formFields[field]).trim().length === 0) continue;
        verificados++;
        if (fieldMatches(formFields[field], expected)) {
            correctos++;
        } else {
            erroresAdmin.push(
                `${field}: formulario="${formFields[field]}", perfil="${expected}"`
            );
        }
    }

    if (verificados === 0) return { exactitud: 0, erroresAdmin };
    const exactitud = Math.round((correctos / verificados) * 100);
    return { exactitud, erroresAdmin };
}

/**
 * Calcula la puntuación de autonomía.
 * Fórmula: 100 - min(consultas_clientes, 4) * 8
 */
function calcularAutonomia(consultasClientes) {
    const penalizacion = Math.min(consultasClientes, 4) * 8;
    return Math.max(0, 100 - penalizacion);
}

/**
 * Determina los ejercicios recomendados según las puntuaciones bajas.
 */
function recomendarEjercicios(puntos, erroresLinguisticos) {
    const ejercicios = [];

    if (puntos.comprension < 75) ejercicios.push('Escuchar preguntas del Bürgeramt');
    if (puntos.expresion < 70) ejercicios.push('Practicar respuestas formales cortas');
    if (puntos.idioma < 65) ejercicios.push('Vocabulario burocrático básico');
    if (puntos.exactitud < 90) ejercicios.push('Revisar datos del formulario');
    if (puntos.recuperacion < 60) ejercicios.push('Pedir repetición y aclaración');
    if (puntos.seguridad < 75) ejercicios.push('No inventar datos, pedir confirmación');
    if (puntos.autonomia < 80) ejercicios.push('Reducir consultas a terceros');

    for (const err of erroresLinguisticos) {
        if (err.toLowerCase().includes('geburtsort')) {
            ejercicios.push('Diferenciar Geburtsort y Wohnort');
        }
        if (err.toLowerCase().includes('auxiliar')) {
            ejercicios.push('Practicar respuestas solo en alemán');
        }
    }

    // Deduplicar
    return [...new Set(ejercicios)];
}

/**
 * Calcula el progreso otorgado según el veredicto y las puntuaciones.
 */
function calcularProgreso(veredicto, puntos) {
    const baseXP = {
        aprobado: 120,
        aprobado_con_ayuda: 80,
        no_aprobado: 25,
    }[veredicto] || 25;

    const bonusAutonomia = puntos.autonomia >= 100 ? 30 : 0;
    const bonusIdioma = puntos.idioma >= 80 ? 20 : 0;

    const xp = baseXP + bonusAutonomia + bonusIdioma;
    const palabras = veredicto === 'no_aprobado' ? 3 : 8;

    return { alean: { xp, palabras } };
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL — evaluateDialogue
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Evalúa el resultado de un desafío de diálogo.
 *
 * @param {Object} input
 * @param {Array}  input.dialogueHistory  - [{role:'player'|'npc', text:string}]
 * @param {Object} input.profile          - Perfil de la funda (DESAFIO_ANMELDUNG_2026.md §1)
 * @param {Object} input.formFields       - Campos rellenados del formulario
 * @param {Array}  input.documentsPresented - Documentos presentados (strings)
 * @param {number} input.consultasClientes - Número de consultas a clientes
 * @returns {Object} Resultado estructurado (DESAFIO_ANMELDUNG_2026.md §6)
 */
export function evaluateDialogue({
    dialogueHistory = [],
    profile = {},
    formFields = {},
    documentsPresented = [],
    consultasClientes = 0,
} = {}) {
    // 1. Análisis del diálogo
    const dialogAnalysis = analyzeDialogue(dialogueHistory);

    // 2. Cumplimiento administrativo
    const { cumplimiento, erroresAdmin: erroresCumplimiento } = calcularCumplimiento(formFields, documentsPresented);

    // 3. Exactitud de información
    const { exactitud, erroresAdmin: erroresExactitud } = calcularExactitud(formFields, profile);

    // 4. Autonomía
    const autonomia = calcularAutonomia(consultasClientes);

    // 5. Combinar puntuaciones
    const puntos = {
        cumplimiento,
        exactitud,
        comprension: dialogAnalysis.comprension,
        expresion: dialogAnalysis.expresion,
        idioma: dialogAnalysis.idioma,
        autonomia,
        recuperacion: dialogAnalysis.recuperacion,
        seguridad: dialogAnalysis.seguridad,
    };

    // 6. Veredicto
    let veredicto;
    if (cumplimiento >= 80 && exactitud >= 90 && consultasClientes === 0) {
        veredicto = 'aprobado';
    } else if (cumplimiento >= 80 && exactitud >= 90 && consultasClientes >= 1) {
        veredicto = 'aprobado_con_ayuda';
    } else {
        veredicto = 'no_aprobado';
    }

    // 7. Errores combinados
    const erroresAdministrativos = [...erroresCumplimiento, ...erroresExactitud];
    const erroresLinguisticos = dialogAnalysis.erroresLinguisticos;

    // 8. Ejercicios recomendados
    const ejerciciosRecomendados = recomendarEjercicios(puntos, erroresLinguisticos);

    // 9. Progreso otorgado
    const progresoOtorgado = calcularProgreso(veredicto, puntos);

    // 10. Confianza de la evaluación (heurística: más evidencias = más confianza)
    const evidenciaCount = dialogAnalysis.evidencias.length;
    const confianza = Math.min(1.0, 0.3 + (evidenciaCount * 0.15));

    // 11. ¿Requiere revisión humana? (si confianza baja o veredicto contradictorio)
    const requiereRevisionHumana = confianza < 0.5 ||
        (cumplimiento >= 80 && exactitud < 60) ||
        (cumplimiento < 60 && exactitud >= 90);

    return {
        veredicto,
        puntos,
        consultas_clientes: consultasClientes,
        errores_administrativos: erroresAdministrativos,
        errores_linguisticos: erroresLinguisticos,
        evidencias: dialogAnalysis.evidencias,
        ejercicios_recomendados: ejerciciosRecomendados,
        progreso_otorgado: progresoOtorgado,
        confianza,
        requiere_revision_humana: requiereRevisionHumana,
    };
}

export default evaluateDialogue;
