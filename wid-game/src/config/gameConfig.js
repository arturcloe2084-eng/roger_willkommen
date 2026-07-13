import Phaser from 'phaser';
import { BootScene } from '../scenes/core/BootScene.js';
import { MainMenuScene } from '../scenes/core/MainMenuScene.js';
import { ContractMenuScene } from '../scenes/core/ContractMenuScene.js';
import { ProfileScene } from '../scenes/core/ProfileScene.js';
import { PreparationScene } from '../scenes/core/PreparationScene.js';
import { ResultsScene } from '../scenes/core/ResultsScene.js';
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
        width: window.innerWidth,
        height: window.innerHeight,
        parent: 'game-container',
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoRound: false,
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        pixelArt: false,
        antialias: true,
        backgroundColor: '#050a0f',
        physics: {
            default: 'arcade',
            arcade: { gravity: { y: 0 }, debug: false }
        },
        scene: [
            BootScene,
            MainMenuScene,
            ContractMenuScene,
            ProfileScene,
            PreparationScene,
            ResultsScene,
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
