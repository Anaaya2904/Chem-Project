const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreBoard = document.getElementById('score-board');
const shotsBoard = document.getElementById('shots-board');
const msgOverlay = document.getElementById('msg-overlay');

let score = 0;
let shots = 0;
const particles = [];
const clouds = [
    {x: 80, y: 70, speed: 0.18, size: 38},
    {x: 400, y: 100, speed: 0.12, size: 50},
    {x: 720, y: 60, speed: 0.22, size: 32}
];

const gravity = 0.38;
const bounceElasticity = 0.38;
const friction = 0.978;

const slingX = 160;
const slingY = 340;
const maxPull = 110;
const launchForceMultiplier = 0.16;

const mole = {
    x: slingX,
    y: slingY,
    radius: 25, 
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
    
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        mouseX = touch.clientX - rect.left;
        mouseY = touch.clientY - rect.top;
        if(getDistance(mouseX, mouseY, mole.x, mole.y) < mole.radius + 35) {
            onMouseDown(touch);
        }
    });
    canvas.addEventListener('touchmove', (e) => {
        if (!mole.isDragging) return;
        const touch = e.touches[0];
        onMouseMove(touch);
    });
    window.addEventListener('touchend', onMouseUp);

    requestAnimationFrame(update);
}

function spawnHoleRandomly() {
    hole.x = Math.floor(Math.random() * (680 - 420 + 1)) + 420;
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

function createImpactParticles(x, y, count, isWin = false) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * (isWin ? 8 : 5),
            vy: -Math.random() * 5 - 2,
            radius: Math.random() * 6 + 3,
            alpha: 1,
            color: isWin ? `hsl(${Math.random() * 360}, 100%, 70%)` : '#e9c46a'
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
    if (!mole.isDragging) return;
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX || e.pageX) - rect.left;
    mouseY = (e.clientY || e.pageY) - rect.top;

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

function onMouseUp() {
    if (!mole.isDragging) return;
    
    mole.isDragging = false;
    mole.isFlying = true;

    mole.vx = (slingX - mole.x) * launchForceMultiplier;
    mole.vy = (slingY - mole.y) * launchForceMultiplier;

    shots++;
    if (shotsBoard) shotsBoard.textContent = `🎯 Shots: ${shots}`;
}

function triggerSuccessSequence() {
    score++;
    if (scoreBoard) scoreBoard.textContent = `✨ Score: ${score}`;
    if (msgOverlay) msgOverlay.classList.add('show');
    
    createImpactParticles(mole.x, mole.y, 40, true);
    
    setTimeout(() => {
        if (msgOverlay) msgOverlay.classList.remove('show');
        resetMole();
        spawnHoleRandomly();
    }, 1400);
}

function checkCollisions() {
    const groundY = 385;

    if (mole.y + mole.radius >= groundY && mole.x >= hole.x && mole.x <= hole.x + hole.width) {
        if (Math.abs(mole.vx) < 6.5 && mole.vy >= 0) {
            triggerSuccessSequence();
            return;
        }
    }

    if (mole.y + mole.radius > groundY) {
        mole.y = groundY - mole.radius;
        if (Math.abs(mole.vy) > 1.2) createImpactParticles(mole.x, mole.y + mole.radius, 6);
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

    if (mole.isFlying && Math.abs(mole.vx) < 0.15 && Math.abs(mole.vy) < 0.15 && mole.y >= groundY - mole.radius - 5) {
        setTimeout(resetMole, 600);
    }
}

function drawScenery() {
    let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#a1c4fd');
    skyGrad.addColorStop(0.7, '#c2e9fb');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 253, 230, 0.4)';
    ctx.beginPath();
    ctx.arc(710, 80, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff9db';
    ctx.beginPath();
    ctx.arc(710, 80, 45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    clouds.forEach(c => {
        c.x += c.speed;
        if (c.x - c.size * 2 > canvas.width) c.x = -c.size * 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.arc(c.x + c.size * 0.6, c.y - c.size * 0.4, c.size * 0.8, 0, Math.PI * 2);
        ctx.arc(c.x - c.size * 0.6, c.y, c.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = '#7bed9f';
    ctx.beginPath();
    ctx.ellipse(220, 420, 420, 110, 0, 0, Math.PI * 2);
    ctx.ellipse(660, 440, 360, 130, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2ed573';
    ctx.fillRect(0, 385, canvas.width, canvas.height - 385);
    
    ctx.fillStyle = '#26af5f';
    ctx.fillRect(0, 420, canvas.width, canvas.height - 420);
}

function drawTrajectory() {
    if (!mole.isDragging) return;

    let simX = mole.x;
    let simY = mole.y;
    let simVx = (slingX - mole.x) * launchForceMultiplier;
    let simVy = (slingY - mole.y) * launchForceMultiplier;

    for (let i = 0; i < 28; i++) {
        simVx *= friction;
        simVy += gravity;
        simX += simVx;
        simY += simVy;
        
        if (simY > 385) break;

        ctx.fillStyle = `rgba(255, 255, 255, ${1 - (i / 28)})`;
        ctx.beginPath();
        ctx.arc(simX, simY, 5 - (i * 0.1), 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSlingshot(isFrontLayer) {
    ctx.lineCap = 'round';
    if (!isFrontLayer) {
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#8c532b';
        ctx.beginPath();
        ctx.moveTo(slingX - 12, slingY - 10);
        ctx.lineTo(slingX - 12, 395);
        ctx.stroke();

        if (mole.isDragging) {
            ctx.strokeStyle = '#e17055';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(slingX - 12, slingY - 10);
            ctx.lineTo(mole.x, mole.y);
            ctx.stroke();
        }
    } else {
        if (mole.isDragging) {
            ctx.strokeStyle = '#fab1a0';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(slingX + 12, slingY - 10);
            ctx.lineTo(mole.x, mole.y);
            ctx.stroke();
        }

        ctx.lineWidth = 14;
        ctx.strokeStyle = '#a05e32';
        ctx.beginPath();
        ctx.moveTo(slingX + 12, slingY - 10);
        ctx.lineTo(slingX + 12, 365);
        ctx.lineTo(slingX, 380);
        ctx.lineTo(slingX, 440); 
        ctx.stroke();

        if(mole.isDragging) {
            ctx.fillStyle = '#573719';
            ctx.beginPath();
            ctx.arc(mole.x, mole.y, 9, 0, Math.PI * 2);
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

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(0, mole.radius - 4, mole.radius, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#533c2e';
    ctx.beginPath();
    ctx.arc(0, 0, mole.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffdfba';
    ctx.beginPath();
    ctx.ellipse(0, mole.radius * 0.3, mole.radius * 0.72, mole.radius * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffccd5';
    ctx.beginPath(); ctx.arc(-mole.radius * 0.45, mole.radius * 0.65, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mole.radius * 0.25, mole.radius * 0.78, 5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(mole.radius * 0.1, -8, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.arc(mole.radius * 0.16, -8, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(mole.radius * 0.23, -9.5, 1.8, 0, Math.PI * 2);
    ctx.arc(mole.radius * 0.1, -6.5, 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 107, 107, 0.45)';
    ctx.beginPath();
    ctx.arc(-mole.radius * 0.3, -1, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffb3c1';
    ctx.beginPath();
    ctx.ellipse(mole.radius * 0.4, -1, mole.radius * 0.4, mole.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ff4d6d';
