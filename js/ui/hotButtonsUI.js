// Hot Buttons UI - Independent stat counters (not tied to game events)
// Two modes: 'single' (one green light bar) or 'dual' (green+red light bars for made/attempt)

const HotButtonsUI = (() => {
    let pressTimer = null;
    let isLongPress = false;

    return {
        /**
         * Render hot buttons grid (2 columns x 8 rows)
         * @returns {string} HTML string for hot buttons
         */
        render() {
            const hotButtons = Storage.getHotButtons();

            let buttonsHtml = hotButtons.map(btn => {
                const mode = btn.mode || 'single'; // 'single' or 'dual'
                const count = btn.count || 0;
                const made = btn.made || 0;
                const attempts = btn.attempts || 0;

                if (mode === 'dual') {
                    // Dual mode: made/attempts with green+red light bars
                    return `
                        <div class="hot-button hot-button-dual" data-button-id="${btn.id}">
                            <div class="hot-button-main">
                                <div class="hot-button-stat">${made}/${attempts}</div>
                                <div class="hot-button-label">${btn.label}</div>
                            </div>
                            <div class="hot-button-lights">
                                <div class="light-bar light-green" data-action="made" data-button-id="${btn.id}">+</div>
                                <div class="light-bar light-red" data-action="miss" data-button-id="${btn.id}">&minus;</div>
                            </div>
                        </div>
                    `;
                } else {
                    // Single mode: count with one green light bar
                    return `
                        <div class="hot-button hot-button-single" data-button-id="${btn.id}">
                            <div class="hot-button-main">
                                <div class="hot-button-stat">${count}</div>
                                <div class="hot-button-label">${btn.label}</div>
                            </div>
                            <div class="hot-button-lights">
                                <div class="light-bar light-green" data-action="increment" data-button-id="${btn.id}">+</div>
                            </div>
                        </div>
                    `;
                }
            }).join('');

            // Add placeholder button if less than 16 buttons
            if (hotButtons.length < 16) {
                buttonsHtml += `
                    <div class="hot-button hot-button-add" onclick="HotButtonsUI.showAddModal()">
                        <div class="hot-button-plus">+</div>
                    </div>
                `;
            }

            return `
                <div class="hot-buttons-grid">
                    ${buttonsHtml}
                </div>
                <p style="font-size: 0.75rem; color: #999; text-align: center; margin-top: 0.5rem;">
                    Tap +/- to count, long press button to edit
                </p>
            `;
        },

        /**
         * Setup event handlers for hot buttons
         */
        setupHandlers() {
            // Setup long press on main button area for edit
            const buttons = document.querySelectorAll('.hot-button[data-button-id]');
            buttons.forEach(btn => {
                const buttonId = btn.dataset.buttonId;
                const mainArea = btn.querySelector('.hot-button-main');
                if (!mainArea) return;

                const startPress = (e) => {
                    isLongPress = false;
                    pressTimer = setTimeout(() => {
                        isLongPress = true;
                        this.showEditModal(buttonId);
                    }, 600);
                };

                const endPress = (e) => {
                    clearTimeout(pressTimer);
                    // No action on short tap of main area
                };

                const cancelPress = () => {
                    clearTimeout(pressTimer);
                };

                mainArea.addEventListener('touchstart', startPress);
                mainArea.addEventListener('touchend', endPress);
                mainArea.addEventListener('touchcancel', cancelPress);
                mainArea.addEventListener('touchmove', cancelPress);
                mainArea.addEventListener('mousedown', startPress);
                mainArea.addEventListener('mouseup', endPress);
                mainArea.addEventListener('mouseleave', cancelPress);
            });

            // Setup tap handlers on light bars
            const lightBars = document.querySelectorAll('.light-bar');
            lightBars.forEach(bar => {
                const action = bar.dataset.action;
                const buttonId = bar.dataset.buttonId;

                const handleTap = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleLightBarTap(buttonId, action);
                };

                bar.addEventListener('touchend', handleTap);
                bar.addEventListener('click', handleTap);
            });
        },

        /**
         * Handle tap on light bar
         */
        handleLightBarTap(buttonId, action) {
            const hotButtons = Storage.getHotButtons();
            const btn = hotButtons.find(b => b.id === buttonId);
            if (!btn) return;

            if (action === 'increment') {
                // Single mode: increment count
                btn.count = (btn.count || 0) + 1;
            } else if (action === 'made') {
                // Dual mode: increment both made and attempts
                btn.made = (btn.made || 0) + 1;
                btn.attempts = (btn.attempts || 0) + 1;
            } else if (action === 'miss') {
                // Dual mode: increment attempts only
                btn.attempts = (btn.attempts || 0) + 1;
            }

            Storage.saveHotButtons(hotButtons);

            // Update display
            const buttonEl = document.querySelector(`.hot-button[data-button-id="${buttonId}"]`);
            if (buttonEl) {
                const statEl = buttonEl.querySelector('.hot-button-stat');
                if (statEl) {
                    if (btn.mode === 'dual') {
                        statEl.textContent = `${btn.made || 0}/${btn.attempts || 0}`;
                    } else {
                        statEl.textContent = btn.count || 0;
                    }
                    // Animation
                    statEl.style.transform = 'scale(1.2)';
                    setTimeout(() => {
                        statEl.style.transform = 'scale(1)';
                    }, 100);
                }
            }

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        },

        /**
         * Show add button modal
         */
        showAddModal() {
            this.showEditModal(null);
        },

        /**
         * Show edit button modal
         */
        showEditModal(buttonId) {
            const hotButtons = Storage.getHotButtons();
            const existingButton = buttonId ? hotButtons.find(b => b.id === buttonId) : null;
            const mode = existingButton?.mode || 'single';
            const count = existingButton?.count || 0;
            const made = existingButton?.made || 0;
            const attempts = existingButton?.attempts || 0;

            const overlay = document.createElement('div');
            overlay.id = 'hot-button-modal-overlay';
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-content" style="max-width: 320px;">
                    <div class="modal-header">
                        <h2>${existingButton ? 'Edit Button' : 'Add Button'}</h2>
                        <button class="icon-btn close-btn" onclick="HotButtonsUI.closeModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body" style="padding: 1rem;">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Button Label</label>
                            <input type="text" id="hb-label"
                                value="${existingButton ? existingButton.label : ''}"
                                placeholder="e.g., Team REB, Audrey 3PT"
                                style="width: 100%; padding: 0.75rem; font-size: 1rem; border: 1px solid #ddd; border-radius: 8px;">
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Counter Type</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <button id="mode-single" class="btn-secondary ${mode === 'single' ? 'selected' : ''}" style="flex: 1;" onclick="HotButtonsUI.setMode('single')">
                                    Single
                                </button>
                                <button id="mode-dual" class="btn-secondary ${mode === 'dual' ? 'selected' : ''}" style="flex: 1;" onclick="HotButtonsUI.setMode('dual')">
                                    Made/Att
                                </button>
                            </div>
                            <p style="font-size: 0.75rem; color: #666; margin-top: 0.5rem;">
                                Single: one counter. Made/Att: tracks made and attempts separately.
                            </p>
                        </div>
                        ${existingButton ? `
                        <div id="count-section" style="margin-bottom: 1rem; ${mode === 'single' ? '' : 'display: none;'}">
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Count: <span id="hb-count-display">${count}</span></label>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn-secondary" style="flex: 1;" onclick="HotButtonsUI.adjustCount('${buttonId}', -1)">- 1</button>
                                <button class="btn-secondary" style="flex: 1;" onclick="HotButtonsUI.adjustCount('${buttonId}', 1)">+ 1</button>
                                <button class="btn-secondary" style="flex: 1;" onclick="HotButtonsUI.resetCount('${buttonId}')">Reset</button>
                            </div>
                        </div>
                        <div id="dual-count-section" style="margin-bottom: 1rem; ${mode === 'dual' ? '' : 'display: none;'}">
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Made/Attempts: <span id="hb-made-display">${made}</span>/<span id="hb-attempts-display">${attempts}</span></label>
                            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <button class="btn-secondary" style="flex: 1; background: #e8f5e9;" onclick="HotButtonsUI.adjustDual('${buttonId}', 'made', -1)">Made -1</button>
                                <button class="btn-secondary" style="flex: 1; background: #e8f5e9;" onclick="HotButtonsUI.adjustDual('${buttonId}', 'made', 1)">Made +1</button>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn-secondary" style="flex: 1; background: #ffebee;" onclick="HotButtonsUI.adjustDual('${buttonId}', 'attempts', -1)">Att -1</button>
                                <button class="btn-secondary" style="flex: 1; background: #ffebee;" onclick="HotButtonsUI.adjustDual('${buttonId}', 'attempts', 1)">Att +1</button>
                            </div>
                            <button class="btn-secondary" style="width: 100%; margin-top: 0.5rem;" onclick="HotButtonsUI.resetDual('${buttonId}')">Reset Both</button>
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Reorder</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn-secondary" style="flex: 1;" onclick="HotButtonsUI.moveButton('${buttonId}', -1)">&larr; Left</button>
                                <button class="btn-secondary" style="flex: 1;" onclick="HotButtonsUI.moveButton('${buttonId}', 1)">Right &rarr;</button>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer" style="display: flex; gap: 0.5rem; padding: 1rem;">
                        ${existingButton ? `<button class="btn-danger" style="flex: 1;" onclick="HotButtonsUI.deleteButton('${buttonId}')">Delete</button>` : ''}
                        <button class="btn-primary" style="flex: 2;" onclick="HotButtonsUI.saveButton('${buttonId || ''}')">
                            ${existingButton ? 'Save' : 'Add'}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Store current mode for save
            overlay.dataset.mode = mode;

            if (window.lucide) {
                lucide.createIcons();
            }

            setTimeout(() => {
                document.getElementById('hb-label')?.focus();
            }, 100);
        },

        /**
         * Set mode in modal
         */
        setMode(mode) {
            const overlay = document.getElementById('hot-button-modal-overlay');
            if (overlay) {
                overlay.dataset.mode = mode;
            }

            // Update button styles
            document.getElementById('mode-single')?.classList.toggle('selected', mode === 'single');
            document.getElementById('mode-dual')?.classList.toggle('selected', mode === 'dual');

            // Show/hide count sections
            const countSection = document.getElementById('count-section');
            const dualCountSection = document.getElementById('dual-count-section');
            if (countSection) countSection.style.display = mode === 'single' ? '' : 'none';
            if (dualCountSection) dualCountSection.style.display = mode === 'dual' ? '' : 'none';
        },

        /**
         * Close modal
         */
        closeModal() {
            const overlay = document.getElementById('hot-button-modal-overlay');
            if (overlay) {
                overlay.remove();
            }
        },

        /**
         * Save button from modal
         */
        saveButton(buttonId) {
            const label = document.getElementById('hb-label').value.trim();
            const overlay = document.getElementById('hot-button-modal-overlay');
            const mode = overlay?.dataset.mode || 'single';

            if (!label) {
                alert('Please enter a label');
                return;
            }

            if (buttonId) {
                Storage.updateHotButton(buttonId, { label, mode });
            } else {
                Storage.addHotButton({ label, count: 0, made: 0, attempts: 0, mode });
            }

            this.closeModal();
            this.refreshHotButtonsGrid();
        },

        /**
         * Adjust count for single mode
         */
        adjustCount(buttonId, delta) {
            const hotButtons = Storage.getHotButtons();
            const btn = hotButtons.find(b => b.id === buttonId);
            if (!btn) return;

            btn.count = Math.max(0, (btn.count || 0) + delta);
            Storage.saveHotButtons(hotButtons);

            const countDisplay = document.getElementById('hb-count-display');
            if (countDisplay) {
                countDisplay.textContent = btn.count;
            }

            this.updateButtonDisplay(buttonId);
        },

        /**
         * Adjust made/attempts for dual mode
         */
        adjustDual(buttonId, field, delta) {
            const hotButtons = Storage.getHotButtons();
            const btn = hotButtons.find(b => b.id === buttonId);
            if (!btn) return;

            if (field === 'made') {
                btn.made = Math.max(0, (btn.made || 0) + delta);
                // Made can't exceed attempts
                if (btn.made > (btn.attempts || 0)) {
                    btn.attempts = btn.made;
                }
            } else {
                btn.attempts = Math.max(0, (btn.attempts || 0) + delta);
                // Attempts can't be less than made
                if (btn.attempts < (btn.made || 0)) {
                    btn.made = btn.attempts;
                }
            }
            Storage.saveHotButtons(hotButtons);

            const madeDisplay = document.getElementById('hb-made-display');
            const attemptsDisplay = document.getElementById('hb-attempts-display');
            if (madeDisplay) madeDisplay.textContent = btn.made || 0;
            if (attemptsDisplay) attemptsDisplay.textContent = btn.attempts || 0;

            this.updateButtonDisplay(buttonId);
        },

        /**
         * Reset count for single mode
         */
        resetCount(buttonId) {
            Storage.updateHotButton(buttonId, { count: 0 });

            const countDisplay = document.getElementById('hb-count-display');
            if (countDisplay) {
                countDisplay.textContent = '0';
            }

            this.updateButtonDisplay(buttonId);
        },

        /**
         * Reset made/attempts for dual mode
         */
        resetDual(buttonId) {
            Storage.updateHotButton(buttonId, { made: 0, attempts: 0 });

            const madeDisplay = document.getElementById('hb-made-display');
            const attemptsDisplay = document.getElementById('hb-attempts-display');
            if (madeDisplay) madeDisplay.textContent = '0';
            if (attemptsDisplay) attemptsDisplay.textContent = '0';

            this.updateButtonDisplay(buttonId);
        },

        /**
         * Update button display in the grid
         */
        updateButtonDisplay(buttonId) {
            const hotButtons = Storage.getHotButtons();
            const btn = hotButtons.find(b => b.id === buttonId);
            if (!btn) return;

            const buttonEl = document.querySelector(`.hot-button[data-button-id="${buttonId}"]`);
            if (buttonEl) {
                const statEl = buttonEl.querySelector('.hot-button-stat');
                if (statEl) {
                    if (btn.mode === 'dual') {
                        statEl.textContent = `${btn.made || 0}/${btn.attempts || 0}`;
                    } else {
                        statEl.textContent = btn.count || 0;
                    }
                }
            }
        },

        /**
         * Delete a button
         */
        deleteButton(buttonId) {
            if (confirm('Delete this button?')) {
                Storage.deleteHotButton(buttonId);
                this.closeModal();
                this.refreshHotButtonsGrid();
            }
        },

        /**
         * Move a button
         */
        moveButton(buttonId, direction) {
            const hotButtons = Storage.getHotButtons();
            const index = hotButtons.findIndex(b => b.id === buttonId);

            if (index < 0) return;

            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= hotButtons.length) return;

            [hotButtons[index], hotButtons[newIndex]] = [hotButtons[newIndex], hotButtons[index]];
            Storage.saveHotButtons(hotButtons);
            this.refreshHotButtonsGrid();
        },

        /**
         * Refresh hot buttons grid
         */
        refreshHotButtonsGrid() {
            const gridContainer = document.querySelector('.hot-buttons-grid');
            if (!gridContainer) return;

            const hotButtons = Storage.getHotButtons();

            let buttonsHtml = hotButtons.map(btn => {
                const mode = btn.mode || 'single';
                const count = btn.count || 0;
                const made = btn.made || 0;
                const attempts = btn.attempts || 0;

                if (mode === 'dual') {
                    return `
                        <div class="hot-button hot-button-dual" data-button-id="${btn.id}">
                            <div class="hot-button-main">
                                <div class="hot-button-stat">${made}/${attempts}</div>
                                <div class="hot-button-label">${btn.label}</div>
                            </div>
                            <div class="hot-button-lights">
                                <div class="light-bar light-green" data-action="made" data-button-id="${btn.id}">+</div>
                                <div class="light-bar light-red" data-action="miss" data-button-id="${btn.id}">&minus;</div>
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="hot-button hot-button-single" data-button-id="${btn.id}">
                            <div class="hot-button-main">
                                <div class="hot-button-stat">${count}</div>
                                <div class="hot-button-label">${btn.label}</div>
                            </div>
                            <div class="hot-button-lights">
                                <div class="light-bar light-green" data-action="increment" data-button-id="${btn.id}">+</div>
                            </div>
                        </div>
                    `;
                }
            }).join('');

            if (hotButtons.length < 16) {
                buttonsHtml += `
                    <div class="hot-button hot-button-add" onclick="HotButtonsUI.showAddModal()">
                        <div class="hot-button-plus">+</div>
                    </div>
                `;
            }

            gridContainer.innerHTML = buttonsHtml;
            this.setupHandlers();
        },

        /**
         * Reset all hot button counters
         */
        resetAllCounters() {
            if (!confirm('Reset all counters to 0? Labels will be kept.')) {
                return;
            }

            const hotButtons = Storage.getHotButtons();
            hotButtons.forEach(btn => {
                btn.count = 0;
                btn.made = 0;
                btn.attempts = 0;
            });
            Storage.saveHotButtons(hotButtons);
            this.refreshHotButtonsGrid();
        }
    };
})();
