// Game state
let gameState = {
    team: {
        name: 'New Team',
        score: 0,
        players: []
    },
    ui: {
        currentView: 'jerseyGrid',
        selectedPlayer: null
    },
    gameId: null,  // Current game ID (null for new game)
    savedAt: null,  // Timestamp of last save
    history: []  // Game action history with timestamps
};

let playerIdCounter = 0;

// ===== UTILITY FUNCTIONS =====

// Create a blank new game state
function createBlankGame(optionalTeamTemplate = null) {
    const newGame = {
        team: {
            name: optionalTeamTemplate ? optionalTeamTemplate.name : 'New Team',
            score: 0,
            players: optionalTeamTemplate ? optionalTeamTemplate.players.map(p => ({
                ...p,
                points: 0,
                rebounds: 0,
                assists: 0,
                steals: 0,
                blocks: 0,
                turnovers: 0,
                p1: 0,
                p2: 0,
                p3: 0,
                p4: 0,
                p5: 0,
                t1: 0,
                t2: 0,
                ftMade: 0,
                ftAttempts: 0,
                fgMade: 0,
                fgAttempts: 0,
                threeMade: 0,
                threeAttempts: 0
            })) : []
        },
        ui: {
            currentView: 'jerseyGrid',
            selectedPlayer: null
        },
        gameId: null,
        savedAt: null,
        history: []
    };
    return newGame;
}

// ===== GAME HISTORY FUNCTIONS =====

function logGameAction(playerId, action, value) {
    const player = gameState.team.players.find(p => p.id === playerId);
    if (!player) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});

    let description = '';
    const jerseyNum = player.number || '?';
    const playerName = player.name || 'Player';

    // Generate description based on action type
    switch(action) {
        case 'freethrow':
            description = `#${jerseyNum} ${playerName} made a free throw`;
            break;
        case 'fieldgoal':
            description = `#${jerseyNum} ${playerName} made a 2-pointer`;
            break;
        case 'threepointer':
            description = `#${jerseyNum} ${playerName} made a 3-pointer`;
            break;
        case 'miss1':
            description = `#${jerseyNum} ${playerName} missed free throw`;
            break;
        case 'miss2':
            description = `#${jerseyNum} ${playerName} missed 2-pointer`;
            break;
        case 'miss3':
            description = `#${jerseyNum} ${playerName} missed 3-pointer`;
            break;
        case 'rebound':
            description = `#${jerseyNum} ${playerName} grabbed a rebound`;
            break;
        case 'assist':
            description = `#${jerseyNum} ${playerName} recorded an assist`;
            break;
        case 'steal':
            description = `#${jerseyNum} ${playerName} made a steal`;
            break;
        case 'block':
            description = `#${jerseyNum} ${playerName} blocked a shot`;
            break;
        case 'turnover':
            description = `#${jerseyNum} ${playerName} committed a turnover`;
            break;
        case 'personal_foul_p1':
            description = `#${jerseyNum} ${playerName} committed personal foul P1`;
            break;
        case 'personal_foul_p2':
            description = `#${jerseyNum} ${playerName} committed personal foul P2`;
            break;
        case 'personal_foul_p3':
            description = `#${jerseyNum} ${playerName} committed personal foul P3`;
            break;
        case 'personal_foul_p4':
            description = `#${jerseyNum} ${playerName} committed personal foul P4`;
            break;
        case 'personal_foul_p5':
            description = `#${jerseyNum} ${playerName} committed personal foul P5`;
            break;
        case 'technical_foul_t1':
            description = `#${jerseyNum} ${playerName} committed technical foul T1`;
            break;
        case 'technical_foul_t2':
            description = `#${jerseyNum} ${playerName} committed technical foul T2`;
            break;
        case 'remove_foul_p1':
        case 'remove_foul_p2':
        case 'remove_foul_p3':
        case 'remove_foul_p4':
        case 'remove_foul_p5':
            description = `#${jerseyNum} ${playerName} foul removed (${action.replace('remove_foul_', '').toUpperCase()})`;
            break;
        case 'remove_tech_t1':
        case 'remove_tech_t2':
            description = `#${jerseyNum} ${playerName} technical foul removed (${action.replace('remove_tech_', '').toUpperCase()})`;
            break;
        case 'manual_pts_plus':
            description = `#${jerseyNum} ${playerName} manual adjustment of +${value} point${value !== 1 ? 's' : ''}`;
            break;
        case 'manual_pts_minus':
            description = `#${jerseyNum} ${playerName} manual adjustment of ${value} point${value !== -1 ? 's' : ''}`;
            break;
        case 'manual_reb_minus':
            description = `#${jerseyNum} ${playerName} manual adjustment of ${value} rebound${value !== -1 ? 's' : ''}`;
            break;
        case 'manual_ast_minus':
            description = `#${jerseyNum} ${playerName} manual adjustment of ${value} assist${value !== -1 ? 's' : ''}`;
            break;
        case 'manual_stl_minus':
            description = `#${jerseyNum} ${playerName} manual adjustment of ${value} steal${value !== -1 ? 's' : ''}`;
            break;
        case 'manual_blk_minus':
            description = `#${jerseyNum} ${playerName} manual adjustment of ${value} block${value !== -1 ? 's' : ''}`;
            break;
        case 'manual_to_minus':
            description = `#${jerseyNum} ${playerName} manual adjustment of ${value} turnover${value !== -1 ? 's' : ''}`;
            break;
        default:
            description = `#${jerseyNum} ${playerName} - ${action}`;
    }

    const historyEntry = {
        timestamp: now.toISOString(),
        timeDisplay: timeStr,
        playerId: playerId,
        jerseyNumber: jerseyNum,
        playerName: playerName,
        action: action,
        description: description
    };

    gameState.history.unshift(historyEntry); // Add to beginning of array

    // No limit on history - keep all entries

    renderGameHistory();
}

function renderGameHistory() {
    console.log('renderGameHistory: Rendering', gameState.history.length, 'total history entries');

    // Render to both the inline container and the modal view
    const inlineContainer = document.getElementById('action-history-inline-list');
    const modalContainer = document.getElementById('action-history-list');

    // Show only the latest 20 entries in inline view
    const displayHistory = gameState.history.slice(0, 20);
    console.log('renderGameHistory: Displaying latest', displayHistory.length, 'entries in inline view');

    const historyHTML = displayHistory.length === 0
        ? '<div class="history-empty">No actions yet</div>'
        : displayHistory.map(entry => `
            <div class="history-entry">
                <span class="history-time">${entry.timeDisplay}</span>
                <span class="history-description">${entry.description}</span>
            </div>
        `).join('');

    // For inline view: show latest 20
    if (inlineContainer) inlineContainer.innerHTML = historyHTML;

    // For modal view: show all history
    const modalHistoryHTML = gameState.history.length === 0
        ? '<div class="history-empty">No actions yet</div>'
        : gameState.history.map(entry => `
            <div class="history-entry">
                <span class="history-time">${entry.timeDisplay}</span>
                <span class="history-description">${entry.description}</span>
            </div>
        `).join('');
    if (modalContainer) modalContainer.innerHTML = modalHistoryHTML;
}

function clearGameHistory() {
    if (confirm('Clear all game history?')) {
        gameState.history = [];
        renderGameHistory();
        autoSaveGame();
    }
}

// ===== DATABASE FUNCTIONS (localStorage) =====

// Auto-save the current game
function autoSaveGame() {
    if (!gameState.gameId) {
        // Create new game ID if this is a new game
        gameState.gameId = 'game_' + Date.now();
    }
    gameState.savedAt = new Date().toISOString();

    // Get current page title
    const pageTitle = document.getElementById('page-title').textContent;

    const gameData = {
        id: gameState.gameId,
        savedAt: gameState.savedAt,
        pageTitle: pageTitle,
        team: {
            name: gameState.team.name,
            score: gameState.team.score,
            players: gameState.team.players  // Save complete player data as dedicated copy
        },
        history: gameState.history || []
    };

    localStorage.setItem(gameState.gameId, JSON.stringify(gameData));

    // Update game list
    let gameList = JSON.parse(localStorage.getItem('gameList') || '[]');
    const existingIndex = gameList.findIndex(g => g.id === gameState.gameId);

    const gameListItem = {
        id: gameState.gameId,
        savedAt: gameState.savedAt,
        pageTitle: pageTitle,
        teamName: gameState.team.name,
        teamScore: gameState.team.score
    };

    if (existingIndex >= 0) {
        gameList[existingIndex] = gameListItem;
    } else {
        gameList.unshift(gameListItem);
    }

    localStorage.setItem('gameList', JSON.stringify(gameList));
    console.log('Game auto-saved:', gameState.gameId);
}

// Load a game from localStorage
function loadGame(gameId) {
    const gameData = JSON.parse(localStorage.getItem(gameId));
    if (!gameData) {
        alert('Game not found!');
        return;
    }

    // Ensure backward compatibility - add missing fields to existing players
    const ensurePlayerFields = (player) => {
        return {
            ...player,
            turnovers: player.turnovers || 0,
            p1: player.p1 || 0,
            p2: player.p2 || 0,
            p3: player.p3 || 0,
            p4: player.p4 || 0,
            p5: player.p5 || 0,
            t1: player.t1 || 0,
            t2: player.t2 || 0,
            ftMade: player.ftMade || 0,
            ftAttempts: player.ftAttempts || 0,
            fgMade: player.fgMade || 0,
            fgAttempts: player.fgAttempts || 0,
            threeMade: player.threeMade || 0,
            threeAttempts: player.threeAttempts || 0
        };
    };

    // Clear current state completely before loading new game
    gameState.gameId = gameData.id;
    gameState.savedAt = gameData.savedAt;
    gameState.team = {
        ...gameData.team,
        players: gameData.team.players.map(ensurePlayerFields)
    };
    // Replace history completely (do not append)
    gameState.history = gameData.history ? [...gameData.history] : [];

    console.log('loadGame: Loaded game', gameData.id, 'with', gameState.history.length, 'history entries');

    // Restore page title if saved
    const titleElement = document.getElementById('page-title');
    if (gameData.pageTitle) {
        titleElement.textContent = gameData.pageTitle;
    } else {
        titleElement.textContent = 'Basketball Scorebook';
    }
    // Remove placeholder styling
    titleElement.style.color = '';
    titleElement.style.fontStyle = '';

    // Reset UI state
    gameState.ui.currentView = 'jerseyGrid';
    gameState.ui.selectedPlayer = null;

    // Update playerIdCounter to avoid conflicts
    const allPlayers = gameState.team.players;
    playerIdCounter = allPlayers.length > 0 ? Math.max(...allPlayers.map(p => p.id)) + 1 : 0;

    // Recalculate team total from loaded players
    calculateTeamTotal();

    // Re-render
    hidePlayerDetail();
    hideGameHistory();
    renderJerseyGrid();
    renderTeamSummary();
    updateTeamScoreDisplay();
    renderGameHistory();

    console.log(`Game loaded: ${gameData.team.name}`);
}

// Get all saved games
function getAllGames() {
    return JSON.parse(localStorage.getItem('gameList') || '[]');
}

// Delete a game
function deleteGame(gameId) {
    if (!confirm('Are you sure you want to delete this game?')) {
        return;
    }

    localStorage.removeItem(gameId);

    let gameList = JSON.parse(localStorage.getItem('gameList') || '[]');
    gameList = gameList.filter(g => g.id !== gameId);
    localStorage.setItem('gameList', JSON.stringify(gameList));

    // Refresh game history view
    showGameHistory();
}

// Start a new game
function startNewGame() {
    if (!confirm('Start a new game? Current game will be auto-saved.')) {
        return;
    }

    // ALWAYS save current game before creating new one
    autoSaveGame();

    // Check if we should load a team template
    let teamTemplate = null;
    if (gameState.team.name !== 'New Team') {
        // Try to find the team in team database
        const teamList = getAllTeams();
        const existingTeam = teamList.find(t => t.name === gameState.team.name);

        if (existingTeam) {
            // Load team roster from database as template
            const teamData = JSON.parse(localStorage.getItem(existingTeam.id));
            if (teamData && teamData.players) {
                teamTemplate = {
                    name: teamData.name,
                    players: teamData.players
                };
            }
        }
    }

    // Create new game with optional team template
    const newGame = createBlankGame(teamTemplate);

    // Reset game state
    gameState = newGame;

    // Update playerIdCounter
    const allPlayers = gameState.team.players;
    playerIdCounter = allPlayers.length > 0 ? Math.max(...allPlayers.map(p => p.id)) + 1 : 0;

    // Recalculate team total (should be 0 for new game)
    calculateTeamTotal();

    // Set title to "Game n" BEFORE saving (so it gets saved with the correct title)
    const titleElement = document.getElementById('page-title');
    const allGames = getAllGames();
    const gameNumber = allGames.length + 1;
    titleElement.textContent = `Game ${gameNumber}`;
    titleElement.style.color = '#999';
    titleElement.style.fontStyle = 'italic';

    // Auto-save the new blank game immediately (after setting title)
    autoSaveGame();

    // Re-render UI
    hidePlayerDetail();
    hideGameHistory();
    renderJerseyGrid();
    renderTeamSummary();
    updateTeamScoreDisplay();
    renderGameHistory();
}

// Export game as JSON file
function exportGame() {
    if (!gameState.gameId) {
        autoSaveGame();
    }

    const gameData = localStorage.getItem(gameState.gameId);
    const blob = new Blob([gameData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basketball_game_${gameState.gameId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import game from JSON file
function importGame(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const gameData = JSON.parse(e.target.result);

            // Save to localStorage
            localStorage.setItem(gameData.id, JSON.stringify(gameData));

            // Update game list
            let gameList = JSON.parse(localStorage.getItem('gameList') || '[]');
            const gameListItem = {
                id: gameData.id,
                savedAt: gameData.savedAt,
                pageTitle: gameData.pageTitle || 'Basketball Scorebook',
                teamName: gameData.team.name,
                teamScore: gameData.team.score
            };
            gameList.unshift(gameListItem);
            localStorage.setItem('gameList', JSON.stringify(gameList));

            alert('Game imported successfully!');
            showGameHistory();
        } catch (error) {
            alert('Error importing game: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Show/Hide Game History View
function showGameHistory() {
    document.getElementById('game-history-view').classList.remove('hidden');
    document.getElementById('game-history-view').classList.add('active');
    renderSavedGames();
}

function hideGameHistory() {
    document.getElementById('game-history-view').classList.remove('active');
    document.getElementById('game-history-view').classList.add('hidden');
}

function renderSavedGames() {
    const games = getAllGames();
    const container = document.getElementById('game-history-list');

    if (games.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No saved games yet.</p>';
        return;
    }

    container.innerHTML = games.map(game => {
        const date = new Date(game.savedAt);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const gameTitle = game.pageTitle || 'Basketball Scorebook';

        return `
            <div class="game-card">
                <div class="game-card-header">
                    <div class="game-card-title">${gameTitle}</div>
                    <div class="game-card-teams">${game.teamName}</div>
                    <div class="game-card-score">${game.teamScore} pts</div>
                </div>
                <div class="game-card-footer">
                    <div class="game-card-date">${dateStr}</div>
                    <div class="game-card-actions">
                        <button onclick="loadGame('${game.id}')" class="load-game-btn">Load</button>
                        <button onclick="deleteGame('${game.id}')" class="delete-game-btn">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Show/Hide Action Log View
function showActionLog() {
    document.getElementById('action-log-view').classList.remove('hidden');
    document.getElementById('action-log-view').classList.add('active');
    renderGameHistory();  // Populate the action log
}

function hideActionLog() {
    document.getElementById('action-log-view').classList.remove('active');
    document.getElementById('action-log-view').classList.add('hidden');
}

// ===== TEAM DATABASE FUNCTIONS =====

// Get all saved teams
function getAllTeams() {
    return JSON.parse(localStorage.getItem('teamList') || '[]');
}

// Load a team from database (for roster editing purposes, not games)
function loadTeamFromDatabase(teamId) {
    const teamData = JSON.parse(localStorage.getItem(teamId));
    if (!teamData) {
        alert('Team not found!');
        return;
    }

    // Create player with stats cleared (only roster data loaded)
    const createPlayerFromRoster = (rosterPlayer) => {
        return {
            id: rosterPlayer.id,
            number: rosterPlayer.number,
            name: rosterPlayer.name,
            points: 0,
            rebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            p1: 0,
            p2: 0,
            p3: 0,
            p4: 0,
            p5: 0,
            t1: 0,
            t2: 0,
            ftMade: 0,
            ftAttempts: 0,
            fgMade: 0,
            fgAttempts: 0,
            threeMade: 0,
            threeAttempts: 0
        };
    };

    gameState.team.name = teamData.name;
    gameState.team.players = teamData.players.map(createPlayerFromRoster);

    // Clear action log history since we're loading a team template, not a saved game
    gameState.history = [];

    // Update playerIdCounter
    const allPlayers = gameState.team.players;
    playerIdCounter = allPlayers.length > 0 ? Math.max(...allPlayers.map(p => p.id)) + 1 : 0;

    calculateTeamTotal();
    renderTeamSummary();
    updateTeamScoreDisplay();
    renderGameHistory(); // Update action log display to show it's now empty
    hideTeamSelector();
    autoSaveGame();
}

// Delete a team from database
function deleteTeamFromDatabase(teamId) {
    if (!confirm('Are you sure you want to delete this team?')) {
        return;
    }

    localStorage.removeItem(teamId);

    let teamList = JSON.parse(localStorage.getItem('teamList') || '[]');
    teamList = teamList.filter(t => t.id !== teamId);
    localStorage.setItem('teamList', JSON.stringify(teamList));

    renderSavedTeams();
}

// Show/Hide Team Selector View
function showTeamSelector() {
    document.getElementById('team-selector-view').classList.remove('hidden');
    document.getElementById('team-selector-view').classList.add('active');
    renderSavedTeams();
}

function hideTeamSelector() {
    document.getElementById('team-selector-view').classList.remove('active');
    document.getElementById('team-selector-view').classList.add('hidden');
    hideNewTeamForm();
}

function showNewTeamForm() {
    document.getElementById('new-team-form').classList.remove('hidden');
    document.getElementById('new-team-name-input').focus();
}

function hideNewTeamForm() {
    document.getElementById('new-team-form').classList.add('hidden');
    document.getElementById('new-team-name-input').value = '';
}

function createNewTeam() {
    const teamName = document.getElementById('new-team-name-input').value.trim();
    if (!teamName) {
        alert('Please enter a team name');
        return;
    }

    gameState.team.name = teamName;
    gameState.team.players = [];
    gameState.team.score = 0;

    // Save the new team to database immediately
    const teamId = 'team_' + Date.now();
    const savedTeam = {
        id: teamId,
        name: teamName,
        players: [],
        savedAt: new Date().toISOString()
    };

    localStorage.setItem(teamId, JSON.stringify(savedTeam));

    // Update team list
    let teamList = JSON.parse(localStorage.getItem('teamList') || '[]');
    const teamListItem = {
        id: teamId,
        name: teamName,
        playerCount: 0,
        savedAt: savedTeam.savedAt
    };
    teamList.unshift(teamListItem);
    localStorage.setItem('teamList', JSON.stringify(teamList));

    updateTeamScoreDisplay();
    renderJerseyGrid();
    hideTeamSelector();
    autoSaveGame();

    // Open roster editor to add players
    currentEditingTeamId = teamId;
    showRosterEditor();
}

function renderSavedTeams() {
    const teams = getAllTeams();
    const container = document.getElementById('saved-teams-list');

    if (teams.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No saved teams yet.</p>';
        return;
    }

    container.innerHTML = teams.map(team => {
        const date = new Date(team.savedAt);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        return `
            <div class="team-card">
                <div class="team-card-header">
                    <div class="team-card-name">${team.name}</div>
                </div>
                <div class="team-card-info">
                    ${team.playerCount} player${team.playerCount !== 1 ? 's' : ''} • Saved: ${dateStr}
                </div>
                <div class="team-card-actions">
                    <button onclick="loadTeamFromDatabase('${team.id}')" class="load-team-btn">Load</button>
                    <button onclick="deleteTeamFromDatabase('${team.id}')" class="delete-team-btn">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== ROSTER EDITOR FUNCTIONS =====

let currentEditingTeamId = null;

function showRosterEditor() {
    const teamData = gameState.team;

    // Check if team exists in database
    const teamList = getAllTeams();
    let existingTeam = teamList.find(t => t.name === teamData.name);

    // If team doesn't exist or has default name, create it first
    if (!existingTeam || teamData.name === 'New Team') {
        const teamName = teamData.name === 'New Team'
            ? prompt('Enter team name:')
            : teamData.name;

        if (!teamName || teamName.trim() === '') return;

        const teamId = 'team_' + Date.now();
        const savedTeam = {
            id: teamId,
            name: teamName.trim(),
            players: teamData.players.map(p => ({
                id: p.id,
                number: p.number,
                name: p.name
            })),
            savedAt: new Date().toISOString()
        };

        localStorage.setItem(teamId, JSON.stringify(savedTeam));

        // Update team list
        let teamList = JSON.parse(localStorage.getItem('teamList') || '[]');
        const teamListItem = {
            id: teamId,
            name: teamName.trim(),
            playerCount: teamData.players.length,
            savedAt: savedTeam.savedAt
        };
        teamList.unshift(teamListItem);
        localStorage.setItem('teamList', JSON.stringify(teamList));

        // Update game state team name
        gameState.team.name = teamName.trim();
        updateTeamScoreDisplay();

        currentEditingTeamId = teamId;
    } else {
        currentEditingTeamId = existingTeam.id;
    }

    document.getElementById('roster-editor-view').classList.remove('hidden');
    document.getElementById('roster-editor-view').classList.add('active');
    renderRosterEditor(currentEditingTeamId);
}

function hideRosterEditor() {
    document.getElementById('roster-editor-view').classList.remove('active');
    document.getElementById('roster-editor-view').classList.add('hidden');
    hideAddPlayerToRoster();
    currentEditingTeamId = null;
}

function renderRosterEditor(teamId) {
    console.log('renderRosterEditor: Called with teamId:', teamId);

    const teamData = JSON.parse(localStorage.getItem(teamId));
    if (!teamData) {
        console.error('renderRosterEditor: Team not found in localStorage:', teamId);
        return;
    }

    console.log('renderRosterEditor: Rendering team', teamData.name, 'with', teamData.players.length, 'players');

    document.getElementById('roster-editor-team-name-display').textContent = teamData.name;

    const container = document.getElementById('roster-editor-players-list');

    if (!container) {
        console.error('renderRosterEditor: Container element not found!');
        return;
    }

    console.log('renderRosterEditor: Container element found, current innerHTML length:', container.innerHTML.length);

    if (teamData.players.length === 0) {
        console.log('renderRosterEditor: No players, showing empty message');
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No players on this team yet.</p>';
        return;
    }

    // Sort players by jersey number
    const sortedPlayers = [...teamData.players].sort((a, b) => {
        const numA = parseInt(a.number);
        const numB = parseInt(b.number);
        const valA = isNaN(numA) ? 999 : numA;
        const valB = isNaN(numB) ? 999 : numB;
        return valA - valB;
    });

    console.log('renderRosterEditor: Sorted players:', sortedPlayers.map(p => `#${p.number} ${p.name}`).join(', '));

    // Clear container first to force re-render
    container.innerHTML = '';
    console.log('renderRosterEditor: Container cleared');

    // Build HTML
    const html = sortedPlayers.map(player => `
        <div class="roster-player-card">
            <div class="roster-player-info">
                <div class="roster-player-number">#${player.number || '?'}</div>
                <div class="roster-player-name">${player.name || 'Player'}</div>
            </div>
            <div class="roster-player-actions">
                <button onclick="editRosterPlayer(${player.id})" class="edit-roster-player-btn">Edit</button>
                <button onclick="deleteRosterPlayer(${player.id})" class="delete-roster-player-btn">Delete</button>
            </div>
        </div>
    `).join('');

    console.log('renderRosterEditor: HTML built, length:', html.length);

    // Set HTML
    container.innerHTML = html;

    console.log('renderRosterEditor: Container innerHTML set, new length:', container.innerHTML.length);
    console.log('renderRosterEditor: COMPLETE - Displayed', sortedPlayers.length, 'players');
}

function showAddPlayerToRoster() {
    document.getElementById('add-player-roster-form').classList.remove('hidden');
    document.getElementById('roster-player-number-input').focus();
}

function hideAddPlayerToRoster() {
    document.getElementById('add-player-roster-form').classList.add('hidden');
    document.getElementById('roster-player-number-input').value = '';
    document.getElementById('roster-player-name-input').value = '';
}

function submitAddPlayerToRoster() {
    if (!currentEditingTeamId) {
        console.error('submitAddPlayerToRoster: No currentEditingTeamId set!');
        return;
    }

    const number = document.getElementById('roster-player-number-input').value.trim();
    const name = document.getElementById('roster-player-name-input').value.trim();

    console.log('submitAddPlayerToRoster: Adding player', number, name, 'to team', currentEditingTeamId);

    const teamData = JSON.parse(localStorage.getItem(currentEditingTeamId));
    if (!teamData) {
        console.error('submitAddPlayerToRoster: Team data not found in localStorage');
        return;
    }

    console.log('submitAddPlayerToRoster: Team before add:', teamData.players.length, 'players');

    // Find max ID to ensure unique IDs
    const maxId = teamData.players.length > 0 ? Math.max(...teamData.players.map(p => p.id)) : -1;

    const newPlayer = {
        id: maxId + 1,
        number: number || '',
        name: name || ''
    };

    teamData.players.push(newPlayer);
    teamData.savedAt = new Date().toISOString();

    console.log('submitAddPlayerToRoster: Team after add:', teamData.players.length, 'players');

    // Save to localStorage
    localStorage.setItem(currentEditingTeamId, JSON.stringify(teamData));

    console.log('submitAddPlayerToRoster: Saved to localStorage');

    // Update team list
    let teamList = JSON.parse(localStorage.getItem('teamList') || '[]');
    const teamIndex = teamList.findIndex(t => t.id === currentEditingTeamId);
    if (teamIndex >= 0) {
        teamList[teamIndex].playerCount = teamData.players.length;
        teamList[teamIndex].savedAt = teamData.savedAt;
        localStorage.setItem('teamList', JSON.stringify(teamList));
    }

    // Update current game if this team is loaded
    if (gameState.team.name === teamData.name) {
        // Add the new player to current game with cleared stats
        const newGamePlayer = {
            id: newPlayer.id,
            number: newPlayer.number,
            name: newPlayer.name,
            points: 0,
            rebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            p1: 0,
            p2: 0,
            p3: 0,
            p4: 0,
            p5: 0,
            t1: 0,
            t2: 0,
            ftMade: 0,
            ftAttempts: 0,
            fgMade: 0,
            fgAttempts: 0,
            threeMade: 0,
            threeAttempts: 0
        };
        gameState.team.players.push(newGamePlayer);

        // Update playerIdCounter
        const allPlayers = gameState.team.players;
        playerIdCounter = allPlayers.length > 0 ? Math.max(...allPlayers.map(p => p.id)) + 1 : 0;

        calculateTeamTotal();
        renderJerseyGrid();
        renderTeamSummary();
        updateTeamScoreDisplay();
        autoSaveGame();
    }

    hideAddPlayerToRoster();

    console.log('submitAddPlayerToRoster: Calling renderRosterEditor with teamId:', currentEditingTeamId);

    // Use setTimeout to ensure DOM is ready and force re-render
    setTimeout(() => {
        renderRosterEditor(currentEditingTeamId);
    }, 0);
}

function editRosterPlayer(playerId) {
    if (!currentEditingTeamId) return;

    const teamData = JSON.parse(localStorage.getItem(currentEditingTeamId));
    if (!teamData) return;

    const player = teamData.players.find(p => p.id === playerId);
    if (!player) return;

    const newNumber = prompt('Enter new jersey number:', player.number);
    if (newNumber === null) return; // User cancelled

    const newName = prompt('Enter new player name:', player.name);
    if (newName === null) return; // User cancelled

    player.number = newNumber.trim();
    player.name = newName.trim();
    teamData.savedAt = new Date().toISOString();

    // Save to localStorage
    localStorage.setItem(currentEditingTeamId, JSON.stringify(teamData));

    // Update team list
    let teamList = JSON.parse(localStorage.getItem('teamList') || '[]');
    const teamIndex = teamList.findIndex(t => t.id === currentEditingTeamId);
    if (teamIndex >= 0) {
        teamList[teamIndex].savedAt = teamData.savedAt;
        localStorage.setItem('teamList', JSON.stringify(teamList));
    }

    // Update current game if this team is loaded
    if (gameState.team.name === teamData.name) {
        // Update the player in the current game
        const currentPlayer = gameState.team.players.find(p => p.id === playerId);
        if (currentPlayer) {
            currentPlayer.number = player.number;
            currentPlayer.name = player.name;
            renderJerseyGrid();
            autoSaveGame();
        }
    }

    renderRosterEditor(currentEditingTeamId);
}

function deleteRosterPlayer(playerId) {
    if (!currentEditingTeamId) {
        console.error('deleteRosterPlayer: No currentEditingTeamId set!');
        return;
    }

    if (!confirm('Are you sure you want to delete this player from the roster?')) {
        return;
    }

    console.log('deleteRosterPlayer: Deleting player', playerId, 'from team', currentEditingTeamId);

    const teamData = JSON.parse(localStorage.getItem(currentEditingTeamId));
    if (!teamData) {
        console.error('deleteRosterPlayer: Team data not found in localStorage');
        return;
    }

    console.log('deleteRosterPlayer: Team before delete:', teamData.players.length, 'players');

    teamData.players = teamData.players.filter(p => p.id !== playerId);
    teamData.savedAt = new Date().toISOString();

    console.log('deleteRosterPlayer: Team after delete:', teamData.players.length, 'players');

    // Save to localStorage
    localStorage.setItem(currentEditingTeamId, JSON.stringify(teamData));

    console.log('deleteRosterPlayer: Saved to localStorage');

    // Update team list
    let teamList = JSON.parse(localStorage.getItem('teamList') || '[]');
    const teamIndex = teamList.findIndex(t => t.id === currentEditingTeamId);
    if (teamIndex >= 0) {
        teamList[teamIndex].playerCount = teamData.players.length;
        teamList[teamIndex].savedAt = teamData.savedAt;
        localStorage.setItem('teamList', JSON.stringify(teamList));
    }

    // Update current game if this team is loaded
    if (gameState.team.name === teamData.name) {
        // Remove the player from the current game
        gameState.team.players = gameState.team.players.filter(p => p.id !== playerId);
        calculateTeamTotal();
        renderJerseyGrid();
        updateTeamScoreDisplay();
        autoSaveGame();
    }

    console.log('deleteRosterPlayer: Calling renderRosterEditor with teamId:', currentEditingTeamId);

    // Use setTimeout to ensure DOM is ready and force re-render
    setTimeout(() => {
        renderRosterEditor(currentEditingTeamId);
    }, 0);
}

function renameTeamInRoster() {
    if (!currentEditingTeamId) return;

    const teamData = JSON.parse(localStorage.getItem(currentEditingTeamId));
    if (!teamData) return;

    const newName = prompt('Enter new team name:', teamData.name);
    if (!newName || newName.trim() === '' || newName.trim() === teamData.name) return;

    const oldName = teamData.name;
    teamData.name = newName.trim();
    teamData.savedAt = new Date().toISOString();

    // Save to localStorage
    localStorage.setItem(currentEditingTeamId, JSON.stringify(teamData));

    // Update team list
    let teamList = JSON.parse(localStorage.getItem('teamList') || '[]');
    const teamIndex = teamList.findIndex(t => t.id === currentEditingTeamId);
    if (teamIndex >= 0) {
        teamList[teamIndex].name = teamData.name;
        teamList[teamIndex].savedAt = teamData.savedAt;
        localStorage.setItem('teamList', JSON.stringify(teamList));
    }

    // Update current game if this team is loaded (check by old name)
    if (gameState.team.name === oldName) {
        gameState.team.name = teamData.name;
        updateTeamScoreDisplay();
        autoSaveGame();
    }

    // Re-render roster editor with new name
    renderRosterEditor(currentEditingTeamId);
}

// Navigation Functions
function switchTab() {
    // Hide player detail view when switching tabs
    if (gameState.ui.currentView === 'playerDetail') {
        hidePlayerDetail();
    }

    calculateTeamTotal();
    renderJerseyGrid();
    renderTeamSummary();
    updateTeamScoreDisplay();
}

function showPlayerDetail(playerId) {
    gameState.ui.currentView = 'playerDetail';
    gameState.ui.selectedPlayer = playerId;
    document.getElementById('player-detail-view').classList.remove('hidden');
    document.getElementById('player-detail-view').classList.add('active');
    renderPlayerDetail(playerId);
    history.pushState({view: 'detail', playerId}, '');

    // Scroll to player detail view
    document.getElementById('player-detail-view').scrollIntoView({behavior: 'smooth'});
}

function hidePlayerDetail() {
    gameState.ui.currentView = 'jerseyGrid';
    gameState.ui.selectedPlayer = null;

    const playerDetailView = document.getElementById('player-detail-view');
    if (playerDetailView) {
        playerDetailView.classList.remove('active');
        playerDetailView.classList.add('hidden');
    }

    // Scroll back to top
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// Rendering Functions
function renderJerseyGrid() {
    const grid = document.getElementById('jersey-grid');

    // Check if grid element exists (it may not in current UI)
    if (!grid) {
        console.log('renderJerseyGrid: jersey-grid element not found, skipping');
        return;
    }

    const players = gameState.team.players;

    // Sort players by jersey number
    const sortedPlayers = players.sort((a, b) => {
        const numA = parseInt(a.number);
        const numB = parseInt(b.number);
        const valA = isNaN(numA) ? 999 : numA;
        const valB = isNaN(numB) ? 999 : numB;
        return valA - valB;
    });

    // Render jersey buttons
    const jerseyButtons = sortedPlayers.map(player => `
        <button class="jersey-button" onclick="showPlayerDetail(${player.id})">
            <span class="jersey-number">#${player.number || '?'}</span>
            <span class="jersey-name">${player.name || 'Player'}</span>
        </button>
    `).join('');

    // Add the "Add Player" button at the end
    const addPlayerButton = `
        <button class="add-player-btn" onclick="addPlayer()">
            +
        </button>
    `;

    grid.innerHTML = jerseyButtons + addPlayerButton;

    // Also render team summary when rendering jersey grid
    renderTeamSummary();
}

function renderTeamSummary() {
    const container = document.getElementById('team-summary-table');
    const players = gameState.team.players;

    // Show all players regardless of stats
    const section = document.getElementById('team-summary-section');
    if (players.length === 0) {
        section.style.display = 'none';
        return;
    } else {
        section.style.display = 'block';
    }

    // Sort by jersey number
    const sortedPlayers = [...players].sort((a, b) => {
        const numA = parseInt(a.number);
        const numB = parseInt(b.number);
        const valA = isNaN(numA) ? 999 : numA;
        const valB = isNaN(numB) ? 999 : numB;
        return valA - valB;
    });

    // Build table HTML
    let tableHTML = `
        <div class="team-summary-header">
            <div class="summary-col summary-col-jersey">#</div>
            <div class="summary-col summary-col-name">Name</div>
            <div class="summary-col summary-col-pts">PTS</div>
            <div class="summary-col summary-col-fouls">FLS</div>
            <div class="summary-col summary-col-fg">FT</div>
            <div class="summary-col summary-col-fg">FG</div>
            <div class="summary-col summary-col-fg">3PT</div>
            <div class="summary-col summary-col-reb">REB</div>
            <div class="summary-col summary-col-ast">AST</div>
            <div class="summary-col summary-col-stl">STL</div>
            <div class="summary-col summary-col-blk">BLK</div>
            <div class="summary-col summary-col-to">TO</div>
        </div>
    `;

    // Calculate team totals
    let totalPts = 0, totalFouls = 0;
    let totalFtMade = 0, totalFtAttempts = 0;
    let totalFgMade = 0, totalFgAttempts = 0;
    let total3ptMade = 0, total3ptAttempts = 0;
    let totalReb = 0, totalAst = 0, totalStl = 0, totalBlk = 0, totalTo = 0;

    sortedPlayers.forEach(player => {
        const playerFouls = (player.p1 || 0) + (player.p2 || 0) + (player.p3 || 0) +
                          (player.p4 || 0) + (player.p5 || 0) + (player.t1 || 0) + (player.t2 || 0);

        // Helper function to display stats (hide zeros)
        const displayStat = (value) => value > 0 ? value : '';
        const displayFraction = (made, attempts) => {
            if (made === 0 && attempts === 0) return '';
            return `${made}/${attempts}`;
        };

        const ftDisplay = displayFraction(player.ftMade || 0, player.ftAttempts || 0);
        const fgDisplay = displayFraction(player.fgMade || 0, player.fgAttempts || 0);
        const threePtDisplay = displayFraction(player.threeMade || 0, player.threeAttempts || 0);

        tableHTML += `
            <div class="team-summary-row" data-player-id="${player.id}" onclick="toggleInlinePlayerDetail(${player.id}, this)">
                <div class="summary-col summary-col-jersey">
                    <span class="jersey-number-badge">${player.number || '?'}</span>
                </div>
                <div class="summary-col summary-col-name">${player.name || 'Player'}</div>
                <div class="summary-col summary-col-pts">${displayStat(player.points)}</div>
                <div class="summary-col summary-col-fouls">${displayStat(playerFouls)}</div>
                <div class="summary-col summary-col-fg">${ftDisplay}</div>
                <div class="summary-col summary-col-fg">${fgDisplay}</div>
                <div class="summary-col summary-col-fg">${threePtDisplay}</div>
                <div class="summary-col summary-col-reb">${displayStat(player.rebounds)}</div>
                <div class="summary-col summary-col-ast">${displayStat(player.assists)}</div>
                <div class="summary-col summary-col-stl">${displayStat(player.steals)}</div>
                <div class="summary-col summary-col-blk">${displayStat(player.blocks)}</div>
                <div class="summary-col summary-col-to">${displayStat(player.turnovers)}</div>
            </div>
        `;

        // Add to totals
        totalPts += player.points || 0;
        totalFouls += playerFouls;
        totalFtMade += player.ftMade || 0;
        totalFtAttempts += player.ftAttempts || 0;
        totalFgMade += player.fgMade || 0;
        totalFgAttempts += player.fgAttempts || 0;
        total3ptMade += player.threeMade || 0;
        total3ptAttempts += player.threeAttempts || 0;
        totalReb += player.rebounds || 0;
        totalAst += player.assists || 0;
        totalStl += player.steals || 0;
        totalBlk += player.blocks || 0;
        totalTo += player.turnovers || 0;
    });

    // Add team totals row
    const totalFtDisplay = totalFtMade === 0 && totalFtAttempts === 0 ? '' : `${totalFtMade}/${totalFtAttempts}`;
    const totalFgDisplay = totalFgMade === 0 && totalFgAttempts === 0 ? '' : `${totalFgMade}/${totalFgAttempts}`;
    const total3ptDisplay = total3ptMade === 0 && total3ptAttempts === 0 ? '' : `${total3ptMade}/${total3ptAttempts}`;

    tableHTML += `
        <div class="team-summary-row team-total-row">
            <div class="summary-col summary-col-jersey"></div>
            <div class="summary-col summary-col-name">TEAM TOTAL</div>
            <div class="summary-col summary-col-pts">${totalPts || ''}</div>
            <div class="summary-col summary-col-fouls">${totalFouls || ''}</div>
            <div class="summary-col summary-col-fg">${totalFtDisplay}</div>
            <div class="summary-col summary-col-fg">${totalFgDisplay}</div>
            <div class="summary-col summary-col-fg">${total3ptDisplay}</div>
            <div class="summary-col summary-col-reb">${totalReb || ''}</div>
            <div class="summary-col summary-col-ast">${totalAst || ''}</div>
            <div class="summary-col summary-col-stl">${totalStl || ''}</div>
            <div class="summary-col summary-col-blk">${totalBlk || ''}</div>
            <div class="summary-col summary-col-to">${totalTo || ''}</div>
        </div>
    `;

    container.innerHTML = tableHTML;
}

// Toggle inline player detail view
function toggleInlinePlayerDetail(playerId, rowElement) {
    const existingDetail = rowElement.nextElementSibling;

    // If detail is already open for this player, close it
    if (existingDetail && existingDetail.classList.contains('inline-player-detail')) {
        existingDetail.remove();
        rowElement.classList.remove('expanded');
        return;
    }

    // Close any other open details
    document.querySelectorAll('.inline-player-detail').forEach(detail => detail.remove());
    document.querySelectorAll('.team-summary-row.expanded').forEach(row => row.classList.remove('expanded'));

    // Mark this row as expanded
    rowElement.classList.add('expanded');

    // Scroll the row to the top of the screen
    setTimeout(() => {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    // Get player data
    const player = gameState.team.players.find(p => p.id === playerId);
    if (!player) return;

    // Clone template
    const template = document.getElementById('player-detail-template');
    const detailClone = template.content.cloneNode(true);
    const detailDiv = detailClone.querySelector('.inline-player-detail');

    // Populate player info
    detailDiv.querySelector('.player-number-inline').textContent = `#${player.number || '?'}`;
    detailDiv.querySelector('.player-name-inline').textContent = player.name || 'Player';

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-player-detail-btn';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => {
        detailDiv.remove();
        rowElement.classList.remove('expanded');
    };
    detailDiv.querySelector('.player-header-row').appendChild(closeBtn);

    // Setup foul buttons
    const foulButtons = detailDiv.querySelectorAll('.foul-btn:not(.tech)');
    foulButtons.forEach((btn, index) => {
        const foulNum = `p${index + 1}`;
        if (player[foulNum]) btn.classList.add('active');
        btn.onclick = () => {
            // Add animation class
            btn.classList.add('clicked');

            togglePersonalFoul(playerId, foulNum);
            updateInlinePlayerDetail(playerId, detailDiv);

            // Auto-close after animation
            setTimeout(() => {
                detailDiv.remove();
                rowElement.classList.remove('expanded');
            }, 600);
        };
    });

    const techButtons = detailDiv.querySelectorAll('.foul-btn.tech');
    techButtons.forEach((btn, index) => {
        const techNum = `t${index + 1}`;
        if (player[techNum]) btn.classList.add('active');
        btn.onclick = () => {
            // Add animation class
            btn.classList.add('clicked');

            toggleTechnicalFoul(playerId, techNum);
            updateInlinePlayerDetail(playerId, detailDiv);

            // Auto-close after animation
            setTimeout(() => {
                detailDiv.remove();
                rowElement.classList.remove('expanded');
            }, 600);
        };
    });

    // Setup scoring buttons
    const madeButtons = detailDiv.querySelectorAll('.score-btn.made');
    madeButtons.forEach(btn => {
        btn.onclick = () => {
            // Add animation class
            btn.classList.add('clicked');

            const points = parseInt(btn.dataset.points);
            updatePlayerStat(playerId, 'points', points);
            if (points === 1) {
                player.ftMade++;
                player.ftAttempts++;
            } else if (points === 2) {
                player.fgMade++;
                player.fgAttempts++;
            } else if (points === 3) {
                player.threeMade++;
                player.threeAttempts++;
            }
            calculateTeamTotal();
            let action = '';
            if (points === 1) action = 'freethrow';
            else if (points === 2) action = 'fieldgoal';
            else if (points === 3) action = 'threepointer';
            logGameAction(playerId, action);
            updateInlinePlayerDetail(playerId, detailDiv);

            // Auto-close after animation
            setTimeout(() => {
                detailDiv.remove();
                rowElement.classList.remove('expanded');
            }, 600);
        };
    });

    const missButtons = detailDiv.querySelectorAll('.score-btn.miss');
    missButtons.forEach(btn => {
        btn.onclick = () => {
            // Add animation class
            btn.classList.add('clicked');

            const missType = parseInt(btn.dataset.miss);
            if (missType === 1) player.ftAttempts++;
            else if (missType === 2) player.fgAttempts++;
            else if (missType === 3) player.threeAttempts++;
            let action = '';
            if (missType === 1) action = 'miss1';
            else if (missType === 2) action = 'miss2';
            else if (missType === 3) action = 'miss3';
            logGameAction(playerId, action);
            updateInlinePlayerDetail(playerId, detailDiv);

            // Auto-close after animation
            setTimeout(() => {
                detailDiv.remove();
                rowElement.classList.remove('expanded');
            }, 600);
        };
    });

    // Setup stat buttons with current values
    const statButtons = detailDiv.querySelectorAll('.stat-btn');
    const stats = ['rebounds', 'assists', 'steals', 'blocks', 'turnovers'];
    statButtons.forEach((btn, index) => {
        const stat = stats[index];
        const badge = btn.querySelector('.stat-value-badge');
        badge.textContent = player[stat] || 0;
        btn.onclick = () => {
            // Add animation class
            btn.classList.add('clicked');

            updatePlayerStat(playerId, stat, 1);
            let action = '';
            if (stat === 'rebounds') action = 'rebound';
            else if (stat === 'assists') action = 'assist';
            else if (stat === 'steals') action = 'steal';
            else if (stat === 'blocks') action = 'block';
            else if (stat === 'turnovers') action = 'turnover';
            logGameAction(playerId, action);
            updateInlinePlayerDetail(playerId, detailDiv);

            // Auto-close after animation
            setTimeout(() => {
                detailDiv.remove();
                rowElement.classList.remove('expanded');
            }, 600);
        };
    });

    // Setup correction buttons
    const correctionButtons = detailDiv.querySelectorAll('.correction-btn');
    correctionButtons.forEach(btn => {
        const text = btn.textContent;
        btn.onclick = () => {
            // Add animation class
            btn.classList.add('clicked');

            let stat = '';
            let change = 0;
            if (text === '+PT') { stat = 'points'; change = 1; }
            else if (text === '-PT') { stat = 'points'; change = -1; }
            else if (text === '-REB') { stat = 'rebounds'; change = -1; }
            else if (text === '-AST') { stat = 'assists'; change = -1; }
            else if (text === '-STL') { stat = 'steals'; change = -1; }
            else if (text === '-BLK') { stat = 'blocks'; change = -1; }
            else if (text === '-TO') { stat = 'turnovers'; change = -1; }

            updatePlayerStat(playerId, stat, change);
            if (stat === 'points') calculateTeamTotal();

            // Log action
            let action = '';
            if (change > 0 && stat === 'points') action = 'manual_pts_plus';
            else if (change < 0 && stat === 'points') action = 'manual_pts_minus';
            else if (change < 0 && stat === 'rebounds') action = 'manual_reb_minus';
            else if (change < 0 && stat === 'assists') action = 'manual_ast_minus';
            else if (change < 0 && stat === 'steals') action = 'manual_stl_minus';
            else if (change < 0 && stat === 'blocks') action = 'manual_blk_minus';
            else if (change < 0 && stat === 'turnovers') action = 'manual_to_minus';

            if (action) logGameAction(playerId, action, change);

            updateInlinePlayerDetail(playerId, detailDiv);

            // Auto-close after animation
            setTimeout(() => {
                detailDiv.remove();
                rowElement.classList.remove('expanded');
            }, 600);
        };
    });

    // Insert after the row
    rowElement.after(detailDiv);
}

// Update inline player detail view without closing/reopening
function updateInlinePlayerDetail(playerId, detailDiv) {
    const player = gameState.team.players.find(p => p.id === playerId);
    if (!player) return;

    // Update foul buttons
    const foulButtons = detailDiv.querySelectorAll('.foul-btn:not(.tech)');
    foulButtons.forEach((btn, index) => {
        const foulNum = `p${index + 1}`;
        if (player[foulNum]) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const techButtons = detailDiv.querySelectorAll('.foul-btn.tech');
    techButtons.forEach((btn, index) => {
        const techNum = `t${index + 1}`;
        if (player[techNum]) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update stat badges
    const stats = ['rebounds', 'assists', 'steals', 'blocks', 'turnovers'];
    const statButtons = detailDiv.querySelectorAll('.stat-btn');
    statButtons.forEach((btn, index) => {
        const stat = stats[index];
        const badge = btn.querySelector('.stat-value-badge');
        badge.textContent = player[stat] || 0;
    });

    // Update team summary, score display, and save
    renderTeamSummary();
    updateTeamScoreDisplay();
    autoSaveGame();
}

function renderPlayerDetail(playerId) {
    const player = gameState.team.players.find(p => p.id === playerId);
    if (!player) {
        hidePlayerDetail();
        return;
    }

    // Update header
    document.querySelector('.player-number').textContent = `#${player.number || '?'}`;
    document.querySelector('.player-name').textContent = player.name || 'Player';

    // Attach shooting button handlers
    document.querySelectorAll('.shooting-button.made').forEach(btn => {
        btn.onclick = () => {
            const points = parseInt(btn.dataset.points);
            const player = gameState.team.players.find(p => p.id === playerId);
            if (!player) return;

            updatePlayerStat(playerId, 'points', points);

            // Track made and attempts
            if (points === 1) {
                player.ftMade++;
                player.ftAttempts++;
            } else if (points === 2) {
                player.fgMade++;
                player.fgAttempts++;
            } else if (points === 3) {
                player.threeMade++;
                player.threeAttempts++;
            }

            calculateTeamTotal();

            // Log to game history
            let action = '';
            if (points === 1) action = 'freethrow';
            else if (points === 2) action = 'fieldgoal';
            else if (points === 3) action = 'threepointer';
            logGameAction(playerId, action);

            renderPlayerDetail(playerId);
            renderTeamSummary();  // Update team summary
            autoSaveGame();  // Auto-save after scoring
        };
    });

    // Miss buttons
    document.querySelectorAll('.shooting-button.miss').forEach(btn => {
        btn.onclick = () => {
            const missType = parseInt(btn.dataset.miss);
            const player = gameState.team.players.find(p => p.id === playerId);
            if (!player) return;

            // Track attempts only (not made)
            if (missType === 1) {
                player.ftAttempts++;
            } else if (missType === 2) {
                player.fgAttempts++;
            } else if (missType === 3) {
                player.threeAttempts++;
            }

            let action = '';
            if (missType === 1) action = 'miss1';
            else if (missType === 2) action = 'miss2';
            else if (missType === 3) action = 'miss3';

            logGameAction(playerId, action);
            renderPlayerDetail(playerId);
            renderTeamSummary();  // Update team summary
            autoSaveGame();  // Auto-save after miss
        };
    });

    // Render shooting stats
    const shootingStatsContainer = document.querySelector('.shooting-stats');
    shootingStatsContainer.innerHTML = `
        <div class="shooting-stat-box">
            <div class="shooting-stat-fraction">${player.ftMade || 0}/${player.ftAttempts || 0}</div>
            <div class="shooting-stat-label">FT</div>
        </div>
        <div class="shooting-stat-box">
            <div class="shooting-stat-fraction">${player.fgMade || 0}/${player.fgAttempts || 0}</div>
            <div class="shooting-stat-label">FG</div>
        </div>
        <div class="shooting-stat-box">
            <div class="shooting-stat-fraction">${player.threeMade || 0}/${player.threeAttempts || 0}</div>
            <div class="shooting-stat-label">3PT</div>
        </div>
    `;

    // Render stats grid
    const statsGrid = document.querySelector('.stats-grid');
    const stats = [
        {key: 'points', label: 'PTS'},
        {key: 'rebounds', label: 'REB'},
        {key: 'assists', label: 'AST'},
        {key: 'steals', label: 'STL'},
        {key: 'blocks', label: 'BLK'},
        {key: 'turnovers', label: 'TO'}
    ];

    statsGrid.innerHTML = stats.map(stat => `
        <div class="stat-card">
            <div class="stat-label">${stat.label}</div>
            <div class="stat-value">${player[stat.key] || 0}</div>
            <div class="stat-controls">
                <button onclick="updatePlayerStatAndRefresh(${playerId}, '${stat.key}', -1)">−</button>
                <button onclick="updatePlayerStatAndRefresh(${playerId}, '${stat.key}', 1)">+</button>
            </div>
        </div>
    `).join('');

    // Add fouls section with individual foul buttons
    statsGrid.innerHTML += `
        <div class="stat-card fouls-card">
            <div class="stat-label">FOULS</div>
            <div class="foul-buttons">
                <button class="foul-btn ${(player.p1 || 0) > 0 ? 'active' : ''}" onclick="togglePersonalFoul(${playerId}, 'p1')">P1</button>
                <button class="foul-btn ${(player.p2 || 0) > 0 ? 'active' : ''}" onclick="togglePersonalFoul(${playerId}, 'p2')">P2</button>
                <button class="foul-btn ${(player.p3 || 0) > 0 ? 'active' : ''}" onclick="togglePersonalFoul(${playerId}, 'p3')">P3</button>
                <button class="foul-btn ${(player.p4 || 0) > 0 ? 'active' : ''}" onclick="togglePersonalFoul(${playerId}, 'p4')">P4</button>
                <button class="foul-btn ${(player.p5 || 0) > 0 ? 'active' : ''}" onclick="togglePersonalFoul(${playerId}, 'p5')">P5</button>
            </div>
            <div class="foul-buttons tech-fouls">
                <button class="foul-btn tech ${(player.t1 || 0) > 0 ? 'active' : ''}" onclick="toggleTechnicalFoul(${playerId}, 't1')">T1</button>
                <button class="foul-btn tech ${(player.t2 || 0) > 0 ? 'active' : ''}" onclick="toggleTechnicalFoul(${playerId}, 't2')">T2</button>
            </div>
        </div>
    `;

    // Render game history
    renderGameHistory();
}

function updateTeamScoreDisplay() {
    const teamNameElement = document.getElementById('team-name-display');
    const teamName = gameState.team.name;

    // Check if it's a new/default team name
    if (teamName === 'New Team') {
        teamNameElement.textContent = 'New Team';
        teamNameElement.classList.add('placeholder');
    } else {
        teamNameElement.textContent = teamName;
        teamNameElement.classList.remove('placeholder');
    }

    document.getElementById('team-total-display').textContent = `${gameState.team.score} pts`;
}

// Team Total Calculation
function calculateTeamTotal() {
    const total = gameState.team.players.reduce((sum, player) => {
        return sum + (player.points || 0);
    }, 0);
    gameState.team.score = total;
    return total;
}

// Player Management
function addPlayer() {
    // Check if input form is already showing
    const existingForm = document.getElementById('add-player-form');
    if (existingForm) {
        existingForm.remove();
    }

    // Show inline input form
    showAddPlayerForm();
}

function showAddPlayerForm() {
    const grid = document.getElementById('jersey-grid');

    // Create form HTML
    const formHTML = `
        <div id="add-player-form" class="add-player-form">
            <input type="text" id="player-number-input" class="player-input" placeholder="#" maxlength="3">
            <input type="text" id="player-name-input" class="player-input" placeholder="name (optional)" maxlength="20">
            <button onclick="submitAddPlayer()" class="submit-player-btn">✓</button>
            <button onclick="cancelAddPlayer()" class="cancel-player-btn">✕</button>
        </div>
    `;

    // Insert form before the Add Player button
    const addButton = grid.querySelector('.add-player-btn');
    addButton.insertAdjacentHTML('beforebegin', formHTML);

    // Focus on the jersey number input
    document.getElementById('player-number-input').focus();

    // Add enter key handler
    document.getElementById('player-number-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('player-name-input').focus();
        }
    });

    document.getElementById('player-name-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitAddPlayer();
        }
    });
}

function submitAddPlayer() {
    const number = document.getElementById('player-number-input').value.trim();
    const name = document.getElementById('player-name-input').value.trim();

    const player = {
        id: playerIdCounter++,
        number: number || '',
        name: name || '',
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        p1: 0,
        p2: 0,
        p3: 0,
        p4: 0,
        p5: 0,
        t1: 0,
        t2: 0,
        ftMade: 0,
        ftAttempts: 0,
        fgMade: 0,
        fgAttempts: 0,
        threeMade: 0,
        threeAttempts: 0
    };

    gameState.team.players.push(player);
    calculateTeamTotal();
    renderJerseyGrid();
    updateTeamScoreDisplay();
    autoSaveGame();  // Auto-save game after adding player
}

function cancelAddPlayer() {
    const form = document.getElementById('add-player-form');
    if (form) {
        form.remove();
    }
}

// Show add player dialog using prompt
function showAddPlayerDialog() {
    const number = prompt('Enter jersey number:');
    if (number === null) return; // User cancelled

    const name = prompt('Enter player name (optional):');
    if (name === null) return; // User cancelled

    const player = {
        id: playerIdCounter++,
        number: number.trim() || '',
        name: name.trim() || '',
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        p1: 0,
        p2: 0,
        p3: 0,
        p4: 0,
        p5: 0,
        t1: 0,
        t2: 0,
        ftMade: 0,
        ftAttempts: 0,
        fgMade: 0,
        fgAttempts: 0,
        threeMade: 0,
        threeAttempts: 0
    };

    gameState.team.players.push(player);
    calculateTeamTotal();
    renderTeamSummary();
    updateTeamScoreDisplay();
    autoSaveGame();
}

function removePlayer(playerId) {
    gameState.team.players = gameState.team.players.filter(p => p.id !== playerId);
    calculateTeamTotal();
    renderJerseyGrid();
    updateTeamScoreDisplay();
    autoSaveGame();  // Auto-save after removing player
}

function updatePlayerStat(playerId, stat, change) {
    const player = gameState.team.players.find(p => p.id === playerId);
    if (player) {
        player[stat] += change;
        if (player[stat] < 0) player[stat] = 0;
    }
}

// Helper function for updating stats from detail view
function updatePlayerStatAndRefresh(playerId, stat, change) {
    let action = '';

    if (change > 0) {
        // Positive changes: use natural descriptions for non-points stats
        if (stat === 'points') action = `manual_pts_plus`;
        else if (stat === 'rebounds') action = 'rebound';
        else if (stat === 'assists') action = 'assist';
        else if (stat === 'steals') action = 'steal';
        else if (stat === 'blocks') action = 'block';
        else if (stat === 'turnovers') action = 'turnover';
    } else {
        // Negative changes: use manual adjustment messaging for all stats
        if (stat === 'points') action = `manual_pts_minus`;
        else if (stat === 'rebounds') action = `manual_reb_minus`;
        else if (stat === 'assists') action = `manual_ast_minus`;
        else if (stat === 'steals') action = `manual_stl_minus`;
        else if (stat === 'blocks') action = `manual_blk_minus`;
        else if (stat === 'turnovers') action = `manual_to_minus`;
    }

    if (action) {
        logGameAction(playerId, action, change);
    }

    updatePlayerStat(playerId, stat, change);
    if (stat === 'points') {
        calculateTeamTotal();
    }
    renderPlayerDetail(playerId);
    renderTeamSummary();  // Update team summary
    autoSaveGame();  // Auto-save after stat change
}

// Toggle personal foul buttons
function togglePersonalFoul(playerId, foulNum) {
    const player = gameState.team.players.find(p => p.id === playerId);
    if (!player) return;

    // Toggle the foul (0 or 1)
    player[foulNum] = player[foulNum] ? 0 : 1;

    // Log the action
    const action = player[foulNum] ? `personal_foul_${foulNum}` : `remove_foul_${foulNum}`;
    logGameAction(playerId, action);

    // Update team summary first
    renderTeamSummary();

    // Only render player detail if it's currently visible
    const playerDetailView = document.getElementById('player-detail-view');
    if (playerDetailView && playerDetailView.classList.contains('active')) {
        renderPlayerDetail(playerId);
    }

    autoSaveGame();
}

// Toggle technical foul buttons
function toggleTechnicalFoul(playerId, techNum) {
    const player = gameState.team.players.find(p => p.id === playerId);
    if (!player) return;

    // Toggle the technical foul (0 or 1)
    player[techNum] = player[techNum] ? 0 : 1;

    // Log the action
    const action = player[techNum] ? `technical_foul_${techNum}` : `remove_tech_${techNum}`;
    logGameAction(playerId, action);

    // Update team summary first
    renderTeamSummary();

    // Only render player detail if it's currently visible
    const playerDetailView = document.getElementById('player-detail-view');
    if (playerDetailView && playerDetailView.classList.contains('active')) {
        renderPlayerDetail(playerId);
    }

    autoSaveGame();
}

function updatePlayerInfo(playerId, field, value) {
    const player = gameState.team.players.find(p => p.id === playerId);
    if (player) {
        player[field] = value;
    }
}

// Reset game
function resetGame() {
    if (confirm('Are you sure you want to reset the entire game? All data will be lost.')) {
        gameState = createBlankGame();
        playerIdCounter = 0;

        // Reset to jersey grid
        hidePlayerDetail();
        switchTab();
    }
}

// History API handling for back button
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.view === 'detail') {
        showPlayerDetail(event.state.playerId);
    } else {
        if (gameState.ui.currentView === 'playerDetail') {
            hidePlayerDetail();
        }
    }
});

// Edit page title function
function editPageTitle() {
    const currentTitle = document.getElementById('page-title').textContent;
    const newTitle = prompt('Enter new title:', currentTitle);
    if (newTitle && newTitle.trim() !== '') {
        const titleElement = document.getElementById('page-title');
        titleElement.textContent = newTitle.trim();
        // Remove placeholder styling
        titleElement.style.color = '';
        titleElement.style.fontStyle = '';
        // Auto-save game to update title in database
        if (gameState.gameId) {
            autoSaveGame();
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Auto-load latest game if exists
    const games = getAllGames();
    if (games.length > 0) {
        const latestGame = games[0]; // Games are sorted newest first
        loadGame(latestGame.id);
    } else {
        // No games exist - create and save a new blank game
        gameState = createBlankGame();
        playerIdCounter = 0;

        // Calculate initial team total
        calculateTeamTotal();

        // Set title to "Game n" BEFORE saving (so it gets saved with the correct title)
        const titleElement = document.getElementById('page-title');
        const allGames = getAllGames();
        const gameNumber = allGames.length + 1;
        titleElement.textContent = `Game ${gameNumber}`;
        titleElement.style.color = '#999';
        titleElement.style.fontStyle = 'italic';

        // Auto-save the new blank game (after setting title)
        autoSaveGame();

        // Render UI
        renderJerseyGrid();
        renderTeamSummary();
        updateTeamScoreDisplay();
        renderGameHistory();
    }
});
