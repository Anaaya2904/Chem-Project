// Alias Matter.js modules
const { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint, Constraint, Composite, Events } = Matter;

// Create the physics engine
const engine = Engine.create();
const world = engine.world;

// Create the renderer
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false, // Turn off wireframes to see colors and sprites
        background: '#87CEEB' 
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// --- Game Constants & Setup ---
const startX = 250;
const startY = window.innerHeight - 250;
const moleRadius = 40;
const groundY = window.innerHeight - 40;

// 1. Create the Slingshot Base
const slingshotPost = Bodies.rectangle(startX, startY + 60, 20, 120, { 
    isStatic: true,
    render: { fillStyle: '#8B4513' } // Brown wood color
});

// 2. Create the Ground and the "Hole"
const holeX = window.innerWidth - 300; // Position hole near the right side
const holeWidth = 120;

// Left side of the ground
const ground1Width = holeX - (holeWidth / 2);
const ground1 = Bodies.rectangle(ground1Width / 2, groundY, ground1Width, 80, { 
    isStatic: true, 
    render: { fillStyle: '#2E8B57' } // Grass green 
});

// Right side of the ground
const ground2X = holeX + (holeWidth / 2);
const ground2Width = window.innerWidth - ground2X;
const ground2 = Bodies.rectangle(ground2X + (ground2Width / 2), groundY, ground2Width, 80, { 
    isStatic: true, 
    render: { fillStyle: '#2E8B57' } 
});

// The Hole Sensor (Detects when the mole enters)
const holeSensor = Bodies.rectangle(holeX, groundY + 20, holeWidth * 0.8, 40, {
    isStatic: true,
    isSensor: true, // Sensor means objects pass through it, but it triggers collisions
    render: { fillStyle: '#3E2723' } // Dark dirt color inside the hole
});

// 3. Create the Mole (Projectile)
let mole;
function createMole() {
    return Bodies.circle(startX, startY, moleRadius, {
        restitution: 0.5, // Bounciness
        density: 0.005,   // Weight
        render: {
            sprite: {
                texture: 'image_edfec2.png', // The cute mole image you provided!
                // Scale values might need slight tweaking depending on the exact pixel size of your image
                xScale: 0.18, 
                yScale: 0.18
            }
        }
    });
}
mole = createMole();

// 4. Create the Slingshot Band (Constraint)
const sling = Constraint.create({
    pointA: { x: startX, y: startY },
    bodyB: mole,
    stiffness: 0.05, // How stretchy the band is
    length: 2,
    render: { 
        visible: true, 
        lineWidth: 6, 
        strokeStyle: '#4A2311' // Dark brown band
    }
});

// Add everything to the world
Composite.add(world, [slingshotPost, ground1, ground2, holeSensor, mole, sling]);

// --- Interaction & Slingshot Mechanics ---

// Add mouse controls
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { angularStiffness: 0, render: { visible: false } }
});
Composite.add(world, mouseConstraint);
render.mouse = mouse; // Keeps the mouse in sync with the renderer

let isFired = false;
let isResetting = false;

// Fire the mole when dragging ends
Events.on(mouseConstraint, 'enddrag', function(e) {
    if (e.body === mole) {
        isFired = true;
        // A tiny delay lets the slingshot snap back and transfer momentum before detaching
        setTimeout(() => {
            sling.bodyB = null; 
        }, 20); 
    }
});

// --- Win Condition & Game Loop ---

// Check if mole goes in the hole
Events.on(engine, 'collisionStart', function(e) {
    e.pairs.forEach(pair => {
        if ((pair.bodyA === mole && pair.bodyB === holeSensor) || 
            (pair.bodyB === mole && pair.bodyA === holeSensor)) {
            
            // Wait a brief moment to let the mole fall visually into the hole
            setTimeout(() => {
                if(!isResetting) {
                    alert("Mole in One! Fantastic Shot!");
                    resetGame();
                }
            }, 100);
        }
    });
});

// Check if mole misses and stops, or falls off screen
Events.on(engine, 'afterUpdate', function() {
    if (isFired && !sling.bodyB && !isResetting) {
        // Fall off screen bounds
        if (mole.position.x > window.innerWidth + 100 || 
            mole.position.x < -100 || 
            mole.position.y > window.innerHeight + 100) {
            resetGame();
        } 
        // Came to a stop on the grass
        else if (mole.speed < 0.2 && mole.position.y < groundY) {
            isResetting = true;
            setTimeout(resetGame, 1500); // Wait 1.5 seconds then reset
        }
    }
});

// Reset the slingshot
function resetGame() {
    isResetting = true;
    if (mole) {
        Composite.remove(world, mole);
    }
    
    // Spawn a new mole and reattach the sling
    mole = createMole();
    Composite.add(world, mole);
    sling.bodyB = mole;
    
    isFired = false;
    isResetting = false;
}

// Keep canvas full screen if the window resizes
window.addEventListener('resize', () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
});
