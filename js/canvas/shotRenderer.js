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

    // Court dimensions constants (college basketball)
    const COURT_LENGTH_FT = 94;
    const COURT_WIDTH_FT = 50;
    const BASKET_DISTANCE_FROM_BASELINE_FT = 4;
    const THREE_POINT_RADIUS_FT = 22.146;
    const KEY_WIDTH_FT = 12;
    const FREE_THROW_LINE_DISTANCE_FT = 19;

    return {
        /**
         * Get court dimension constants for export
         * Includes normalized corner coordinates relative to canvas
         * @returns {Object} Court dimensions in feet and normalized corner positions
         */
        getCourtDimensions() {
            // Get canvas to calculate actual court boundaries
            const canvas = document.getElementById('shots-map-canvas');
            let topLeft, bottomRight;

            if (canvas) {
                const canvasWidth = canvas.clientWidth;
                const canvasHeight = canvas.clientHeight;
                const boundaries = getCourtBoundaries(canvasWidth, canvasHeight);

                topLeft = {
                    x: Math.round(boundaries.courtStartX * 10000) / 10000,
                    y: Math.round(boundaries.courtStartY * 10000) / 10000
                };
                bottomRight = {
                    x: Math.round((boundaries.courtStartX + boundaries.courtSizeX) * 10000) / 10000,
                    y: Math.round((boundaries.courtStartY + boundaries.courtSizeY) * 10000) / 10000
                };
            } else {
                // Fallback: assume 3% padding on all sides
                const padding = 0.03;
                topLeft = { x: padding, y: padding };
                bottomRight = { x: 1 - padding, y: 1 - padding };
            }

            return {
                courtLengthFt: COURT_LENGTH_FT,
                courtWidthFt: COURT_WIDTH_FT,
                basketDistanceFromBaselineFt: BASKET_DISTANCE_FROM_BASELINE_FT,
                threePointRadiusFt: THREE_POINT_RADIUS_FT,
                keyWidthFt: KEY_WIDTH_FT,
                freeThrowLineDistanceFt: FREE_THROW_LINE_DISTANCE_FT,
                // Normalized coordinates (0-1) relative to canvas
                topLeftCorner: topLeft,
                bottomRightCorner: bottomRight
            };
        },

        /**
         * Convert normalized canvas coordinates to court coordinates in feet
         * Origin (0,0) is at top-left corner of court (where baseline meets sideline)
         * X increases along the length (94ft), Y increases along the width (50ft)
         * @param {number} normalizedX - X coordinate (0-1) relative to canvas
         * @param {number} normalizedY - Y coordinate (0-1) relative to canvas
         * @returns {Object} - {x_ft, y_ft} position in feet from top-left of court
         */
        convertToFeet(normalizedX, normalizedY) {
            // Get canvas to calculate court boundaries
            const canvas = document.getElementById('shots-map-canvas');
            if (!canvas) {
                // Fallback: assume court fills canvas with 3% padding
                const paddingPercent = 0.03;
                const courtStartX = paddingPercent;
                const courtStartY = paddingPercent;
                const courtSizeX = 1 - 2 * paddingPercent;
                const courtSizeY = 1 - 2 * paddingPercent;

                const courtX = (normalizedX - courtStartX) / courtSizeX;
                const courtY = (normalizedY - courtStartY) / courtSizeY;

                return {
                    x_ft: Math.round(courtX * COURT_LENGTH_FT * 100) / 100,
                    y_ft: Math.round(courtY * COURT_WIDTH_FT * 100) / 100
                };
            }

            const canvasWidth = canvas.clientWidth;
            const canvasHeight = canvas.clientHeight;
            const boundaries = getCourtBoundaries(canvasWidth, canvasHeight);

            // Convert normalized canvas coords to normalized court coords (0-1 within court)
            const courtX = (normalizedX - boundaries.courtStartX) / boundaries.courtSizeX;
            const courtY = (normalizedY - boundaries.courtStartY) / boundaries.courtSizeY;

            // Convert to feet (clamp to court bounds)
            const x_ft = Math.max(0, Math.min(COURT_LENGTH_FT, courtX * COURT_LENGTH_FT));
            const y_ft = Math.max(0, Math.min(COURT_WIDTH_FT, courtY * COURT_WIDTH_FT));

            // Round to 2 decimal places
            return {
                x_ft: Math.round(x_ft * 100) / 100,
                y_ft: Math.round(y_ft * 100) / 100
            };
        },

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

            // Separate FT and non-FT shots
            const ftShots = [];
            const nonFTShots = [];

            shotEvents.forEach((shot) => {
                // Filter by selected jerseys in view mode
                if (filterJerseys && !filterJerseys.includes(shot.playerNumber)) {
                    return;
                }

                if (shot.shotData.shotType === 'FT') {
                    ftShots.push(shot);
                } else {
                    nonFTShots.push(shot);
                }
            });

            // Draw non-FT shots (FG and 3PT)
            let mostRecentNonFTShot = null;
            nonFTShots.forEach((shot) => {
                if (!mostRecentNonFTShot || shot.timestamp > mostRecentNonFTShot.timestamp) {
                    mostRecentNonFTShot = shot;
                }
            });

            const baseRadius = 5;

            nonFTShots.forEach((shot) => {
                const x = shot.shotData.location.x * canvasWidth;
                const y = shot.shotData.location.y * canvasHeight;

                let radius = baseRadius;
                let color = shot.shotData.made ? '#4CAF50' : '#f44336';

                if (shot.shotData.shotType === '3PT') {
                    color = shot.shotData.made ? '#2196F3' : '#f44336';
                }

                if (shot.shotData.made) {
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                } else {
                    this.drawXMark(ctx, x, y, radius, color);
                }

                // Draw jersey number next to most recent non-FT shot
                if (mostRecentNonFTShot === shot) {
                    this.drawJerseyLabel(ctx, x, y, shot.playerNumber, radius);
                }
            });

            // Draw aggregated FT circles (only if not in draw mode)
            if (!appState.selectedShotType) {
                this.drawFreeThrowCircles(ctx, canvasWidth, canvasHeight, ftShots);
            }
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
         * Draw jersey number next to shot (simplified label)
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} x - Shot x coordinate
         * @param {number} y - Shot y coordinate
         * @param {number} jerseyNumber - Player jersey number
         * @param {number} markerRadius - Shot marker radius
         */
        drawJerseyLabel(ctx, x, y, jerseyNumber, markerRadius) {
            const label = `#${jerseyNumber}`;

            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#555'; // Dark grey
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
         * Draw aggregated free throw circles
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} canvasWidth - Canvas width
         * @param {number} canvasHeight - Canvas height
         * @param {Array} ftShots - Array of free throw shot events
         */
        drawFreeThrowCircles(ctx, canvasWidth, canvasHeight, ftShots) {
            if (ftShots.length === 0) return;

            // Get FT locations from CourtRenderer
            const ftLocs = CourtRenderer.getFreeThrowLocations(canvasWidth, canvasHeight);
            const radiusFt = ftLocs.radiusFt; // 2ft
            const radiusPixels = ftLocs.radiusPixels;

            // Define display locations for made/miss circles
            // Offset from FT center: +1.1R horizontally, and -1.05R (top/miss), +1.05R (bottom/made) vertically
            const horizontalOffsetNorm = (1.1 * radiusFt) / 94; // Normalize to court length
            const verticalOffsetNorm = (1.05 * radiusFt) / 50; // Normalize to court width (moved closer by 2R)

            const ftDisplayLocations = {
                left: {
                    miss: { x: ftLocs.left.x + horizontalOffsetNorm, y: ftLocs.left.y - verticalOffsetNorm },
                    made: { x: ftLocs.left.x + horizontalOffsetNorm, y: ftLocs.left.y + verticalOffsetNorm }
                },
                right: {
                    miss: { x: ftLocs.right.x - horizontalOffsetNorm, y: ftLocs.right.y - verticalOffsetNorm },
                    made: { x: ftLocs.right.x - horizontalOffsetNorm, y: ftLocs.right.y + verticalOffsetNorm }
                }
            };

            // Aggregate FT shots by half-court and made/missed
            const leftMade = [];
            const leftMissed = [];
            const rightMade = [];
            const rightMissed = [];

            ftShots.forEach((shot) => {
                const isLeftSide = shot.shotData.location.x < 0.5;

                if (isLeftSide) {
                    if (shot.shotData.made) {
                        leftMade.push(shot);
                    } else {
                        leftMissed.push(shot);
                    }
                } else {
                    if (shot.shotData.made) {
                        rightMade.push(shot);
                    } else {
                        rightMissed.push(shot);
                    }
                }
            });

            // Draw made circles (light yellow filled) at bottom position
            if (leftMade.length > 0) {
                const loc = ftDisplayLocations.left.made;
                this.drawFTMadeCircle(ctx, loc.x * canvasWidth, loc.y * canvasHeight, radiusPixels, leftMade.length);
            }

            if (rightMade.length > 0) {
                const loc = ftDisplayLocations.right.made;
                this.drawFTMadeCircle(ctx, loc.x * canvasWidth, loc.y * canvasHeight, radiusPixels, rightMade.length);
            }

            // Draw miss circles (red border, red X, not filled) at top position
            if (leftMissed.length > 0) {
                const loc = ftDisplayLocations.left.miss;
                this.drawFTMissCircle(ctx, loc.x * canvasWidth, loc.y * canvasHeight, radiusPixels, leftMissed.length);
            }

            if (rightMissed.length > 0) {
                const loc = ftDisplayLocations.right.miss;
                this.drawFTMissCircle(ctx, loc.x * canvasWidth, loc.y * canvasHeight, radiusPixels, rightMissed.length);
            }
        },

        /**
         * Get FT attempt locations (for snapping when recording shots)
         * Returns the 2 legal attempt locations (middle position on each side)
         * @param {number} canvasWidth - Canvas width
         * @param {number} canvasHeight - Canvas height
         * @returns {Array} Array of 2 attempt location objects with x, y (normalized)
         */
        getFTAttemptLocations(canvasWidth, canvasHeight) {
            const ftLocs = CourtRenderer.getFreeThrowLocations(canvasWidth, canvasHeight);
            const radiusFt = ftLocs.radiusFt; // 2ft

            // Horizontal offset: 1.1 * R towards center of court from FT line
            const horizontalOffsetFt = 1.1 * radiusFt; // 1.1 * 2 = 2.2 ft
            const horizontalOffsetNorm = horizontalOffsetFt / 94; // Normalize to court length

            // Only 2 attempt locations: middle position on each side
            // Left side: move right (towards center) by 1.1R
            // Right side: move left (towards center) by 1.1R
            return [
                {
                    x: ftLocs.left.x + horizontalOffsetNorm,
                    y: ftLocs.left.y,
                    side: 'left'
                },
                {
                    x: ftLocs.right.x - horizontalOffsetNorm,
                    y: ftLocs.right.y,
                    side: 'right'
                }
            ];
        },

        /**
         * Draw FT made circle (light yellow filled with count)
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} x - X coordinate (pixels)
         * @param {number} y - Y coordinate (pixels)
         * @param {number} radius - Circle radius (pixels)
         * @param {number} count - Number of made FTs
         */
        drawFTMadeCircle(ctx, x, y, radius, count) {
            // Draw circle border (not filled)
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#4CAF50'; // Green border
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw count (black text in center)
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(count.toString(), x, y);
        },

        /**
         * Draw FT miss circle (red border, red X, not filled, with count)
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} x - X coordinate (pixels)
         * @param {number} y - Y coordinate (pixels)
         * @param {number} radius - Circle radius (pixels)
         * @param {number} count - Number of missed FTs
         */
        drawFTMissCircle(ctx, x, y, radius, count) {
            // Draw circle border (not filled)
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#f44336'; // Red
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw count (black text in center)
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(count.toString(), x, y);
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
         * Adjust shot location to avoid overlap and snap to appropriate zones
         */
        adjustShotLocation(normalizedX, normalizedY, shotType) {
            const game = DataModel.getCurrentGame();
            if (!game) return { x: normalizedX, y: normalizedY };

            // For free throws, snap to nearest of the 2 legal attempt locations
            if (shotType === 'FT') {
                const canvas = document.getElementById('shots-map-canvas');
                if (canvas) {
                    const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
                    const canvasHeight = canvas.height / (window.devicePixelRatio || 1);
                    const attemptLocs = this.getFTAttemptLocations(canvasWidth, canvasHeight);

                    // Find closest attempt location
                    let closestLoc = attemptLocs[0];
                    let minDistance = Math.hypot(normalizedX - closestLoc.x, normalizedY - closestLoc.y);

                    for (let i = 1; i < attemptLocs.length; i++) {
                        const dist = Math.hypot(normalizedX - attemptLocs[i].x, normalizedY - attemptLocs[i].y);
                        if (dist < minDistance) {
                            minDistance = dist;
                            closestLoc = attemptLocs[i];
                        }
                    }

                    normalizedX = closestLoc.x;
                    normalizedY = closestLoc.y;
                }
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

            // For free throws, skip overlap checking (they should aggregate at fixed locations)
            if (shotType === 'FT') {
                return { x: normalizedX, y: normalizedY };
            }

            // Check for overlaps with existing shots (only for FG and 3PT)
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
