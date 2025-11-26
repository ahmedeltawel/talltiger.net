// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = 600;
    const width = Math.min(maxWidth, container.clientWidth - 40);
    canvas.width = width;
    canvas.height = 600;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game Variables
let gameState = 'start'; // start, playing, gameOver
let score = 0;
let highScore = localStorage.getItem('tallTigerHighScore') || 0;
let platforms = [];
let player;
let keys = {};
let gameLoop;

// UI Elements
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const currentScoreEl = document.getElementById('currentScore');
const highScoreEl = document.getElementById('highScore');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');

// Update high score display
highScoreEl.textContent = highScore + 'm';

// Player Class
class Player {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 150;
        this.velocityY = 0;
        this.velocityX = 0;
        this.gravity = 0.5;
        this.jumpPower = -15;
        this.speed = 5;
    }

    draw() {
        // Draw tiger emoji or simple tiger representation
        ctx.save();
        
        // Tiger body (orange)
        ctx.fillStyle = '#FF8C00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Tiger stripes (black)
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 5, this.y + 5, 3, 30);
        ctx.fillRect(this.x + 15, this.y + 5, 3, 30);
        ctx.fillRect(this.x + 25, this.y + 5, 3, 30);
        ctx.fillRect(this.x + 35, this.y + 5, 3, 30);
        
        // Tiger face (simplified)
        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.x + 8, this.y + 5, 8, 8);
        ctx.fillRect(this.x + 24, this.y + 5, 8, 8);
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 10, this.y + 8, 3, 3);
        ctx.fillRect(this.x + 27, this.y + 8, 3, 3);
        
        ctx.restore();
    }

    update() {
        // Horizontal movement
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.velocityX = -this.speed;
        } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.velocityX = this.speed;
        } else {
            this.velocityX = 0;
        }

        this.x += this.velocityX;

        // Wrap around screen
        if (this.x > canvas.width) {
            this.x = -this.width;
        } else if (this.x + this.width < 0) {
            this.x = canvas.width;
        }

        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Check platform collisions
        if (this.velocityY > 0) { // Only check when falling
            platforms.forEach(platform => {
                if (this.x + this.width > platform.x &&
                    this.x < platform.x + platform.width &&
                    this.y + this.height > platform.y &&
                    this.y + this.height < platform.y + platform.height &&
                    this.velocityY > 0) {
                    
                    this.velocityY = this.jumpPower;
                    platform.hit = true;
                }
            });
        }

        // Move camera when player is in top half
        if (this.y < canvas.height / 2 && this.velocityY < 0) {
            this.y = canvas.height / 2;
            
            // Move platforms down
            platforms.forEach(platform => {
                platform.y -= this.velocityY;
            });

            // Update score
            score += Math.abs(Math.floor(this.velocityY / 10));
            currentScoreEl.textContent = score + 'm';
        }

        // Game over if player falls off bottom
        if (this.y > canvas.height) {
            endGame();
        }
    }
}

// Platform Class
class Platform {
    constructor(x, y, width) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 12;
        this.hit = false;
    }

    draw() {
        ctx.fillStyle = this.hit ? '#4CAF50' : '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(this.x, this.y, this.width, 4);
    }
}

// Initialize game
function initGame() {
    player = new Player();
    platforms = [];
    score = 0;
    currentScoreEl.textContent = '0m';

    // Create initial platforms
    platforms.push(new Platform(canvas.width / 2 - 40, canvas.height - 100, 80));
    
    for (let i = 0; i < 10; i++) {
        createPlatform();
    }
}

// Create new platform
function createPlatform() {
    const x = Math.random() * (canvas.width - 80);
    const y = platforms.length > 0 ? 
        platforms[platforms.length - 1].y - 60 - Math.random() * 40 : 
        canvas.height - 100;
    const width = 60 + Math.random() * 40;
    
    platforms.push(new Platform(x, y, width));
}

// Game update function
function update() {
    if (gameState !== 'playing') return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw platforms
    platforms = platforms.filter(platform => platform.y < canvas.height + 100);
    
    platforms.forEach(platform => {
        platform.draw();
    });

    // Add new platforms as needed
    while (platforms.length < 15) {
        createPlatform();
    }

    // Update and draw player
    player.update();
    player.draw();

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
    gameState = 'gameOver';
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('tallTigerHighScore', highScore);
        highScoreEl.textContent = highScore + 'm';
    }
    
    finalScoreEl.textContent = score;
    bestScoreEl.textContent = highScore + 'm';
    gameOverScreen.classList.remove('hidden');
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Keyboard controls
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Start game with space or enter if on start screen
    if ((e.key === ' ' || e.key === 'Enter') && gameState === 'start') {
        e.preventDefault();
        startGame();
    }
    
    // Restart game with space or enter if game over
    if ((e.key === ' ' || e.key === 'Enter') && gameState === 'gameOver') {
        e.preventDefault();
        startGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch controls for mobile
let touchStartX = 0;
let touchCurrentX = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchCurrentX = touchStartX;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    touchCurrentX = e.touches[0].clientX;
    
    const diff = touchCurrentX - touchStartX;
    
    if (diff > 5) {
        keys['ArrowRight'] = true;
        keys['ArrowLeft'] = false;
    } else if (diff < -5) {
        keys['ArrowLeft'] = true;
        keys['ArrowRight'] = false;
    }
});

canvas.addEventListener('touchend', () => {
    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = false;
});

// Prevent default touch behavior on canvas
canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// Initialize
initGame();

