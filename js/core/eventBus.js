// Event Bus - Centralized event-driven communication
// Enables loose coupling between modules

const EventBus = (() => {
    const listeners = {};

    return {
        /**
         * Subscribe to an event
         * @param {string} eventName - Name of the event
         * @param {Function} callback - Function to call when event fires
         */
        on(eventName, callback) {
            if (!listeners[eventName]) {
                listeners[eventName] = [];
            }
            listeners[eventName].push(callback);
        },

        /**
         * Unsubscribe from an event
         * @param {string} eventName - Name of the event
         * @param {Function} callback - Function to remove
         */
        off(eventName, callback) {
            if (!listeners[eventName]) return;
            listeners[eventName] = listeners[eventName].filter(cb => cb !== callback);
        },

        /**
         * Emit an event
         * @param {string} eventName - Name of the event
         * @param {*} data - Data to pass to listeners
         */
        emit(eventName, data) {
            if (!listeners[eventName]) return;
            listeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for '${eventName}':`, error);
                }
            });
        },

        /**
         * Get all registered event names (for debugging)
         */
        getEvents() {
            return Object.keys(listeners);
        }
    };
})();

// Standard events used throughout the application:
// - "game:loaded" - Game data loaded
// - "game:saved" - Game data saved
// - "event:added" - New game event added
// - "event:edited" - Game event edited
// - "event:deleted" - Game event deleted
// - "event:undone" - Event undone
// - "event:redone" - Event redone
// - "stats:updated" - Player/team stats recalculated
// - "mode:changed" - Edit/View mode changed
// - "view:changed" - UI view changed (main/settings/help/etc.)
// - "player:selected" - Player jersey selected
