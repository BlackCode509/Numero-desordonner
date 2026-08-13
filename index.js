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
        makeAIMove();
    }
}

function initializeGame() {
    // Créer les cubes (numéros de 1 à cubesCount)
    gameState.cubesStack = [];
    for (let i = 1; i <= gameState.cubesCount; i++) {
        gameState.cubesStack.push(i);
    }
    // Mélanger les cubes
    gameState.cubesStack = gameState.cubesStack.sort(() => Math.random() - 0.5);
    
    // Initialiser les slots du casier
    gameState.lockerSlots = {};
    for (let i = 1; i <= gameState.cubesCount; i++) {
        gameState.lockerSlots[i] = null; // null = vide, numéro = rempli
    }
    
    renderLockerGrid();
    updateCurrentCube();
}

// ===== AFFICHAGE =====
function renderLockerGrid() {
    const lockerGrid = document.getElementById('lockerGrid');
    lockerGrid.innerHTML = '';
    
    for (let i = 1; i <= gameState.cubesCount; i++) {
        const slot = document.createElement('div');
        slot.className = 'locker-slot';
        slot.id = `slot-${i}`;
        
        if (gameState.lockerSlots[i] !== null) {
            slot.classList.add('filled', 'correct');
            slot.textContent = gameState.lockerSlots[i];
        } else {
            slot.textContent = i;
        }
        
        slot.onclick = () => placeNumberInSlot(i);
        lockerGrid.appendChild(slot);
    }
}

function updateCurrentCube() {
    const cubeDisplay = document.getElementById('currentCube');
    if (gameState.cubesStack.length > 0) {
        const currentNumber = gameState.cubesStack[0];
        cubeDisplay.textContent = currentNumber;
        cubeDisplay.style.display = 'flex';
    } else {
        cubeDisplay.style.display = 'none';
    }
    
    document.getElementById('stackCount').textContent = gameState.cubesStack.length;
}

function updateGameDisplay() {
    const playerName = gameState.currentPlayer === 1 ? gameState.player1Name : gameState.player2Name;
    document.getElementById('currentPlayerName').textContent = playerName;
    document.getElementById('score').textContent = 
        gameState.currentPlayer === 1 ? gameState.player1Score : gameState.player2Score;
    
    const playerTurnText = gameMode === 'ai' && gameState.currentPlayer === 2 
        ? '🤖 À l\'ordinateur de jouer...' 
        : '🎮 À toi de jouer!';
    document.getElementById('playerTurn').textContent = playerTurnText;
}

// ===== LOGIQUE DE JEU =====
function placeNumberInSlot(slotNumber) {
    if (!gameState.gameActive || gameState.gamePaused || gameState.cubesStack.length === 0) {
        return;
    }
    
    if (gameMode === 'ai' && gameState.currentPlayer === 2) {
        return; // C'est au tour de l'IA
    }
    
    const currentNumber = gameState.cubesStack[0];
    
    // Vérifier si le nombre est correctement placé
    if (currentNumber === slotNumber) {
        gameState.lockerSlots[slotNumber] = currentNumber;
        gameState.cubesStack.shift(); // Retirer le cube de la pile
        
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
        }
        
        // Passer au joueur suivant (mode 2 joueurs)
        if (gameMode === 'player') {
            switchPlayer();
        } else if (gameMode === 'ai' && gameState.currentPlayer === 1) {
            gameState.currentPlayer = 2;
            updateGameDisplay();
            setTimeout(makeAIMove, 500);
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
            setTimeout(makeAIMove, 500);
        }
    }
}

function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    updateGameDisplay();
}

// ===== IA =====
function makeAIMove() {
    if (!gameState.gameActive || gameState.cubesStack.length === 0) {
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
        if (decision) {
            placeNumberInSlot(currentNumber);
        } else {
            // Placer le cube au mauvais endroit
            const randomSlot = Math.floor(Math.random() * gameState.cubesCount) + 1;
            if (gameState.lockerSlots[randomSlot] === null) {
                placeNumberInSlot(randomSlot);
            } else {
                placeNumberInSlot(currentNumber); // Fallback
            }
        }
        
        if (gameState.currentPlayer === 1 && gameState.gameActive) {
            gameState.currentPlayer = 1;
            updateGameDisplay();
        }
    }, 1000);
}

// ===== TIMER =====
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        if (!gameState.gamePaused && gameState.gameActive) {
            gameState.timeRemaining--;
            document.getElementById('timer').textContent = gameState.timeRemaining;
            
            if (gameState.timeRemaining <= 0) {
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
    clearInterval(gameState.timerInterval);
    gameState.gameActive = false;
    goBackToSelection();
}

function restartGame() {
    clearInterval(gameState.timerInterval);
    startGame();
}

// ===== FIN DE JEU =====
function endGame(reason) {
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);
    
    const resultContent = document.getElementById('resultContent');
    const finalScores = document.getElementById('finalScores');
    
    if (reason === 'timeout') {
        document.getElementById('gameOverTitle').textContent = 'Temps écoulé!';
    } else if (reason === 'win') {
        document.getElementById('gameOverTitle').textContent = 'Tous les cubes sont rangés!';
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
});