// ID Generator - Generate unique IDs for games and events

const IDGenerator = (() => {
    let eventCounter = 0;

    return {
        /**
         * Generate a unique game ID based on timestamp
         * @returns {string} Game ID in format "game_TIMESTAMP"
         */
        generateGameId() {
            return `game_${Date.now()}`;
        },

        /**
         * Generate sequential event index
         * @returns {number} Next event index
         */
        generateEventIndex() {
            return eventCounter++;
        },

        /**
         * Reset event counter (used when loading a new game)
         * @param {number} startIndex - Starting index (default: 0)
         */
        resetEventCounter(startIndex = 0) {
            eventCounter = startIndex;
        },

        /**
         * Set event counter to next available index based on existing events
         * @param {Array} events - Existing game events
         */
        syncEventCounter(events) {
            if (!events || events.length === 0) {
                eventCounter = 0;
                return;
            }
            const maxIndex = Math.max(...events.map(e => e.eventIndex));
            eventCounter = maxIndex + 1;
        }
    };
})();
