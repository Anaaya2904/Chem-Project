const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreBoard = document.getElementById('score-board');
const shotsBoard = document.getElementById('shots-board');
const msgOverlay = document.getElementById('msg-overlay');

// 1. Create and source the Mole Image Asset
const moleImage = new Image();
moleImage.src = 'download.png'; // Place your saved mole image file in the same GitHub folder named exactly 'mole.png'

// Game State Values
let score = 0;
let shots = 0;

// Physics Parameters
const gravity = 0.35;
const bounceElasticity = 0.4;
const friction = 0.98;

// Sling/Launch Base Anchor
const slingX = 150;
const slingY = 320;
const maxPull = 120;
const launchForceMultiplier = 0.15;

// Entities (Adjusted size slightly to fit the new sprite details beautifully)
const mole = {
    x: slingX,
    y: slingY,
    radius: 22, 
    vx: 0,
    vy: 0,
    isDragging: false,
    isFlying: false,
    angle: 0
};

const hole = {
    x: 650,
    y: 350,
    width: 75,
    height: 18
};

// Interaction metrics
let mouseX = 0;
let mouseY = 0;

function init() {
    resetMole();
    spawnHoleRandomly();
    
    // Event Attachments
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        mouseX = touch.clientX - rect.left;
        mouseY = touch.clientY - rect.top;
        if(getDistance(mouseX, mouseY, mole.x, mole.y) < mole.radius + 15) {
            onMouseDown(touch);
        }
    });
    window.addEventListener('touchmove', (e) => {
        if (!mole.isDragging) return;
        const touch = e.touches[0];
        onMouseMove(touch);
    });
    window.addEventListener('touchend', onMouseUp);

    // Start Simulation Loop
    requestAnimationFrame(update);
}

function spawnHoleRandomly() {
    hole.x = Math.floor(Math.random() * (720 - 400 + 1)) + 400;
}

function resetMole() {
    mole.x = slingX;
    mole.y = slingY;
    mole.vx = 0;
    mole.vy = 0;
    mole.isFlying = false;
    mole.isDragging = false;
    mole.angle = 0;
}

function getDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function onMouseDown(e) {
    if (mole.isFlying) return;

    const rect = canvas.getBoundingClientRect();
    const mX = (e.clientX || e.pageX) - rect.left;
    const mY = (e.clientY || e.pageY) - rect.top;

    if (getDistance(mX, mY, mole.x, mole.y) < mole.radius + 20) {
        mole.isDragging = true;
    }
}

function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX || e.pageX) - rect.left;
    mouseY = (e.clientY || e.pageY) - rect.top;

    if (mole.isDragging) {
        let distance = getDistance(mouseX, mouseY, slingX, slingY);
        let angle = Math.atan2(mouseY - slingY, mouseX - slingX);

        if (distance > maxPull) {
            mole.x = slingX + Math.cos(angle) * maxPull;
            mole.y = slingY + Math.sin(angle) * maxPull;
        } else {
            mole.x = mouseX;
            mole.y = mouseY;
        }
    }
}

function onMouseUp() {
    if (!mole.isDragging) return;
    
    mole.isDragging = false;
    mole.isFlying = true;

    const dx = slingX - mole.x;
    const dy = slingY - mole.y;

    mole.vx = dx * launchForceMultiplier;
    mole.vy = dy * launchForceMultiplier;

    shots++;
    shotsBoard.textContent = `Shots: ${shots}`;
}

function showMessage(text) {
    msgOverlay.textContent = text;
    msgOverlay.style.opacity = '1';
    setTimeout(() => {
        msgOverlay.style.opacity = '0';
    }, 1500);
}

function checkCollisions() {
    const groundY = 350;

    if (mole.y + mole.radius >= groundY && mole.x >= hole.x && mole.x <= hole.x + hole.width) {
        if (Math.abs(mole.vx) < 5 && mole.vy >= 0) {
            score++;
            scoreBoard.textContent = `Score: ${score}`;
            showMessage("MOLE IN ONE!");
            resetMole();
            spawnHoleRandomly();
            return;
        }
    }

    if (mole.y + mole.radius > groundY) {
        mole.y = groundY - mole.radius;
        mole.vy = -mole.vy * bounceElasticity;
        mole.vx *= friction;
    }

    if (mole.x - mole.radius < 0) {
        mole.x = mole.radius;
        mole.vx = -mole.vx * bounceElasticity;
    } else if (mole.x + mole.radius > canvas.width) {
        mole.x = canvas.width - mole.radius;
        mole.vx = -mole.vx * bounceElasticity;
    }

    if (mole.isFlying && Math.abs(mole.vx) < 0.05 && Math.abs(mole.vy) < 0.05 && mole.y >= groundY - mole.radius - 2) {
        setTimeout(resetMole, 600);
    }
}

function drawTrajectory() {
    if (!mole.isDragging) return;

    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 3;

    let simX = mole.x;
    let simY = mole.y;
    let simVx = (slingX - mole.x) * launchForceMultiplier;
    let simVy = (slingY - mole.y) * launchForceMultiplier;

    ctx.moveTo(simX, simY);

    for (let i = 0; i < 35; i++) {
        simVx *= friction;
        simVy += gravity;
        simX += simVx;
        simY += simVy;
        
        if (simY > 350) break;
        ctx.lineTo(simX, simY);
    }
    ctx.stroke();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Sling back pillar
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#4a2c11';
    ctx.beginPath();
    ctx.moveTo(slingX, slingY);
    ctx.lineTo(slingX - 10, 350);
    ctx.stroke();

    // Draw elastic bands if dragging
    if (mole.isDragging) {
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(slingX - 12, slingY);
        ctx.lineTo(mole.x, mole.y);
        ctx.moveTo(slingX + 12, slingY);
        ctx.lineTo(mole.x, mole.y);
        ctx.stroke();
    }

    // Target Goal Hole
    ctx.fillStyle = '#1e330e';
    ctx.beginPath();
    ctx.ellipse(hole.x + hole.width/2, 350, hole.width/2, hole.height, 0, 0, Math.PI * 2);
    ctx.fill();

    drawTrajectory();

    // Render Character Sprite
    ctx.save();
    ctx.translate(mole.x, mole.y);
    
    if (mole.isFlying) {
        mole.angle += (mole.vx * 0.04);
        ctx.rotate(mole.angle);
    } else if (mole.isDragging) {
        // Face the launch direction while pulling back
        let pullAngle = Math.atan2(slingY - mole.y, slingX - mole.x);
        ctx.rotate(pullAngle);
    }

    // Draw the image instead of the basic shapes canvas drawings
    // Centering the image perfectly over the mole's coordinates
    ctx.drawImage(
        moleImage, 
        -mole.radius * 1.3, 
        -mole.radius * 1.3, 
        mole.radius * 2.6, 
        mole.radius * 2.6
    );

    ctx.restore();

    // Draw Sling front pillar for 3D depth layering
    ctx.beginPath();
    ctx.moveTo(slingX, slingY);
    ctx.lineTo(slingX + 10, 350);
    ctx.stroke();
}

function update() {
    if (mole.isFlying) {
        mole.vx *= friction;
        mole.vy += gravity;
        mole.x += mole.vx;
        mole.y += mole.vy;

        checkCollisions();
    }

    draw();
    requestAnimationFrame(update);
}

window.onload = init;
