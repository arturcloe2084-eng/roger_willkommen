// ============================================================
//  WILLKOMMEN IN DEUTSCHLAND
//  Motor de aventura retro para aprender alemán
//  Motor: Phaser 3  |  Estilo: Pixel art retro + moderno
// ============================================================

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { SceneEngine } from './scenes/SceneEngine.js';
import { DialogScene } from './scenes/DialogScene.js';
import { CrosswordScene } from './scenes/CrosswordScene.js';
import { QuizScene } from './scenes/QuizScene.js';
import { SignalLocatorScene } from './scenes/SignalLocatorScene.js';
import { HUDScene } from './scenes/HUDScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 500,
    parent: 'game-container',
    pixelArt: true,
    backgroundColor: '#0a0a1a',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [
        BootScene,      // 1. Carga assets y JSON
        MenuScene,       // 2. Menú principal
        SceneEngine,     // 3. Motor genérico de escenas (LEE scenes.json)
        DialogScene,     // 4. Diálogo con NPC (IA Gemini)
        CrosswordScene,  // 5. Crucigrama (desde vocabulary.json)
        QuizScene,       // 6. Quiz 4 opciones (desde vocabulary.json)
        SignalLocatorScene, // 7. Localizador de señales (desde vocabulary.json)
        HUDScene,        // 8. Barra de XP, nivel, palabras
    ],
};

window.game = new Phaser.Game(config);
