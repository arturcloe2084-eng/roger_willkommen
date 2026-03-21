# Cambio en Funcionalidad del Botón Play

## 🎯 Objetivo
Cuando el usuario toca el botón play en la barra de controles retro:
- La locución se reproduce **sobre la foto actual** (sin cambio de pantalla)
- El audio permanece en el contexto del SceneBuilder
- La narración está relacionada con la imagen mostrada

## 🔧 Implementación

### Cambios en SceneBuilderUI.js

#### 1. **Import agregado (línea 4):**
```javascript
import { narratorService } from './NarratorService.js';
```
Se importa el servicio singleton de narración.

#### 2. **Método actualizado: `_launchRogerExampleScene()` (línea 651-675)**

**Antes:**
```javascript
_launchRogerExampleScene() {
    if (!this.hostScene) {
        console.warn('[SceneBuilderUI] No hostScene available...');
        return;
    }
    this.close();
    this.hostScene.scene.start(SCENE_KEYS.ROGER_EXAMPLE);
    // Cambiaba a otra escena
}
```

**Después:**
```javascript
_launchRogerExampleScene() {
    // Obtener la escena actual y el nodo actual
    const selectedScene = this._getSelectedScene();
    if (!selectedScene) return;

    const state = this._getPlayState(selectedScene);
    const currentNode = this._findNodeById(selectedScene, state.currentNodeId);
    if (!currentNode) return;

    // Obtener el texto en alemán
    const germanText = currentNode.deLine || currentNode.learningGerman || currentNode.text;
    
    // Reproducir la narración sobre la imagen actual (sin cerrar SceneBuilder)
    narratorService.narrateInGerman(germanText, (subtitleText, languageCode) => {
        console.log('[SceneBuilder] Narración reproduciendo:', subtitleText, languageCode);
    });

    this._writeConsole([
        '> Reproduciendo narración de la escena actual',
        `> Texto: ${germanText.substring(0, 50)}...`,
        '> Audio en alemán con subtítulos',
    ]);
}
```

## 📊 Flujo de Usuario

```
1. Usuario abre Scene Builder
2. Selecciona "1. EJEMPLO DE ROGER"
3. Ve la foto del Burgeramt + barra de controles retro
4. Toca el botón ▶ PLAY
5. NarratorService reproduce el audio en alemán
   ↓
6. El audio se reproduce SOBRE la foto actual
   ↓
7. Los subtítulos se actualizan sincronizadamente
   ↓
8. SceneBuilder permanece abierto (sin transición)
```

## 🔊 Audio sobre Imagen

### Características:
- **Ubicación:** Audio se reproduce en el contexto actual
- **Relación:** El texto narrado corresponde al nodo actual
- **Sincronización:** Subtítulos se actualizan cada 2 segundos
- **Contexto:** La imagen y el audio están relacionados
- **Sin cambios de pantalla:** Permanece en SceneBuilder

### Nodos y sus textos relacionados:

```javascript
Nodo 1: "Entrada al Burgeramt"
  Texto: "Ich bin im Buergeramt. Heute ist der letzte Tag..."
  Imagen: 01-entrada-burgeramt.jpg
  Audio: Narración sobre la entrada

Nodo 2: "Caos en los pasillos"
  Texto: "El formulario de Anmeldung tiembla en sus manos..."
  Imagen: 02-caos-en-pasillo.jpg
  Audio: Narración sobre el caos

... (y así para cada nodo)
```

## 🎨 Interfaz

La barra de controles retro proporciona:
- **▶ PLAY:** Reproduce audio del nodo actual
- **━━━━●━━━━:** Barra de progreso (placeholder)
- **0:00 / 5:30:** Tiempo (placeholder)
- **🔊:** Volumen (placeholder)
- **⚙:** Configuración (placeholder)
- **▢:** Modo cine (placeholder)
- **⛶:** Pantalla completa (placeholder)

## 🔄 Navegación

El usuario puede:
1. Tocar ▶ PLAY para escuchar el nodo actual
2. Usar botones "Anterior" y "Siguiente" para cambiar nodos
3. Tocar ▶ PLAY nuevamente para escuchar el nuevo nodo
4. Ver imagen y audio sincronizados

## 💡 Ventajas

✅ No interrumpe la experiencia del usuario  
✅ Audio relacionado con la imagen visible  
✅ Contexto educativo claro (imagen + audio + subtítulos)  
✅ Preparado para videos futuros  
✅ Interfaz retro consistente  
✅ Narración en alemán con subtítulos  

## 🚀 Próximas Fases

Cuando haya videos integrados:
1. Reemplazar imagen estática con `<video>` tag
2. Sincronizar play/pause con video playback
3. Conectar timeline con video progress
4. Controles de volumen funcionales
5. Pantalla completa del video

## ✨ Resultado

El usuario ahora puede:
- Aprender alemán viendo una imagen relacionada
- Escuchar la narración en alemán sincronizada
- Ver subtítulos en tiempo real
- Todo dentro del contexto del Scene Builder
- Sin interrupciones ni cambios de pantalla
