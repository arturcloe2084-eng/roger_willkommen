/**
 * SceneValidator — validador determinista del CUE.
 * Fuerza que cualquier JSON del LLM planificador cumpla el schema universal
 * ANTES de compilar. No usa LLM: reglas duras, testeable, sin red.
 *
 * Si falla, devuelve errores específicos para que el planificador corrija
 * (bucle cerrado: planificador → validador → (corregir) → validador → OK).
 */
const CRITERIOS_VALIDOS = ['cumplimiento', 'exactitud', 'comprension', 'expresion', 'idioma', 'autonomia', 'recuperacion', 'seguridad'];

export function validateScene(scene) {
  const errors = [];

  // ── meta ──────────────────────────────────────────────────────────
  if (!scene || typeof scene !== 'object') return { valid: false, errors: ['scene no es objeto'] };
  if (!scene.meta?.titulo || scene.meta.titulo.length < 3) errors.push('meta.titulo inválido');
  if (!/^[a-z]{2}$/.test(scene.meta?.idioma_principal || '')) errors.push('meta.idioma_principal debe ser ISO-639-1 (ej. "de")');

  // ── entorno ──────────────────────────────────────────────────────
  const salas = ['oficina_publica', 'clinica', 'comercio', 'calle', 'hogar', 'otro'];
  if (!salas.includes(scene.entorno?.tipo_sala)) errors.push('entorno.tipo_sala inválido');
  if (!scene.entorno?.ambiente) errors.push('entorno.ambiente requerido (frase para LLM visual)');

  // ── nodos_dialogo ────────────────────────────────────────────────
  if (!Array.isArray(scene.nodos_dialogo) || scene.nodos_dialogo.length < 1)
    errors.push('nodos_dialogo debe tener ≥1 nodo');
  const roles = ['empleado_principal', 'secundario_ayudante', 'secundario_distractor', 'recepcionista', 'otro'];
  const ids = new Set();
  let hayPrincipal = false;
  scene.nodos_dialogo?.forEach((n, i) => {
    if (!/^[a-z_]+$/.test(n.id || '')) errors.push(`nodo[${i}].id inválido (solo minúsculas y _)`);
    if (ids.has(n.id)) errors.push(`nodo id duplicado: ${n.id}`);
    ids.add(n.id);
    if (!roles.includes(n.rol)) errors.push(`nodo[${i}].rol inválido: ${n.rol}`);
    if (n.rol === 'empleado_principal') hayPrincipal = true;
    if (n.puede_ayudar && n.rol !== 'secundario_ayudante')
      errors.push(`nodo ${n.id}: puede_ayudar=true solo permitido en secundario_ayudante`);
  });
  if (!hayPrincipal) errors.push('debe haber ≥1 nodo con rol empleado_principal');

  // ── formulario (opcional pero si existe, coherente) ──────────────
  if (scene.formulario) {
    if (!Array.isArray(scene.formulario.campos)) errors.push('formulario.campos debe ser array');
    scene.formulario.campos?.forEach((c, i) => {
      if (!c.id || typeof c.requerido !== 'boolean') errors.push(`formulario.campos[${i}] requiere id y requerido`);
    });
  }

  // ── evaluacion ───────────────────────────────────────────────────
  if (!Array.isArray(scene.evaluacion?.criterios) || scene.evaluacion.criterios.length < 1)
    errors.push('evaluacion.criterios requerido (≥1)');
  scene.evaluacion?.criterios?.forEach((c, i) => {
    if (!CRITERIOS_VALIDOS.includes(c)) errors.push(`evaluacion.criterios[${i}] inválido: ${c}`);
  });
  const puertas = scene.evaluacion?.puertas || {};
  if (puertas.cumplimiento_min !== undefined && (puertas.cumplimiento_min < 0 || puertas.cumplimiento_min > 100))
    errors.push('puertas.cumplimiento_min fuera de rango');
  if (puertas.exactitud_min !== undefined && (puertas.exactitud_min < 0 || puertas.exactitud_min > 100))
    errors.push('puertas.exactitud_min fuera de rango');

  return { valid: errors.length === 0, errors };
}
