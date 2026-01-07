// Event Manager - Manage game events (CRUD, undo/redo)

const EventManager = (() => {
    return {
        /**
         * Add a new event to the current game
         * @param {number} playerNumber - Jersey number
         * @param {string} action - "shot", "foul", or "stat"
         * @param {Object} data - Event-specific data
         */
        addEvent(playerNumber, action, data) {
            const game = DataModel.getCurrentGame();
            if (!game) {
                console.error('No active game');
                return;
            }

            const event = DataModel.createEvent(playerNumber, action, data);
            DataModel.addEvent(event);

            // Auto-save
            Storage.autoSave();

            // Update stats cache
            StatCalculator.updateStatsCache(
                game.teamRoster,
                game.gameEvents,
                game.playerNames
            );

            // Emit event
            EventBus.emit('event:added', event);

            return event;
        },

        /**
         * Edit an existing event
         * @param {number} eventIndex - Index of event to edit
         * @param {string} newAction - New action type
         * @param {Object} newData - New event data
         */
        editEvent(eventIndex, newAction, newData) {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            const event = game.gameEvents.find(e => e.eventIndex === eventIndex);
            if (!event) {
                console.error('Event not found:', eventIndex);
                return;
            }

            // Update event (keep original timestamp)
            DataModel.updateEvent(eventIndex, {
                action: newAction,
                edited: true,
                ...newData
            });

            // Auto-save
            Storage.autoSave();

            // Update stats cache
            StatCalculator.updateStatsCache(
                game.teamRoster,
                game.gameEvents,
                game.playerNames
            );

            // Emit event
            EventBus.emit('event:edited', event);
        },

        /**
         * Delete an event (mark as deleted)
         * @param {number} eventIndex - Index of event to delete
         */
        deleteEvent(eventIndex) {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            DataModel.updateEvent(eventIndex, {
                eventStatus: 'deleted'
            });

            // Auto-save
            Storage.autoSave();

            // Update stats cache
            StatCalculator.updateStatsCache(
                game.teamRoster,
                game.gameEvents,
                game.playerNames
            );

            // Emit event
            EventBus.emit('event:deleted', { eventIndex });
        },

        /**
         * Undo the last active event
         */
        undoLastEvent() {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            const activeEvents = DataModel.getGameEvents('active');
            if (activeEvents.length === 0) {
                console.log('No events to undo');
                return;
            }

            // Find most recent active event (highest eventIndex)
            const lastEvent = activeEvents.reduce((latest, event) =>
                event.eventIndex > latest.eventIndex ? event : latest
            );

            // Mark as archived
            DataModel.updateEvent(lastEvent.eventIndex, {
                eventStatus: 'archived'
            });

            // Auto-save
            Storage.autoSave();

            // Update stats cache
            StatCalculator.updateStatsCache(
                game.teamRoster,
                game.gameEvents,
                game.playerNames
            );

            // Emit event
            EventBus.emit('event:undone', lastEvent);
        },

        /**
         * Redo the last archived event
         */
        redoLastEvent() {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            const activeEvents = DataModel.getGameEvents('active');
            const archivedEvents = DataModel.getGameEvents('archived');

            if (archivedEvents.length === 0) {
                console.log('No events to redo');
                return;
            }

            // Find the highest active event index
            const maxActiveIndex = activeEvents.length > 0
                ? Math.max(...activeEvents.map(e => e.eventIndex))
                : -1;

            // Find the first archived event after the last active event
            const nextArchivedEvent = archivedEvents
                .filter(e => e.eventIndex > maxActiveIndex)
                .sort((a, b) => a.eventIndex - b.eventIndex)[0];

            if (!nextArchivedEvent) {
                console.log('No events to redo');
                return;
            }

            // Mark as active
            DataModel.updateEvent(nextArchivedEvent.eventIndex, {
                eventStatus: 'active'
            });

            // Auto-save
            Storage.autoSave();

            // Update stats cache
            StatCalculator.updateStatsCache(
                game.teamRoster,
                game.gameEvents,
                game.playerNames
            );

            // Emit event
            EventBus.emit('event:redone', nextArchivedEvent);
        },

        /**
         * Check if undo is available
         * @returns {boolean}
         */
        canUndo() {
            const activeEvents = DataModel.getGameEvents('active');
            return activeEvents.length > 0;
        },

        /**
         * Check if redo is available
         * @returns {boolean}
         */
        canRedo() {
            const archivedEvents = DataModel.getGameEvents('archived');
            return archivedEvents.length > 0;
        },

        /**
         * Get active events
         * @returns {Array}
         */
        getActiveEvents() {
            return DataModel.getGameEvents('active');
        },

        /**
         * Get archived events
         * @returns {Array}
         */
        getArchivedEvents() {
            return DataModel.getGameEvents('archived');
        },

        /**
         * Get event by index
         * @param {number} eventIndex
         * @returns {Object|null}
         */
        getEventByIndex(eventIndex) {
            const game = DataModel.getCurrentGame();
            if (!game) return null;
            return game.gameEvents.find(e => e.eventIndex === eventIndex);
        },

        /**
         * Add or update foul for a player
         * @param {number} playerNumber - Jersey number
         * @param {Object} activeFouls - Object with foul button states
         */
        updatePlayerFouls(playerNumber, activeFouls) {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            // Remove all existing foul events for this player
            game.gameEvents
                .filter(e => e.playerNumber === playerNumber &&
                            e.action === 'foul' &&
                            e.eventStatus === 'active')
                .forEach(e => {
                    DataModel.updateEvent(e.eventIndex, { eventStatus: 'deleted' });
                });

            // Add new foul events for each active foul button
            Object.entries(activeFouls).forEach(([foulType, isActive]) => {
                if (isActive) {
                    this.addEvent(playerNumber, 'foul', {
                        foulData: { type: foulType }
                    });
                }
            });
        }
    };
})();
