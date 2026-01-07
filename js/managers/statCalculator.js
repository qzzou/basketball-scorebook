// Stat Calculator - Calculate player and team statistics from events

const StatCalculator = (() => {
    return {
        /**
         * Calculate stats for a single player from game events
         * @param {number} playerNumber - Jersey number
         * @param {Array} events - All game events
         * @returns {Object} Player stats including foul button states
         */
        calculatePlayerStats(playerNumber, events) {
            const activeEvents = events.filter(e =>
                e.eventStatus === 'active' && e.playerNumber === playerNumber
            );

            const stats = {
                PTS: 0,
                FT: { made: 0, attempts: 0 },
                FG: { made: 0, attempts: 0 },
                '3PT': { made: 0, attempts: 0 },
                REB: 0,
                AST: 0,
                STL: 0,
                BLK: 0,
                TO: 0,
                FOULS: {
                    total: 0,
                    activeFouls: {
                        P1: false,
                        P2: false,
                        P3: false,
                        P4: false,
                        P5: false,
                        T1: false,
                        T2: false
                    }
                }
            };

            activeEvents.forEach(event => {
                if (event.action === 'shot' && event.shotData) {
                    const { made, shotType } = event.shotData;

                    // Update shot stats
                    if (shotType === 'FT') {
                        stats.FT.attempts++;
                        if (made) {
                            stats.FT.made++;
                            stats.PTS += 1;
                        }
                    } else if (shotType === '3PT') {
                        stats['3PT'].attempts++;
                        if (made) {
                            stats['3PT'].made++;
                            stats.PTS += 3;
                        }
                    } else { // 'FG'
                        stats.FG.attempts++;
                        if (made) {
                            stats.FG.made++;
                            stats.PTS += 2;
                        }
                    }
                } else if (event.action === 'stat' && event.statData) {
                    // Update other stats
                    const statType = event.statData.type;
                    if (stats[statType] !== undefined) {
                        stats[statType]++;
                    }
                } else if (event.action === 'foul' && event.foulData) {
                    // Track individual foul types
                    const foulType = event.foulData.type;
                    if (stats.FOULS.activeFouls[foulType] !== undefined) {
                        stats.FOULS.activeFouls[foulType] = true;
                    }
                }
            });

            // Calculate total fouls from active foul buttons
            stats.FOULS.total = Object.values(stats.FOULS.activeFouls)
                .filter(active => active).length;

            return stats;
        },

        /**
         * Calculate stats for all players
         * @param {Array} teamRoster - Array of jersey numbers
         * @param {Array} events - All game events
         * @param {Object} playerNames - Player name mappings
         * @returns {Array} Array of player stats objects
         */
        calculateAllPlayerStats(teamRoster, events, playerNames = {}) {
            return teamRoster.map(jerseyNumber => {
                const stats = this.calculatePlayerStats(jerseyNumber, events);
                return {
                    jerseyNumber,
                    name: playerNames[jerseyNumber] || `Player ${jerseyNumber}`,
                    ...stats
                };
            });
        },

        /**
         * Calculate combined stats for multiple players
         * @param {Array} jerseyNumbers - Array of jersey numbers to combine
         * @param {Array} events - All game events
         * @returns {Object} Combined stats
         */
        calculateCombinedStats(jerseyNumbers, events) {
            const combined = {
                PTS: 0,
                FT: { made: 0, attempts: 0 },
                FG: { made: 0, attempts: 0 },
                '3PT': { made: 0, attempts: 0 },
                REB: 0,
                AST: 0,
                STL: 0,
                BLK: 0,
                TO: 0,
                FOULS: { total: 0 }
            };

            jerseyNumbers.forEach(jerseyNumber => {
                const playerStats = this.calculatePlayerStats(jerseyNumber, events);
                combined.PTS += playerStats.PTS;
                combined.FT.made += playerStats.FT.made;
                combined.FT.attempts += playerStats.FT.attempts;
                combined.FG.made += playerStats.FG.made;
                combined.FG.attempts += playerStats.FG.attempts;
                combined['3PT'].made += playerStats['3PT'].made;
                combined['3PT'].attempts += playerStats['3PT'].attempts;
                combined.REB += playerStats.REB;
                combined.AST += playerStats.AST;
                combined.STL += playerStats.STL;
                combined.BLK += playerStats.BLK;
                combined.TO += playerStats.TO;
                combined.FOULS.total += playerStats.FOULS.total;
            });

            return combined;
        },

        /**
         * Calculate team total stats
         * @param {Array} events - All game events
         * @param {Array} teamRoster - Array of jersey numbers
         * @returns {Object} Team total stats
         */
        calculateTeamStats(events, teamRoster) {
            return this.calculateCombinedStats(teamRoster, events);
        },

        /**
         * Format shot percentage
         * @param {number} made - Made shots
         * @param {number} attempts - Total attempts
         * @returns {string} Formatted string "M/A"
         */
        formatShot(made, attempts) {
            return `${made}/${attempts}`;
        },

        /**
         * Format shot percentage with percentage
         * @param {number} made - Made shots
         * @param {number} attempts - Total attempts
         * @returns {string} Formatted string "M/A (XX%)"
         */
        formatShotPercentage(made, attempts) {
            if (attempts === 0) return '0/0 (0%)';
            const percentage = Math.round((made / attempts) * 100);
            return `${made}/${attempts} (${percentage}%)`;
        },

        /**
         * Update player stats cache
         * @param {Array} teamRoster - Array of jersey numbers
         * @param {Array} events - All game events
         * @param {Object} playerNames - Player name mappings
         */
        updateStatsCache(teamRoster, events, playerNames = {}) {
            const cache = DataModel.getPlayerStatsCache();

            // Clear existing cache
            Object.keys(cache).forEach(key => delete cache[key]);

            // Calculate and cache stats for each player
            teamRoster.forEach(jerseyNumber => {
                const stats = this.calculatePlayerStats(jerseyNumber, events);
                DataModel.updatePlayerStats(jerseyNumber, stats);
            });

            // Emit stats updated event
            EventBus.emit('stats:updated');
        }
    };
})();
