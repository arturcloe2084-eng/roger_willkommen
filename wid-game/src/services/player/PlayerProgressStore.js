// Central player progression + narrative state store.
export const playerProgressStore = {
    name: 'Roger',
    targetLanguage: 'German',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    learnedWords: [],
    stats: {
        correct: 0,
        partial: 0,
        incorrect: 0,
    },
    story: {
        day: 1,
        chapter: 'Día 1 — Llegada',
        activeObjective: 'Leer la Hausordnung y sobrevivir al primer día.',
        journal: [],
        flags: {},
    },

    // ── Añadir XP y verificar nivel ───────────────────────────
    addXP(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.level += 1;
            this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
            return true; // subió de nivel
        }
        return false;
    },

    // ── Aprender una nueva palabra ─────────────────────────────
    learnWord(word, translation) {
        const already = this.learnedWords.find(w => w.word === word);
        if (!already) {
            this.learnedWords.push({ word, translation, learnedAt: Date.now() });
            return true; // palabra nueva
        }
        return false;
    },

    // ── Registrar resultado de una interacción ─────────────────
    recordResult(evaluation) {
        if (evaluation === 'correct') this.stats.correct++;
        if (evaluation === 'partial') this.stats.partial++;
        if (evaluation === 'incorrect') this.stats.incorrect++;
    },

    // ── Historia / narrativa ───────────────────────────────────
    setChapter(chapter) {
        if (!chapter) return false;
        if (this.story.chapter === chapter) return false;
        this.story.chapter = chapter;
        return true;
    },

    setObjective(objective) {
        if (!objective) return false;
        if (this.story.activeObjective === objective) return false;
        this.story.activeObjective = objective;
        return true;
    },

    setStoryContext({ chapter, objective }) {
        const chapterChanged = this.setChapter(chapter);
        const objectiveChanged = this.setObjective(objective);
        return chapterChanged || objectiveChanged;
    },

    advanceDay(amount = 1) {
        const safeAmount = Math.max(1, Math.floor(amount));
        this.story.day = Math.min(30, this.story.day + safeAmount);
        return this.story.day;
    },

    hasFlag(flag) {
        return Boolean(flag && this.story.flags[flag]);
    },

    unlockFlag(flag) {
        if (!flag) return false;
        if (this.story.flags[flag]) return false;
        this.story.flags[flag] = true;
        return true;
    },

    addJournal(entry, flag = null) {
        if (!entry) return false;
        if (flag && !this.unlockFlag(flag)) return false;

        const trimmed = String(entry).trim();
        if (!trimmed) return false;

        const last = this.story.journal[this.story.journal.length - 1];
        if (last?.text === trimmed) return false;

        this.story.journal.push({
            text: trimmed,
            day: this.story.day,
            at: Date.now(),
        });

        if (this.story.journal.length > 60) {
            this.story.journal.shift();
        }
        return true;
    },

    // ── Porcentaje de XP para la barra ─────────────────────────
    get xpPercent() {
        return Math.min(100, Math.floor((this.xp / this.xpToNextLevel) * 100));
    },
};

// Legacy alias kept to avoid breaking in-progress refs while refactoring.
export const PlayerState = playerProgressStore;
