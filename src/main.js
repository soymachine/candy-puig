import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, BG_COLOR } from './config.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  backgroundColor: BG_COLOR,
  pauseOnBlur: false,
  scene: [BootScene, PreloadScene, MenuScene, GameScene, GameOverScene],
};

const game = new Phaser.Game(config);
window.__PHASER_GAME__ = game;
