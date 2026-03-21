# 🎮 ROGER EXAMPLE SCENE - GUÍA DE USO FINAL

## ✅ ESTADO: COMPLETAMENTE IMPLEMENTADO Y FUNCIONAL

---

## 🚀 CÓMO ACCEDER A LA ESCENA ROGER EXAMPLE

### Desde el Menú Principal
1. Ejecuta el juego: `npm run dev` (en `wid-game/`)
2. En el menú principal, verás el botón **"📖 Roger Example"**
3. Presiona la tecla **`R`** o hace click en el botón
4. La escena cargará automáticamente

### Flujo de Acceso
```
Menú Principal
    ↓ (Presionar [R] o click)
Transición suave (fade out 500ms)
    ↓
RogerExampleScene carga
    ↓
ACT 1 - Narración en alemán comienza
```

---

## 📖 ESTRUCTURA DE LA ESCENA

### ACT 1: Introducción Narrativa
```
┌─────────────────────────────────────┐
│  🎬 NARRACIÓN                       │
│  Alemán: "Willkommen in dieser..."  │
│  Subtítulos rotan: DE → ES → EN     │
│                                     │
│  [ESPACIO para avanzar]             │
└─────────────────────────────────────┘
```
- **Duración:** ~10 segundos de narración
- **Acción:** Presionar ESPACIO para saltar
- **XP:** No hay recompensa en este acto

### ACT 2: Primer Karaoke
```
┌─────────────────────────────────────┐
│  🎤 KARAOKE #1                      │
│  Repite: "Ich heiße Roger!"         │
│                                     │
│  Similitud: 87%  ✓ ÉXITO            │
│  [INTENTAR DE NUEVO / CONTINUAR]    │
└─────────────────────────────────────┘
```
- **Duración:** Tiempo de micrófono abierto (~5 segundos)
- **Evaluación:** Sistema de voz reconoce y evalúa similitud
- **Feedback:** % de similitud en tiempo real
- **Requisito:** >60% similitud para éxito
- **XP:** +25 XP si >60%

### ACT 3: Diálogos Interactivos
```
┌─────────────────────────────────────┐
│  💬 DIÁLOGO                         │
│  NPC: "Wie geht es dir?"            │
│                                     │
│  Opciones:                          │
│  [1] Mir geht es gut!               │
│  [2] Es geht mir sehr gut!          │
│  [3] Ich bin nicht sicher...        │
└─────────────────────────────────────┘
```
- **Duración:** Hasta que hagas click
- **Elección:** Cualquier opción es válida
- **Respuesta:** NPC responde según tu elección
- **XP:** +15 XP por elegir

### ACT 4: Segundo Karaoke
```
┌─────────────────────────────────────┐
│  🎤 KARAOKE #2                      │
│  Repite: "Deutschland ist schön!"   │
│                                     │
│  Similitud: 92%  ✓ ÉXITO            │
│  [INTENTAR DE NUEVO / CONTINUAR]    │
└─────────────────────────────────────┘
```
- **Duración:** Tiempo de micrófono abierto (~5 segundos)
- **Dificultad:** Frase más larga que Act 1
- **XP:** +30 XP si >60%

### ACT 5: Pantalla de Resultados
```
┌─────────────────────────────────────┐
│  🏆 SCENE COMPLETED!                │
│                                     │
│  Total XP earned: +70               │
│                                     │
│  Puedes crear tus propias escenas   │
│  usando esto como template          │
│                                     │
│  [ESPACIO para retornar al menú]    │
└─────────────────────────────────────┘
```
- **Duración:** Hasta que presiones ESPACIO
- **Total XP:** Hasta 70 XP (25 + 15 + 30)
- **Transición:** Retorna al menú principal automáticamente

---

## 🎯 SISTEMA DE RECOMPENSAS

| Evento | XP | Condición |
|--------|-----|-----------|
| Karaoke Act 1 | +25 XP | >60% similitud |
| Elección Diálogo | +15 XP | Cualquier opción |
| Karaoke Act 3 | +30 XP | >60% similitud |
| **TOTAL MÁXIMO** | **70 XP** | Todo completado |

---

## 🔊 SISTEMA DE VOZ

### Narración (TTS - Text-to-Speech)
- **Idioma:** Alemán (de-DE)
- **Velocidad:** 0.9x (más lenta para claridad)
- **Pitch:** 0.9 (ligeramente más grave)
- **Volumen:** 100%

### Karaoke (Voice Recognition)
- **Idioma:** Alemán (de-DE)
- **Motor:** Web Speech API
- **Evaluación:** Levenshtein Distance
  - **>60%:** ✓ Éxito
  - **40-60%:** ⚠ Reintentar
  - **<40%:** ✗ No reconocido

### Subtítulos
- **Rotación:** Cada 2 segundos
- **Idiomas:** DE (Alemán) → ES (Español) → EN (Inglés)
- **Colores:**
  - DE: Blanco (#fff)
  - ES: Amarillo (#ffcc00)
  - EN: Cyan (#00ffff)

---

## 🛠️ COMPONENTES TÉCNICOS

### Servicios Integrados

**1. NarratorService** 
```javascript
import { narratorService } from './services/NarratorService.js';

// Narrar con subtítulos
narratorService.narrateInGerman(
    "Willkommen...",
    (lang) => { /* actualizar subtítulo */ },
    () => { /* cuando termina */ }
);
```

**2. KaraokeModeService**
```javascript
import { karaokeModeService } from './services/KaraokeModeService.js';

// Iniciar karaoke
karaokeModeService.startLine(
    "Ich heiße Roger!",
    (result) => { /* feedback */ },
    () => { /* termina */ }
);
```

**3. PlayerProgressStore**
```javascript
import { playerProgressStore } from './services/player/PlayerProgressStore.js';

// Agregar XP
playerProgressStore.addXP(25);

// Guardar palabra
playerProgressStore.learnWord({
    german: "Heiße",
    spanish: "Llamo",
    english: "Name"
});
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

### Antes de Jugar
- [ ] El juego está ejecutándose (`npm run dev`)
- [ ] Tienes micrófono habilitado en el navegador
- [ ] Audio está activado
- [ ] Menú principal visible

### Durante el Juego
- [ ] ACT 1: Narración audible en alemán
- [ ] Subtítulos cambian cada 2 segundos
- [ ] ESPACIO salta narración correctamente
- [ ] ACT 2: Micrófono se activa
- [ ] Tu voz se reconoce y evalúa
- [ ] Porcentaje de similitud se muestra
- [ ] ACT 3: 3 opciones de diálogo visibles
- [ ] Click en opción avanza a siguiente acto
- [ ] ACT 4: Segunda frase de karaoke funciona
- [ ] ACT 5: Total XP mostrado correctamente
- [ ] ESPACIO retorna al menú

### Después del Juego
- [ ] Menú principal accesible
- [ ] No hay errores en la consola (F12)
- [ ] XP fue agregado al perfil del jugador
- [ ] Palabras fueron aprendidas (en Dictionary)

---

## 🐛 TROUBLESHOOTING

### Problema: Narración no se escucha
**Solución:**
1. Verifica que el audio del navegador está activado
2. Comprueba que el micrófono no está desactivado en OS
3. Recarga la página (F5)
4. Intenta en un navegador diferente

### Problema: Karaoke no reconoce mi voz
**Solución:**
1. Verifica permisos de micrófono en el navegador
2. Prueba la similitud mínima (>60%)
3. Habla más cerca del micrófono
4. Usa navegadores soportados (Chrome, Edge, Firefox)

### Problema: Diálogos no responden
**Solución:**
1. Presiona click exactamente en el texto de opción
2. Espera a que los botones estén completamente rendered
3. Verifica en DevTools (F12) que no hay errores

### Problema: No puedo retornar al menú
**Solución:**
1. Presiona ESPACIO en la pantalla de resultados
2. Si no funciona, recarga (F5)
3. Verifica que no hay diálogos abiertos

---

## 📊 DATOS Y ARCHIVO ASOCIADOS

### Archivo de Configuración
- **Ubicación:** `wid-game/public/data/scenes.json`
- **ID de escena:** `roger_example`
- **Template:** ✅ Listo para que LLM genere nuevas escenas

### Ejemplo de Escena Generada
- **Ubicación:** `scene_example_pharmacy.json`
- **Propósito:** Referencia para LLM al crear nuevas escenas
- **Estructura:** Mismo formato que `roger_example`

### Documentación
- `ROGER_EXAMPLE_GUIDE.md` - Guía completa
- `ROGER_SYSTEM_SUMMARY.md` - Arquitectura técnica
- `IMPLEMENTACION_COMPLETA.md` - Detalles de implementación
- `ROGER_SCENE_FINAL_STATUS.md` - Estado final

---

## 🔐 SEGURIDAD Y PRIVACIDAD

### Datos Recopilados
- Palabras aprendidas (guardadas localmente)
- XP ganados (localStorage)
- Histórico de audio NO se guarda

### Almacenamiento
- Todo está en `localStorage` del navegador
- No se envían datos a servidores
- Privacidad del usuario garantizada

---

## 🎬 PRÓXIMOS PASOS (Phase 2)

### Creando Nuevas Escenas
1. **Usando el Template:** Abre `scene_example_pharmacy.json`
2. **Adaptando:** Cambia:
   - `narration` en cada act
   - `dialogues` para NPC
   - `karaokeLine` para nuevas frases
3. **Guardando:** Agrega a `scenes.json` con nuevo ID
4. **Accediendo:** Scene se cargará automáticamente

### Automatización con LLM
1. Proxy endpoints listos en `wid-proxy/`
2. Usuario describe escena
3. LLM genera JSON en mismo formato
4. Escena carga dinámicamente

---

## 📞 SOPORTE

### Preguntas Técnicas
Revisa los archivos de documentación:
- `ROGER_SYSTEM_SUMMARY.md` - Arquitectura
- `IMPLEMENTACION_COMPLETA.md` - Código

### Errores o Bugs
1. Abre DevTools (F12)
2. Busca errores en Console
3. Ejecuta verificación: `./verify_roger_integration.sh`

---

## ✨ FEATURES IMPLEMENTADOS

- [x] Narración en Alemán con TTS
- [x] Subtítulos Multiidioma (DE/ES/EN)
- [x] Karaoke Mode con Evaluación de Voz
- [x] Diálogos Interactivos
- [x] Sistema de Recompensas (XP)
- [x] State Management Robusto
- [x] Integración con Menú Principal
- [x] Acceso por Tecla de Atajo ([R])
- [x] Transiciones Suaves
- [x] Datos Persistentes

---

## 🏆 CONCLUSIÓN

**Roger Example Scene está completamente funcional y lista para usar.**

Desde el menú principal, presiona **[R]** para comenzar tu aventura de aprendizaje de alemán con narración, karaoke interactivo y más.

¡Viel Spaß! 🎮🎤

---

**Última actualización:** 2024  
**Versión:** 1.0 - Completa  
**Status:** ✅ LISTO PARA PRODUCCIÓN
