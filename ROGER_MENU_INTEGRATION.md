/**
 * INSTRUCCIONES DE INTEGRACIÓN - ROGER EXAMPLE EN MENÚ
 * 
 * Para que aparezca la escena Roger Example en el menú principal:
 */

// 1. En MainMenuScene (src/scenes/core/MainMenuScene.js), añadir un botón:

/*
    // --- BOTÓN ROGER EXAMPLE ---
    const rogerButton = this.add.text(width / 2, height / 2 + 100, '📖 ROGER EXAMPLE', {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        fill: '#00ff41',
        align: 'center'
    }).setOrigin(0.5).setInteractive();

    rogerButton.on('pointerover', () => rogerButton.setFill('#ffff00'));
    rogerButton.on('pointerout', () => rogerButton.setFill('#00ff41'));
    rogerButton.on('pointerdown', () => {
        this.scene.start(SCENE_KEYS.ROGER_EXAMPLE);
    });
*/

// 2. O añadir como hotspot en SceneEngineScene para que sea accesible desde scenes.json:

/*
    En scenes.json, añadir un hotspot en cualquier escena:
    
    {
        "id": "portal_roger",
        "x": 50,
        "y": 50,
        "width": 100,
        "height": 80,
        "type": "door",
        "target": "roger_example",
        "label": "Tutorial (Roger Example)",
        "special": "roger_example"
    }
*/

// 3. Manejo del evento en SceneEngineScene:

/*
    create() {
        // ... código existente ...
        
        // Detectar hotspots especiales
        this.hotspots.forEach(hotspot => {
            if (hotspot.special === 'roger_example') {
                hotspot.on('pointerdown', () => {
                    this.scene.start(SCENE_KEYS.ROGER_EXAMPLE);
                });
            }
        });
    }
*/

// 4. Alternativa: Crear un portal visual en una escena:

/*
    En cualquier escena, añadir en create():
    
    // Portal a Roger Example
    const rogerPortal = this.add.zone(50, 50, 100, 80);
    rogerPortal.setInteractive();
    
    const portalText = this.add.text(50, 50, '📖\nRoger', {
        fontFamily: 'VT323',
        fontSize: '14px',
        fill: '#00ffff',
        align: 'center'
    }).setOrigin(0.5).setDepth(50);
    
    rogerPortal.on('pointerdown', () => {
        this.scene.start(SCENE_KEYS.ROGER_EXAMPLE);
    });
    
    rogerPortal.on('pointerover', () => {
        portalText.setFill('#ffff00');
        portalText.setScale(1.2);
    });
    
    rogerPortal.on('pointerout', () => {
        portalText.setFill('#00ffff');
        portalText.setScale(1);
    });
*/

// 5. Navegación desde Roger Example de vuelta a menú:

/*
    En RogerExampleScene.endScene():
    
    this.input.keyboard.on('keydown-SPACE', () => {
        // Opción 1: Volver al menú
        this.scene.start(SCENE_KEYS.MAIN_MENU);
        
        // Opción 2: Volver a la escena anterior
        // this.scene.start(SCENE_KEYS.SCENE_ENGINE, { sceneId: 'apartamento' });
    });
*/

// 6. Configuración de accesibilidad en mobile:

/*
    Si usas Phaser en mobile, mostrar botón flotante:
    
    if (this.sys.game.device.os.android || this.sys.game.device.os.iOS) {
        const mobileButton = this.add.text(width - 30, 30, '📖', {
            fontSize: '24px'
        }).setOrigin(0.5).setInteractive();
        
        mobileButton.on('pointerdown', () => {
            this.scene.start(SCENE_KEYS.ROGER_EXAMPLE);
        });
    }
*/

// 7. Pausa y continuar (mantener estado):

/*
    // Guardar estado antes de ir a Roger
    const previousScene = this.scene.key;
    playerProgressStore.setPreviousScene(previousScene);
    
    // En RogerExampleScene.closeDialog():
    const prevScene = playerProgressStore.getPreviousScene();
    this.scene.start(prevScene);
*/

// 8. Estadísticas post-escena:

/*
    En RogerExampleScene, cuando termina:
    
    const stats = {
        sceneId: 'roger_example',
        xpEarned: this.xpEarned,
        karaokeAttempts: karaokeModeService.getPerformanceSummary(),
        completedAt: new Date().toISOString(),
        success: this.xpEarned > 50
    };
    
    playerProgressStore.recordSceneCompletion(stats);
    this.game.events.emit('scene-completed', stats);
*/

// ═══════════════════════════════════════════════════════════

// RECOMENDACIÓN: Implementar en MainMenuScene como opción principal

// Ejemplo completo en MainMenuScene:

/*
create() {
    const { width, height } = this.cameras.main;
    
    // ... existing UI ...
    
    // Menu options
    const options = [
        { label: 'PLAY', scene: SCENE_KEYS.SCENE_ENGINE },
        { label: '📖 LEARN (Roger Example)', scene: SCENE_KEYS.ROGER_EXAMPLE },
        { label: 'DICTIONARY', scene: SCENE_KEYS.DICTIONARY },
        { label: 'EXIT', action: 'exit' }
    ];
    
    options.forEach((option, idx) => {
        const optY = height / 2 - 80 + idx * 40;
        const optText = this.add.text(width / 2, optY, option.label, {
            fontFamily: '"Press Start 2P"',
            fontSize: '9px',
            fill: '#00ff41'
        }).setOrigin(0.5).setInteractive();
        
        optText.on('pointerdown', () => {
            if (option.scene) {
                this.scene.start(option.scene);
            } else if (option.action === 'exit') {
                window.close();
            }
        });
    });
}
*/

export default {
    description: "Integración de Roger Example en menú",
    location: "Consulta este archivo para instrucciones de integración en MainMenuScene"
};
