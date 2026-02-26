import Phaser from 'phaser';
import { PlayerState } from '../services/PlayerState.js';

export class HUDScene extends Phaser.Scene {
    constructor() {
        super('HUDScene');
    }

    create() {
        // Barra de XP
        this.add.rectangle(10, 10, 200, 20, 0x333333).setOrigin(0);
        this.xpBar = this.add.rectangle(10, 10, 0, 20, 0x00ff41).setOrigin(0);

        this.levelText = this.add.text(220, 10, `LVL: ${PlayerState.level}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            fill: '#00ffff'
        });

        this.xpText = this.add.text(10, 35, `XP: ${PlayerState.xp}/${PlayerState.xpToNextLevel}`, {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#ffffff'
        });

        this.wordsText = this.add.text(10, 60, `Palabras: ${PlayerState.learnedWords.length}`, {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#ffaa00'
        });

        this.dayText = this.add.text(10, 84, `Día: ${PlayerState.story.day}/30`, {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#88ddff'
        });

        this.chapterText = this.add.text(10, 106, `${PlayerState.story.chapter}`, {
            fontFamily: 'VT323',
            fontSize: '16px',
            fill: '#88aaff'
        });

        this.objectiveText = this.add.text(300, 10, `OBJ: ${PlayerState.story.activeObjective}`, {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#ccffcc',
            wordWrap: { width: 490 }
        }).setAlpha(0.9);

        // Eventos para actualizar gradualmente
        this.game.events.on('update-hud', () => this.updateHUD());
        this.game.events.on('update-story', () => this.updateHUD());
        this.updateHUD();
    }

    updateHUD() {
        const percent = PlayerState.xpPercent;
        this.xpBar.width = (200 * percent) / 100;

        this.levelText.setText(`LVL: ${PlayerState.level}`);
        this.xpText.setText(`XP: ${PlayerState.xp}/${PlayerState.xpToNextLevel}`);
        this.wordsText.setText(`Palabras: ${PlayerState.learnedWords.length}`);
        this.dayText.setText(`Día: ${PlayerState.story.day}/30`);
        this.chapterText.setText(`${PlayerState.story.chapter}`);
        this.objectiveText.setText(`OBJ: ${PlayerState.story.activeObjective}`);
    }
}
