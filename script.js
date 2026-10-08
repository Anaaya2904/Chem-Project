const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreBoard = document.getElementById('score-board');
const shotsBoard = document.getElementById('shots-board');
const msgOverlay = document.getElementById('msg-overlay');

// Image Configuration
let imageLoaded = false;
const moleImage = new Image();
moleImage.onload = () => { imageLoaded = true; };
moleImage.onerror = () => { imageLoaded = false; };
moleImage.src = 'download.png'; 

// Game Balance / State Values
let score = 0;
let shots = 0;
const particles = [];
const clouds = [
    {x: 100, y: 60, speed: 0.2, size: 40},
    {x: 450, y: 90, speed: 0.15, size: 55},
    {x: 750, y: 50, speed: 0.25, size: 35}
];

// Physics setup
const gravity = 0.38;
const bounceElasticity = 0.35;
const friction = 0.975;

// Slingshot Physics Vectors
const slingX = 160;
const slingY = 340;
const maxPull = 110;
const launchForceMultiplier = 0.16;

const mole = {
    x: slingX,
    y: slingY,
    radius: 24, 
    vx: 0,
    vy: 0,
    isDragging: false,
    isFlying: false,
    angle: 0
};

const hole = {
    x: 630,
    y: 385,
    width: 85,
    height: 22
};

let mouseX = 0;
let mouseY = 0;

function init() {
    resetMole();
    spawnHoleRandomly();
    
    // Desktop Interactivity
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Mobile Interactivity
    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        mouseX = touch.clientX - rect.left;
        mouseY = touch.clientY - rect.top;
        if(getDistance(mouseX, mouseY, mole.x, mole.y) < mole.radius + 35) {
            onMouseDown(touch);
        }
    });
    window.addEventListener('touchmove', (e) => {
        if (!mole.isDragging) return;
        onMouseMove(e.touches[0]);
    });
    window.addEventListener('touchend', onMouseUp);

    requestAnimationFrame(update);
}

function spawnHoleRandomly() {
    hole.x = Math.floor(Math.random() * (700 - 420 + 1)) + 420;
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

function createImpactParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: -Math.random() * 4 - 1,
            radius: Math.random() * 5 + 3,
            alpha: 1,
            color: '#d4a373' // Dust/Earth color
        });
    }
}

function onMouseDown(e) {
    if (mole.isFlying) return;
    const rect = canvas.getBoundingClientRect();
    const mX = (e.clientX || e.pageX) - rect.left;
    const mY = (e.clientY || e.pageY) - rect.top;

    if (getDistance(mX, mY, mole.x, mole.y) < mole.radius + 35) {
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

    mole.vx = (slingX - mole.x) * launchForceMultiplier;
    mole.vy = (slingY - mole.y) * launchForceMultiplier;

    shots++;
    shotsBoard.textContent = `🚀 Shots: ${shots}`;
}

function triggerSuccessSequence() {
    score++;
    scoreBoard.textContent = `⛳ Score: ${score}`;
    msgOverlay.classList.add('show');
    
    createImpactParticles(mole.x, mole.y, 25);
    
    setTimeout(() => {
        msgOverlay.classList.remove('show');
        resetMole();
        spawnHoleRandomly();
    }, 1400);
}

function checkCollisions() {
    const groundY = 385;

    // Hit Goal Check
    if (mole.y + mole.radius >= groundY && mole.x >= hole.x && mole.x <= hole.x + hole.width) {
        if (Math.abs(mole.vx) < 6.5 && mole.vy >= 0) {
            triggerSuccessSequence();
            return;
        }
    }

    // Floor Bounce Physics
    if (mole.y + mole.radius > groundY) {
        mole.y = groundY - mole.radius;
        if (Math.abs(mole.vy) > 1.5) createImpactParticles(mole.x, mole.y + mole.radius, 6);
        mole.vy = -mole.vy * bounceElasticity;
        mole.vx *= friction;
    }

    // Border Bounce Walls
    if (mole.x - mole.radius < 0) {
        mole.x = mole.radius;
        mole.vx = -mole.vx * bounceElasticity;
    } else if (mole.x + mole.radius > canvas.width) {
        mole.x = canvas.width - mole.radius;
        mole.vx = -mole.vx * bounceElasticity;
    }

    // Idle Rest State Engine reset
    if (mole.isFlying && Math.abs(mole.vx) < 0.12 && Math.abs(mole.vy) < 0.12 && mole.y >= groundY - mole.radius - 5) {
        setTimeout(resetMole, 600);
    }
}

function drawScenery() {
    // Beautiful Sky Gradient
    let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#70c1ff');
    skyGrad.addColorStop(0.7, '#bfe3ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glowing Sun
    ctx.fillStyle = 'rgba(255, 252, 214, 0.5)';
    ctx.beginPath();
    ctx.arc(700, 80, 75, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fffdf0';
    ctx.beginPath();
    ctx.arc(700, 80, 50, 0, Math.PI*2);
    ctx.fill();

    // Procedural Floating Clouds Animation Engine
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    clouds.forEach(c => {
        c.x += c.speed;
        if (c.x - c.size * 2 > canvas.width) c.x = -c.size * 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.arc(c.x + c.size * 0.6, c.y - c.size * 0.4, c.size * 0.8, 0, Math.PI * 2);
        ctx.arc(c.x - c.size * 0.6, c.y, c.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    });

    // Back Hill Landscape layer
    ctx.fillStyle = '#6ab04c';
    ctx.beginPath();
    ctx.ellipse(200, 430, 400, 120, 0, 0, Math.PI*2);
    ctx.ellipse(650, 450, 350, 140, 0, 0, Math.PI*2);
    ctx.fill();

    // Foreground Primary Green Lawn Field Base Line
    ctx.fillStyle = '#4cd137';
    ctx.fillRect(0, 385, canvas.width, canvas.height - 385);
    
    ctx.fillStyle = '#44bd32';
    ctx.fillRect(0, 415, canvas.width, canvas.height - 415);
}

function drawTrajectory() {
    if (!mole.isDragging) return;

    let simX = mole.x;
    let simY = mole.y;
    let simVx = (slingX - mole.x) * launchForceMultiplier;
    let simVy = (slingY - mole.y) * launchForceMultiplier;

    for (let i = 0; i < 30; i++) {
        simVx *= friction;
        simVy += gravity;
        simX += simVx;
        simY += simVy;
        
        if (simY > 385) break;

        // Modern glowing trajectory dots instead of flat ugly line
        ctx.fillStyle = `rgba(255, 255, 255, ${1 - (i / 30)})`;
        ctx.beginPath();
        ctx.arc(simX, simY, 4.5 - (i * 0.08), 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSlingshot(isFrontLayer) {
    ctx.lineCap = 'round';
    
    if (!isFrontLayer) {
        // Back Wood Frame
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#5c3d24';
        ctx.beginPath();
        ctx.moveTo(slingX - 12, slingY - 10);
        ctx.lineTo(slingX - 12, 395);
        ctx.stroke();

        // Rubber Band Back Segment Connection
        if (mole.isDragging) {
            ctx.strokeStyle = '#d35400';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(slingX - 12, slingY - 10);
            ctx.lineTo(mole.x, mole.y);
            ctx.stroke();
        }
    } else {
        // Rubber Band Front Segment Connection Overlay
        if (mole.isDragging) {
            ctx.strokeStyle = '#e67e22';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(slingX + 12, slingY - 10);
            ctx.lineTo(mole.x, mole.y);
            ctx.stroke();
        }

        // Front Fork Frame & Base Mount Structure
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#714d32';
        ctx.beginPath();
        ctx.moveTo(slingX + 12, slingY - 10);
        ctx.lineTo(slingX + 12, 365);
        ctx.lineTo(slingX, 380);
        ctx.lineTo(slingX, 440); // Root into ground
        ctx.stroke();

        // Leather holding patch accent pouch capsule shape indicator
        if(mole.isDragging) {
            ctx.fillStyle = '#3a2312';
            ctx.beginPath();
            ctx.arc(mole.x, mole.y, 8, 0, Math.PI*2);
            ctx.fill();
        }
    }
}

function drawMole() {
    ctx.save();
    ctx.translate(mole.x, mole.y);
    
    if (mole.isFlying) {
        mole.angle += (mole.vx * 0.035);
        ctx.rotate(mole.angle);
    } else if (mole.isDragging) {
        let pullAngle = Math.atan2(slingY - mole.y, slingX - mole.x);
        ctx.rotate(pullAngle);
    }

    if (imageLoaded) {
        // Render custom file source setup safely
        ctx.drawImage(moleImage, -mole.radius * 1.3, -mole.radius * 1.3, mole.radius * 2.6, mole.radius * 2.6);
    } else {
        // PREMIUM VECTOR ART FALLBACK - Looks incredibly polished without needing any files!
        
        // Shadow base
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, mole.radius - 4, mole.radius, 8, 0, 0, Math.PI*2);
        ctx.fill();

        // Main Dark Chocolate Fur Body
        ctx.fillStyle = '#4a3728';
        ctx.beginPath();
