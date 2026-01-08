// PDF Export - Generate PDF reports for games

const PDFExport = (() => {
    return {
        /**
         * Generate and download PDF for current game
         */
        async generatePDF() {
            const game = DataModel.getCurrentGame();

            // Validation
            if (!game) {
                alert('No game data to export');
                return;
            }

            if (game.teamRoster.length === 0) {
                alert('No players in the game. Add players before exporting PDF.');
                return;
            }

            // Filter players with stats
            const playersWithStats = game.teamRoster.filter(jerseyNumber =>
                this.hasPlayerStats(jerseyNumber, game.gameEvents)
            );

            if (playersWithStats.length === 0) {
                alert('No player statistics to export');
                return;
            }

            // Check if jsPDF is loaded
            if (!window.jspdf) {
                alert('PDF libraries failed to load. Please refresh and try again.');
                return;
            }

            // Show loading indicator
            this.showLoadingIndicator();

            try {
                // Initialize jsPDF in landscape mode
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'letter' // 279.4mm x 215.9mm
                });

                // Page 1: Player Stats Table
                await this.addPlayerStatsPage(pdf, game);

                // Page 2: Team Stats and Shot Map
                pdf.addPage();
                await this.addTeamShotMapPage(pdf, game);

                // Pages 3+: Individual Player Pages (only for players with stats)
                for (let i = 0; i < playersWithStats.length; i++) {
                    const jerseyNumber = playersWithStats[i];
                    pdf.addPage();
                    await this.addPlayerPage(pdf, game, jerseyNumber, i + 2);
                }

                // Generate filename
                const filename = this.generateFilename(game);

                // Download PDF
                pdf.save(filename);

                this.hideLoadingIndicator();
                console.log('PDF exported successfully:', filename);
            } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Failed to generate PDF. Please try again.');
                this.hideLoadingIndicator();
            }
        },

        /**
         * Check if player has any stats
         */
        hasPlayerStats(jerseyNumber, events) {
            return events.some(e =>
                e.eventStatus === 'active' &&
                e.playerNumber === jerseyNumber
            );
        },

        /**
         * Check if player has any shot attempts
         */
        hasPlayerShots(jerseyNumber, events) {
            return events.some(e =>
                e.eventStatus === 'active' &&
                e.playerNumber === jerseyNumber &&
                e.action === 'shot'
            );
        },

        /**
         * Add player stats page (Page 1)
         */
        async addPlayerStatsPage(pdf, game) {
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            let currentY = margin;

            // Title
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text(game.gameName, margin, currentY);
            currentY += 15;

            // Player Stats Table
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Player Stats', margin, currentY);
            currentY += 8;

            currentY = this.drawPlayersTable(pdf, game, margin, currentY, pageWidth - 2 * margin);
        },

        /**
         * Add team shot map page (Page 2)
         */
        async addTeamShotMapPage(pdf, game) {
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            let currentY = margin;

            // Title
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text(game.gameName, margin, currentY);
            currentY += 15;

            // Team Stats
            const teamStats = StatCalculator.calculateTeamStats(
                game.gameEvents,
                game.teamRoster
            );

            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Team Stats', margin, currentY);
            currentY += 8;

            currentY = this.drawTeamStatsRow(pdf, teamStats, margin, currentY);
            currentY += 15;

            // Team Shot Map
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Team Shot Map', margin, currentY);
            currentY += 8;

            await this.drawShotMap(pdf, game, null, margin, currentY, pageWidth, pageHeight);
        },

        /**
         * Add individual player page
         */
        async addPlayerPage(pdf, game, jerseyNumber, pageNumber) {
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            let currentY = margin;

            // Game Title (game name only)
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text(game.gameName, margin, currentY);
            currentY += 12;

            // Player Header
            const playerName = game.playerNames[jerseyNumber] || `Player ${jerseyNumber}`;
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`#${jerseyNumber} - ${playerName}`, margin, currentY);
            currentY += 10;

            // Player Stats (one line, non-zero only)
            const playerStats = StatCalculator.calculatePlayerStats(jerseyNumber, game.gameEvents);
            currentY = this.drawTeamStatsRow(pdf, playerStats, margin, currentY);
            currentY += 15;

            // Player Shot Map (only if player has shots)
            if (this.hasPlayerShots(jerseyNumber, game.gameEvents)) {
                pdf.setFontSize(14);
                pdf.text('Shot Map', margin, currentY);
                currentY += 8;

                await this.drawShotMap(pdf, game, jerseyNumber, margin, currentY, pageWidth, pageHeight);
            }
        },

        /**
         * Draw team stats row (horizontal layout, only non-zero stats)
         */
        drawTeamStatsRow(pdf, stats, x, y) {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');

            const statItems = [];

            // Only add stats that are non-zero or non-0/0
            if (stats.PTS > 0) {
                statItems.push(`PTS: ${stats.PTS}`);
            }
            if (stats.FG.attempts > 0) {
                statItems.push(`FG: ${StatCalculator.formatShot(stats.FG.made, stats.FG.attempts)}`);
            }
            if (stats['3PT'].attempts > 0) {
                statItems.push(`3PT: ${StatCalculator.formatShot(stats['3PT'].made, stats['3PT'].attempts)}`);
            }
            if (stats.FT.attempts > 0) {
                statItems.push(`FT: ${StatCalculator.formatShot(stats.FT.made, stats.FT.attempts)}`);
            }
            if (stats.REB > 0) {
                statItems.push(`REB: ${stats.REB}`);
            }
            if (stats.AST > 0) {
                statItems.push(`AST: ${stats.AST}`);
            }
            if (stats.STL > 0) {
                statItems.push(`STL: ${stats.STL}`);
            }
            if (stats.BLK > 0) {
                statItems.push(`BLK: ${stats.BLK}`);
            }
            if (stats.TO > 0) {
                statItems.push(`TO: ${stats.TO}`);
            }
            if (stats.FOULS.total > 0) {
                statItems.push(`FOULS: ${stats.FOULS.total}`);
            }

            const spacing = 27;
            statItems.forEach((item, index) => {
                pdf.text(item, x + (index * spacing), y);
            });

            return y + 5;
        },

        /**
         * Draw all players statistics table (matches Summary Section format)
         */
        drawPlayersTable(pdf, game, x, y, tableWidth) {
            const allPlayerStats = StatCalculator.calculateAllPlayerStats(
                game.teamRoster,
                game.gameEvents,
                game.playerNames
            );

            const teamStats = StatCalculator.calculateTeamStats(game.gameEvents, game.teamRoster);

            // Table headers - matching Summary Section order
            const headers = ['#', 'Name', 'PTS', 'FLS', 'FT', 'FG', '3PT', 'REB', 'AST', 'STL', 'BLK', 'TO'];
            const colWidths = [10, 40, 18, 18, 22, 22, 22, 18, 18, 18, 18, 18];

            // Header row - simplified approach
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setFillColor(240, 240, 240); // Light gray background
            pdf.setTextColor(0, 0, 0); // Black text

            let currentX = x;
            const headerHeight = 7;

            // Draw background
            currentX = x;
            colWidths.forEach(width => {
                pdf.rect(currentX, y, width, headerHeight, 'F');
                currentX += width;
            });

            // Draw text
            currentX = x;
            headers.forEach((header, i) => {
                pdf.text(header, currentX + 2, y + 5);
                currentX += colWidths[i];
            });

            y += headerHeight;
            pdf.setFont('helvetica', 'normal');

            // Data rows (player rows)
            const rowHeight = 8;
            allPlayerStats.forEach((player, rowIndex) => {
                const rowData = [
                    player.jerseyNumber.toString(),
                    player.name.substring(0, 20), // Truncate long names
                    player.PTS > 0 ? player.PTS.toString() : '',
                    player.FOULS.total > 0 ? player.FOULS.total.toString() : '',
                    player.FT.attempts > 0 ? StatCalculator.formatShot(player.FT.made, player.FT.attempts) : '',
                    player.FG.attempts > 0 ? StatCalculator.formatShot(player.FG.made, player.FG.attempts) : '',
                    player['3PT'].attempts > 0 ? StatCalculator.formatShot(player['3PT'].made, player['3PT'].attempts) : '',
                    player.REB > 0 ? player.REB.toString() : '',
                    player.AST > 0 ? player.AST.toString() : '',
                    player.STL > 0 ? player.STL.toString() : '',
                    player.BLK > 0 ? player.BLK.toString() : '',
                    player.TO > 0 ? player.TO.toString() : ''
                ];

                // Alternate row colors
                if (rowIndex % 2 === 0) {
                    pdf.setFillColor(245, 245, 245);
                    currentX = x;
                    colWidths.forEach(width => {
                        pdf.rect(currentX, y, width, rowHeight, 'F');
                        currentX += width;
                    });
                }

                currentX = x;
                rowData.forEach((data, i) => {
                    pdf.text(data, currentX + 2, y + 5);
                    currentX += colWidths[i];
                });

                y += rowHeight;
            });

            // Team total row
            pdf.setFont('helvetica', 'bold');
            pdf.setFillColor(220, 220, 220);
            currentX = x;
            colWidths.forEach(width => {
                pdf.rect(currentX, y, width, rowHeight, 'F');
                currentX += width;
            });

            const teamRowData = [
                '',
                'TEAM TOTAL',
                teamStats.PTS > 0 ? teamStats.PTS.toString() : '',
                teamStats.FOULS.total > 0 ? teamStats.FOULS.total.toString() : '',
                teamStats.FT.attempts > 0 ? StatCalculator.formatShot(teamStats.FT.made, teamStats.FT.attempts) : '',
                teamStats.FG.attempts > 0 ? StatCalculator.formatShot(teamStats.FG.made, teamStats.FG.attempts) : '',
                teamStats['3PT'].attempts > 0 ? StatCalculator.formatShot(teamStats['3PT'].made, teamStats['3PT'].attempts) : '',
                teamStats.REB > 0 ? teamStats.REB.toString() : '',
                teamStats.AST > 0 ? teamStats.AST.toString() : '',
                teamStats.STL > 0 ? teamStats.STL.toString() : '',
                teamStats.BLK > 0 ? teamStats.BLK.toString() : '',
                teamStats.TO > 0 ? teamStats.TO.toString() : ''
            ];

            currentX = x;
            teamRowData.forEach((data, i) => {
                pdf.text(data, currentX + 2, y + 5);
                currentX += colWidths[i];
            });

            y += rowHeight;

            return y;
        },

        /**
         * Draw player stats in grid layout (only non-zero stats)
         */
        drawPlayerStatsGrid(pdf, stats, x, y) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');

            const statLines = [];
            const indent = 5; // Add indent for stats

            // Only add stats that are non-zero or non-0/0
            if (stats.PTS > 0) {
                statLines.push(`Points: ${stats.PTS}`);
            }
            if (stats.FG.attempts > 0) {
                statLines.push(`Field Goals: ${StatCalculator.formatShotPercentage(stats.FG.made, stats.FG.attempts)}`);
            }
            if (stats['3PT'].attempts > 0) {
                statLines.push(`3-Pointers: ${StatCalculator.formatShotPercentage(stats['3PT'].made, stats['3PT'].attempts)}`);
            }
            if (stats.FT.attempts > 0) {
                statLines.push(`Free Throws: ${StatCalculator.formatShotPercentage(stats.FT.made, stats.FT.attempts)}`);
            }
            if (stats.REB > 0) {
                statLines.push(`Rebounds: ${stats.REB}`);
            }
            if (stats.AST > 0) {
                statLines.push(`Assists: ${stats.AST}`);
            }
            if (stats.STL > 0) {
                statLines.push(`Steals: ${stats.STL}`);
            }
            if (stats.BLK > 0) {
                statLines.push(`Blocks: ${stats.BLK}`);
            }
            if (stats.TO > 0) {
                statLines.push(`Turnovers: ${stats.TO}`);
            }
            if (stats.FOULS.total > 0) {
                statLines.push(`Fouls: ${stats.FOULS.total}`);
            }

            const colWidth = 95;
            const rowHeight = 8;

            statLines.forEach((line, index) => {
                const col = Math.floor(index / 5);
                const row = index % 5;
                pdf.text(line, x + indent + (col * colWidth), y + (row * rowHeight));
            });

            // Return Y position based on actual number of lines
            const numRows = Math.ceil(statLines.length / 2);
            return y + (numRows * rowHeight);
        },

        /**
         * Draw shot map on PDF
         * @param {jsPDF} pdf - PDF document
         * @param {Object} game - Game data
         * @param {number|null} jerseyNumber - Jersey number for player map, null for team map
         * @param {number} x - X position
         * @param {number} y - Y position
         * @param {number} pageWidth - Page width
         * @param {number} pageHeight - Page height
         */
        async drawShotMap(pdf, game, jerseyNumber, x, y, pageWidth, pageHeight) {
            // Create offscreen canvas
            const canvas = document.createElement('canvas');
            const courtAspectRatio = 50 / 94; // height/width for landscape court
            const mapWidth = pageWidth - 2 * x;
            const mapHeight = mapWidth * courtAspectRatio;

            // Set canvas dimensions (higher resolution for quality)
            const scale = 3;
            canvas.width = mapWidth * scale;
            canvas.height = mapHeight * scale;

            const ctx = canvas.getContext('2d');
            ctx.scale(scale, scale);

            // Draw court in landscape orientation
            CourtRenderer.drawBasketballCourt(ctx, mapWidth, mapHeight, true);

            // Draw shots (filtered by player if specified)
            this.drawShotsOnCanvas(ctx, game, jerseyNumber, mapWidth, mapHeight);

            // Convert canvas to image and add to PDF
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', x, y, mapWidth, mapHeight);

            // Add legend below shot map (right-justified with court)
            const legendY = y + mapHeight + 8;
            const legendX = x + mapWidth; // Right edge of court
            this.drawShotLegend(pdf, legendX, legendY);

            // Return Y position after legend with margin (legend height ~5mm + 25mm margin)
            return legendY + 30;
        },

        /**
         * Draw shots on canvas (reuses existing shot rendering logic)
         */
        drawShotsOnCanvas(ctx, game, jerseyNumber, canvasWidth, canvasHeight) {
            const shotEvents = game.gameEvents.filter(e =>
                e.eventStatus === 'active' &&
                e.action === 'shot' &&
                e.shotData &&
                e.shotData.location &&
                (jerseyNumber === null || e.playerNumber === jerseyNumber)
            );

            // Find most recent shot of the entire team (or single player if filtered)
            let mostRecentShot = null;
            shotEvents.forEach((shot) => {
                if (!mostRecentShot || shot.timestamp > mostRecentShot.timestamp) {
                    mostRecentShot = shot;
                }
            });

            const baseRadius = 5;

            shotEvents.forEach((shot) => {
                const x = shot.shotData.location.x * canvasWidth;
                const y = shot.shotData.location.y * canvasHeight;

                let radius = baseRadius;
                let color = shot.shotData.made ? '#4CAF50' : '#f44336';

                if (shot.shotData.shotType === 'FT') {
                    radius = baseRadius * 0.5;
                    color = shot.shotData.made ? '#000' : '#f44336';
                } else if (shot.shotData.shotType === '3PT') {
                    radius = baseRadius;
                    color = shot.shotData.made ? '#2196F3' : '#f44336';
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

                // Draw jersey number next to most recent shot of the entire team
                if (mostRecentShot === shot) {
                    this.drawJerseyLabel(ctx, x, y, shot.playerNumber, radius);
                }
            });
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
         * Draw jersey number next to shot (for PDF canvas)
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
         * Draw shot legend below shot map (right-aligned)
         */
        drawShotLegend(pdf, rightX, y) {
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');

            const legendItems = [
                { label: 'Made FT', color: '#000', filled: true, size: 2 },
                { label: 'Made FG', color: '#4CAF50', filled: true, size: 2.5 },
                { label: 'Made 3PT', color: '#2196F3', filled: true, size: 2.5 },
                { label: 'Miss', color: '#f44336', filled: false, size: 2.5 }
            ];

            const spacing = 35;
            const totalWidth = legendItems.length * spacing;

            // Start from right edge and work backwards
            let currentX = rightX - totalWidth;

            legendItems.forEach((item) => {
                // Draw symbol
                if (item.filled) {
                    // Draw filled circle
                    pdf.setFillColor(item.color);
                    pdf.circle(currentX + 2, y - 1, item.size, 'F');
                } else {
                    // Draw X mark
                    pdf.setDrawColor(item.color);
                    pdf.setLineWidth(0.5);
                    const xSize = item.size * 0.7;
                    pdf.line(currentX + 2 - xSize, y - 1 - xSize, currentX + 2 + xSize, y - 1 + xSize);
                    pdf.line(currentX + 2 + xSize, y - 1 - xSize, currentX + 2 - xSize, y - 1 + xSize);
                    pdf.setDrawColor(0); // Reset to black
                }

                // Draw label
                pdf.setTextColor(0, 0, 0);
                pdf.text(item.label, currentX + 6, y);

                currentX += spacing;
            });
        },

        /**
         * Generate filename for PDF
         */
        generateFilename(game) {
            const safeName = game.gameName.replace(/[^a-z0-9]/gi, '_');
            const dateStr = new Date(game.createdAt).toISOString().split('T')[0];
            return `${safeName}_${game.teamName}_${dateStr}.pdf`;
        },

        /**
         * Show loading indicator
         */
        showLoadingIndicator() {
            // Create simple loading overlay
            const overlay = document.createElement('div');
            overlay.id = 'pdf-loading-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;

            const message = document.createElement('div');
            message.style.cssText = `
                background: white;
                padding: 2rem;
                border-radius: 8px;
                font-size: 1.2rem;
                color: #333;
            `;
            message.textContent = 'Generating PDF...';

            overlay.appendChild(message);
            document.body.appendChild(overlay);
        },

        /**
         * Hide loading indicator
         */
        hideLoadingIndicator() {
            const overlay = document.getElementById('pdf-loading-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
    };
})();
