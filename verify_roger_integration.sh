#!/bin/bash

# ROGER EXAMPLE SCENE - INTEGRATION VERIFICATION SCRIPT
# Verifica que todos los componentes estén correctamente integrados

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 VERIFICACIÓN DE INTEGRACIÓN - ROGER EXAMPLE SCENE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Color variables
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
TOTAL=0
PASSED=0

# Function to check if file exists
check_file() {
    local file=$1
    local description=$2
    
    TOTAL=$((TOTAL + 1))
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        echo "  📍 $file"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $description"
        echo "  📍 $file (NO ENCONTRADO)"
    fi
}

# Function to check if string exists in file
check_content() {
    local file=$1
    local search_string=$2
    local description=$3
    
    TOTAL=$((TOTAL + 1))
    
    if grep -q "$search_string" "$file"; then
        echo -e "${GREEN}✓${NC} $description"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $description"
        echo "  📍 No se encontró: '$search_string'"
    fi
}

echo "📂 VERIFICANDO ARCHIVOS CREADOS:"
echo "─────────────────────────────────────────────────────────────"
check_file "wid-game/src/services/NarratorService.js" "NarratorService.js"
check_file "wid-game/src/services/KaraokeModeService.js" "KaraokeModeService.js"
check_file "wid-game/src/scenes/features/RogerExampleScene.js" "RogerExampleScene.js"
check_file "wid-game/src/services/SceneGeneratorService.js" "SceneGeneratorService.js"
echo ""

echo "🔗 VERIFICANDO INTEGRACIONES EN gameConfig.js:"
echo "─────────────────────────────────────────────────────────────"
check_content "wid-game/src/config/gameConfig.js" "RogerExampleScene" "Importación de RogerExampleScene"
check_content "wid-game/src/config/gameConfig.js" "RogerExampleScene," "Registro de escena en config"
echo ""

echo "🔑 VERIFICANDO INTEGRACIONES EN sceneKeys.js:"
echo "─────────────────────────────────────────────────────────────"
check_content "wid-game/src/config/sceneKeys.js" "ROGER_EXAMPLE" "Clave ROGER_EXAMPLE definida"
echo ""

echo "📖 VERIFICANDO INTEGRACIONES EN MainMenuScene.js:"
echo "─────────────────────────────────────────────────────────────"
check_content "wid-game/src/scenes/core/MainMenuScene.js" "_playRogerExample" "Método _playRogerExample()"
check_content "wid-game/src/scenes/core/MainMenuScene.js" "keydown-R" "Listener para tecla R"
check_content "wid-game/src/scenes/core/MainMenuScene.js" "Roger Example" "Botón Roger Example visible"
echo ""

echo "📋 VERIFICANDO INTEGRACIONES EN DialogScene.js:"
echo "─────────────────────────────────────────────────────────────"
check_content "wid-game/src/scenes/features/DialogScene.js" "narratorService" "Integración con NarratorService"
check_content "wid-game/src/scenes/features/DialogScene.js" "createCharacterVisual" "Método de visualización de caracteres"
echo ""

echo "📊 VERIFICANDO DATOS EN scenes.json:"
echo "─────────────────────────────────────────────────────────────"
check_content "wid-game/public/data/scenes.json" "roger_example" "Escena roger_example en scenes.json"
echo ""

echo "📚 VERIFICANDO DOCUMENTACIÓN:"
echo "─────────────────────────────────────────────────────────────"
check_file "ROGER_EXAMPLE_GUIDE.md" "Guía de Roger Example Scene"
check_file "ROGER_SYSTEM_SUMMARY.md" "Resumen de arquitectura"
check_file "IMPLEMENTACION_COMPLETA.md" "Documentación de implementación"
check_file "ROGER_SCENE_FINAL_STATUS.md" "Estado final de la escena"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "📊 RESULTADO DE VERIFICACIÓN:"
echo "─────────────────────────────────────────────────────────────"
echo -e "Total de verificaciones: ${YELLOW}$TOTAL${NC}"
echo -e "Pasadas: ${GREEN}$PASSED${NC}"
echo -e "Fallidas: ${RED}$((TOTAL - PASSED))${NC}"
echo ""

if [ $PASSED -eq $TOTAL ]; then
    echo -e "${GREEN}✓ TODAS LAS VERIFICACIONES PASARON${NC}"
    echo "🎮 La escena Roger Example está completamente integrada y lista."
    exit 0
else
    echo -e "${YELLOW}⚠ ALGUNAS VERIFICACIONES FALLARON${NC}"
    echo "Por favor verifica los archivos listados arriba."
    exit 1
fi
