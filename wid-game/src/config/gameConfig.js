import Phaser from 'phaser';
import { BootScene } from '../scenes/core/BootScene.js';
import { MainMenuScene } from '../scenes/core/MainMenuScene.js';
import { SceneEngineScene } from '../scenes/core/SceneEngineScene.js';
import { GameHudScene } from '../scenes/core/GameHudScene.js';
import { DictionaryScene } from '../scenes/core/DictionaryScene.js';
import { DialogScene } from '../scenes/features/DialogScene.js';
import { CrosswordScene } from '../scenes/features/CrosswordScene.js';
import { QuizScene } from '../scenes/features/QuizScene.js';
import { SignalLocatorScene } from '../scenes/features/SignalLocatorScene.js';
import { RogerExampleScene } from '../scenes/features/RogerExampleScene.js';

export function createGameConfig() {
    return {
        type: Phaser.AUTO,
        width: 800,
        height: 500,
        parent: 'game-container',
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoRound: false,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        pixelArt: false,
        antialias: true,
        backgroundColor: '#0a0a1a',
        physics: {
            default: 'arcade',
            arcade: { gravity: { y: 0 }, debug: false }
        },
        scene: [
            BootScene,
            MainMenuScene,
            DictionaryScene,
            SceneEngineScene,
            DialogScene,
            CrosswordScene,
            QuizScene,
            SignalLocatorScene,
            RogerExampleScene,
            GameHudScene,
        ],
    };
}
