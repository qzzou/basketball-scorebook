// Data Model - Core data structures and application state

const DataModel = (() => {
    // Application state
    const appState = {
        currentGameId: null,
        currentMode: "edit", // "edit" or "view"
        currentView: "main", // "main", "settings", "help", "gameHistory", "actionCorrection"

        // Edit mode state
        selectedJersey: null,
        selectedShotType: null, // "+1", "+2", "+3", "miss1", "miss2", "miss3"

        // View mode state
        selectedJerseys: [], // Array of jersey numbers

        // Action correction state
        correctionEventIndex: null
    };

    // Player stats cache (calculated from events)
    const playerStatsCache = {};

    // Current game data
    let currentGame = null;

    return {
        /**
         * Create a new game object
         * @param {string} gameName - Name of the game
         * @param {string} teamName - Name of the team
         * @param {Array<number>} roster - Array of jersey numbers
         * @param {Object} playerNames - Object mapping jersey numbers to player names
         * @returns {Object} New game object
         */
        createGame(gameName, teamName, roster = [], playerNames = {}) {
            const gameId = IDGenerator.generateGameId();
            const now = Date.now();

            return {
                gameId,
                gameName: gameName || `Game ${new Date().toLocaleDateString()}`,
                teamName: teamName || "Ravens",
                teamRoster: roster,
                playerNames: playerNames,
                gameEvents: [],
                createdAt: now,
                lastModified: now
            };
        },

        /**
         * Create a new game event
         * @param {number} playerNumber - Jersey number
         * @param {string} action - "shot", "foul", or "stat"
         * @param {Object} data - Event-specific data (shotData, foulData, or statData)
         * @returns {Object} New event object
         */
        createEvent(playerNumber, action, data) {
            return {
                eventIndex: IDGenerator.generateEventIndex(),
                timestamp: Date.now(),
                playerNumber,
                action,
                eventStatus: "active", // "active", "archived", "deleted"
                edited: false,
                ...data
            };
        },

        /**
         * Get current game
         * @returns {Object|null} Current game object
         */
        getCurrentGame() {
            return currentGame;
        },

        /**
         * Set current game
         * @param {Object} game - Game object
         */
        setCurrentGame(game) {
            currentGame = game;
            if (game) {
                appState.currentGameId = game.gameId;
                // Sync event counter with existing events
                IDGenerator.syncEventCounter(game.gameEvents);
            }
        },

        /**
         * Get game events filtered by status
         * @param {string} status - Filter by status ("active", "archived", "deleted", or null for all)
         * @returns {Array} Filtered events
         */
        getGameEvents(status = null) {
            if (!currentGame) return [];
            if (!status) return currentGame.gameEvents;
            return currentGame.gameEvents.filter(e => e.eventStatus === status);
        },

        /**
         * Add event to current game
         * @param {Object} event - Event object
         */
        addEvent(event) {
            if (!currentGame) return;
            currentGame.gameEvents.push(event);
            currentGame.lastModified = Date.now();
        },

        /**
         * Update an existing event
         * @param {number} eventIndex - Index of event to update
         * @param {Object} updates - Properties to update
         */
        updateEvent(eventIndex, updates) {
            if (!currentGame) return;
            const event = currentGame.gameEvents.find(e => e.eventIndex === eventIndex);
            if (event) {
                Object.assign(event, updates);
                currentGame.lastModified = Date.now();
            }
        },

        /**
         * Get application state
         * @returns {Object} Application state
         */
        getAppState() {
            return appState;
        },

        /**
         * Update application state
         * @param {Object} updates - State properties to update
         */
        updateAppState(updates) {
            Object.assign(appState, updates);
        },

        /**
         * Get player stats cache
         * @returns {Object} Player stats cache
         */
        getPlayerStatsCache() {
            return playerStatsCache;
        },

        /**
         * Update player stats in cache
         * @param {number} playerNumber - Jersey number
         * @param {Object} stats - Stats object
         */
        updatePlayerStats(playerNumber, stats) {
            playerStatsCache[playerNumber] = stats;
        },

        /**
         * Clear player stats cache
         */
        clearPlayerStatsCache() {
            Object.keys(playerStatsCache).forEach(key => delete playerStatsCache[key]);
        },

        /**
         * Reset application state (for mode switching)
         */
        resetAppState() {
            appState.selectedJersey = null;
            appState.selectedShotType = null;
            appState.selectedJerseys = [];
            appState.correctionEventIndex = null;
            appState.pendingShot = null;
        },

        /**
         * Switch to edit mode
         */
        switchToEditMode() {
            appState.currentMode = "edit";
            appState.selectedJersey = null;
            appState.selectedShotType = null;
            appState.selectedJerseys = [];
        },

        /**
         * Switch to view mode (select all jerseys by default)
         */
        switchToViewMode() {
            appState.currentMode = "view";
            appState.selectedJersey = null;
            appState.selectedShotType = null;
            if (currentGame) {
                appState.selectedJerseys = [...currentGame.teamRoster];
            }
        }
    };
})();
