# 🚀 CÓMO EMPEZAR CON ROGER EXAMPLE SCENE

## ⚡ INICIO RÁPIDO (5 MINUTOS)

### Paso 1: Instalar dependencias
```bash
cd /home/vaclav/Q/roger/roger-main/wid-game
npm install
```

### Paso 2: Ejecutar el juego
```bash
npm run dev
```
Esto abrirá el juego en `http://localhost:5173` (o similar)

### Paso 3: Acceder a Roger Example Scene
En el menú principal:
- **Presiona `[R]`** o
- **Haz click en el botón "📖 Roger Example"**

### Paso 4: ¡Disfruta!
Sigue los 5 actos:
1. 🎬 Escucha narración en alemán
2. 🎤 Repite una frase (Karaoke)
3. 💬 Elige una opción de diálogo
4. 🎤 Repite otra frase
5. 🏆 ¡Ganaste XP y palabras nuevas!

---

## 📋 REQUISITOS PREVIOS

### Sistema Operativo
- Linux ✅ (Verificado)
- macOS ✅
- Windows ✅

### Navegador
- Chrome/Chromium (recomendado)
- Edge ✅
- Firefox ✅
- Safari ✅

### Hardware
- Micrófono funcional
- Parlantes/audífonos
- Conexión a internet (solo inicio)

### Permisos del Navegador
- [ ] Micrófono habilitado
- [ ] Audio habilitado

---

## 🔧 CONFIGURACIÓN

### Si el micrófono no funciona
```
Chrome → Settings → Privacy and Security → Site Settings → Microphone
→ http://localhost:5173 → Allow
```

### Si no escuchas narración
```
Verificar volumen del navegador (esquina inferior)
Verificar volume del sistema (🔊 en taskbar)
Permitir Web Speech API (debería solicitar permisos)
```

### Si hay lag o problemas
```bash
# Limpia caché y reinstala
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📚 DOCUMENTACIÓN

### Para Usuarios
1. **[ROGER_QUICK_START.md](ROGER_QUICK_START.md)** - Guía de uso
2. **[ROGER_SYSTEM_SUMMARY.md](ROGER_SYSTEM_SUMMARY.md)** - Cómo funciona

### Para Desarrolladores
3. **[IMPLEMENTACION_COMPLETA.md](IMPLEMENTACION_COMPLETA.md)** - Código técnico
4. **[GUIA_CREAR_ESCENAS.md](GUIA_CREAR_ESCENAS.md)** - Crear nuevas escenas

### Índice Completo
5. **[INDICE_COMPLETO.md](INDICE_COMPLETO.md)** - Mapa del proyecto

---

## ✅ CHECKLIST PRE-JUEGO

Antes de presionar [R], verifica:

- [ ] Npm está instalado (`npm --version`)
- [ ] Estás en directorio `wid-game/`
- [ ] Ejecutaste `npm install`
- [ ] El dev server está corriendo (`npm run dev`)
- [ ] Abres menú principal en http://localhost:5173
- [ ] Tu micrófono está habilitado en el navegador
- [ ] Tu volumen está activado
- [ ] No hay errores en Console (F12)

---

## 🎮 DURANTE EL JUEGO

### ACT 1 - Narración
```
Escucha al narrador en alemán
Subtítulos rotan cada 2 segundos
Presiona ESPACIO para saltar
⏱️ ~10 segundos
```

### ACT 2 - Karaoke #1
```
Repetir frase: "Ich heiße Roger!"
Tu similitud se muestra en %
>60% = Éxito ✓
<60% = Reintentar
⏱️ ~5 segundos
```

### ACT 3 - Diálogos
```
NPC pregunta: "Wie geht es dir?"
Elige una de 3 opciones
Click en la que te guste
⏱️ Hasta que hagas click
```

### ACT 4 - Karaoke #2
```
Repetir frase más larga
Misma evaluación que ACT 2
⏱️ ~5 segundos
```

### ACT 5 - Resultados
```
Ver total de XP ganado
Información sobre crear escenas
Presionar ESPACIO para retornar
⏱️ ~3 segundos
```

---

## 🐛 SOLUCIONAR PROBLEMAS

### No veo el botón de Roger Example
```
Solución 1: Recarga la página (F5)
Solución 2: Verifica en DevTools (F12) → Console por errores
Solución 3: Reinicia servidor (Ctrl+C y npm run dev)
```

### No escucho narración
```
Verificar:
1. ¿Está activado el audio en el navegador?
2. ¿Está el volumen del sistema al máximo?
3. ¿Aceptaste permisos de Web Speech API?
4. ¿Funcionan otros videos/audio en Chrome?
```

### El micrófono no reconoce mi voz
```
Verificar:
1. ¿Has permitido micrófono en permisos del sitio?
2. ¿Hablas claro y pronuncias bien?
3. ¿El micrófono funciona en otras apps?
4. ¿Estás lo suficientemente cerca del micrófono?
```

### Similitud muy baja (25% cuando debería ser 85%)
```
Razones:
- Pronunciación diferente al ejemplo
- Palabras cortadas o incompletas
- Ruido de fondo (ventilador, tráfico)
- Acento regional
- Sistema de evaluación es estricto

Tip: Lee la frase despacio y clara
```

### Los diálogos no responden al click
```
Solución 1: Click en el texto exactamente
Solución 2: Espera a que estén renderizados
Solución 3: Prueba con F5 reload
```

### El juego se congela
```
Solución: 
- Abre Console (F12)
- Anota cualquier error
- Cierra el juego (Ctrl+C)
- npm run dev
- Recarga navegador
```

---

## 📊 MONITOREO

### Verificar que todo está bien
```bash
# En el terminal
./verify_roger_integration.sh
```

Debería mostrar:
```
✓ TODAS LAS VERIFICACIONES PASARON
🎮 La escena Roger Example está completamente integrada y lista.
```

---

## 🎯 OBJETIVOS DE LA ESCENA

### Aprenderás:
- ✅ Saludos en alemán
- ✅ Pronunciación correcta
- ✅ Palabras comunes
- ✅ Estructura de oraciones

### Practicarás:
- ✅ Escuchar alemán
- ✅ Hablar en alemán
- ✅ Comprensión auditiva
- ✅ Interacción con NPC

### Ganarás:
- ✅ Puntos de experiencia (XP)
- ✅ Palabras aprendidas
- ✅ Progreso de nivel
- ✅ Logros

---

## 💡 TIPS PARA ÉXITO

### Para Karaoke
1. **Lee primero** - Estudia la frase antes
2. **Pronuncia claro** - Habla directo al micrófono
3. **Ritmo normal** - No muy rápido ni lento
4. **Reintentos** - Si no pasas al primer intento, intenta de nuevo

### Para Diálogos
1. **Lee opciones** - Entiende qué estás eligiendo
2. **Elige coherente** - Selecciona que tenga sentido
3. **Experimenta** - Prueba diferentes opciones

### Para Aprender
1. **Repite** - Juega la escena múltiples veces
2. **Memoriza** - Aprende las frases
3. **Practica** - Dilo en voz alta después
4. **Usa Dictionary** - Consulta palabras nuevas

---

## 🔐 DATOS Y PRIVACIDAD

### ¿Dónde se guardan tus datos?
- LocalStorage del navegador (no servidores)
- Palabras aprendidas
- Puntos XP
- Preferencia de idioma

### ¿Se guarda mi voz?
- ❌ NO se graba audio
- ❌ NO se guarda voz en servidor
- ✅ Solo se evalúa similitud localmente

### ¿Qué pasa si limpio caché?
- Perderás palabras aprendidas
- Perderás XP acumulado
- Preferencias de idioma se resetean
- Protip: Exporta datos antes de limpiar

---

## 📱 COMPATIBILIDAD

### Navegadores Soportados
| Navegador | Versión | Soporte |
|-----------|---------|---------|
| Chrome | 90+ | ✅ Óptimo |
| Edge | 90+ | ✅ Excelente |
| Firefox | 88+ | ✅ Bueno |
| Safari | 14+ | ✅ Funciona |

### Sistemas Operativos
| SO | Soporte |
|-----|---------|
| Linux | ✅ Probado |
| macOS | ✅ Compatible |
| Windows | ✅ Compatible |
| Android | ⚠️ Parcial* |
| iOS | ⚠️ Parcial* |

*Mobile: Funciona pero sin acceso a micrófono en algunos navegadores

---

## 🎓 PRÓXIMOS PASOS

### Después de Completar Roger Example
1. ✅ Revisa Dictionary para palabras aprendidas
2. ✅ Crea nuevas escenas similares
3. ✅ Pasa a escenas más difíciles
4. ✅ Invita amigos a jugar

### Para Desarrolladores
1. Lee [GUIA_CREAR_ESCENAS.md](GUIA_CREAR_ESCENAS.md)
2. Crea tu propia escena
3. Usa scene_example_pharmacy.json como template
4. Comparte en GitHub

---

## 🤝 SOPORTE

### Preguntas Frecuentes
Ver [ROGER_QUICK_START.md](ROGER_QUICK_START.md) - Troubleshooting

### Reportar Bugs
1. Abre Console (F12)
2. Copia el error
3. Crea issue en GitHub
4. Incluye:
   - Navegador y versión
   - Sistema operativo
   - Descripción del problema
   - Screenshot si aplica

### Más Ayuda
- Documentación: Archivos `.md` en raíz
- Código fuente: `wid-game/src/`
- Ejemplos: `scene_example_pharmacy.json`

---

## ✨ CARACTERÍSTICAS PRINCIPALES

- 🎤 Karaoke con evaluación automática
- 🎬 Narración en alemán
- 🌍 Subtítulos en 3 idiomas
- 💬 Diálogos interactivos
- ⭐ Sistema de recompensas (XP)
- 📊 Tracking de progreso
- 🎯 Múltiples escenas disponibles
- 🔄 Rejugables ilimitadamente

---

## 🎉 ¡LISTO!

Ya estás listo para comenzar.

### Próximos pasos:
1. `cd wid-game && npm run dev`
2. Abre http://localhost:5173
3. Presiona [R]
4. ¡Disfruta tu primera escena interactiva!

---

**¡Viel Erfolg! (¡Mucho éxito!)** 🚀🎮🎤

---

**Última actualización:** 2024  
**Estado:** ✅ LISTO PARA JUGAR
