import { API_CONFIG } from '../../config/apiConfig.js';

const MAX_WORDS = 10;

const parseErrorMessage = async (response) => {
    try {
        const data = await response.json();
        if (data?.error) return String(data.error);
    } catch {
        // Ignore JSON parse errors; fallback below.
    }
    return `${response.status} ${response.statusText || 'Request failed'}`.trim();
};

const fetchWithTimeout = async (url, options, timeoutMs) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
};

const normalizeWords = (words = []) => {
    const seen = new Set();
    const normalized = [];

    for (const raw of words) {
        const word = String(raw?.word || '').trim();
        if (!word) continue;

        const key = word.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        normalized.push({
            word,
            translation: String(raw?.translation || '').trim()
        });

        if (normalized.length >= MAX_WORDS) break;
    }

    return normalized;
};

const callMainApi = async (payload) => {
    const response = await fetchWithTimeout('/api/radio/tune', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }, API_CONFIG.TIMEOUT_MS.RADIO);

    if (!response.ok) {
        const reason = await parseErrorMessage(response);
        throw new Error(`main-api: ${reason}`);
    }

    return await response.json();
};

const callProxyApi = async (payload) => {
    const response = await fetchWithTimeout(`${API_CONFIG.PROXY_URL}/radio/tune`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-astrofleet-secret': API_CONFIG.GAME_SECRET,
        },
        body: JSON.stringify(payload),
    }, API_CONFIG.TIMEOUT_MS.RADIO);

    if (!response.ok) {
        const reason = await parseErrorMessage(response);
        throw new Error(`proxy-api: ${reason}`);
    }

    return await response.json();
};

/**
 * Intenta obtener una señal de radio IA real:
 * 1) /api/radio/tune (si hay sesión web)
 * 2) fallback a proxy dedicado (/radio/tune)
 */
export async function tuneSignalRadio({ style, words = [] }) {
    const payload = {
        style: String(style || 'Kiezfunk 88.4').slice(0, 120),
        words: normalizeWords(words),
    };

    const errors = [];

    try {
        const data = await callMainApi(payload);
        return { ...data, backend: 'main-api' };
    } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
    }

    try {
        const data = await callProxyApi(payload);
        return { ...data, backend: 'proxy-api' };
    } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
    }

    throw new Error(errors.join(' | ') || 'No se pudo sintonizar la señal.');
}
