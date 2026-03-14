/**
 * i18n — Multi-language support system
 * 
 * The game always shows text in German (the language being learned).
 * The user can configure up to 2 translation languages that appear
 * as smaller text beneath the German text:
 *   - Translation 1: small text (e.g. English)
 *   - Translation 2: even smaller text (e.g. Spanish / mother tongue)
 * 
 * Settings are persisted in localStorage.
 */

// Available languages and their labels
export const LANGUAGES = {
    de: { label: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
    en: { label: 'English', flag: '🇬🇧', nativeName: 'English' },
    es: { label: 'Español', flag: '🇪🇸', nativeName: 'Español' },
    fr: { label: 'Français', flag: '🇫🇷', nativeName: 'Français' },
    pt: { label: 'Português', flag: '🇧🇷', nativeName: 'Português' },
    it: { label: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
    cs: { label: 'Čeština', flag: '🇨🇿', nativeName: 'Čeština' },
    pl: { label: 'Polski', flag: '🇵🇱', nativeName: 'Polski' },
    tr: { label: 'Türkçe', flag: '🇹🇷', nativeName: 'Türkçe' },
    ar: { label: 'العربية', flag: '🇸🇦', nativeName: 'العربية' },
    uk: { label: 'Українська', flag: '🇺🇦', nativeName: 'Українська' },
    ru: { label: 'Русский', flag: '🇷🇺', nativeName: 'Русский' },
};

// All translatable strings — key: { de: ..., en: ..., es: ..., ... }
const STRINGS = {
    // ── Main Menu ────────────────────────
    menu_subtitle: {
        de: 'Lerne Deutsch – erlebe es!',
        en: 'Learn German by living it',
        es: 'Aprende alemán viviendo para contarlo',
        fr: 'Apprends l\'allemand en le vivant',
        pt: 'Aprenda alemão vivendo-o',
        it: 'Impara il tedesco vivendolo',
        cs: 'Nauč se německy – žij to!',
        pl: 'Ucz się niemieckiego – przeżyj to!',
        tr: 'Almancayı yaşayarak öğren',
        ar: 'تعلم الألمانية بعيشها',
        uk: 'Вивчай німецьку — переживи це!',
        ru: 'Учи немецкий — проживи это!',
    },
    menu_lore: {
        de: '30 Tage · echte Bürokratie · echte Nachbarn · ein menschliches Rätsel',
        en: '30 days · real paperwork · real neighbors · a human mystery',
        es: '30 días · trámites reales · vecinos reales · misterio humano',
        fr: '30 jours · vraie bureaucratie · vrais voisins · un mystère humain',
        pt: '30 dias · burocracia real · vizinhos reais · um mistério humano',
        it: '30 giorni · burocrazia vera · vicini veri · un mistero umano',
        cs: '30 dnů · skutečná byrokracie · skuteční sousedé · lidská záhada',
        pl: '30 dni · prawdziwa biurokracja · prawdziwi sąsiedzi · ludzka zagadka',
        tr: '30 gün · gerçek bürokrasi · gerçek komşular · insani bir gizem',
        ar: '30 يومًا · بيروقراطية حقيقية · جيران حقيقيون · لغز إنساني',
        uk: '30 днів · справжня бюрократія · справжні сусіди · людська таємниця',
        ru: '30 дней · реальная бюрократия · реальные соседи · человеческая загадка',
    },
    menu_start: {
        de: '[ SPACE / ENTER ] — STARTEN',
        en: '[ SPACE / ENTER ] — START',
        es: '[ SPACE / ENTER ] — EMPEZAR',
        fr: '[ SPACE / ENTER ] — COMMENCER',
        pt: '[ SPACE / ENTER ] — INICIAR',
        it: '[ SPACE / ENTER ] — INIZIA',
        cs: '[ SPACE / ENTER ] — ZAČÍT',
        pl: '[ SPACE / ENTER ] — ROZPOCZNIJ',
        tr: '[ SPACE / ENTER ] — BAŞLA',
        ar: '[ SPACE / ENTER ] — ابدأ',
        uk: '[ SPACE / ENTER ] — ПОЧАТИ',
        ru: '[ SPACE / ENTER ] — НАЧАТЬ',
    },
    menu_dictionary: {
        de: '📖 WÖRTERBUCH',
        en: '📖 DICTIONARY',
        es: '📖 DICCIONARIO',
        fr: '📖 DICTIONNAIRE',
        pt: '📖 DICIONÁRIO',
        it: '📖 DIZIONARIO',
        cs: '📖 SLOVNÍK',
        pl: '📖 SŁOWNIK',
        tr: '📖 SÖZLÜK',
        ar: '📖 القاموس',
        uk: '📖 СЛОВНИК',
        ru: '📖 СЛОВАРЬ',
    },
    menu_settings: {
        de: '⚙️ EINSTELLUNGEN',
        en: '⚙️ SETTINGS',
        es: '⚙️ CONFIGURACIÓN',
        fr: '⚙️ PARAMÈTRES',
        pt: '⚙️ CONFIGURAÇÕES',
        it: '⚙️ IMPOSTAZIONI',
        cs: '⚙️ NASTAVENÍ',
        pl: '⚙️ USTAWIENIA',
        tr: '⚙️ AYARLAR',
        ar: '⚙️ الإعدادات',
        uk: '⚙️ НАЛАШТУВАННЯ',
        ru: '⚙️ НАСТРОЙКИ',
    },
    menu_quote: {
        de: '"Du hast 30 Tage, eine leere Wohnung und null Deutsch. Viel Glück."',
        en: '"You have 30 days, an empty apartment and zero German. Good luck."',
        es: '"Tienes 30 días, un apartamento vacío y cero alemán. Viel Glück."',
        fr: '"Tu as 30 jours, un appart vide et zéro allemand. Bonne chance."',
        pt: '"Você tem 30 dias, um apartamento vazio e zero alemão. Boa sorte."',
        it: '"Hai 30 giorni, un appartamento vuoto e zero tedesco. Buona fortuna."',
        cs: '"Máš 30 dnů, prázdný byt a nula němčiny. Hodně štěstí."',
        pl: '"Masz 30 dni, puste mieszkanie i zero niemieckiego. Powodzenia."',
        tr: '"30 günün, boş bir dairen ve sıfır Almanca bilgin var. İyi şanslar."',
        ar: '"لديك 30 يومًا، شقة فارغة وصفر ألمانية. حظًا سعيدًا."',
        uk: '"У тебе 30 днів, порожня квартира і нуль німецької. Успіхів."',
        ru: '"У тебя 30 дней, пустая квартира и ноль немецкого. Удачи."',
    },
    words_learned: {
        de: 'Wörter gelernt',
        en: 'words learned',
        es: 'palabras aprendidas',
        fr: 'mots appris',
        pt: 'palavras aprendidas',
        it: 'parole imparate',
        cs: 'naučených slov',
        pl: 'nauczonych słów',
        tr: 'kelime öğrenildi',
        ar: 'كلمات تعلمتها',
        uk: 'вивчених слів',
        ru: 'выученных слов',
    },
    level: {
        de: 'Stufe',
        en: 'Level',
        es: 'Nivel',
        fr: 'Niveau',
        pt: 'Nível',
        it: 'Livello',
        cs: 'Úroveň',
        pl: 'Poziom',
        tr: 'Seviye',
        ar: 'المستوى',
        uk: 'Рівень',
        ru: 'Уровень',
    },
    settings_title: {
        de: 'SPRACH-EINSTELLUNGEN',
        en: 'LANGUAGE SETTINGS',
        es: 'CONFIGURACIÓN DE IDIOMAS',
        fr: 'PARAMÈTRES DE LANGUE',
        pt: 'CONFIGURAÇÕES DE IDIOMA',
        it: 'IMPOSTAZIONI LINGUA',
        cs: 'NASTAVENÍ JAZYKŮ',
        pl: 'USTAWIENIA JĘZYKÓW',
        tr: 'DİL AYARLARI',
        ar: 'إعدادات اللغة',
        uk: 'НАЛАШТУВАННЯ МОВ',
        ru: 'НАСТРОЙКИ ЯЗЫКОВ',
    },
    settings_game_lang: {
        de: 'Spielsprache (Menüs, Anweisungen)',
        en: 'Game language (menus, instructions)',
        es: 'Idioma del juego (menús, instrucciones)',
        fr: 'Langue du jeu (menus, instructions)',
        pt: 'Idioma do jogo (menus, instruções)',
        it: 'Lingua del gioco (menu, istruzioni)',
        cs: 'Jazyk hry (menu, pokyny)',
        pl: 'Język gry (menu, instrukcje)',
        tr: 'Oyun dili (menüler, talimatlar)',
        ar: 'لغة اللعبة (القوائم، التعليمات)',
        uk: 'Мова гри (меню, інструкції)',
        ru: 'Язык игры (меню, инструкции)',
    },
    settings_trans1: {
        de: 'Übersetzung 1 (klein)',
        en: 'Translation 1 (small)',
        es: 'Traducción 1 (pequeña)',
        fr: 'Traduction 1 (petite)',
        pt: 'Tradução 1 (pequena)',
        it: 'Traduzione 1 (piccola)',
        cs: 'Překlad 1 (malý)',
        pl: 'Tłumaczenie 1 (małe)',
        tr: 'Çeviri 1 (küçük)',
        ar: 'ترجمة 1 (صغيرة)',
        uk: 'Переклад 1 (малий)',
        ru: 'Перевод 1 (мелкий)',
    },
    settings_trans2: {
        de: 'Übersetzung 2 (kleiner)',
        en: 'Translation 2 (smaller)',
        es: 'Traducción 2 (más pequeña)',
        fr: 'Traduction 2 (plus petite)',
        pt: 'Tradução 2 (menor)',
        it: 'Traduzione 2 (più piccola)',
        cs: 'Překlad 2 (menší)',
        pl: 'Tłumaczenie 2 (mniejsze)',
        tr: 'Çeviri 2 (daha küçük)',
        ar: 'ترجمة 2 (أصغر)',
        uk: 'Переклад 2 (менший)',
        ru: 'Перевод 2 (мельче)',
    },
    settings_none: {
        de: '— Keine —',
        en: '— None —',
        es: '— Ninguno —',
        fr: '— Aucune —',
        pt: '— Nenhum —',
        it: '— Nessuna —',
        cs: '— Žádný —',
        pl: '— Brak —',
        tr: '— Yok —',
        ar: '— لا شيء —',
        uk: '— Жоден —',
        ru: '— Нет —',
    },
    settings_save: {
        de: '✔ SPEICHERN',
        en: '✔ SAVE',
        es: '✔ GUARDAR',
        fr: '✔ ENREGISTRER',
        pt: '✔ SALVAR',
        it: '✔ SALVA',
        cs: '✔ ULOŽIT',
        pl: '✔ ZAPISZ',
        tr: '✔ KAYDET',
        ar: '✔ حفظ',
        uk: '✔ ЗБЕРЕГТИ',
        ru: '✔ СОХРАНИТЬ',
    },
    dialog_connecting: {
        de: 'Verbindung wird hergestellt...',
        en: 'Establishing connection...',
        es: 'Estableciendo conexión...',
        fr: 'Établissement de la connexion...',
        pt: 'Estabelecendo conexão...',
        it: 'Stabilendo la connessione...',
        cs: 'Navazování spojení...',
        pl: 'Nawiązywanie połączenia...',
        tr: 'Bağlantı kuruluyor...',
        ar: 'جاري إنشاء الاتصال...',
        uk: 'Встановлення з’єднання...',
        ru: 'Установка соединения...',
    },
    dialog_input_hint: {
        de: 'Schreiben oder Mikrofon...',
        en: 'Type or use Microphone...',
        es: 'Escribe o usa el Micro...',
        fr: 'Écrivez ou utilisez le micro...',
        pt: 'Digite ou use o micro...',
        it: 'Scrivi o usa il micro...',
        cs: 'Pište nebo použijte mikrofon...',
        pl: 'Pisz lub użyj mikrofonu...',
        tr: 'Yazın veya Mikrofonu kullanın...',
        ar: 'اكتب أو استخدم الميكروفون...',
        uk: 'Пишіть або використовуйте мікрофон...',
        ru: 'Пишите или используйте микрофон...',
    },
    dialog_eval: { de: 'BEWERTUNG', en: 'EVALUATION', es: 'EVALUACIÓN' },
    dialog_feedback: { de: 'FEEDBACK', en: 'FEEDBACK', es: 'CONSEJO' },
    settings_preview: { de: 'Vorschau:', en: 'Preview:', es: 'Vista previa:' },
    hud_lvl: { de: 'STUFE', en: 'LVL', es: 'NIVEL' },
    hud_words: { de: 'WÖRTER', en: 'WORDS', es: 'PALABRAS' },
    hud_day: { de: 'TAG', en: 'DAY', es: 'DÍA' },
    dict_title: { de: 'WÖRTERBUCH', en: 'DICTIONARY', es: 'DICCIONARIO' },
    dict_loading: { de: 'Laden…', en: 'Loading…', es: 'Cargando…' },
    dict_close: { de: 'SCHLIEẞEN', en: 'CLOSE', es: 'CERRAR' },
    dict_ph_word: { de: 'Wort (Deutsch)', en: 'Word (German)', es: 'Palabra (alemán)' },
    dict_ph_trans: { de: 'Übersetzung', en: 'Translation', es: 'Traducción' },
    dict_btn_add: { de: 'HINZUFÜGEN', en: 'ADD', es: 'AGREGAR' },
    dict_title_options: { de: 'Optionen', en: 'Options', es: 'Opciones' },
    dict_ph_cat: { de: 'Kategorie', en: 'Category', es: 'Categoría' },
    dict_ph_ex: { de: 'Beispiel', en: 'Example', es: 'Ejemplo' },
    dict_search_ph: { de: 'Suchen…', en: 'Search…', es: 'Buscar…' },
    dict_sort_recent: { de: 'Neueste zuerst', en: 'Newest first', es: 'Más recientes primero' },
    dict_sort_cat: { de: 'Nach Kategorie', en: 'By category', es: 'Por categoría' },
    dict_sort_pinned: { de: 'Lernwörter', en: 'Pinned words', es: 'Chinches primero' },
    dict_import: { de: 'Importieren', en: 'Import', es: 'Importar' },
    dict_export: { de: 'Exportieren', en: 'Export', es: 'Exportar' }
};

/**
 * I18nManager singleton
 * Manages game language and translation language preferences.
 */
class I18nManager {
    constructor() {
        this.gameLang = 'de';    // Primary game language (German)
        this.trans1 = 'en';      // Translation 1 (small)
        this.trans2 = 'es';      // Translation 2 (smaller)
        this._loadSettings();
    }

    _loadSettings() {
        try {
            const stored = localStorage.getItem('widLanguageSettings');
            if (stored) {
                const data = JSON.parse(stored);
                this.gameLang = data.gameLang || 'de';
                this.trans1 = data.trans1 ?? 'en';
                this.trans2 = data.trans2 ?? 'es';
            }
        } catch (e) {
            // defaults are fine
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('widLanguageSettings', JSON.stringify({
                gameLang: this.gameLang,
                trans1: this.trans1,
                trans2: this.trans2,
            }));
        } catch (e) { /* ignore */ }
    }

    /**
     * Get a translated string by key.
     * Returns the string in the game language.
     */
    t(key) {
        const entry = STRINGS[key];
        if (!entry) return key;
        return entry[this.gameLang] || entry['de'] || key;
    }

    /**
     * Get translation 1 (small subtitle)
     * Returns null if trans1 is disabled or same as gameLang
     */
    t1(key) {
        if (!this.trans1 || this.trans1 === this.gameLang) return null;
        const entry = STRINGS[key];
        if (!entry) return null;
        return entry[this.trans1] || null;
    }

    /**
     * Get translation 2 (smaller subtitle)
     * Returns null if trans2 is disabled or same as gameLang or trans1
     */
    t2(key) {
        if (!this.trans2 || this.trans2 === this.gameLang) return null;
        const entry = STRINGS[key];
        if (!entry) return null;
        return entry[this.trans2] || null;
    }

    /**
     * Get language info
     */
    getLangInfo(code) {
        return LANGUAGES[code] || { label: code, flag: '🌐', nativeName: code };
    }

    /**
     * Get list of available language codes
     */
    getAvailableLangs() {
        return Object.keys(LANGUAGES);
    }
}

// Singleton
export const i18n = new I18nManager();
