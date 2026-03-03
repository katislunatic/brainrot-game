const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;

// 1. DATA: Make sure these filenames match your assets folder EXACTLY
const TIERS = [
    { label: "Tier1", radius: 20, asset: './assets/tier1.png', color: '#ff5e5e' }, 
    { label: "Tier2", radius: 30, asset: './assets/tier2.png', color: '#5efaff' },
    { label: "Tier3", radius: 45, asset: './assets/tier3.png', color: '#9f5eff' },
    { label: "Tier4", radius: 60, asset: './assets/tier4.png', color: '#ffdc5e' },
    { label: "Tier5", radius: 85, asset: './assets/tier5.png', color: '#5eff6c' },
    { label: "Tier6", radius: 110, asset: './assets/tier6.png', color: '#ff8c00' }
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

// 2. THE BUCKET (Centered and Visible)
const wallStyle = { fillStyle: '#2c2c2c', visible: true };
const ground = Bodies.rectangle(225, 740, 450, 40, { isStatic: true, render: wallStyle });
const leftWall = Bodies.rectangle(5, 375, 10, 750, { isStatic: true, render: wallStyle });
const rightWall = Bodies.rectangle(445, 375, 10, 750, { isStatic: true, render: wallStyle });
Composite.add(engine.world, [ground, leftWall, rightWall]);

// Function to handle the Sprite math
function getRenderOptions(tier) {
    return {
        sprite: {
            texture: tier.asset,
            // Adjust '512' to the actual width of your PNG files
            xScale: (tier.radius * 2) / 512, 
            yScale: (tier.radius * 2) / 512
        }
    };
}

// 3. DROP LOGIC
window.addEventListener("mousedown", (e) => {
    if (!canDrop) return;
    const rect = render.canvas.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    
    if (dropX > 30 && dropX < 420) {
        canDrop = false; 
        const tier = TIERS[nextTierIndex];
        
        const obj = Bodies.circle(dropX, 50, tier.radius, {
            label: tier.label,
            restitution: 0.3,
            render: getRenderOptions(tier)
        });

        Composite.add(engine.world, obj);

        nextTierIndex = Math.floor(Math.random() * 2);
        // Update the gold circle preview
        const preview = document.getElementById('next-preview');
        preview.style.backgroundImage = `url('${TIERS[nextTierIndex].asset}')`;
        preview.style.backgroundSize = "contain";
        preview.style.backgroundRepeat = "no-repeat";

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
                    render: getRenderOptions(next),
                    restitution: 0.4
                });

                Body.setVelocity(merged, { x: 0, y: -3 });
                Composite.add(engine.world, merged);
            }
        }
    });
});

Render.run(render);
Runner.run(Runner.create(), engine);
