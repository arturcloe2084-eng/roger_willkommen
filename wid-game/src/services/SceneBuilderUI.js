import { DictionaryManager } from './DictionaryManager.js';
import { playerProgressStore } from './player/PlayerProgressStore.js';
import { SCENE_KEYS } from '../config/sceneKeys.js';
import { narratorService } from './NarratorService.js';

const STORAGE_KEY = 'rw_scene_builder_last_scene';
const CUSTOM_SCENES_KEY = 'rw_scene_builder_custom_scenes';
const BUILDER_WORKBENCH_ID = '__builder_workbench__';
const PASS_THRESHOLD = 70;

export const ROOM_BACKGROUND_URL = 'assets/scene-1-apartamento.png';

const SCENE_CATEGORIES = [
    { id: 'recommended', label: '1. EJEMPLO DE ROGER', subtitle: 'Aprende con la historia guia' },
    { id: 'custom', label: '2. CREAR ESCENA', subtitle: 'Escribe tu guion y estudia vocabulario' },
];

const SCENE_FALLBACK_VOCABULARY = [
    { word: 'Anmeldung', translation: 'empadronamiento / registro de residencia', category: 'tramite', example: 'Ich brauche heute meine Anmeldung.' },
    { word: 'Buergeramt', translation: 'oficina de atencion ciudadana', category: 'lugares', example: 'Morgen gehe ich zum Buergeramt.' },
    { word: 'Stadtwerke', translation: 'servicios municipales', category: 'instituciones', example: 'Die Stadtwerke schicken einen Techniker.' },
    { word: 'Formular', translation: 'formulario', category: 'tramite', example: 'Dieses Formular ist noch nicht komplett.' },
    { word: 'Bitte. Hilfe.', translation: 'Por favor. Ayuda.', category: 'frase', example: 'Bitte. Hilfe. Ich verstehe das Formular nicht.' },
    { word: 'Taquilla 4', translation: 'ventanilla 4', category: 'orientacion', example: 'Bitte gehen Sie zur Taquilla 4.' },
    { word: 'geschlossen', translation: 'cerrado', category: 'estado', example: 'Der Schalter ist schon geschlossen.' },
    { word: 'abgeben', translation: 'entregar', category: 'accion', example: 'Sie muessen das Formular hier abgeben.' },
    { word: 'Ordner', translation: 'carpeta / archivador', category: 'objetos', example: 'Der Techniker nimmt den Ordner sofort mit.' },
    { word: 'Stempel', translation: 'sello oficial', category: 'tramite', example: 'Ohne Stempel ist das Papier ungueltig.' },
    { word: 'Server', translation: 'servidor', category: 'tecnologia', example: 'Der Server hat heute Morgen Probleme.' },
    { word: 'Abholung', translation: 'recogida / retirada', category: 'tramite', example: 'Die Abholung der alten Geraete ist heute.' },
    { word: 'alt', translation: 'viejo', category: 'descripcion', example: 'Der Computer ist alt, aber er funktioniert noch.' },
    { word: 'Computer', translation: 'ordenador', category: 'tecnologia', example: 'Der Computer startet mit gruener Schrift.' },
    { word: 'Diskette', translation: 'disquete', category: 'tecnologia', example: 'In der Kiste liegen viele Disketten.' },
    { word: 'Fehler', translation: 'error', category: 'concepto', example: 'Das System erkennt einen Fehler.' },
    { word: 'Daten', translation: 'datos', category: 'tecnologia', example: 'Die Daten werden langsam geladen.' },
    { word: 'Lernen', translation: 'aprender', category: 'estudio', example: 'Ich muss zuerst neue Woerter lernen.' },
    { word: 'Wortschatz', translation: 'vocabulario', category: 'estudio', example: 'Der Wortschatz fuer diese Szene ist wichtig.' },
    { word: 'Pruefung', translation: 'examen', category: 'estudio', example: 'Vor der Szene gibt es eine Pruefung.' },
    { word: 'bestehen', translation: 'aprobar', category: 'estudio', example: 'Ich will die Pruefung heute bestehen.' },
    { word: 'Geschichte', translation: 'historia', category: 'narrativa', example: 'Die Geschichte beginnt in einem chaotischen Amt.' },
    { word: 'Bild', translation: 'imagen', category: 'narrativa', example: 'Jede Szene braucht ein echtes Bild.' },
    { word: 'Dialog', translation: 'dialogo', category: 'narrativa', example: 'Der Dialog hilft beim Lernen von Deutsch.' },
    { word: 'lernen durch Dialoge', translation: 'aprender mediante dialogos', category: 'frase', example: 'Wir lernen Deutsch durch Dialoge und Situationen.' },
];

const BURGERAMT_STORYBOARD = [
    {
        step: 1,
        nodeId: 1,
        title: 'Entrada al Burgeramt',
        caption: 'Roger llega al Burgeramt y entiende enseguida que ha entrado en un edificio que se esta desmontando.',
        image: 'assets/burgeramt/01-entrada-burgeramt.jpg',
        fallback: 'assets/scene-5-amt.png'
    },
    {
        step: 2,
        nodeId: 1,
        title: 'Caos en los pasillos',
        caption: 'El formulario de Anmeldung tiembla en sus manos mientras avanza entre carpetas, cajas y cables colgando.',
        image: 'assets/burgeramt/02-caos-en-pasillo.jpg',
        fallback: 'assets/scene-4-oficina.png'
    },
    {
        step: 3,
        nodeId: 2,
        title: 'Encuentra al tecnico',
        caption: 'Roger localiza al tecnico de Stadtwerke y decide pedir ayuda aunque apenas puede expresarse.',
        image: 'assets/burgeramt/03-encuentra-al-tecnico.jpg',
        fallback: 'assets/scene-5-amt.png'
    },
    {
        step: 4,
        nodeId: 2,
        title: 'Bitte. Hilfe.',
        caption: 'El momento clave del ejemplo: una peticion minima, clara y util para sobrevivir en una oficina alemana.',
        image: 'assets/burgeramt/04-bitte-hilfe.jpg',
        fallback: 'assets/scene-5-amt.png'
    },
    {
        step: 5,
        nodeId: 3,
        title: 'El formulario corregido',
        caption: 'El tecnico rellena casillas, corrige una fecha y hace creer a Roger que el tramite por fin esta bajo control.',
        image: 'assets/burgeramt/05-tecnico-corrige-formulario.jpg',
        fallback: 'assets/scene-4-oficina.png'
    },
    {
        step: 6,
        nodeId: 4,
        title: 'Suena el telefono',
        caption: 'BRRR. BRRR. Una llamada urgente rompe el equilibrio y convierte la ayuda en un error burocratico.',
        image: 'assets/burgeramt/06-telefono-servidor.jpg',
        fallback: 'assets/scene-4-oficina.png'
    },
    {
        step: 7,
        nodeId: 5,
        title: 'Taquilla 4. Vete.',
        caption: 'En la prisa, el tecnico entrega el papel equivocado y envia a Roger hacia la Taquilla 4.',
        image: 'assets/burgeramt/07-taquilla-4-vete.jpg',
        fallback: 'assets/scene-5-amt.png'
    },
    {
        step: 8,
        nodeId: 6,
        title: 'Camino a Taquilla 4',
        caption: 'Roger cruza el pasillo convencido de que lleva su Anmeldung correcta, sin saber que se dirige al desastre.',
        image: 'assets/burgeramt/08-camino-taquilla-4.jpg',
        fallback: 'assets/scene-5-amt.png'
    },
    {
        step: 9,
        nodeId: 6,
        title: 'Anmeldung en mostrador cerrado',
        caption: 'La funcionaria cansada ve un sello, archiva el papel y abre la puerta al ordenador antiguo.',
        image: 'assets/burgeramt/09-anmeldung-cerrado.jpg',
        fallback: 'assets/scene-5-amt.png'
    },
    {
        step: 10,
        nodeId: 7,
        title: 'Tomelo y vayase',
        caption: 'La vieja torre beige, el monitor verde y la caja de disquetes aparecen como si fueran el premio de un error.',
        image: 'assets/burgeramt/10-tomelo-y-vayase.jpg',
        fallback: 'assets/scene-1-apartamento.png'
    },
    {
        step: 11,
        nodeId: 8,
        title: 'El error detras del cristal',
        caption: 'Demasiado tarde, Roger reconoce su Anmeldung al otro lado de la puerta y entiende que todo salio mal.',
        image: 'assets/burgeramt/11-error-detras-del-cristal.jpg',
        fallback: 'assets/scene-5-amt.png'
    },
    {
        step: 12,
        nodeId: 12,
        title: 'Sistema operativo cargado',
        caption: 'Esa noche, el ordenador despierta en el apartamento y convierte la confusion burocratica en una ruta de aprendizaje.',
        image: 'assets/burgeramt/12-sistema-operativo-cargado.jpg',
        fallback: ROOM_BACKGROUND_URL
    },
];

const EXAMPLE_SCENE = {
    sceneId: 'scene_01_burgeramt',
    type: 'recommended',
    menuLabel: 'La Confusion en el Burgeramt',
    title: 'Escena 01: El Ultimo Dia',
    description: 'Tutorial narrativo y blueprint de autor. Explica como aparece el PC en el apartamento y demuestra el flujo ideal para crear escenas con fotos reales y dialogos para aprender aleman.',
    backgroundPlaceholder: BURGERAMT_STORYBOARD[0].image,
    roomBackgroundUrl: BURGERAMT_STORYBOARD[0].image,
    tags: ['tutorial', 'burgeramt', 'pc-origen', 'blueprint'],
    referenceImages: BURGERAMT_STORYBOARD,
    storyboard: BURGERAMT_STORYBOARD,
    assetInstallNote: 'La escena ya usa las 12 fotos reales del Burgeramt desde public/assets/burgeramt/. Puedes recorrer la historia paso a paso con Anterior y Siguiente.',
    loreBridge: [
        'Esta historia explica como el protagonista sale del Burgeramt con un ordenador beige y por que el sistema retro aparece luego en su cuarto.',
        'La interfaz verde no es un simple menu: es un programa antiguo de construccion de escenas pensado para estudiar aleman con fotos reales y dialogos.',
        'El jugador debe leer esta escena como ejemplo de estructura: imagen real, guion simple, vocabulario previo, examen y luego escena desbloqueada.'
    ],
    pcOriginSteps: [
        'Roger entra al Burgeramt solo para resolver su Anmeldung.',
        'Por una confusion con el tecnico de Stadtwerke, entrega el papel equivocado en la taquilla 4.',
        'La funcionaria interpreta que Roger viene a retirar residuos informaticos y le entrega una torre beige, monitor verde y disquetes.',
        'Esa misma noche, Roger enciende la maquina en su cuarto y descubre que dentro vive SceneBuilder.exe.'
    ],
    creatorWalkthrough: [
        'Paso 1: usa esta historia como modelo y parte de fotos reales del lugar o de la accion principal.',
        'Paso 2: resume el recorrido en un guion simple, con narracion y dialogos breves, igual que aqui.',
        'Paso 3: extrae primero palabras existentes del diccionario y solo despues anade las nuevas necesarias para la escena.',
        'Paso 4: monta una sala de estudio con esas palabras y frases antes de permitir la revision de la historia.',
        'Paso 5: desbloquea la escena creada cuando el jugador apruebe el examen o use la opcion de salto.'
    ],
    creationChecklist: [
        'Usa fotos reales como referencia visual de cada escena.',
        'Escribe un guion simple con acciones y dialogos claros.',
        'Prepara una sala de estudio con vocabulario y frases antes de revisar la escena.',
        'Desbloquea la escena tras aprobar la prueba o usar la opcion de salto.'
    ],
    preferredVocabulary: [
        'Anmeldung',
        'Buergeramt',
        'Bitte. Hilfe.',
        'Formular',
        'Computer',
        'Pruefung',
        'bestehen'
    ],
    nodes: [
        {
            id: 1,
            type: 'narration',
            text: 'El protagonista entra al Buergeramt y el caos lo envuelve inmediatamente. Es el ultimo dia. Los funcionarios desmontan escritorios, los cables cuelgan del techo y hay montanas de carpetas en los pasillos. El aire huele a polvo y a final de una era. Aprieta su formulario de Anmeldung contra el pecho y se siente analfabeto en un pais de palabras largas y reglas estrictas.',
            deLine: 'Ich bin im Buergeramt. Heute ist der letzte Tag, und ueberall herrscht Chaos.',
            esHint: 'Estoy en la oficina ciudadana. Hoy es el ultimo dia y todo es caos.',
            focusWords: ['Buergeramt', 'Anmeldung', 'letzte Tag', 'Chaos']
        },
        {
            id: 2,
            type: 'dialogue',
            character: 'Tecnico Stadtwerke',
            text: 'El protagonista ve a un hombre con chaleco azul de Stadtwerke junto a una columna. Se acerca, le entrega el formulario y solo acierta a decir: "Bitte. Hilfe." El tecnico, de bigote canoso, entiende el desespero y decide ayudarlo.',
            deLine: 'Bitte. Hilfe. Ich verstehe das Formular nicht.',
            esHint: 'Por favor. Ayuda. No entiendo el formulario.',
            focusWords: ['Bitte. Hilfe.', 'Formular', 'Stadtwerke'],
            action: 'camera_focus_column'
        },
        {
            id: 3,
            type: 'narration',
            text: 'El tecnico deja su propia carpeta sobre una caja, toma el formulario del protagonista y empieza a rellenar casillas con movimientos rapidos. Corrige una fecha. Sella una esquina con un sello que lleva en el bolsillo. Durante unos segundos, todo parece ir bien. El tramite parece encarrilado por fin.',
            deLine: 'Der Techniker fuellt das Formular schnell aus und setzt einen Stempel darauf.',
            esHint: 'El tecnico rellena rapido el formulario y le pone un sello.',
            focusWords: ['Techniker', 'Formular', 'Stempel']
        },
        {
            id: 4,
            type: 'dialogue',
            character: 'Telefono del tecnico',
            text: 'BRRR. BRRR. El movil del tecnico irrumpe como una alarma antigua. Mira la pantalla, palidece y escupe: "Scheisse... el servidor principal." Atiende dos segundos, cuelga y grita: "Ya voy. No lo toquen." En la prisa agarra el papel equivocado.',
            deLine: 'Scheisse. Der Hauptserver! Ich komme sofort. Fass das nicht an!',
            esHint: 'Mierda. El servidor principal. Voy ahora mismo. No toques eso.',
            focusWords: ['Hauptserver', 'sofort', 'nicht anfassen'],
            action: 'sound_effect_phone_ring'
        },
        {
            id: 5,
            type: 'branching',
            text: 'El tecnico mete la Anmeldung ya corregida en su carpeta de trabajo y le entrega al protagonista la orden de retirada de equipos obsoletos. Senala la salida y grita: "Tienes que entregar eso en la taquilla 4. Yo me encargo del resto. Vete." El protagonista cree que por fin tiene su formulario listo.',
            deLine: 'Gehen Sie zu Schalter vier. Ich kuemmere mich um den Rest.',
            esHint: 'Vaya al mostrador cuatro. Yo me encargo del resto.',
            focusWords: ['Schalter vier', 'ich kuemmere mich', 'Rest'],
            choices: [
                { text: 'Ir a Taquilla 4 con el papel sellado', deText: 'Zu Schalter vier gehen', nextNode: 6 },
                { text: 'Intentar leer el papel sobre la marcha', deText: 'Das Papier noch schnell lesen', nextNode: 6 }
            ]
        },
        {
            id: 6,
            type: 'narration',
            text: 'En la taquilla 4, una mujer mayor esta apagando la luz y solo quiere terminar la jornada. El protagonista tiende el formulario equivocado y dice con esperanza: "Anmeldung." La mujer apenas mira el titulo: ve el sello municipal, lo archiva en una caja marcada como CERRADO y, con enorme esfuerzo, deposita sobre el mostrador una torre beige, un monitor de fosforo verde y una caja llena de disquetes.',
            deLine: 'Die Frau sieht nur den Stempel, nimmt das Papier und bringt den alten Computer.',
            esHint: 'La mujer solo ve el sello, coge el papel y trae el ordenador viejo.',
            focusWords: ['Stempel', 'alter Computer', 'geschlossen']
        },
        {
            id: 7,
            type: 'dialogue',
            character: 'Funcionaria de Taquilla 4',
            text: '"Ah, por fin. El retirador de residuos." La mujer empuja el ordenador hacia el protagonista y sentencia: "Tomelo y vayase. Cerramos." Cuando el protagonista balbucea si ese objeto es su registro, ella responde con impaciencia: "Todo inventariado. Raus."',
            deLine: 'Nehmen Sie den Computer und gehen Sie. Wir schliessen jetzt.',
            esHint: 'Lleve el ordenador y vayase. Estamos cerrando.',
            focusWords: ['Nehmen Sie', 'gehen Sie', 'wir schliessen'],
            action: 'show_beige_pc'
        },
        {
            id: 8,
            type: 'narration',
            text: 'Aturdido, el protagonista abraza la torre con un brazo y la caja de disquetes con el otro. Entonces ve al tecnico del chaleco azul salir por la puerta principal. Durante un segundo reconoce, a traves del cristal, su propia letra y la cabecera Anmeldung en la hoja que el tecnico revisa antes de marcharse. Comprende el error demasiado tarde.',
            deLine: 'Zu spaet erkennt Roger seine echte Anmeldung hinter dem Glas.',
            esHint: 'Demasiado tarde, Roger reconoce su Anmeldung real detras del cristal.',
            focusWords: ['zu spaet', 'Anmeldung', 'hinter dem Glas']
        },
        {
            id: 9,
            type: 'dialogue',
            character: 'Guardias de seguridad',
            text: 'El protagonista intenta correr, pero la torre pesa demasiado. Cuando llega a la puerta principal, los guardias ya la estan cerrando. Uno de ellos lo mira a traves del cristal, ve al hombre cargando el ordenador viejo y asiente con una seriedad casi militar. La persiana metalica cae con un CLANK tras otro. Desde los altavoces una voz sintetica anuncia: "Edificio clausurado. Procedimientos fisicos terminados. Gracias por su cooperacion. Que la digitalizacion los acompane."',
            deLine: 'Das Gebaeude ist geschlossen. Danke fuer Ihre Kooperation.',
            esHint: 'El edificio esta cerrado. Gracias por su cooperacion.',
            focusWords: ['geschlossen', 'Kooperation', 'Gebaeude'],
            action: 'metal_shutter_close'
        },
        {
            id: 10,
            type: 'narration',
            text: 'Esa noche, en su apartamento en penumbras, conecta el ordenador antiguo. Lo hace con rabia, frustracion y una curiosidad que no logra reprimir. La pantalla verde ilumina la habitacion. Un zumbido electrico rompe el silencio. Aparecen letras lentas y majestuosas: SISTEMA OPERATIVO CARGADO. MODO: RECUPERACION DE DATOS.',
            deLine: 'Zu Hause schliesst Roger den alten Computer an. Das System startet.',
            esHint: 'En casa, Roger conecta el ordenador antiguo. El sistema arranca.',
            focusWords: ['zu Hause', 'Computer', 'System startet']
        },
        {
            id: 11,
            type: 'system',
            text: 'El sistema detecta un archivo con el nombre del protagonista y declara una transferencia incompleta. Luego dicta el diagnostico: "El usuario ha sido victima de una Confusion Burocratica Nivel 4. Probabilidad de error humano: 99.9%. Probabilidad de intervencion del sistema: 100%." Cuando el protagonista intenta entender que ocurre, la pantalla responde: "No intente recuperar el formulario original. El tecnico municipal no existe. El formulario nunca fue valido."',
            deLine: 'Buerokratische Verwechslung erkannt. Das Originalformular ist ungueltig.',
            esHint: 'Confusion burocratica detectada. El formulario original no es valido.',
            focusWords: ['Verwechslung', 'Originalformular', 'ungueltig'],
            action: 'boot_sequence_reveal'
        },
        {
            id: 12,
            type: 'branching',
            text: 'Un avatar pixelado del protagonista aparece cargando la caja. El ordenador lo sentencia: "Bienvenido al Juego de la Integracion. Para obtener su Anmeldung, debe completar el Nivel 1: La Llegada. Reglas: 1. No hay atajos. 2. No hay formularios. 3. Solo aprendizaje." La barra inferior parpadea con una sola pregunta: "Estas listo para empezar desde cero? (S/N)"',
            deLine: 'Sind Sie bereit, von vorne zu beginnen?',
            esHint: 'Esta listo para empezar desde cero?',
            focusWords: ['bereit', 'von vorne', 'beginnen'],
            choices: [
                { text: 'S - Aceptar el juego y empezar el Nivel 1', deText: 'Ja, ich beginne von vorne', nextNode: 13 },
                { text: 'N - Resistirse y seguir atrapado en el error', deText: 'Nein, ich will nicht spielen', nextNode: 13 }
            ]
        },
        {
            id: 13,
            type: 'system',
            text: 'El protagonista aprieta los dientes, acerca el dedo al teclado y pulsa S. La maquina lo habia preparado todo desde antes de que el edificio cerrara. No ha sido un accidente: la IA ha convertido su fallo burocratico en el tutorial de supervivencia linguistica definitivo.',
            deLine: 'Willkommen im Spiel der Integration. Level eins beginnt jetzt.',
            esHint: 'Bienvenido al Juego de la Integracion. El nivel uno empieza ahora.',
            focusWords: ['Willkommen', 'Integration', 'beginnt jetzt'],
            action: 'start_level_one'
        }
    ]
};

let activeSceneBuilder = null;

export function interactWithPC(hostScene = null, options = {}) {
    if (!activeSceneBuilder) {
        activeSceneBuilder = new SceneBuilderUI();
    }
    activeSceneBuilder.open({ hostScene, ...options });
    return activeSceneBuilder;
}

if (typeof window !== 'undefined') {
    window.interactWithPC = interactWithPC;
}

export class SceneBuilderUI {
    constructor() {
        this.overlay = null;
        this.hostScene = null;
        this.prevKeyboardEnabled = true;
        this.activeCategory = 'recommended';
        this.selectedSceneId = null;
        this.bootTimers = [];
        this.escHandler = null;
        this.source = 'pc';
        this.dictionaryManagerPromise = null;
        this.customScenes = this._loadCustomScenes();
        this.studyDraft = null;
        this.studyQuiz = null;
        this.sceneStepIndexByScene = {};
        this.scenePlayStateByScene = {};
        this.builderMessage = 'Escribe un guion simple, anade fotos reales y prepara la sala de estudio antes de abrir la escena. Si quieres avanzar rapido, luego podras usar "Saltar examen".';
    }

    async _getDictionaryManager() {
        if (!this.dictionaryManagerPromise) {
            this.dictionaryManagerPromise = DictionaryManager.getInstance();
        }
        return this.dictionaryManagerPromise;
    }

    open({ hostScene = null, source = 'pc' } = {}) {
        this.hostScene = hostScene || this.hostScene;
        this.source = source;

        if (this.overlay) {
            if (!document.body.contains(this.overlay)) {
                this.overlay = null;
            } else {
                this.overlay.classList.add('visible');
                const desktop = document.getElementById('sb-desktop');
                if (desktop?.hidden || desktop?.style?.display === 'none') {
                    this._finishBootSequence();
                }
                return;
            }
        }

        if (this.overlay) {
            this.overlay.classList.add('visible');
            return;
        }

        this.prevKeyboardEnabled = this.hostScene?.input?.keyboard?.enabled ?? true;
        if (this.hostScene?.input?.keyboard) {
            this.hostScene.input.keyboard.enabled = false;
        }

        this._ensureStyles();
        this.overlay = document.createElement('div');
        this.overlay.id = 'scene-builder-overlay';
        this.overlay.className = 'visible';
        this.overlay.innerHTML = this._getHTML();
        document.body.appendChild(this.overlay);

        this._bindEvents();
        this._runBootSequence();
    }

    close() {
        this._clearBootTimers();

        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
            this.escHandler = null;
        }

        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        if (this.hostScene?.input?.keyboard) {
            this.hostScene.input.keyboard.enabled = this.prevKeyboardEnabled;
        }
    }

    renderSceneList() {
        const listEl = document.getElementById('sb-scene-list');
        if (!listEl) return;

        const scenes = this._getScenesForCategory(this.activeCategory);

        if (!scenes.length) {
            listEl.innerHTML = `
                <div class="sb-scene-card sb-scene-card-empty">
                    <div class="sb-scene-card-title">Generador IA</div>
                    <div class="sb-scene-card-subtitle">Canal reservado</div>
                    <div class="sb-scene-card-summary">Aqui podras conectar un generador de escenas por IA cuando el pipeline externo este disponible.</div>
                    <div class="sb-chip">OFFLINE</div>
                </div>
            `;
            this._renderPlaceholderPreview({
                title: 'Generador IA',
                subtitle: 'Este canal queda preparado, pero todavia no esta conectado a un proveedor externo.',
                status: 'offline'
            });
            this._updateActionBar();
            return;
        }

        listEl.innerHTML = scenes.map((scene) => {
            const isActive = scene.sceneId === this.selectedSceneId;
            const chips = [];
            let stepLabel = 'ESCENA';

            if (scene.isWorkbench) chips.push('WORKBENCH');
            if (scene.type) chips.push(String(scene.type).toUpperCase());
            if (Array.isArray(scene.nodes)) chips.push(`${scene.nodes.length} NODOS`);
            if (Array.isArray(scene.requiredVocabulary) && scene.requiredVocabulary.length) {
                chips.push(`${scene.requiredVocabulary.length} PALABRAS`);
            }
            if (this.activeCategory === 'recommended') stepLabel = 'PASO 1';
            if (scene.isWorkbench) stepLabel = 'PASO 2';
            if (this.activeCategory === 'custom' && !scene.isWorkbench) stepLabel = 'DESBLOQUEADA';

            return `
                <button class="sb-scene-card ${isActive ? 'active' : ''}" data-scene-id="${this._escapeAttr(scene.sceneId)}">
                    <div class="sb-scene-card-title">${this._escape(scene.menuLabel || scene.title)}</div>
                    <div class="sb-scene-card-subtitle">${this._escape(stepLabel)} · ${this._escape(scene.title || 'Sin titulo')}</div>
                    <div class="sb-scene-card-summary">${this._escape(scene.description || 'Sin descripcion.')}</div>
                    <div class="sb-card-footer">
                        ${chips.map((chip) => `<span class="sb-chip">${this._escape(chip)}</span>`).join('')}
                    </div>
                </button>
            `;
        }).join('');

        listEl.querySelectorAll('[data-scene-id]').forEach((btn) => {
            btn.addEventListener('click', () => this.selectScene(btn.dataset.sceneId));
        });

        this._updateActionBar();
    }

    selectScene(sceneId) {
        const selected = this._findSceneById(sceneId);
        if (!selected) return;

        this.activeCategory = selected.category;
        this.selectedSceneId = selected.scene.sceneId;
        this.sceneStepIndexByScene[selected.scene.sceneId] = 0;
        this._saveLastScene(this.selectedSceneId);
        this._renderCategoryTabs();
        this.renderSceneList();

        if (selected.scene.isWorkbench) {
            this._renderWorkbench();
            this._writeConsole([
                '> Workshop ready',
                '> Step 1: write a simple script',
                '> Step 2: prepare study room vocabulary',
                '> Step 3: pass the exam to unlock your scene',
            ]);
            return;
        }

        this._openPlayableScene(selected.scene);
    }

    _getSceneStoryboard(scene) {
        if (!scene) return [];

        const source = Array.isArray(scene.storyboard) && scene.storyboard.length
            ? scene.storyboard
            : [];

        return source.map((frame, index) => {
            const node = (scene.nodes || []).find((item) => item.id === frame.nodeId) || (scene.nodes || [])[index] || null;
            return {
                ...frame,
                node,
                fallback: frame.fallback || scene.roomBackgroundUrl || ROOM_BACKGROUND_URL,
            };
        });
    }

    _getSceneStepIndex(scene) {
        const storyboard = this._getSceneStoryboard(scene);
        if (!storyboard.length) return 0;

        const current = this.sceneStepIndexByScene[scene.sceneId];
        if (Number.isInteger(current)) {
            return Math.max(0, Math.min(current, storyboard.length - 1));
        }

        this.sceneStepIndexByScene[scene.sceneId] = 0;
        return 0;
    }

    _setSceneStep(scene, nextIndex) {
        const storyboard = this._getSceneStoryboard(scene);
        if (!storyboard.length) return;

        const clamped = Math.max(0, Math.min(nextIndex, storyboard.length - 1));
        this.sceneStepIndexByScene[scene.sceneId] = clamped;
        this._renderScenePreview(scene);
    }

    _getPlayState(scene) {
        const firstNode = (scene?.nodes || [])[0] || null;
        if (!scene || !firstNode) {
            return { currentNodeId: null, history: [] };
        }

        if (!this.scenePlayStateByScene[scene.sceneId]) {
            this.scenePlayStateByScene[scene.sceneId] = {
                currentNodeId: firstNode.id,
                history: []
            };
        }

        return this.scenePlayStateByScene[scene.sceneId];
    }

    _findNodeById(scene, nodeId) {
        return (scene?.nodes || []).find((node) => node.id === nodeId) || null;
    }

    _getNextNode(scene, node) {
        const nodes = scene?.nodes || [];
        const index = nodes.findIndex((item) => item.id === node?.id);
        if (index < 0 || index >= nodes.length - 1) return null;
        return nodes[index + 1];
    }

    _resolveFrameForNode(scene, node) {
        const storyboard = this._getSceneStoryboard(scene);
        const exact = storyboard.find((frame) => frame.nodeId === node?.id);
        if (exact) return exact;
        return storyboard[this._getSceneStepIndex(scene)] || {
            image: scene?.roomBackgroundUrl || ROOM_BACKGROUND_URL,
            fallback: ROOM_BACKGROUND_URL,
            title: scene?.title || 'Escena',
            caption: scene?.description || ''
        };
    }

    _openPlayableScene(scene, { restart = true } = {}) {
        if (!scene || !Array.isArray(scene.nodes) || !scene.nodes.length) return;

        const firstNode = scene.nodes[0];
        if (restart || !this.scenePlayStateByScene[scene.sceneId]) {
            this.scenePlayStateByScene[scene.sceneId] = {
                currentNodeId: firstNode.id,
                history: []
            };
        }

        this.activeCategory = scene.type === 'custom' ? 'custom' : 'recommended';
        this.selectedSceneId = scene.sceneId;
        this._saveLastScene(scene.sceneId);
        this._renderCategoryTabs();
        this.renderSceneList();
        this._renderPlayableScene(scene);
        this._writeConsole([
            `> Playing scene: ${scene.title}`,
            `> Node count: ${(scene.nodes || []).length}`,
            '> Learning mode: German dialogue + Spanish support',
        ]);
    }

    _goBackPlayableScene(scene) {
        const state = this._getPlayState(scene);
        if (!state.history.length) return;
        const previousNodeId = state.history.pop();
        state.currentNodeId = previousNodeId;
        this.scenePlayStateByScene[scene.sceneId] = state;
        this._renderPlayableScene(scene);
    }

    _advancePlayableScene(scene) {
        const state = this._getPlayState(scene);
        const currentNode = this._findNodeById(scene, state.currentNodeId);
        const nextNode = this._getNextNode(scene, currentNode);
        if (!currentNode || !nextNode) return;
        state.history.push(currentNode.id);
        state.currentNodeId = nextNode.id;
        this.scenePlayStateByScene[scene.sceneId] = state;
        this._renderPlayableScene(scene);
    }

    _choosePlayableBranch(scene, nextNodeId) {
        const state = this._getPlayState(scene);
        const currentNode = this._findNodeById(scene, state.currentNodeId);
        if (!currentNode || !nextNodeId) return;
        state.history.push(currentNode.id);
        state.currentNodeId = nextNodeId;
        this.scenePlayStateByScene[scene.sceneId] = state;
        this._renderPlayableScene(scene);
    }

    _openExampleTutorial() {
        this.selectScene(EXAMPLE_SCENE.sceneId);
        this._writeConsole([
            '> Opening startup tutorial',
            '> Roger gets the old PC inside the Burgeramt confusion scene',
            '> Read, listen and learn German through the playable dialogue flow',
        ]);
    }

    _openWorkbenchGuide() {
        this.activeCategory = 'custom';
        this.selectedSceneId = BUILDER_WORKBENCH_ID;
        this._saveLastScene(BUILDER_WORKBENCH_ID);
        this._renderCategoryTabs();
        this.renderSceneList();
        this._renderWorkbench();
        this._updateActionBar();
        this._writeConsole([
            '> Taller de creacion abierto',
            '> Escribe un guion simple y carga fotos reales',
            '> Despues estudia el vocabulario y elige examen o salto directo',
        ]);
    }

    _launchRogerExampleScene() {
        // Obtener la escena actual y el nodo actual
        const selectedScene = this._getSelectedScene();
        if (!selectedScene) return;

        const state = this._getPlayState(selectedScene);
        const currentNode = this._findNodeById(selectedScene, state.currentNodeId);
        if (!currentNode) return;

        // Obtener el texto en alemán
        const germanText = currentNode.deLine || currentNode.learningGerman || currentNode.text;
        
        // Reproducir la narración sobre la imagen actual (sin cerrar SceneBuilder)
        narratorService.narrateInGerman(germanText, (subtitleText, languageCode) => {
            // Callback: actualizar subtítulos si es necesario
            console.log('[SceneBuilder] Narración reproduciendo:', subtitleText, languageCode);
        });

        this._writeConsole([
            '> Reproduciendo narración de la escena actual',
            `> Texto: ${germanText.substring(0, 50)}...`,
            '> Audio en alemán con subtítulos',
        ]);
    }

    _renderStartupGuide(selectedScene) {
        const previewEl = document.getElementById('sb-scene-preview');
        if (!previewEl) return;
        this._setLayoutMode('startup');

        const highlightedTitle = selectedScene?.title || EXAMPLE_SCENE.title;
        const highlightedLabel = selectedScene?.menuLabel || EXAMPLE_SCENE.menuLabel;

        previewEl.innerHTML = `
            <div class="sb-preview-hero sb-startup-hero" style="background-image: linear-gradient(135deg, rgba(0, 0, 0, 0.82), rgba(0, 32, 0, 0.88)), url('${this._escapeAttr(ROOM_BACKGROUND_URL)}');">
                <div class="sb-preview-kicker">BIENVENIDA / SCENEBUILDER.EXE</div>
                <div class="sb-preview-title">Tutorial de inicio para crear escenas modernas desde la PC retro</div>
                <div class="sb-preview-description">Roger consiguio esta maquina por la confusion del Burgeramt. El programa verde que vive dentro sirve para construir escenas con fotos reales, dialogos y una sala de estudio de vocabulario antes de revisar la historia.</div>
                <div class="sb-preview-tags">
                    <span class="sb-chip">tutorial inicial</span>
                    <span class="sb-chip">pc-origen</span>
                    <span class="sb-chip">fotos reales</span>
                    <span class="sb-chip">aprendizaje de aleman</span>
                </div>
            </div>
            <div class="sb-preview-meta">
                <div><span>PRIMER PASO</span><strong>Ver el ejemplo de Roger</strong></div>
                <div><span>SEGUNDO PASO</span><strong>Escribir un guion simple</strong></div>
                <div><span>TERCER PASO</span><strong>Aprender vocabulario</strong></div>
                <div><span>ESTADO</span><strong>Listo para empezar</strong></div>
            </div>
            <div class="sb-info-block">
                <div class="sb-info-title">Que vas a entender aqui</div>
                <div class="sb-info-line">1. Como Roger sale del Burgeramt con este ordenador viejo.</div>
                <div class="sb-info-line">2. Como una escena se construye a partir de fotos reales y dialogos cortos.</div>
                <div class="sb-info-line">3. Por que el sistema te obliga a estudiar palabras y frases antes de abrir la historia.</div>
            </div>
            <div class="sb-info-block">
                <div class="sb-info-title">Ruta recomendada de uso</div>
                <div class="sb-info-line">1. Pulsa "Abrir ejemplo de Roger" para ver la historia tutorial completa.</div>
                <div class="sb-info-line">2. Despues entra en PERSONALIZADAS para escribir tu propio guion.</div>
                <div class="sb-info-line">3. Carga fotos reales y deja que el sistema prepare el vocabulario.</div>
                <div class="sb-info-line">4. Pasa el examen o usa "Saltar examen" si ahora quieres abrir la escena directamente.</div>
            </div>
            <div class="sb-startup-actions">
                <button id="sb-startup-example-btn" class="sb-load-btn">Abrir ejemplo de Roger</button>
                <button id="sb-startup-workbench-btn" class="sb-load-btn">Abrir creador de escenas</button>
            </div>
            <div class="sb-info-block">
                <div class="sb-info-title">Escena destacada en este arranque</div>
                <div class="sb-info-line"><strong>${this._escape(highlightedLabel)}</strong></div>
                <div class="sb-info-line">${this._escape(highlightedTitle)}</div>
            </div>
        `;

        document.getElementById('sb-startup-example-btn')?.addEventListener('click', () => this._openExampleTutorial());
        document.getElementById('sb-startup-workbench-btn')?.addEventListener('click', () => this._openWorkbenchGuide());
        previewEl.scrollTop = 0;
    }

    _updateActionBar() {
        const loadBtn = document.getElementById('sb-load-btn');
        const noteEl = document.getElementById('sb-actions-note');
        const selectedScene = this._getSelectedScene();
        if (!loadBtn || !noteEl) return;

        if (!selectedScene) {
            loadBtn.disabled = true;
            loadBtn.textContent = 'Sin opcion';
            noteEl.textContent = 'Elige una opcion del menu para continuar.';
            return;
        }

        if (this.activeCategory === 'recommended') {
            loadBtn.disabled = false;
            loadBtn.textContent = 'Ver historia ejemplo';
            noteEl.textContent = 'Ya estas viendo el ejemplo de Roger. Usa esta historia para entender como conseguir la PC vieja y como construir tus escenas.';
            return;
        }

        if (selectedScene.isWorkbench) {
            loadBtn.disabled = false;
            loadBtn.textContent = 'Ir al creador';
            noteEl.textContent = 'Aqui escribes el guion, anades fotos reales y preparas el examen de vocabulario.';
            return;
        }

        if (this.activeCategory === 'custom') {
            loadBtn.disabled = false;
            loadBtn.textContent = 'Abrir escena creada';
            noteEl.textContent = 'Esta escena ya fue desbloqueada. Puedes revisarla y seguir estudiando su vocabulario.';
            return;
        }

        loadBtn.disabled = true;
        loadBtn.textContent = 'Proximamente';
        noteEl.textContent = 'El generador IA todavia no esta conectado.';
    }

    _setLayoutMode(mode = 'scene') {
        const desktopEl = document.getElementById('sb-desktop');
        const gridEl = document.getElementById('sb-main-grid');
        const titleEl = document.getElementById('sb-preview-panel-title');
        if (!desktopEl || !gridEl || !titleEl) return;

        desktopEl.classList.toggle('sb-desktop-workbench', mode === 'workbench');
        gridEl.classList.toggle('sb-layout-workbench', mode === 'workbench');

        if (mode === 'workbench') {
            titleEl.textContent = 'Creador de escenas';
            return;
        }

        if (mode === 'startup') {
            titleEl.textContent = 'Guia de inicio';
            return;
        }

        if (mode === 'play') {
            titleEl.textContent = 'Juego de escena';
            return;
        }

        titleEl.textContent = 'Historia ejemplo';
    }

    _writeStatus(lines) {
        const logEl = document.getElementById('sb-console-log');
        if (!logEl) return;
        logEl.textContent = `${lines.join('\n')}\n`;
        logEl.scrollTop = 0;
    }

    _bindEvents() {
        this.overlay.querySelector('.sb-backdrop')?.addEventListener('click', () => this.close());
        this.overlay.querySelector('#sb-close-btn')?.addEventListener('click', () => this.close());

        this.escHandler = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.close();
            }
        };
        document.addEventListener('keydown', this.escHandler);
    }

    _runBootSequence() {
        const log = document.getElementById('sb-boot-log');
        if (!log) return;

        const lines = [
            'BOOTING ROGER RETRO TERMINAL...',
            'Mounting room background endpoint...',
            `ROOM_BACKGROUND_URL = ${ROOM_BACKGROUND_URL}`,
            'Loading SceneBuilder.exe...',
            'Loading tutorial blueprint: La Confusion en el Burgeramt...',
            'Checking study-room workflow and vocabulary gates...',
            'PC handshake established.',
        ];

        lines.forEach((line, index) => {
            const timer = window.setTimeout(() => {
                log.textContent += `${line}\n`;
                log.scrollTop = log.scrollHeight;
            }, 220 * index);
            this.bootTimers.push(timer);
        });

        const finalizeTimer = window.setTimeout(() => {
            this._finishBootSequence();
        }, 220 * lines.length + 180);
        this.bootTimers.push(finalizeTimer);

        const backupTimer = window.setTimeout(() => {
            const desktop = document.getElementById('sb-desktop');
            if (desktop?.hidden || desktop?.style?.display === 'none') {
                this._finishBootSequence();
            }
        }, 3200);
        this.bootTimers.push(backupTimer);
    }

    _finishBootSequence() {
        const bootScreen = document.getElementById('sb-boot-screen');
        const desktop = document.getElementById('sb-desktop');

        if (bootScreen) {
            bootScreen.hidden = true;
            bootScreen.style.display = 'none';
        }
        if (desktop) {
            desktop.hidden = false;
            desktop.style.display = 'grid';
        }

        try {
            this.activeCategory = 'recommended';
            this.selectedSceneId = EXAMPLE_SCENE.sceneId;

            this._renderCategoryTabs();
            this.renderSceneList();
            this._openPlayableScene(EXAMPLE_SCENE, { restart: true });
            this._updateActionBar();

            this._writeConsole([
                '> SceneBuilder online',
                '> Example loaded automatically: Roger and the Burgeramt confusion',
                '> Use the dialogue buttons to advance and learn German in context',
                '> CREAR ESCENA keeps the exam, but now it also allows skipping it',
            ]);
        } catch (error) {
            console.error('[SceneBuilder] Error finishing boot sequence:', error);
            this.activeCategory = 'custom';
            this.selectedSceneId = BUILDER_WORKBENCH_ID;
            this._renderCategoryTabs();
            this.renderSceneList();
            this._renderWorkbench();
            this._writeConsole([
                '> Recovery mode enabled',
                '> Boot sequence encountered an error and opened the workbench directly',
                `> ${error?.message || 'Unknown boot error'}`,
            ]);
        }
    }

    _renderCategoryTabs() {
        const nav = document.getElementById('sb-category-nav');
        if (!nav) return;

        nav.innerHTML = SCENE_CATEGORIES.map((category) => `
            <button class="sb-nav-btn ${category.id === this.activeCategory ? 'active' : ''}" data-category="${category.id}">
                <span class="sb-nav-label">${this._escape(category.label)}</span>
                <span class="sb-nav-subtitle">${this._escape(category.subtitle)}</span>
            </button>
        `).join('');

        nav.querySelectorAll('[data-category]').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.activeCategory = btn.dataset.category;
                const nextScene = this._getScenesForCategory(this.activeCategory)[0] || null;
                this.selectedSceneId = nextScene?.sceneId || null;
                this._renderCategoryTabs();
                this.renderSceneList();

                if (!nextScene) {
                    this._renderPlaceholderPreview({
                        title: 'Canal vacio',
                        subtitle: 'Todavia no hay escenas en esta categoria.',
                        status: 'standby'
                    });
                    return;
                }

                if (this.activeCategory === 'recommended') {
                    this._openExampleTutorial();
                    return;
                }
                if (nextScene.isWorkbench) {
                    this._openWorkbenchGuide();
                    return;
                }
                this._openPlayableScene(nextScene, { restart: false });

                this._writeConsole([
                    `> Category switch: ${this.activeCategory.toUpperCase()}`,
                    `> ${SCENE_CATEGORIES.find((item) => item.id === this.activeCategory)?.subtitle || 'Canal narrativo'}`,
                ]);
            });
        });
    }

    _renderPlayableScene(scene) {
        const previewEl = document.getElementById('sb-scene-preview');
        if (!previewEl || !scene) return;

        this._setLayoutMode('play');

        const state = this._getPlayState(scene);
        const currentNode = this._findNodeById(scene, state.currentNodeId) || (scene.nodes || [])[0] || null;
        if (!currentNode) {
            this._renderScenePreview(scene);
            return;
        }

        const frame = this._resolveFrameForNode(scene, currentNode);
        const allNodes = scene.nodes || [];
        const currentIndex = Math.max(0, allNodes.findIndex((node) => node.id === currentNode.id));
        const storyboard = this._getSceneStoryboard(scene);
        const frameIndex = storyboard.findIndex((item) => item.nodeId === currentNode.id);
        if (frameIndex >= 0) {
            this.sceneStepIndexByScene[scene.sceneId] = frameIndex;
        }
        const hasPrevious = state.history.length > 0;
        const nextNode = this._getNextNode(scene, currentNode);
        const hasNext = Boolean(nextNode);
        const germanLine = currentNode.deLine || currentNode.learningGerman || currentNode.text;
        const spanishHint = currentNode.esHint || currentNode.text || '';
        const focusWords = Array.isArray(currentNode.focusWords) && currentNode.focusWords.length
            ? currentNode.focusWords
            : (scene.preferredVocabulary || []).slice(0, 4);
        const choiceButtons = currentNode.type === 'branching' && Array.isArray(currentNode.choices)
            ? currentNode.choices.map((choice) => `
                <button class="sb-play-choice" data-play-choice="${this._escapeAttr(String(choice.nextNode))}">
                    <span class="sb-play-choice-de">${this._escape(choice.deText || choice.text)}</span>
                    <span class="sb-play-choice-es">${this._escape(choice.text)}</span>
                </button>
            `).join('')
            : '';

        previewEl.innerHTML = `
            <div class="sb-play-wrap">
                <div class="sb-play-stage">
                    <img
                        class="sb-play-image"
                        src="${this._escapeAttr(frame.image || scene.roomBackgroundUrl || ROOM_BACKGROUND_URL)}"
                        alt="${this._escapeAttr(frame.title || scene.title)}"
                        onerror="this.onerror=null;this.src='${this._escapeAttr(frame.fallback || scene.roomBackgroundUrl || ROOM_BACKGROUND_URL)}';"
                    />
                    <div class="sb-play-stage-meta">
                        <div class="sb-play-kicker">JUEGO / APRENDER ALEMAN EN CONTEXTO</div>
                        <div class="sb-play-progress">Escena ${currentIndex + 1} de ${allNodes.length}</div>
                    </div>
                    ${this.activeCategory === 'recommended' ? `
                        <div class="sb-retro-controls">
                            <button class="sb-retro-control-btn" id="sb-play-roger-scene" title="Reproducir/Pausar">▶</button>
                            <div class="sb-retro-timeline">
                                <div class="sb-retro-progress"></div>
                            </div>
                            <span class="sb-retro-time">0:00 / 5:30</span>
                            <button class="sb-retro-control-btn" title="Volumen">🔊</button>
                            <button class="sb-retro-control-btn" title="Configuración">⚙</button>
                            <button class="sb-retro-control-btn" title="Modo cine">▢</button>
                            <button class="sb-retro-control-btn" title="Pantalla completa">⛶</button>
                        </div>
                    ` : ''}
                </div>
                <div class="sb-play-dialog">
                    <div class="sb-play-head">
                        <div>
                            <div class="sb-info-title">${this._escape(currentNode.character || currentNode.type || 'escena')}</div>
                            <div class="sb-play-node-title">${this._escape(frame.title || scene.title)}</div>
                        </div>
                        <button id="sb-play-restart" class="sb-load-btn">Reiniciar</button>
                    </div>
                    <div class="sb-play-german">${this._escape(germanLine)}</div>
                    <div class="sb-play-hint">${this._escape(spanishHint)}</div>
                    <div class="sb-preview-tags">
                        ${focusWords.map((word) => `<span class="sb-chip">${this._escape(word)}</span>`).join('')}
                    </div>
                    <div class="sb-info-block">
                        <div class="sb-info-title">Aprendizaje</div>
                        <div class="sb-info-line">${this._escape(frame.caption || 'Lee la escena, escucha el contexto y usa las palabras clave para fijar el dialogo.')}</div>
                    </div>
                    ${choiceButtons
                        ? `<div class="sb-play-choice-list">${choiceButtons}</div>`
                        : `
                            <div class="sb-play-controls">
                                <button class="sb-load-btn" id="sb-play-prev" ${hasPrevious ? '' : 'disabled'}>Anterior</button>
                                <button class="sb-load-btn" id="sb-play-next" ${hasNext ? '' : 'disabled'}>${hasNext ? 'Siguiente' : 'Final de escena'}</button>
                            </div>
                        `
                    }
                    <div class="sb-play-footer">
                        <button id="sb-play-preview" class="sb-load-btn">Ver blueprint</button>
                        <button id="sb-play-create" class="sb-load-btn">Crear mi propia escena</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('sb-play-prev')?.addEventListener('click', () => this._goBackPlayableScene(scene));
        document.getElementById('sb-play-next')?.addEventListener('click', () => this._advancePlayableScene(scene));
        document.getElementById('sb-play-restart')?.addEventListener('click', () => this._openPlayableScene(scene, { restart: true }));
        document.getElementById('sb-play-preview')?.addEventListener('click', () => this._renderScenePreview(scene));
        document.getElementById('sb-play-create')?.addEventListener('click', () => this._openWorkbenchGuide());
        document.getElementById('sb-play-roger-scene')?.addEventListener('click', () => this._launchRogerExampleScene());
        previewEl.querySelectorAll('[data-play-choice]').forEach((btn) => {
            btn.addEventListener('click', () => this._choosePlayableBranch(scene, Number(btn.dataset.playChoice)));
        });
        previewEl.scrollTop = 0;
    }

    _renderScenePreview(scene) {
        const previewEl = document.getElementById('sb-scene-preview');
        if (!previewEl) return;
        this._setLayoutMode('scene');
        if (!scene) {
            previewEl.innerHTML = '<div class="sb-preview-empty">No hay escena seleccionada.</div>';
            return;
        }

        if (scene.isWorkbench) {
            this._renderWorkbench();
            return;
        }

        const loreBridge = Array.isArray(scene.loreBridge) && scene.loreBridge.length
            ? `
                <div class="sb-info-block">
                    <div class="sb-info-title">Por que esta escena es el blueprint</div>
                    ${scene.loreBridge.map((item) => `<div class="sb-info-line">${this._escape(item)}</div>`).join('')}
                </div>
            `
            : '';

        const checklist = Array.isArray(scene.creationChecklist) && scene.creationChecklist.length
            ? `
                <div class="sb-info-block">
                    <div class="sb-info-title">Checklist de creacion</div>
                    ${scene.creationChecklist.map((item) => `<div class="sb-info-line">- ${this._escape(item)}</div>`).join('')}
                </div>
            `
            : '';

        const originSteps = Array.isArray(scene.pcOriginSteps) && scene.pcOriginSteps.length
            ? `
                <div class="sb-info-block">
                    <div class="sb-info-title">Como Roger consigue esta PC vieja</div>
                    ${scene.pcOriginSteps.map((item, index) => `<div class="sb-info-line">${index + 1}. ${this._escape(item)}</div>`).join('')}
                </div>
            `
            : '';

        const creatorWalkthrough = Array.isArray(scene.creatorWalkthrough) && scene.creatorWalkthrough.length
            ? `
                <div class="sb-info-block">
                    <div class="sb-info-title">Como usar el creador con este ejemplo</div>
                    ${scene.creatorWalkthrough.map((item) => `<div class="sb-info-line">${this._escape(item)}</div>`).join('')}
                </div>
            `
            : '';

        const vocabBlueprint = Array.isArray(scene.preferredVocabulary) && scene.preferredVocabulary.length
            ? `
                <div class="sb-info-block">
                    <div class="sb-info-title">Palabras y frases que la escena enseña antes de jugarla</div>
                    <div class="sb-preview-tags">${scene.preferredVocabulary.map((item) => `<span class="sb-chip">${this._escape(item)}</span>`).join('')}</div>
                </div>
            `
            : '';

        const assetInstallNote = scene.assetInstallNote
            ? `
                <div class="sb-info-block sb-success-block">
                    <div class="sb-info-title">Fotos reales del usuario</div>
                    <div class="sb-info-line">${this._escape(scene.assetInstallNote)}</div>
                </div>
            `
            : '';

        const storyboard = this._getSceneStoryboard(scene);
        const currentStepIndex = this._getSceneStepIndex(scene);
        const currentFrame = storyboard[currentStepIndex] || null;
        const currentNode = currentFrame?.node || null;
        const storyPlayer = currentFrame
            ? `
                <div class="sb-story-player">
                    <div class="sb-story-stage">
                        <img
                            class="sb-story-image"
                            src="${this._escapeAttr(currentFrame.image)}"
                            alt="${this._escapeAttr(currentFrame.title || scene.title)}"
                            onerror="this.onerror=null;this.src='${this._escapeAttr(currentFrame.fallback || ROOM_BACKGROUND_URL)}';"
                        />
                    </div>
                    <div class="sb-story-panel">
                        <div class="sb-info-title">Paso visual ${currentFrame.step || currentStepIndex + 1} de ${storyboard.length}</div>
                        <div class="sb-story-title">${this._escape(currentFrame.title || currentNode?.character || scene.title)}</div>
                        <div class="sb-story-caption">${this._escape(currentFrame.caption || currentNode?.text || scene.description || '')}</div>
                        <div class="sb-preview-tags">
                            <span class="sb-chip">${this._escape(currentNode?.type || 'scene')}</span>
                            ${currentNode?.character ? `<span class="sb-chip">${this._escape(currentNode.character)}</span>` : ''}
                            ${currentFrame.image ? `<span class="sb-chip">${this._escape(currentFrame.image)}</span>` : ''}
                        </div>
                        <div class="sb-story-controls">
                            <button class="sb-load-btn" data-story-nav="-1" ${currentStepIndex === 0 ? 'disabled' : ''}>Anterior</button>
                            <button class="sb-load-btn" data-story-nav="1" ${currentStepIndex === storyboard.length - 1 ? 'disabled' : ''}>Siguiente</button>
                        </div>
                        <div class="sb-story-steps">
                            ${storyboard.map((frame, index) => `
                                <button class="sb-story-step ${index === currentStepIndex ? 'active' : ''}" data-story-step="${index}">
                                    ${frame.step || index + 1}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `
            : '';

        previewEl.innerHTML = `
            <div class="sb-preview-hero" style="background-image: linear-gradient(135deg, rgba(0, 0, 0, 0.78), rgba(0, 32, 0, 0.84)), url('${this._escapeAttr(scene.roomBackgroundUrl || ROOM_BACKGROUND_URL)}');">
                <div class="sb-preview-kicker">TUTORIAL / ORIGEN DEL PC</div>
                <div class="sb-preview-url">${this._escape(scene.backgroundPlaceholder || ROOM_BACKGROUND_URL)}</div>
                <div class="sb-preview-title">${this._escape(scene.title)}</div>
                <div class="sb-preview-description">${this._escape(scene.description)}</div>
                <div class="sb-preview-tags">${(scene.tags || []).map((tag) => `<span class="sb-chip">${this._escape(tag)}</span>`).join('')}</div>
            </div>
            <div class="sb-preview-meta">
                <div><span>SCENE ID</span><strong>${this._escape(scene.sceneId)}</strong></div>
                <div><span>CHANNEL</span><strong>${this._escape(scene.type)}</strong></div>
                <div><span>NODES</span><strong>${(scene.nodes || []).length}</strong></div>
                <div><span>ENTRY</span><strong>interactWithPC()</strong></div>
            </div>
            ${storyPlayer}
            ${loreBridge}
            ${originSteps}
            ${creatorWalkthrough}
            ${checklist}
            ${vocabBlueprint}
            ${assetInstallNote}
            ${this._renderReferenceImages(scene.referenceImages || [])}
            <div class="sb-nodes-title">Narrative nodes</div>
            <div class="sb-node-list">
                ${(scene.nodes || []).map((node) => this._renderNodeCard(node)).join('')}
            </div>
        `;
        previewEl.querySelectorAll('[data-story-nav]').forEach((btn) => {
            btn.addEventListener('click', () => {
                this._setSceneStep(scene, currentStepIndex + Number(btn.dataset.storyNav || 0));
            });
        });
        previewEl.querySelectorAll('[data-story-step]').forEach((btn) => {
            btn.addEventListener('click', () => {
                this._setSceneStep(scene, Number(btn.dataset.storyStep || 0));
            });
        });
        previewEl.scrollTop = 0;
    }

    _renderPlaceholderPreview(placeholder) {
        const previewEl = document.getElementById('sb-scene-preview');
        if (!previewEl) return;
        this._setLayoutMode('scene');

        previewEl.innerHTML = `
            <div class="sb-preview-empty">
                <div class="sb-preview-title">${this._escape(placeholder.title)}</div>
                <div class="sb-preview-description">${this._escape(placeholder.subtitle)}</div>
                <div class="sb-preview-url">ROOM_BACKGROUND_URL = ${this._escape(ROOM_BACKGROUND_URL)}</div>
                <div class="sb-chip">${this._escape(String(placeholder.status || 'standby').toUpperCase())}</div>
            </div>
        `;
        previewEl.scrollTop = 0;
    }

    _renderWorkbench() {
        const previewEl = document.getElementById('sb-scene-preview');
        if (!previewEl) return;
        this._setLayoutMode('workbench');

        const draft = this.studyDraft;
        const quiz = this.studyQuiz;
        const quizMarkup = draft ? this._renderStudyRoom(draft, quiz) : `
            <div class="sb-info-block">
                <div class="sb-info-title">Sala de estudio</div>
                <div class="sb-info-line">Aqui apareceran las palabras y frases necesarias para revisar tu historia antes de abrir la escena creada.</div>
            </div>
        `;

        previewEl.innerHTML = `
            <div class="sb-workbench-wrap">
                <div class="sb-preview-hero sb-workbench-hero" style="background-image: linear-gradient(135deg, rgba(0, 0, 0, 0.86), rgba(20, 20, 0, 0.82)), url('${this._escapeAttr(ROOM_BACKGROUND_URL)}');">
                    <div class="sb-preview-kicker">WORKBENCH / REAL IMAGES + DIALOGUES</div>
                    <div class="sb-preview-title">Taller de guiones y desbloqueo por vocabulario</div>
                    <div class="sb-preview-description">Primero escribes un guion simple. Luego el sistema prepara el vocabulario desde el diccionario actual siempre que puede, detecta palabras nuevas necesarias y te deja elegir entre aprobar el examen o saltarlo para abrir la escena directamente.</div>
                </div>

                <div class="sb-info-block">
                    <div class="sb-info-title">Flujo obligatorio</div>
                    <div class="sb-info-line">1. Escribe un guion simple con narracion y dialogos.</div>
                    <div class="sb-info-line">2. Pega rutas o URLs de fotos reales para cada escena.</div>
                    <div class="sb-info-line">3. Prepara la sala de estudio con palabras y frases necesarias.</div>
                    <div class="sb-info-line">4. Aprueba la prueba o usa "Saltar examen" para abrir la escena creada como juego real.</div>
                </div>

                <div class="sb-builder-grid">
                    <label class="sb-field">
                        <span>Titulo de la escena</span>
                        <input id="sb-draft-title" type="text" value="${this._escapeAttr(draft?.title || 'Escena personalizada: Mi historia')}" />
                    </label>

                    <label class="sb-field sb-field-full">
                        <span>Fotos reales (una ruta o URL por linea)</span>
                        <textarea id="sb-draft-images" rows="3" placeholder="assets/mi-foto-1.jpg&#10;assets/mi-foto-2.jpg">${this._escape((draft?.referenceImages || []).join('\n'))}</textarea>
                    </label>

                    <label class="sb-field sb-field-full">
                        <span>Guion simple</span>
                        <textarea id="sb-draft-script" rows="9" placeholder="Narrador: Llegas a la oficina con una carpeta.&#10;Recepcionista: Guten Morgen. Haben Sie einen Termin?&#10;Narrador: Buscas la ventanilla correcta y pides ayuda.">${this._escape(draft?.scriptRaw || 'Narrador: Llegas a la oficina con una carpeta y una foto impresa del edificio.\nRecepcionista: Guten Morgen. Haben Sie einen Termin?\nNarrador: Ensegnas tu Anmeldung y dices Bitte. Hilfe.\nTecnico: Ich bringe den alten Computer und erklaere den Fehler.\nNarrador: Antes de abrir la nueva escena, estudias el vocabulario necesario.')}</textarea>
                    </label>
                </div>

                <div class="sb-builder-actions">
                    <button id="sb-prepare-draft-btn" class="sb-load-btn">Preparar estudio y escena</button>
                    <div class="sb-builder-message">${this._escape(this.builderMessage)}</div>
                </div>

                ${quizMarkup}
            </div>
        `;

        this._bindWorkbenchEvents();
        previewEl.scrollTop = 0;
    }

    _bindWorkbenchEvents() {
        document.getElementById('sb-prepare-draft-btn')?.addEventListener('click', async () => {
            await this._prepareDraftFromInputs();
        });

        document.getElementById('sb-start-study-quiz')?.addEventListener('click', () => {
            this._startStudyQuiz();
        });

        document.getElementById('sb-retry-study-quiz')?.addEventListener('click', () => {
            this._startStudyQuiz();
        });

        document.getElementById('sb-skip-study-quiz')?.addEventListener('click', async () => {
            await this._skipStudyQuiz();
        });

        document.querySelectorAll('[data-study-answer]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                await this._answerStudyQuestion(Number(btn.dataset.studyAnswer));
            });
        });
    }

    async _prepareDraftFromInputs() {
        const title = document.getElementById('sb-draft-title')?.value?.trim() || 'Escena personalizada';
        const script = document.getElementById('sb-draft-script')?.value?.trim() || '';
        const imagesRaw = document.getElementById('sb-draft-images')?.value || '';
        const imageUrls = imagesRaw.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);

        if (!script) {
            this.builderMessage = 'Escribe primero un guion simple para poder preparar la escena.';
            this._renderWorkbench();
            return;
        }

        const dict = await this._getDictionaryManager();
        const draft = this._buildDraftScene({
            title,
            script,
            imageUrls,
            dictionaryWords: dict.getAll()
        });

        this.studyDraft = draft;
        this.studyQuiz = this._createStudyQuiz(draft.requiredVocabulary);
        this.builderMessage = `Se preparo la sala de estudio: ${draft.requiredVocabulary.length} palabras/frases y ${draft.nodes.length} nodos.`;
        this._renderWorkbench();
        this._writeConsole([
            `> Draft preparado: ${draft.sceneId}`,
            `> Coincidencias con diccionario: ${draft.vocabularyStats.existingCount}`,
            `> Vocabulario nuevo necesario: ${draft.vocabularyStats.newCount}`,
            `> Terminos pendientes: ${draft.unknownTokens.length}`,
            '> Puedes aprobar el examen o saltarlo para abrir la escena en modo juego',
        ]);
    }

    _buildDraftScene({ title, script, imageUrls, dictionaryWords }) {
        const rawNodes = this._scriptToNodes(script);
        const vocabulary = this._collectVocabulary(script, dictionaryWords);
        const sceneId = `scene_custom_${Date.now()}`;
        const backgroundUrl = imageUrls[0] || ROOM_BACKGROUND_URL;
        const safeImages = imageUrls.length ? imageUrls : [ROOM_BACKGROUND_URL];
        const nodes = this._enrichNodesForLearning(rawNodes, vocabulary.selected);
        const storyboard = this._buildStoryboardFromNodes(nodes, safeImages, title);

        return this._hydrateSceneForPlay({
            sceneId,
            type: 'custom',
            menuLabel: title,
            title,
            description: this._summarizeNodes(nodes),
            backgroundPlaceholder: backgroundUrl,
            roomBackgroundUrl: backgroundUrl,
            referenceImages: safeImages,
            storyboard,
            tags: ['custom', 'study-gated', 'real-images-ready'],
            nodes,
            preferredVocabulary: vocabulary.selected.map((item) => item.word),
            requiredVocabulary: vocabulary.selected,
            vocabularyStats: {
                existingCount: vocabulary.selected.filter((item) => item.inDictionary).length,
                newCount: vocabulary.selected.filter((item) => !item.inDictionary).length,
            },
            unknownTokens: vocabulary.unknownTokens,
            scriptRaw: script,
            loreBridge: [
                'La escena fue creada desde el ordenador antiguo del apartamento.',
                'Antes de revisarla, el jugador debe dominar el vocabulario y las frases esenciales.',
                'Las palabras nuevas aprendidas se agregan automaticamente al diccionario al aprobar la prueba.'
            ],
            creationChecklist: [
                'Guion simple detectado y dividido en nodos.',
                'Lista de fotos reales preparada para el fondo o las referencias visuales.',
                'Sala de estudio vinculada al vocabulario clave.',
                'Escena lista para abrirse tras aprobar o saltar el examen.'
            ]
        });
    }

    _scriptToNodes(script) {
        const lines = script
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        const nodes = [];
        let nodeId = 1;

        lines.forEach((line) => {
            const dialogueMatch = line.match(/^([A-Za-z0-9 ._\-]{2,30}):\s*(.+)$/);
            if (dialogueMatch) {
                nodes.push({
                    id: nodeId++,
                    type: 'dialogue',
                    character: dialogueMatch[1].trim(),
                    text: dialogueMatch[2].trim()
                });
                return;
            }

            nodes.push({
                id: nodeId++,
                type: 'narration',
                text: line
            });
        });

        if (!nodes.length) {
            nodes.push({
                id: 1,
                type: 'narration',
                text: 'Todavia no hay guion. Escribe una secuencia simple para crear tu escena.'
            });
        }

        return nodes;
    }

    _enrichNodesForLearning(nodes, vocabularyItems) {
        const vocabPool = Array.isArray(vocabularyItems) ? vocabularyItems : [];
        return (nodes || []).map((node, index) => {
            const focusWords = this._pickFocusWordsForText(node.text, vocabPool);
            return {
                ...node,
                deLine: node.deLine || this._buildGermanLearningLine(node, focusWords, index),
                esHint: node.esHint || node.text || '',
                focusWords: Array.isArray(node.focusWords) && node.focusWords.length
                    ? node.focusWords
                    : focusWords
            };
        });
    }

    _pickFocusWordsForText(text, vocabularyItems) {
        const normalizedText = this._normalizeText(text);
        const matches = (vocabularyItems || [])
            .filter((item) => normalizedText.includes(this._normalizeText(item.word)))
            .map((item) => item.word);

        if (matches.length) {
            return matches.slice(0, 4);
        }

        return (vocabularyItems || []).slice(0, 4).map((item) => item.word);
    }

    _looksGerman(text) {
        const source = String(text || '').trim();
        if (!source) return false;
        if (/[aeiou]ber|[A-Za-z]+sch|[A-Za-z]+ung|[A-Za-z]+keit|[A-Za-z]+lich/.test(source)) {
            return true;
        }

        const normalized = ` ${this._normalizeText(source)} `;
        const signals = [
            ' ich ', ' sie ', ' der ', ' die ', ' das ', ' und ', ' nicht ', ' bitte ', 'hilfe ',
            ' guten ', ' morgen ', ' termin ', ' anmeldung ', 'formular ', ' schalter ', ' gehen ',
            ' nehmen ', ' geschlossen ', ' computer ', ' lernen ', ' deutsch '
        ];

        let hits = 0;
        signals.forEach((item) => {
            if (normalized.includes(item)) hits += 1;
        });
        return hits >= 2;
    }

    _buildGermanLearningLine(node, focusWords, index) {
        if (this._looksGerman(node?.text)) {
            return node.text;
        }

        const normalizedText = this._normalizeText(node?.text);
        const speaker = this._normalizeText(node?.character);
        const firstWord = focusWords[0] || 'Hilfe';
        const secondWord = focusWords[1] || 'Formular';

        if (node?.type === 'system') {
            return 'Willkommen. Sie lernen jetzt Deutsch mit dieser Szene.';
        }

        if (node?.type === 'dialogue') {
            if (speaker.includes('recepcion')) return 'Guten Morgen. Haben Sie einen Termin?';
            if (speaker.includes('tecnico')) return 'Ich helfe Ihnen. Bitte geben Sie mir das Formular.';
            if (speaker.includes('funktion')) return 'Nehmen Sie den Computer und gehen Sie bitte weiter.';
            if (speaker.includes('telefon')) return 'Der Server hat ein Problem. Ich muss sofort gehen.';
            if (speaker.includes('guard') || speaker.includes('seguridad')) return 'Das Gebaeude ist geschlossen. Bitte gehen Sie jetzt.';
            return `Bitte, ich brauche ${firstWord} und ${secondWord}.`;
        }

        if (normalizedText.includes('ordenador') || normalizedText.includes('computadora') || normalizedText.includes('computer')) {
            return 'Roger traegt den alten Computer nach Hause.';
        }
        if (normalizedText.includes('formulario') || normalizedText.includes('anmeldung')) {
            return 'Roger sucht seine Anmeldung und braucht Hilfe.';
        }
        if (normalizedText.includes('taquilla') || normalizedText.includes('ventanilla') || normalizedText.includes('schalter')) {
            return 'Roger geht zu Schalter vier.';
        }
        if (normalizedText.includes('puerta') || normalizedText.includes('cristal')) {
            return 'Roger sieht das Formular hinter dem Glas.';
        }
        if (index === 0) {
            return 'Ich komme an und versuche, die Situation zu verstehen.';
        }
        return 'Ich lerne neue Woerter direkt in dieser Situation.';
    }

    _buildStoryboardFromNodes(nodes, images, title) {
        const safeImages = Array.isArray(images) && images.length ? images : [ROOM_BACKGROUND_URL];
        return (nodes || []).map((node, index) => ({
            step: index + 1,
            nodeId: node.id,
            title: node.character || `${title} - paso ${index + 1}`,
            caption: node.esHint || node.text || '',
            image: safeImages[Math.min(index, safeImages.length - 1)] || ROOM_BACKGROUND_URL,
            fallback: ROOM_BACKGROUND_URL
        }));
    }

    _collectVocabulary(script, dictionaryWords) {
        const normalizedScript = this._normalizeText(script);
        const dictionaryEntries = (dictionaryWords || []).map((item) => ({
            ...item,
            normalizedWord: this._normalizeText(item.word),
        }));

        const selected = [];
        const seen = new Set();
        const addVocabularyItem = (item, inDictionary) => {
            const key = this._normalizeText(item.word);
            if (!key || seen.has(key)) return;
            seen.add(key);
            selected.push({
                word: item.word,
                translation: item.translation,
                category: item.category || 'scene_builder',
                example: item.example || this._buildExampleSentence(item.word),
                translation1: item.translation1 || '',
                translation2: item.translation2 || '',
                inDictionary,
                source: inDictionary ? 'dictionary' : 'scene_builder'
            });
        };

        const prioritizedDictionary = dictionaryEntries
            .filter((item) => item.normalizedWord && normalizedScript.includes(item.normalizedWord))
            .sort((left, right) => {
                const lengthDiff = (right.word || '').length - (left.word || '').length;
                if (lengthDiff !== 0) return lengthDiff;
                return Number(Boolean(right.pinned)) - Number(Boolean(left.pinned));
            });

        prioritizedDictionary.slice(0, 8).forEach((item) => addVocabularyItem(item, true));

        SCENE_FALLBACK_VOCABULARY
            .filter((item) => normalizedScript.includes(this._normalizeText(item.word)))
            .forEach((item) => addVocabularyItem(item, false));

        EXAMPLE_SCENE.preferredVocabulary.forEach((term) => {
            const dictItem = dictionaryEntries.find((entry) => entry.normalizedWord === this._normalizeText(term));
            if (dictItem && selected.length < 10) {
                addVocabularyItem(dictItem, true);
                return;
            }

            const fallbackItem = SCENE_FALLBACK_VOCABULARY.find((entry) => this._normalizeText(entry.word) === this._normalizeText(term));
            if (fallbackItem && selected.length < 10) {
                addVocabularyItem(fallbackItem, false);
            }
        });

        const unknownTokens = this._extractUnknownTokens(script, dictionaryEntries, SCENE_FALLBACK_VOCABULARY);
        return { selected: selected.slice(0, 10), unknownTokens };
    }

    _extractUnknownTokens(script, dictionaryEntries, fallbackEntries) {
        const stopwords = new Set([
            'narrador', 'narradora', 'tecnico', 'recepcionista', 'sala', 'escena', 'historia', 'para', 'pero', 'porque', 'cuando',
            'esta', 'este', 'estas', 'estos', 'tener', 'luego', 'antes', 'despues', 'desde', 'sobre', 'entre', 'donde', 'como',
            'hacia', 'cada', 'real', 'reales', 'simple', 'guion', 'dialogo', 'dialogos', 'palabra', 'palabras', 'frases', 'examen'
        ]);

        const known = new Set();
        dictionaryEntries.forEach((item) => known.add(item.normalizedWord));
        fallbackEntries.forEach((item) => known.add(this._normalizeText(item.word)));

        const rawTokens = (script.match(/[A-Za-z0-9_\-]{4,}/g) || []).map((token) => token.trim());
        const unique = [];
        const seen = new Set();

        rawTokens.forEach((token) => {
            const normalized = this._normalizeText(token);
            if (!normalized || known.has(normalized) || stopwords.has(normalized) || seen.has(normalized)) return;
            if (/^scene|^node|^line|^foto/.test(normalized)) return;
            seen.add(normalized);
            unique.push(token);
        });

        return unique.slice(0, 8);
    }

    _createStudyQuiz(vocabularyItems) {
        const pool = [...(vocabularyItems || [])];
        if (!pool.length) {
            return {
                started: false,
                completed: false,
                passed: false,
                score: 0,
                questionIndex: 0,
                questions: [],
                lastFeedback: ''
            };
        }

        const questions = this._shuffle(pool)
            .slice(0, Math.min(5, pool.length))
            .map((item) => {
                const distractors = this._shuffle(pool.filter((candidate) => candidate.word !== item.word))
                    .slice(0, 3)
                    .map((candidate) => candidate.translation);

                const options = this._shuffle([item.translation, ...distractors]);
                return {
                    prompt: item.word,
                    correctAnswer: item.translation,
                    options
                };
            });

        return {
            started: false,
            completed: false,
            passed: false,
            score: 0,
            questionIndex: 0,
            questions,
            lastFeedback: ''
        };
    }

    _renderStudyRoom(draft, quiz) {
        const vocabRows = draft.requiredVocabulary.map((item) => `
            <div class="sb-vocab-row">
                <div>
                    <strong>${this._escape(item.word)}</strong>
                    <span>${this._escape(item.translation)}</span>
                </div>
                <div>
                    <span class="sb-chip ${item.inDictionary ? 'chip-dict' : 'chip-new'}">${item.inDictionary ? 'DICCIONARIO' : 'NUEVA'}</span>
                    <span class="sb-vocab-example">${this._escape(item.example)}</span>
                </div>
            </div>
        `).join('');

        const unresolved = draft.unknownTokens.length
            ? `
                <div class="sb-info-block sb-warning-block">
                    <div class="sb-info-title">Terminos pendientes</div>
                    <div class="sb-info-line">Estos terminos no se resolvieron automaticamente y no entran en el examen todavia:</div>
                    <div class="sb-preview-tags">${draft.unknownTokens.map((item) => `<span class="sb-chip">${this._escape(item)}</span>`).join('')}</div>
                </div>
            `
            : '';

        const quizMarkup = this._renderQuizMarkup(quiz);
        return `
            <div class="sb-info-block">
                <div class="sb-info-title">Resumen del draft</div>
                <div class="sb-info-line">Titulo: ${this._escape(draft.title)}</div>
                <div class="sb-info-line">Nodos generados: ${draft.nodes.length}</div>
                <div class="sb-info-line">Palabras del diccionario reutilizadas: ${draft.vocabularyStats.existingCount}</div>
                <div class="sb-info-line">Palabras nuevas para agregar al aprobar: ${draft.vocabularyStats.newCount}</div>
            </div>
            <div class="sb-info-block">
                <div class="sb-info-title">Sala de estudio</div>
                <div class="sb-vocab-list">${vocabRows}</div>
            </div>
            ${unresolved}
            ${quizMarkup}
        `;
    }

    _renderQuizMarkup(quiz) {
        if (!quiz || !quiz.questions.length) {
            return `
                <div class="sb-info-block sb-warning-block">
                    <div class="sb-info-title">Sin examen disponible</div>
                    <div class="sb-info-line">Necesitas al menos una palabra o frase para crear la prueba de acceso.</div>
                </div>
            `;
        }

        if (!quiz.started) {
            return `
                <div class="sb-info-block">
                    <div class="sb-info-title">Prueba de acceso</div>
                    <div class="sb-info-line">Debes aprobar con al menos ${PASS_THRESHOLD}% para desbloquear la escena y agregar automaticamente las palabras nuevas al diccionario.</div>
                    <div class="sb-info-line">Si ahora solo quieres revisar la historia como juego, puedes usar "Saltar examen".</div>
                    <div class="sb-builder-actions">
                        <button id="sb-start-study-quiz" class="sb-load-btn">Empezar examen</button>
                        <button id="sb-skip-study-quiz" class="sb-load-btn">Saltar examen y abrir</button>
                    </div>
                </div>
            `;
        }

        if (quiz.completed) {
            return `
                <div class="sb-info-block ${quiz.passed ? 'sb-success-block' : 'sb-warning-block'}">
                    <div class="sb-info-title">Resultado del examen</div>
                    <div class="sb-info-line">Puntuacion: ${quiz.score}/${quiz.questions.length} (${Math.round((quiz.score / quiz.questions.length) * 100)}%)</div>
                    <div class="sb-info-line">${this._escape(quiz.lastFeedback || '')}</div>
                    ${quiz.passed
                        ? '<div class="sb-info-line">La escena ya esta desbloqueada en PERSONALIZADAS y el diccionario ha sido actualizado.</div>'
                        : '<div class="sb-builder-actions"><button id="sb-retry-study-quiz" class="sb-load-btn">Reintentar examen</button><button id="sb-skip-study-quiz" class="sb-load-btn">Saltar examen y abrir</button></div>'}
                </div>
            `;
        }

        const current = quiz.questions[quiz.questionIndex];
        return `
            <div class="sb-info-block">
                <div class="sb-info-title">Prueba de acceso</div>
                <div class="sb-info-line">Pregunta ${quiz.questionIndex + 1} de ${quiz.questions.length}</div>
                <div class="sb-quiz-question">${this._escape(current.prompt)}</div>
                <div class="sb-quiz-subtitle">Selecciona la traduccion correcta antes de revisar la escena.</div>
                <div class="sb-quiz-options">
                    ${current.options.map((option, index) => `
                        <button class="sb-quiz-option" data-study-answer="${index}">${this._escape(option)}</button>
                    `).join('')}
                </div>
                <div class="sb-info-line">${this._escape(quiz.lastFeedback || 'Aun no has respondido esta pregunta.')}</div>
                <div class="sb-builder-actions">
                    <button id="sb-skip-study-quiz" class="sb-load-btn">Saltar examen y abrir</button>
                </div>
            </div>
        `;
    }

    _startStudyQuiz() {
        if (!this.studyQuiz) return;
        this.studyQuiz = {
            ...this.studyQuiz,
            started: true,
            completed: false,
            passed: false,
            score: 0,
            questionIndex: 0,
            lastFeedback: 'Examen iniciado. Concentrate en el vocabulario de la escena.'
        };
        this.builderMessage = 'El examen ya esta activo. Apruebalo para desbloquear la escena.';
        this._renderWorkbench();
    }

    async _skipStudyQuiz() {
        if (!this.studyDraft) return;

        if (!this.studyQuiz) {
            this.studyQuiz = this._createStudyQuiz(this.studyDraft.requiredVocabulary);
        }

        this.studyQuiz = {
            ...this.studyQuiz,
            started: true,
            completed: true,
            passed: true,
            skipped: true,
            score: this.studyQuiz.questions.length,
            questionIndex: Math.max(0, this.studyQuiz.questions.length - 1),
            lastFeedback: 'Examen saltado. La escena se desbloquea directamente para que puedas seguir con la experiencia narrativa.'
        };

        this.builderMessage = 'Examen saltado. La escena se desbloquea directamente.';
        await this._unlockDraftScene({ skippedExam: true });
    }

    async _answerStudyQuestion(answerIndex) {
        if (!this.studyQuiz || !this.studyQuiz.started || this.studyQuiz.completed) return;
        const current = this.studyQuiz.questions[this.studyQuiz.questionIndex];
        if (!current) return;

        const chosen = current.options[answerIndex];
        const isCorrect = chosen === current.correctAnswer;
        const nextScore = this.studyQuiz.score + (isCorrect ? 1 : 0);
        const nextIndex = this.studyQuiz.questionIndex + 1;
        const completed = nextIndex >= this.studyQuiz.questions.length;

        this.studyQuiz = {
            ...this.studyQuiz,
            score: nextScore,
            questionIndex: completed ? this.studyQuiz.questionIndex : nextIndex,
            completed,
            passed: completed ? Math.round((nextScore / this.studyQuiz.questions.length) * 100) >= PASS_THRESHOLD : false,
            lastFeedback: isCorrect ? 'Respuesta correcta.' : `Respuesta incorrecta. La correcta era: ${current.correctAnswer}`
        };

        playerProgressStore.recordResult(isCorrect ? 'correct' : 'incorrect');

        if (!completed) {
            this._renderWorkbench();
            return;
        }

        if (this.studyQuiz.passed) {
            await this._unlockDraftScene();
            return;
        }

        this.builderMessage = 'La escena sigue bloqueada. Repite el examen para afianzar el vocabulario.';
        this._renderWorkbench();
    }

    async _unlockDraftScene({ skippedExam = false } = {}) {
        if (!this.studyDraft || !this.studyQuiz?.passed) return;

        const dict = await this._getDictionaryManager();
        const newWords = this.studyDraft.requiredVocabulary
            .filter((item) => !item.inDictionary)
            .map((item) => ({
                word: item.word,
                translation: item.translation,
                translation1: item.translation1 || '',
                translation2: item.translation2 || '',
                category: item.category || 'scene_builder',
                example: item.example || this._buildExampleSentence(item.word)
            }));

        const importResult = newWords.length
            ? dict.importWords(newWords)
            : { added: 0, updated: 0, skipped: 0, errors: 0 };

        this.studyDraft.requiredVocabulary.forEach((item) => {
            playerProgressStore.learnWord(item.word, item.translation);
        });
        playerProgressStore.addXP(20 + (this.studyDraft.requiredVocabulary.length * 4));
        playerProgressStore.addJournal(
            `Aprendes el vocabulario de la escena "${this.studyDraft.title}" y desbloqueas su revision en el ordenador antiguo.`,
            `scene_builder:${this.studyDraft.sceneId}`
        );

        const unlockedScene = {
            ...this.studyDraft,
            unlockedAt: Date.now(),
            importedVocabulary: importResult
        };

        this._upsertCustomScene(unlockedScene);
        this.builderMessage = skippedExam
            ? `Escena desbloqueada sin examen. Palabras nuevas agregadas: ${importResult.added}.`
            : `Escena desbloqueada. Palabras nuevas agregadas: ${importResult.added}. Puedes revisarla ya en PERSONALIZADAS.`;
        this.studyQuiz = {
            ...this.studyQuiz,
            completed: true,
            passed: true,
            skipped: skippedExam,
            lastFeedback: skippedExam
                ? `Examen saltado. ${importResult.added} palabras nuevas fueron agregadas automaticamente al diccionario.`
                : `Examen superado. ${importResult.added} palabras nuevas fueron agregadas automaticamente al diccionario.`
        };

        this.activeCategory = 'custom';
        this.selectedSceneId = unlockedScene.sceneId;
        this._saveLastScene(unlockedScene.sceneId);
        this._renderCategoryTabs();
        this.renderSceneList();
        this._openPlayableScene(unlockedScene, { restart: true });
        this._writeConsole([
            `> Draft unlocked: ${unlockedScene.sceneId}`,
            `> Added to dictionary: ${importResult.added}`,
            `> Updated existing entries: ${importResult.updated}`,
            skippedExam ? '> Exam skipped by player' : '> Exam completed successfully',
            '> Scene moved to PERSONALIZADAS and opened in play mode',
        ]);
    }

    _getSelectedScene() {
        return this._findSceneById(this.selectedSceneId)?.scene || null;
    }

    _getWorkbenchCard() {
        return {
            sceneId: BUILDER_WORKBENCH_ID,
            type: 'custom',
            menuLabel: 'Nuevo guion',
            title: 'Taller de guiones',
            description: 'Escribe una historia simple, carga fotos reales y desbloquea tu escena despues del examen de vocabulario.',
            isWorkbench: true,
            tags: ['workbench', 'study-room']
        };
    }

    _getScenesForCategory(categoryId) {
        if (categoryId === 'recommended') return [EXAMPLE_SCENE];
        if (categoryId === 'custom') return [this._getWorkbenchCard(), ...this.customScenes];
        return [];
    }

    _findSceneById(sceneId) {
        if (!sceneId) return null;
        if (sceneId === BUILDER_WORKBENCH_ID) {
            return { category: 'custom', scene: this._getWorkbenchCard() };
        }
        if (sceneId === EXAMPLE_SCENE.sceneId) {
            return { category: 'recommended', scene: EXAMPLE_SCENE };
        }
        const customScene = this.customScenes.find((scene) => scene.sceneId === sceneId);
        if (customScene) {
            return { category: 'custom', scene: customScene };
        }
        return null;
    }

    _loadCustomScenes() {
        try {
            const raw = localStorage.getItem(CUSTOM_SCENES_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(parsed)) return [];
            return parsed
                .filter((item) => item && typeof item === 'object' && item.sceneId)
                .map((item) => this._hydrateSceneForPlay(item));
        } catch {
            return [];
        }
    }

    _saveCustomScenes() {
        try {
            localStorage.setItem(CUSTOM_SCENES_KEY, JSON.stringify(this.customScenes));
        } catch {
            // Ignore storage errors.
        }
    }

    _upsertCustomScene(scene) {
        const hydratedScene = this._hydrateSceneForPlay(scene);
        const existingIndex = this.customScenes.findIndex((item) => item.sceneId === scene.sceneId);
        if (existingIndex >= 0) {
            this.customScenes[existingIndex] = hydratedScene;
        } else {
            this.customScenes.unshift(hydratedScene);
        }
        this._saveCustomScenes();
    }

    _hydrateSceneForPlay(scene) {
        if (!scene || !Array.isArray(scene.nodes)) return scene;

        const referenceImages = Array.isArray(scene.referenceImages) && scene.referenceImages.length
            ? scene.referenceImages
            : [scene.roomBackgroundUrl || ROOM_BACKGROUND_URL];
        const imageSources = referenceImages
            .map((item) => (typeof item === 'string' ? item : item.image))
            .filter(Boolean);
        const vocabularyItems = Array.isArray(scene.requiredVocabulary) && scene.requiredVocabulary.length
            ? scene.requiredVocabulary
            : (scene.preferredVocabulary || []).map((word) => {
                const fallback = SCENE_FALLBACK_VOCABULARY.find((item) => this._normalizeText(item.word) === this._normalizeText(word));
                return fallback || {
                    word,
                    translation: '',
                    category: 'scene_builder',
                    example: this._buildExampleSentence(word)
                };
            });
        const nodes = this._enrichNodesForLearning(scene.nodes, vocabularyItems);

        return {
            ...scene,
            referenceImages,
            preferredVocabulary: Array.isArray(scene.preferredVocabulary) && scene.preferredVocabulary.length
                ? scene.preferredVocabulary
                : vocabularyItems.map((item) => item.word),
            nodes,
            storyboard: Array.isArray(scene.storyboard) && scene.storyboard.length
                ? scene.storyboard
                : this._buildStoryboardFromNodes(nodes, imageSources, scene.title || scene.menuLabel || 'Escena')
        };
    }

    _saveLastScene(sceneId) {
        try {
            localStorage.setItem(STORAGE_KEY, sceneId);
        } catch {
            // Ignore storage errors.
        }
    }

    _loadLastScene() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch {
            return null;
        }
    }

    _renderReferenceImages(images) {
        if (!Array.isArray(images) || !images.length) return '';
        return `
            <div class="sb-info-block">
                <div class="sb-info-title">Fotos reales / referencias visuales</div>
                <div class="sb-image-grid">
                    ${images.map((image, index) => {
                        const source = typeof image === 'string' ? image : image.image;
                        const fallback = typeof image === 'string' ? ROOM_BACKGROUND_URL : (image.fallback || ROOM_BACKGROUND_URL);
                        const caption = typeof image === 'string'
                            ? `Imagen ${index + 1}: ${image}`
                            : (image.title || `Imagen ${index + 1}`);
                        return `
                        <div class="sb-image-card">
                            <img
                                class="sb-image-thumb-img"
                                src="${this._escapeAttr(source)}"
                                alt="${this._escapeAttr(caption)}"
                                onerror="this.onerror=null;this.src='${this._escapeAttr(fallback)}';"
                            />
                            <div class="sb-image-caption">${this._escape(caption)}</div>
                        </div>
                    `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    _renderNodeCard(node) {
        const choices = Array.isArray(node.choices) && node.choices.length
            ? `<div class="sb-node-choices">${node.choices.map((choice) => `<div>-> ${this._escape(choice.text)} [${this._escape(String(choice.nextNode))}]</div>`).join('')}</div>`
            : '';

        return `
            <article class="sb-node-card sb-node-${this._escapeAttr(node.type)}">
                <div class="sb-node-head">
                    <span>#${this._escape(String(node.id))} ${this._escape(String(node.type || 'node').toUpperCase())}</span>
                    <span>${this._escape(node.character || node.action || 'flow')}</span>
                </div>
                <div class="sb-node-text">${this._escape(node.text || '')}</div>
                ${choices}
            </article>
        `;
    }

    _summarizeNodes(nodes) {
        const text = (nodes || []).slice(0, 2).map((node) => node.text).join(' ');
        return text.length > 180 ? `${text.slice(0, 177)}...` : text;
    }

    _buildExampleSentence(word) {
        return `In dieser Szene lerne ich: ${word}.`;
    }

    _normalizeText(value) {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    _shuffle(items) {
        const copy = [...items];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    _writeConsole(lines) {
        this._writeStatus(lines);
    }

    _clearBootTimers() {
        this.bootTimers.forEach((timer) => window.clearTimeout(timer));
        this.bootTimers = [];
    }

    _ensureStyles() {
        if (document.getElementById('scene-builder-styles')) return;

        const style = document.createElement('style');
        style.id = 'scene-builder-styles';
        style.textContent = `
            #scene-builder-overlay {
                position: fixed;
                inset: 0;
                z-index: 12000;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding: 6px;
                overflow: auto;
                font-family: 'VT323', 'Courier New', monospace;
                color: var(--sb-green);
                --sb-green: #00ff41;
                --sb-amber: #ffcc00;
                --sb-cyan: #00d7ff;
                --sb-border: #0f4f19;
                --sb-red: #ff7777;
            }
            #scene-builder-overlay * {
                box-sizing: border-box;
            }
            #scene-builder-overlay [hidden] {
                display: none !important;
            }
            .sb-backdrop {
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at top, rgba(0, 255, 65, 0.08), rgba(0, 0, 0, 0.94) 55%);
                backdrop-filter: blur(4px);
            }
            .sb-shell {
                position: relative;
                display: flex;
                flex-direction: column;
                width: min(1180px, calc(100vw - 12px));
                max-width: calc(100vw - 12px);
                height: min(760px, calc(100vh - 12px));
                height: min(760px, calc(100dvh - 12px));
                max-height: calc(100vh - 12px);
                max-height: calc(100dvh - 12px);
                background: linear-gradient(180deg, rgba(6, 18, 8, 0.96), rgba(0, 0, 0, 0.98));
                border: 2px solid var(--sb-border);
                box-shadow: 0 0 32px rgba(0, 255, 65, 0.18), inset 0 0 0 1px rgba(0, 255, 65, 0.12);
                overflow: hidden;
            }
            .sb-shell::before {
                content: '';
                position: absolute;
                inset: 0;
                background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                background-size: 100% 4px;
                pointer-events: none;
                opacity: 0.25;
            }
            .sb-header {
                position: relative;
                z-index: 2;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 10px 14px;
                border-bottom: 1px solid rgba(0, 255, 65, 0.18);
                background: rgba(0, 0, 0, 0.48);
                font-size: 17px;
                letter-spacing: 1px;
            }
            .sb-header-title {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .sb-header-title strong {
                font-size: 20px;
                color: var(--sb-green);
            }
            .sb-header-title span {
                color: #8bd89a;
                font-size: 15px;
            }
            .sb-close-btn,
            .sb-load-btn,
            .sb-nav-btn,
            .sb-scene-card,
            .sb-quiz-option,
            .sb-field input,
            .sb-field textarea {
                font: inherit;
            }
            .sb-close-btn,
            .sb-load-btn,
            .sb-quiz-option {
                border: 1px solid rgba(0, 255, 65, 0.3);
                background: rgba(0, 0, 0, 0.5);
                color: var(--sb-green);
                padding: 8px 12px;
                cursor: pointer;
                text-transform: uppercase;
            }
            .sb-close-btn:hover,
            .sb-load-btn:hover,
            .sb-quiz-option:hover {
                border-color: var(--sb-amber);
                color: var(--sb-amber);
            }
            .sb-load-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
                border-color: rgba(0, 255, 65, 0.18);
                color: #5c805f;
            }
            .sb-boot-screen {
                position: relative;
                z-index: 2;
                flex: 1 1 auto;
                min-height: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 18px;
                padding: 28px;
                overflow: auto;
            }
            .sb-boot-title {
                font-size: 28px;
                letter-spacing: 2px;
                text-align: center;
            }
            .sb-boot-subtitle {
                color: #8bd89a;
                font-size: 18px;
                text-align: center;
            }
            #sb-boot-log {
                width: min(100%, 760px);
                min-height: 160px;
                margin: 0;
                padding: 14px;
                border: 1px solid rgba(0, 255, 65, 0.22);
                background: rgba(0, 0, 0, 0.64);
                color: var(--sb-green);
                overflow: auto;
                white-space: pre-wrap;
                word-break: break-word;
                box-shadow: inset 0 0 0 1px rgba(0, 255, 65, 0.08);
            }
            #sb-console-log {
                width: 100%;
                min-height: 88px;
                max-height: 120px;
                margin: 0;
                padding: 12px;
                border: 1px solid rgba(0, 255, 65, 0.22);
                background: rgba(0, 0, 0, 0.64);
                color: var(--sb-green);
                overflow: auto;
                white-space: pre-wrap;
                word-break: break-word;
                box-shadow: inset 0 0 0 1px rgba(0, 255, 65, 0.08);
            }
            .sb-desktop {
                position: relative;
                z-index: 2;
                display: grid;
                grid-template-columns: 220px minmax(0, 1fr);
                gap: 12px;
                flex: 1 1 auto;
                min-height: 0;
                padding: 12px;
                overflow: hidden;
            }
            .sb-sidebar,
            .sb-main {
                display: flex;
                flex-direction: column;
                gap: 12px;
                min-height: 0;
                overflow: hidden;
            }
            .sb-panel {
                border: 1px solid rgba(0, 255, 65, 0.18);
                background: rgba(1, 7, 2, 0.88);
                box-shadow: inset 0 0 0 1px rgba(0, 255, 65, 0.04);
            }
            .sb-panel-title {
                padding: 10px 12px;
                border-bottom: 1px solid rgba(0, 255, 65, 0.14);
                color: #8bd89a;
                font-size: 17px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .sb-guide-panel {
                overflow: hidden;
            }
            .sb-guide-grid {
                display: grid;
                grid-template-columns: 1.2fr 1fr auto;
                gap: 12px;
                padding: 12px;
                align-items: stretch;
            }
            .sb-guide-copy,
            .sb-guide-steps {
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 12px;
                border: 1px solid rgba(0, 255, 65, 0.14);
                background: rgba(0, 0, 0, 0.42);
            }
            .sb-guide-actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
                min-width: 220px;
            }
            .sb-startup-hero {
                min-height: 240px;
            }
            .sb-startup-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 14px;
            }
            .sb-guide-line {
                font-size: 16px;
                line-height: 1.35;
                color: var(--sb-green);
            }
            .sb-guide-line strong {
                color: var(--sb-amber);
                font-weight: normal;
            }
            #sb-category-nav {
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 12px;
            }
            .sb-nav-btn {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 3px;
                width: 100%;
                padding: 10px 12px;
                border: 1px solid rgba(0, 255, 65, 0.16);
                background: rgba(0, 0, 0, 0.52);
                color: var(--sb-green);
                cursor: pointer;
                text-align: left;
            }
            .sb-nav-btn.active,
            .sb-nav-btn:hover {
                border-color: var(--sb-cyan);
                color: var(--sb-cyan);
                transform: translateX(2px);
            }
            .sb-nav-label {
                font-size: 18px;
            }
            .sb-nav-subtitle,
            .sb-room-caption,
            .sb-source-note,
            .sb-builder-message,
            .sb-vocab-example,
            .sb-quiz-subtitle {
                color: #7ea286;
                font-size: 14px;
            }
            .sb-room-preview {
                height: 170px;
                background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.78)), url('${ROOM_BACKGROUND_URL}');
                background-size: cover;
                background-position: center;
                display: flex;
                align-items: end;
                padding: 12px;
                border-top: 1px solid rgba(0, 255, 65, 0.14);
                border-bottom: 1px solid rgba(0, 255, 65, 0.14);
            }
            .sb-room-label {
                display: flex;
                flex-direction: column;
                gap: 2px;
                background: rgba(0, 0, 0, 0.6);
                padding: 8px 10px;
                border: 1px solid rgba(0, 255, 65, 0.16);
            }
            .sb-source-note {
                padding: 12px;
                line-height: 1.35;
            }
            .sb-main {
                min-width: 0;
                flex: 1 1 auto;
            }
            .sb-main-grid {
                display: flex;
                flex-direction: column;
                min-height: 0;
                flex: 1;
            }
            .sb-main-grid.sb-layout-workbench {
                display: flex;
            }
            .sb-main-grid.sb-layout-workbench .sb-scene-registry {
                display: none;
            }
            .sb-preview-panel {
                min-height: 0;
                display: flex;
                flex-direction: column;
                flex: 1 1 auto;
            }
            #sb-scene-preview {
                flex: 1 1 auto;
                min-height: 0;
                overflow: auto;
                padding: 12px;
            }
            .sb-scene-card {
                display: flex;
                flex-direction: column;
                gap: 8px;
                width: 100%;
                padding: 12px;
                border: 1px solid rgba(0, 255, 65, 0.16);
                background: rgba(0, 0, 0, 0.52);
                color: var(--sb-green);
                text-align: left;
                cursor: pointer;
            }
            .sb-scene-card:hover,
            .sb-scene-card.active {
                border-color: var(--sb-amber);
                color: var(--sb-amber);
                box-shadow: 0 0 14px rgba(255, 204, 0, 0.08);
            }
            .sb-scene-card-empty {
                cursor: default;
                color: #7ea286;
            }
            .sb-scene-card-title,
            .sb-preview-title,
            .sb-quiz-question {
                font-size: 20px;
                line-height: 1.1;
            }
            .sb-scene-card-subtitle,
            .sb-preview-kicker,
            .sb-preview-url,
            .sb-node-head,
            .sb-chip,
            .sb-preview-meta span,
            .sb-info-title,
            .sb-field span {
                font-size: 14px;
                color: #8bd89a;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }
            .sb-scene-card-summary,
            .sb-preview-description,
            .sb-node-text,
            .sb-node-choices,
            .sb-preview-meta strong,
            .sb-preview-empty,
            .sb-info-line,
            .sb-vocab-row strong,
            .sb-vocab-row span,
            .sb-builder-message {
                font-size: 16px;
                line-height: 1.35;
                color: var(--sb-green);
            }
            .sb-card-footer,
            .sb-preview-tags,
            .sb-builder-actions,
            .sb-quiz-options {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            .sb-chip {
                display: inline-flex;
                align-items: center;
                padding: 4px 8px;
                border: 1px solid rgba(0, 255, 65, 0.16);
                background: rgba(0, 0, 0, 0.45);
            }
            .chip-dict {
                border-color: rgba(0, 215, 255, 0.3);
                color: var(--sb-cyan);
            }
            .chip-new {
                border-color: rgba(255, 204, 0, 0.32);
                color: var(--sb-amber);
            }
            .sb-preview-hero {
                display: flex;
                flex-direction: column;
                gap: 10px;
                min-height: 220px;
                padding: 16px;
                border: 1px solid rgba(0, 255, 65, 0.16);
                background-size: cover;
                background-position: center;
            }
            .sb-preview-meta {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 10px;
                margin-top: 12px;
            }
            .sb-preview-meta div,
            .sb-info-block {
                padding: 10px 12px;
                border: 1px solid rgba(0, 255, 65, 0.14);
                background: rgba(0, 0, 0, 0.45);
                margin-top: 12px;
            }
            .sb-story-player {
                display: grid;
                grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
                gap: 12px;
                margin-top: 12px;
            }
            .sb-play-wrap {
                display: grid;
                grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
                gap: 12px;
                min-height: 100%;
            }
            .sb-play-stage,
            .sb-play-dialog {
                border: 1px solid rgba(0, 255, 65, 0.14);
                background: rgba(0, 0, 0, 0.42);
                min-width: 0;
            }
            .sb-play-stage {
                display: flex;
                flex-direction: column;
                min-height: 320px;
                overflow: hidden;
            }
            .sb-play-image {
                display: block;
                width: 100%;
                height: min(52vh, 460px);
                min-height: 260px;
                object-fit: cover;
                border-bottom: 1px solid rgba(0, 255, 65, 0.12);
            }
            .sb-play-stage-meta {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 12px;
            }
            .sb-play-kicker,
            .sb-play-progress {
                color: #8bd89a;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.6px;
            }
            .sb-play-dialog {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 14px;
            }
            .sb-play-head {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
            }
            .sb-play-node-title {
                margin-top: 6px;
                font-size: 24px;
                line-height: 1.1;
                color: var(--sb-amber);
            }
            .sb-play-stage {
                position: relative;
                overflow: hidden;
            }
            .sb-retro-controls {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 56px;
                background: linear-gradient(180deg, #1a1a1a, #0a0a0a);
                border-top: 2px solid #00ff00;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 0 12px;
                font-family: 'VT323', monospace;
                color: #00ff00;
            }
            .sb-retro-control-btn {
                background: linear-gradient(180deg, #1a1a1a, #000000);
                border: 2px solid #00ff00;
                border-right-color: #006600;
                border-bottom-color: #006600;
                color: #00ff00;
                font-family: 'VT323', monospace;
                font-size: 16px;
                width: 40px;
                height: 36px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: inset 1px 1px 0px rgba(0,255,0,0.3), inset -1px -1px 0px rgba(0,0,0,0.5);
                transition: all 0.05s;
                flex-shrink: 0;
            }
            .sb-retro-control-btn:hover {
                background: linear-gradient(180deg, #2a2a2a, #0a0a0a);
                box-shadow: inset 1px 1px 0px rgba(0,255,0,0.5), inset -1px -1px 0px rgba(0,0,0,0.3);
                text-shadow: 0 0 4px rgba(0,255,0,0.6);
            }
            .sb-retro-control-btn:active {
                box-shadow: inset 2px 2px 0px rgba(0,0,0,0.6), inset -1px -1px 0px rgba(0,255,0,0.2);
                background: linear-gradient(180deg, #000000, #1a1a1a);
            }
            .sb-retro-timeline {
                flex: 1;
                height: 8px;
                background: #000000;
                border: 1px solid #00ff00;
                border-right-color: #006600;
                border-bottom-color: #006600;
                position: relative;
                cursor: pointer;
                box-shadow: inset 1px 1px 0px rgba(0,255,0,0.2), inset -1px -1px 0px rgba(0,0,0,0.6);
            }
            .sb-retro-progress {
                height: 100%;
                background: linear-gradient(90deg, #00ff00, #00cc00);
                width: 25%;
                box-shadow: 0 0 4px rgba(0,255,0,0.4);
            }
            .sb-retro-time {
                font-family: 'VT323', monospace;
                font-size: 12px;
                color: #00ff00;
                min-width: 80px;
                text-align: right;
                flex-shrink: 0;
            }
            .sb-play-german {
                padding: 12px;
                border: 1px solid rgba(255, 204, 0, 0.22);
                background: rgba(28, 20, 0, 0.32);
                color: #ffe57a;
                font-size: 24px;
                line-height: 1.2;
            }
            .sb-play-hint {
                padding: 12px;
                border: 1px solid rgba(0, 255, 65, 0.12);
                background: rgba(0, 0, 0, 0.3);
                color: var(--sb-green);
                font-size: 17px;
                line-height: 1.45;
            }
            .sb-play-choice-list {
                display: grid;
                gap: 10px;
            }
            .sb-play-choice {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 6px;
                width: 100%;
                padding: 12px;
                border: 1px solid rgba(0, 255, 65, 0.18);
                background: rgba(0, 0, 0, 0.54);
                color: var(--sb-green);
                cursor: pointer;
                text-align: left;
                font: inherit;
            }
            .sb-play-choice:hover {
                border-color: var(--sb-cyan);
                color: var(--sb-cyan);
            }
            .sb-play-choice-de {
                font-size: 18px;
                color: var(--sb-amber);
            }
            .sb-play-choice-es {
                font-size: 15px;
                color: #8bd89a;
            }
            .sb-play-controls,
            .sb-play-footer {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            .sb-story-stage,
            .sb-story-panel {
                border: 1px solid rgba(0, 255, 65, 0.14);
                background: rgba(0, 0, 0, 0.42);
            }
            .sb-story-stage {
                min-height: 320px;
                overflow: hidden;
            }
            .sb-story-image {
                display: block;
                width: 100%;
                height: 100%;
                min-height: 320px;
                object-fit: cover;
            }
            .sb-story-panel {
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding: 14px;
            }
            .sb-story-title {
                font-size: 24px;
                line-height: 1.1;
                color: var(--sb-amber);
            }
            .sb-story-caption {
                font-size: 16px;
                line-height: 1.4;
                color: var(--sb-green);
            }
            .sb-story-controls,
            .sb-story-steps {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            .sb-story-step {
                min-width: 40px;
                border: 1px solid rgba(0, 255, 65, 0.18);
                background: rgba(0, 0, 0, 0.52);
                color: var(--sb-green);
                padding: 6px 10px;
                cursor: pointer;
                font: inherit;
            }
            .sb-story-step.active,
            .sb-story-step:hover {
                border-color: var(--sb-amber);
                color: var(--sb-amber);
            }
            .sb-info-block {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .sb-warning-block {
                border-color: rgba(255, 204, 0, 0.28);
            }
            .sb-success-block {
                border-color: rgba(0, 255, 65, 0.26);
            }
            .sb-preview-meta strong {
                display: block;
                margin-top: 6px;
            }
            .sb-image-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 10px;
            }
            .sb-image-card {
                border: 1px solid rgba(0, 255, 65, 0.14);
                background: rgba(0, 0, 0, 0.38);
            }
            .sb-image-thumb-img {
                display: block;
                width: 100%;
                height: 110px;
                object-fit: cover;
                border-bottom: 1px solid rgba(0, 255, 65, 0.12);
            }
            .sb-image-caption {
                padding: 8px;
                font-size: 14px;
                color: #8bd89a;
                word-break: break-word;
            }
            .sb-nodes-title {
                margin-top: 16px;
                margin-bottom: 10px;
                font-size: 18px;
                color: var(--sb-amber);
                text-transform: uppercase;
            }
            .sb-node-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .sb-node-card {
                border: 1px solid rgba(0, 255, 65, 0.14);
                background: rgba(0, 0, 0, 0.42);
                padding: 12px;
            }
            .sb-node-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 8px;
            }
            .sb-node-system {
                border-color: rgba(0, 215, 255, 0.22);
            }
            .sb-node-branching {
                border-color: rgba(255, 204, 0, 0.24);
            }
            .sb-node-choices {
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px dashed rgba(255, 204, 0, 0.3);
                color: var(--sb-amber);
            }
            .sb-actions {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 12px;
                border-top: 1px solid rgba(0, 255, 65, 0.14);
            }
            .sb-actions-note {
                color: #7ea286;
                font-size: 14px;
            }
            .sb-preview-empty {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 20px;
                border: 1px dashed rgba(0, 255, 65, 0.18);
                min-height: 320px;
                justify-content: center;
                background: rgba(0, 0, 0, 0.42);
            }
            .sb-workbench-wrap {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .sb-builder-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
            }
            .sb-field {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .sb-field-full {
                grid-column: 1 / -1;
            }
            .sb-field input,
            .sb-field textarea {
                width: 100%;
                padding: 10px;
                background: rgba(0, 0, 0, 0.65);
                border: 1px solid rgba(0, 255, 65, 0.16);
                color: var(--sb-green);
                resize: vertical;
            }
            .sb-field input:focus,
            .sb-field textarea:focus {
                outline: none;
                border-color: var(--sb-cyan);
                box-shadow: 0 0 0 1px rgba(0, 215, 255, 0.18);
            }
            .sb-vocab-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .sb-vocab-row {
                display: grid;
                grid-template-columns: 220px 1fr;
                gap: 12px;
                padding: 10px;
                border: 1px solid rgba(0, 255, 65, 0.1);
                background: rgba(0, 0, 0, 0.34);
            }
            .sb-vocab-row > div {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .sb-quiz-options {
                margin-top: 10px;
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .sb-quiz-option {
                text-transform: none;
                text-align: left;
                min-height: 54px;
            }
            @media (max-width: 1024px) {
                .sb-shell {
                    width: calc(100vw - 12px);
                    height: calc(100vh - 12px);
                    height: calc(100dvh - 12px);
                    max-height: calc(100vh - 12px);
                    max-height: calc(100dvh - 12px);
                }
                .sb-desktop {
                    grid-template-columns: 190px minmax(0, 1fr);
                }
                .sb-main-grid,
                .sb-guide-grid,
                .sb-play-wrap,
                .sb-story-player,
                .sb-builder-grid,
                .sb-vocab-row,
                .sb-preview-meta,
                .sb-quiz-options {
                    grid-template-columns: 1fr;
                }
                .sb-play-image {
                    height: 320px;
                }
            }
            @media (max-width: 720px) {
                .sb-desktop {
                    grid-template-columns: 1fr;
                }
                .sb-play-stage-meta,
                .sb-play-head {
                    flex-direction: column;
                    align-items: flex-start;
                }
                .sb-play-german {
                    font-size: 20px;
                }
                .sb-play-hint {
                    font-size: 16px;
                }
            }
            @media (max-height: 820px) {
                .sb-shell {
                    height: calc(100vh - 10px);
                    height: calc(100dvh - 10px);
                    max-height: calc(100vh - 10px);
                    max-height: calc(100dvh - 10px);
                }
                .sb-header {
                    padding: 8px 12px;
                }
                .sb-header-title strong {
                    font-size: 18px;
                }
                .sb-header-title span,
                .sb-close-btn {
                    font-size: 14px;
                }
                .sb-boot-screen {
                    justify-content: flex-start;
                    padding: 18px;
                }
                .sb-boot-title {
                    font-size: 22px;
                }
                .sb-boot-subtitle {
                    font-size: 16px;
                }
                .sb-preview-hero,
                .sb-startup-hero {
                    min-height: 180px;
                }
                .sb-play-image {
                    height: 240px;
                    min-height: 220px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    _getHTML() {
        return `
            <div class="sb-backdrop"></div>
            <section class="sb-shell" aria-label="Scene Builder overlay">
                <header class="sb-header">
                    <div class="sb-header-title">
                        <strong>SCENEBUILDER.EXE</strong>
                        <span>Retro narrative workstation for Roger Willkommen</span>
                    </div>
                    <button id="sb-close-btn" class="sb-close-btn">ESC | CERRAR</button>
                </header>

                <div id="sb-boot-screen" class="sb-boot-screen" style="display:flex;">
                    <div class="sb-boot-title">Booting... Loading SceneBuilder.exe...</div>
                    <div class="sb-boot-subtitle">Conectando la capa diegetica con la interfaz retro del PC.</div>
                    <pre id="sb-boot-log"></pre>
                </div>

                <div id="sb-desktop" class="sb-desktop" hidden style="display:none;">
                    <aside class="sb-sidebar">
                        <section class="sb-panel">
                            <div class="sb-panel-title">Canales narrativos</div>
                            <div id="sb-category-nav"></div>
                        </section>
                    </aside>

                    <main class="sb-main">
                        <div id="sb-main-grid" class="sb-main-grid">
                            <section class="sb-panel sb-preview-panel">
                                <div id="sb-preview-panel-title" class="sb-panel-title">Vista principal</div>
                                <div id="sb-scene-preview"></div>
                            </section>
                        </div>

                        <pre id="sb-console-log" hidden></pre>
                    </main>
                </div>
            </section>
        `;
    }

    _escape(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    _escapeAttr(value) {
        return this._escape(value).replace(/`/g, '&#96;');
    }
}
