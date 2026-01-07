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
                if (appState.selectedJersey !== null) {
                    this.renderStatRow(appState.selectedJersey);
                } else {
                    document.getElementById('stat-row').innerHTML = '<p>Select a player to begin</p>';
                }
            } else {
                // View mode - show combined stats
                this.renderViewModeStats();
            }

            // Update undo/redo buttons - hide in view mode, enable/disable in edit mode
            const undoBtn = document.getElementById('undo-btn');
            const redoBtn = document.getElementById('redo-btn');
            if (appState.currentMode === 'view') {
                if (undoBtn) undoBtn.style.display = 'none';
                if (redoBtn) redoBtn.style.display = 'none';
            } else {
                if (undoBtn) {
                    undoBtn.style.display = 'inline-flex';
                    undoBtn.disabled = !EventManager.canUndo();
                }
                if (redoBtn) {
                    redoBtn.style.display = 'inline-flex';
                    redoBtn.disabled = !EventManager.canRedo();
                }
            }

            // Update select button visibility (only show in view mode)
            const selectBtn = document.getElementById('select-btn');
            if (selectBtn) {
                selectBtn.style.display = appState.currentMode === 'view' ? 'inline-flex' : 'none';
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

            // Toggle selection - allow deselecting
            if (appState.selectedJersey === jerseyNumber) {
                appState.selectedJersey = null;
            } else {
                appState.selectedJersey = jerseyNumber;
            }

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
                    <div class="stat"><div class="value">${stats.FOULS?.total || 0}</div><div class="label">FLS</div></div>
                    <div class="stat"><div class="value">${Formatters.formatFT(stats.FT || {made:0, attempts:0})}</div><div class="label">FT</div></div>
                    <div class="stat"><div class="value">${Formatters.formatFG(stats.FG || {made:0, attempts:0})}</div><div class="label">FG</div></div>
                    <div class="stat"><div class="value">${Formatters.format3PT(stats['3PT'] || {made:0, attempts:0})}</div><div class="label">3PT</div></div>
                    <div class="stat"><div class="value">${stats.REB || 0}</div><div class="label">REB</div></div>
                    <div class="stat"><div class="value">${stats.AST || 0}</div><div class="label">AST</div></div>
                    <div class="stat"><div class="value">${stats.STL || 0}</div><div class="label">STL</div></div>
                    <div class="stat"><div class="value">${stats.BLK || 0}</div><div class="label">BLK</div></div>
                    <div class="stat"><div class="value">${stats.TO || 0}</div><div class="label">TO</div></div>
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
                <div class="stats-display">
                    <div class="stat"><div class="value">${stats.PTS || 0}</div><div class="label">PTS</div></div>
                    <div class="stat stat-warning"><div class="value">${stats.FOULS?.total || 0}</div><div class="label">FLS</div></div>
                    <div class="stat"><div class="value">${Formatters.formatFT(stats.FT || {made:0, attempts:0})}</div><div class="label">FT</div></div>
                    <div class="stat"><div class="value">${Formatters.formatFG(stats.FG || {made:0, attempts:0})}</div><div class="label">FG</div></div>
                    <div class="stat"><div class="value">${Formatters.format3PT(stats['3PT'] || {made:0, attempts:0})}</div><div class="label">3PT</div></div>
                    <div class="stat"><div class="value">${stats.REB || 0}</div><div class="label">REB</div></div>
                    <div class="stat"><div class="value">${stats.AST || 0}</div><div class="label">AST</div></div>
                    <div class="stat"><div class="value">${stats.STL || 0}</div><div class="label">STL</div></div>
                    <div class="stat"><div class="value">${stats.BLK || 0}</div><div class="label">BLK</div></div>
                    <div class="stat stat-warning"><div class="value">${stats.TO || 0}</div><div class="label">TO</div></div>
                </div>
                <div class="action-buttons-container">
                    <div class="shot-buttons-row">
                        <button onclick="UI.handleShotButton(1, true)" class="action-btn">Made FT</button>
                        <button onclick="UI.handleShotButton(2, true)" class="action-btn">Made FG</button>
                        <button onclick="UI.handleShotButton(3, true)" class="action-btn">Made 3PT</button>
                        <button onclick="UI.handleShotButton(1, false)" class="action-btn">Miss FT</button>
                        <button onclick="UI.handleShotButton(2, false)" class="action-btn">Miss FG</button>
                        <button onclick="UI.handleShotButton(3, false)" class="action-btn">Miss 3PT</button>
                    </div>
                    <div class="stat-buttons-row">
                        <button onclick="UI.handleStatButton('REB')" class="action-btn">+REB</button>
                        <button onclick="UI.handleStatButton('AST')" class="action-btn">+AST</button>
                        <button onclick="UI.handleStatButton('STL')" class="action-btn">+STL</button>
                        <button onclick="UI.handleStatButton('BLK')" class="action-btn">+BLK</button>
                        <button onclick="UI.handleStatButton('TO')" class="action-btn">+TO</button>
                        <button onclick="UI.handleFoulButton('FOUL')" class="action-btn foul-btn">+FOUL</button>
                        <button onclick="UI.handleFoulButton('TECH')" class="action-btn tech-btn">+TECH</button>
                    </div>
                </div>
            `;
        },

        /**
         * Handle foul toggle - CORRECTED LOGIC
         */
        handleFoulToggle(foulType) {
            const appState = DataModel.getAppState();
            const jerseyNumber = appState.selectedJersey;
            if (jerseyNumber === null) return;

            const statsCache = DataModel.getPlayerStatsCache();
            const playerStats = statsCache[jerseyNumber] || {};
            const currentActiveFouls = playerStats.FOULS?.activeFouls || {};

            // Create a new object to avoid mutation issues
            const activeFouls = { ...currentActiveFouls };

            // Toggle the foul button
            activeFouls[foulType] = !activeFouls[foulType];

            // Immediately update foul events
            EventManager.updatePlayerFouls(jerseyNumber, activeFouls);

            // Stats will be recalculated automatically via event bus
        },

        /**
         * Handle shot button - NEW WORKFLOW
         */
        handleShotButton(points, made) {
            const appState = DataModel.getAppState();
            const jerseyNumber = appState.selectedJersey;
            if (jerseyNumber === null) return;

            const shotType = points === 1 ? 'FT' : points === 3 ? '3PT' : 'FG';

            // Deselect all other shot buttons, select this one
            appState.selectedShotType = { points, made, shotType };
            appState.pendingShot = null; // Clear any pending shot

            // Show Draw Row
            this.showDrawRow(jerseyNumber, points, made);

            // Hide existing shots on canvas
            this.renderCanvas(true); // hideShots = true
        },

        /**
         * Handle stat button
         */
        handleStatButton(statType) {
            const appState = DataModel.getAppState();
            const jerseyNumber = appState.selectedJersey;
            if (jerseyNumber === null) return;

            const game = DataModel.getCurrentGame();
            const playerName = game.playerNames[jerseyNumber] || `Player`;

            // Add event
            EventManager.addEvent(jerseyNumber, 'stat', {
                statData: { type: statType }
            });

            // Show 2-second text overlay on canvas
            const statName = {
                'REB': 'a rebound',
                'AST': 'an assist',
                'STL': 'a steal',
                'BLK': 'a block',
                'TO': 'a turnover'
            }[statType] || statType;

            this.showCourtOverlay(`#${jerseyNumber} ${playerName} made ${statName}`);
        },

        /**
         * Handle foul button (+FOUL or +TECH)
         */
        handleFoulButton(foulType) {
            const appState = DataModel.getAppState();
            const jerseyNumber = appState.selectedJersey;
            if (jerseyNumber === null) return;

            const game = DataModel.getCurrentGame();
            const playerName = game.playerNames[jerseyNumber] || `Player`;

            // Map FOUL -> P (personal foul), TECH -> T (technical foul)
            // For personal fouls, find the next available P slot (P1-P5)
            // For tech fouls, find the next available T slot (T1-T2)
            const statsCache = DataModel.getPlayerStatsCache();
            const playerStats = statsCache[jerseyNumber] || {};
            const currentActiveFouls = playerStats.FOULS?.activeFouls || {};

            let foulEventType;
            if (foulType === 'FOUL') {
                // Find next available personal foul slot (P1-P5)
                for (let i = 1; i <= 5; i++) {
                    if (!currentActiveFouls[`P${i}`]) {
                        foulEventType = `P${i}`;
                        break;
                    }
                }
                if (!foulEventType) {
                    // All 5 personal fouls already assigned
                    this.showCourtOverlay(`#${jerseyNumber} ${playerName} already has 5 personal fouls`);
                    return;
                }
            } else if (foulType === 'TECH') {
                // Find next available tech foul slot (T1-T2)
                for (let i = 1; i <= 2; i++) {
                    if (!currentActiveFouls[`T${i}`]) {
                        foulEventType = `T${i}`;
                        break;
                    }
                }
                if (!foulEventType) {
                    // All 2 tech fouls already assigned
                    this.showCourtOverlay(`#${jerseyNumber} ${playerName} already has 2 technical fouls`);
                    return;
                }
            }

            // Add foul event
            EventManager.addEvent(jerseyNumber, 'foul', {
                foulData: { type: foulEventType }
            });

            // Show 2-second text overlay on canvas
            const foulName = foulType === 'FOUL' ? 'a personal foul' : 'a technical foul';
            this.showCourtOverlay(`#${jerseyNumber} ${playerName} committed ${foulName}`);
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
                const playerName = game.playerNames[event.playerNumber] || `Player`;
                const jerseyAndName = `#${event.playerNumber} ${playerName}`;
                const sentence = Formatters.formatEventToSentence(event, jerseyAndName);
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
                            <th>FLS</th>
                            <th>FT</th>
                            <th>FG</th>
                            <th>3PT</th>
                            <th>REB</th>
                            <th>AST</th>
                            <th>STL</th>
                            <th>BLK</th>
                            <th>TO</th>
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
                        <td>${player.FOULS.total}</td>
                        <td>${Formatters.formatFT(player.FT)}</td>
                        <td>${Formatters.formatFG(player.FG)}</td>
                        <td>${Formatters.format3PT(player['3PT'])}</td>
                        <td>${player.REB}</td>
                        <td>${player.AST}</td>
                        <td>${player.STL}</td>
                        <td>${player.BLK}</td>
                        <td>${player.TO}</td>
                    </tr>
                `;
            });

            // Team total row
            html += `
                    <tr class="team-total">
                        <td colspan="2">TEAM TOTAL</td>
                        <td>${teamStats.PTS}</td>
                        <td>${teamStats.FOULS.total}</td>
                        <td>${Formatters.formatFT(teamStats.FT)}</td>
                        <td>${Formatters.formatFG(teamStats.FG)}</td>
                        <td>${Formatters.format3PT(teamStats['3PT'])}</td>
                        <td>${teamStats.REB}</td>
                        <td>${teamStats.AST}</td>
                        <td>${teamStats.STL}</td>
                        <td>${teamStats.BLK}</td>
                        <td>${teamStats.TO}</td>
                    </tr>
                </tbody>
            </table>
            `;

            container.innerHTML = html;
        },

        /**
         * Render canvas
         */
        renderCanvas(hideShots = false) {
            const canvasData = CourtRenderer.initializeShotsMapCanvas();
            if (canvasData) {
                if (!hideShots) {
                    ShotRenderer.drawShots(canvasData.ctx, canvasData.canvasWidth, canvasData.canvasHeight);
                }

                // Setup canvas interactions
                CanvasInteraction.setupCanvasInteractions(
                    canvasData.canvas,
                    (normalizedX, normalizedY) => this.handleCanvasTap(normalizedX, normalizedY),
                    (x, y) => this.handleCanvasTap(x, y)
                );
            }
        },

        /**
         * Handle tap on canvas
         */
        handleCanvasTap(x, y) {
            // Only handle shot drawing mode
            const drawRow = document.getElementById('draw-row');
            if (drawRow && drawRow.style.display !== 'none') {
                this.handleShotDrawn(x, y);
            }
        },

        /**
         * Show Draw Row
         */
        showDrawRow(jerseyNumber, points, made) {
            const game = DataModel.getCurrentGame();
            const playerName = game.playerNames[jerseyNumber] || 'Player';
            const shotName = points === 1 ? 'free throw' : points === 3 ? '3pt' : '2pt';
            const result = made ? 'made' : 'missed';

            const drawText = document.getElementById('draw-text');
            const drawRow = document.getElementById('draw-row');

            drawText.textContent = `#${jerseyNumber} ${playerName} ${result} a ${shotName}, tap anywhere on court to record the shot`;
            drawRow.style.display = 'flex';
        },

        /**
         * Hide Draw Row
         */
        hideDrawRow() {
            const drawRow = document.getElementById('draw-row');
            drawRow.style.display = 'none';

            const appState = DataModel.getAppState();
            appState.selectedShotType = null;
            appState.pendingShot = null;

            // Re-render canvas to show all shots
            this.renderCanvas();
        },

        /**
         * Handle shot drawn on canvas
         */
        handleShotDrawn(normalizedX, normalizedY) {
            const appState = DataModel.getAppState();
            const shotType = appState.selectedShotType;

            if (!shotType) return;

            // Store pending shot with adjusted location
            const adjustedLocation = ShotRenderer.adjustShotLocation(
                normalizedX,
                normalizedY,
                shotType.shotType
            );

            appState.pendingShot = {
                normalizedX: adjustedLocation.x,
                normalizedY: adjustedLocation.y,
                ...shotType
            };

            // Draw the pending shot on canvas
            this.renderPendingShot();
        },

        /**
         * Render pending shot on canvas
         */
        renderPendingShot() {
            const appState = DataModel.getAppState();
            if (!appState.pendingShot) return;

            const canvasData = CourtRenderer.initializeShotsMapCanvas();
            if (!canvasData) return;

            const x = appState.pendingShot.normalizedX * canvasData.canvasWidth;
            const y = appState.pendingShot.normalizedY * canvasData.canvasHeight;

            ShotRenderer.drawSingleShot(
                canvasData.ctx,
                x,
                y,
                appState.pendingShot.made,
                appState.pendingShot.shotType,
                appState.pendingShot.points
            );
        },

        /**
         * Handle Redraw button
         */
        handleRedraw() {
            const appState = DataModel.getAppState();
            appState.pendingShot = null;

            // Clear canvas and redraw court only
            this.renderCanvas(true); // hideShots = true
        },

        /**
         * Handle Done button
         */
        handleDone() {
            const appState = DataModel.getAppState();
            const jerseyNumber = appState.selectedJersey;
            const pendingShot = appState.pendingShot;

            if (!pendingShot) {
                alert('Please tap on the court to place the shot first');
                return;
            }

            // Add shot event with location
            EventManager.addEvent(jerseyNumber, 'shot', {
                shotData: {
                    made: pendingShot.made,
                    shotType: pendingShot.shotType,
                    location: {
                        x: pendingShot.normalizedX,
                        y: pendingShot.normalizedY
                    }
                }
            });

            // Hide Draw Row and render normally
            this.hideDrawRow();
            this.render();
        },

        /**
         * Handle Cancel button
         */
        handleCancel() {
            this.hideDrawRow();
        },

        /**
         * Show text overlay on court
         */
        showCourtOverlay(text) {
            const canvasData = CourtRenderer.initializeShotsMapCanvas();
            if (!canvasData) return;

            const ctx = canvasData.ctx;
            const width = canvasData.canvasWidth;
            const height = canvasData.canvasHeight;

            // Draw semi-transparent overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, width, height);

            // Draw text
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, width / 2, height / 2);

            // Fade out after 2 seconds
            setTimeout(() => {
                this.renderCanvas();
            }, 2000);
        }
    };
})();
