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
                // Shot correction buttons
                buttons = `
                    <div class="correction-row">
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'shot', {made: true, shotType: 'FT'})" class="correction-btn">
                            +1 (Make FT)
                        </button>
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'shot', {made: false, shotType: 'FT'})" class="correction-btn">
                            Miss 1 (Miss FT)
                        </button>
                    </div>
                    <div class="correction-row">
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'shot', {made: true, shotType: 'FG'})" class="correction-btn">
                            +2 (Make FG)
                        </button>
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'shot', {made: false, shotType: 'FG'})" class="correction-btn">
                            Miss 2 (Miss FG)
                        </button>
                    </div>
                    <div class="correction-row">
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'shot', {made: true, shotType: '3PT'})" class="correction-btn">
                            +3 (Make 3PT)
                        </button>
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'shot', {made: false, shotType: '3PT'})" class="correction-btn">
                            Miss 3 (Miss 3PT)
                        </button>
                    </div>
                `;
            } else if (event.action === 'stat') {
                // Stat correction buttons
                buttons = `
                    <div class="correction-row">
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'stat', {type: 'REB'})" class="correction-btn">
                            +REB
                        </button>
                        <button onclick="ActionCorrectionUI.handleDeleteStat(${event.eventIndex})" class="correction-btn btn-danger">
                            -REB
                        </button>
                    </div>
                    <div class="correction-row">
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'stat', {type: 'AST'})" class="correction-btn">
                            +AST
                        </button>
                        <button onclick="ActionCorrectionUI.handleDeleteStat(${event.eventIndex})" class="correction-btn btn-danger">
                            -AST
                        </button>
                    </div>
                    <div class="correction-row">
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'stat', {type: 'STL'})" class="correction-btn">
                            +STL
                        </button>
                        <button onclick="ActionCorrectionUI.handleDeleteStat(${event.eventIndex})" class="correction-btn btn-danger">
                            -STL
                        </button>
                    </div>
                    <div class="correction-row">
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'stat', {type: 'BLK'})" class="correction-btn">
                            +BLK
                        </button>
                        <button onclick="ActionCorrectionUI.handleDeleteStat(${event.eventIndex})" class="correction-btn btn-danger">
                            -BLK
                        </button>
                    </div>
                    <div class="correction-row">
                        <button onclick="ActionCorrectionUI.handleCorrection(${event.eventIndex}, 'stat', {type: 'TO'})" class="correction-btn">
                            +TO
                        </button>
                        <button onclick="ActionCorrectionUI.handleDeleteStat(${event.eventIndex})" class="correction-btn btn-danger">
                            -TO
                        </button>
                    </div>
                `;
            } else if (event.action === 'foul') {
                // Foul events can only be deleted
                buttons = `
                    <p class="info-message">Foul events cannot be corrected. Use the foul buttons to adjust the player's foul count.</p>
                `;
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
