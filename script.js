const { Engine, Render, Runner, Bodies, Composite, Events } = Matter;

const TIERS = [
    { label: "Tier1", radius: 15, color: "#ff5e5e" }, 
    { label: "Tier2", radius: 25, color: "#5efaff" },
    { label: "Tier3", radius: 35, color: "#9f5eff" },
    { label: "Tier4", radius: 50, color: "#ffdc5e" },
    { label: "Tier5", radius: 70, color: "#5eff6c" }
];

let score = 0;
let nextTierIndex = Math.floor(Math.random() * 2); // Start with Tier 1 or 2
let canDrop = true; // For the cooldown

const engine = Engine.create();
const render = Render.create({
    element: document.body,
    engine: engine,
    options: { width: 450, height: 750, wireframes: false, background: 'transparent' }
});

// Walls (Invisible to match the clean look)
const ground = Bodies.rectangle(225, 740, 450, 20, { isStatic: true, render: { visible: false } });
const leftWall = Bodies.rectangle(0, 375, 10, 750, { isStatic: true, render: { visible: false } });
const rightWall = Bodies.rectangle(450, 375, 10, 750, { isStatic: true, render: { visible: false } });
Composite.add(engine.world, [ground, leftWall, rightWall]);

// Drop Function with Cooldown
window.addEventListener("mousedown", (e) => {
    if (!canDrop) return; // Stop if on cooldown

    const rect = render.canvas.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    
    if (dropX > 20 && dropX < 430) {
        canDrop = false; // Start cooldown
        
        const currentTier = TIERS[nextTierIndex];
        const obj = Bodies.circle(dropX, 80, currentTier.radius, {
            label: currentTier.label,
            restitution: 0.3,
            friction: 0.1,
            render: { fillStyle: currentTier.color }
        });

        Composite.add(engine.world, obj);

        // Pick next random fruit and update UI
        nextTierIndex = Math.floor(Math.random() * 2);
        document.getElementById('next-preview').style.backgroundColor = TIERS[nextTierIndex].color;

        // Reset cooldown after 600ms (adjust this for faster/slower feel)
        setTimeout(() => { canDrop = true; }, 600);
    }
});

// Merge Logic
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
                    render: { fillStyle: next.color }
                });
                Composite.add(engine.world, merged);
            }
        }
    });
});

Render.run(render);
Runner.run(Runner.create(), engine);
