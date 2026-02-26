import Phaser from 'phaser';
import { TILE, NPC_DATA } from '../constants.js';
import { PlayerState } from '../services/PlayerState.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // --- 1. ESCENA INICIAL: IMAGEN DE ROGER EN EL HANGAR ---
        this.background = this.add.image(centerX, centerY, 'roger_hangar')
            .setDisplaySize(width, height)
            .setDepth(10);

        // Efecto de respiración sutil de la cámara (parallax leve)
        this.breathingTween = this.tweens.add({
            targets: this.background,
            scale: 1.015,
            duration: 7000,
            yoyo: true,
            loop: -1,
            ease: 'Sine.easeInOut'
        });

        // --- 2. OVERLAY DE AMBIENTE (scanlines + viñeta) ---
        const scanlines = this.add.graphics().setDepth(11);
        scanlines.fillStyle(0x000000, 0.08);
        for (let y = 0; y < height; y += 4) {
            scanlines.fillRect(0, y, width, 2);
        }

        // Viñeta de bordes oscuros
        const vignette = this.add.graphics().setDepth(11);
        const vigRadius = Math.max(width, height) * 0.7;
        vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0.7, 0, 0);
        vignette.fillRect(0, 0, width, height);

        // --- 3. MOSCAS AMBIENTALES ---
        this.createAmbientFlies();

        // --- 4. TEXTO DE INTERACCIÓN (pulsante) ---
        this.interactHint = this.add.text(centerX, height - 40, '[ CLICK ] — ACERCARSE AL PANEL DE ACCESO', {
            fontFamily: '"Press Start 2P"',
            fontSize: '9px',
            fill: '#00ff41',
            alpha: 0.7
        }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: this.interactHint,
            alpha: 0.2,
            duration: 800,
            yoyo: true,
            loop: -1,
            ease: 'Sine.easeInOut'
        });

        // --- 5. INTERACCIÓN ---
        this.input.on('pointerdown', () => this.startDialog());

        // Escuchar el evento de éxito del diálogo
        this.events.on('open-door', () => this.executeCinematicTransition());
    }

    createAmbientFlies() {
        const { width, height } = this.cameras.main;

        for (let i = 0; i < 7; i++) {
            const fly = this.add.sprite(
                Phaser.Math.Between(50, width - 50),
                Phaser.Math.Between(50, height - 80),
                'alien_fly'
            ).setScale(1.8).setDepth(60);

            this.add.particles(0, 0, 'fly_trail', {
                speed: 10,
                scale: { start: 1, end: 0 },
                alpha: { start: 0.3, end: 0 },
                lifespan: 700,
                follow: fly
            });

            this.tweens.add({
                targets: fly,
                x: `+=${Phaser.Math.Between(-80, 80)}`,
                y: `+=${Phaser.Math.Between(-60, 60)}`,
                duration: 2000 + Phaser.Math.Between(0, 2000),
                yoyo: true,
                loop: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    startDialog() {
        if (this.interactHint) {
            this.tweens.killTweensOf(this.interactHint);
            this.interactHint.destroy();
            this.interactHint = null;
        }

        this.scene.pause();
        this.scene.launch('DialogScene', {
            npcName: 'GuardXorblax',
            displayName: 'Panel de Acceso — Sector B-12',
            personality: 'un panel de seguridad con una voz sintetizada fría y hostil que requiere códigos verbales en el idioma configurado para conceder acceso'
        });
    }

    // ================================================================
    //   TRANSICIÓN CINEMÁTICA DE APERTURA DE PUERTA
    // ================================================================
    executeCinematicTransition() {
        // Detener animación de respiración
        if (this.breathingTween) this.breathingTween.stop();
        this.background.setScale(1);

        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Coordenadas de la puerta en la imagen (ACCESS DENIED en la imagen de Roger)
        const doorX = 510;    // centro X de la puerta en la imagen
        const doorY = centerY - 10;
        const panelHW = 96;   // mitad-ancho de cada panel
        const doorH = 260;    // alto de la puerta

        // --- Fondo negro absoluto (base) ---
        this.backdrop = this.add.rectangle(0, 0, width, height, 0x000000)
            .setOrigin(0).setDepth(2);

        // --- Interior (imagen del pasillo) ---
        this.interior = this.add.image(doorX, doorY, 'interior_hallway')
            .setDepth(5)
            .setDisplaySize(panelHW * 5, doorH * 1.8)
            .setAlpha(0);

        // --- Paneles mecánicos (izquierdo y derecho) ---
        this.doorPanelLeft = this.add.image(doorX, doorY, 'mechanical_door')
            .setOrigin(1, 0.5)
            .setDepth(20)
            .setDisplaySize(panelHW, doorH);

        this.doorPanelRight = this.add.image(doorX, doorY, 'mechanical_door')
            .setOrigin(0, 0.5)
            .setDepth(20)
            .setDisplaySize(panelHW, doorH);

        // Flip horizontal del panel derecho para simetría
        this.doorPanelRight.setFlipX(true);

        // --- Glow verde alrededor de la abertura ---
        this.doorGlow = this.add.rectangle(doorX, doorY, panelHW * 2 + 10, doorH + 10, 0x00ff41, 0)
            .setDepth(6);

        // --- Marco de la puerta (permanece estático) ---
        const doorFrame = this.add.graphics().setDepth(19);
        doorFrame.lineStyle(8, 0x00ff41, 0.6);
        doorFrame.strokeRect(doorX - panelHW - 4, doorY - doorH / 2 - 4, panelHW * 2 + 8, doorH + 8);
        doorFrame.lineStyle(2, 0x003311, 1);
        doorFrame.strokeRect(doorX - panelHW - 8, doorY - doorH / 2 - 8, panelHW * 2 + 16, doorH + 16);

        // --- 4. EJECUTAR ANIMACIÓN ---
        this.openDoor(doorX, doorY, panelHW, doorH);
    }

    openDoor(doorX, doorY, panelHW, doorH) {
        const { width, height } = this.cameras.main;

        // ═══ ETAPA 1: TEMBLOR DE ADVERTENCIA ═══
        this.cameras.main.shake(400, 0.005);

        // Chispas de la puerta
        this.time.delayedCall(100, () => {
            this._spawnSparks(doorX, doorY, panelHW, doorH);
        });

        this.time.delayedCall(500, () => {
            // ═══ ETAPA 2: FLASH INICIAL ═══
            const flash = this.add.rectangle(doorX, doorY, panelHW * 2, doorH, 0xffffff, 0)
                .setDepth(35);
            this.tweens.add({
                targets: flash,
                alpha: 0.9,
                duration: 80,
                yoyo: true,
                repeat: 2,
                onComplete: () => flash.destroy()
            });

            // Glow verde se enciende
            this.tweens.add({
                targets: this.doorGlow,
                alpha: 0.25,
                duration: 300,
                ease: 'Power2.easeOut'
            });

            // ═══ ETAPA 3: APERTURA DE PANELES ═══
            // Los paneles se deslizan a los lados con física (ease expo)
            this.tweens.add({
                targets: this.doorPanelLeft,
                x: doorX - panelHW * 3.5,
                alpha: 0.6,
                duration: 2200,
                ease: 'Expo.easeInOut',
            });

            this.tweens.add({
                targets: this.doorPanelRight,
                x: doorX + panelHW * 3.5,
                alpha: 0.6,
                duration: 2200,
                ease: 'Expo.easeInOut',
                onComplete: () => {
                    this._revealInterior(doorX, doorY, panelHW, doorH);
                }
            });

            // Humo / vapor durante la apertura
            this._spawnSteam(doorX, doorY, panelHW, doorH);
        });
    }

    _spawnSparks(doorX, doorY, panelHW, doorH) {
        const positions = [
            [doorX - panelHW, doorY - doorH / 2],
            [doorX + panelHW, doorY - doorH / 2],
            [doorX - panelHW, doorY + doorH / 2],
            [doorX + panelHW, doorY + doorH / 2],
            [doorX, doorY],
        ];
        positions.forEach(([sx, sy]) => {
            const sparks = this.add.particles(sx, sy, 'spark', {
                quantity: 8,
                lifespan: 600,
                speedX: { min: -80, max: 80 },
                speedY: { min: -80, max: 80 },
                scale: { start: 1.5, end: 0 },
                alpha: { start: 1, end: 0 },
                tint: [0x00ff41, 0xffffff, 0x00ccff],
                blendMode: 'ADD',
                maxParticles: 8
            }).setDepth(40);
            this.time.delayedCall(700, () => sparks.destroy());
        });
    }

    _spawnSteam(doorX, doorY, panelHW, doorH) {
        // Humo que sale de la ranura de la puerta al abrirse
        const steamLeft = this.add.particles(doorX - panelHW, doorY, 'fly_trail', {
            quantity: 3,
            frequency: 100,
            lifespan: 900,
            speedX: { min: -30, max: 10 },
            speedY: { min: -60, max: 60 },
            scale: { start: 3, end: 7 },
            alpha: { start: 0.4, end: 0 },
            tint: 0x88aacc,
            blendMode: 'NORMAL'
        }).setDepth(25);

        const steamRight = this.add.particles(doorX + panelHW, doorY, 'fly_trail', {
            quantity: 3,
            frequency: 100,
            lifespan: 900,
            speedX: { min: -10, max: 30 },
            speedY: { min: -60, max: 60 },
            scale: { start: 3, end: 7 },
            alpha: { start: 0.4, end: 0 },
            tint: 0x88aacc,
            blendMode: 'NORMAL'
        }).setDepth(25);

        this.time.delayedCall(2500, () => {
            steamLeft.stop();
            steamRight.stop();
        });
    }

    _revealInterior(doorX, doorY, panelHW, doorH) {
        const { width, height } = this.cameras.main;

        // Máscara: revelar solo el interior de la apertura de la puerta
        const maskGraphics = this.make.graphics();
        maskGraphics.fillStyle(0xffffff);
        // Solo la ventana de la puerta es visible para el interior
        maskGraphics.fillRect(
            doorX - panelHW * 1.2,
            doorY - doorH / 2 * 1.05,
            panelHW * 2.4,
            doorH * 1.1
        );
        const mask = new Phaser.Display.Masks.GeometryMask(this, maskGraphics);
        this.interior.setMask(mask);
        this.interior.setAlpha(1);

        // Glow del interior
        this.tweens.add({
            targets: this.doorGlow,
            alpha: 0,
            duration: 400,
            delay: 300
        });

        // Luz blanca cálida desde el interior
        const innerLight = this.add.rectangle(doorX, doorY, panelHW * 2, doorH, 0xffeedd, 0)
            .setDepth(7);
        this.tweens.add({
            targets: innerLight,
            alpha: 0.15,
            duration: 400,
            yoyo: true,
            repeat: 1
        });

        // ═══ ETAPA 4: ZOOM CINEMATOGRÁFICO ═══
        this.time.delayedCall(400, () => {
            this.cameras.main.shake(800, 0.004);
            this.cameras.main.pan(doorX, doorY, 3000, 'Sine.easeInOut');
            this.cameras.main.zoomTo(6.0, 4000, 'Expo.easeIn', true);

            this.time.delayedCall(2800, () => {
                this.cameras.main.fadeOut(1200, 0, 0, 0);
            });
        });

        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.showVictoryScreen();
        });
    }

    showVictoryScreen() {
        const { width, height } = this.cameras.main;
        this.cameras.main.setZoom(1);
        this.cameras.main.fadeIn(600, 0, 0, 0);

        this.add.rectangle(0, 0, width, height, 0x000000, 1).setOrigin(0).setDepth(100);

        // Línea decorativa
        this.add.rectangle(width / 2, height / 2 - 60, width * 0.6, 2, 0x00ff41, 0.5)
            .setDepth(101);

        this.add.text(width / 2, height / 2 - 40, '◄ SECTOR B-12 ►', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            fill: '#00ff41',
            alpha: 0.6
        }).setOrigin(0.5).setDepth(101);

        const victoryText = this.add.text(width / 2, height / 2, '¡ACCESO CONCEDIDO!', {
            fontFamily: '"Press Start 2P"',
            fontSize: '26px',
            fill: '#00ff41',
            stroke: '#003311',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(101);

        this.tweens.add({
            targets: victoryText,
            alpha: 0.8,
            duration: 1000,
            yoyo: true,
            loop: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(width / 2, height / 2 + 55, '"Misión de limpieza terminada, Roger.\nO casi."', {
            fontFamily: 'VT323',
            fontSize: '24px',
            fill: '#aaffcc',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5).setDepth(101);

        // Decoración XP
        const xp = this.add.text(width / 2, height / 2 + 110, `+${PlayerState.xp} XP — NIVEL ${PlayerState.level}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            fill: '#ffcc00'
        }).setOrigin(0.5).setDepth(101);

        // Línea decorativa inferior
        this.add.rectangle(width / 2, height / 2 + 140, width * 0.6, 2, 0x00ff41, 0.5)
            .setDepth(101);
    }
}
