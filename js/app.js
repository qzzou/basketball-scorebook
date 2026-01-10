// Basketball Scorebook 2.0 - Main Application
// Initializes and coordinates all modules

(function() {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Basketball Scorebook 2.0 - Initializing...');

        // Setup UI button handlers
        setupButtonHandlers();

        // Setup tab bar navigation
        setupTabBar();

        // Initialize game manager (loads last game or creates new)
        GameManager.initializeApp();

        // Initialize UI
        UI.init();

        // Set initial tab based on game state
        setInitialTab();

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

        // Draw Row buttons
        const doneBtn = document.getElementById('done-btn');
        if (doneBtn) {
            doneBtn.onclick = () => UI.handleDone();
        }

        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.onclick = () => UI.handleCancel();
        }

    }

    /**
     * Setup tab bar navigation
     */
    function setupTabBar() {
        const tabBtns = document.querySelectorAll('.tab-btn');

        tabBtns.forEach(btn => {
            btn.onclick = () => {
                const tab = btn.getAttribute('data-tab');
                switchTab(tab);
            };
        });
    }

    /**
     * Switch to a specific tab
     * @param {string} tab - Tab name ('my', 'game', 'history', 'settings')
     */
    function switchTab(tab) {
        // Update tab button states
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Show/hide content based on tab
        const gameContent = document.querySelector('.app-container');
        const header = document.querySelector('.app-header');

        if (tab === 'game') {
            // Show game view
            gameContent.style.display = 'block';
            header.style.display = 'flex';
            // Hide any tab overlays
            hideTabOverlays();
            // Refresh the UI
            UI.render();
        } else if (tab === 'settings') {
            // Hide game view, show settings as inline content
            gameContent.style.display = 'none';
            header.style.display = 'none';
            hideTabOverlays();
            SettingsUI.showAsTab();
        } else if (tab === 'history') {
            // Hide game view, show history as inline content
            gameContent.style.display = 'none';
            header.style.display = 'none';
            hideTabOverlays();
            GameHistoryUI.showAsTab();
        } else if (tab === 'my') {
            // Hide game view, show my stats
            gameContent.style.display = 'none';
            header.style.display = 'none';
            hideTabOverlays();
            showMyTab();
        }

        // Scroll to top of tab view
        window.scrollTo(0, 0);

        // Reinitialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Hide all tab overlay containers
     */
    function hideTabOverlays() {
        const overlays = document.querySelectorAll('.tab-overlay');
        overlays.forEach(overlay => overlay.remove());
    }

    /**
     * Show My tab content
     */
    function showMyTab() {
        // Create my tab container
        let myContainer = document.getElementById('my-tab-container');
        if (!myContainer) {
            myContainer = document.createElement('div');
            myContainer.id = 'my-tab-container';
            myContainer.className = 'tab-overlay';
            document.body.insertBefore(myContainer, document.querySelector('.tab-bar'));
        }

        const game = DataModel.getCurrentGame();

        myContainer.innerHTML = `
            <div class="my-tab-content" style="padding-bottom: 80px;">
                <h2 style="color: #667eea; margin-bottom: 0.5rem;">Quick Stats</h2>
                <p style="font-size: 0.85rem; color: #666; margin-bottom: 1rem;">
                    Custom counters for tracking anything you want. These are separate from official game stats.
                </p>

                <div class="my-stats-card">
                    ${game ? `<h3 style="margin-bottom: 0.5rem;">${game.teamName} - ${game.gameName}</h3>` : ''}
                    ${HotButtonsUI.render()}
                </div>

                <button class="btn-secondary" style="width: 100%; margin-top: 1rem;" onclick="HotButtonsUI.resetAllCounters()">
                    Reset All Counters
                </button>
                <button class="btn-secondary" style="width: 100%; margin-top: 0.5rem;" onclick="HotButtonsUI.removeAllButtons()">
                    Remove All
                </button>
                <button class="btn-secondary" style="width: 100%; margin-top: 0.5rem;" onclick="HotButtonsUI.loadDefaultButtons()">
                    Load Default
                </button>
            </div>
        `;

        // Setup hot button handlers
        HotButtonsUI.setupHandlers();
    }

    /**
     * Determine and set the initial landing tab
     */
    function setInitialTab() {
        const game = DataModel.getCurrentGame();

        // If no game or no players, land on settings
        if (!game || game.teamRoster.length === 0) {
            switchTab('settings');
        } else {
            // If game exists with players, land on My tab
            switchTab('my');
        }
    }

    // Expose modules to window for onclick handlers
    window.UI = UI;
    window.SettingsUI = SettingsUI;
    window.GameHistoryUI = GameHistoryUI;
    window.ActionCorrectionUI = ActionCorrectionUI;
    window.HotButtonsUI = HotButtonsUI;
    window.PDFExport = PDFExport;
    window.switchTab = switchTab;
    window.setInitialTab = setInitialTab;
    window.showMyTab = showMyTab;

})();
