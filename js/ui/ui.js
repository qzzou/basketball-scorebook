// Simplified UI Module - MVP implementation
// This combines multiple UI modules into one for initial working prototype

const UI = (() => {
    return {
        /**
         * Initialize all UI components
         */
        init() {
            this.setupEventListeners();
            this.render();
        },

        /**
         * Setup event listeners for reactive updates
         */
        setupEventListeners() {
            EventBus.on('game:loaded', () => this.render());
            EventBus.on('event:added', () => this.render());
            EventBus.on('event:edited', () => this.render());
            EventBus.on('event:deleted', () => this.render());
            EventBus.on('event:undone', () => this.render());
            EventBus.on('event:redone', () => this.render());
            EventBus.on('stats:updated', () => this.renderStats());
            EventBus.on('mode:changed', () => this.render());
        },

        /**
         * Render all UI sections
         */
        render() {
            this.renderHeader();
            this.renderShotMapSection();
            this.renderActionLog();
            this.renderSummary();
            this.renderCanvas();
        },

        /**
         * Render header
         */
        renderHeader() {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            const header = document.getElementById('game-name');
            if (header) {
                header.textContent = game.gameName;
            }
        },

        /**
         * Render shot map section (jersey row, stat row, action column)
         */
        renderShotMapSection() {
            const game = DataModel.getCurrentGame();
            const appState = DataModel.getAppState();
            if (!game) return;

            // Render jersey buttons
            this.renderJerseyRow();

            // Render stat row based on mode
            if (appState.currentMode === 'edit') {
                if (appState.selectedJersey) {
                    this.renderStatRow(appState.selectedJersey);
                } else {
                    document.getElementById('stat-row').innerHTML = '<p>Select a player</p>';
                }
            } else {
                // View mode - show combined stats
                this.renderViewModeStats();
            }

            // Update undo/redo and select buttons
            document.getElementById('undo-btn').disabled = !EventManager.canUndo();
            document.getElementById('redo-btn').disabled = !EventManager.canRedo();

            // Update select button visibility
            const selectBtn = document.getElementById('select-btn');
            if (selectBtn) {
                selectBtn.style.display = appState.currentMode === 'view' ? 'flex' : 'none';
            }
        },

        /**
         * Render jersey row
         */
        renderJerseyRow() {
            const game = DataModel.getCurrentGame();
            const appState = DataModel.getAppState();
            if (!game) return;

            const container = document.getElementById('jersey-row');
            if (!container) return;

            container.innerHTML = '';

            game.teamRoster.forEach(jerseyNumber => {
                const btn = document.createElement('button');
                btn.textContent = jerseyNumber;
                btn.className = 'jersey-btn';

                // Edit mode - single selection
                if (appState.currentMode === 'edit') {
                    if (appState.selectedJersey === jerseyNumber) {
                        btn.classList.add('selected');
                    }
                    btn.onclick = () => this.handleJerseyClick(jerseyNumber);
                }
                // View mode - multiple selection
                else {
                    if (appState.selectedJerseys.includes(jerseyNumber)) {
                        btn.classList.add('selected');
                    }
                    btn.onclick = () => this.handleJerseyToggle(jerseyNumber);
                }

                container.appendChild(btn);
            });
        },

        /**
         * Handle jersey click (edit mode)
         */
        handleJerseyClick(jerseyNumber) {
            const appState = DataModel.getAppState();
            appState.selectedJersey = jerseyNumber;

            // Load player's foul status
            const statsCache = DataModel.getPlayerStatsCache();
            const playerStats = statsCache[jerseyNumber];

            this.render();
        },

        /**
         * Handle jersey toggle (view mode)
         */
        handleJerseyToggle(jerseyNumber) {
            const appState = DataModel.getAppState();
            const index = appState.selectedJerseys.indexOf(jerseyNumber);

            if (index >= 0) {
                appState.selectedJerseys.splice(index, 1);
            } else {
                appState.selectedJerseys.push(jerseyNumber);
            }

            this.render();
        },

        /**
         * Handle select all/clear all in view mode
         */
        handleSelectToggle() {
            const game = DataModel.getCurrentGame();
            const appState = DataModel.getAppState();

            if (appState.selectedJerseys.length === game.teamRoster.length) {
                // Clear all
                appState.selectedJerseys = [];
            } else {
                // Select all
                appState.selectedJerseys = [...game.teamRoster];
            }

            this.render();
        },

        /**
         * Render view mode stats (combined for selected players)
         */
        renderViewModeStats() {
            const game = DataModel.getCurrentGame();
            const appState = DataModel.getAppState();
            const container = document.getElementById('stat-row');
            if (!container) return;

            if (appState.selectedJerseys.length === 0) {
                container.innerHTML = '<p>No players selected. Click jerseys to filter.</p>';
                return;
            }

            // Calculate combined stats
            const stats = StatCalculator.calculateCombinedStats(
                appState.selectedJerseys,
                game.gameEvents
            );

            const playerCount = appState.selectedJerseys.length;
            const title = playerCount === game.teamRoster.length
                ? 'All Players'
                : `${playerCount} Player${playerCount > 1 ? 's' : ''} Selected`;

            container.innerHTML = `
                <div class="view-mode-header">
                    <h3>${title}</h3>
                </div>
                <div class="stats-display">
                    <div class="stat"><div class="value">${stats.PTS || 0}</div><div class="label">PTS</div></div>
                    <div class="stat"><div class="value">${Formatters.formatFT(stats.FT || {made:0, attempts:0})}</div><div class="label">FT</div></div>
                    <div class="stat"><div class="value">${Formatters.formatFG(stats.FG || {made:0, attempts:0})}</div><div class="label">FG</div></div>
                    <div class="stat"><div class="value">${Formatters.format3PT(stats['3PT'] || {made:0, attempts:0})}</div><div class="label">3PT</div></div>
                    <div class="stat"><div class="value">${stats.REB || 0}</div><div class="label">REB</div></div>
                    <div class="stat"><div class="value">${stats.AST || 0}</div><div class="label">AST</div></div>
                    <div class="stat"><div class="value">${stats.STL || 0}</div><div class="label">STL</div></div>
                    <div class="stat"><div class="value">${stats.BLK || 0}</div><div class="label">BLK</div></div>
                    <div class="stat"><div class="value">${stats.TO || 0}</div><div class="label">TO</div></div>
                    <div class="stat"><div class="value">${stats.FOULS?.total || 0}</div><div class="label">FOULS</div></div>
                </div>
            `;
        },

        /**
         * Render stat row for selected player
         */
        renderStatRow(jerseyNumber) {
            const statsCache = DataModel.getPlayerStatsCache();
            const stats = statsCache[jerseyNumber] || {};

            const container = document.getElementById('stat-row');
            if (!container) return;

            container.innerHTML = `
                <div class="foul-buttons">
                    <button onclick="UI.handleFoulToggle('P1')" class="${stats.FOULS?.activeFouls?.P1 ? 'active' : ''}">P1</button>
                    <button onclick="UI.handleFoulToggle('P2')" class="${stats.FOULS?.activeFouls?.P2 ? 'active' : ''}">P2</button>
                    <button onclick="UI.handleFoulToggle('P3')" class="${stats.FOULS?.activeFouls?.P3 ? 'active' : ''}">P3</button>
                    <button onclick="UI.handleFoulToggle('P4')" class="${stats.FOULS?.activeFouls?.P4 ? 'active' : ''}">P4</button>
                    <button onclick="UI.handleFoulToggle('P5')" class="${stats.FOULS?.activeFouls?.P5 ? 'active' : ''}">P5</button>
                    <button onclick="UI.handleFoulToggle('T1')" class="${stats.FOULS?.activeFouls?.T1 ? 'active' : ''}">T1</button>
                    <button onclick="UI.handleFoulToggle('T2')" class="${stats.FOULS?.activeFouls?.T2 ? 'active' : ''}">T2</button>
                </div>
                <div class="stats-display">
                    <div class="stat"><div class="value">${stats.PTS || 0}</div><div class="label">PTS</div></div>
                    <div class="stat"><div class="value">${Formatters.formatFT(stats.FT || {made:0, attempts:0})}</div><div class="label">FT</div></div>
                    <div class="stat"><div class="value">${Formatters.formatFG(stats.FG || {made:0, attempts:0})}</div><div class="label">FG</div></div>
                    <div class="stat"><div class="value">${Formatters.format3PT(stats['3PT'] || {made:0, attempts:0})}</div><div class="label">3PT</div></div>
                    <div class="stat"><div class="value">${stats.REB || 0}</div><div class="label">REB</div></div>
                    <div class="stat"><div class="value">${stats.AST || 0}</div><div class="label">AST</div></div>
                    <div class="stat"><div class="value">${stats.STL || 0}</div><div class="label">STL</div></div>
                    <div class="stat"><div class="value">${stats.BLK || 0}</div><div class="label">BLK</div></div>
                    <div class="stat"><div class="value">${stats.TO || 0}</div><div class="label">TO</div></div>
                </div>
                <div class="action-buttons">
                    <button onclick="UI.handleShotButton(1, true)">+1</button>
                    <button onclick="UI.handleShotButton(2, true)">+2</button>
                    <button onclick="UI.handleShotButton(3, true)">+3</button>
                    <button onclick="UI.handleShotButton(1, false)">Miss 1</button>
                    <button onclick="UI.handleShotButton(2, false)">Miss 2</button>
                    <button onclick="UI.handleShotButton(3, false)">Miss 3</button>
                    <button onclick="UI.handleStatButton('REB')">+REB</button>
                    <button onclick="UI.handleStatButton('AST')">+AST</button>
                    <button onclick="UI.handleStatButton('STL')">+STL</button>
                    <button onclick="UI.handleStatButton('BLK')">+BLK</button>
                    <button onclick="UI.handleStatButton('TO')">+TO</button>
                </div>
            `;
        },

        /**
         * Handle foul toggle - CORRECTED LOGIC
         */
        handleFoulToggle(foulType) {
            const appState = DataModel.getAppState();
            const jerseyNumber = appState.selectedJersey;
            if (!jerseyNumber) return;

            const statsCache = DataModel.getPlayerStatsCache();
            const playerStats = statsCache[jerseyNumber] || {};
            const activeFouls = playerStats.FOULS?.activeFouls || {};

            // Toggle the foul button
            activeFouls[foulType] = !activeFouls[foulType];

            // Immediately update foul events
            EventManager.updatePlayerFouls(jerseyNumber, activeFouls);

            // Stats will be recalculated automatically via event bus
        },

        /**
         * Handle shot button
         */
        handleShotButton(points, made) {
            const appState = DataModel.getAppState();
            const jerseyNumber = appState.selectedJersey;
            if (!jerseyNumber) return;

            const shotType = points === 1 ? 'FT' : points === 3 ? '3PT' : 'FG';

            // Set selected shot type for canvas interaction
            appState.selectedShotType = made ? `+${points}` : `miss${points}`;

            // Add shot event without location (button click)
            EventManager.addEvent(jerseyNumber, 'shot', {
                shotData: {
                    made,
                    shotType,
                    location: null
                }
            });
        },

        /**
         * Handle stat button
         */
        handleStatButton(statType) {
            const appState = DataModel.getAppState();
            const jerseyNumber = appState.selectedJersey;
            if (!jerseyNumber) return;

            EventManager.addEvent(jerseyNumber, 'stat', {
                statData: { type: statType }
            });
        },

        /**
         * Render action log
         */
        renderActionLog() {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            const container = document.getElementById('action-log');
            if (!container) return;

            const activeEvents = EventManager.getActiveEvents();
            const recentEvents = activeEvents.slice(-30).reverse();

            container.innerHTML = recentEvents.map(event => {
                const playerName = game.playerNames[event.playerNumber] || `#${event.playerNumber}`;
                const sentence = Formatters.formatEventToSentence(event, playerName);
                const className = event.edited ? 'edited' : '';
                return `<div class="action-item ${className}" onclick="UI.handleActionClick(${event.eventIndex})">${sentence}</div>`;
            }).join('');
        },

        /**
         * Handle action click - open correction modal
         */
        handleActionClick(eventIndex) {
            ActionCorrectionUI.show(eventIndex);
        },

        /**
         * Render stats summary
         */
        renderStats() {
            this.renderSummary();
        },

        /**
         * Render summary table
         */
        renderSummary() {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            const container = document.getElementById('summary-table');
            if (!container) return;

            const allStats = StatCalculator.calculateAllPlayerStats(
                game.teamRoster,
                game.gameEvents,
                game.playerNames
            );

            const teamStats = StatCalculator.calculateTeamStats(game.gameEvents, game.teamRoster);

            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>PTS</th>
                            <th>FT</th>
                            <th>FG</th>
                            <th>3PT</th>
                            <th>REB</th>
                            <th>AST</th>
                            <th>STL</th>
                            <th>BLK</th>
                            <th>TO</th>
                            <th>FLS</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            allStats.forEach(player => {
                html += `
                    <tr>
                        <td>${player.jerseyNumber}</td>
                        <td>${player.name}</td>
                        <td>${player.PTS}</td>
                        <td>${Formatters.formatFT(player.FT)}</td>
                        <td>${Formatters.formatFG(player.FG)}</td>
                        <td>${Formatters.format3PT(player['3PT'])}</td>
                        <td>${player.REB}</td>
                        <td>${player.AST}</td>
                        <td>${player.STL}</td>
                        <td>${player.BLK}</td>
                        <td>${player.TO}</td>
                        <td>${player.FOULS.total}</td>
                    </tr>
                `;
            });

            // Team total row
            html += `
                    <tr class="team-total">
                        <td colspan="2">TEAM TOTAL</td>
                        <td>${teamStats.PTS}</td>
                        <td>${Formatters.formatFT(teamStats.FT)}</td>
                        <td>${Formatters.formatFG(teamStats.FG)}</td>
                        <td>${Formatters.format3PT(teamStats['3PT'])}</td>
                        <td>${teamStats.REB}</td>
                        <td>${teamStats.AST}</td>
                        <td>${teamStats.STL}</td>
                        <td>${teamStats.BLK}</td>
                        <td>${teamStats.TO}</td>
                        <td>${teamStats.FOULS.total}</td>
                    </tr>
                </tbody>
            </table>
            `;

            container.innerHTML = html;
        },

        /**
         * Render canvas
         */
        renderCanvas() {
            const canvasData = CourtRenderer.initializeShotsMapCanvas();
            if (canvasData) {
                ShotRenderer.drawShots(canvasData.ctx, canvasData.canvasWidth, canvasData.canvasHeight);

                // Setup canvas interactions
                CanvasInteraction.setupCanvasInteractions(
                    canvasData.canvas,
                    (normalizedX, normalizedY) => this.handleLongPress(normalizedX, normalizedY),
                    (x, y) => this.handleTap(x, y)
                );
            }
        },

        /**
         * Handle long press on canvas
         */
        handleLongPress(normalizedX, normalizedY) {
            const appState = DataModel.getAppState();
            const jerseyNumber = appState.selectedJersey;
            const selectedShotType = appState.selectedShotType;

            if (!jerseyNumber || !selectedShotType) {
                alert('Please select a player and shot type first');
                return;
            }

            // Parse shot type
            const made = selectedShotType.startsWith('+');
            const points = parseInt(selectedShotType.match(/\d+/)[0]);
            const shotType = points === 1 ? 'FT' : points === 3 ? '3PT' : 'FG';

            // Add shot event with location
            EventManager.addEvent(jerseyNumber, 'shot', {
                shotData: {
                    made,
                    shotType,
                    location: { x: normalizedX, y: normalizedY }
                }
            });

            // Clear selected shot type
            appState.selectedShotType = null;
        },

        /**
         * Handle tap on canvas
         */
        handleTap(x, y) {
            // TODO: Show player info for shot at this location
            console.log('Tap at', x, y);
        }
    };
})();
