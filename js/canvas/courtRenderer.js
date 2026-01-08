// Court Renderer - Basketball court drawing (landscape mode only)
// Copied from existing script.js implementation

const CourtRenderer = (() => {
    return {
        /**
         * Initialize canvas with court drawing
         * @param {string} canvasId - Canvas element ID
         */
        initializeShotsMapCanvas(canvasId = 'shots-map-canvas') {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            const container = canvas.parentElement;

            // Full court dimensions (94ft x 50ft) - LANDSCAPE MODE ONLY
            const isLandscape = true; // Force landscape mode
            const containerWidth = container.clientWidth;
            let canvasWidth, canvasHeight;

            // Landscape: horizontal court
            canvasWidth = containerWidth;
            canvasHeight = containerWidth * (50 / 94);

            const dpr = window.devicePixelRatio || 1;
            canvas.width = canvasWidth * dpr;
            canvas.height = canvasHeight * dpr;
            canvas.style.width = canvasWidth + 'px';
            canvas.style.height = canvasHeight + 'px';

            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            this.drawBasketballCourt(ctx, canvasWidth, canvasHeight, isLandscape);

            return { canvas, ctx, canvasWidth, canvasHeight };
        },

        /**
         * Draw basketball court
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} width - Canvas width
         * @param {number} height - Canvas height
         * @param {boolean} isLandscape - Landscape orientation (always true for 2.0)
         */
        drawBasketballCourt(ctx, width, height, isLandscape) {
            ctx.clearRect(0, 0, width, height);

            // Court background (full canvas)
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, width, height);

            // College basketball court dimensions (94ft x 50ft)
            const courtLengthFt = 94;
            const courtWidthFt = 50;
            const basketDistanceFromBaseline = 4; // Backboard is 4ft from baseline
            const threePointDistanceFt = 22.146; // 22'1.75" from basket center
            const keyWidthFt = 12;
            const freeThrowLineDistanceFt = 19; // From baseline

            // Calculate court dimensions maintaining aspect ratio with padding
            const paddingPercent = 0.03; // 3% padding
            const availableWidth = width * (1 - 2 * paddingPercent);
            const availableHeight = height * (1 - 2 * paddingPercent);

            let courtWidth, courtHeight, courtX, courtY;

            if (isLandscape) {
                // Landscape: court length is horizontal
                const aspectRatio = courtWidthFt / courtLengthFt; // 50/94
                courtWidth = availableWidth;
                courtHeight = courtWidth * aspectRatio;

                // If height exceeds available, scale by height instead
                if (courtHeight > availableHeight) {
                    courtHeight = availableHeight;
                    courtWidth = courtHeight / aspectRatio;
                }
            }

            // Center the court on canvas
            courtX = (width - courtWidth) / 2;
            courtY = (height - courtHeight) / 2;

            // Court surface
            ctx.fillStyle = '#d2b48c';
            ctx.fillRect(courtX, courtY, courtWidth, courtHeight);

            // Landscape orientation - horizontal full court
            const scale = courtWidth / courtLengthFt;
            const halfCourt = courtX + courtWidth / 2;
            const centerY = courtY + courtHeight / 2;

            // Sidelines (black, emphasized) - draw first
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(courtX, courtY);
            ctx.lineTo(courtX + courtWidth, courtY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(courtX, courtY + courtHeight);
            ctx.lineTo(courtX + courtWidth, courtY + courtHeight);
            ctx.stroke();

            // Other lines (white)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;

            // Half-court line
            ctx.beginPath();
            ctx.moveTo(halfCourt, courtY);
            ctx.lineTo(halfCourt, courtY + courtHeight);
            ctx.stroke();

            // Center circle at half court
            const centerCircleRadius = 6 * scale; // 6 feet radius
            ctx.beginPath();
            ctx.arc(halfCourt, centerY, centerCircleRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Left side
            const keyWidth = (keyWidthFt / courtWidthFt) * courtHeight;
            const keyTop = centerY - keyWidth / 2;
            const keyBottom = centerY + keyWidth / 2;
            const freeThrowLineX = courtX + freeThrowLineDistanceFt * scale;

            // Left basket position
            const leftBasketX = courtX + basketDistanceFromBaseline * scale;

            // Left three-point line
            const threePointRadius = threePointDistanceFt * scale;
            const cornerExtensionFt = 5.25; // 5 feet 3 inches from baseline
            const cornerExtensionX = courtX + cornerExtensionFt * scale;

            const horizontalDist = cornerExtensionX - leftBasketX;
            const verticalOffset = Math.sqrt(threePointRadius * threePointRadius - horizontalDist * horizontalDist);

            const topCornerY = centerY - verticalOffset;
            const bottomCornerY = centerY + verticalOffset;

            // Calculate angles for the arc
            const topAngle = Math.atan2(topCornerY - centerY, cornerExtensionX - leftBasketX);
            const bottomAngle = Math.atan2(bottomCornerY - centerY, cornerExtensionX - leftBasketX);

            // Draw the arc
            ctx.beginPath();
            ctx.arc(leftBasketX, centerY, threePointRadius, topAngle, bottomAngle);
            ctx.stroke();

            // Draw straight corner segments from baseline to arc connection
            ctx.beginPath();
            ctx.moveTo(courtX, topCornerY);
            ctx.lineTo(cornerExtensionX, topCornerY);
            ctx.moveTo(courtX, bottomCornerY);
            ctx.lineTo(cornerExtensionX, bottomCornerY);
            ctx.stroke();

            // Left key (paint area) - starts at baseline
            ctx.beginPath();
            ctx.moveTo(courtX, keyTop);
            ctx.lineTo(freeThrowLineX, keyTop);
            ctx.lineTo(freeThrowLineX, keyBottom);
            ctx.lineTo(courtX, keyBottom);
            ctx.closePath();
            ctx.stroke();

            // Left free throw circle (6 feet radius)
            const freeThrowCircleRadius = 6 * scale;
            ctx.beginPath();
            ctx.arc(freeThrowLineX, centerY, freeThrowCircleRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Right side
            const rightFreeThrowLineX = courtX + courtWidth - freeThrowLineDistanceFt * scale;
            const rightBasketX = courtX + courtWidth - basketDistanceFromBaseline * scale;
            const rightCornerExtensionX = courtX + courtWidth - cornerExtensionFt * scale;

            const rightTopCornerY = centerY - verticalOffset;
            const rightBottomCornerY = centerY + verticalOffset;

            // Calculate angles for the arc
            const rightTopAngle = Math.atan2(rightTopCornerY - centerY, rightCornerExtensionX - rightBasketX);
            const rightBottomAngle = Math.atan2(rightBottomCornerY - centerY, rightCornerExtensionX - rightBasketX);

            // Draw the arc
            ctx.beginPath();
            ctx.arc(rightBasketX, centerY, threePointRadius, rightBottomAngle, rightTopAngle);
            ctx.stroke();

            // Draw straight corner segments from baseline to arc connection
            ctx.beginPath();
            ctx.moveTo(courtX + courtWidth, rightTopCornerY);
            ctx.lineTo(rightCornerExtensionX, rightTopCornerY);
            ctx.moveTo(courtX + courtWidth, rightBottomCornerY);
            ctx.lineTo(rightCornerExtensionX, rightBottomCornerY);
            ctx.stroke();

            // Right key (paint area) - starts at baseline
            ctx.beginPath();
            ctx.moveTo(courtX + courtWidth, keyTop);
            ctx.lineTo(rightFreeThrowLineX, keyTop);
            ctx.lineTo(rightFreeThrowLineX, keyBottom);
            ctx.lineTo(courtX + courtWidth, keyBottom);
            ctx.closePath();
            ctx.stroke();

            // Right free throw circle (6 feet radius)
            ctx.beginPath();
            ctx.arc(rightFreeThrowLineX, centerY, freeThrowCircleRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Baselines (black, emphasized) - draw last to be on top
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(courtX, courtY);
            ctx.lineTo(courtX, courtY + courtHeight);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(courtX + courtWidth, courtY);
            ctx.lineTo(courtX + courtWidth, courtY + courtHeight);
            ctx.stroke();
        },

        /**
         * Get free throw center locations for both sides of court
         * @param {number} canvasWidth - Canvas width
         * @param {number} canvasHeight - Canvas height
         * @returns {Object} FT center locations and radius
         */
        getFreeThrowLocations(canvasWidth, canvasHeight) {
            // Court dimensions
            const courtLengthFt = 94;
            const courtWidthFt = 50;
            const freeThrowLineDistanceFt = 19;

            // Calculate court dimensions
            const paddingPercent = 0.03;
            const availableWidth = canvasWidth * (1 - 2 * paddingPercent);
            const availableHeight = canvasHeight * (1 - 2 * paddingPercent);

            const aspectRatio = courtWidthFt / courtLengthFt;
            let courtWidth = availableWidth;
            let courtHeight = courtWidth * aspectRatio;

            if (courtHeight > availableHeight) {
                courtHeight = availableHeight;
                courtWidth = courtHeight / aspectRatio;
            }

            const courtX = (canvasWidth - courtWidth) / 2;
            const courtY = (canvasHeight - courtHeight) / 2;
            const scale = courtWidth / courtLengthFt;
            const centerY = courtY + courtHeight / 2;

            // FT line X positions
            const leftFTLineX = courtX + freeThrowLineDistanceFt * scale;
            const rightFTLineX = courtX + courtWidth - freeThrowLineDistanceFt * scale;

            // FT radius in feet (2ft as specified)
            const ftRadiusFt = 2;
            const ftRadius = ftRadiusFt * scale;

            // Convert to normalized coordinates (0-1)
            const leftFTCenterNorm = {
                x: leftFTLineX / canvasWidth,
                y: centerY / canvasHeight
            };

            const rightFTCenterNorm = {
                x: rightFTLineX / canvasWidth,
                y: centerY / canvasHeight
            };

            return {
                left: leftFTCenterNorm,
                right: rightFTCenterNorm,
                radiusFt: ftRadiusFt,
                radiusPixels: ftRadius,
                scale: scale
            };
        }
    };
})();
