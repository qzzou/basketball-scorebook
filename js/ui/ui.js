// Simplified UI Module - MVP implementation
// This combines multiple UI modules into one for initial working prototype

const UI = (() => {
    /**
     * Trigger haptic feedback if supported
     * @param {string} type - 'light', 'medium', 'heavy', or 'error'
     */
    function haptic(type = 'light') {
        if ('vibrate' in navigator) {
            switch (type) {
                case 'light':
                    navigator.vibrate(10);
                    break;
                case 'medium':
                    navigator.vibrate(20);
                    break;
                case 'heavy':
                    navigator.vibrate(30);
                    break;
                case 'error':
                    navigator.vibrate([30, 50, 30]);
                    break;
                default:
                    navigator.vibrate(10);
            }
        }
    }

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

            // Calculate total points from all players
            const teamStats = StatCalculator.calculateCombinedStats(
                game.teamRoster,
                game.gameEvents
            );
            const totalPoints = teamStats.PTS || 0;

            // Update team name with points
            const teamNameEl = document.getElementById('team-name');
            if (teamNameEl) {
                teamNameEl.textContent = `${game.teamName} - ${totalPoints} pts`;
            }

            // Update game name
            const gameNameEl = document.getElementById('game-name');
            if (gameNameEl) {
                gameNameEl.textContent = game.gameName;
            }
        },

        /**
         * Render shot map section (jersey row, stat row, action column)
         */
        renderShotMapSection() {
            const game = DataModel.getCurrentGame();
            const appState = DataModel.getAppState();
            if (!game) return;

            // Auto-select first player if none selected and roster has players
            if (appState.selectedJersey === null && game.teamRoster.length > 0) {
                appState.selectedJersey = game.teamRoster[0];
            }

            // Render jersey buttons
            this.renderJerseyRow();

            // Render stat row based on selected player
            if (appState.selectedJersey !== null) {
                this.renderStatRow(appState.selectedJersey);
                this.showGuideText();
            } else {
                // No players in roster - show empty stat row with just undo/redo
                document.getElementById('stat-row').innerHTML = `
                    <div class="player-name-row">
                        <div></div>
                        <div class="undo-redo-buttons">
                            <button id="undo-btn" class="text-btn" title="Undo" onclick="EventManager.undoLastEvent()">Undo</button>
                            <button id="redo-btn" class="text-btn" title="Redo" onclick="EventManager.redoLastEvent()">Redo</button>
                        </div>
                    </div>
                `;
                this.renderStatButtons();
                this.hideGuideText();
            }

            // Update undo/redo buttons
            const undoBtn = document.getElementById('undo-btn');
            const redoBtn = document.getElementById('redo-btn');
            if (undoBtn) {
                undoBtn.disabled = !EventManager.canUndo();
            }
            if (redoBtn) {
                redoBtn.disabled = !EventManager.canRedo();
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

            // If no players, leave jersey row empty
            if (game.teamRoster.length === 0) {
                return;
            }

            // Get stats cache for foul counts
            const statsCache = DataModel.getPlayerStatsCache();

            // Render jersey buttons with foul indicators
            game.teamRoster.forEach(jerseyNumber => {
                const wrapper = document.createElement('div');
                wrapper.className = 'jersey-wrapper';

                const btn = document.createElement('button');
                btn.textContent = jerseyNumber;
                btn.className = 'jersey-btn';

                // Get foul count for this player
                const playerStats = statsCache[jerseyNumber] || {};
                const foulCount = playerStats.FOULS?.total || 0;
                const activeFouls = playerStats.FOULS?.activeFouls || {};
                // Count technical fouls (T1, T2 keys)
                const techCount = Object.keys(activeFouls).filter(k => k.startsWith('T') && activeFouls[k]).length;
                const personalCount = foulCount - techCount;

                if (appState.selectedJersey === jerseyNumber) {
                    btn.classList.add('selected');
                }

                // Add fouled-out class if total fouls (personal + technical) reach 5 OR 2+ technical fouls
                if (foulCount >= 5 || techCount >= 2) {
                    btn.classList.add('fouled-out');
                }

                btn.onclick = () => this.handleJerseyClick(jerseyNumber);
                wrapper.appendChild(btn);

                // Add foul dots if player has fouls (up to 5)
                if (foulCount > 0) {
                    const dotsContainer = document.createElement('div');
                    dotsContainer.className = 'foul-dots';
                    const dotsToShow = Math.min(foulCount, 5);
                    for (let i = 0; i < dotsToShow; i++) {
                        const dot = document.createElement('span');
                        dot.className = 'foul-dot';
                        dotsContainer.appendChild(dot);
                    }
                    wrapper.appendChild(dotsContainer);
                }

                container.appendChild(wrapper);
            });

            // Initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }
        },

        /**
         * Handle jersey click - always select, never deselect by toggle
         */
        handleJerseyClick(jerseyNumber) {
            haptic('light');
            const appState = DataModel.getAppState();

            // If already selected, do nothing (can't deselect by toggle)
            if (appState.selectedJersey === jerseyNumber) {
                return;
            }

            // Select the player
            appState.selectedJersey = jerseyNumber;

            // Auto-scroll to jersey row when selecting a player
            const jerseyRow = document.getElementById('jersey-row');
            if (jerseyRow) {
                const yOffset = -16;
                const y = jerseyRow.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }

            // Clear shot button selection when switching players
            const shotButtons = document.querySelectorAll('.shot-buttons-row .action-btn');
            shotButtons.forEach(btn => btn.classList.remove('selected'));

            this.render();
        },

        /**
         * Render stat row for selected player
         */
        renderStatRow(jerseyNumber) {
            const game = DataModel.getCurrentGame();
            const statsCache = DataModel.getPlayerStatsCache();
            const stats = statsCache[jerseyNumber] || {};

            const container = document.getElementById('stat-row');
            if (!container) return;

            // Get player name
            const playerName = game?.playerNames?.[jerseyNumber] || `Player ${jerseyNumber}`;

            // Build stats HTML - always show PTS, only include other non-zero values
            let statsHtml = '';

            // Always show PTS
            statsHtml += `<div class="stat" data-stat-type="PTS"><div class="value">${stats.PTS || 0}</div><div class="label">PTS</div></div>`;

            if (stats.FOULS?.total > 0) {
                statsHtml += `<div class="stat stat-warning" data-stat-type="FLS"><div class="value">${stats.FOULS.total}</div><div class="label">FLS</div></div>`;
            }
            if (stats.FT?.attempts > 0) {
                statsHtml += `<div class="stat" data-stat-type="FT"><div class="value">${Formatters.formatFT(stats.FT)}</div><div class="label">FT</div></div>`;
            }
            if (stats.FG?.attempts > 0) {
                statsHtml += `<div class="stat" data-stat-type="FG"><div class="value">${Formatters.formatFG(stats.FG)}</div><div class="label">FG</div></div>`;
            }
            if (stats['3PT']?.attempts > 0) {
                statsHtml += `<div class="stat" data-stat-type="3PT"><div class="value">${Formatters.format3PT(stats['3PT'])}</div><div class="label">3PT</div></div>`;
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
                <div class="player-name-row">
                    <div class="player-name-header">${playerName}</div>
                    <div class="undo-redo-buttons">
                        <button id="undo-btn" class="text-btn" title="Undo" onclick="EventManager.undoLastEvent()">Undo</button>
                        <button id="redo-btn" class="text-btn" title="Redo" onclick="EventManager.redoLastEvent()">Redo</button>
                    </div>
                </div>
                <div class="stats-display">
                    ${statsHtml}
                </div>
                <div class="action-buttons-container">
                    <div class="stat-buttons-row">
                        <button onclick="UI.handleStatButton('REB')" class="action-btn stat-btn">+REB</button>
                        <button onclick="UI.handleStatButton('AST')" class="action-btn stat-btn">+AST</button>
                        <button onclick="UI.handleStatButton('STL')" class="action-btn stat-btn">+STL</button>
                        <button onclick="UI.handleStatButton('BLK')" class="action-btn stat-btn">+BLK</button>
                        <button onclick="UI.handleStatButton('TO')" class="action-btn stat-btn to-btn">+TO</button>
                        <button onclick="UI.handleFoulButton('FOUL')" class="action-btn stat-btn foul-btn">+FOUL</button>
                        <button onclick="UI.handleFoulButton('TECH')" class="action-btn stat-btn tech-btn">+TECH</button>
                    </div>
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

            // Clear stat buttons section (now rendered inline above)
            this.renderStatButtons();
        },

        /**
         * Clear stat buttons section (stat buttons are now rendered inline in stat row)
         */
        renderStatButtons() {
            const container = document.getElementById('shot-buttons-section');
            if (!container) return;
            container.innerHTML = '';
            container.style.display = 'none';
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
         * Handle shot button - INSTANT RECORDING
         * Shot is recorded immediately with unplaced location
         * User can then tap court to place shot location
         */
        handleShotButton(points, made) {
            haptic('medium');
            const appState = DataModel.getAppState();
            const jerseyNumber = appState.selectedJersey;
            if (jerseyNumber === null) return;

            const shotType = points === 1 ? 'FT' : points === 3 ? '3PT' : 'FG';

            // Instantly record the shot event with unplaced location
            EventManager.addEvent(jerseyNumber, 'shot', {
                shotData: {
                    made: made,
                    shotType: shotType,
                    location: null // null means unplaced
                }
            });

            // Flash the button to show it registered
            const clickedButton = event.target.closest('.action-btn');
            if (clickedButton) {
                clickedButton.classList.add('flash');
                setTimeout(() => clickedButton.classList.remove('flash'), 200);
            }

            // Animate the corresponding stat displays (after short delay for DOM update)
            setTimeout(() => {
                // Animate PTS if made
                if (made) {
                    const ptsElement = document.querySelector('.stat[data-stat-type="PTS"]');
                    if (ptsElement) {
                        ptsElement.classList.add('stat-shake');
                        setTimeout(() => ptsElement.classList.remove('stat-shake'), 3000);
                    }
                }
                // Animate the shot type stat (FT, FG, or 3PT)
                const shotStatElement = document.querySelector(`.stat[data-stat-type="${shotType}"]`);
                if (shotStatElement) {
                    shotStatElement.classList.add('stat-shake');
                    setTimeout(() => shotStatElement.classList.remove('stat-shake'), 3000);
                }
            }, 100);

            // Update guide text to prompt for placing shots
            this.updateGuideTextForUnplacedShots();

            // Re-render canvas to show all shots
            this.renderCanvas();
        },

        /**
         * Handle stat button
         */
        handleStatButton(statType) {
            haptic('medium');
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
            haptic('heavy');
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

            // Animate the FLS stat display (after short delay for DOM update)
            setTimeout(() => {
                const flsElement = document.querySelector('.stat[data-stat-type="FLS"]');
                if (flsElement) {
                    flsElement.classList.add('stat-shake');
                    setTimeout(() => flsElement.classList.remove('stat-shake'), 3000);
                }
            }, 100);

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

                // Determine class: edited takes precedence, then unplaced shots
                let className = '';
                if (event.edited) {
                    className = 'edited';
                } else if (event.action === 'shot' && event.shotData && event.shotData.location === null) {
                    className = 'unplaced';
                }

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

            // Build team stats HTML using same style as player stats row
            let teamStatsHtml = '';
            teamStatsHtml += `<div class="stat"><div class="value">${teamStats.PTS || 0}</div><div class="label">PTS</div></div>`;
            if (teamStats.FOULS?.total > 0) {
                teamStatsHtml += `<div class="stat stat-warning"><div class="value">${teamStats.FOULS.total}</div><div class="label">FLS</div></div>`;
            }
            if (teamStats.FT?.attempts > 0) {
                teamStatsHtml += `<div class="stat"><div class="value">${Formatters.formatFT(teamStats.FT)}</div><div class="label">FT</div></div>`;
            }
            if (teamStats.FG?.attempts > 0) {
                teamStatsHtml += `<div class="stat"><div class="value">${Formatters.formatFG(teamStats.FG)}</div><div class="label">FG</div></div>`;
            }
            if (teamStats['3PT']?.attempts > 0) {
                teamStatsHtml += `<div class="stat"><div class="value">${Formatters.format3PT(teamStats['3PT'])}</div><div class="label">3PT</div></div>`;
            }
            if (teamStats.REB > 0) {
                teamStatsHtml += `<div class="stat"><div class="value">${teamStats.REB}</div><div class="label">REB</div></div>`;
            }
            if (teamStats.AST > 0) {
                teamStatsHtml += `<div class="stat"><div class="value">${teamStats.AST}</div><div class="label">AST</div></div>`;
            }
            if (teamStats.STL > 0) {
                teamStatsHtml += `<div class="stat"><div class="value">${teamStats.STL}</div><div class="label">STL</div></div>`;
            }
            if (teamStats.BLK > 0) {
                teamStatsHtml += `<div class="stat"><div class="value">${teamStats.BLK}</div><div class="label">BLK</div></div>`;
            }
            if (teamStats.TO > 0) {
                teamStatsHtml += `<div class="stat stat-warning"><div class="value">${teamStats.TO}</div><div class="label">TO</div></div>`;
            }

            // Team stats overview using same style as player stats
            let html = `
                <div class="stats-display" style="margin-bottom: 1rem;">
                    ${teamStatsHtml}
                </div>
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
            // Check if there are unplaced shots to place
            const unplacedShots = this.getUnplacedShots();
            if (unplacedShots.length > 0) {
                this.handleCourtTap(x, y);
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
            guideText.classList.remove('hidden');

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
            // Check for unplaced shots first
            const unplacedShots = this.getUnplacedShots();
            if (unplacedShots.length > 0) {
                this.updateGuideTextForUnplacedShots();
                return;
            }

            // No unplaced shots - hide guide text
            this.hideGuideText();
        },

        /**
         * Hide guide text (keeps space reserved)
         */
        hideGuideText() {
            const guideText = document.getElementById('guide-text');
            if (guideText) {
                guideText.classList.add('hidden');
                guideText.classList.remove('highlight-tap');
                guideText.textContent = '';
            }
        },

        /**
         * Get unplaced shot events (shots with no location)
         * Returns them in chronological order (earliest first)
         */
        getUnplacedShots() {
            const game = DataModel.getCurrentGame();
            if (!game) return [];

            return game.gameEvents.filter(e =>
                e.eventStatus === 'active' &&
                e.action === 'shot' &&
                e.shotData &&
                e.shotData.location === null
            ).sort((a, b) => a.timestamp - b.timestamp);
        },

        /**
         * Update guide text to show prompt for placing unplaced shots
         */
        updateGuideTextForUnplacedShots() {
            const guideText = document.getElementById('guide-text');
            if (!guideText) return;

            const unplacedShots = this.getUnplacedShots();

            if (unplacedShots.length > 0) {
                const game = DataModel.getCurrentGame();
                const shot = unplacedShots[0]; // earliest unplaced
                const playerName = game.playerNames[shot.playerNumber] || `#${shot.playerNumber}`;
                const madeText = shot.shotData.made ? 'made' : 'missed';
                const shotTypeText = shot.shotData.shotType;

                if (unplacedShots.length === 1) {
                    guideText.textContent = `Long press on court to place ${playerName} ${madeText} ${shotTypeText}`;
                } else {
                    guideText.textContent = `Long press on court to place ${playerName} ${madeText} ${shotTypeText} (${unplacedShots.length} unplaced)`;
                }
                guideText.classList.remove('hidden');
                guideText.classList.add('highlight-tap');
            } else {
                // No unplaced shots, show default guide text
                this.showGuideText();
            }
        },

        /**
         * Handle court tap - place earliest unplaced shot
         */
        handleCourtTap(normalizedX, normalizedY) {
            const unplacedShots = this.getUnplacedShots();

            if (unplacedShots.length === 0) {
                // No unplaced shots, ignore tap
                return;
            }

            haptic('light');

            // Get the earliest unplaced shot
            const shot = unplacedShots[0];

            // Auto-snap to legal location based on shot type
            const adjustedLocation = ShotRenderer.adjustShotLocation(
                normalizedX,
                normalizedY,
                shot.shotData.shotType
            );

            // Convert to feet coordinates for export compatibility
            const feetCoords = ShotRenderer.convertToFeet(adjustedLocation.x, adjustedLocation.y);

            // Place shot location (does not mark as edited)
            EventManager.placeShotLocation(shot.eventIndex, {
                x: adjustedLocation.x,
                y: adjustedLocation.y,
                x_ft: feetCoords.x_ft,
                y_ft: feetCoords.y_ft
            });

            // Start animation for the placed shot
            ShotRenderer.animateShot(shot.eventIndex);

            // Re-render canvas and start animation loop
            this.renderCanvas();
            this.startShotAnimationLoop();

            // Update guide text for remaining unplaced shots
            this.updateGuideTextForUnplacedShots();
        },

        /**
         * Start animation loop for shot effects
         */
        startShotAnimationLoop() {
            // Cancel existing animation frame if any
            if (this.shotAnimationFrame) {
                cancelAnimationFrame(this.shotAnimationFrame);
            }

            const animate = () => {
                // Check if there are still animating shots
                if (ShotRenderer.hasAnimatingShots()) {
                    this.renderCanvas();
                    this.shotAnimationFrame = requestAnimationFrame(animate);
                } else {
                    this.shotAnimationFrame = null;
                }
            };

            this.shotAnimationFrame = requestAnimationFrame(animate);
        },

        /**
         * Handle shot drawn on canvas (LEGACY - now redirects to handleCourtTap)
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
            haptic('heavy');
            const appState = DataModel.getAppState();
            const jerseyNumber = appState.selectedJersey;
            const pendingShot = appState.pendingShot;

            if (!pendingShot) {
                alert('Please tap on the court to place the shot first');
                return;
            }

            // Convert to feet coordinates for export compatibility
            const feetCoords = ShotRenderer.convertToFeet(pendingShot.normalizedX, pendingShot.normalizedY);

            // Add shot event with location (both normalized and feet)
            EventManager.addEvent(jerseyNumber, 'shot', {
                shotData: {
                    made: pendingShot.made,
                    shotType: pendingShot.shotType,
                    location: {
                        x: pendingShot.normalizedX,
                        y: pendingShot.normalizedY,
                        x_ft: feetCoords.x_ft,
                        y_ft: feetCoords.y_ft
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
            haptic('light');
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
