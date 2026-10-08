const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load your mole image
const moleImg = new Image();
moleImg.src = 'download.png';

// Game Constants
const GRAVITY = 0.4;
const FRICTION = 0.8;
const GROUND_Y = 400;

// Game State
let gameState = 'ready'; // 'ready', 'flying', 'won', 'lost'
let message = "";

// The Mole Object
const startX = 150;
const startY = 350;

let mole = {
    x: startX,
    y: startY,
    vx: 0,
    vy: 0,
    radius: 25,
    isDragging: false
};

// The Hole (Target)
const hole = {
    x: 650,
    y: GROUND_Y,
    width: 60,
    height: 15
};

// Mouse tracking
let mouse = { x: 0, y: 0 };

// --- EVENT LISTENERS ---

// Get accurate mouse position relative to canvas
function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

canvas.addEventListener('mousedown', (e) => {
    if (gameState !== 'ready') return;
    
    mouse = getMousePos(e);
    // Check if clicking inside the mole
    const dist = Math.hypot(mouse.x - mole.x, mouse.y - mole.y);
    if (dist < mole.radius) {
        mole.isDragging = true;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (mole.isDragging) {
        mouse = getMousePos(e);
        // Limit how far you can drag the mole
        const maxDrag = 100;
        const dist = Math.hypot(mouse.x - startX, mouse.y - startY);
        
        if (dist > maxDrag) {
            const angle = Math.atan2(mouse.y - startY, mouse.x - startX);
            mole.x = startX + Math.cos(angle) * maxDrag;
            mole.y = startY + Math.sin(angle) * maxDrag;
        } else {
            mole.x = mouse.x;
            mole.y = mouse.y;
        }
    }
});

// The release mechanic
canvas.addEventListener('mouseup', () => {
    if (mole.isDragging) {
        mole.isDragging = false;
        gameState = 'flying';
        
        // Calculate velocity based on drag distance (slingshot effect)
        // Dragging left/down shoots it right/up
        mole.vx = (startX - mole.x) * 0.2;
        mole.vy = (startY - mole.y) * 0.2;
    }
});

// Reset game on click if won or lost
canvas.addEventListener('click', () => {
    if (gameState === 'won' || gameState === 'lost') {
        resetGame();
    }
});

function resetGame() {
    mole.x = startX;
    mole.y = startY;
    mole.vx = 0;
    mole.vy = 0;
    gameState = 'ready';
    message = "";
}

// --- GAME LOOP ---

function update() {
    if (gameState === 'flying') {
        // Apply physics
        mole.vy += GRAVITY;
        mole.x += mole.vx;
        mole.y += mole.vy;

        // Check ground collision
        if (mole.y + mole.radius >= GROUND_Y) {
            mole.y = GROUND_Y - mole.radius;
            
            // Check if it landed in the hole
            if (mole.x > hole.x && mole.x < hole.x + hole.width) {
                mole.vx = 0;
                mole.vy = 0;
                gameState = 'won';
                message = "MOLE IN ONE! Click to play again.";
            } else {
                // Bounce and friction
                mole.vy = -mole.vy * 0.5;
                mole.vx *= FRICTION;

                // Stop if moving too slow
                if (Math.abs(mole.vx) < 0.5 && Math.abs(mole.vy) < 0.5) {
                    mole.vx = 0;
                    mole.vy = 0;
                    gameState = 'lost';
                    message = "Missed! Click to try again.";
                }
            }
        }

        // Check walls (out of bounds)
        if (mole.x > canvas.width || mole.x < 0) {
            gameState = 'lost';
            message = "Out of bounds! Click to try again.";
        }
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Ground
    ctx.fillStyle = '#4CAF50'; // Green grass
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    
    // Draw Dirt under grass
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, GROUND_Y + 20, canvas.width, canvas.height - GROUND_Y - 20);

    // Draw Hole
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(hole.x + hole.width / 2, hole.y, hole.width / 2, hole.height, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw Aiming Line (if dragging)
    if (mole.isDragging) {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(mole.x, mole.y);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    // Draw Starting Mound
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(startX, startY + 25, 30, Math.PI, 0);
    ctx.fill();

    // Draw Mole
    // If the image loads, use it. Otherwise, fallback to a brown circle so the game doesn't break
    if (moleImg.complete && moleImg.naturalWidth !== 0) {
        // Draw the uploaded image centered on the mole's coordinates
        ctx.drawImage(moleImg, mole.x - mole.radius, mole.y - mole.radius, mole.radius * 2, mole.radius * 2);
    } else {
        ctx.fillStyle = 'saddlebrown';
        ctx.beginPath();
        ctx.arc(mole.x, mole.y, mole.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Messages
    if (message) {
        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, 100);
    }
}

// Game Loop Tick
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Start loop
loop();
