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

        console.log('Basketball Scorebook 2.0 - Ready!');
    });

    /**
     * Setup button handlers
     */
    function setupButtonHandlers() {
        // New Game button
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.onclick = () => {
                if (confirm('Create a new game? Current game will be saved.')) {
                    GameManager.createNewGame(true); // Keep roster
                }
            };
        }

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

        // Edit/View mode toggle
        const editBtn = document.getElementById('edit-btn');
        const viewBtn = document.getElementById('view-btn');

        if (editBtn) {
            editBtn.onclick = () => {
                GameManager.switchToEditMode();
                editBtn.classList.add('active');
                if (viewBtn) viewBtn.classList.remove('active');
            };
        }

        if (viewBtn) {
            viewBtn.onclick = () => {
                GameManager.switchToViewMode();
                viewBtn.classList.add('active');
                if (editBtn) editBtn.classList.remove('active');
            };
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
    }

    // Expose modules to window for onclick handlers
    window.UI = UI;
    window.SettingsUI = SettingsUI;
    window.GameHistoryUI = GameHistoryUI;
    window.ActionCorrectionUI = ActionCorrectionUI;
    window.HelpUI = HelpUI;

})();
