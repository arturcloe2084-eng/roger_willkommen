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

        // --- 1. ESCENA INICIAL LIMPIA ---
        // Al inicio solo vemos la pared exterior. Nada más.
        this.background = this.add.image(centerX, centerY, 'full_scene')
            .setDisplaySize(width, height)
            .setDepth(10);

        // Efecto de movimiento sutil de la cámara
        this.tweens.add({
            targets: this.background,
            scale: 1.01,
            duration: 6000,
            yoyo: true,
            loop: -1
        });

        // Moscas ambientales
        this.createAmbientFlies();

        // Interacción única: clic para hablar
        this.input.on('pointerdown', () => this.startDialog());

        // Escuchar el evento de éxito
        this.events.on('open-door', () => this.executeCinematicTransition());
    }

    createAmbientFlies() {
        for (let i = 0; i < 6; i++) {
            const fly = this.add.sprite(
                Phaser.Math.Between(50, 750),
                Phaser.Math.Between(50, 450),
                'alien_fly'
            ).setScale(1.5).setDepth(60);

            this.add.particles(0, 0, 'fly_trail', {
                speed: 10,
                scale: { start: 1, end: 0 },
                alpha: { start: 0.3, end: 0 },
                lifespan: 600,
                follow: fly
            });

            this.tweens.add({
                targets: fly,
                x: `+=${Phaser.Math.Between(-60, 60)}`,
                y: `+=${Phaser.Math.Between(-60, 60)}`,
                duration: 2500 + Phaser.Math.Between(0, 1000),
                yoyo: true,
                loop: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    startDialog() {
        this.scene.pause();
        this.scene.launch('DialogScene', {
            npcName: 'GuardXorblax',
            displayName: 'Panel de Acceso',
            personality: 'un panel de seguridad con una voz sintetizada fría y hostil que requiere códigos verbales en alemán'
        });
    }

    executeCinematicTransition() {
        // DETENER ANIMACIONES DE FONDO
        if (this.breathingTween) this.breathingTween.stop();
        this.background.setScale(1);
        this.cameras.main.setBackgroundColor(0x000000);

        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;
        const doorX = 538;
        const doorY = centerY + 10;
        const panelWidth = 110;
        const doorHeight = 310;

        // --- 0. FONDO NEGRO ABSOLUTO (Garantizar que no haya gris) ---
        this.backdrop = this.add.rectangle(0, 0, width, height, 0x000000)
            .setOrigin(0).setDepth(2);

        // --- 1. PREPARACIÓN DEL INTERIOR ---
        // Aumentamos el tamaño significativamente para cubrir bordes
        this.interior = this.add.image(doorX, doorY, 'interior_hallway')
            .setDepth(5)
            .setDisplaySize(panelWidth * 2.5, doorHeight * 1.5)
            .setAlpha(0);

        // --- 2. PANELES MECÁNICOS ---
        this.doorPanelLeft = this.add.image(doorX, doorY, 'mechanical_door')
            .setOrigin(1, 0.5).setDepth(20).setScale(0, 1.25);
        this.doorPanelRight = this.add.image(doorX, doorY, 'mechanical_door')
            .setOrigin(0, 0.5).setDepth(20).setScale(0, 1.25);

        // --- 3. EFECTO DE GLOW / LUZ ---
        this.doorGlow = this.add.rectangle(doorX, doorY, panelWidth * 2, doorHeight, 0x00ff41, 0.15)
            .setDepth(6).setAlpha(0);

        // --- 4. EJECUTAR ANIMACIÓN ---
        this.openDoor(doorX, doorY, panelWidth, doorHeight);
    }

    openDoor(doorX, doorY, panelWidth, doorHeight) {
        const { width, height } = this.cameras.main;

        // ETAPA 1: LOS PANELES APARECEN
        this.tweens.add({
            targets: [this.doorPanelLeft, this.doorPanelRight],
            scaleX: panelWidth / 128,
            duration: 500,
            ease: 'Power2.easeOut',
            onComplete: () => {
                // ETAPA 2: HUMO Y PREPARACIÓN
                const steam = this.add.particles(doorX, doorY + 120, 'fly_trail', {
                    quantity: 20,
                    lifespan: 800,
                    speedY: { min: -150, max: -50 },
                    scale: { start: 2, end: 6 },
                    alpha: { start: 0.6, end: 0 },
                    blendMode: 'ADD',
                    tint: 0x00ff41
                }).setDepth(25);

                this.time.delayedCall(600, () => {
                    steam.stop();

                    // Revelar el interior
                    this.interior.setAlpha(1);
                    this.doorGlow.setAlpha(1);

                    // MÁSCARA TOTAL (Ajustamos para que NO existan huecos de 1px)
                    const maskGraphics = this.make.graphics();
                    maskGraphics.fillStyle(0xffffff);

                    // Izquierda y Derecha (con solape central)
                    maskGraphics.fillRect(0, 0, doorX - panelWidth + 2, height);
                    maskGraphics.fillRect(doorX + panelWidth - 2, 0, width - (doorX + panelWidth) + 2, height);
                    // Superior e Inferior (con solape vertical)
                    maskGraphics.fillRect(doorX - panelWidth, 0, panelWidth * 2, doorY - (doorHeight / 2) + 2);
                    maskGraphics.fillRect(doorX - panelWidth, doorY + (doorHeight / 2) - 2, panelWidth * 2, height - (doorY + doorHeight / 2) + 2);

                    const mask = new Phaser.Display.Masks.GeometryMask(this, maskGraphics);
                    this.background.setMask(mask);

                    // ETAPA 3: APERTURA CINEMÁTICA
                    this.cameras.main.shake(1500, 0.008);

                    const flash = this.add.rectangle(doorX, doorY, panelWidth * 2, doorHeight, 0xffffff, 1)
                        .setDepth(30).setAlpha(0);
                    this.tweens.add({ targets: flash, alpha: 0.8, duration: 150, yoyo: true });

                    this.tweens.add({
                        targets: this.doorPanelLeft,
                        x: doorX - 250,
                        alpha: 0,
                        duration: 3500,
                        ease: 'Quint.easeInOut'
                    });

                    this.tweens.add({
                        targets: this.doorPanelRight,
                        x: doorX + 250,
                        alpha: 0,
                        duration: 3500,
                        ease: 'Quint.easeInOut'
                    });

                    // ZOOM DINÁMICO
                    this.time.delayedCall(500, () => {
                        this.cameras.main.pan(doorX, doorY, 3500, 'Sine.easeInOut');
                        this.cameras.main.zoomTo(6.5, 4500, 'Expo.easeIn', true);

                        this.time.delayedCall(3000, () => {
                            this.cameras.main.fadeOut(1500, 0, 0, 0);
                        });
                    });

                    this.cameras.main.once('camerafadeoutcomplete', () => {
                        this.showVictoryScreen();
                    });
                });
            }
        });
    }

    showVictoryScreen() {
        const { width, height } = this.cameras.main;
        this.add.rectangle(0, 0, width, height, 0x000000, 1).setOrigin(0).setDepth(100);

        this.add.text(width / 2, height / 2 - 20, '¡SECTOR B-12 ALCANZADO!', {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: '#00ff41'
        }).setOrigin(0.5).setDepth(101);

        this.add.text(width / 2, height / 2 + 40, 'Misión de limpieza terminada, Roger.', {
            fontFamily: 'VT323',
            fontSize: '22px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(101);
    }
}
