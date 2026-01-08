// Game Manager - Manage game lifecycle (create, load, save)

const GameManager = (() => {
    return {
        /**
         * Initialize the application
         * Load last game or create new one
         */
        initializeApp() {
            console.log('Initializing Basketball Scorebook 2.0...');

            // Try to load last game
            const lastGameId = Storage.getCurrentGameId();
            if (lastGameId) {
                const game = Storage.loadGame(lastGameId);
                if (game) {
                    this.loadGameInEditMode(lastGameId);
                    console.log('Loaded last game:', game.gameName);
                    return;
                }
            }

            // Create new game if no existing game found
            this.createNewGame(false);
            console.log('Created new game');
        },

        /**
         * Create a new game
         * @param {boolean} keepRoster - Keep current team roster and name
         */
        createNewGame(keepRoster = false) {
            const currentGame = DataModel.getCurrentGame();
            let teamName = 'Ravens';
            let teamRoster = [];
            let playerNames = {};

            // Save current game before creating new one
            if (currentGame) {
                Storage.saveGame(currentGame);

                if (keepRoster) {
                    teamName = currentGame.teamName;
                    teamRoster = [...currentGame.teamRoster];
                    playerNames = { ...currentGame.playerNames };
                }
            }

            // Get next game number from game list
            const gameList = Storage.getGameList();
            const gameNumber = gameList.length + 1;
            const gameName = `Game ${gameNumber}`;

            // Create new game
            const newGame = DataModel.createGame(gameName, teamName, teamRoster, playerNames);
            DataModel.setCurrentGame(newGame);

            // Clear stats cache
            DataModel.clearPlayerStatsCache();

            // Reset app state and set to edit mode
            DataModel.resetAppState();
            DataModel.switchToEditMode();

            // Save new game
            Storage.saveGame(newGame);

            // Emit event
            EventBus.emit('game:loaded', newGame);

            return newGame;
        },

        /**
         * Load an existing game (for page initialization - loads in edit mode)
         * @param {string} gameId - Game ID to load
         */
        loadGameInEditMode(gameId) {
            // Save current game first
            const currentGame = DataModel.getCurrentGame();
            if (currentGame) {
                Storage.saveGame(currentGame);
            }

            // Load game
            const game = Storage.loadGame(gameId);
            if (!game) {
                console.error('Game not found:', gameId);
                return false;
            }

            // Set as current game
            DataModel.setCurrentGame(game);

            // Reset app state and set to edit mode
            DataModel.resetAppState();
            DataModel.switchToEditMode();

            // Update stats cache
            StatCalculator.updateStatsCache(
                game.teamRoster,
                game.gameEvents,
                game.playerNames
            );

            // Emit event
            EventBus.emit('game:loaded', game);

            return true;
        },

        /**
         * Load an existing game (switches to view mode)
         * @param {string} gameId - Game ID to load
         */
        loadGame(gameId) {
            // Save current game first
            const currentGame = DataModel.getCurrentGame();
            if (currentGame) {
                Storage.saveGame(currentGame);
            }

            // Load game
            const game = Storage.loadGame(gameId);
            if (!game) {
                console.error('Game not found:', gameId);
                return false;
            }

            // Set as current game
            DataModel.setCurrentGame(game);

            // Reset app state
            DataModel.resetAppState();

            // Switch to view mode
            this.switchToViewMode();

            // Update stats cache
            StatCalculator.updateStatsCache(
                game.teamRoster,
                game.gameEvents,
                game.playerNames
            );

            // Emit event
            EventBus.emit('game:loaded', game);

            return true;
        },

        /**
         * Clear all events from current game
         */
        clearCurrentGame() {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            // Clear all events
            game.gameEvents = [];
            game.lastModified = Date.now();

            // Clear stats cache
            DataModel.clearPlayerStatsCache();

            // Update stats cache (will be empty)
            StatCalculator.updateStatsCache(
                game.teamRoster,
                game.gameEvents,
                game.playerNames
            );

            // Reset app state and switch to edit mode
            DataModel.resetAppState();
            DataModel.switchToEditMode();

            // Hide Draw Row if visible
            const drawRow = document.getElementById('draw-row');
            if (drawRow) {
                drawRow.style.display = 'none';
            }

            // Clear pending shot state
            const appState = DataModel.getAppState();
            appState.pendingShot = null;

            // Save game
            Storage.saveGame(game);

            // Emit events to trigger re-render
            EventBus.emit('game:loaded', game);
            EventBus.emit('stats:updated');
        },

        /**
         * Save current game explicitly
         */
        saveCurrentGame() {
            const game = DataModel.getCurrentGame();
            if (game) {
                Storage.saveGame(game);
                EventBus.emit('game:saved', game);
            }
        },

        /**
         * Delete a game
         * @param {string} gameId - Game ID to delete
         */
        deleteGame(gameId) {
            const currentGame = DataModel.getCurrentGame();

            // If deleting current game, create a new one first
            if (currentGame && currentGame.gameId === gameId) {
                this.createNewGame(false);
            }

            Storage.deleteGame(gameId);
        },

        /**
         * Update game name
         * @param {string} newName - New game name
         */
        updateGameName(newName) {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            game.gameName = newName;
            game.lastModified = Date.now();

            Storage.autoSave();
            EventBus.emit('game:saved', game);
        },

        /**
         * Update team name
         * @param {string} newName - New team name
         */
        updateTeamName(newName) {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            game.teamName = newName;
            game.lastModified = Date.now();

            Storage.autoSave();
            EventBus.emit('game:saved', game);
        },

        /**
         * Update team roster
         * @param {Array} roster - Array of jersey numbers
         */
        updateTeamRoster(roster) {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            game.teamRoster = roster;
            game.lastModified = Date.now();

            // Update stats cache
            StatCalculator.updateStatsCache(
                game.teamRoster,
                game.gameEvents,
                game.playerNames
            );

            Storage.autoSave();
            EventBus.emit('game:saved', game);
        },

        /**
         * Update player name
         * @param {number} jerseyNumber - Jersey number
         * @param {string} name - Player name
         */
        updatePlayerName(jerseyNumber, name) {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            game.playerNames[jerseyNumber] = name;
            game.lastModified = Date.now();

            Storage.autoSave();
            EventBus.emit('game:saved', game);
        },

        /**
         * Switch to edit mode
         */
        switchToEditMode() {
            DataModel.switchToEditMode();
            EventBus.emit('mode:changed', 'edit');
        },

        /**
         * Switch to view mode
         */
        switchToViewMode() {
            // Hide Draw Row if visible
            const drawRow = document.getElementById('draw-row');
            if (drawRow) {
                drawRow.style.display = 'none';
            }

            // Hide tap-text and retap-text overlays
            const tapText = document.getElementById('tap-text');
            if (tapText) {
                tapText.style.display = 'none';
            }
            const retapText = document.getElementById('retap-text');
            if (retapText) {
                retapText.style.display = 'none';
            }

            // Clear pending shot state
            const appState = DataModel.getAppState();
            appState.selectedShotType = null;
            appState.pendingShot = null;

            DataModel.switchToViewMode();
            EventBus.emit('mode:changed', 'view');
        },

        /**
         * Export current game as JSON
         */
        exportCurrentGame() {
            const game = DataModel.getCurrentGame();
            if (game) {
                Storage.exportGameAsJSON(game.gameId);
            }
        },

        /**
         * Import game from file
         * @param {File} file - JSON file to import
         */
        importGame(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const success = Storage.importGameFromJSON(e.target.result);
                if (success) {
                    EventBus.emit('game:imported');
                }
            };
            reader.readAsText(file);
        }
    };
})();
