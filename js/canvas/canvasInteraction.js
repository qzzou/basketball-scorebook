// Canvas Interaction - Touch/mouse handlers with iOS optimizations

const CanvasInteraction = (() => {
    return {
        /**
         * Setup canvas interactions (touch and mouse)
         * @param {HTMLCanvasElement} canvas - Canvas element
         * @param {Function} onTap - Callback for tap (receives normalized x, y)
         * @param {Function} onTapPixels - Callback for tap (receives pixel x, y) - not used
         */
        setupCanvasInteractions(canvas, onTap, onTapPixels) {
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

            // Prevent context menu
            canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });

            // Touch event handlers
            canvas.addEventListener('touchend', (e) => {
                if (e.changedTouches.length !== 1) return;

                const touch = e.changedTouches[0];
                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;

                // Convert to normalized coordinates
                const normalizedX = x / canvasWidth;
                const normalizedY = y / canvasHeight;

                if (onTap) {
                    onTap(normalizedX, normalizedY);
                }

                // Haptic feedback (if available)
                if (window.navigator.vibrate) {
                    window.navigator.vibrate(20);
                }
            }, { passive: true });

            // Mouse event handlers (for desktop)
            canvas.addEventListener('click', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Convert to normalized coordinates
                const normalizedX = x / canvasWidth;
                const normalizedY = y / canvasHeight;

                if (onTap) {
                    onTap(normalizedX, normalizedY);
                }
            });
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
