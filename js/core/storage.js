// Storage - localStorage operations for game data persistence

const Storage = (() => {
    const GAME_LIST_KEY = 'gameList';
    const CURRENT_GAME_ID_KEY = 'currentGameId';

    let autoSaveEnabled = true;

    return {
        /**
         * Save game to localStorage
         * @param {Object} gameData - Game object to save
         */
        saveGame(gameData) {
            if (!gameData || !gameData.gameId) {
                console.error('Invalid game data');
                return;
            }

            try {
                // Save game data
                const gameKey = gameData.gameId;
                localStorage.setItem(gameKey, JSON.stringify(gameData));

                // Update game list
                this.updateGameList(gameData);

                // Save as current game
                localStorage.setItem(CURRENT_GAME_ID_KEY, gameData.gameId);

                console.log(`Game saved: ${gameData.gameName}`);
            } catch (error) {
                console.error('Error saving game:', error);
                if (error.name === 'QuotaExceededError') {
                    alert('Storage quota exceeded. Please delete old games to free up space.');
                }
            }
        },

        /**
         * Load game from localStorage
         * @param {string} gameId - Game ID to load
         * @returns {Object|null} Game object or null if not found
         */
        loadGame(gameId) {
            try {
                const gameData = localStorage.getItem(gameId);
                if (!gameData) {
                    console.warn(`Game not found: ${gameId}`);
                    return null;
                }
                return JSON.parse(gameData);
            } catch (error) {
                console.error('Error loading game:', error);
                return null;
            }
        },

        /**
         * Delete game from localStorage
         * @param {string} gameId - Game ID to delete
         */
        deleteGame(gameId) {
            try {
                // Remove game data
                localStorage.removeItem(gameId);

                // Update game list
                let gameList = this.getGameList();
                gameList = gameList.filter(g => g.gameId !== gameId);
                localStorage.setItem(GAME_LIST_KEY, JSON.stringify(gameList));

                console.log(`Game deleted: ${gameId}`);
            } catch (error) {
                console.error('Error deleting game:', error);
            }
        },

        /**
         * Get list of all games
         * @returns {Array} Array of game metadata
         */
        getGameList() {
            try {
                const gameListData = localStorage.getItem(GAME_LIST_KEY);
                return gameListData ? JSON.parse(gameListData) : [];
            } catch (error) {
                console.error('Error loading game list:', error);
                return [];
            }
        },

        /**
         * Update game list with game metadata
         * @param {Object} gameData - Game object
         */
        updateGameList(gameData) {
            let gameList = this.getGameList();

            // Calculate total points from events
            const totalPoints = gameData.gameEvents
                .filter(e => e.eventStatus === 'active' && e.action === 'shot' && e.shotData?.made)
                .reduce((sum, e) => {
                    const points = e.shotData.shotType === 'FT' ? 1 :
                                   e.shotData.shotType === '3PT' ? 3 : 2;
                    return sum + points;
                }, 0);

            // Check if game already exists in list
            const existingIndex = gameList.findIndex(g => g.gameId === gameData.gameId);
            const gameMetadata = {
                gameId: gameData.gameId,
                gameName: gameData.gameName,
                teamName: gameData.teamName,
                totalPoints,
                timestamp: gameData.createdAt,
                lastModified: gameData.lastModified,
                // Include court dimensions for export compatibility
                courtDimensions: gameData.courtDimensions || {
                    courtLengthFt: 94,
                    courtWidthFt: 50,
                    basketDistanceFromBaselineFt: 4,
                    threePointRadiusFt: 22.146,
                    keyWidthFt: 12,
                    freeThrowLineDistanceFt: 19
                }
            };

            if (existingIndex >= 0) {
                gameList[existingIndex] = gameMetadata;
            } else {
                gameList.push(gameMetadata);
            }

            // Sort by last modified (newest first)
            gameList.sort((a, b) => b.lastModified - a.lastModified);

            localStorage.setItem(GAME_LIST_KEY, JSON.stringify(gameList));
        },

        /**
         * Get last played game ID
         * @returns {string|null} Game ID or null
         */
        getCurrentGameId() {
            return localStorage.getItem(CURRENT_GAME_ID_KEY);
        },

        /**
         * Export game as JSON file
         * @param {string} gameId - Game ID to export
         */
        exportGameAsJSON(gameId) {
            const gameData = this.loadGame(gameId);
            if (!gameData) {
                alert('Game not found');
                return;
            }

            const json = JSON.stringify(gameData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${gameData.gameName.replace(/[^a-z0-9]/gi, '_')}_${gameData.gameId}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('Game exported:', gameData.gameName);
        },

        /**
         * Import game from JSON string
         * @param {string} jsonString - JSON string containing game data
         * @returns {boolean} Success status
         */
        importGameFromJSON(jsonString) {
            try {
                const gameData = JSON.parse(jsonString);

                // Validate game data structure
                if (!gameData.gameName || !gameData.teamName || !gameData.gameEvents) {
                    alert('Invalid game data format');
                    return false;
                }

                // Assign new game ID to avoid conflicts
                gameData.gameId = IDGenerator.generateGameId();
                gameData.lastModified = Date.now();

                // Save imported game
                this.saveGame(gameData);

                console.log('Game imported:', gameData.gameName);
                return true;
            } catch (error) {
                console.error('Error importing game:', error);
                alert('Failed to import game. Invalid JSON format.');
                return false;
            }
        },

        /**
         * Export entire game list as JSON
         */
        exportAllGames() {
            const gameList = this.getGameList();
            const allGames = gameList.map(meta => this.loadGame(meta.gameId)).filter(g => g);

            const json = JSON.stringify(allGames, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `basketball_scorebook_backup_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('All games exported');
        },

        /**
         * Enable auto-save
         */
        enableAutoSave() {
            autoSaveEnabled = true;
        },

        /**
         * Disable auto-save
         */
        disableAutoSave() {
            autoSaveEnabled = false;
        },

        /**
         * Check if auto-save is enabled
         * @returns {boolean}
         */
        isAutoSaveEnabled() {
            return autoSaveEnabled;
        },

        /**
         * Auto-save current game
         */
        autoSave() {
            if (!autoSaveEnabled) return;

            const currentGame = DataModel.getCurrentGame();
            if (currentGame) {
                this.saveGame(currentGame);
            }
        }
    };
})();
