const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;

// 1. DATA: Update asset paths to match your filenames exactly
const TIERS = [
    { label: "Tier1", radius: 20, asset: './assets/tier1.png' }, 
    { label: "Tier2", radius: 30, asset: './assets/tier2.png' },
    { label: "Tier3", radius: 45, asset: './assets/tier3.png' },
    { label: "Tier4", radius: 60, asset: './assets/tier4.png' },
    { label: "Tier5", radius: 80, asset: './assets/tier5.png' },
    { label: "Tier6", radius: 110, asset: './assets/tier6.png' }
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
const wallStyle = { fillStyle: '#2c2c2c', visible: true };
const ground = Bodies.rectangle(225, 740, 450, 40, { isStatic: true, render: wallStyle });
const leftWall = Bodies.rectangle(0, 375, 20, 750, { isStatic: true, render: wallStyle });
const rightWall = Bodies.rectangle(450, 375, 20, 750, { isStatic: true, render: wallStyle });

Composite.add(engine.world, [ground, leftWall, rightWall]);

// Function to update the Next UI
function updateNextUI() {
    const preview = document.getElementById('next-preview');
    preview.style.backgroundImage = `url('${TIERS[nextTierIndex].asset}')`;
}
updateNextUI(); // Initial call

// 3. DROP LOGIC
window.addEventListener("mousedown", (e) => {
    if (!canDrop) return;

    const rect = render.canvas.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    
    if (dropX > 30 && dropX < 420) {
        canDrop = false; 
        
        const currentTier = TIERS[nextTierIndex];
        const obj = Bodies.circle(dropX, 50, currentTier.radius, {
            label: currentTier.label,
            restitution: 0.3,
            render: {
                sprite: {
                    texture: currentTier.asset,
                    // Math to fit image to radius
                    xScale: (currentTier.radius * 2) / 256, // Change 256 to your image width
                    yScale: (currentTier.radius * 2) / 256
                }
            }
        });

        Composite.add(engine.world, obj);

        // Pick next random starting tier (0 or 1)
        nextTierIndex = Math.floor(Math.random() * 2);
        updateNextUI();

        setTimeout(() => { canDrop = true; }, 600);
    }
});

// 4. MERGE LOGIC
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

                const merged = Bodies.circle(newX, newY, next.radius, {
                    label: next.label,
                    render: {
                        sprite: {
                            texture: next.asset,
                            xScale: (next.radius * 2) / 256, 
                            yScale: (next.radius * 2) / 256
                        }
                    },
                    restitution: 0.4
                });

                Body.setVelocity(merged, { x: 0, y: -3 });
                Composite.add(engine.world, merged);
            }
        }
    });
});

// 5. GAME OVER CHECK
Events.on(engine, 'afterUpdate', () => {
    const bodies = Composite.allBodies(engine.world);
    bodies.forEach(body => {
        if (!body.isStatic && body.position.y < 120 && body.velocity.y < 0.1) {
            // Add your game over alert/UI here
        }
    });
});

Render.run(render);
Runner.run(Runner.create(), engine);
