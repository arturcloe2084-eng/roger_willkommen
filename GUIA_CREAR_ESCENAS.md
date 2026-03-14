# Cómo añadir una escena nueva en 5 minutos

## Paso 1: Genera la imagen de fondo (2 min)

Usa cualquier generador de imágenes con el siguiente prompt base:

```
pixel art interior scene, 16-bit retro style, modern Germany, [describe el lugar], 
cinematic lighting, detailed, warm tones, 800x500
```

Por ejemplo para una farmacia:
```
pixel art interior, german Apotheke pharmacy, 16-bit retro style, 
shelves with medicine, wooden counter, warm lighting, 800x500
```

Guarda la imagen en: `wid-game/public/assets/apotheke.jpg`

---

## Paso 2: Añade la escena al JSON (2 min)

Edita `wid-game/public/data/scenes.json` y añade un bloque nuevo dentro de `"scenes"`:

```json
"apotheke": {
  "id": "apotheke",
  "name": "Apotheke — Farmacia del barrio",
  "chapter": "Día 3 — Necesitas medicación",
  "objective": "Describe tus síntomas en alemán y consigue lo que necesitas.",
  "background": "assets/apotheke.jpg",
  "ambientText": "Huele a antiséptico. Özlem levanta la vista.",
  "hotspots": [
    {
      "id": "ozlem",
      "x": 400, "y": 280, "width": 90, "height": 160,
      "type": "dialog",
      "label": "Özlem — Farmacéutica",
      "npc": {
        "name": "Özlem",
        "displayName": "Özlem — Farmacéutica",
        "personality": "Eres Özlem, farmacéutica alemana de origen turco. Hablas alemán pausado y preciso porque estás acostumbrada a explicar instrucciones médicas. Eres amable pero eficiente. Si el jugador describe sus síntomas en alemán (aunque con errores), le ayudas y le recomendas el medicamento correcto. Usas vocabulario médico básico: Kopfschmerzen (dolor de cabeza), Fieber (fiebre), Erkältung (resfriado), Bauchschmerzen (dolor de barriga)."
      }
    },
    {
      "id": "puerta_apotheke",
      "x": 80, "y": 280, "width": 70, "height": 160,
      "type": "door",
      "target": "calle",
      "label": "Salir a la calle"
    },
    {
      "id": "quiz_receta",
      "x": 650, "y": 200, "width": 80, "height": 60,
      "type": "quiz",
      "label": "Folleto de medicación (test)"
    }
  ]
}
```

Para que la escena sea accesible, añade una puerta en otra escena que apunte a `"target": "apotheke"`.

---

## Paso 3: Conecta la escena desde otra existente (30 segundos)

En la escena de la que debe accederse (por ejemplo `calle`), añade un hotspot tipo puerta:

```json
{
  "id": "puerta_apotheke_entrada",
  "x": 500, "y": 280, "width": 60, "height": 120,
  "type": "door",
  "target": "apotheke",
  "label": "Apotheke"
}
```

---

## Resultado

El SceneEngine carga todo automáticamente. Sin código nuevo.

---

## Tipos de hotspot disponibles

| Tipo | Descripción |
|---|---|
| `door` | Navega a otra escena. Requiere `target: "id_escena"` |
| `dialog` | Abre diálogo con NPC vía IA. Requiere `npc: { name, displayName, personality }` |
| `crossword` | Abre crucigrama con palabras del vocabulary.json |
| `quiz` | Abre test de 4 opciones con palabras del vocabulary.json |
| `radio` | Abre localizador de señal de radio. Requiere `signalLocator: { station, requiredCaptures }` |
