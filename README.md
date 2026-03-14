# Willkommen in Deutschland — README

Juego de aventura retro 2D para **aprender alemán** experimentando la vida cotidiana en Alemania: apartamento, vecinos, burocracia, supermercado, trayectos en tren.

---

## Estructura del proyecto

```
roger-main/
│
├── wid-game/                 # Cliente del juego (Phaser 3 + Vite)
│   ├── public/data/
│   │   ├── scenes.json       # ← AQUÍ defines escenas nuevas
│   │   └── vocabulary.json   # ← AQUÍ añades palabras de vocabulario
│   └── src/
│       ├── config/           # gameConfig.js, sceneKeys.js, apiConfig.js
│       ├── scenes/
│       │   ├── core/         # BootScene, MainMenuScene, SceneEngineScene, GameHudScene
│       │   └── features/     # DialogScene, CrosswordScene, QuizScene, SignalLocatorScene
│       └── services/
│           ├── ai/           # NpcDialogueService.js
│           ├── audio/        # VoiceService.js
│           ├── player/       # PlayerProgressStore.js
│           └── radio/        # SignalRadioService.js
│
├── wid-proxy/                # Proxy Express → Gemini API
│   └── server.js
│
├── GUIA_CREAR_ESCENAS.md     # Cómo añadir una escena nueva en 5 minutos
└── README.md                 # Este archivo
```

---

## Arrancar en local

```bash
# Terminal 1 — Proxy Gemini
cd wid-proxy
npm install
npm start

# Terminal 2 — Juego
cd wid-game
npm install
npm run dev
# → abre http://localhost:5173
```

Variables de entorno del proxy (archivo `.env` en `wid-proxy/`):
```
GEMINI_API_KEY=tu_api_key_aqui
GAME_AUTH_SECRET=wid-secret-2026
PORT=8080
```

---

## Añadir vocabulario nuevo

Edita `wid-game/public/data/vocabulary.json` y añade un objeto al array `words`:

```json
{ "word": "die Küche", "translation": "La cocina", "category": "vivienda", "example": "Die Küche ist links." }
```

El crucigrama, el quiz y los diálogos adaptan la dificultad automáticamente.

---

## Añadir una escena nueva

Ver `GUIA_CREAR_ESCENAS.md`.

---

## Stack técnico

| Componente | Tecnología |
|---|---|
| Motor de juego | Phaser 3 |
| Build | Vite |
| IA (NPC / narración) | Gemini 2.0 Flash (via proxy) |
| Voz (texto→audio) | Web Speech API |
| Proxy | Express.js |
