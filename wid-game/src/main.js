import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig.js';

window.game = new Phaser.Game(createGameConfig());
