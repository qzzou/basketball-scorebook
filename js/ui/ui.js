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
                    // Show guide-text in edit mode when player is selected
                    this.showGuideText();
                } else {
                    const game = DataModel.getCurrentGame();
                    const helpText = game.teamRoster.length === 0 ? 'Add a player above to begin' : 'Select a player above to begin';
                    document.getElementById('stat-row').innerHTML = `<p>${helpText}</p>`;
                    // Clear stat buttons when no player selected
                    this.renderStatButtons();
                    // Hide guide-text when no player selected
                    this.hideGuideText();
                }
            } else {
                // View mode - show combined stats
                this.renderViewModeStats();
                // Clear stat buttons in view mode
                this.renderStatButtons();
                // Hide guide-text in view mode
                this.hideGuideText();
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

            // Hide the original select button (now in jersey row in view mode)
            const selectBtn = document.getElementById('select-btn');
            if (selectBtn) {
                selectBtn.style.display = 'none';
            }

            // Update Edit/View mode button visual states
            const editBtn = document.getElementById('edit-btn');
            const viewBtn = document.getElementById('view-btn');
            if (appState.currentMode === 'edit') {
                if (editBtn) editBtn.classList.add('active');
                if (viewBtn) viewBtn.classList.remove('active');
            } else {
                if (viewBtn) viewBtn.classList.add('active');
                if (editBtn) editBtn.classList.remove('active');
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

            // If no players, show "Add Player" button
            if (game.teamRoster.length === 0) {
                const addBtn = document.createElement('button');
                addBtn.className = 'jersey-btn add-player-btn';
                addBtn.innerHTML = '<i data-lucide="user-round-plus"></i>';
                addBtn.onclick = () => SettingsUI.show();
                container.appendChild(addBtn);

                // Initialize Lucide icons
                if (window.lucide) {
                    lucide.createIcons();
                }
                return;
            }

            // Render jersey buttons
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

            // Add mode-specific button after all players
            if (appState.currentMode === 'edit') {
                // Add "Modify" button in edit mode
                const modifyBtn = document.createElement('button');
                modifyBtn.className = 'jersey-btn modify-player-btn';
                modifyBtn.innerHTML = '<i data-lucide="user-round-pen"></i>';
                modifyBtn.onclick = () => SettingsUI.show();
                container.appendChild(modifyBtn);
            } else {
                // Add "Select" button in view mode with dashed outline
                const selectBtn = document.createElement('button');
                selectBtn.className = 'jersey-btn select-all-btn';
                selectBtn.id = 'select-btn-jersey-row';
                selectBtn.innerHTML = '<i data-lucide="square-stack"></i>';
                selectBtn.onclick = () => this.handleSelectToggle();
                container.appendChild(selectBtn);
            }

            // Initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }
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

                // Auto-scroll to jersey row when selecting a player in edit mode
                if (appState.currentMode === 'edit') {
                    const jerseyRow = document.getElementById('jersey-row');
                    if (jerseyRow) {
                        // Scroll to position with offset for white space above
                        const yOffset = -16; // 16px white space above
                        const y = jerseyRow.getBoundingClientRect().top + window.pageYOffset + yOffset;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                }
            }

            // Clear shot button selection when switching players
            const shotButtons = document.querySelectorAll('.shot-buttons-row .action-btn');
            shotButtons.forEach(btn => btn.classList.remove('selected'));

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
            let title;
            if (playerCount === game.teamRoster.length) {
                title = 'All Players';
            } else if (playerCount === 1) {
                const jerseyNumber = appState.selectedJerseys[0];
                const playerName = game.playerNames[jerseyNumber] || 'Player';
                title = `#${jerseyNumber} ${playerName}`;
            } else {
                title = `${playerCount} Players Selected`;
            }

            // Build stats HTML conditionally - only include non-zero values
            let statsHtml = '';

            if (stats.PTS > 0) {
                statsHtml += `<div class="stat"><div class="value">${stats.PTS}</div><div class="label">PTS</div></div>`;
            }
            if (stats.FOULS?.total > 0) {
                statsHtml += `<div class="stat"><div class="value">${stats.FOULS.total}</div><div class="label">FLS</div></div>`;
            }
            if (stats.FT?.attempts > 0) {
                statsHtml += `<div class="stat"><div class="value">${Formatters.formatFT(stats.FT)}</div><div class="label">FT</div></div>`;
            }
            if (stats.FG?.attempts > 0) {
                statsHtml += `<div class="stat"><div class="value">${Formatters.formatFG(stats.FG)}</div><div class="label">FG</div></div>`;
            }
            if (stats['3PT']?.attempts > 0) {
                statsHtml += `<div class="stat"><div class="value">${Formatters.format3PT(stats['3PT'])}</div><div class="label">3PT</div></div>`;
            }
            if (stats.REB > 0) {
                statsHtml += `<div class="stat"><div class="value">${stats.REB}</div><div class="label">REB</div></div>`;
            }
            if (stats.AST > 0) {
                statsHtml += `<div class="stat"><div class="value">${stats.AST}</div><div class="label">AST</div></div>`;
            }
            if (stats.STL > 0) {
                statsHtml += `<div class="stat"><div class="value">${stats.STL}</div><div class="label">STL</div></div>`;
            }
            if (stats.BLK > 0) {
                statsHtml += `<div class="stat"><div class="value">${stats.BLK}</div><div class="label">BLK</div></div>`;
            }
            if (stats.TO > 0) {
                statsHtml += `<div class="stat"><div class="value">${stats.TO}</div><div class="label">TO</div></div>`;
            }

            container.innerHTML = `
                <div class="view-mode-header">
                    <h3>${title}</h3>
                </div>
                <div class="stats-display">
                    ${statsHtml}
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

            // Build stats HTML conditionally - only include non-zero values
            let statsHtml = '';

            if (stats.PTS > 0) {
                statsHtml += `<div class="stat"><div class="value">${stats.PTS}</div><div class="label">PTS</div></div>`;
            }
            if (stats.FOULS?.total > 0) {
                statsHtml += `<div class="stat stat-warning"><div class="value">${stats.FOULS.total}</div><div class="label">FLS</div></div>`;
            }
            if (stats.FT?.attempts > 0) {
                statsHtml += `<div class="stat"><div class="value">${Formatters.formatFT(stats.FT)}</div><div class="label">FT</div></div>`;
            }
            if (stats.FG?.attempts > 0) {
                statsHtml += `<div class="stat"><div class="value">${Formatters.formatFG(stats.FG)}</div><div class="label">FG</div></div>`;
            }
            if (stats['3PT']?.attempts > 0) {
                statsHtml += `<div class="stat"><div class="value">${Formatters.format3PT(stats['3PT'])}</div><div class="label">3PT</div></div>`;
            }
            if (stats.REB > 0) {
                statsHtml += `<div class="stat" data-stat-type="REB"><div class="value">${stats.REB}</div><div class="label">REB</div></div>`;
            }
            if (stats.AST > 0) {
                statsHtml += `<div class="stat" data-stat-type="AST"><div class="value">${stats.AST}</div><div class="label">AST</div></div>`;
            }
            if (stats.STL > 0) {
                statsHtml += `<div class="stat" data-stat-type="STL"><div class="value">${stats.STL}</div><div class="label">STL</div></div>`;
            }
            if (stats.BLK > 0) {
                statsHtml += `<div class="stat" data-stat-type="BLK"><div class="value">${stats.BLK}</div><div class="label">BLK</div></div>`;
            }
            if (stats.TO > 0) {
                statsHtml += `<div class="stat stat-warning" data-stat-type="TO"><div class="value">${stats.TO}</div><div class="label">TO</div></div>`;
            }

            container.innerHTML = `
                <div class="stats-display">
                    ${statsHtml}
                </div>
                <div class="action-buttons-container">
                    <div class="shot-buttons-row">
                        <button onclick="UI.handleShotButton(1, true)" class="action-btn shot-made" data-shot="FT-made">
                            +1 <svg width="10" height="10" style="margin-left: 4px; vertical-align: middle;"><circle cx="5" cy="5" r="4" fill="#000"/></svg>
                        </button>
                        <button onclick="UI.handleShotButton(2, true)" class="action-btn shot-made" data-shot="FG-made">
                            +2 <svg width="14" height="14" style="margin-left: 4px; vertical-align: middle;"><circle cx="7" cy="7" r="6" fill="#4CAF50"/></svg>
                        </button>
                        <button onclick="UI.handleShotButton(3, true)" class="action-btn shot-made" data-shot="3PT-made">
                            +3 <svg width="14" height="14" style="margin-left: 4px; vertical-align: middle;"><circle cx="7" cy="7" r="6" fill="#2196F3"/></svg>
                        </button>
                        <button onclick="UI.handleShotButton(1, false)" class="action-btn shot-miss" data-shot="FT-miss">
                            Miss 1 <svg width="10" height="10" style="margin-left: 4px; vertical-align: middle;"><line x1="2" y1="2" x2="8" y2="8" stroke="#f44336" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="2" x2="2" y2="8" stroke="#f44336" stroke-width="2" stroke-linecap="round"/></svg>
                        </button>
                        <button onclick="UI.handleShotButton(2, false)" class="action-btn shot-miss" data-shot="FG-miss">
                            Miss 2 <svg width="14" height="14" style="margin-left: 4px; vertical-align: middle;"><line x1="3" y1="3" x2="11" y2="11" stroke="#f44336" stroke-width="2" stroke-linecap="round"/><line x1="11" y1="3" x2="3" y2="11" stroke="#f44336" stroke-width="2" stroke-linecap="round"/></svg>
                        </button>
                        <button onclick="UI.handleShotButton(3, false)" class="action-btn shot-miss" data-shot="3PT-miss">
                            Miss 3 <svg width="14" height="14" style="margin-left: 4px; vertical-align: middle;"><line x1="3" y1="3" x2="11" y2="11" stroke="#f44336" stroke-width="2" stroke-linecap="round"/><line x1="11" y1="3" x2="3" y2="11" stroke="#f44336" stroke-width="2" stroke-linecap="round"/></svg>
                        </button>
                    </div>
                </div>
            `;

            // Render stat buttons below court
            this.renderStatButtons();
        },

        /**
         * Render stat buttons below court canvas
         */
        renderStatButtons() {
            const appState = DataModel.getAppState();
            const container = document.getElementById('shot-buttons-section');
            if (!container) return;

            // Only show stat buttons in edit mode when a player is selected
            if (appState.currentMode !== 'edit' || appState.selectedJersey === null) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = `
                <div class="stat-buttons-row">
                    <button onclick="UI.handleStatButton('REB')" class="action-btn stat-btn">+REB</button>
                    <button onclick="UI.handleStatButton('AST')" class="action-btn stat-btn">+AST</button>
                    <button onclick="UI.handleStatButton('STL')" class="action-btn stat-btn">+STL</button>
                    <button onclick="UI.handleStatButton('BLK')" class="action-btn stat-btn">+BLK</button>
                    <button onclick="UI.handleStatButton('TO')" class="action-btn stat-btn to-btn">+TO</button>
                    <button onclick="UI.handleFoulButton('FOUL')" class="action-btn stat-btn foul-btn">+FOUL</button>
                    <button onclick="UI.handleFoulButton('TECH')" class="action-btn stat-btn tech-btn">+TECH</button>
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

            // Update shot button selection visuals
            const shotButtons = document.querySelectorAll('.shot-buttons-row .action-btn');
            shotButtons.forEach(btn => btn.classList.remove('selected'));

            // Find and select the clicked button
            const clickedButton = event.target;
            if (clickedButton && clickedButton.classList.contains('action-btn')) {
                clickedButton.classList.add('selected');
            }

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

            // Trigger shake animation on the stat field (after a small delay for re-render)
            setTimeout(() => {
                const statElement = document.querySelector(`[data-stat-type="${statType}"]`);
                if (statElement) {
                    statElement.classList.add('stat-shake');
                    setTimeout(() => {
                        statElement.classList.remove('stat-shake');
                    }, 3000); // Remove after 3 seconds
                }
            }, 100);
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
                const time = Formatters.formatTime(event.timestamp);
                const className = event.edited ? 'edited' : '';
                return `<div class="action-item ${className}" onclick="UI.handleActionClick(${event.eventIndex})">[${time}] ${sentence}</div>`;
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
                        ${player.PTS > 0 ? `<td>${player.PTS}</td>` : '<td></td>'}
                        ${player.FOULS.total > 0 ? `<td>${player.FOULS.total}</td>` : '<td></td>'}
                        ${player.FT.attempts > 0 ? `<td>${Formatters.formatFT(player.FT)}</td>` : '<td></td>'}
                        ${player.FG.attempts > 0 ? `<td>${Formatters.formatFG(player.FG)}</td>` : '<td></td>'}
                        ${player['3PT'].attempts > 0 ? `<td>${Formatters.format3PT(player['3PT'])}</td>` : '<td></td>'}
                        ${player.REB > 0 ? `<td>${player.REB}</td>` : '<td></td>'}
                        ${player.AST > 0 ? `<td>${player.AST}</td>` : '<td></td>'}
                        ${player.STL > 0 ? `<td>${player.STL}</td>` : '<td></td>'}
                        ${player.BLK > 0 ? `<td>${player.BLK}</td>` : '<td></td>'}
                        ${player.TO > 0 ? `<td>${player.TO}</td>` : '<td></td>'}
                    </tr>
                `;
            });

            // Team total row
            html += `
                    <tr class="team-total">
                        <td colspan="2">TEAM TOTAL</td>
                        ${teamStats.PTS > 0 ? `<td>${teamStats.PTS}</td>` : '<td></td>'}
                        ${teamStats.FOULS.total > 0 ? `<td>${teamStats.FOULS.total}</td>` : '<td></td>'}
                        ${teamStats.FT.attempts > 0 ? `<td>${Formatters.formatFT(teamStats.FT)}</td>` : '<td></td>'}
                        ${teamStats.FG.attempts > 0 ? `<td>${Formatters.formatFG(teamStats.FG)}</td>` : '<td></td>'}
                        ${teamStats['3PT'].attempts > 0 ? `<td>${Formatters.format3PT(teamStats['3PT'])}</td>` : '<td></td>'}
                        ${teamStats.REB > 0 ? `<td>${teamStats.REB}</td>` : '<td></td>'}
                        ${teamStats.AST > 0 ? `<td>${teamStats.AST}</td>` : '<td></td>'}
                        ${teamStats.STL > 0 ? `<td>${teamStats.STL}</td>` : '<td></td>'}
                        ${teamStats.BLK > 0 ? `<td>${teamStats.BLK}</td>` : '<td></td>'}
                        ${teamStats.TO > 0 ? `<td>${teamStats.TO}</td>` : '<td></td>'}
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
         * Show Draw Row - new workflow
         */
        showDrawRow(jerseyNumber, points, made) {
            const game = DataModel.getCurrentGame();
            const playerName = game.playerNames[jerseyNumber] || 'Player';
            const shotName = points === 1 ? 'free throw' : points === 3 ? '3pt' : '2pt';
            const result = made ? 'made' : 'missed';

            // Show guide-text above court
            const guideText = document.getElementById('guide-text');
            guideText.textContent = `#${jerseyNumber} ${playerName} ${result} a ${shotName}, tap / retap on court`;
            guideText.style.display = 'block';

            // Show tap-text overlay on court
            const tapText = document.getElementById('tap-text');
            tapText.style.display = 'block';

            // Show draw-row below court with disabled Done button
            const drawRow = document.getElementById('draw-row');
            const doneBtn = document.getElementById('done-btn');
            drawRow.style.display = 'flex';
            doneBtn.classList.add('disabled');
            doneBtn.classList.remove('glow', 'shake');
        },

        /**
         * Hide Draw Row - new workflow
         */
        hideDrawRow() {
            // Hide tap-text
            const tapText = document.getElementById('tap-text');
            tapText.style.display = 'none';

            // Hide retap-text
            const retapText = document.getElementById('retap-text');
            retapText.style.display = 'none';

            // Hide draw-row
            const drawRow = document.getElementById('draw-row');
            drawRow.style.display = 'none';

            const appState = DataModel.getAppState();
            appState.selectedShotType = null;
            appState.pendingShot = null;

            // Restore default guide-text if in edit mode with player selected
            if (appState.currentMode === 'edit' && appState.selectedJersey !== null) {
                this.showGuideText();
            } else {
                this.hideGuideText();
            }

            // Re-render canvas to show all shots
            this.renderCanvas();
        },

        /**
         * Start shake animation for Done button periodically
         */
        startDoneButtonShake() {
            const doneBtn = document.getElementById('done-btn');

            // Clear any existing shake interval
            if (this.shakeInterval) {
                clearInterval(this.shakeInterval);
            }

            // Shake every 3 seconds
            this.shakeInterval = setInterval(() => {
                if (!doneBtn.classList.contains('disabled')) {
                    doneBtn.classList.add('shake');
                    setTimeout(() => {
                        doneBtn.classList.remove('shake');
                    }, 500);
                }
            }, 3000);
        },

        /**
         * Stop shake animation for Done button
         */
        stopDoneButtonShake() {
            if (this.shakeInterval) {
                clearInterval(this.shakeInterval);
                this.shakeInterval = null;
            }
        },

        /**
         * Show guide text (edit mode, player selected)
         */
        showGuideText() {
            const guideText = document.getElementById('guide-text');
            if (guideText) {
                guideText.textContent = 'tap a shot button above and then tap on court, or tap a stat button below';
                guideText.style.display = 'block';
            }
        },

        /**
         * Hide guide text
         */
        hideGuideText() {
            const guideText = document.getElementById('guide-text');
            if (guideText) {
                guideText.style.display = 'none';
            }
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

            // Step 6: Hide tap-text, show retap-text
            const tapText = document.getElementById('tap-text');
            const retapText = document.getElementById('retap-text');
            tapText.style.display = 'none';
            retapText.style.display = 'block';

            // Step 7: Enable Done button, add glow, start shake
            const doneBtn = document.getElementById('done-btn');
            doneBtn.classList.remove('disabled');
            doneBtn.classList.add('glow');
            this.startDoneButtonShake();
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

            // Stop shake animation
            this.stopDoneButtonShake();

            // Step 8: Keep shot button highlighted (removed the code that clears selection)

            // Hide Draw Row and render normally
            this.hideDrawRow();
            this.render();
        },

        /**
         * Handle Cancel button
         */
        handleCancel() {
            // Stop shake animation
            this.stopDoneButtonShake();

            // Step 8: Keep shot button highlighted (removed the code that clears selection)

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

            // Draw wrapped text
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Wrap text to fit canvas width with padding
            const maxWidth = width * 0.9; // 90% of canvas width
            const lineHeight = 30;
            const words = text.split(' ');
            const lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const testLine = currentLine + ' ' + words[i];
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth) {
                    lines.push(currentLine);
                    currentLine = words[i];
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);

            // Draw each line centered vertically
            const totalHeight = lines.length * lineHeight;
            const startY = (height - totalHeight) / 2 + lineHeight / 2;

            lines.forEach((line, index) => {
                ctx.fillText(line, width / 2, startY + index * lineHeight);
            });

            // Fade out after 2 seconds
            setTimeout(() => {
                this.renderCanvas();
            }, 2000);
        }
    };
})();
