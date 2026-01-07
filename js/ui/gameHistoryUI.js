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

            if (gameList.length === 0) {
                container.innerHTML = '<p class="empty-message">No saved games yet.</p>';
                return;
            }

            container.innerHTML = gameList.map(game => {
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
                            ${!isCurrent ? `
                                <button
                                    onclick="GameHistoryUI.loadGame('${game.gameId}')"
                                    class="btn-secondary"
                                    title="Load this game"
                                >
                                    <i data-lucide="folder-open"></i> Load
                                </button>
                            ` : ''}
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
                                ${isCurrent ? 'disabled' : ''}
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
            if (confirm('Load this game? Current game will be saved.')) {
                GameManager.loadGame(gameId);
                this.close();
                UI.render();
            }
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
            if (confirm('Are you sure you want to delete this game? This cannot be undone.')) {
                GameManager.deleteGame(gameId);
                this.renderGameList();
            }
        }
    };
})();
