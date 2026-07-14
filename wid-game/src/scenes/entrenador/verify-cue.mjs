/**
 * Verifica que el ejemplo Anmeldung cumple el schema universal
 * y que el validador determinista lo acepta. Ad-hoc, no suite.
 */
import { validateScene } from './SceneValidator.js';
import { readFileSync } from 'fs';

const raw = readFileSync(new URL('./scene-anmeldung-2026.json', import.meta.url), 'utf-8');
const scene = JSON.parse(raw);
const result = validateScene(scene);

console.log('=== VALIDACIÓN CUE (scene-anmeldung-2026) ===');
if (result.valid) {
  console.log('✅ VALIDO');
  console.log('  nodos:', scene.nodos_dialogo.map(n => `${n.id}(${n.rol})`).join(', '));
  console.log('  principal:', scene.nodos_dialogo.find(n => n.rol === 'empleado_principal')?.id);
  console.log('  ayudantes:', scene.nodos_dialogo.filter(n => n.puede_ayudar).map(n => n.id).join(', '));
  console.log('  campos formulario:', scene.formulario.campos.length);
  console.log('  criterios:', scene.evaluacion.criterios.length);
  console.log('  puertas:', JSON.stringify(scene.evaluacion.puertas));
  console.log('  objetivo:', scene.evaluacion.objetivo_exito);
  process.exit(0);
} else {
  console.log('❌ INVALIDO');
  result.errors.forEach(e => console.log('  -', e));
  process.exit(1);
}
