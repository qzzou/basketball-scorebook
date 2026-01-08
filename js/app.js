// Basketball Scorebook 2.0 - Main Application
// Initializes and coordinates all modules

(function() {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Basketball Scorebook 2.0 - Initializing...');

        // Setup UI button handlers
        setupButtonHandlers();

        // Initialize game manager (loads last game or creates new)
        GameManager.initializeApp();

        // Initialize UI
        UI.init();

        // Listen for mode changes to update dropdown label
        EventBus.on('mode:changed', (mode) => {
            const modeLabel = document.getElementById('mode-label');
            if (modeLabel) {
                modeLabel.textContent = mode === 'edit' ? 'Editing' : 'View Only';
            }
        });

        console.log('Basketball Scorebook 2.0 - Ready!');
    });

    /**
     * Setup button handlers
     */
    function setupButtonHandlers() {
        // Undo button
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.onclick = () => EventManager.undoLastEvent();
        }

        // Redo button
        const redoBtn = document.getElementById('redo-btn');
        if (redoBtn) {
            redoBtn.onclick = () => EventManager.redoLastEvent();
        }

        // Select button (view mode)
        const selectBtn = document.getElementById('select-btn');
        if (selectBtn) {
            selectBtn.onclick = () => UI.handleSelectToggle();
        }

        // Mode dropdown toggle
        const modeBtn = document.getElementById('mode-btn');
        const modeMenu = document.getElementById('mode-menu');
        const modeLabel = document.getElementById('mode-label');

        if (modeBtn && modeMenu) {
            // Toggle dropdown on button click
            modeBtn.onclick = (e) => {
                e.stopPropagation();
                modeMenu.classList.toggle('show');
            };

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                modeMenu.classList.remove('show');
            });

            // Handle mode selection
            const modeOptions = document.querySelectorAll('.mode-option');
            modeOptions.forEach(option => {
                option.onclick = () => {
                    const mode = option.getAttribute('data-mode');
                    const label = option.textContent;

                    if (mode === 'edit') {
                        GameManager.switchToEditMode();
                    } else {
                        GameManager.switchToViewMode();
                    }

                    if (modeLabel) {
                        modeLabel.textContent = label;
                    }

                    modeMenu.classList.remove('show');
                };
            });
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.onclick = () => SettingsUI.show();
        }

        // Help button
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            helpBtn.onclick = () => HelpUI.show();
        }

        // Draw Row buttons
        const doneBtn = document.getElementById('done-btn');
        if (doneBtn) {
            doneBtn.onclick = () => UI.handleDone();
        }

        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.onclick = () => UI.handleCancel();
        }

        // Game Management buttons
        const historyBtn = document.getElementById('history-btn');
        if (historyBtn) {
            historyBtn.onclick = () => GameHistoryUI.show();
        }

        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.onclick = () => {
                const game = DataModel.getCurrentGame();
                if (game) {
                    Storage.exportGameAsJSON(game.gameId);
                }
            };
        }

        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.onclick = () => {
                PDFExport.generatePDF();
            };
        }

        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.onclick = () => SettingsUI.handleImport();
        }

        const clearGameBtn = document.getElementById('clear-game-btn');
        if (clearGameBtn) {
            clearGameBtn.onclick = () => {
                if (confirm('Clear all events for this game? This cannot be undone.')) {
                    GameManager.clearCurrentGame();
                }
            };
        }

        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.onclick = () => {
                if (confirm('Create a new game? Current game will be saved.')) {
                    GameManager.createNewGame(true); // Keep roster
                }
            };
        }
    }

    // Expose modules to window for onclick handlers
    window.UI = UI;
    window.SettingsUI = SettingsUI;
    window.GameHistoryUI = GameHistoryUI;
    window.ActionCorrectionUI = ActionCorrectionUI;
    window.HelpUI = HelpUI;
    window.PDFExport = PDFExport;

})();
