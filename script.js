const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load your mole image
const moleImg = new Image();
moleImg.src = 'download.png';

// Physics & Engine Constants
const GRAVITY = 0.4;
const FRICTION = 0.7;
const GROUND_Y = 400;

// Game State
let gameState = 'ready'; // 'ready', 'flying', 'falling_in_hole', 'won', 'lost'
let message = "";

// Slingshot Position
const sling = { x: 150, y: 350 };
const startX = sling.x;
const startY = sling.y - 30;

// The Mole Object
let mole = {
    x: startX,
    y: startY,
    vx: 0,
    vy: 0,
    radius: 22,
    isDragging: false,
    rotation: 0
};

// The Hole (Target)
const hole = {
    x: 630,
    width: 80,
    depth: 80,
    height: 30 // Visible vertical opening
};

let mouse = { x: 0, y: 0 };

// --- EVENT LISTENERS ---
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
    const dist = Math.hypot(mouse.x - mole.x, mouse.y - mole.y);
    if (dist < mole.radius * 1.5) { // A bit of padding for easier clicking
        mole.isDragging = true;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (mole.isDragging) {
        mouse = getMousePos(e);
        const maxDrag = 120;
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

// Releasing the mole (fires the slingshot)
function releaseMole() {
    if (mole.isDragging) {
        mole.isDragging = false;
        gameState = 'flying';
        mole.vx = (startX - mole.x) * 0.22;
        mole.vy = (startY - mole.y) * 0.22;
    }
}

canvas.addEventListener('mouseup', releaseMole);
canvas.addEventListener('mouseleave', releaseMole); // Releases if mouse leaves canvas

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
    mole.rotation = 0;
    gameState = 'ready';
    message = "";
}

// --- GAME LOOP ---
function update() {
    if (gameState === 'flying') {
        mole.vy += GRAVITY;
        mole.x += mole.vx;
        mole.y += mole.vy;
        mole.rotation += mole.vx * 0.02; // Spin in the air

        // Check if hitting the ground level
        if (mole.y + mole.radius >= GROUND_Y) {
            // Check if mole is perfectly above the hole
            let inHole = (mole.x > hole.x + 15) && (mole.x < hole.x + hole.width - 15);

            if (inHole) {
                gameState = 'falling_in_hole';
                mole.vx *= 0.3; // Kill horizontal momentum to drop straight down
            } else {
                // Bounce on the grass
                mole.y = GROUND_Y - mole.radius;
                mole.vy = -mole.vy * 0.4;
                mole.vx *= FRICTION;

                if (Math.abs(mole.vx) < 0.5 && Math.abs(mole.vy) < 0.5) {
                    gameState = 'lost';
                    message = "Missed! Click anywhere to try again.";
                }
            }
        }

        // Out of bounds
        if (mole.x > canvas.width || mole.x < 0) {
            gameState = 'lost';
            message = "Out of bounds! Click to try again.";
        }

    } else if (gameState === 'falling_in_hole') {
        // Drop into the hole
        mole.vy += GRAVITY;
        mole.y += mole.vy;
        mole.rotation += 0.05; 

        // Stop at the bottom of the hole
        if (mole.y + mole.radius >= GROUND_Y + hole.depth) {
            mole.y = GROUND_Y + hole.depth - mole.radius;
            mole.vy = 0;
            mole.vx = 0;
            gameState = 'won';
            message = "MOLE IN ONE! Click to play again.";
        }
    }
}

function draw() {
    // 1. Sky Gradient
    let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#e0f6ff');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Background of the Hole (Dark Opening & Interior Dirt)
    ctx.fillStyle = '#111'; 
    ctx.beginPath();
    ctx.ellipse(hole.x + hole.width / 2, GROUND_Y, hole.width / 2, hole.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b1d12'; // Underground walls
    ctx.fillRect(hole.x, GROUND_Y, hole.width, hole.depth);

    // 3. Slingshot Back Prong & Band
    ctx.fillStyle = '#4a2e1b';
    ctx.fillRect(sling.x - 15, sling.y - 45, 10, 45);
    
    if (mole.isDragging) {
        ctx.beginPath();
        ctx.moveTo(sling.x - 10, sling.y - 40);
        ctx.lineTo(mole.x, mole.y);
        ctx.strokeStyle = '#2a1508';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    // 4. The Mole (Clipped to a circle to hide white background)
    ctx.save();
    ctx.translate(mole.x, mole.y);
    ctx.rotate(mole.rotation);
    
    // Create perfect circle clipping mask
    ctx.beginPath();
    ctx.arc(0, 0, mole.radius, 0, Math.PI * 2);
    ctx.clip(); 

    if (moleImg.complete && moleImg.naturalWidth !== 0) {
        // Draw image covering the whole circle radius
        ctx.drawImage(moleImg, -mole.radius, -mole.radius, mole.radius * 2, mole.radius * 2);
    } else {
        ctx.fillStyle = '#8B4513';
        ctx.fill();
    }
    // Subtle border around mole
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.stroke();
    ctx.restore();

    // 5. Slingshot Front Prong & Band
    if (mole.isDragging) {
        ctx.beginPath();
        ctx.moveTo(sling.x + 10, sling.y - 35);
        ctx.lineTo(mole.x, mole.y);
        ctx.strokeStyle = '#3a1f11';
        ctx.lineWidth = 6;
        ctx.stroke();
    } else if (gameState === 'ready') {
        // Idle band
        ctx.beginPath();
        ctx.moveTo(sling.x - 10, sling.y - 40);
        ctx.lineTo(sling.x + 10, sling.y - 35);
        ctx.strokeStyle = '#3a1f11';
        ctx.lineWidth = 5;
        ctx.stroke();
    }

    ctx.fillStyle = '#6b4226'; // Front prong
    ctx.fillRect(sling.x + 5, sling.y - 40, 12, 40);
    ctx.fillStyle = '#5c3820'; // Base stem
    ctx.fillRect(sling.x - 10, sling.y, 24, GROUND_Y - sling.y);

    // 6. Grass Ground & Front Lip of the Hole
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(hole.x, GROUND_Y);
    // Draw the front edge curve of the hole, overlapping anything falling inside
    ctx.ellipse(hole.x + hole.width / 2, GROUND_Y, hole.width / 2, hole.height / 2, 0, Math.PI, 0, true);
    ctx.lineTo(canvas.width, GROUND_Y);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();
    
    // Draw solid dirt under the grass layer
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, GROUND_Y + 15, hole.x, canvas.height); // Dirt left of hole
    ctx.fillRect(hole.x + hole.width, GROUND_Y + 15, canvas.width, canvas.height); // Dirt right of hole

    // 7. Messages UI
    if (message) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 40, canvas.width, 70);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, 85);
    }
}

// Tick loop
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Start
loop();
