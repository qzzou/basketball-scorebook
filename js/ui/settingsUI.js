// Settings UI - Full settings interface with jersey grid and player names

const SettingsUI = (() => {
    return {
        /**
         * Show settings modal
         */
        show() {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.id = 'settings-overlay';
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-content settings-modal">
                    <div class="modal-header">
                        <h2>Settings</h2>
                        <button class="icon-btn close-btn" onclick="SettingsUI.close()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <!-- Game Info -->
                        <div class="settings-section">
                            <label>Game Name</label>
                            <input type="text" id="settings-game-name" value="${game.gameName}" placeholder="Game name">
                        </div>

                        <div class="settings-section">
                            <label>Team Name</label>
                            <input type="text" id="settings-team-name" value="${game.teamName}" placeholder="Team name">
                        </div>

                        <!-- Jersey Selection -->
                        <div class="settings-section">
                            <label>Team Roster (Select Jersey Numbers)</label>
                            <div id="jersey-grid" class="jersey-grid"></div>
                        </div>

                        <!-- Player Names -->
                        <div class="settings-section">
                            <label>Player Names</label>
                            <div id="player-names-section" class="player-names-section"></div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Initialize components
            this.renderJerseyGrid();
            this.renderPlayerNames();

            // Initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }

            // Add event listeners
            document.getElementById('jersey-grid').addEventListener('click', (e) => {
                if (e.target.classList.contains('jersey-grid-btn')) {
                    this.handleJerseyToggle(parseInt(e.target.dataset.jersey));
                }
            });

            document.getElementById('settings-game-name').addEventListener('input', () => {
                this.renderPlayerNames();
            });

            document.getElementById('settings-team-name').addEventListener('input', () => {
                this.renderPlayerNames();
            });
        },

        /**
         * Close settings modal (auto-saves changes)
         */
        close() {
            const overlay = document.getElementById('settings-overlay');
            if (overlay) {
                // Auto-save changes before closing
                this.save();
                overlay.remove();
            }
        },

        /**
         * Render jersey grid (10x10)
         */
        renderJerseyGrid() {
            const game = DataModel.getCurrentGame();
            const container = document.getElementById('jersey-grid');
            if (!container) return;

            container.innerHTML = '';

            for (let i = 0; i < 100; i++) {
                const btn = document.createElement('button');
                btn.className = 'jersey-grid-btn';
                btn.dataset.jersey = i;
                btn.textContent = i;

                if (game.teamRoster.includes(i)) {
                    btn.classList.add('selected');
                }

                container.appendChild(btn);
            }
        },

        /**
         * Handle jersey toggle
         */
        handleJerseyToggle(jerseyNumber) {
            const game = DataModel.getCurrentGame();
            const index = game.teamRoster.indexOf(jerseyNumber);

            if (index >= 0) {
                // Remove from roster
                game.teamRoster.splice(index, 1);
                // Remove player name when jersey is removed
                delete game.playerNames[jerseyNumber];
            } else {
                // Add to roster
                game.teamRoster.push(jerseyNumber);
                // Set default player name if not exists
                if (!game.playerNames[jerseyNumber]) {
                    game.playerNames[jerseyNumber] = `Player ${jerseyNumber}`;
                }
            }

            // Sort roster
            game.teamRoster.sort((a, b) => a - b);

            // Re-render
            this.renderJerseyGrid();
            this.renderPlayerNames();
        },

        /**
         * Render player names section
         */
        renderPlayerNames() {
            const game = DataModel.getCurrentGame();
            const container = document.getElementById('player-names-section');
            if (!container) return;

            if (game.teamRoster.length === 0) {
                container.innerHTML = '<p class="empty-message">No players selected. Use the grid above to select jersey numbers.</p>';
                return;
            }

            container.innerHTML = game.teamRoster.map(jerseyNumber => `
                <div class="player-name-row">
                    <span class="jersey-number">#${jerseyNumber}</span>
                    <input
                        type="text"
                        class="player-name-input"
                        data-jersey="${jerseyNumber}"
                        value="${game.playerNames[jerseyNumber] || `Player ${jerseyNumber}`}"
                        placeholder="Player name"
                        onchange="SettingsUI.handlePlayerNameChange(${jerseyNumber}, this.value)"
                    >
                </div>
            `).join('');
        },

        /**
         * Handle player name change
         */
        handlePlayerNameChange(jerseyNumber, name) {
            const game = DataModel.getCurrentGame();
            game.playerNames[jerseyNumber] = name || `Player ${jerseyNumber}`;
        },

        /**
         * Save settings
         */
        save() {
            const game = DataModel.getCurrentGame();
            const gameNameInput = document.getElementById('settings-game-name');
            const teamNameInput = document.getElementById('settings-team-name');

            // Only proceed if modal is still open
            if (!gameNameInput || !teamNameInput) return;

            // Update game name
            const gameName = gameNameInput.value;
            if (gameName && gameName !== game.gameName) {
                GameManager.updateGameName(gameName);
            }

            // Update team name
            const teamName = teamNameInput.value;
            if (teamName && teamName !== game.teamName) {
                GameManager.updateTeamName(teamName);
            }

            // Update roster (already updated in real-time)
            GameManager.updateTeamRoster(game.teamRoster);

            // Update player names (already updated in real-time)
            // Just trigger a save
            Storage.saveGame(game);

            // Re-render UI
            UI.render();
        },

        /**
         * Show game history
         */
        showGameHistory() {
            this.close();
            GameHistoryUI.show();
        },

        /**
         * Handle new game
         */
        handleNewGame() {
            if (confirm('Create a new game? Current game will be saved.')) {
                GameManager.createNewGame(true); // Keep roster
                this.close();
                UI.render();
            }
        },

        /**
         * Handle export
         */
        handleExport() {
            GameManager.exportCurrentGame();
        },

        /**
         * Handle import
         */
        handleImport() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    GameManager.importGame(file);
                }
            };
            input.click();
        }
    };
})();
