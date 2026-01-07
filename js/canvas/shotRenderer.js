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

            const markerRadius = 8;

            shotEvents.forEach((shot, index) => {
                // Filter by selected jerseys in view mode
                if (filterJerseys && !filterJerseys.includes(shot.playerNumber)) {
                    return;
                }

                const x = shot.shotData.location.x * canvasWidth;
                const y = shot.shotData.location.y * canvasHeight;

                ctx.beginPath();
                ctx.arc(x, y, markerRadius, 0, Math.PI * 2);

                if (shot.shotData.made) {
                    // Made shot: green filled circle
                    ctx.fillStyle = '#4CAF50';
                    ctx.fill();
                } else {
                    // Missed shot: red outlined circle
                    ctx.strokeStyle = '#f5576c';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }

                // In edit mode, show player info next to most recent shot
                if (mode === 'edit' && index === shotEvents.length - 1) {
                    this.drawPlayerLabel(ctx, x, y, shot.playerNumber, game.playerNames, markerRadius);
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
         */
        drawPlayerLabel(ctx, x, y, jerseyNumber, playerNames, markerRadius) {
            const playerName = playerNames[jerseyNumber] || 'Player';
            const label = `#${jerseyNumber} ${playerName}`;

            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#333';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;

            const labelX = x + markerRadius + 8;
            const labelY = y + 5;

            // Draw white outline for readability
            ctx.strokeText(label, labelX, labelY);
            // Draw text
            ctx.fillText(label, labelX, labelY);
        },

        /**
         * Draw a single shot marker (for preview during long press)
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @param {boolean} made - Whether shot was made
         */
        drawShotMarker(ctx, x, y, made) {
            const markerRadius = 8;

            ctx.beginPath();
            ctx.arc(x, y, markerRadius, 0, Math.PI * 2);

            if (made) {
                ctx.fillStyle = '#4CAF50';
                ctx.fill();
            } else {
                ctx.strokeStyle = '#f5576c';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
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
