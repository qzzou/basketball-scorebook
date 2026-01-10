// Canvas Interaction - Touch/mouse handlers with iOS optimizations
// Implements long-press (1 second) to place shots with shrinking circle animation

const CanvasInteraction = (() => {
    // Store current callback to avoid duplicate listeners
    let currentOnTap = null;
    let listenersAttached = false;

    // Long press state
    let pressTimer = null;
    let animationFrame = null;
    let pressStartTime = null;
    let pressX = null;
    let pressY = null;
    let isPressing = false;
    let canvasRef = null;

    const LONG_PRESS_DURATION = 1000; // 1 second
    const INITIAL_RADIUS = 60; // Starting radius in pixels
    const FINAL_RADIUS = 8; // Ending radius in pixels

    /**
     * Draw shrinking circle animation
     */
    function drawPressAnimation(canvas, x, y, progress) {
        // Get the overlay canvas or create one
        let overlay = document.getElementById('press-animation-overlay');
        if (!overlay) {
            overlay = document.createElement('canvas');
            overlay.id = 'press-animation-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '20';
            canvas.parentElement.appendChild(overlay);
        }

        // Match overlay size to canvas display size
        const rect = canvas.getBoundingClientRect();
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
        overlay.width = rect.width * (window.devicePixelRatio || 1);
        overlay.height = rect.height * (window.devicePixelRatio || 1);

        const ctx = overlay.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        ctx.scale(dpr, dpr);

        // Clear previous frame
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Calculate shrinking radius (from INITIAL_RADIUS to FINAL_RADIUS)
        const radius = INITIAL_RADIUS - (INITIAL_RADIUS - FINAL_RADIUS) * progress;

        // Draw unfilled black circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    /**
     * Clear the animation overlay
     */
    function clearPressAnimation() {
        const overlay = document.getElementById('press-animation-overlay');
        if (overlay) {
            const ctx = overlay.getContext('2d');
            ctx.clearRect(0, 0, overlay.width, overlay.height);
        }
    }

    /**
     * Animate the press circle
     */
    function animatePress(canvas, x, y) {
        if (!isPressing) return;

        const elapsed = Date.now() - pressStartTime;
        const progress = Math.min(elapsed / LONG_PRESS_DURATION, 1);

        drawPressAnimation(canvas, x, y, progress);

        if (progress < 1) {
            animationFrame = requestAnimationFrame(() => animatePress(canvas, x, y));
        }
    }

    /**
     * Cancel press and animation
     */
    function cancelPress() {
        isPressing = false;
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        clearPressAnimation();
        pressStartTime = null;
        pressX = null;
        pressY = null;
    }

    /**
     * Get coordinates from touch or mouse event
     */
    function getEventCoordinates(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    return {
        /**
         * Setup canvas interactions (touch and mouse)
         * @param {HTMLCanvasElement} canvas - Canvas element
         * @param {Function} onTap - Callback for long-press tap (receives normalized x, y)
         * @param {Function} onTapPixels - Callback for tap (receives pixel x, y) - not used
         */
        setupCanvasInteractions(canvas, onTap, onTapPixels) {
            if (!canvas) return;

            // Update the callback reference (allows changing behavior without re-adding listeners)
            currentOnTap = onTap;
            canvasRef = canvas;

            // Only attach listeners once per canvas
            if (listenersAttached) return;
            listenersAttached = true;

            // Disable iOS text selection and copy menu
            canvas.style.webkitUserSelect = 'none';
            canvas.style.webkitTouchCallout = 'none';
            canvas.style.userSelect = 'none';

            // Allow pinch-zoom and scroll gestures
            canvas.style.touchAction = 'manipulation';

            // Prevent context menu
            canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });

            // Handle press start
            function handlePressStart(e) {
                // Only handle single touch
                if (e.touches && e.touches.length !== 1) return;

                // Only enable long press if there are unplaced shots
                const hasUnplacedShots = UI && typeof UI.getUnplacedShots === 'function' && UI.getUnplacedShots().length > 0;
                if (!hasUnplacedShots) return;

                const coords = getEventCoordinates(e, canvas);
                pressX = coords.x;
                pressY = coords.y;
                pressStartTime = Date.now();
                isPressing = true;

                // Start animation
                animatePress(canvas, pressX, pressY);

                // Set timer for long press completion
                pressTimer = setTimeout(() => {
                    if (isPressing && currentOnTap) {
                        // Calculate normalized coordinates
                        const cw = canvas.width / (window.devicePixelRatio || 1);
                        const ch = canvas.height / (window.devicePixelRatio || 1);
                        const normalizedX = pressX / cw;
                        const normalizedY = pressY / ch;

                        // Haptic feedback
                        if (window.navigator.vibrate) {
                            window.navigator.vibrate(30);
                        }

                        currentOnTap(normalizedX, normalizedY);
                    }
                    cancelPress();
                }, LONG_PRESS_DURATION);
            }

            // Handle press end
            function handlePressEnd(e) {
                cancelPress();
            }

            // Handle press move (cancel if moved too far)
            function handlePressMove(e) {
                if (!isPressing) return;

                const coords = getEventCoordinates(e, canvas);
                const dx = coords.x - pressX;
                const dy = coords.y - pressY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Cancel if moved more than 20 pixels
                if (distance > 20) {
                    cancelPress();
                }
            }

            // Touch event handlers
            canvas.addEventListener('touchstart', handlePressStart, { passive: true });
            canvas.addEventListener('touchend', handlePressEnd, { passive: true });
            canvas.addEventListener('touchcancel', handlePressEnd, { passive: true });
            canvas.addEventListener('touchmove', handlePressMove, { passive: true });

            // Mouse event handlers (for desktop)
            canvas.addEventListener('mousedown', handlePressStart);
            canvas.addEventListener('mouseup', handlePressEnd);
            canvas.addEventListener('mouseleave', handlePressEnd);
            canvas.addEventListener('mousemove', handlePressMove);
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
