// Storage - localStorage operations for game data persistence

const Storage = (() => {
    const GAME_LIST_KEY = 'gameList';
    const CURRENT_GAME_ID_KEY = 'currentGameId';
    const HOT_BUTTONS_KEY = 'hotButtons';

    let autoSaveEnabled = true;

    // Default hot buttons (independent counters, not tied to game events)
    // mode: 'single' for count only, 'dual' for made/attempts
    const DEFAULT_HOT_BUTTONS = [
        { id: 'hb_1', label: 'Off REB', count: 0, mode: 'single' },
        { id: 'hb_2', label: 'Def REB', count: 0, mode: 'single' },
        { id: 'hb_3', label: 'Assists', count: 0, mode: 'single' },
        { id: 'hb_4', label: 'Catch high shoot high', count: 0, mode: 'single' },
        { id: 'hb_5', label: 'Free Throw', made: 0, attempts: 0, mode: 'dual' },
        { id: 'hb_6', label: 'Lookup for open players!', count: 0, mode: 'single' },
        { id: 'hb_7', label: '3pt', made: 0, attempts: 0, mode: 'dual' }
    ];

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
                    freeThrowLineDistanceFt: 19,
                    topLeftCorner: { x: 0.03, y: 0.03 },
                    bottomRightCorner: { x: 0.97, y: 0.97 }
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
         * Export game as JSON file (includes game, team template, and hot buttons)
         * @param {string} gameId - Game ID to export
         */
        exportGameAsJSON(gameId) {
            const gameData = this.loadGame(gameId);
            if (!gameData) {
                alert('Game not found');
                return;
            }

            // Create export bundle with game, team template, and hot buttons
            const exportBundle = {
                version: '2.0',
                exportType: 'full',
                exportedAt: Date.now(),
                game: gameData,
                teamTemplate: {
                    teamName: gameData.teamName,
                    teamRoster: gameData.teamRoster,
                    playerNames: gameData.playerNames
                },
                hotButtons: this.getHotButtons()
            };

            const json = JSON.stringify(exportBundle, null, 2);
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
         * Import game from JSON string (supports both old format and new bundle format)
         * @param {string} jsonString - JSON string containing game data
         * @returns {boolean} Success status
         */
        importGameFromJSON(jsonString) {
            try {
                const parsed = JSON.parse(jsonString);

                // Check if it's the new bundle format
                if (parsed.version && parsed.exportType === 'full') {
                    return this.importBundle(parsed);
                }

                // Legacy format: just game data
                const gameData = parsed;

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
         * Import bundle (game + team template + hot buttons)
         * @param {Object} bundle - Export bundle object
         * @returns {boolean} Success status
         */
        importBundle(bundle) {
            try {
                // Import game data
                if (bundle.game) {
                    const gameData = bundle.game;

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
                }

                // Import hot buttons (optional - prompt user)
                if (bundle.hotButtons && bundle.hotButtons.length > 0) {
                    if (confirm('Import hot buttons from this file? This will replace your current hot buttons.')) {
                        this.saveHotButtons(bundle.hotButtons);
                        console.log('Hot buttons imported:', bundle.hotButtons.length);
                    }
                }

                return true;
            } catch (error) {
                console.error('Error importing bundle:', error);
                alert('Failed to import. Invalid format.');
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
        },

        /**
         * Get hot buttons configuration
         * @returns {Array} Array of hot button configs
         */
        getHotButtons() {
            try {
                const data = localStorage.getItem(HOT_BUTTONS_KEY);
                if (data) {
                    return JSON.parse(data);
                }
                // Return default hot buttons if none saved
                return [...DEFAULT_HOT_BUTTONS];
            } catch (error) {
                console.error('Error loading hot buttons:', error);
                return [...DEFAULT_HOT_BUTTONS];
            }
        },

        /**
         * Save hot buttons configuration
         * @param {Array} hotButtons - Array of hot button configs
         */
        saveHotButtons(hotButtons) {
            try {
                localStorage.setItem(HOT_BUTTONS_KEY, JSON.stringify(hotButtons));
            } catch (error) {
                console.error('Error saving hot buttons:', error);
            }
        },

        /**
         * Add a new hot button
         * @param {Object} buttonConfig - { who, what, label }
         * @returns {Object} The new hot button with id
         */
        addHotButton(buttonConfig) {
            const hotButtons = this.getHotButtons();
            if (hotButtons.length >= 16) {
                return null; // Max 16 buttons (2x8 grid)
            }
            const newButton = {
                id: 'hb_' + Date.now(),
                ...buttonConfig
            };
            hotButtons.push(newButton);
            this.saveHotButtons(hotButtons);
            return newButton;
        },

        /**
         * Update a hot button
         * @param {string} buttonId - Button ID to update
         * @param {Object} updates - Properties to update
         */
        updateHotButton(buttonId, updates) {
            const hotButtons = this.getHotButtons();
            const index = hotButtons.findIndex(b => b.id === buttonId);
            if (index >= 0) {
                hotButtons[index] = { ...hotButtons[index], ...updates };
                this.saveHotButtons(hotButtons);
            }
        },

        /**
         * Delete a hot button
         * @param {string} buttonId - Button ID to delete
         */
        deleteHotButton(buttonId) {
            const hotButtons = this.getHotButtons();
            const filtered = hotButtons.filter(b => b.id !== buttonId);
            this.saveHotButtons(filtered);
        }
    };
})();
