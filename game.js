const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 600;
canvas.height = 600;

// Game state
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let lives = 3;
let timeLeft = 30;
let highScore = localStorage.getItem('tigerTapperHighScore') || 0;
let tigers = [];
let particles = [];
let lastSpawnTime = 0;
let spawnInterval = 1000; // milliseconds
let comboCounter = 0;
let lastTapTime = 0;
let gameStartTime = 0;

// UI Elements
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const currentScoreEl = document.getElementById('currentScore');
const timeLeftEl = document.getElementById('timeLeft');
const livesLeftEl = document.getElementById('livesLeft');
const highScoreEl = document.getElementById('highScore');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const gameOverMessage = document.getElementById('gameOverMessage');
const controlsHint = document.getElementById('controlsHint');

// Grid configuration for tiger holes
const GRID_COLS = 3;
const GRID_ROWS = 3;
const HOLE_SIZE = 120;
const HOLE_MARGIN = 40;
const GRID_START_X = (canvas.width - (GRID_COLS * HOLE_SIZE + (GRID_COLS - 1) * HOLE_MARGIN)) / 2;
const GRID_START_Y = 80;

// Tiger class
class Tiger {
    constructor(row, col, isGolden = false) {
        this.row = row;
        this.col = col;
        this.x = GRID_START_X + col * (HOLE_SIZE + HOLE_MARGIN) + HOLE_SIZE / 2;
        this.y = GRID_START_Y + row * (HOLE_SIZE + HOLE_MARGIN) + HOLE_SIZE / 2;
        this.isGolden = isGolden;
        this.state = 'appearing'; // 'appearing', 'visible', 'disappearing'
        this.lifetime = isGolden ? 800 : 1200; // Golden tigers are faster
        this.createdAt = Date.now();
        this.scale = 0;
        this.targetScale = 1;
        this.clicked = false;
        this.radius = 40;
    }

    update(deltaTime) {
        const elapsed = Date.now() - this.createdAt;

        if (this.state === 'appearing') {
            this.scale = Math.min(1, elapsed / 150);
            if (this.scale >= 1) {
                this.state = 'visible';
            }
        } else if (this.state === 'visible') {
            // Slowly bob up and down
            this.scale = 1 + Math.sin(elapsed / 100) * 0.05;
            
            if (elapsed > this.lifetime) {
                this.state = 'disappearing';
            }
        } else if (this.state === 'disappearing') {
            this.scale = Math.max(0, 1 - (elapsed - this.lifetime) / 150);
        }

        return this.state === 'disappearing' && this.scale <= 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        // Draw tiger face
        if (this.isGolden) {
            // Golden tiger - shiny gold color
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(0.5, '#FFA500');
            gradient.addColorStop(1, '#FF8C00');
            ctx.fillStyle = gradient;
        } else {
            // Regular tiger - orange
            ctx.fillStyle = '#FF6B00';
        }

        // Head
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Stripes
        ctx.strokeStyle = this.isGolden ? '#B8860B' : '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-20, -10);
        ctx.lineTo(-30, -10);
        ctx.moveTo(-20, 5);
        ctx.lineTo(-30, 5);
        ctx.moveTo(20, -10);
        ctx.lineTo(30, -10);
        ctx.moveTo(20, 5);
        ctx.lineTo(30, 5);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-12, -5, 4, 0, Math.PI * 2);
        ctx.arc(12, -5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 8, 3, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 8, 8, 0, Math.PI);
        ctx.stroke();

        // Ears
        ctx.fillStyle = this.isGolden ? '#FFA500' : '#FF6B00';
        ctx.beginPath();
        ctx.arc(-25, -25, 12, 0, Math.PI * 2);
        ctx.arc(25, -25, 12, 0, Math.PI * 2);
        ctx.fill();

        // Golden shimmer effect
        if (this.isGolden) {
            const shimmer = (Date.now() % 1000) / 1000;
            ctx.fillStyle = `rgba(255, 255, 255, ${shimmer * 0.3})`;
            ctx.beginPath();
            ctx.arc(-10, -10, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    isPointInside(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius * this.scale;
    }
}

// Particle class for visual effects
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5 - 2;
        this.life = 1;
        this.color = color;
        this.size = Math.random() * 6 + 3;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // gravity
        this.life -= 0.02;
        return this.life <= 0;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Draw game background
function drawBackground() {
    // Ground
    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bushes/holes
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const x = GRID_START_X + col * (HOLE_SIZE + HOLE_MARGIN);
            const y = GRID_START_Y + row * (HOLE_SIZE + HOLE_MARGIN);

            // Bush background
            ctx.fillStyle = '#0d2818';
            ctx.beginPath();
            ctx.ellipse(x + HOLE_SIZE / 2, y + HOLE_SIZE / 2, HOLE_SIZE / 2, HOLE_SIZE / 2.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Darker center (hole)
            ctx.fillStyle = '#051510';
            ctx.beginPath();
            ctx.ellipse(x + HOLE_SIZE / 2, y + HOLE_SIZE / 2, HOLE_SIZE / 2.5, HOLE_SIZE / 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Grass details
            ctx.strokeStyle = '#2d5016';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                const grassX = x + HOLE_SIZE / 2 + (Math.random() - 0.5) * HOLE_SIZE * 0.7;
                const grassY = y + HOLE_SIZE / 2 + (Math.random() - 0.5) * HOLE_SIZE * 0.5;
                ctx.moveTo(grassX, grassY);
                ctx.lineTo(grassX + (Math.random() - 0.5) * 10, grassY - 10 - Math.random() * 10);
                ctx.stroke();
            }
        }
    }
}

// Spawn a new tiger
function spawnTiger() {
    // Find available positions
    const occupied = new Set(tigers.map(t => `${t.row},${t.col}`));
    const available = [];
    
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            if (!occupied.has(`${row},${col}`)) {
                available.push({ row, col });
            }
        }
    }

    if (available.length > 0) {
        const pos = available[Math.floor(Math.random() * available.length)];
        const isGolden = Math.random() < 0.15; // 15% chance for golden tiger
        tigers.push(new Tiger(pos.row, pos.col, isGolden));
    }
}

// Handle click/tap
canvas.addEventListener('click', (e) => {
    if (gameState !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    let hit = false;
    for (let i = tigers.length - 1; i >= 0; i--) {
        const tiger = tigers[i];
        if (!tiger.clicked && tiger.state === 'visible' && tiger.isPointInside(x, y)) {
            tiger.clicked = true;
            hit = true;

            // Calculate combo
            const now = Date.now();
            if (now - lastTapTime < 500) {
                comboCounter++;
            } else {
                comboCounter = 1;
            }
            lastTapTime = now;

            // Calculate score
            let points = tiger.isGolden ? 50 : 10;
            if (comboCounter > 1) {
                points += (comboCounter - 1) * 5;
            }
            score += points;

            // Create particles
            const color = tiger.isGolden ? '#FFD700' : '#FF6B00';
            for (let j = 0; j < 15; j++) {
                particles.push(new Particle(tiger.x, tiger.y, color));
            }

            // Show score popup
            showScorePopup(tiger.x, tiger.y, points, comboCounter);

            // Remove tiger
            tigers.splice(i, 1);
            
            break;
        }
    }

    updateUI();
});

// Show score popup
function showScorePopup(x, y, points, combo) {
    const popup = {
        x, y,
        points,
        combo,
        life: 1,
        offsetY: 0
    };

    const animate = () => {
        if (popup.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = popup.life;
        ctx.fillStyle = combo > 1 ? '#FFD700' : '#FFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const text = combo > 1 ? `+${points} x${combo}!` : `+${points}`;
        ctx.strokeText(text, popup.x, popup.y - popup.offsetY);
        ctx.fillText(text, popup.x, popup.y - popup.offsetY);
        ctx.restore();

        popup.offsetY += 2;
        popup.life -= 0.02;

        if (popup.life > 0) {
            requestAnimationFrame(animate);
        }
    };

    animate();
}

// Update UI elements
function updateUI() {
    currentScoreEl.textContent = score;
    timeLeftEl.textContent = timeLeft;
    livesLeftEl.textContent = lives;
    highScoreEl.textContent = highScore;
}

// Game loop
function gameLoop() {
    const now = Date.now();

    if (gameState === 'playing') {
        // Update timer
        const elapsed = (now - gameStartTime) / 1000;
        timeLeft = Math.max(0, 30 - Math.floor(elapsed));

        // Check game over conditions
        if (timeLeft <= 0 || lives <= 0) {
            endGame();
            return;
        }

        // Spawn tigers
        if (now - lastSpawnTime > spawnInterval) {
            spawnTiger();
            lastSpawnTime = now;
            // Increase difficulty over time
            spawnInterval = Math.max(400, 1000 - elapsed * 20);
        }

        // Update tigers
        for (let i = tigers.length - 1; i >= 0; i--) {
            const tiger = tigers[i];
            const shouldRemove = tiger.update();

            if (shouldRemove) {
                if (!tiger.clicked && tiger.state === 'disappearing') {
                    // Tiger escaped - lose a life
                    lives--;
                    lives = Math.max(0, lives);
                    comboCounter = 0;
                }
                tigers.splice(i, 1);
            }
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            if (particles[i].update()) {
                particles.splice(i, 1);
            }
        }

        updateUI();
    }

    // Draw everything
    drawBackground();

    // Draw tigers
    tigers.forEach(tiger => tiger.draw());

    // Draw particles
    particles.forEach(particle => particle.draw());

    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    gameState = 'playing';
    score = 0;
    lives = 3;
    timeLeft = 30;
    tigers = [];
    particles = [];
    comboCounter = 0;
    lastTapTime = 0;
    lastSpawnTime = Date.now();
    gameStartTime = Date.now();
    spawnInterval = 1000;

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    controlsHint.classList.remove('hidden');

    updateUI();
    setTimeout(() => {
        controlsHint.classList.add('hidden');
    }, 3000);
}

// End game
function endGame() {
    gameState = 'gameOver';
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('tigerTapperHighScore', highScore);
        gameOverMessage.textContent = '🎉 New High Score! 🎉';
    } else if (score > highScore * 0.8) {
        gameOverMessage.textContent = 'So Close! Great Job! 🐯';
    } else {
        gameOverMessage.textContent = 'Nice Try! Keep Tapping! 💪';
    }

    finalScoreEl.textContent = score;
    bestScoreEl.textContent = highScore;
    gameOverScreen.classList.remove('hidden');
}

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initialize
highScoreEl.textContent = highScore;
gameLoop();
