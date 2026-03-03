const { Engine, Render, Runner, Bodies, Composite, Events } = Matter;

// 1. SETUP YOUR TIERS HERE
const TIERS = [
    { label: "Tier1", radius: 25, color: "#ff0000" }, // Rename these!
    { label: "Tier2", radius: 40, color: "#ff8800" },
    { label: "Tier3", radius: 55, color: "#ffff00" },
    { label: "Tier4", radius: 75, color: "#00ff00" },
    { label: "Tier5", radius: 95, color: "#0000ff" }
];

let score = 0;
const engine = Engine.create();
const render = Render.create({
    element: document.body,
    engine: engine,
    options: { width: 450, height: 700, wireframes: false, background: '#111' }
});

// Create Bucket
const ground = Bodies.rectangle(225, 690, 450, 20, { isStatic: true, render: { fillStyle: '#333' } });
const leftWall = Bodies.rectangle(5, 350, 10, 700, { isStatic: true, render: { fillStyle: '#333' } });
const rightWall = Bodies.rectangle(445, 350, 10, 700, { isStatic: true, render: { fillStyle: '#333' } });
Composite.add(engine.world, [ground, leftWall, rightWall]);

// Drop Logic
window.addEventListener("mousedown", (e) => {
    const rect = render.canvas.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    
    // Only drop if inside the game width
    if (dropX > 30 && dropX < 420) {
        const tier = TIERS[0];
        const obj = Bodies.circle(dropX, 50, tier.radius, {
            label: tier.label,
            restitution: 0.3,
            render: { fillStyle: tier.color }
        });
        Composite.add(engine.world, obj);
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
                score += (index + 1) * 10;
                document.getElementById('score').innerText = score;

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
