// Shot Renderer - Draw shot markers on court canvas

const ShotRenderer = (() => {
    return {
        /**
         * Draw all shots on the canvas
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} canvasWidth - Canvas width
         * @param {number} canvasHeight - Canvas height
         */
        drawShots(ctx, canvasWidth, canvasHeight) {
            const game = DataModel.getCurrentGame();
            if (!game) return;

            const appState = DataModel.getAppState();
            const mode = appState.currentMode;
            const filterJerseys = mode === 'view' ? appState.selectedJerseys : null;

            // Get all shot events
            const shotEvents = game.gameEvents.filter(e =>
                e.eventStatus === 'active' &&
                e.action === 'shot' &&
                e.shotData &&
                e.shotData.location
            );

            const baseRadius = 5; // FG/3PT = 100% (halved from 10)

            shotEvents.forEach((shot, index) => {
                // Filter by selected jerseys in view mode
                if (filterJerseys && !filterJerseys.includes(shot.playerNumber)) {
                    return;
                }

                const x = shot.shotData.location.x * canvasWidth;
                const y = shot.shotData.location.y * canvasHeight;

                // Calculate radius based on shot type
                let radius = baseRadius;
                let color = shot.shotData.made ? '#4CAF50' : '#f44336';

                if (shot.shotData.shotType === 'FT') {
                    radius = baseRadius * 0.5; // 50% size
                    color = shot.shotData.made ? '#000' : '#f44336'; // Black for made FT, red for missed
                } else if (shot.shotData.shotType === '3PT') {
                    radius = baseRadius; // 100% size (same as FG)
                    color = shot.shotData.made ? '#2196F3' : '#f44336'; // Blue for 3PT made
                }

                if (shot.shotData.made) {
                    // Made shot: filled circle
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                } else {
                    // Missed shot: X mark
                    this.drawXMark(ctx, x, y, radius, color);
                }
            });
        },

        /**
         * Draw player label next to shot
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} x - Shot x coordinate
         * @param {number} y - Shot y coordinate
         * @param {number} jerseyNumber - Player jersey number
         * @param {Object} playerNames - Player names mapping
         * @param {number} markerRadius - Shot marker radius
         * @param {string} color - Label color (default '#333')
         */
        drawPlayerLabel(ctx, x, y, jerseyNumber, playerNames, markerRadius, color = '#333') {
            const playerName = playerNames[jerseyNumber] || 'Player';
            const label = `#${jerseyNumber} ${playerName}`;

            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = color;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;

            const labelX = x + markerRadius + 8;
            const labelY = y + 4;

            // Draw white outline for readability
            ctx.strokeText(label, labelX, labelY);
            // Draw text
            ctx.fillText(label, labelX, labelY);
        },

        /**
         * Draw X mark for missed shots
         */
        drawXMark(ctx, x, y, radius, color) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(x - radius * 0.7, y - radius * 0.7);
            ctx.lineTo(x + radius * 0.7, y + radius * 0.7);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + radius * 0.7, y - radius * 0.7);
            ctx.lineTo(x - radius * 0.7, y + radius * 0.7);
            ctx.stroke();
        },

        /**
         * Draw a single shot (used for pending shot preview)
         */
        drawSingleShot(ctx, x, y, made, shotType, points) {
            const baseRadius = 5; // FG/3PT = 100%
            let radius = baseRadius;
            let color = made ? '#4CAF50' : '#f44336';

            if (shotType === 'FT') {
                radius = baseRadius * 0.5;
                color = made ? '#000' : '#f44336'; // Black for made FT, red for missed
            } else if (shotType === '3PT') {
                radius = baseRadius; // 100% size (same as FG)
                color = made ? '#2196F3' : '#f44336';
            }

            if (made) {
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            } else {
                this.drawXMark(ctx, x, y, radius, color);
            }
        },

        /**
         * Adjust shot location to avoid overlap and snap FT to line
         */
        adjustShotLocation(normalizedX, normalizedY, shotType) {
            const game = DataModel.getCurrentGame();
            if (!game) return { x: normalizedX, y: normalizedY };

            // For free throws, snap to nearest FT line
            if (shotType === 'FT') {
                // Landscape court: FT lines are at ~19ft from baselines
                // Normalized positions: ~0.2 and ~0.8 for left and right FT lines
                const leftFT = 0.2;
                const rightFT = 0.8;

                if (normalizedX < 0.5) {
                    normalizedX = leftFT;
                } else {
                    normalizedX = rightFT;
                }

                // Keep Y as is but clamp to lane area (center 3rd of court)
                normalizedY = Math.max(0.35, Math.min(0.65, normalizedY));
            }

            // Check for overlaps with existing shots
            const shotEvents = game.gameEvents.filter(e =>
                e.eventStatus === 'active' &&
                e.action === 'shot' &&
                e.shotData &&
                e.shotData.location
            );

            const overlapThreshold = 0.02; // 2% of canvas dimensions (reduced for smaller shots)
            let adjusted = { x: normalizedX, y: normalizedY };
            let attempts = 0;
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
                let hasOverlap = false;

                for (const shot of shotEvents) {
                    const dx = shot.shotData.location.x - adjusted.x;
                    const dy = shot.shotData.location.y - adjusted.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < overlapThreshold) {
                        // Move shot slightly in a spiral pattern
                        const angle = attempts * (Math.PI / 3);
                        const offset = overlapThreshold * 1.1;
                        adjusted.x = normalizedX + Math.cos(angle) * offset;
                        adjusted.y = normalizedY + Math.sin(angle) * offset;
                        hasOverlap = true;
                        break;
                    }
                }

                if (!hasOverlap) break;
                attempts++;
            }

            // Clamp to canvas bounds
            adjusted.x = Math.max(0.05, Math.min(0.95, adjusted.x));
            adjusted.y = Math.max(0.05, Math.min(0.95, adjusted.y));

            return adjusted;
        },

        /**
         * Redraw entire canvas (court + shots)
         * @param {string} canvasId - Canvas element ID
         */
        redrawCanvas(canvasId = 'shots-map-canvas') {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
            const canvasHeight = canvas.height / (window.devicePixelRatio || 1);

            // Redraw court
            CourtRenderer.drawBasketballCourt(ctx, canvasWidth, canvasHeight, true);

            // Redraw shots
            this.drawShots(ctx, canvasWidth, canvasHeight);
        }
    };
})();
