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
    de: { label: 'DE', flag: '🇩🇪', nativeName: 'Deutsch' },
    en: { label: 'EN', flag: '🇬🇧', nativeName: 'Englisch' },
    es: { label: 'ES', flag: '🇪🇸', nativeName: 'Spanisch' },
    fr: { label: 'FR', flag: '🇫🇷', nativeName: 'Französisch' },
    pt: { label: 'PT', flag: '🇧🇷', nativeName: 'Portugiesisch' },
    it: { label: 'IT', flag: '🇮🇹', nativeName: 'Italienisch' },
    cs: { label: 'CS', flag: '🇨🇿', nativeName: 'Tschechisch' },
    pl: { label: 'PL', flag: '🇵🇱', nativeName: 'Polnisch' },
    tr: { label: 'TR', flag: '🇹🇷', nativeName: 'Türkisch' },
    ar: { label: 'AR', flag: '🇸🇦', nativeName: 'Arabisch' },
    uk: { label: 'UK', flag: '🇺🇦', nativeName: 'Ukrainisch' },
    ru: { label: 'RU', flag: '🇷🇺', nativeName: 'Russisch' },
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
        de: 'keiner',
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
    dict_export: { de: 'Exportieren', en: 'Export', es: 'Exportar' },
    menu_back: { de: 'MENÜ', en: 'MENU', es: 'MENÚ' },
    dict_stats_words: { de: 'Wörter', en: 'words', es: 'palabras' },
    dict_stats_mine: { de: 'eigene', en: 'mine', es: 'mías' },
    dict_stats_study: { de: 'für Lernwörter', en: 'to study', es: 'para estudiar' },
    dict_stats_filtered: { de: 'gefiltert', en: 'filtered', es: 'filtradas' },
    dict_label_main: { de: 'Haupt-Übersetzung', en: 'Main Translation', es: 'Traducción Principal' },
    dict_save: { de: 'Speichern', en: 'Save', es: 'Guardar' },
    dict_btn_clear: { de: 'LEEREN', en: 'CLEAR', es: 'LIMPIAR' },

    // ── Categories ───────────────────────
    cat_noun: { de: 'Substantiv', en: 'Noun', es: 'Sustantivo', cs: 'Podstatné jméno', ru: 'Существительное' },
    cat_verb: { de: 'Verb', en: 'Verb', es: 'Verbo', cs: 'Sloveso', ru: 'Глагол' },
    cat_adj: { de: 'Adjektiv', en: 'Adjective', es: 'Adjetivo', cs: 'Přídavné jméno', ru: 'Прилагательное' },
    cat_adv: { de: 'Adverb', en: 'Adverb', es: 'Adverbio', cs: 'Příslovce', ru: 'Наречие' },
    cat_pron: { de: 'Pronomen', en: 'Pronoun', es: 'Pronombre', cs: 'Zájmeno', ru: 'Местоимение' },
    cat_prep: { de: 'Präposition', en: 'Preposition', es: 'Preposición', cs: 'Předložka', ru: 'Предлог' },
    cat_conj: { de: 'Konjunktion', en: 'Conjunction', es: 'Conjunción', cs: 'Spojka', ru: 'Союз' },
    cat_int: { de: 'Interjektion', en: 'Interjection', es: 'Interjección', cs: 'Citoslovce', ru: 'Междометие' },
    cat_art: { de: 'Artikel', en: 'Article', es: 'Artículo', cs: 'Člen', ru: 'Артикль' },
    cat_phrase: { de: 'Phrase', en: 'Phrase', es: 'Frase', cs: 'Fráze', ru: 'Фраза' },
    cat_expr: { de: 'Ausdruck', en: 'Expression', es: 'Expresión', cs: 'Výraz', ru: 'Выражение' },
    cat_gen: { de: 'Allgemein', en: 'General', es: 'General', cs: 'Obecné', ru: 'Общее' }
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

    /**
     * Translates a category name to the current game language.
     * Attempts to normalize the input name first.
     */
    tCategory(catName) {
        if (!catName) return this.t('cat_gen');

        const normalized = catName.toLowerCase().trim();

        // Reverse map to find the category key
        const categoryKeys = [
            'cat_noun', 'cat_verb', 'cat_adj', 'cat_adv', 'cat_pron',
            'cat_prep', 'cat_conj', 'cat_int', 'cat_art', 'cat_phrase',
            'cat_expr', 'cat_gen'
        ];

        for (const key of categoryKeys) {
            const entry = STRINGS[key];
            if (!entry) continue;

            // Check if the input matches any translation in the entry
            for (const langCode in entry) {
                if (entry[langCode].toLowerCase() === normalized) {
                    return this.t(key);
                }
            }
        }

        // Hardcoded common German variations if not in entry
        const deMaps = {
            'substantiv': 'cat_noun', 'nomen': 'cat_noun', 'hauptwort': 'cat_noun',
            'verb': 'cat_verb', 'zeitwort': 'cat_verb',
            'adjektiv': 'cat_adj', 'eigenschaftswort': 'cat_adj',
            'adverb': 'cat_adv', 'umstandswort': 'cat_adv',
            'artikel': 'cat_art', 'begleiter': 'cat_art',
            'pronomen': 'cat_pron', 'fürwort': 'cat_pron',
            'präposition': 'cat_prep', 'verhältniswort': 'cat_prep',
            'konjunktion': 'cat_conj', 'bindewort': 'cat_conj',
            'interjektion': 'cat_int', 'ausrufewort': 'cat_int',
            'phrase': 'cat_phrase', 'ausdruck': 'cat_expr',
            'general': 'cat_gen', 'allgemein': 'cat_gen'
        };

        if (deMaps[normalized]) return this.t(deMaps[normalized]);

        // Fallback: return as is if no match found
        return catName;
    }
}

// Singleton
export const i18n = new I18nManager();
