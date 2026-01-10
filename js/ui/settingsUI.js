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
                        <button class="btn-primary" onclick="SettingsUI.close()" style="display: flex; align-items: center; gap: 0.5rem;">
                            autosaved <i data-lucide="x"></i>
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

                        <!-- Import Roster -->
                        <div class="settings-section">
                            <label>Import Roster from MaxPreps</label>
                            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <input type="text" id="maxpreps-url"
                                    value="https://www.maxpreps.com/ca/san-diego/canyon-crest-academy-ravens/basketball/girls/roster/"
                                    placeholder="MaxPreps roster URL"
                                    style="flex: 1; font-size: 0.8rem;">
                                <button class="btn-primary" onclick="SettingsUI.fetchRosterFromUrl()" style="white-space: nowrap;">
                                    Fetch Roster
                                </button>
                            </div>
                            <p style="font-size: 0.75rem; color: #666; margin: 0;">
                                Enter a MaxPreps roster URL and click Fetch, or <a href="#" onclick="SettingsUI.showImportRosterModal(); return false;">paste manually</a>.
                            </p>
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

                        <!-- Bottom Save Button -->
                        <div class="settings-section" style="text-align: right; margin-top: 1.5rem;">
                            <button class="btn-primary" onclick="SettingsUI.close()" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                                autosaved <i data-lucide="x"></i>
                            </button>
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
                // Check if player has any events in current game
                const playerHasEvents = game.gameEvents.some(event =>
                    event.eventStatus === 'active' && event.playerNumber === jerseyNumber
                );

                if (playerHasEvents) {
                    // Prevent deselection if player has events
                    const playerName = game.playerNames[jerseyNumber] || `Player ${jerseyNumber}`;
                    alert(`Cannot remove ${playerName} (#${jerseyNumber}) - this player has recorded events in the current game.`);
                    return;
                }

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
        },

        /**
         * Fetch roster directly from MaxPreps URL using CORS proxy
         */
        async fetchRosterFromUrl() {
            const urlInput = document.getElementById('maxpreps-url');
            if (!urlInput || !urlInput.value.trim()) {
                alert('Please enter a MaxPreps roster URL');
                return;
            }

            const url = urlInput.value.trim();
            if (!url.includes('maxpreps.com')) {
                alert('Please enter a valid MaxPreps URL');
                return;
            }

            // Show loading state
            const fetchBtn = document.querySelector('button[onclick="SettingsUI.fetchRosterFromUrl()"]');
            const originalText = fetchBtn.textContent;
            fetchBtn.textContent = 'Fetching...';
            fetchBtn.disabled = true;

            try {
                // Use corsproxy.io to bypass CORS
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl);

                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.status}`);
                }

                const html = await response.text();
                const players = this.parseMaxPrepsHtml(html);

                if (players.length === 0) {
                    alert('No players found. The page format may have changed.');
                    return;
                }

                // Import the players
                this.importParsedPlayers(players);

            } catch (error) {
                console.error('Fetch error:', error);
                alert(`Failed to fetch roster: ${error.message}\n\nTry the manual paste option instead.`);
            } finally {
                fetchBtn.textContent = originalText;
                fetchBtn.disabled = false;
            }
        },

        /**
         * Parse MaxPreps HTML to extract roster
         * MaxPreps format: "FIRSTNAME","LASTNAME",gradeCode,"jerseyNumber"
         */
        parseMaxPrepsHtml(html) {
            const players = [];

            // MaxPreps format: "FIRSTNAME","LASTNAME",gradeCode,"JERSEY"
            // Example: "DISHA","RAMACHANDRON",10,"1",null,...
            const athletePattern = /"([A-Z][A-Z]+)","([A-Z][A-Z]+)",\d+,"(\d{1,2})"/g;

            let match;
            while ((match = athletePattern.exec(html)) !== null) {
                const firstNameUpper = match[1];
                const jersey = parseInt(match[3]);

                if (jersey >= 0 && jersey < 100 && firstNameUpper.length > 1) {
                    // Convert to title case (DISHA -> Disha)
                    const name = firstNameUpper.charAt(0) + firstNameUpper.slice(1).toLowerCase();
                    if (!players.some(p => p.jersey === jersey)) {
                        players.push({ jersey, name });
                    }
                }
            }

            return players.sort((a, b) => a.jersey - b.jersey);
        },

        /**
         * Import parsed players into the game
         */
        importParsedPlayers(players) {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            // Confirm import
            let confirmMsg = `Import ${players.length} players?\n\n`;
            confirmMsg += players.map(p => `#${p.jersey} ${p.name}`).join('\n');

            if (!confirm(confirmMsg)) {
                return;
            }

            // Keep players with events
            const playersWithEvents = game.teamRoster.filter(jersey =>
                game.gameEvents.some(e => e.eventStatus === 'active' && e.playerNumber === jersey)
            );

            // Start fresh with players who have events
            game.teamRoster = [...playersWithEvents];

            // Add imported players
            for (const player of players) {
                if (!game.teamRoster.includes(player.jersey)) {
                    game.teamRoster.push(player.jersey);
                }
                game.playerNames[player.jersey] = player.name;
            }

            // Sort roster
            game.teamRoster.sort((a, b) => a - b);

            // Re-render settings
            this.renderJerseyGrid();
            this.renderPlayerNames();

            // Save
            Storage.saveGame(game);

            alert(`Successfully imported ${players.length} players!`);
        },

        /**
         * Show import roster modal
         */
        showImportRosterModal() {
            const modal = document.createElement('div');
            modal.id = 'import-roster-modal';
            modal.className = 'modal-overlay';
            modal.style.zIndex = '2000';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Import Roster</h2>
                        <button class="icon-btn close-btn" onclick="SettingsUI.closeImportRosterModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 1rem; font-size: 0.9rem;">
                            <strong>Instructions:</strong><br>
                            1. Go to the MaxPreps roster page<br>
                            2. Select and copy the roster table (Ctrl+A, Ctrl+C)<br>
                            3. Paste below (Ctrl+V)
                        </p>
                        <textarea id="roster-paste-area"
                            placeholder="Paste roster data here...&#10;&#10;Example format:&#10;1	Disha Ramachandron	So.&#10;4	Ela Gulec	So.&#10;5	Deethya Pottu	Sr."
                            style="width: 100%; height: 200px; font-family: monospace; font-size: 0.85rem; padding: 0.5rem;"
                        ></textarea>
                        <p id="roster-parse-status" style="margin-top: 0.5rem; font-size: 0.85rem; color: #666;"></p>
                    </div>
                    <div class="modal-footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button onclick="SettingsUI.closeImportRosterModal()" class="btn-secondary">Cancel</button>
                        <button onclick="SettingsUI.parseAndImportRoster()" class="btn-primary">Import</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }

            // Add paste event listener to show preview
            document.getElementById('roster-paste-area').addEventListener('input', () => {
                this.previewRosterParse();
            });
        },

        /**
         * Close import roster modal
         */
        closeImportRosterModal() {
            const modal = document.getElementById('import-roster-modal');
            if (modal) {
                modal.remove();
            }
        },

        /**
         * Preview roster parse
         */
        previewRosterParse() {
            const textarea = document.getElementById('roster-paste-area');
            const status = document.getElementById('roster-parse-status');
            if (!textarea || !status) return;

            const parsed = this.parseRosterData(textarea.value);
            if (parsed.length === 0) {
                status.textContent = 'No players detected. Make sure to paste the roster table.';
                status.style.color = '#666';
            } else {
                status.textContent = `Found ${parsed.length} players: ${parsed.map(p => '#' + p.jersey).join(', ')}`;
                status.style.color = '#4CAF50';
            }
        },

        /**
         * Parse roster data from pasted text
         * Handles MaxPreps format and various tab/comma separated formats
         */
        parseRosterData(text) {
            const players = [];
            const lines = text.split('\n').filter(line => line.trim());

            for (const line of lines) {
                // Split by tab or multiple spaces
                const parts = line.split(/\t+|\s{2,}/).map(p => p.trim()).filter(p => p);

                if (parts.length >= 2) {
                    // Try to find jersey number (first number in the line)
                    let jersey = null;
                    let name = null;

                    // Check if first part is a number (jersey)
                    if (/^\d+$/.test(parts[0])) {
                        jersey = parseInt(parts[0]);
                        name = parts[1];
                    } else {
                        // Try to extract number from anywhere in first part
                        const numMatch = parts[0].match(/^(\d+)/);
                        if (numMatch) {
                            jersey = parseInt(numMatch[1]);
                            // Name might be rest of first part or second part
                            const restOfFirst = parts[0].replace(/^\d+\s*/, '').trim();
                            name = restOfFirst || parts[1];
                        }
                    }

                    if (jersey !== null && jersey >= 0 && jersey < 100 && name) {
                        // Clean up name (remove trailing grade like "So.", "Jr.", "Sr.", "Fr.")
                        name = name.replace(/\s+(So\.|Jr\.|Sr\.|Fr\.|Soph\.|Fresh\.|Senior|Junior|Sophomore|Freshman)\.?$/i, '').trim();
                        players.push({ jersey, name });
                    }
                }
            }

            return players;
        },

        /**
         * Parse and import roster
         */
        parseAndImportRoster() {
            const textarea = document.getElementById('roster-paste-area');
            if (!textarea) return;

            const parsed = this.parseRosterData(textarea.value);

            if (parsed.length === 0) {
                alert('No valid roster data found. Please paste the roster table from MaxPreps.');
                return;
            }

            const game = DataModel.getCurrentGame();
            if (!game) return;

            // Check for conflicts with existing players who have events
            const conflicts = [];
            for (const player of parsed) {
                if (game.teamRoster.includes(player.jersey)) {
                    const hasEvents = game.gameEvents.some(e =>
                        e.eventStatus === 'active' && e.playerNumber === player.jersey
                    );
                    if (hasEvents) {
                        const existingName = game.playerNames[player.jersey] || `Player ${player.jersey}`;
                        if (existingName !== player.name) {
                            conflicts.push(`#${player.jersey}: "${existingName}" → "${player.name}"`);
                        }
                    }
                }
            }

            // Confirm import
            let confirmMsg = `Import ${parsed.length} players?\n\n`;
            confirmMsg += parsed.map(p => `#${p.jersey} ${p.name}`).join('\n');

            if (conflicts.length > 0) {
                confirmMsg += `\n\nNote: The following players have events and their names will be updated:\n`;
                confirmMsg += conflicts.join('\n');
            }

            if (!confirm(confirmMsg)) {
                return;
            }

            // Clear existing roster (except players with events)
            const playersWithEvents = game.teamRoster.filter(jersey =>
                game.gameEvents.some(e => e.eventStatus === 'active' && e.playerNumber === jersey)
            );

            // Start fresh with players who have events
            game.teamRoster = [...playersWithEvents];

            // Add imported players
            for (const player of parsed) {
                if (!game.teamRoster.includes(player.jersey)) {
                    game.teamRoster.push(player.jersey);
                }
                game.playerNames[player.jersey] = player.name;
            }

            // Sort roster
            game.teamRoster.sort((a, b) => a - b);

            // Close import modal
            this.closeImportRosterModal();

            // Re-render settings
            this.renderJerseyGrid();
            this.renderPlayerNames();

            // Save
            Storage.saveGame(game);

            alert(`Successfully imported ${parsed.length} players!`);
        }
    };
})();
