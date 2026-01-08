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
                            </ol>
                        </section>

                        <section class="help-section">
                            <h3>Recording Stats</h3>
                            <h4>Shots - Recording on Court</h4>
                            <ul>
                                <li>Select a player by clicking their jersey number</li>
                                <li>Click a shot button (made or missed free throw, field goal, or 3-pointer)</li>
                                <li>A yellow <strong>Draw Row</strong> appears with instructions</li>
                                <li><strong>Tap</strong> on the court canvas near where the shot was taken</li>
                                <li>The shot location will automatically snap to the appropriate zone:
                                    <ul>
                                        <li><strong>3PT shots</strong>: Snap outside the 3-point arc</li>
                                        <li><strong>2PT shots</strong>: Snap inside the 3-point arc</li>
                                        <li><strong>Free throws</strong>: Snap to the free throw area between the FT line and 3PT arc</li>
                                    </ul>
                                </li>
                                <li>Preview the shot location (green circle for made, red X for missed)</li>
                                <li>Tap again to adjust location, or click <strong>Done</strong> to save, or click <strong>Cancel</strong> to discard</li>
                            </ul>

                            <h4>Shot Display</h4>
                            <ul>
                                <li><strong>Made shots</strong>: Filled circles (black for FT, green for FG, blue for 3PT)</li>
                                <li><strong>Missed shots</strong>: Red X marks</li>
                                <li><strong>Shot sizes</strong>: FT (small), FG (medium), 3PT (large)</li>
                                <li><strong>Automatic positioning</strong>: Shots snap to correct zones and auto-adjust to avoid overlapping when possible</li>
                            </ul>

                            <h4>Other Stats</h4>
                            <ul>
                                <li>Select a player</li>
                                <li>Click stat buttons: +REB, +AST, +STL, +BLK, +TO, +FOUL, +TECH</li>
                                <li>A 2-second animation shows the stat was recorded</li>
                            </ul>
                        </section>

                        <section class="help-section">
                            <h3>Undo & Redo</h3>
                            <ul>
                                <li><strong>Undo</strong>: Reverses the last action from clicking shot buttons or stat buttons (archived, not deleted)</li>
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
                                <li><strong>Note:</strong> Corrections made in the Action Log cannot be undone</li>
                            </ul>
                        </section>

                        <section class="help-section">
                            <h3>View Mode</h3>
                            <ul>
                                <li>Click the mode dropdown and select <strong>View Only</strong> to enter view mode</li>
                                <li>All players are selected by default</li>
                                <li>Click <strong>Select</strong> button to toggle between select all and clear all</li>
                                <li>Click individual jersey numbers to select/deselect specific players</li>
                                <li>The court shows only shots from selected players</li>
                                <li>Stats display combined totals for all selected players</li>
                                <li>Switch back to <strong>Editing</strong> mode to record new stats</li>
                            </ul>
                        </section>

                        <section class="help-section">
                            <h3>Game Management</h3>
                            <p>All game management buttons are located in the <strong>Game Management</strong> section on the main page.</p>

                            <h4>History</h4>
                            <ul>
                                <li>View all saved games with team names, scores, and dates</li>
                                <li><strong>Load</strong>: Switch to a different game (automatically enters view mode)</li>
                                <li><strong>Export</strong>: Download a specific game as JSON file</li>
                                <li><strong>Delete</strong>: Remove a game permanently (cannot delete if it's the only game)</li>
                            </ul>

                            <h4>Export & Import</h4>
                            <ul>
                                <li><strong>Export</strong>: Download the current game as a JSON file</li>
                                <li><strong>Import</strong>: Load a game from a JSON file</li>
                                <li>Perfect for backups, sharing games, or transferring between devices</li>
                            </ul>

                            <h4>Clear Game</h4>
                            <ul>
                                <li>Removes all events (shots, fouls, stats) from the current game</li>
                                <li>Team roster and player names are preserved</li>
                                <li>Returns to editing mode with no player selected</li>
                                <li><strong>Warning:</strong> Cannot be undone - use with caution!</li>
                            </ul>

                            <h4>New Game</h4>
                            <ul>
                                <li>Creates a new game with a fresh event log</li>
                                <li>Current game is automatically saved before creating the new one</li>
                                <li>Team roster and player names are copied to the new game</li>
                                <li>Automatically switches to editing mode</li>
                            </ul>
                        </section>

                        <section class="help-section">
                            <h3>Tips & Tricks</h3>
                            <ul>
                                <li><strong>Auto-save</strong>: Every action is automatically saved to your browser</li>
                                <li><strong>Smart snapping</strong>: Shots automatically position to the correct zones - just tap near the location</li>
                                <li><strong>Quick corrections</strong>: Use Undo for recent mistakes, or click actions in the Action Log for older corrections</li>
                                <li><strong>Mobile friendly</strong>: Works great on phones and tablets</li>
                                <li><strong>Offline ready</strong>: All data is stored locally - no internet connection required</li>
                                <li><strong>Export regularly</strong>: Back up your games by exporting as JSON files</li>
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
