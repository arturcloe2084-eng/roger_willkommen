import Phaser from 'phaser';
import { SCENE_KEYS } from '../../config/sceneKeys.js';

/**
 * BootScene — Carga todos los assets, JSONs, y genera texturas pixel art.
 * Lee scenes.json para saber qué imágenes de fondo cargar dinámicamente.
 */
export class BootScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.BOOT);
    }

    preload() {
        console.log('[BootScene] Preloading assets...');
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.cameras.main.setBackgroundColor(0x000000);

        // ═══ PANTALLA DE CARGA ═══
        this.add.text(width / 2, height / 2 - 60, 'WILLKOMMEN IN DEUTSCHLAND', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            fill: '#00ff41',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 30, 'Lade Daten...', {
            fontFamily: 'VT323',
            fontSize: '20px',
            fill: '#888888',
            align: 'center'
        }).setOrigin(0.5);

        // Barra de progreso
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x111111, 1);
        progressBox.fillRect(width / 2 - 200, height / 2 + 10, 400, 25);
        progressBox.lineStyle(2, 0x00ff41, 0.8);
        progressBox.strokeRect(width / 2 - 200, height / 2 + 10, 400, 25);

        const progressBar = this.add.graphics();
        const percentText = this.add.text(width / 2, height / 2 + 22, '0%', {
            fontFamily: '"Press Start 2P"',
            fontSize: '9px',
            fill: '#00ff41'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff41, 1);
            progressBar.fillRect(width / 2 - 196, height / 2 + 14, 392 * value, 17);
            percentText.setText(`${Math.floor(value * 100)}%`);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            percentText.destroy();
        });

        // ═══ CARGAR IMAGEN/VIDEO DE FONDO DE MENÚ ═══
        this.load.image('bg_main_menu_new', 'menu/mesa menu sin marca.png');
        this.load.video('bg_intro_video', 'menu/mesa4.mp4', 'loadeddata', false, true);
        this.load.video('bg_menu_video', 'assets/menu.mp4', 'loadeddata', false, true); // Keep as fallback/background if still used

        // ═══ CARGAR JSON DE DATOS ═══
        // scenesData se usa para descubrir y cargar dinámicamente todos los fondos.
        this.load.json('vocabularyData', 'data/vocabulary.json');
        this.load.json('scenesData', 'data/scenes.json');

        // Cuando scenesData se termina de cargar, agregamos a la cola
        // cada background como bg_<sceneId>.
        this.load.once('filecomplete-json-scenesData', () => {
            const scenesData = this.cache.json.get('scenesData');
            if (!scenesData?.scenes) return;

            Object.entries(scenesData.scenes).forEach(([sceneId, sceneDef]) => {
                if (!sceneDef?.background) return;
                const bgKey = `bg_${sceneId}`;
                if (!this.textures.exists(bgKey)) {
                    this.load.image(bgKey, sceneDef.background);
                }
            });
        });
    }

    create() {
        console.log('[BootScene] Assets loaded. Processing scene images...');

        // ═══ VALIDAR FONDOS DECLARADOS ═══
        // Si alguno no cargó, generamos placeholder para no romper escenas.
        const scenesData = this.cache.json.get('scenesData');
        if (scenesData && scenesData.scenes) {
            for (const [sceneId, sceneDef] of Object.entries(scenesData.scenes)) {
                const bgKey = `bg_${sceneId}`;
                if (this.textures.exists(bgKey)) continue;

                console.warn(`[BootScene] Fondo no cargado para escena "${sceneId}" (${sceneDef.background}). Usando placeholder.`);
                const g = this.add.graphics().setVisible(false);
                g.fillStyle(0x1a1a3e, 1);
                g.fillRect(0, 0, 800, 500);
                g.fillStyle(0x00ff41, 0.3);
                g.fillRect(380, 230, 40, 40);
                g.generateTexture(bgKey, 800, 500);
                g.destroy();
            }
        }

        // Fallback global para menú o escenas con fondo ausente.
        if (!this.textures.exists('bg_fallback_generic')) {
            const g = this.add.graphics().setVisible(false);
            g.fillStyle(0x111822, 1);
            g.fillRect(0, 0, 800, 500);
            g.fillStyle(0x2a3b4f, 1);
            g.fillRect(0, 330, 800, 170);
            g.fillStyle(0x6f8ea8, 0.25);
            g.fillRect(50, 60, 700, 220);
            g.generateTexture('bg_fallback_generic', 800, 500);
            g.destroy();
        }

        console.log('[BootScene] Ready. Starting MenuScene...');
        this.scene.start(SCENE_KEYS.MAIN_MENU);
    }
}
