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
let gameState = 'start';
let score = 0;
let highScore = localStorage.getItem('tallTigerMotorwaysScore') || 0;
let roads = [];
let maxRoads = 10;
let houses = [];
let destinations = [];
let cars = [];
let isDrawing = false;
let drawStart = null;
let drawEnd = null;
let gridSize = 30;
let carSpawnTimer = 0;
let carSpawnInterval = 180; // frames between car spawns

// UI Elements
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const currentScoreEl = document.getElementById('currentScore');
const roadCountEl = document.getElementById('roadCount');
const highScoreEl = document.getElementById('highScore');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const gameOverMessageEl = document.getElementById('gameOverMessage');
const controlsHint = document.getElementById('controlsHint');

highScoreEl.textContent = highScore;

// Helper Functions
function snapToGrid(x, y) {
    return {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize
    };
}

function distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// Building Classes
class Building {
    constructor(x, y, type, color) {
        this.x = x;
        this.y = y;
        this.type = type; // 'house' or 'destination'
        this.color = color;
        this.size = 20;
        this.queue = 0;
        this.maxQueue = 5;
    }

    draw() {
        ctx.save();
        
        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        
        if (this.type === 'house') {
            // Draw house
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
            
            // Roof
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.moveTo(this.x - this.size/2 - 3, this.y - this.size/2);
            ctx.lineTo(this.x, this.y - this.size/2 - 8);
            ctx.lineTo(this.x + this.size/2 + 3, this.y - this.size/2);
            ctx.closePath();
            ctx.fill();
        } else {
            // Draw destination (circle)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Flag
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.size/2);
            ctx.lineTo(this.x, this.y - this.size/2 - 10);
            ctx.stroke();
        }
        
        // Queue indicator
        if (this.queue > 0 && this.type === 'house') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.queue, this.x, this.y + this.size + 8);
        }
        
        ctx.restore();
    }
}

// Road Class
class Road {
    constructor(start, end) {
        this.start = start;
        this.end = end;
        this.width = 8;
    }

    draw() {
        ctx.strokeStyle = '#666';
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.stroke();
        
        // Road markings
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    isPointOnRoad(x, y, tolerance = 15) {
        const d = this.distanceToPoint(x, y);
        return d < tolerance;
    }

    distanceToPoint(x, y) {
        const A = x - this.start.x;
        const B = y - this.start.y;
        const C = this.end.x - this.start.x;
        const D = this.end.y - this.start.y;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        
        if (len_sq != 0) param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = this.start.x;
            yy = this.start.y;
        } else if (param > 1) {
            xx = this.end.x;
            yy = this.end.y;
        } else {
            xx = this.start.x + param * C;
            yy = this.start.y + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Car Class
class Car {
    constructor(start, color) {
        this.x = start.x;
        this.y = start.y;
        this.color = color;
        this.size = 6;
        this.speed = 2;
        this.target = null;
        this.path = [];
        this.stuck = false;
        this.stuckTimer = 0;
        this.maxStuckTime = 300; // 5 seconds at 60fps
        
        // Find destination
        this.findDestination();
    }

    findDestination() {
        const matching = destinations.filter(d => d.color === this.color);
        if (matching.length > 0) {
            this.target = matching[0];
        }
    }

    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        if (!this.target) return;

        // Simple pathfinding: move towards target on roads
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 15) {
            // Reached destination
            return 'arrived';
        }

        // Check if on a road
        let onRoad = false;
        for (let road of roads) {
            if (road.isPointOnRoad(this.x, this.y, 12)) {
                onRoad = true;
                break;
            }
        }

        if (onRoad || dist < 50) {
            // Move towards target
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
            this.stuckTimer = 0;
        } else {
            // Try to find nearest road
            let nearestRoad = null;
            let nearestDist = Infinity;
            
            for (let road of roads) {
                const d = road.distanceToPoint(this.x, this.y);
                if (d < nearestDist) {
                    nearestDist = d;
                    nearestRoad = road;
                }
            }

            if (nearestRoad && nearestDist < 100) {
                // Move towards nearest road
                const roadMidX = (nearestRoad.start.x + nearestRoad.end.x) / 2;
                const roadMidY = (nearestRoad.start.y + nearestRoad.end.y) / 2;
                const rdx = roadMidX - this.x;
                const rdy = roadMidY - this.y;
                const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
                
                this.x += (rdx / rdist) * this.speed;
                this.y += (rdy / rdist) * this.speed;
            } else {
                // Stuck
                this.stuckTimer++;
            }
        }

        if (this.stuckTimer > this.maxStuckTime) {
            return 'stuck';
        }

        return 'driving';
    }
}

// Initialize Game
function initGame() {
    roads = [];
    cars = [];
    houses = [];
    destinations = [];
    score = 0;
    maxRoads = 10;
    carSpawnTimer = 0;
    
    currentScoreEl.textContent = '0';
    roadCountEl.textContent = maxRoads;
    controlsHint.classList.remove('hidden');

    // Create buildings (Moosach to Andreas-Vöst-Straße theme)
    const padding = 60;
    
    // Houses (green - start points)
    houses.push(new Building(padding + 30, padding + 30, 'house', '#4CAF50'));
    houses.push(new Building(padding + 30, canvas.height - padding - 30, 'house', '#8BC34A'));
    
    // Destinations (blue - end points)
    destinations.push(new Building(canvas.width - padding - 30, padding + 30, 'destination', '#2196F3'));
    destinations.push(new Building(canvas.width - padding - 30, canvas.height - padding - 30, 'destination', '#03A9F4'));
}

// Mouse/Touch handling
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', drawing);
canvas.addEventListener('mouseup', endDrawing);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); drawing(e); }, { passive: false });
canvas.addEventListener('touchend', (e) => { e.preventDefault(); endDrawing(e); }, { passive: false });

function startDrawing(e) {
    if (gameState !== 'playing') return;
    if (roads.length >= maxRoads) return;
    
    const pos = getMousePos(e);
    drawStart = snapToGrid(pos.x, pos.y);
    isDrawing = true;
}

function drawing(e) {
    if (!isDrawing || gameState !== 'playing') return;
    
    const pos = getMousePos(e);
    drawEnd = snapToGrid(pos.x, pos.y);
}

function endDrawing(e) {
    if (!isDrawing || gameState !== 'playing') return;
    
    if (drawStart && drawEnd && distance(drawStart, drawEnd) > gridSize) {
        roads.push(new Road(drawStart, drawEnd));
        roadCountEl.textContent = maxRoads - roads.length;
        
        if (roads.length >= maxRoads) {
            controlsHint.classList.add('hidden');
        }
    }
    
    isDrawing = false;
    drawStart = null;
    drawEnd = null;
}

// Spawn Cars
function spawnCars() {
    carSpawnTimer++;
    
    if (carSpawnTimer >= carSpawnInterval) {
        carSpawnTimer = 0;
        
        // Spawn from random house
        if (houses.length > 0) {
            const house = houses[Math.floor(Math.random() * houses.length)];
            
            if (house.queue < house.maxQueue) {
                house.queue++;
                
                // Match house color to destination
                let carColor = house.color;
                cars.push(new Car(house, carColor));
            } else {
                // House overloaded
                endGame('A house got too backed up!');
            }
        }
    }
}

// Game Update Loop
function update() {
    if (gameState !== 'playing' && gameState !== 'gameOver') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw roads
    roads.forEach(road => road.draw());

    // Draw current drawing
    if (isDrawing && drawStart && drawEnd) {
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.lineWidth = 8;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(drawStart.x, drawStart.y);
        ctx.lineTo(drawEnd.x, drawEnd.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw buildings
    houses.forEach(h => h.draw());
    destinations.forEach(d => d.draw());

    // Update and draw cars
    if (gameState === 'playing') {
        spawnCars();
        
        for (let i = cars.length - 1; i >= 0; i--) {
            const status = cars[i].update();
            
            if (status === 'arrived') {
                score++;
                currentScoreEl.textContent = score;
                cars.splice(i, 1);
                
                // Decrease queue
                houses.forEach(h => {
                    if (h.queue > 0) h.queue--;
                });
                
                // Every 5 deliveries, speed up spawning
                if (score % 5 === 0) {
                    carSpawnInterval = Math.max(60, carSpawnInterval - 10);
                }
            } else if (status === 'stuck') {
                endGame('A car got stuck without a road!');
                cars.splice(i, 1);
            }
        }
    }

    cars.forEach(car => car.draw());

    requestAnimationFrame(update);
}

// Start Game
function startGame() {
    gameState = 'playing';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    initGame();
    update();
}

// End Game
function endGame(message) {
    if (gameState === 'gameOver') return;
    
    gameState = 'gameOver';
    controlsHint.classList.add('hidden');
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('tallTigerMotorwaysScore', highScore);
        highScoreEl.textContent = highScore;
        gameOverMessageEl.textContent = '🎉 New High Score! ' + message;
    } else {
        gameOverMessageEl.textContent = message;
    }
    
    finalScoreEl.textContent = score;
    bestScoreEl.textContent = highScore;
    
    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
    }, 1000);
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (gameState === 'start') {
            startGame();
        } else if (gameState === 'gameOver') {
            startGame();
        }
    }
});

// Initialize
initGame();
