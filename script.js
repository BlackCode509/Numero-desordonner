// Variables globales
let gameMode = 'player'; // 'player' ou 'ai'
let gameState = {
    currentPlayer: 1,
    player1Name: 'Joueur 1',
    player2Name: 'Joueur 2',
    player1Score: 0,
    player2Score: 0,
    timeLimit: 60,
    timeRemaining: 60,
    difficulty: 'normal',
    cubesCount: 16,
    cubesStack: [],
    lockerSlots: {},
    gameActive: false,
    gamePaused: false,
    timerInterval: null
};

const difficultySettings = {
    easy: { cubes: 20, name: 'Facile' },
    normal: { cubes: 16, name: 'Normal' },
    hard: { cubes: 12, name: 'Difficile' }
};

// ===== GESTION DES ÉCRANS =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function selectGameMode(mode) {
    gameMode = mode;
    const player2Label = document.getElementById('player2Label');
    const player2Input = document.getElementById('player2Name');
    
    if (mode === 'ai') {
        player2Label.textContent = 'Nom de l\'ordinateur:';
        player2Input.value = 'Ordinateur';
        player2Input.disabled = true;
    } else {
        player2Label.textContent = 'Nom du joueur 2:';
        player2Input.value = 'Joueur 2';
        player2Input.disabled = false;
    }
    
    showScreen('configScreen');
}

function goBackToSelection() {
    clearInterval(gameState.timerInterval);
    gameState.gameActive = false;
    showScreen('playerSelectionScreen');
}

// ===== INITIALISATION DU JEU =====
function startGame() {
    const timeInput = document.getElementById('timeInput').value;
    const difficulty = document.getElementById('difficultySelect').value;
    const player1Name = document.getElementById('player1Name').value;
    const player2Name = document.getElementById('player2Name').value;
    
    gameState.timeLimit = parseInt(timeInput) || 60;
    gameState.timeRemaining = gameState.timeLimit;
    gameState.difficulty = difficulty;
    gameState.cubesCount = difficultySettings[difficulty].cubes;
    gameState.player1Name = player1Name || 'Joueur 1';
    gameState.player2Name = player2Name || 'Joueur 2';
    gameState.player1Score = 0;
    gameState.player2Score = 0;
    gameState.currentPlayer = 1;
    gameState.gameActive = true;
    gameState.gamePaused = false;
    
    initializeGame();
    showScreen('gameScreen');
    startTimer();
    updateGameDisplay();
    
    if (gameMode === 'ai' && gameState.currentPlayer === 2) {
        setTimeout(makeAIMove, 1000);
    }
}

function initializeGame() {
    // Créer les cubes (numéros de 1 à cubesCount)
    gameState.cubesStack = [];
    for (let i = 1; i <= gameState.cubesCount; i++) {
        gameState.cubesStack.push(i);
    }
    
    // Mélanger les cubes
    for (let i = gameState.cubesStack.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.cubesStack[i], gameState.cubesStack[j]] = [gameState.cubesStack[j], gameState.cubesStack[i]];
    }
    
    // Initialiser les slots du casier
    gameState.lockerSlots = {};
    for (let i = 1; i <= gameState.cubesCount; i++) {
        gameState.lockerSlots[i] = null; // null = vide, numéro = rempli
    }
    
    renderLockerGrid();
    updateCurrentCube();
}

function resetGame() {
    clearInterval(gameState.timerInterval);
    gameState.gameActive = false;
    gameState.gamePaused = false;
    gameState.cubesStack = [];
    gameState.lockerSlots = {};
}

// ===== AFFICHAGE =====
function renderLockerGrid() {
    const lockerGrid = document.getElementById('lockerGrid');
    if (!lockerGrid) return;
    
    lockerGrid.innerHTML = '';
    
    for (let i = 1; i <= gameState.cubesCount; i++) {
        const slot = document.createElement('div');
        slot.className = 'locker-slot';
        slot.id = `slot-${i}`;
        
        if (gameState.lockerSlots[i] !== null && gameState.lockerSlots[i] !== undefined) {
            slot.classList.add('filled');
            slot.classList.add('correct');
            slot.textContent = gameState.lockerSlots[i];
            slot.style.cursor = 'default';
        } else {
            slot.textContent = i;
            slot.style.color = '#999';
            slot.style.cursor = 'pointer';
        }
        
        slot.onclick = () => placeNumberInSlot(i);
        lockerGrid.appendChild(slot);
    }
}

function updateCurrentCube() {
    const cubeDisplay = document.getElementById('currentCube');
    if (!cubeDisplay) return;
    
    if (gameState.cubesStack.length > 0) {
        const currentNumber = gameState.cubesStack[0];
        cubeDisplay.textContent = currentNumber;
        cubeDisplay.style.display = 'flex';
    } else {
        cubeDisplay.style.display = 'none';
    }
    
    const stackCount = document.getElementById('stackCount');
    if (stackCount) {
        stackCount.textContent = gameState.cubesStack.length;
    }
}

function updateGameDisplay() {
    const playerName = gameState.currentPlayer === 1 ? gameState.player1Name : gameState.player2Name;
    const currentPlayerNameEl = document.getElementById('currentPlayerName');
    if (currentPlayerNameEl) {
        currentPlayerNameEl.textContent = playerName;
    }
    
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
        scoreEl.textContent = gameState.currentPlayer === 1 ? gameState.player1Score : gameState.player2Score;
    }
    
    const playerTurnEl = document.getElementById('playerTurn');
    if (playerTurnEl) {
        const playerTurnText = gameMode === 'ai' && gameState.currentPlayer === 2 
            ? '🤖 À l\'ordinateur de jouer...' 
            : '🎮 À toi de jouer!';
        playerTurnEl.textContent = playerTurnText;
    }
}

// ===== LOGIQUE DE JEU =====
function placeNumberInSlot(slotNumber) {
    if (!gameState.gameActive || gameState.gamePaused || gameState.cubesStack.length === 0) {
        return;
    }
    
    if (gameMode === 'ai' && gameState.currentPlayer === 2) {
        return;
    }
    
    if (gameState.lockerSlots[slotNumber] !== null && gameState.lockerSlots[slotNumber] !== undefined) {
        return; // Slot déjà rempli
    }
    
    const currentNumber = gameState.cubesStack[0];
    
    // Vérifier si le nombre est correctement placé
    if (currentNumber === slotNumber) {
        gameState.lockerSlots[slotNumber] = currentNumber;
        gameState.cubesStack.shift();
        
        // Ajouter des points
        if (gameState.currentPlayer === 1) {
            gameState.player1Score += 10;
        } else {
            gameState.player2Score += 10;
        }
        
        renderLockerGrid();
        updateCurrentCube();
        updateGameDisplay();
        
        // Vérifier si le jeu est terminé
        if (gameState.cubesStack.length === 0) {
            endGame('win');
            return;
        }
        
        // Passer au joueur suivant (mode 2 joueurs)
        if (gameMode === 'player') {
            switchPlayer();
        } else if (gameMode === 'ai' && gameState.currentPlayer === 1) {
            gameState.currentPlayer = 2;
            updateGameDisplay();
            setTimeout(makeAIMove, 800);
        }
    } else {
        // Mauvais placement
        if (gameState.currentPlayer === 1) {
            gameState.player1Score = Math.max(0, gameState.player1Score - 5);
        } else {
            gameState.player2Score = Math.max(0, gameState.player2Score - 5);
        }
        
        updateGameDisplay();
        
        // Passer au joueur suivant
        if (gameMode === 'player') {
            switchPlayer();
        } else if (gameMode === 'ai' && gameState.currentPlayer === 1) {
            gameState.currentPlayer = 2;
            updateGameDisplay();
            setTimeout(makeAIMove, 800);
        }
    }
}

function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    updateGameDisplay();
}

// ===== IA =====
function makeAIMove() {
    if (!gameState.gameActive || gameState.cubesStack.length === 0 || gameState.currentPlayer !== 2) {
        return;
    }
    
    const currentNumber = gameState.cubesStack[0];
    const difficulty = gameState.difficulty;
    
    let decision;
    
    if (difficulty === 'easy') {
        decision = Math.random() < 0.8; // 80% de chance de bien jouer
    } else if (difficulty === 'normal') {
        decision = Math.random() < 0.6; // 60% de chance de bien jouer
    } else {
        decision = Math.random() < 0.4; // 40% de chance de bien jouer
    }
    
    setTimeout(() => {
        if (!gameState.gameActive || gameState.cubesStack.length === 0) {
            return;
        }
        
        if (decision) {
            placeNumberInSlot(currentNumber);
        } else {
            // Placer le cube au mauvais endroit
            let randomSlot;
            let attempts = 0;
            do {
                randomSlot = Math.floor(Math.random() * gameState.cubesCount) + 1;
                attempts++;
            } while ((gameState.lockerSlots[randomSlot] !== null && gameState.lockerSlots[randomSlot] !== undefined) && attempts < 10);
            
            if (randomSlot !== currentNumber) {
                placeNumberInSlot(randomSlot);
            } else {
                placeNumberInSlot(currentNumber);
            }
        }
        
        if (gameState.currentPlayer === 1 && gameState.gameActive) {
            gameState.currentPlayer = 1;
            updateGameDisplay();
        }
    }, 1200);
}

// ===== TIMER =====
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        if (!gameState.gamePaused && gameState.gameActive) {
            gameState.timeRemaining--;
            const timerEl = document.getElementById('timer');
            if (timerEl) {
                timerEl.textContent = gameState.timeRemaining;
            }
            
            if (gameState.timeRemaining <= 0) {
                clearInterval(gameState.timerInterval);
                endGame('timeout');
            }
        }
    }, 1000);
}

function pauseGame() {
    gameState.gamePaused = true;
    showScreen('pauseScreen');
}

function resumeGame() {
    gameState.gamePaused = false;
    showScreen('gameScreen');
}

function quitGame() {
    resetGame();
    goBackToSelection();
}

function restartGame() {
    resetGame();
    startGame();
}

// ===== FIN DE JEU =====
function endGame(reason) {
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);
    
    const resultContent = document.getElementById('resultContent');
    const finalScores = document.getElementById('finalScores');
    const gameOverTitle = document.getElementById('gameOverTitle');
    
    if (!resultContent || !finalScores || !gameOverTitle) {
        console.error('Éléments du game over non trouvés');
        return;
    }
    
    if (reason === 'timeout') {
        gameOverTitle.textContent = 'Temps écoulé!';
    } else if (reason === 'win') {
        gameOverTitle.textContent = 'Tous les cubes sont rangés!';
    }
    
    // Déterminer le gagnant
    let winnerText = '';
    if (gameState.player1Score > gameState.player2Score) {
        winnerText = `<h2 style="color: #56ab2f;">🎉 ${gameState.player1Name} a gagné!</h2>`;
    } else if (gameState.player2Score > gameState.player1Score) {
        winnerText = `<h2 style="color: #56ab2f;">🎉 ${gameState.player2Name} a gagné!</h2>`;
    } else {
        winnerText = `<h2 style="color: #667eea;">🤝 C'est une égalité!</h2>`;
    }
    
    resultContent.innerHTML = winnerText;
    
    finalScores.innerHTML = `
        <div class="score-item">
            <span class="name">${gameState.player1Name}</span>
            <span class="score">${gameState.player1Score} pts</span>
        </div>
        <div class="score-item">
            <span class="name">${gameState.player2Name}</span>
            <span class="score">${gameState.player2Score} pts</span>
        </div>
    `;
    
    showScreen('gameOverScreen');
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    showScreen('playerSelectionScreen');
    console.log('Jeu initialisé');
});