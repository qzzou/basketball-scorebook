// Canvas Interaction - Touch/mouse handlers with iOS optimizations

const CanvasInteraction = (() => {
    let longPressTimer = null;
    let longPressAnimation = null;
    let longPressStartPos = { x: 0, y: 0 };
    let isLongPressing = false;

    return {
        /**
         * Setup canvas interactions (touch and mouse)
         * @param {HTMLCanvasElement} canvas - Canvas element
         * @param {Function} onLongPress - Callback for long press completion
         * @param {Function} onTap - Callback for tap
         */
        setupCanvasInteractions(canvas, onLongPress, onTap) {
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
            const canvasHeight = canvas.height / (window.devicePixelRatio || 1);

            // Disable iOS text selection and copy menu
            canvas.style.webkitUserSelect = 'none';
            canvas.style.webkitTouchCallout = 'none';
            canvas.style.userSelect = 'none';

            // Allow pinch-zoom and scroll gestures
            canvas.style.touchAction = 'manipulation';

            // Prevent context menu on long press
            canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });

            // Touch event handlers
            canvas.addEventListener('touchstart', (e) => {
                // Allow multi-touch gestures (pinch-zoom)
                if (e.touches.length > 1) {
                    this.cancelLongPress(ctx, canvasWidth, canvasHeight);
                    return;
                }

                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;

                this.startLongPress(ctx, x, y, canvasWidth, canvasHeight, onLongPress);

                // Haptic feedback on touch start (if available)
                if (window.navigator.vibrate) {
                    window.navigator.vibrate(20);
                }
            }, { passive: true });

            canvas.addEventListener('touchmove', (e) => {
                if (e.touches.length > 1) {
                    this.cancelLongPress(ctx, canvasWidth, canvasHeight);
                    return;
                }

                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;

                // Cancel long press if moved too far
                const distance = Math.sqrt(
                    Math.pow(x - longPressStartPos.x, 2) +
                    Math.pow(y - longPressStartPos.y, 2)
                );

                if (distance > 10) {
                    this.cancelLongPress(ctx, canvasWidth, canvasHeight);
                }
            }, { passive: true });

            canvas.addEventListener('touchend', (e) => {
                if (isLongPressing) {
                    // Long press was in progress but not completed
                    this.cancelLongPress(ctx, canvasWidth, canvasHeight);
                } else if (longPressTimer) {
                    // Tap detected (touchend before long press timer)
                    this.cancelLongPress(ctx, canvasWidth, canvasHeight);

                    const touch = e.changedTouches[0];
                    const rect = canvas.getBoundingClientRect();
                    const x = touch.clientX - rect.left;
                    const y = touch.clientY - rect.top;

                    if (onTap) {
                        onTap(x, y);
                    }
                }
            }, { passive: true });

            canvas.addEventListener('touchcancel', (e) => {
                this.cancelLongPress(ctx, canvasWidth, canvasHeight);
            }, { passive: true });

            // Mouse event handlers (for desktop)
            canvas.addEventListener('mousedown', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                this.startLongPress(ctx, x, y, canvasWidth, canvasHeight, onLongPress);
            });

            canvas.addEventListener('mousemove', (e) => {
                if (!longPressTimer) return;

                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const distance = Math.sqrt(
                    Math.pow(x - longPressStartPos.x, 2) +
                    Math.pow(y - longPressStartPos.y, 2)
                );

                if (distance > 10) {
                    this.cancelLongPress(ctx, canvasWidth, canvasHeight);
                }
            });

            canvas.addEventListener('mouseup', (e) => {
                if (isLongPressing) {
                    this.cancelLongPress(ctx, canvasWidth, canvasHeight);
                } else if (longPressTimer) {
                    this.cancelLongPress(ctx, canvasWidth, canvasHeight);

                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    if (onTap) {
                        onTap(x, y);
                    }
                }
            });

            canvas.addEventListener('mouseleave', (e) => {
                this.cancelLongPress(ctx, canvasWidth, canvasHeight);
            });
        },

        /**
         * Start long press detection
         */
        startLongPress(ctx, x, y, canvasWidth, canvasHeight, callback) {
            longPressStartPos = { x, y };
            isLongPressing = true;

            // Start shrinking circle animation
            longPressAnimation = Animations.showShrinkingCircle(ctx, x, y, 40, 1500);

            // Set timer for long press completion (1.5 seconds)
            longPressTimer = setTimeout(() => {
                this.completeLongPress(x, y, canvasWidth, canvasHeight, callback);
            }, 1500);
        },

        /**
         * Complete long press
         */
        completeLongPress(x, y, canvasWidth, canvasHeight, callback) {
            // Haptic feedback on completion (if available)
            if (window.navigator.vibrate) {
                window.navigator.vibrate(30);
            }

            // Convert to normalized coordinates (0-1)
            const normalizedX = x / canvasWidth;
            const normalizedY = y / canvasHeight;

            // Clear timer and animation
            this.cancelLongPress();

            // Call callback with normalized coordinates
            if (callback) {
                callback(normalizedX, normalizedY);
            }
        },

        /**
         * Cancel long press
         */
        cancelLongPress(ctx, canvasWidth, canvasHeight) {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }

            if (longPressAnimation) {
                longPressAnimation.cancel();
                longPressAnimation = null;
            }

            isLongPressing = false;

            // Redraw canvas to remove shrinking circle
            if (ctx && canvasWidth && canvasHeight) {
                ShotRenderer.redrawCanvas();
            }
        },

        /**
         * Convert canvas coordinates to normalized coordinates (0-1)
         */
        normalizeCoordinates(x, y, canvasWidth, canvasHeight) {
            return {
                x: x / canvasWidth,
                y: y / canvasHeight
            };
        },

        /**
         * Convert normalized coordinates to canvas coordinates
         */
        denormalizeCoordinates(normalizedX, normalizedY, canvasWidth, canvasHeight) {
            return {
                x: normalizedX * canvasWidth,
                y: normalizedY * canvasHeight
            };
        },

        /**
         * Find shot at coordinates
         * @param {number} x - Canvas x coordinate
         * @param {number} y - Canvas y coordinate
         * @param {number} canvasWidth - Canvas width
         * @param {number} canvasHeight - Canvas height
         * @returns {Object|null} Shot event or null
         */
        findShotAtCoordinates(x, y, canvasWidth, canvasHeight) {
            const game = DataModel.getCurrentGame();
            if (!game) return null;

            const normalizedX = x / canvasWidth;
            const normalizedY = y / canvasHeight;
            const threshold = 0.02; // 2% of canvas dimensions

            // Get all shot events with locations
            const shotEvents = game.gameEvents.filter(e =>
                e.eventStatus === 'active' &&
                e.action === 'shot' &&
                e.shotData &&
                e.shotData.location
            );

            // Find closest shot within threshold
            let closestShot = null;
            let minDistance = threshold;

            shotEvents.forEach(shot => {
                const dx = shot.shotData.location.x - normalizedX;
                const dy = shot.shotData.location.y - normalizedY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestShot = shot;
                }
            });

            return closestShot;
        }
    };
})();
