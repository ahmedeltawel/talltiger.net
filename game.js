const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 1000;
canvas.height = 500;

// Game state
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let distance = 0;
let bestScore = localStorage.getItem('skyPilotBest') || 0;
let gameSpeed = 2;
let frameCount = 0;

// Player
const player = {
    x: 100,
    y: canvas.height / 2,
    width: 62,
    height: 38,
    targetY: canvas.height / 2,
    speed: 0.15
};

// Game objects
let obstacles = [];
let stars = [];
let particles = [];
let clouds = [];

// UI Elements
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const currentScoreEl = document.getElementById('currentScore');
const bestScore2El = document.getElementById('bestScore2');
const distanceFlownEl = document.getElementById('distanceFlown');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const gameOverMessage = document.getElementById('gameOverMessage');
const endTitle = document.getElementById('endTitle');
const controlsHint = document.getElementById('controlsHint');

// Obstacle class
class Obstacle {
    constructor() {
        this.width = 50;
        this.gap = 188;
        this.x = canvas.width;
        this.topHeight = Math.random() * (canvas.height - this.gap - 125) + 62;
        this.passed = false;
    }

    update() {
        this.x -= gameSpeed;
    }

    draw() {
        // Top obstacle
        ctx.fillStyle = '#FF6B35';
        ctx.shadowColor = 'rgba(255, 107, 53, 0.6)';
        ctx.shadowBlur = 20;
        ctx.fillRect(this.x, 0, this.width, this.topHeight);
        
        // Bottom obstacle
        ctx.fillRect(this.x, this.topHeight + this.gap, this.width, canvas.height);
        ctx.shadowBlur = 0;
        
        // Highlight edges
        ctx.fillStyle = '#FF8C42';
        ctx.fillRect(this.x, this.topHeight - 5, this.width, 5);
        ctx.fillRect(this.x, this.topHeight + this.gap, this.width, 5);
    }

    collidesWith(player) {
        if (player.x + player.width - 10 < this.x || player.x + 10 > this.x + this.width) {
            return false;
        }
        
        if (player.y < this.topHeight || player.y + player.height > this.topHeight + this.gap) {
            return true;
        }
        
        if (!this.passed && player.x > this.x + this.width) {
            this.passed = true;
            score += 10;
            return false;
        }
        
        return false;
    }
}

// Star class
class Star {
    constructor(safeY = null) {
        this.x = canvas.width + 125; // Spawn further right
        this.y = safeY !== null ? safeY : Math.random() * (canvas.height - 75) + 38;
        this.size = 25;
        this.collected = false;
        this.rotation = 0;
    }

    update() {
        this.x -= gameSpeed;
        this.rotation += 0.05;
    }

    draw() {
        if (this.collected) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 15;
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', 0, 0);
        
        ctx.restore();
    }

    collidesWith(player) {
        if (this.collected) return false;
        
        const dx = (player.x + player.width / 2) - this.x;
        const dy = (player.y + player.height / 2) - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.size + player.width / 2) {
            this.collected = true;
            score += 50;
            createParticles(this.x, this.y, '#FFD700');
            return true;
        }
        return false;
    }
}

// Floating icon class (background decoration)
class Cloud {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 31 + 25;
        this.speed = Math.random() * 0.5 + 0.3;
        this.opacity = Math.random() * 0.4 + 0.15;
        this.icon = Math.random() > 0.5 ? '🐯' : '🌿';
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }

    update() {
        this.x -= this.speed;
        this.rotation += this.rotationSpeed;
        if (this.x + this.size < 0) {
            this.x = canvas.width + this.size;
            this.y = Math.random() * canvas.height;
            this.icon = Math.random() > 0.5 ? '🐯' : '🌿';
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, 0, 0);
        ctx.restore();
    }
}

// Particle class
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
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

// Create particles
function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Spawn star in safe position
function spawnStar() {
    // Find the next obstacle that will be on screen when star spawns
    let nextObstacle = null;
    const starSpawnX = canvas.width + 100;
    
    for (let obstacle of obstacles) {
        if (obstacle.x > canvas.width - 200) {
            nextObstacle = obstacle;
            break;
        }
    }
    
    // If we found an obstacle, spawn star in its gap
    if (nextObstacle) {
        // Spawn star in the middle of the gap with some randomness
        const gapMiddle = nextObstacle.topHeight + nextObstacle.gap / 2;
        const randomOffset = (Math.random() - 0.5) * (nextObstacle.gap - 80); // Leave 40px margin on each side
        const safeY = gapMiddle + randomOffset;
        
        stars.push(new Star(safeY));
    } else {
        // No obstacle nearby, spawn anywhere safe
        const safeY = Math.random() * (canvas.height - 125) + 62;
        stars.push(new Star(safeY));
    }
}

// Initialize floating icons
function initClouds() {
    clouds = [];
    for (let i = 0; i < 12; i++) {
        clouds.push(new Cloud());
    }
}

// Draw player airplane
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    // Airplane body
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 15;
    
    // Fuselage
    ctx.beginPath();
    ctx.ellipse(0, 0, player.width / 2, player.height / 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wings
    ctx.fillStyle = '#FF8C42';
    ctx.shadowColor = 'rgba(255, 140, 66, 0.6)';
    ctx.beginPath();
    ctx.moveTo(-player.width / 4, 0);
    ctx.lineTo(-player.width / 2, player.height / 2);
    ctx.lineTo(player.width / 4, 0);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(-player.width / 4, 0);
    ctx.lineTo(-player.width / 2, -player.height / 2);
    ctx.lineTo(player.width / 4, 0);
    ctx.fill();
    
    // Nose
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(player.width / 2, 0);
    ctx.lineTo(player.width / 2 + 10, -5);
    ctx.lineTo(player.width / 2 + 10, 5);
    ctx.fill();
    
    // Engine trail
    if (gameState === 'playing') {
        ctx.fillStyle = `rgba(255, 107, 53, ${0.3 + Math.random() * 0.3})`;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(-player.width / 2 - 5, 0, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

// Update game
function update() {
    if (gameState !== 'playing') return;
    
    frameCount++;
    distance += gameSpeed;
    
    // Smooth player movement
    player.y += (player.targetY - player.y) * player.speed;
    
    // Gradually increase difficulty
    if (frameCount % 300 === 0) {
        gameSpeed += 0.3;
    }
    
    // Spawn obstacles
    if (frameCount % 120 === 0) {
        obstacles.push(new Obstacle());
    }
    
    // Spawn stars (ensure they're in safe positions)
    if (frameCount % 150 === 0) {
        spawnStar();
    }
    
    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        
        if (obstacles[i].collidesWith(player)) {
            endGame();
            return;
        }
        
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
    
    // Update stars
    for (let i = stars.length - 1; i >= 0; i--) {
        stars[i].update();
        stars[i].collidesWith(player);
        
        if (stars[i].x + stars[i].size < 0) {
            stars.splice(i, 1);
        }
    }
    
    // Update clouds
    clouds.forEach(cloud => cloud.update());
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].update()) {
            particles.splice(i, 1);
        }
    }
    
    updateUI();
}

// Draw game
function draw() {
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    clouds.forEach(cloud => cloud.draw());
    
    // Draw obstacles
    obstacles.forEach(obstacle => obstacle.draw());
    
    // Draw stars
    stars.forEach(star => star.draw());
    
    // Draw particles
    particles.forEach(particle => particle.draw());
    
    // Draw player
    drawPlayer();
    
    requestAnimationFrame(() => {
        update();
        draw();
    });
}

// Update UI
function updateUI() {
    currentScoreEl.textContent = score;
    bestScore2El.textContent = bestScore;
    distanceFlownEl.textContent = Math.floor(distance / 2) + 'm';
}

// Mouse control
canvas.addEventListener('mousemove', (e) => {
    if (gameState !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    player.targetY = (e.clientY - rect.top) * (canvas.height / rect.height) - player.height / 2;
    player.targetY = Math.max(0, Math.min(canvas.height - player.height, player.targetY));
});

// Keyboard control
document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing') return;
    
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        player.targetY = Math.max(0, player.targetY - 40);
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        player.targetY = Math.min(canvas.height - player.height, player.targetY + 40);
    }
});

// Touch control
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
    if (gameState !== 'playing') return;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    player.targetY = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height) - player.height / 2;
    player.targetY = Math.max(0, Math.min(canvas.height - player.height, player.targetY));
});

// Start game
function startGame() {
    gameState = 'playing';
    score = 0;
    distance = 0;
    gameSpeed = 2;
    frameCount = 0;
    obstacles = [];
    stars = [];
    particles = [];
    player.y = canvas.height / 2;
    player.targetY = canvas.height / 2;
    
    initClouds();
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    controlsHint.classList.remove('hidden');
    
    updateUI();
    
    setTimeout(() => {
        controlsHint.classList.add('hidden');
    }, 4000);
}

// End game
function endGame() {
    gameState = 'gameOver';
    
    // Create explosion
    createParticles(player.x + player.width / 2, player.y + player.height / 2, '#FF6B35');
    createParticles(player.x + player.width / 2, player.y + player.height / 2, '#FFD700');
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('skyPilotBest', bestScore);
        gameOverMessage.textContent = '🎉 New High Score! Amazing flight!';
    } else if (score > bestScore * 0.8) {
        gameOverMessage.textContent = '🌟 Great flight! Almost beat your record!';
    } else {
        gameOverMessage.textContent = '💫 Keep flying! You\'ll soar higher next time!';
    }
    
    finalScoreEl.textContent = score;
    bestScoreEl.textContent = bestScore;
    endTitle.textContent = '✈️ Flight Complete';
    
    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
    }, 500);
}

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initialize
bestScore2El.textContent = bestScore;
initClouds();
draw();
