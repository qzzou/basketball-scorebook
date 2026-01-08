// Shot Renderer - Draw shot markers on court canvas

const ShotRenderer = (() => {
    /**
     * Get court boundaries in normalized coordinates
     * This matches the court rendering logic to ensure coordinates align
     * @param {number} canvasWidth - Canvas width in pixels
     * @param {number} canvasHeight - Canvas height in pixels
     * @returns {Object} - {courtStartX, courtStartY, courtSizeX, courtSizeY}
     */
    function getCourtBoundaries(canvasWidth, canvasHeight) {
        // Same logic as courtRenderer.js
        const paddingPercent = 0.03;
        const availableWidth = canvasWidth * (1 - 2 * paddingPercent);
        const availableHeight = canvasHeight * (1 - 2 * paddingPercent);

        // Court dimensions (landscape mode)
        const courtLengthFt = 94;
        const courtWidthFt = 50;
        const aspectRatio = courtWidthFt / courtLengthFt; // 50/94

        let courtWidth = availableWidth;
        let courtHeight = courtWidth * aspectRatio;

        // If height exceeds available, scale by height instead
        if (courtHeight > availableHeight) {
            courtHeight = availableHeight;
            courtWidth = courtHeight / aspectRatio;
        }

        // Center the court on canvas
        const courtX = (canvasWidth - courtWidth) / 2;
        const courtY = (canvasHeight - courtHeight) / 2;

        // Return normalized coordinates (0-1 range)
        return {
            courtStartX: courtX / canvasWidth,
            courtStartY: courtY / canvasHeight,
            courtSizeX: courtWidth / canvasWidth,
            courtSizeY: courtHeight / canvasHeight
        };
    }

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
         * Snap free throw to within the free throw circle (6ft radius)
         * @param {number} normalizedX - X coordinate (0-1)
         * @param {number} normalizedY - Y coordinate (0-1)
         * @returns {Object} - {x, y} snapped coordinates
         */
        snapToFreeThrowCircle(normalizedX, normalizedY) {
            // Get canvas to calculate court boundaries
            const canvas = document.getElementById('shots-map-canvas');
            if (!canvas) return { x: normalizedX, y: normalizedY };

            const canvasWidth = canvas.clientWidth;
            const canvasHeight = canvas.clientHeight;
            const boundaries = getCourtBoundaries(canvasWidth, canvasHeight);

            // Convert normalized canvas coords to normalized court coords
            const courtX = (normalizedX - boundaries.courtStartX) / boundaries.courtSizeX;
            const courtY = (normalizedY - boundaries.courtStartY) / boundaries.courtSizeY;

            // Court and FT dimensions
            const courtLengthFt = 94;
            const courtWidthFt = 50;
            const basketDistanceFromBaseline = 4 / courtLengthFt; // ~0.0426
            const ftLineDistance = 19 / courtLengthFt; // ~0.2021 (19ft from baseline)
            const keyWidthFt = 12; // Key/lane width in feet
            const threePointRadiusFt = 22.146; // 3PT arc radius from basket

            // Determine which half of court based on X (which basket)
            let basketX, basketY_center, ftLineX, threePtArcX;
            if (courtX < 0.5) {
                // Left side
                basketX = basketDistanceFromBaseline;
                ftLineX = ftLineDistance; // 19ft from baseline
                basketY_center = 0.5;
                // 3PT arc at basketX + 22.146ft
                threePtArcX = basketX + threePointRadiusFt / courtLengthFt;
            } else {
                // Right side
                basketX = 1 - basketDistanceFromBaseline;
                ftLineX = 1 - ftLineDistance; // 19ft from baseline
                basketY_center = 0.5;
                // 3PT arc at basketX - 22.146ft
                threePtArcX = basketX - threePointRadiusFt / courtLengthFt;
            }

            // Calculate Y position in feet from center
            const dyFeet = (courtY - basketY_center) * courtWidthFt;
            const yDistanceFromCenterFeet = Math.abs(dyFeet);
            const halfKeyWidth = keyWidthFt / 2; // 6 feet

            // Snap to rectangular area:
            // X: Between FT line and 3PT arc
            // Y: Within key width (±6ft from center)

            let snappedCourtX = courtX;
            let snappedCourtY = courtY;

            // Clamp X to be between FT line and 3PT arc
            if (courtX < 0.5) {
                // Left side: FT line is at ftLineX, 3PT arc is at threePtArcX
                if (courtX < ftLineX) {
                    snappedCourtX = ftLineX; // Too close to basket
                } else if (courtX > threePtArcX) {
                    snappedCourtX = threePtArcX; // Too far from basket
                }
            } else {
                // Right side: 3PT arc is at threePtArcX, FT line is at ftLineX
                if (courtX > ftLineX) {
                    snappedCourtX = ftLineX; // Too close to basket
                } else if (courtX < threePtArcX) {
                    snappedCourtX = threePtArcX; // Too far from basket
                }
            }

            // Clamp Y to be within key width
            if (yDistanceFromCenterFeet > halfKeyWidth) {
                const ySign = dyFeet >= 0 ? 1 : -1;
                snappedCourtY = basketY_center + (ySign * halfKeyWidth) / courtWidthFt;
            }

            // Convert back to canvas normalized coords
            return {
                x: snappedCourtX * boundaries.courtSizeX + boundaries.courtStartX,
                y: snappedCourtY * boundaries.courtSizeY + boundaries.courtStartY
            };
        },

        /**
         * Snap shot location to be inside or outside the 3PT arc
         * @param {number} normalizedX - X coordinate (0-1)
         * @param {number} normalizedY - Y coordinate (0-1)
         * @param {boolean} outside - True to snap outside arc, false for inside
         * @returns {Object} - {x, y} snapped coordinates
         */
        snapTo3PTArc(normalizedX, normalizedY, outside) {
            // Get canvas to calculate court boundaries
            const canvas = document.getElementById('shots-map-canvas');
            if (!canvas) return { x: normalizedX, y: normalizedY };

            const canvasWidth = canvas.clientWidth;
            const canvasHeight = canvas.clientHeight;
            const boundaries = getCourtBoundaries(canvasWidth, canvasHeight);

            // Convert normalized canvas coords to normalized court coords
            const courtX = (normalizedX - boundaries.courtStartX) / boundaries.courtSizeX;
            const courtY = (normalizedY - boundaries.courtStartY) / boundaries.courtSizeY;

            // Basketball court dimensions (landscape mode)
            // 3PT arc: 22.146ft from basket center (4ft from baseline)
            // Court is 94ft x 50ft
            const courtLengthFt = 94;
            const courtWidthFt = 50;
            const basketDistanceFromBaseline = 4 / courtLengthFt; // ~0.0426
            const threePointRadiusFt = 22.146; // feet

            // Left basket center (normalized): ~0.0426
            // Right basket center (normalized): ~0.9574
            const leftBasketX = basketDistanceFromBaseline;
            const rightBasketX = 1 - basketDistanceFromBaseline;
            const basketY = 0.5; // Center of court vertically

            // Determine which basket is closer
            const distToLeft = Math.abs(courtX - leftBasketX);
            const distToRight = Math.abs(courtX - rightBasketX);

            let basketX, basketY_center;
            if (distToLeft < distToRight) {
                // Closer to left basket
                basketX = leftBasketX;
                basketY_center = basketY;
            } else {
                // Closer to right basket
                basketX = rightBasketX;
                basketY_center = basketY;
            }

            // Calculate distance from basket to click point IN FEET
            // IMPORTANT: Court is 94ft x 50ft (not square!), so scale each dimension
            const dxFeet = (courtX - basketX) * courtLengthFt;
            const dyFeet = (courtY - basketY_center) * courtWidthFt;
            const distanceFeet = Math.sqrt(dxFeet * dxFeet + dyFeet * dyFeet);

            if (outside) {
                // Snap to outside the 3PT arc - if clicked inside, push outside
                if (distanceFeet <= threePointRadiusFt) {
                    const angle = Math.atan2(dyFeet, dxFeet);
                    const newDistanceFt = threePointRadiusFt + 1; // 1 foot margin outside
                    // Convert back to normalized court coords
                    const snappedCourtX = basketX + (Math.cos(angle) * newDistanceFt) / courtLengthFt;
                    const snappedCourtY = basketY_center + (Math.sin(angle) * newDistanceFt) / courtWidthFt;

                    // Convert back to canvas normalized coords
                    return {
                        x: snappedCourtX * boundaries.courtSizeX + boundaries.courtStartX,
                        y: snappedCourtY * boundaries.courtSizeY + boundaries.courtStartY
                    };
                }
            } else {
                // Snap to inside the 3PT arc - if clicked outside, pull inside
                if (distanceFeet >= threePointRadiusFt) {
                    const angle = Math.atan2(dyFeet, dxFeet);
                    const newDistanceFt = threePointRadiusFt - 1; // 1 foot margin inside
                    // Convert back to normalized court coords
                    const snappedCourtX = basketX + (Math.cos(angle) * newDistanceFt) / courtLengthFt;
                    const snappedCourtY = basketY_center + (Math.sin(angle) * newDistanceFt) / courtWidthFt;

                    // Convert back to canvas normalized coords
                    return {
                        x: snappedCourtX * boundaries.courtSizeX + boundaries.courtStartX,
                        y: snappedCourtY * boundaries.courtSizeY + boundaries.courtStartY
                    };
                }
            }

            // Point is already in correct zone, return as-is
            return { x: normalizedX, y: normalizedY };
        },

        /**
         * Adjust shot location to avoid overlap and snap FT to line
         */
        adjustShotLocation(normalizedX, normalizedY, shotType) {
            const game = DataModel.getCurrentGame();
            if (!game) return { x: normalizedX, y: normalizedY };

            // For free throws, snap to within the free throw circle (6ft radius)
            if (shotType === 'FT') {
                const snapped = this.snapToFreeThrowCircle(normalizedX, normalizedY);
                normalizedX = snapped.x;
                normalizedY = snapped.y;
            }

            // For 3PT shots, snap to outside the 3PT arc
            if (shotType === '3PT') {
                const snapped = this.snapTo3PTArc(normalizedX, normalizedY, true); // outside = true
                normalizedX = snapped.x;
                normalizedY = snapped.y;
            }

            // For 2PT shots (FG), snap to inside the 3PT arc
            if (shotType === 'FG') {
                const snapped = this.snapTo3PTArc(normalizedX, normalizedY, false); // outside = false
                normalizedX = snapped.x;
                normalizedY = snapped.y;
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

            // If we couldn't find a non-overlapping position after maxAttempts,
            // just use the original snapped position (breaking overlap rule is acceptable)
            if (attempts >= maxAttempts) {
                adjusted = { x: normalizedX, y: normalizedY };
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
