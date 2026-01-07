// Animations - Button animations and visual effects

const Animations = (() => {
    return {
        /**
         * Animate button with highlight and shake
         * @param {HTMLElement} button - Button element to animate
         * @param {number} duration - Duration in milliseconds (default: 2000)
         */
        animateButton(button, duration = 2000) {
            if (!button) return;

            // Add animation classes
            button.classList.add('button-highlight', 'button-shake');

            // Remove classes after duration
            setTimeout(() => {
                button.classList.remove('button-highlight', 'button-shake');
            }, duration);
        },

        /**
         * Animate correction button (highlight, shake, and lock others)
         * @param {HTMLElement} button - Button clicked
         * @param {HTMLElement} container - Container with all buttons
         * @param {Function} callback - Callback after animation completes
         */
        animateCorrectionButton(button, container, callback) {
            if (!button || !container) return;

            // Highlight and shake the clicked button
            button.classList.add('button-highlight', 'button-shake');

            // Lock (grey out) other buttons
            const allButtons = container.querySelectorAll('button');
            allButtons.forEach(btn => {
                if (btn !== button) {
                    btn.classList.add('button-locked');
                    btn.disabled = true;
                }
            });

            // Execute callback and remove classes after 2 seconds
            setTimeout(() => {
                if (callback) callback();

                button.classList.remove('button-highlight', 'button-shake');
                allButtons.forEach(btn => {
                    btn.classList.remove('button-locked');
                    btn.disabled = false;
                });
            }, 2000);
        },

        /**
         * Show shrinking circle animation on canvas (for long press)
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @param {number} maxRadius - Maximum radius
         * @param {number} duration - Duration in milliseconds
         * @returns {Object} Animation control object with cancel method
         */
        showShrinkingCircle(ctx, x, y, maxRadius = 40, duration = 1500) {
            const startTime = Date.now();
            let animationFrame;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const radius = maxRadius * (1 - progress);

                // Draw shrinking blue circle
                ctx.save();
                ctx.strokeStyle = '#2196F3';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                if (progress < 1) {
                    animationFrame = requestAnimationFrame(animate);
                }
            };

            animate();

            return {
                cancel: () => {
                    if (animationFrame) {
                        cancelAnimationFrame(animationFrame);
                    }
                }
            };
        },

        /**
         * Pulse animation for button
         * @param {HTMLElement} element - Element to pulse
         */
        pulse(element) {
            if (!element) return;
            element.classList.add('pulse');
            setTimeout(() => {
                element.classList.remove('pulse');
            }, 600);
        },

        /**
         * Fade in animation
         * @param {HTMLElement} element - Element to fade in
         * @param {number} duration - Duration in milliseconds
         */
        fadeIn(element, duration = 300) {
            if (!element) return;
            element.style.opacity = '0';
            element.style.transition = `opacity ${duration}ms`;
            setTimeout(() => {
                element.style.opacity = '1';
            }, 10);
        },

        /**
         * Fade out animation
         * @param {HTMLElement} element - Element to fade out
         * @param {number} duration - Duration in milliseconds
         * @param {Function} callback - Callback after fade completes
         */
        fadeOut(element, duration = 300, callback) {
            if (!element) return;
            element.style.opacity = '1';
            element.style.transition = `opacity ${duration}ms`;
            element.style.opacity = '0';
            setTimeout(() => {
                if (callback) callback();
            }, duration);
        },

        /**
         * Slide in from bottom
         * @param {HTMLElement} element - Element to slide in
         */
        slideInFromBottom(element) {
            if (!element) return;
            element.classList.add('slide-in-bottom');
        },

        /**
         * Slide out to bottom
         * @param {HTMLElement} element - Element to slide out
         * @param {Function} callback - Callback after slide completes
         */
        slideOutToBottom(element, callback) {
            if (!element) return;
            element.classList.add('slide-out-bottom');
            setTimeout(() => {
                if (callback) callback();
                element.classList.remove('slide-out-bottom');
            }, 300);
        }
    };
})();
