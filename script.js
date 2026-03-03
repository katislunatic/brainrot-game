const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;

// CUSTOMIZE YOUR NAMES HERE
const TIERS = [
    { label: "Skibidi", radius: 20, color: "#ff5e5e" }, 
    { label: "Rizzler", radius: 30, color: "#5efaff" },
    { label: "Ohio", radius: 45, color: "#9f5eff" },
    { label: "Mewing", radius: 60, color: "#ffdc5e" },
    { label: "Fanum", radius: 80, color: "#5eff6c" },
    { label: "Sigma", radius: 110, color: "#ff8c00" }
];

let score = 0;
let nextTierIndex = Math.floor(Math.random() * 2); 
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

// Walls - Static and invisible
const ground = Bodies.rectangle(225, 740, 450, 20, { isStatic: true, render: { visible: false } });
const leftWall = Bodies.rectangle(0, 375, 10, 750, { isStatic: true, render: { visible: false } });
const rightWall = Bodies.rectangle(450, 375, 10, 750, { isStatic: true, render: { visible: false } });
Composite.add(engine.world, [ground, leftWall, rightWall]);

// Drop Logic with Cooldown
window.addEventListener("mousedown", (e) => {
    if (!canDrop) return;

    const rect = render.canvas.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    
    if (dropX > 25 && dropX < 425) {
        canDrop = false; 
        
        const currentTier = TIERS[nextTierIndex];
        const obj = Bodies.circle(dropX, 50, currentTier.radius, {
            label: currentTier.label,
            restitution: 0.3,
            friction: 0.1,
            render: { fillStyle: currentTier.color }
        });

        Composite.add(engine.world, obj);

        // Update Next Preview
        nextTierIndex = Math.floor(Math.random() * 2);
        document.getElementById('next-preview').style.backgroundColor = TIERS[nextTierIndex].color;

        // Cooldown timer (600ms)
        setTimeout(() => { canDrop = true; }, 600);
    }
});

// Merge Logic with "Pop" effect
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Only merge if labels match AND they aren't static (walls)
        if (bodyA.label === bodyB.label && !bodyA.isStatic && !bodyB.isStatic) {
            const index = TIERS.findIndex(t => t.label === bodyA.label);
            
            if (index < TIERS.length - 1) {
                const next = TIERS[index + 1];
                const newX = (bodyA.position.x + bodyB.position.x) / 2;
                const newY = (bodyA.position.y + bodyB.position.y) / 2;

                // Remove the old ones immediately
                Composite.remove(engine.world, [bodyA, bodyB]);
                
                score += (index + 1) * 2;
                document.getElementById('score-container').innerText = score;

                // Create the merged object
                const merged = Bodies.circle(newX, newY, next.radius, {
                    label: next.label,
                    render: { fillStyle: next.color },
                    restitution: 0.4
                });

                // JUICE: Add a tiny upward "pop" velocity
                Body.setVelocity(merged, { x: 0, y: -3 });
                
                Composite.add(engine.world, merged);
            }
        }
    });
});

Render.run(render);
Runner.run(Runner.create(), engine);
