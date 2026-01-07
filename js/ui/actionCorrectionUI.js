// Action Correction UI - Edit or delete game events

const ActionCorrectionUI = (() => {
    return {
        /**
         * Show action correction modal
         * @param {number} eventIndex - Event index to correct
         */
        show(eventIndex) {
            const event = EventManager.getEventByIndex(eventIndex);
            if (!event) {
                console.error('Event not found:', eventIndex);
                return;
            }

            const game = DataModel.getCurrentGame();
            const playerName = game.playerNames[event.playerNumber] || `#${event.playerNumber}`;

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.id = 'action-correction-overlay';
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-content action-correction-modal">
                    <div class="modal-header">
                        <h2>Correct Action</h2>
                        <button class="icon-btn close-btn" onclick="ActionCorrectionUI.close()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="current-action">
                            <strong>Current:</strong> ${Formatters.formatEventToSentence(event, playerName)}
                        </div>
                        <p class="change-to-label">Change to:</p>
                        <div id="correction-buttons" class="correction-buttons"></div>
                    </div>
                    <div class="modal-footer">
                        <button onclick="ActionCorrectionUI.close()" class="btn-secondary">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Render correction buttons based on event type
            this.renderCorrectionButtons(event);

            // Initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }
        },

        /**
         * Close action correction modal
         */
        close() {
            const overlay = document.getElementById('action-correction-overlay');
            if (overlay) {
                overlay.remove();
            }
        },

        /**
         * Render correction buttons based on event type
         */
        renderCorrectionButtons(event) {
            const container = document.getElementById('correction-buttons');
            if (!container) return;

            let buttons = '';

            if (event.action === 'shot') {
                // Shot correction buttons - one per row with descriptive text
                buttons = `
                    <div class="correction-row">
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'shot', {made: true, shotType: 'FT'})" class="correction-btn">
                            Made a free throw
                        </button>
                    </div>
                    <div class="correction-row">
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'shot', {made: false, shotType: 'FT'})" class="correction-btn">
                            Missed a free throw
                        </button>
                    </div>
                    <div class="correction-row">
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'shot', {made: true, shotType: 'FG'})" class="correction-btn">
                            Made a field goal
                        </button>
                    </div>
                    <div class="correction-row">
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'shot', {made: false, shotType: 'FG'})" class="correction-btn">
                            Missed a field goal
                        </button>
                    </div>
                    <div class="correction-row">
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'shot', {made: true, shotType: '3PT'})" class="correction-btn">
                            Made a 3-pointer
                        </button>
                    </div>
                    <div class="correction-row">
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'shot', {made: false, shotType: '3PT'})" class="correction-btn">
                            Missed a 3-pointer
                        </button>
                    </div>
                `;
            } else if (event.action === 'stat') {
                // Stat correction buttons - only show buttons for other stat types
                const currentStatType = event.statData?.type;
                const statTypes = ['REB', 'AST', 'STL', 'BLK', 'TO'];
                const otherStats = statTypes.filter(type => type !== currentStatType);

                const statNames = {
                    'REB': 'Made a rebound',
                    'AST': 'Made an assist',
                    'STL': 'Made a steal',
                    'BLK': 'Made a block',
                    'TO': 'Made a turnover'
                };

                otherStats.forEach(statType => {
                    buttons += `
                        <div class="correction-row">
                            <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'stat', {type: '${statType}'})" class="correction-btn">
                                ${statNames[statType]}
                            </button>
                        </div>
                    `;
                });
            } else if (event.action === 'foul') {
                // Foul events - no correction options, only delete
                buttons = '';
            }

            // Always add delete button at the end
            buttons += `
                <div class="correction-row delete-row">
                    <button onclick="ActionCorrectionUI.handleDelete(${event.eventIndex})" class="correction-btn btn-danger full-width">
                        <i data-lucide="trash-2"></i> Delete This Event
                    </button>
                </div>
            `;

            container.innerHTML = buttons;

            // Initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }
        },

        /**
         * Handle correction
         */
        handleCorrection(eventIndex, action, data) {
            const container = document.getElementById('correction-buttons');
            const button = event.target;

            // Animate button
            Animations.animateCorrectionButton(button, container, () => {
                // Update event
                if (action === 'shot') {
                    EventManager.editEvent(eventIndex, 'shot', {
                        shotData: {
                            ...data,
                            location: EventManager.getEventByIndex(eventIndex).shotData?.location || null
                        }
                    });
                } else if (action === 'stat') {
                    EventManager.editEvent(eventIndex, 'stat', {
                        statData: data
                    });
                }

                // Close modal
                this.close();

                // Re-render UI
                UI.render();
            });
        },

        /**
         * Handle delete stat (removes the event)
         */
        handleDeleteStat(eventIndex) {
            this.handleDelete(eventIndex);
        },

        /**
         * Handle delete
         */
        handleDelete(eventIndex) {
            const container = document.getElementById('correction-buttons');
            const button = event.target.closest('button');

            // Animate button
            Animations.animateCorrectionButton(button, container, () => {
                // Delete event
                EventManager.deleteEvent(eventIndex);

                // Close modal
                this.close();

                // Re-render UI
                UI.render();
            });
        }
    };
})();
