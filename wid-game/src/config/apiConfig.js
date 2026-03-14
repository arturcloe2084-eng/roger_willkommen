// API configuration — centralised, read from .env at build time.
const DEFAULT_PROXY_URL = 'http://localhost:8080';
const DEFAULT_GAME_SECRET = 'wid-secret-2026';   // debe coincidir con GAME_AUTH_SECRET del proxy

export const API_CONFIG = Object.freeze({
    PROXY_URL: import.meta.env.VITE_PROXY_URL || DEFAULT_PROXY_URL,
    GAME_SECRET: import.meta.env.VITE_GAME_SECRET || DEFAULT_GAME_SECRET,
    TIMEOUT_MS: Object.freeze({
        NPC: 12000,
        NARRATION: 8000,
        RADIO: 12000,
    }),
});
