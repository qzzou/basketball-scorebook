// Formatters - Text formatting helpers

const Formatters = (() => {
    return {
        /**
         * Format shot stats as M/A
         * @param {number} made - Made shots
         * @param {number} attempts - Total attempts
         * @returns {string}
         */
        formatShot(made, attempts) {
            return `${made}/${attempts}`;
        },

        /**
         * Format free throw stats
         * @param {Object} ft - {made, attempts}
         * @returns {string}
         */
        formatFT(ft) {
            return this.formatShot(ft.made, ft.attempts);
        },

        /**
         * Format field goal stats
         * @param {Object} fg - {made, attempts}
         * @returns {string}
         */
        formatFG(fg) {
            return this.formatShot(fg.made, fg.attempts);
        },

        /**
         * Format 3-pointer stats
         * @param {Object} threePt - {made, attempts}
         * @returns {string}
         */
        format3PT(threePt) {
            return this.formatShot(threePt.made, threePt.attempts);
        },

        /**
         * Format shot percentage
         * @param {number} made - Made shots
         * @param {number} attempts - Total attempts
         * @returns {string}
         */
        formatPercentage(made, attempts) {
            if (attempts === 0) return '0%';
            return `${Math.round((made / attempts) * 100)}%`;
        },

        /**
         * Format event to sentence for action log
         * @param {Object} event - Game event
         * @param {string} playerName - Player name
         * @returns {string}
         */
        formatEventToSentence(event, playerName) {
            const name = playerName || `#${event.playerNumber}`;

            if (event.action === 'shot' && event.shotData) {
                const { made, shotType } = event.shotData;
                const result = made ? 'made' : 'missed';
                const shotName = shotType === 'FT' ? 'free throw' :
                                shotType === '3PT' ? '3-pointer' : '2-pointer';
                return `${name} ${result} a ${shotName}`;
            }

            if (event.action === 'stat' && event.statData) {
                const statName = {
                    'REB': 'rebound',
                    'AST': 'assist',
                    'STL': 'steal',
                    'BLK': 'block',
                    'TO': 'turnover'
                }[event.statData.type] || event.statData.type;
                return `${name} recorded a ${statName}`;
            }

            if (event.action === 'foul' && event.foulData) {
                const foulType = event.foulData.type;
                const isTech = foulType.startsWith('T');
                return `${name} ${isTech ? 'technical' : 'personal'} foul`;
            }

            return `${name} - unknown action`;
        },

        /**
         * Format timestamp to readable time
         * @param {number} timestamp - Timestamp in milliseconds
         * @returns {string}
         */
        formatTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleTimeString();
        },

        /**
         * Format date
         * @param {number} timestamp - Timestamp in milliseconds
         * @returns {string}
         */
        formatDate(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleDateString();
        },

        /**
         * Format date and time
         * @param {number} timestamp - Timestamp in milliseconds
         * @returns {string}
         */
        formatDateTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleString();
        },

        /**
         * Format foul count
         * @param {Object} fouls - FOULS object with total and activeFouls
         * @returns {string}
         */
        formatFouls(fouls) {
            if (!fouls || fouls.total === 0) return '0';

            const personal = Object.keys(fouls.activeFouls)
                .filter(k => k.startsWith('P') && fouls.activeFouls[k])
                .length;
            const technical = Object.keys(fouls.activeFouls)
                .filter(k => k.startsWith('T') && fouls.activeFouls[k])
                .length;

            if (technical > 0) {
                return `${personal}P ${technical}T`;
            }
            return `${personal}`;
        }
    };
})();
