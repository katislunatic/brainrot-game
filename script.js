const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;

// 1. DATA: Change these colors/radii as you like
const TIERS = [
    { label: "Tier1", radius: 18, color: "#ff5e5e" }, 
    { label: "Tier2", radius: 28, color: "#5efaff" },
    { label: "Tier3", radius: 40, color: "#9f5eff" },
    { label: "Tier4", radius: 55, color: "#ffdc5e" },
    { label: "Tier5", radius: 75, color: "#5eff6c" },
    { label: "Tier6", radius: 100, color: "#ff8c00" }
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

// 2. THE BARRIERS (Black/Dark Grey)
const wallStyle = { fillStyle: '#2c2c2c', visible: true };
const ground = Bodies.rectangle(225, 740, 450, 20, { isStatic: true, render: wallStyle });
const leftWall = Bodies.rectangle(5, 375, 10, 750, { isStatic: true, render: wallStyle });
const rightWall = Bodies.rectangle(445, 375, 10, 750, { isStatic: true, render: wallStyle });

Composite.add(engine.world, [ground, leftWall, rightWall]);

// 3. DROP LOGIC
window.addEventListener("mousedown", (e) => {
    if (!canDrop) return;

    const rect = render.canvas.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    
    // Boundary check so items don't spawn inside walls
    if (dropX > 25 && dropX < 425) {
        canDrop = false; 
        
        const currentTier = TIERS[nextTierIndex];
        const obj = Bodies.circle(dropX, 50, currentTier.radius, {
            label: currentTier.label,
            restitution: 0.3,
            render: { fillStyle: currentTier.color }
        });

        Composite.add(engine.world, obj);

        // Update Next Preview (Randomly picks Tier 1 or 2)
        nextTierIndex = Math.floor(Math.random() * 2);
        document.getElementById('next-preview').style.backgroundColor = TIERS[nextTierIndex].color;

        // Cooldown timer (0.6 seconds)
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
                    render: { fillStyle: next.color },
                    restitution: 0.4
                });

                // The "Pop" effect - adds a tiny upward bounce
                Body.setVelocity(merged, { x: 0, y: -3 });
                
                Composite.add(engine.world, merged);
            }
        }
    });
});

Render.run(render);
Runner.run(Runner.create(), engine);
