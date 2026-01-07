// Help UI - Help and instructions

const HelpUI = (() => {
    return {
        /**
         * Show help modal
         */
        show() {
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.id = 'help-overlay';
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-content help-modal">
                    <div class="modal-header">
                        <h2>Help & Instructions</h2>
                        <button class="icon-btn close-btn" onclick="HelpUI.close()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body help-content">
                        <section class="help-section">
                            <h3>Getting Started</h3>
                            <ol>
                                <li>Click <strong>Settings</strong> to set up your team</li>
                                <li>Enter your team name and select jersey numbers</li>
                                <li>Add player names for each jersey number</li>
                                <li>Click <strong>Save Changes</strong></li>
                            </ol>
                        </section>

                        <section class="help-section">
                            <h3>Recording Stats</h3>
                            <h4>Fouls</h4>
                            <ul>
                                <li>Select a player by clicking their jersey number</li>
                                <li>Toggle foul buttons (P1-P5 for personal, T1-T2 for technical)</li>
                                <li>Each toggle immediately saves the new foul count</li>
                                <li>Previously set fouls remain highlighted when you select the player again</li>
                            </ul>

                            <h4>Shots - Recording on Court</h4>
                            <ul>
                                <li>Select a player by clicking their jersey number</li>
                                <li>Click a shot button (Made FT, Made FG, Made 3PT, Miss FT, Miss FG, Miss 3PT)</li>
                                <li>A yellow <strong>Draw Row</strong> appears with instructions</li>
                                <li><strong>Tap</strong> on the court canvas where the shot was taken</li>
                                <li>Preview the shot location (green circle for made, red X for missed)</li>
                                <li>Click <strong>Done</strong> to save, <strong>Redraw</strong> to adjust, or <strong>Cancel</strong> to discard</li>
                                <li>Shots are sized by type: FT (small black), FG (medium), 3PT (large blue for made)</li>
                            </ul>

                            <h4>Shot Display</h4>
                            <ul>
                                <li><strong>Made shots</strong>: Filled circles (green for FG/FT, blue for 3PT)</li>
                                <li><strong>Missed shots</strong>: Red X marks</li>
                                <li><strong>Free throws</strong>: Auto-snap to FT line positions, shown in black</li>
                                <li><strong>Tap a shot</strong> in view mode to see player info</li>
                                <li>Shots auto-adjust to avoid overlapping</li>
                            </ul>

                            <h4>Other Stats</h4>
                            <ul>
                                <li>Select a player</li>
                                <li>Click stat buttons: +REB, +AST, +STL, +BLK, +TO</li>
                                <li>A 2-second animation shows the stat was recorded</li>
                            </ul>
                        </section>

                        <section class="help-section">
                            <h3>Undo & Redo</h3>
                            <ul>
                                <li><strong>Undo</strong>: Reverses the last action (archived, not deleted)</li>
                                <li><strong>Redo</strong>: Restores the last undone action</li>
                                <li>All undone actions are preserved and can be redone</li>
                            </ul>
                        </section>

                        <section class="help-section">
                            <h3>Correcting Mistakes</h3>
                            <ul>
                                <li>Click on any action in the <strong>Action Log</strong></li>
                                <li>Choose the correction or delete the event</li>
                                <li>Corrected events show in red in the Action Log</li>
                                <li>Original timestamp is preserved</li>
                            </ul>
                        </section>

                        <section class="help-section">
                            <h3>View Mode</h3>
                            <ul>
                                <li>Click <strong>View Mode</strong> button to enter view mode</li>
                                <li>All players are selected by default</li>
                                <li>Click <strong>Select</strong> button to toggle select all/clear all</li>
                                <li>Click individual jerseys to filter shots on the court</li>
                                <li>Stats show combined totals for selected players</li>
                                <li>Tap shots on the court to see player info</li>
                            </ul>
                        </section>

                        <section class="help-section">
                            <h3>Game Management</h3>
                            <p>All game management buttons are located in the <strong>Game Management</strong> section on the front page.</p>

                            <h4>History</h4>
                            <ul>
                                <li>View all saved games with scores and dates</li>
                                <li><strong>Load</strong>: Switch to a different game (enters view mode)</li>
                                <li><strong>Export</strong>: Download a specific game as JSON</li>
                                <li><strong>Delete</strong>: Remove a game (cannot delete the only game)</li>
                            </ul>

                            <h4>Export & Import</h4>
                            <ul>
                                <li><strong>Export</strong>: Download current game as JSON file</li>
                                <li><strong>Import</strong>: Load a game from JSON file</li>
                                <li>Use for backups or sharing games</li>
                            </ul>

                            <h4>Clear Game</h4>
                            <ul>
                                <li>Removes all events from the current game</li>
                                <li>Team roster and player names are preserved</li>
                                <li>Cannot be undone - use with caution!</li>
                            </ul>

                            <h4>New Game</h4>
                            <ul>
                                <li>Start a new game with a fresh event log</li>
                                <li>Current game is saved automatically</li>
                                <li>Team roster and names are preserved</li>
                                <li>Enters edit mode by default</li>
                            </ul>
                        </section>

                        <section class="help-section">
                            <h3>Tips & Tricks</h3>
                            <ul>
                                <li><strong>Auto-save</strong>: Every action is automatically saved</li>
                                <li><strong>Mobile</strong>: Works great on phones and tablets</li>
                                <li><strong>Gestures</strong>: Pinch to zoom and scroll work on the court canvas</li>
                                <li><strong>Landscape</strong>: Court always displays in landscape orientation</li>
                                <li><strong>Offline</strong>: All data is stored locally in your browser</li>
                            </ul>
                        </section>

                        <section class="help-section">
                            <h3>Abbreviations</h3>
                            <ul>
                                <li><strong>PTS</strong> - Points</li>
                                <li><strong>FT</strong> - Free Throws (M/A format)</li>
                                <li><strong>FG</strong> - Field Goals (M/A format)</li>
                                <li><strong>3PT</strong> - 3-Pointers (M/A format)</li>
                                <li><strong>REB</strong> - Rebounds</li>
                                <li><strong>AST</strong> - Assists</li>
                                <li><strong>STL</strong> - Steals</li>
                                <li><strong>BLK</strong> - Blocks</li>
                                <li><strong>TO</strong> - Turnovers</li>
                                <li><strong>FLS</strong> - Fouls (Personal + Technical)</li>
                                <li><strong>P1-P5</strong> - Personal Fouls 1-5</li>
                                <li><strong>T1-T2</strong> - Technical Fouls 1-2</li>
                            </ul>
                        </section>

                        <section class="help-section">
                            <h3>About</h3>
                            <p>
                                <strong>Basketball Scorebook 2.0</strong><br>
                                A modern, event-driven basketball stat tracking application.<br>
                                Built with vanilla JavaScript - no frameworks required.
                            </p>
                            <p>
                                All data is stored locally in your browser's localStorage.<br>
                                No cloud sync or internet connection required.
                            </p>
                        </section>
                    </div>
                    <div class="modal-footer">
                        <button onclick="HelpUI.close()" class="btn-primary">Got It!</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }
        },

        /**
         * Close help modal
         */
        close() {
            const overlay = document.getElementById('help-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
    };
})();
