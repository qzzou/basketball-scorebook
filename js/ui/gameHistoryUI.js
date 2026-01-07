// Game History UI - View and manage saved games

const GameHistoryUI = (() => {
    return {
        /**
         * Show game history modal
         */
        show() {
            const gameList = Storage.getGameList();

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.id = 'game-history-overlay';
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-content game-history-modal">
                    <div class="modal-header">
                        <h2>Game History</h2>
                        <button class="icon-btn close-btn" onclick="GameHistoryUI.close()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="game-list" class="game-list"></div>
                    </div>
                    <div class="modal-footer">
                        <button onclick="GameHistoryUI.close()" class="btn-primary">Close</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Render game list
            this.renderGameList();

            // Initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }
        },

        /**
         * Close game history modal
         */
        close() {
            const overlay = document.getElementById('game-history-overlay');
            if (overlay) {
                overlay.remove();
            }
        },

        /**
         * Render game list
         */
        renderGameList() {
            const gameList = Storage.getGameList();
            const container = document.getElementById('game-list');
            if (!container) return;

            // Filter out games that no longer exist in storage
            const validGames = gameList.filter(game => {
                if (!game || !game.gameId || !game.gameName || !game.teamName) {
                    return false;
                }
                // Verify the actual game data exists in localStorage
                const gameData = Storage.loadGame(game.gameId);
                return gameData !== null;
            });

            if (validGames.length === 0) {
                container.innerHTML = '<p class="empty-message">No saved games yet.</p>';
                return;
            }

            const isOnlyOneGame = validGames.length === 1;

            container.innerHTML = validGames.map(game => {
                const date = new Date(game.timestamp);
                const lastModified = new Date(game.lastModified);
                const currentGameId = DataModel.getAppState().currentGameId;
                const isCurrent = game.gameId === currentGameId;

                return `
                    <div class="game-card ${isCurrent ? 'current' : ''}">
                        <div class="game-info">
                            <div class="game-title">
                                ${game.gameName}
                                ${isCurrent ? '<span class="current-badge">Current</span>' : ''}
                            </div>
                            <div class="game-details">
                                <span class="game-team">${game.teamName}</span>
                                <span class="game-score">${game.totalPoints} points</span>
                            </div>
                            <div class="game-meta">
                                <span>${Formatters.formatDateTime(date)}</span>
                                <span>Last modified: ${Formatters.formatTime(lastModified)}</span>
                            </div>
                        </div>
                        <div class="game-actions">
                            <button
                                onclick="GameHistoryUI.loadGame('${game.gameId}')"
                                class="btn-secondary"
                                title="Load this game"
                            >
                                <i data-lucide="folder-open"></i> Load
                            </button>
                            <button
                                onclick="GameHistoryUI.exportGame('${game.gameId}')"
                                class="btn-secondary"
                                title="Export as JSON"
                            >
                                <i data-lucide="download"></i> Export
                            </button>
                            <button
                                onclick="GameHistoryUI.deleteGame('${game.gameId}')"
                                class="btn-danger"
                                title="Delete game"
                                ${isOnlyOneGame ? 'disabled' : ''}
                            >
                                <i data-lucide="trash-2"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // Initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }
        },

        /**
         * Load a game
         */
        loadGame(gameId) {
            const appState = DataModel.getAppState();
            if (appState.currentGameId === gameId) {
                // Already loaded, just close modal
                this.close();
                return;
            }

            // Load game (automatically saves current game first)
            GameManager.loadGame(gameId);
            this.close();
        },

        /**
         * Export a game
         */
        exportGame(gameId) {
            Storage.exportGameAsJSON(gameId);
        },

        /**
         * Delete a game
         */
        deleteGame(gameId) {
            const gameList = Storage.getGameList();

            // Prevent deleting if it's the only game
            if (gameList.length === 1) {
                alert('Cannot delete the only game. Create a new game first.');
                return;
            }

            if (confirm('Are you sure you want to delete this game? This cannot be undone.')) {
                const appState = DataModel.getAppState();
                const isCurrentGame = appState.currentGameId === gameId;

                // If deleting current game, load most recent other game
                if (isCurrentGame) {
                    const otherGames = gameList.filter(g => g.gameId !== gameId);
                    if (otherGames.length > 0) {
                        // Load most recently modified game
                        const mostRecent = otherGames.sort((a, b) => b.lastModified - a.lastModified)[0];
                        GameManager.loadGame(mostRecent.gameId);
                    }
                }

                // Delete the game
                Storage.deleteGame(gameId);
                this.renderGameList();
            }
        }
    };
})();
