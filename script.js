const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;

// 1. UPDATED TIERS: Bigger Radii for a better feel
const TIERS = [
    { label: "Tier1", radius: 25, asset: './assets/tier1.png' }, 
    { label: "Tier2", radius: 35, asset: './assets/tier2.png' },
    { label: "Tier3", radius: 50, asset: './assets/tier3.png' },
    { label: "Tier4", radius: 70, asset: './assets/tier4.png' },
    { label: "Tier5", radius: 95, asset: './assets/tier5.png' },
    { label: "Tier6", radius: 125, asset: './assets/tier6.png' }
];

let score = 0;
let nextTierIndex = 0; 
let canDrop = true; 

const engine = Engine.create();
const render = Render.create({
    element: document.body,
    engine: engine,
    options: { 
        width: 450, 
        height: 750, 
        wireframes: false, 
        background: 'transparent' 
    }
});

// 2. THE BUCKET (Visible Black Barriers)
const wallStyle = { fillStyle: '#2c2c2c' };
const ground = Bodies.rectangle(225, 740, 450, 40, { isStatic: true, render: wallStyle });
const leftWall = Bodies.rectangle(10, 375, 20, 750, { isStatic: true, render: wallStyle });
const rightWall = Bodies.rectangle(440, 375, 20, 750, { isStatic: true, render: wallStyle });
Composite.add(engine.world, [ground, leftWall, rightWall]);

// 3. HELPER: This math fixes the "too small" image problem
function createBrainrot(x, y, tier) {
    // If your images are still small, change '100' to '50' or '200' 
    // until it looks perfect for your specific PNG files.
    const imageBaseSize = 100; 
    const scale = (tier.radius * 2) / imageBaseSize;

    return Bodies.circle(x, y, tier.radius, {
        label: tier.label,
        restitution: 0.3,
        render: {
            sprite: {
                texture: tier.asset,
                xScale: scale,
                yScale: scale
            }
        }
    });
}

function updateNextUI() {
    const preview = document.getElementById('next-preview');
    preview.style.backgroundImage = `url('${TIERS[nextTierIndex].asset}')`;
    preview.style.backgroundSize = "contain";
}
updateNextUI();

// 4. DROP LOGIC
window.addEventListener("mousedown", (e) => {
    if (!canDrop) return;
    const rect = render.canvas.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    
    if (dropX > 40 && dropX < 410) {
        canDrop = false; 
        const tier = TIERS[nextTierIndex];
        const obj = createBrainrot(dropX, 80, tier);
        Composite.add(engine.world, obj);

        nextTierIndex = Math.floor(Math.random() * 2);
        updateNextUI();
        setTimeout(() => { canDrop = true; }, 600);
    }
});

// 5. MERGE LOGIC
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        if (bodyA.label === bodyB.label && !bodyA.isStatic && !bodyB.isStatic) {
            const index = TIERS.findIndex(t => t.label === bodyA.label);
            if (index < TIERS.length - 1) {
                const next = TIERS[index + 1];
                const newX = (bodyA.position.x + bodyB.position.x) / 2;
                const newY = (bodyA.position.y + bodyB.position.y) / 2;

                Composite.remove(engine.world, [bodyA, bodyB]);
                score += (index + 1) * 2;
                document.getElementById('score-container').innerText = score;

                const merged = createBrainrot(newX, newY, next);
                Body.setVelocity(merged, { x: 0, y: -3 });
                Composite.add(engine.world, merged);
            }
        }
    });
});

Render.run(render);
Runner.run(Runner.create(), engine);
