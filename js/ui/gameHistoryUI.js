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
         * Show game history as a tab (inline content, not modal)
         */
        showAsTab() {
            // Create history tab container
            let container = document.getElementById('history-tab-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'history-tab-container';
                container.className = 'tab-overlay';
                document.body.insertBefore(container, document.querySelector('.tab-bar'));
            }

            container.innerHTML = `
                <div class="history-tab-content" style="padding: 1rem; padding-bottom: 80px;">
                    <h2 style="color: #667eea; margin-bottom: 1rem;">Game History</h2>

                    <!-- Game Actions -->
                    <div class="my-stats-card" style="margin-bottom: 1rem;">
                        <div style="display: flex; gap: 0.5rem;">
                            <button id="new-game-btn" class="btn-primary" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.25rem;" onclick="GameHistoryUI.handleNewGame()">
                                <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i> New
                            </button>
                            <button id="clear-game-btn" class="btn-danger" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.25rem;" onclick="GameHistoryUI.handleClearGame()">
                                <i data-lucide="eraser" style="width: 16px; height: 16px;"></i> Clear
                            </button>
                        </div>
                    </div>

                    <div id="game-list" class="game-list"></div>
                    <p style="font-size: 0.75rem; color: #999; text-align: center; margin-top: 1rem;">Tap to load, long press to delete</p>
                </div>
            `;

            // Render game list
            this.renderGameList();

            // Initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
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

            // Sort by lastModified descending (newest first)
            validGames.sort((a, b) => b.lastModified - a.lastModified);

            container.innerHTML = validGames.map(game => {
                const date = new Date(game.timestamp);
                const currentGameId = DataModel.getAppState().currentGameId;
                const isCurrent = game.gameId === currentGameId;

                return `
                    <div class="game-card ${isCurrent ? 'current' : ''}"
                        data-game-id="${game.gameId}"
                        style="cursor: pointer; padding: 0.75rem 1rem;"
                    >
                        <div class="game-info">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-size: 1.3rem; font-weight: 600;">${game.teamName} - ${game.totalPoints} pts</div>
                                <div style="font-size: 1.1rem; color: #666;">${game.gameName}</div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;">
                                <div style="font-size: 0.8rem; color: #999;">${Formatters.formatDateTime(date)}</div>
                                ${isCurrent ? '<span class="current-badge" style="font-size: 0.7rem; padding: 2px 6px;">Current</span>' : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }

            // Add tap and long-press handlers to game cards
            this.setupGameCardHandlers();
        },

        /**
         * Setup tap and long-press handlers for game cards
         */
        setupGameCardHandlers() {
            const gameCards = document.querySelectorAll('.game-card[data-game-id]');

            gameCards.forEach(card => {
                const gameId = card.dataset.gameId;
                let pressTimer = null;
                let isLongPress = false;

                const startPress = (e) => {
                    isLongPress = false;
                    pressTimer = setTimeout(() => {
                        isLongPress = true;
                        // Long press - delete
                        this.deleteGame(gameId);
                    }, 600); // 600ms for long press
                };

                const endPress = (e) => {
                    clearTimeout(pressTimer);
                    if (!isLongPress) {
                        // Short tap - load game
                        this.loadGame(gameId);
                    }
                };

                const cancelPress = () => {
                    clearTimeout(pressTimer);
                };

                // Touch events
                card.addEventListener('touchstart', startPress);
                card.addEventListener('touchend', endPress);
                card.addEventListener('touchcancel', cancelPress);
                card.addEventListener('touchmove', cancelPress);

                // Mouse events (for desktop)
                card.addEventListener('mousedown', startPress);
                card.addEventListener('mouseup', endPress);
                card.addEventListener('mouseleave', cancelPress);
            });
        },

        /**
         * Load a game
         */
        loadGame(gameId) {
            const appState = DataModel.getAppState();
            if (appState.currentGameId === gameId) {
                // Already the current game, do nothing
                return;
            }

            // Load game (automatically saves current game first)
            GameManager.loadGame(gameId);

            // Re-render the game list to show updated current badge
            this.renderGameList();
        },

        /**
         * Export a game
         */
        exportGame(gameId) {
            Storage.exportGameAsJSON(gameId);
        },

        /**
         * Handle new game button
         */
        handleNewGame() {
            if (confirm('Create a new game? Current game will be saved.')) {
                GameManager.createNewGame(true); // Keep roster
                this.renderGameList();
            }
        },

        /**
         * Handle clear game button
         */
        handleClearGame() {
            if (confirm('Clear all events for this game? This cannot be undone.')) {
                GameManager.clearCurrentGame();
                this.renderGameList();
            }
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
