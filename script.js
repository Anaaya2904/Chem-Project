const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const attemptsDisplay = document.getElementById("attemptsDisplay");

// Physics Constants
const GRAVITY = 0.38;
const LAUNCH_POWER = 0.17;
const MAX_PULL = 110;

// Game anchors
const slingshot = { x: 140, y: 320 };
const hole = { x: 720, y: 400, radiusX: 32, radiusY: 10 };

let attempts = 1;
let isDragging = false;
let dragX = slingshot.x;
let dragY = slingshot.y;

// Particle effects container
let particles = [];

// Mole character
const mole = {
  x: slingshot.x,
  y: slingshot.y,
  vx: 0,
  vy: 0,
  radius: 20,
  rotation: 0,
  inFlight: false,
  landed: false,
  won: false,
};

function resetMole(nextAttempt = true) {
  mole.x = slingshot.x;
  mole.y = slingshot.y;
  mole.vx = 0;
  mole.vy = 0;
  mole.rotation = 0;
  mole.inFlight = false;
  mole.landed = false;
  dragX = slingshot.x;
  dragY = slingshot.y;

  if (nextAttempt && !mole.won) {
    attempts++;
    attemptsDisplay.textContent = `Tries: ${attempts}`;
  }
}

// Sparkle / dirt puff particles
function spawnParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.7) * 6,
      radius: Math.random() * 4 + 2,
      alpha: 1,
      color: color,
    });
  }
}

// Mouse / Touch Handlers
function getCanvasMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

canvas.addEventListener("mousedown", (e) => {
  if (mole.inFlight || mole.won) return;
  const pos = getCanvasMousePos(e);
  const dist = Math.hypot(pos.x - mole.x, pos.y - mole.y);

  if (dist <= mole.radius + 15) {
    isDragging = true;
  }
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const pos = getCanvasMousePos(e);

  let dx = pos.x - slingshot.x;
  let dy = pos.y - slingshot.y;
  let dist = Math.hypot(dx, dy);

  if (dist > MAX_PULL) {
    let angle = Math.atan2(dy, dx);
    dragX = slingshot.x + Math.cos(angle) * MAX_PULL;
    dragY = slingshot.y + Math.sin(angle) * MAX_PULL;
  } else {
    dragX = pos.x;
    dragY = pos.y;
  }

  mole.x = dragX;
  mole.y = dragY;
  mole.rotation = Math.atan2(dragY - slingshot.y, dragX - slingshot.x);
});

window.addEventListener("mouseup", () => {
  if (!isDragging) return;
  isDragging = false;

  const dx = slingshot.x - dragX;
  const dy = slingshot.y - dragY;

  // Launch only if pulled back enough
  if (Math.hypot(dx, dy) > 12) {
    mole.vx = dx * LAUNCH_POWER;
    mole.vy = dy * LAUNCH_POWER;
    mole.inFlight = true;
  } else {
    resetMole(false);
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") {
    mole.won = false;
    resetMole(false);
  }
});

// Update game mechanics
function update() {
  if (mole.inFlight) {
    mole.vy += GRAVITY;
    mole.x += mole.vx;
    mole.y += mole.vy;
    mole.rotation += mole.vx * 0.03;

    // Flight dust trail
    if (Math.random() < 0.4) {
      spawnParticles(mole.x, mole.y, "rgba(226, 232, 240, 0.6)", 1);
    }

    // Hole detection
    const distToHole = Math.hypot(mole.x - hole.x, mole.y - hole.y);
    if (distToHole < hole.radiusX && mole.vy > 0 && mole.y > hole.y - 15) {
      mole.inFlight = false;
      mole.won = true;
      mole.x = hole.x;
      mole.y = hole.y + 4;
      spawnParticles(hole.x, hole.y, "#facc15", 30);
    }

    // Ground bounce & friction
    if (mole.y + mole.radius >= 400) {
      mole.y = 400 - mole.radius;
      mole.vy = -mole.vy * 0.35;
      mole.vx *= 0.72;

      spawnParticles(mole.x, 400, "#78350f", 3);

      if (Math.abs(mole.vy) < 0.8 && Math.abs(mole.vx) < 0.3) {
        mole.inFlight = false;
        mole.landed = true;
        setTimeout(() => resetMole(true), 1100);
      }
    }

    // Out of bounds
    if (mole.x > canvas.width + 60 || mole.x < -60) {
      resetMole(true);
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.025;
    if (p.alpha <= 0) particles.splice(i, 1);
  }
}

// Drawing routines
function drawMoleCharacter(x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Mole body (plump brown potato shape)
  ctx.fillStyle = "#5c3d2e";
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#382319";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Snout (pink protruding muzzle)
  ctx.fillStyle = "#fbcfe8";
  ctx.beginPath();
  ctx.ellipse(16, 2, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose tip
  ctx.fillStyle = "#be185d";
  ctx.beginPath();
  ctx.arc(22, 1, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(14, 0); ctx.lineTo(26, -5);
  ctx.moveTo(14, 3); ctx.lineTo(27, 4);
  ctx.stroke();

  // Eye (small bead eye)
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(10, -5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Eye shine
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(9.5, -6, 1, 0, Math.PI * 2);
  ctx.fill();

  // Front Digger Paws (broad claws)
  ctx.fillStyle = "#fbcfe8";
  ctx.beginPath();
  ctx.ellipse(5, 12, 6, 4, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Claws
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(6, 14); ctx.lineTo(8, 18);
  ctx.moveTo(9, 13); ctx.lineTo(12, 17);
  ctx.stroke();

  // Round ear
  ctx.fillStyle = "#4a2f22";
  ctx.beginPath();
  ctx.arc(-8, -10, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSlingshot() {
  // Wood Y-post
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(slingshot.x, slingshot.y + 80);
  ctx.lineTo(slingshot.x, slingshot.y + 15);
  ctx.lineTo(slingshot.x - 14, slingshot.y - 12);
  ctx.moveTo(slingshot.x, slingshot.y + 15);
  ctx.lineTo(slingshot.x + 14, slingshot.y - 12);
  ctx.stroke();

  // Rubber Bands
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  if (isDragging) {
    ctx.moveTo(slingshot.x - 14, slingshot.y - 12);
    ctx.lineTo(mole.x - 10, mole.y);
    ctx.moveTo(slingshot.x + 14, slingshot.y - 12);
    ctx.lineTo(mole.x - 10, mole.y);
  } else {
    ctx.moveTo(slingshot.x - 14, slingshot.y - 12);
    ctx.lineTo(slingshot.x + 14, slingshot.y - 12);
  }
  ctx.stroke();
}

function drawTrajectory() {
  if (!isDragging) return;

  let simX = mole.x;
  let simY = mole.y;
  let simVx = (slingshot.x - dragX) * LAUNCH_POWER;
  let simVy = (slingshot.y - dragY) * LAUNCH_POWER;

  for (let i = 0; i < 24; i++) {
    simX += simVx;
    simVy += GRAVITY;
    simY += simVy;

    ctx.fillStyle = `rgba(255, 255, 255, ${1 - i / 24})`;
    ctx.beginPath();
    ctx.arc(simX, simY, 3 - (i * 0.08), 0, Math.PI * 2);
    ctx.fill();

    if (simY >= 400) break;
  }
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Trajectory dots behind ground
  drawTrajectory();

  // Green fairway / grass
  ctx.fillStyle = "#15803d";
  ctx.fillRect(0, 400, canvas.width, 80);

  // Grass blade trims
  ctx.fillStyle = "#16a34a";
  for (let i = 0; i < canvas.width; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 400);
    ctx.lineTo(i + 8, 393);
    ctx.lineTo(i + 16, 400);
    ctx.fill();
  }

  // Hole Cup
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.ellipse(hole.x, hole.y, hole.radiusX, hole.radiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flag Pole
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(hole.x, hole.y);
  ctx.lineTo(hole.x, hole.y - 95);
  ctx.stroke();

  // Flag Banner (Mole Day 10²³)
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(hole.x, hole.y - 95);
  ctx.lineTo(hole.x - 38, hole.y - 78);
  ctx.lineTo(hole.x, hole.y - 62);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 10px sans-serif";
  ctx.fillText("10²³", hole.x - 28, hole.y - 75);

  // Slingshot
  drawSlingshot();

  // Particles
  for (let p of particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // Draw Mole
  drawMoleCharacter(mole.x, mole.y, mole.rotation);

  // Win Screen Overlay
  if (mole.won) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#facc15";
    ctx.font = "900 42px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MOLE IN ONE! 🎉", canvas.width / 2, canvas.height / 2 - 25);

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px sans-serif";
    ctx.fillText(`Completed in ${attempts} shot(s)!`, canvas.width / 2, canvas.height / 2 + 18);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "14px monospace";
    ctx.fillText("Press 'R' to play again", canvas.width / 2, canvas.height / 2 + 55);
    ctx.textAlign = "start";
  }
}

function gameLoop() {
  update();
  drawScene();
  requestAnimationFrame(gameLoop);
}

gameLoop();