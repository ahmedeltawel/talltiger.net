// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = 500;
    const width = Math.min(maxWidth, container.clientWidth - 40);
    canvas.width = width;
    canvas.height = 600;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game Variables
let gameState = 'start'; // start, playing, gameOver
let score = 0;
let towerHeight = 0;
let highScore = localStorage.getItem('tallTigerHighScore') || 0;
let tigers = [];
let currentTiger = null;
let platform = null;
let swingDirection = 1;
let swingSpeed = 2;
let gravity = 0.5;
let gameLoop;

// UI Elements
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const currentScoreEl = document.getElementById('currentScore');
const towerHeightEl = document.getElementById('towerHeight');
const highScoreEl = document.getElementById('highScore');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const heightMessageEl = document.getElementById('heightMessage');
const controlsHint = document.getElementById('controlsHint');

// Update high score display
highScoreEl.textContent = highScore;

// Tiger Class
class Tiger {
    constructor(x, y, isSwinging = false) {
        this.width = 60;
        this.height = 60;
        this.x = x;
        this.y = y;
        this.velocityY = 0;
        this.velocityX = 0;
        this.isSwinging = isSwinging;
        this.isFalling = false;
        this.rotation = 0;
        this.rotationSpeed = 0;
    }

    draw() {
        ctx.save();
        
        // Translate to tiger center for rotation
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // Draw tiger emoji
        ctx.font = `${this.width}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add shadow for depth
        if (!this.isFalling) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }
        
        ctx.fillText('🐯', 0, 0);
        
        ctx.restore();
    }

    update() {
        if (this.isSwinging) {
            // Swing back and forth
            this.x += swingSpeed * swingDirection;
            
            // Reverse direction at edges
            if (this.x <= 0) {
                this.x = 0;
                swingDirection = 1;
            }
            if (this.x >= canvas.width - this.width) {
                this.x = canvas.width - this.width;
                swingDirection = -1;
            }
        } else if (!this.isFalling) {
            // Apply gravity
            this.velocityY += gravity;
            this.y += this.velocityY;
            
            // Check collision with platform
            if (platform && this.checkCollision(platform)) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.isFalling = false;
            }
            
            // Check collision with other tigers
            for (let other of tigers) {
                if (other !== this && !other.isFalling && this.checkCollision(other)) {
                    this.y = other.y - this.height;
                    this.velocityY = 0;
                    this.isFalling = false;
                    
                    // Add slight wobble effect
                    this.rotation = (Math.random() - 0.5) * 0.1;
                    break;
                }
            }
            
            // Check if tiger fell off screen
            if (this.y > canvas.height) {
                this.isFalling = true;
                endGame();
            }
            
            // Check if tiger fell off platform horizontally
            if (this.y + this.height > platform.y - 10) {
                let tigerCenterX = this.x + this.width / 2;
                if (tigerCenterX < platform.x || tigerCenterX > platform.x + platform.width) {
                    this.isFalling = true;
                    this.velocityX = (Math.random() - 0.5) * 5;
                    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
                    endGame();
                }
            }
        } else {
            // Falling animation
            this.velocityY += gravity;
            this.y += this.velocityY;
            this.x += this.velocityX;
            this.rotation += this.rotationSpeed;
        }
    }

    checkCollision(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y &&
               this.velocityY > 0;
    }

    drop() {
        this.isSwinging = false;
        this.velocityY = 0;
    }
}

// Platform Class
class Platform {
    constructor() {
        this.width = 150;
        this.height = 20;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 50;
    }

    draw() {
        // Ground/grass effect
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Grass on top
        ctx.fillStyle = '#228B22';
        ctx.fillRect(this.x, this.y, this.width, 5);
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x, this.y + this.height, this.width, 3);
    }
}

// Initialize game
function initGame() {
    tigers = [];
    score = 0;
    towerHeight = 0;
    swingDirection = 1;
    currentScoreEl.textContent = '0';
    towerHeightEl.textContent = '0m';
    controlsHint.classList.remove('hidden');
    
    // Create platform
    platform = new Platform();
    
    // Create first swinging tiger
    currentTiger = new Tiger(canvas.width / 2 - 30, 50, true);
}

// Spawn next tiger
function spawnNextTiger() {
    if (gameState !== 'playing') return;
    
    score++;
    currentScoreEl.textContent = score;
    
    // Calculate tower height
    if (tigers.length > 0) {
        let topTiger = tigers.reduce((highest, tiger) => 
            tiger.y < highest.y ? tiger : highest
        );
        towerHeight = Math.floor((canvas.height - 50 - topTiger.y) / 10);
        towerHeightEl.textContent = towerHeight + 'm';
    }
    
    // Spawn new tiger at top
    setTimeout(() => {
        if (gameState === 'playing') {
            currentTiger = new Tiger(canvas.width / 2 - 30, 50, true);
        }
    }, 500);
}

// Drop current tiger
function dropTiger() {
    if (gameState !== 'playing' || !currentTiger || !currentTiger.isSwinging) return;
    
    currentTiger.drop();
    tigers.push(currentTiger);
    
    spawnNextTiger();
}

// Game update function
function update() {
    if (gameState !== 'playing' && gameState !== 'gameOver') return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw platform
    platform.draw();

    // Update and draw tigers
    for (let tiger of tigers) {
        tiger.update();
        tiger.draw();
    }

    // Update and draw current swinging tiger
    if (currentTiger) {
        currentTiger.update();
        currentTiger.draw();
    }

    requestAnimationFrame(update);
}

// Start game
function startGame() {
    gameState = 'playing';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    initGame();
    update();
}

// End game
function endGame() {
    if (gameState === 'gameOver') return;
    
    gameState = 'gameOver';
    controlsHint.classList.add('hidden');
    
    // Calculate final score (subtract 1 because we count the falling tiger)
    let finalScore = Math.max(0, score - 1);
    
    // Update high score
    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem('tallTigerHighScore', highScore);
        highScoreEl.textContent = highScore;
    }
    
    // Show messages based on performance
    let message = '';
    if (finalScore === 0) {
        message = 'Try again! You can do better! 💪';
    } else if (finalScore < 5) {
        message = 'Good start! Keep practicing! 🎯';
    } else if (finalScore < 10) {
        message = 'Nice tower! You\'re getting good! 🌟';
    } else if (finalScore < 20) {
        message = 'Impressive! That\'s a tall tower! 🏗️';
    } else if (finalScore < 30) {
        message = 'Amazing! You\'re a stacking master! 🏆';
    } else {
        message = 'LEGENDARY! Unbelievable tower! 👑';
    }
    
    finalScoreEl.textContent = finalScore;
    bestScoreEl.textContent = highScore;
    heightMessageEl.textContent = message;
    
    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
    }, 1000);
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Click/tap to drop tiger
canvas.addEventListener('click', dropTiger);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    dropTiger();
});

// Spacebar to drop
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (gameState === 'start') {
            startGame();
        } else if (gameState === 'playing') {
            dropTiger();
        } else if (gameState === 'gameOver') {
            startGame();
        }
    }
});

// Prevent default touch behavior
canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

// Initialize
initGame();
