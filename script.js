const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;

// Game Configuration
const TIERS = [
    { label: "Tier1", radius: 25, asset: './assets/tier1.png', points: 10 },
    { label: "Tier2", radius: 35, asset: './assets/tier2.png', points: 30 },
    { label: "Tier3", radius: 52, asset: './assets/tier3.png', points: 80 },
    { label: "Tier4", radius: 75, asset: './assets/tier4.png', points: 200 },
    { label: "Tier5", radius: 100, asset: './assets/tier5.png', points: 500 },
    { label: "Tier6", radius: 130, asset: './assets/tier6.png', points: 1200 }
];

const CONFIG = {
    CANVAS_WIDTH: 450,
    CANVAS_HEIGHT: 750,
    DROP_COOLDOWN: 400,
    MERGE_COMBO_TIMEOUT: 1500,
    RESTITUTION: 0.3,
    IMAGE_WIDTH: 120,
    BOTTOM_BOUNDARY: 720
};

// Game State
let gameState = {
    score: 0,
    combo: 0,
    canDrop: true,
    nextTierIndex: 0,
    gameOver: false,
    mergeComboActive: false,
    mergeComboTimer: null
};

// Physics Engine Setup
const engine = Engine.create();

// Create and insert canvas
const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;
document.querySelector('.game-wrapper').insertBefore(canvas, document.querySelector('.ui-panel').nextSibling);

const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: CONFIG.CANVAS_WIDTH,
        height: CONFIG.CANVAS_HEIGHT,
        wireframes: false,
        background: 'transparent'
    }
});

// Create Walls
const wallStyle = { fillStyle: '#2c2c2c' };
const ground = Bodies.rectangle(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT - 10, CONFIG.CANVAS_WIDTH, 20, {
    isStatic: true,
    render: wallStyle
});
const leftWall = Bodies.rectangle(10, CONFIG.CANVAS_HEIGHT / 2, 20, CONFIG.CANVAS_HEIGHT, {
    isStatic: true,
    render: wallStyle
});
const rightWall = Bodies.rectangle(CONFIG.CANVAS_WIDTH - 10, CONFIG.CANVAS_HEIGHT / 2, 20, CONFIG.CANVAS_HEIGHT, {
    isStatic: true,
    render: wallStyle
});
Composite.add(engine.world, [ground, leftWall, rightWall]);

// Color palette for tiers
const TIER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

// Utility Functions
function createBrainrot(x, y, tier) {
    const tierIndex = TIERS.findIndex(t => t.label === tier.label);
    const color = TIER_COLORS[tierIndex] || '#999';
    
    const scale = (tier.radius * 2) / CONFIG.IMAGE_WIDTH;
    
    // Create body with sprite support
    const body = Bodies.circle(x, y, tier.radius, {
        label: tier.label,
        restitution: CONFIG.RESTITUTION,
        render: {
            sprite: {
                texture: tier.asset,
                xScale: scale,
                yScale: scale
            },
            // Fallback to color if sprite fails
            fillStyle: color,
            strokeStyle: 'rgba(255,255,255,0.3)',
            lineWidth: 2
        }
    });
    
    return body;
}

function updateNextUI() {
    document.getElementById('next-image').src = TIERS[gameState.nextTierIndex].asset;
}

function updateScore(points) {
    gameState.score += points;
    document.getElementById('score-display').innerText = gameState.score;
}

function updateCombo(increment) {
    gameState.combo += increment;
    document.getElementById('combo-display').innerText = gameState.combo;
    
    if (gameState.combo > 0) {
        showComboPopup();
    }
}

function resetCombo() {
    gameState.combo = 0;
    document.getElementById('combo-display').innerText = '0';
}

function showComboPopup() {
    const popup = document.getElementById('combo-popup');
    const number = gameState.combo;
    
    popup.innerHTML = `
        <div class="combo-text">COMBO!</div>
        <div class="combo-number">${number}</div>
    `;
    
    // Reset combo after timeout
    clearTimeout(gameState.mergeComboTimer);
    gameState.mergeComboTimer = setTimeout(() => {
        if (gameState.combo > 0) {
            resetCombo();
        }
    }, CONFIG.MERGE_COMBO_TIMEOUT);
}

function checkGameOver() {
    const bodies = Composite.allBodies(engine.world);
    let highestY = CONFIG.CANVAS_HEIGHT;
    
    for (let body of bodies) {
        // Only check game pieces (not walls)
        if (!body.isStatic && body.label && body.label.startsWith('Tier')) {
            // Find the highest piece
            if (body.position.y < highestY) {
                highestY = body.position.y;
            }
            
            // Game over if any piece goes way above the canvas (plenty of buffer)
            if (body.position.y < 50) {
                console.log(`Game Over! Piece ${body.label} reached critical height y: ${body.position.y}`);
                triggerGameOver();
                return true;
            }
        }
    }
    
    return false;
}

function triggerGameOver() {
    gameState.gameOver = true;
    document.getElementById('gameOverModal').classList.add('active');
    document.getElementById('finalScore').innerText = gameState.score;
}

function playSound(type) {
    // Simple sound feedback using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'merge') {
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'drop') {
        oscillator.frequency.value = 400;
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
    }
}

// Drop Handler - Works with mouse and touch
function handleDrop(clientX, clientY) {
    if (!gameState.canDrop || gameState.gameOver) return;
    
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const dropX = clientX - rect.left;
    const dropY = clientY - rect.top;
    
    // Check if click is within canvas bounds
    if (dropX < 0 || dropX > CONFIG.CANVAS_WIDTH || dropY < 0 || dropY > CONFIG.CANVAS_HEIGHT) {
        return;
    }
    
    // Boundary check with padding
    const padding = 40;
    if (dropX > padding && dropX < CONFIG.CANVAS_WIDTH - padding) {
        gameState.canDrop = false;
        
        const tier = TIERS[gameState.nextTierIndex];
        const obj = createBrainrot(dropX, 80, tier);
        Composite.add(engine.world, obj);
        
        playSound('drop');
        
        // Only spawn Tier 1 and Tier 2 (Tier 1 is 70% likely, Tier 2 is 30% likely)
        gameState.nextTierIndex = Math.random() < 0.7 ? 0 : 1;
        updateNextUI();
        
        setTimeout(() => {
            gameState.canDrop = true;
        }, CONFIG.DROP_COOLDOWN);
    }
}

// Mouse events
window.addEventListener('mousedown', (e) => {
    handleDrop(e.clientX, e.clientY);
});

// Touch events (for mobile)
window.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleDrop(touch.clientX, touch.clientY);
    }
}, { passive: false });

// Collision Detection
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        if (gameState.gameOver) return;
        
        if (bodyA.label === bodyB.label && !bodyA.isStatic && !bodyB.isStatic) {
            const index = TIERS.findIndex(t => t.label === bodyA.label);
            
            if (index < TIERS.length - 1) {
                const next = TIERS[index + 1];
                const newX = (bodyA.position.x + bodyB.position.x) / 2;
                const newY = (bodyA.position.y + bodyB.position.y) / 2;
                
                // Remove old bodies
                Composite.remove(engine.world, [bodyA, bodyB]);
                
                // Calculate points with combo multiplier
                const basePoints = next.points;
                const comboMultiplier = Math.min(1 + gameState.combo * 0.1, 2.5);
                const points = Math.floor(basePoints * comboMultiplier);
                
                updateScore(points);
                updateCombo(1);
                playSound('merge');
                
                // Create merged body with pop effect
                const merged = createBrainrot(newX, newY, next);
                Body.setVelocity(merged, { x: 0, y: -6 });
                Composite.add(engine.world, merged);
            }
        }
    });
});

// Game Loop with Game Over Check
let gameOverCheckInterval = setInterval(() => {
    if (!gameState.gameOver) {
        checkGameOver();
    }
}, 100);

// Initialize
updateNextUI();
Render.run(render);
Runner.run(Runner.create(), engine);

console.log('🎮 Brainrot Merge started!');
console.log('💡 Tip: Merge identical items to create higher tiers and build your combo!');
console.log('📊 Canvas size:', CONFIG.CANVAS_WIDTH, 'x', CONFIG.CANVAS_HEIGHT);
console.log('🎨 Tier colors:', TIER_COLORS);
console.log('📁 Asset paths:', TIERS.map(t => t.asset));
console.log('✅ Game ready! Click to drop pieces.');
