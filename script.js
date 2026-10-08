const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const attemptsText = document.getElementById("attempts-text");
const winScreen = document.getElementById("win-screen");
const winStats = document.getElementById("win-stats");
const resetBtn = document.getElementById("reset-btn");
const playAgainBtn = document.getElementById("play-again-btn");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Physics & Difficulty Settings
const groundY = canvas.height - 120;
const gravity = 0.42;           // Slightly heavier for a more realistic arc
const powerMultiplier = 0.22;   // Launch power
const maxPull = 150;            // Max drag distance
const holeRadius = 22;          // Smaller, tighter hole to make it harder

const sling = { x: 220, y: groundY - 90 };
let hole = { x: canvas.width - 250, y: groundY };

let attempts = 0;
let isDragging = false;
let mouseX = sling.x;
let mouseY = sling.y;

// Mole Object
let mole = {
  x: sling.x,
  y: sling.y,
  vx: 0,
  vy: 0,
  width: 28,  // Elongated body
  height: 18, 
  isFlying: false,
  isLanded: false,
  isWon: false,
  angle: 0
};

// --- INPUT & CONTROLS ---
function resetMole(isNewAttempt = false) {
  mole.x = sling.x;
  mole.y = sling.y;
  mole.vx = 0;
  mole.vy = 0;
  mole.isFlying = false;
  mole.isLanded = false;
  mole.isWon = false;
  mole.angle = 0;
  winScreen.style.display = "none";
  
  if (isNewAttempt) {
    attempts++;
    attemptsText.innerText = `Shots Taken: ${attempts}`;
  }
}

canvas.addEventListener("mousedown", (e) => {
  if (mole.isFlying || mole.isWon) return;
  const dist = Math.hypot(e.clientX - mole.x, e.clientY - mole.y);
  if (dist < 60) isDragging = true; // Generous grab area
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  
  let dx = e.clientX - sling.x;
  let dy = e.clientY - sling.y;
  let dist = Math.hypot(dx, dy);
  
  if (dist > maxPull) {
    const angle = Math.atan2(dy, dx);
    mouseX = sling.x + Math.cos(angle) * maxPull;
    mouseY = sling.y + Math.sin(angle) * maxPull;
  } else {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  // Prevent dragging character into the floor
  if (mouseY > groundY - mole.height - 10) {
    mouseY = groundY - mole.height - 10;
  }

  mole.x = mouseX;
  mole.y = mouseY;
});

window.addEventListener("mouseup", () => {
  if (!isDragging) return;
  isDragging = false;
  
  const dx = sling.x - mole.x;
  const dy = sling.y - mole.y;
  
  if (Math.hypot(dx, dy) > 20) {
    mole.vx = dx * powerMultiplier;
    mole.vy = dy * powerMultiplier;
    mole.isFlying = true;
    attempts++;
    attemptsText.innerText = `Shots Taken: ${attempts}`;
  } else {
    resetMole();
  }
});

resetBtn.addEventListener("click", () => resetMole(false));
playAgainBtn.addEventListener("click", () => {
  attempts = 0;
  attemptsText.innerText = `Shots Taken: 0`;
  resetMole(false);
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  hole.x = canvas.width - 250; 
});


// --- GAME LOGIC ---
function update() {
  if (mole.isFlying) {
    mole.vy += gravity;
    mole.x += mole.vx;
    mole.y += mole.vy;
    
    // Aerodynamic rotation
    mole.angle = Math.atan2(mole.vy, mole.vx);

    // WIN CONDITION: Must land perfectly inside the tight hole boundary
    const distToHoleCenter = Math.abs(mole.x - hole.x);
    if (distToHoleCenter < holeRadius - 5 && mole.y > groundY - 15 && mole.vy > 0) {
      mole.isFlying = false;
      mole.isWon = true;
      mole.x = hole.x;
      mole.y = groundY + 15;
      winStats.innerText = `You got the mole in the hole in ${attempts} shot(s)!`;
      winScreen.style.display = "block";
    }

    // GROUND COLLISION (Miss)
    if (mole.y > groundY - mole.height && !mole.isWon) {
      mole.y = groundY - mole.height;
      mole.vy = -mole.vy * 0.45; // Bounce
      mole.vx = mole.vx * 0.85;  // Low friction so it slides/rolls past the hole!
      
      // Stop moving when extremely slow
      if (Math.abs(mole.vy) < 1 && Math.abs(mole.vx) < 0.2) {
        mole.isFlying = false;
        mole.isLanded = true;
        setTimeout(() => { if (!mole.isWon) resetMole(false); }, 1200);
      }
    }
    
    // Out of bounds
    if (mole.x > canvas.width + 100 || mole.x < -100) {
      setTimeout(() => resetMole(false), 500);
    }
  }
}

// --- RENDERING ---
function drawEnvironment() {
  // Sky
  let sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, "#5DADE2");
  sky.addColorStop(1, "#AED6F1");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, groundY);

  // Grass / Ground
  ctx.fillStyle = "#27AE60"; // Vibrant Grass
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
  ctx.fillStyle = "#2ECC71"; // Grass top trim
  ctx.fillRect(0, groundY, canvas.width, 18);

  // Slingshot Back Band
  if (isDragging) {
    ctx.strokeStyle = "#C0392B";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(sling.x - 15, sling.y);
    ctx.lineTo(mole.x, mole.y);
    ctx.stroke();
  }

  // Slingshot Post
  ctx.strokeStyle = "#8E44AD"; // Fun purple slingshot base
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(sling.x, sling.y + 70);
  ctx.lineTo(sling.x, sling.y);
  ctx.stroke();

  // Slingshot Front Band & Aiming Line
  if (isDragging) {
    ctx.strokeStyle = "#E74C3C";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(sling.x + 15, sling.y);
    ctx.lineTo(mole.x, mole.y);
    ctx.stroke();
    
    // SHORT Aiming Preview (Makes the game harder!)
    let simX = mole.x;
    let simY = mole.y;
    let simVx = (sling.x - mole.x) * powerMultiplier;
    let simVy = (sling.y - mole.y) * powerMultiplier;
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    for (let i = 0; i < 7; i++) { // Only shows 7 dots!
      simX += simVx;
      simVy += gravity;
      simY += simVy;
      ctx.beginPath();
      ctx.arc(simX, simY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // The Hole
  ctx.fillStyle = "#145A32";
  ctx.beginPath();
  ctx.ellipse(hole.x, groundY, holeRadius, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flag & Pin
  ctx.strokeStyle = "#ECF0F1";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(hole.x, groundY);
  ctx.lineTo(hole.x, groundY - 100);
  ctx.stroke();
  
  ctx.fillStyle = "#E74C3C";
  ctx.beginPath();
  ctx.moveTo(hole.x, groundY - 100);
  ctx.lineTo(hole.x - 40, groundY - 80);
  ctx.lineTo(hole.x, groundY - 60);
  ctx.fill();
}

function drawCuteMole(x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  
  if (isDragging) {
    let pullAngle = Math.atan2(sling.y - y, sling.x - x);
    ctx.rotate(pullAngle);
  } else {
    ctx.rotate(angle);
  }

  // 1. Elongated Peanut Body
  ctx.fillStyle = "#4a4e59"; // Soft dark grey/brown
  ctx.beginPath();
  ctx.arc(10, 0, 16, -Math.PI/2, Math.PI/2); // Front half
  ctx.arc(-14, 0, 18, Math.PI/2, -Math.PI/2); // Back half
  ctx.closePath();
  ctx.fill();

  // 2. Pointy Pink Snout
  ctx.fillStyle = "#ff99a8";
  ctx.beginPath();
  ctx.moveTo(22, -6);
  ctx.lineTo(36, 2);
  ctx.lineTo(24, 8);
  ctx.fill();
  
  // Nose tip
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(36, 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // 3. Cute Digging Paws (Front)
  ctx.fillStyle = "#ff99a8";
  ctx.beginPath();
  ctx.arc(14, 14, 7, 0, Math.PI * 2);
  ctx.fill();
  // Claws
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(14, 18); ctx.lineTo(16, 23);
  ctx.moveTo(11, 16); ctx.lineTo(12, 21);
  ctx.stroke();

  // 4. Back Paws
  ctx.fillStyle = "#ff99a8";
  ctx.beginPath();
  ctx.arc(-12, 16, 6, 0, Math.PI * 2);
  ctx.fill();

  // 5. Big Shiny Anime Eye
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(12, -4, 4, 0, Math.PI*2);
  ctx.fill();
  // Eye Sparkle
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(13, -5, 1.5, 0, Math.PI*2);
  ctx.fill();

  // 6. Cute Little Tail
  ctx.fillStyle = "#4a4e59";
  ctx.beginPath();
  ctx.arc(-32, -2, 4, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update();
  drawEnvironment();
  drawCuteMole(mole.x, mole.y, mole.angle);
  requestAnimationFrame(gameLoop);
}

gameLoop();
