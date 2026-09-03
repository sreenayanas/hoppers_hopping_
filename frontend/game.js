// ============================================================
// GRACE HOPPER'S BUG HUNT
// Complete frontend game.js
// ============================================================

// ---------- Backend ----------
const BACKEND_URL = "http://localhost:5000/run";

// ---------- Elements ----------
const runBtn = document.getElementById("run-btn");
const codeInput = document.getElementById("code-input");
const screenPresent = document.getElementById("screen-present");
const screen1947 = document.getElementById("screen-1947");

// ============================================================
// AUDIO
// ============================================================

const audio = {
  static: document.getElementById("audio-static"),
  boot: document.getElementById("audio-boot"),
  spawn: document.getElementById("audio-spawn"),
  swing: document.getElementById("audio-swing"),
  hit: document.getElementById("audio-hit"),
  loss: document.getElementById("audio-loss"),
  win: document.getElementById("audio-win"),
  typewriter: document.getElementById("audio-typewriter"),
  fanfare: document.getElementById("audio-fanfare")
};

function playSound(name, volume = 1) {
  const sound = audio[name];

  if (!sound) return;

  try {
    sound.pause();
    sound.currentTime = 0;
    sound.volume = volume;
    sound.play().catch(() => {});
  } catch (error) {
    console.warn("Audio unavailable:", name);
  }
}

// ============================================================
// GAME STATE
// ============================================================

let canvas;
let ctx;

let gameRunning = false;
let gameEnded = false;

let currentError = "UnknownError";
let errorCount = 0;

let totalSwats = Number(localStorage.getItem("hopperSwats") || 0);
let rankIndex = Number(localStorage.getItem("hopperRank") || 0);

let moths = [];

let mouseX = 0;
let mouseY = 0;

let swingTimer = 0;
let screenShake = 0;

let lastTime = 0;
let spawnTimer = 0;

let bannerText = "";
let bannerTimer = 0;

let messageText = "";
let messageTimer = 0;

let transitionActive = false;

// ============================================================
// RANKS
// ============================================================

const ranks = [
  {
    name: "Groundling",
    required: 0
  },
  {
    name: "Apprentice Relay-Sweeper",
    required: 5
  },
  {
    name: "Ensign of the Vacuum Tube",
    required: 12
  },
  {
    name: "Knight of the Flickering Filament",
    required: 25
  },
  {
    name: "Rear Admiral, Order of the Swatted Wing",
    required: 50
  }
];

function getRank() {
  let current = ranks[0];

  for (const rank of ranks) {
    if (totalSwats >= rank.required) {
      current = rank;
    }
  }

  return current;
}

// ============================================================
// MOCKERY
// ============================================================

const mockery = {
  SyntaxError: {
    adjective: "Sluggish",
    noun: "Syntax-Moth"
  },

  TypeError: {
    adjective: "Fickle",
    noun: "Type-Wraith"
  },

  NameError: {
    adjective: "Vanishing",
    noun: "Reference-Sprite"
  },

  IndexError: {
    adjective: "Overreaching",
    noun: "Range-Fiend"
  },

  KeyError: {
    adjective: "Overreaching",
    noun: "Range-Fiend"
  },

  ZeroDivisionError: {
    adjective: "Impossible",
    noun: "Division-Imp"
  },

  AttributeError: {
    adjective: "Nameless",
    noun: "Attribute-Ghoul"
  },

  TimeoutError: {
    adjective: "Relentless",
    noun: "Clockwork-Phantom"
  },

  EmptyInputError: {
    adjective: "Hollow",
    noun: "Vacancy-Moth"
  },

  UnknownError: {
    adjective: "Unknowable",
    noun: "Eldritch-Moth"
  }
};

function getCreature(errorType) {
  return mockery[errorType] || mockery.UnknownError;
}

function randomMockery(errorType) {
  const creature = getCreature(errorType);

  const templates = [
    `Hark! The ${creature.adjective} ${creature.noun} hath descended!`,
    `Beware! The ${creature.adjective} ${creature.noun} doth approach!`,
    `Lo! A ${creature.adjective} ${creature.noun} vexeth the machine!`,
    `Attend! The ${creature.noun} demandeth thy attention!`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function makeLogEntry(errorType) {
  const creature = getCreature(errorType);

  const templates = [
    `Hark! On this eve did the ${creature.adjective} ${creature.noun} beset the relay, and was struck down in glorious combat. Let it be known the programmer's folly remaineth entirely his own to discover.`,

    `Upon the sacred machinery appeared the ${creature.adjective} ${creature.noun}. By heroic swatting was the creature vanquished. Of the original calamity, this logbook revealeth absolutely naught.`,

    `Let the record show that a ${creature.adjective} ${creature.noun} hath troubled the apparatus. The beast is no more. The cause of its visitation remaineth a mystery.`,

    `In the year of our machinery, the ${creature.noun} didst appear. Grace Hopper hath prevailed. Whether wisdom hath prevailed likewise is beyond the scope of this logbook.`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

// ============================================================
// LOGBOOK
// ============================================================

function getLogbook() {
  try {
    return JSON.parse(localStorage.getItem("hopperLogbook") || "[]");
  } catch {
    return [];
  }
}

function saveLogEntry(errorType) {
  const entries = getLogbook();

  entries.push({
    errorType,
    text: makeLogEntry(errorType),
    date: new Date().toLocaleString()
  });

  localStorage.setItem("hopperLogbook", JSON.stringify(entries));
}

// ============================================================
// ERROR HANDLING
// ============================================================

function handleError(errorType) {
  currentError = errorType || "UnknownError";
  errorCount++;

  begin1947Transition();
}

function handleSuccess() {
  console.log("Code ran clean.");
}

// ============================================================
// RUN BUTTON
// ============================================================

async function runCode() {
  const code = codeInput.value;

  runBtn.disabled = true;
  runBtn.textContent = "Running...";

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code
      })
    });

    const data = await response.json();

    console.log("Backend response:", data);

    if (data.status === "error" || data.hasError) {
      handleError(data.error_type || data.errorType);
    } else {
      handleSuccess();
    }

  } catch (err) {
    console.error("Backend unreachable:", err);

    alert(
      "The ancient machine cannot be reached.\n\n" +
      "Make sure Flask is running on localhost:5000."
    );

  } finally {
    runBtn.disabled = false;
    runBtn.textContent = "Run";
  }
}

runBtn.addEventListener("click", runCode);

// ============================================================
// 1947 SCREEN
// ============================================================

function setupGameScreen() {
  screen1947.innerHTML = `
    <div id="game-wrapper">

      <canvas id="game-canvas"></canvas>

      <div id="game-hud">
        <div class="hud-left">
          <div>HARVARD MARK II</div>
          <div id="rank-display">GROUNDLING</div>
        </div>

        <div class="hud-center">
          <div id="game-banner"></div>
        </div>

        <div class="hud-right">
          <div>SWATS: <span id="swat-count">0</span></div>
          <div>BUGS: <span id="bug-count">0</span></div>
        </div>
      </div>

      <div id="game-message"></div>

      <button id="logbook-button">LOGBOOK</button>

      <div id="logbook-overlay">
        <div id="logbook-paper">
          <button id="close-logbook">×</button>

          <h1>THE LOGBOOK</h1>
          <div id="logbook-content"></div>
        </div>
      </div>

      <div id="rank-overlay">
        <div id="rank-card">
          <div class="rank-small">PROMOTION BESTOWED</div>
          <div id="rank-title"></div>
          <div id="rank-jab"></div>
        </div>
      </div>

      <div id="ending-overlay">
        <div id="ending-card">
          <div id="ending-text"></div>
          <button id="ending-button">RETURN TO THE MACHINE</button>
        </div>
      </div>

    </div>
  `;

  canvas = document.getElementById("game-canvas");
  ctx = canvas.getContext("2d");

  addGameStyles();

  resizeCanvas();

  window.addEventListener("resize", resizeCanvas);

  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("click", handleCanvasClick);

  document
    .getElementById("logbook-button")
    .addEventListener("click", openLogbook);

  document
    .getElementById("close-logbook")
    .addEventListener("click", closeLogbook);

  document
    .getElementById("ending-button")
    .addEventListener("click", returnToPresent);

  updateHUD();
}

setupGameScreen();

// ============================================================
// GAME CSS
// ============================================================

function addGameStyles() {
  if (document.getElementById("game-generated-style")) return;

  const style = document.createElement("style");
  style.id = "game-generated-style";

  style.textContent = `
    #game-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background:
        radial-gradient(circle at center, #4b4028 0%, #211d15 75%);
      color: #d8c48b;
    }

    #game-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      cursor: crosshair;
    }

    #game-wrapper::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        repeating-linear-gradient(
          to bottom,
          rgba(0,0,0,.08) 0px,
          rgba(0,0,0,.08) 1px,
          transparent 2px,
          transparent 4px
        );
      box-shadow: inset 0 0 100px rgba(0,0,0,.7);
      z-index: 10;
    }

    #game-hud {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      font-family: "Courier New", monospace;
      color: #b7d69a;
      text-shadow: 0 0 8px #86a968;
      font-size: 13px;
      letter-spacing: 2px;
      z-index: 20;
      pointer-events: none;
    }

    .hud-center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      width: 50%;
    }

    #game-banner {
      color: #e6cf91;
      font-size: 14px;
    }

    .hud-right {
      text-align: right;
    }

    #logbook-button {
      position: absolute;
      right: 24px;
      bottom: 20px;
      z-index: 30;
      background: transparent;
      border: 1px solid #a8925c;
      color: #d8c48b;
      padding: 8px 14px;
      font-family: "Courier New", monospace;
      cursor: pointer;
      letter-spacing: 1px;
    }

    #logbook-button:hover {
      background: #d8c48b;
      color: #211d15;
    }

    #game-message {
      position: absolute;
      left: 50%;
      top: 52%;
      transform: translate(-50%, -50%);
      color: #e6cf91;
      font-family: Georgia, serif;
      font-size: clamp(18px, 3vw, 32px);
      text-align: center;
      text-shadow: 0 0 12px #000;
      z-index: 25;
      pointer-events: none;
      opacity: 0;
      transition: opacity .2s;
      width: 80%;
    }

    #logbook-overlay,
    #rank-overlay,
    #ending-overlay {
      position: absolute;
      inset: 0;
      background: rgba(5,5,4,.9);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    #logbook-paper {
      position: relative;
      width: min(700px, 90vw);
      max-height: 80vh;
      overflow-y: auto;
      padding: 42px;
      background: #d8c48b;
      color: #302818;
      box-shadow: 0 0 50px #000;
      font-family: Georgia, serif;
    }

    #logbook-paper h1 {
      text-align: center;
      margin-bottom: 25px;
      letter-spacing: 4px;
    }

    #close-logbook {
      position: absolute;
      right: 15px;
      top: 10px;
      border: none;
      background: transparent;
      font-size: 30px;
      cursor: pointer;
    }

    .log-entry {
      border-top: 1px solid #75653d;
      padding: 18px 0;
      line-height: 1.6;
    }

    .log-date {
      font-size: 12px;
      opacity: .65;
      margin-bottom: 8px;
    }

    #rank-card,
    #ending-card {
      width: min(700px, 90vw);
      text-align: center;
      padding: 50px 30px;
      border: 2px solid #a8925c;
      background: #19160f;
      color: #d8c48b;
      box-shadow: 0 0 50px #000;
      font-family: Georgia, serif;
    }

    .rank-small {
      font-family: "Courier New", monospace;
      letter-spacing: 4px;
      margin-bottom: 20px;
      color: #8fad74;
    }

    #rank-title {
      font-size: clamp(25px, 5vw, 48px);
      margin-bottom: 25px;
    }

    #rank-jab {
      font-size: 18px;
      line-height: 1.6;
    }

    #ending-text {
      font-size: clamp(22px, 4vw, 38px);
      line-height: 1.5;
      margin-bottom: 35px;
    }

    #ending-button {
      background: #d8c48b;
      border: none;
      padding: 12px 22px;
      cursor: pointer;
      font-family: "Courier New", monospace;
      font-weight: bold;
    }

    @media(max-width:600px) {
      #game-hud {
        padding: 10px;
        font-size: 9px;
      }

      .hud-center {
        display: none;
      }

      #logbook-paper {
        padding: 25px;
      }
    }
  `;

  document.head.appendChild(style);
}

// ============================================================
// CANVAS
// ============================================================

function resizeCanvas() {
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;

  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ============================================================
// TRANSITION
// ============================================================

function begin1947Transition() {
  if (transitionActive) return;

  transitionActive = true;

  screenPresent.classList.remove("active");
  screen1947.classList.add("active");

  playSound("static", 0.8);

  createTransitionOverlay();

  setTimeout(() => {
    playSound("boot", 0.7);
  }, 700);

  setTimeout(() => {
    startGame();
  }, 1600);
}

function createTransitionOverlay() {
  const overlay = document.createElement("div");

  overlay.id = "transition-overlay";

  overlay.innerHTML = `
    <div id="transition-noise"></div>
    <div id="transition-line"></div>
    <div id="boot-text">
      SEPTEMBER 9, 1947<br>
      HARVARD MARK II<br>
      <br>
      THE ANCIENT MACHINE STIRS...
    </div>
  `;

  document.body.appendChild(overlay);

  const style = document.createElement("style");

  style.textContent = `
    #transition-overlay {
      position: fixed;
      inset: 0;
      background: #000;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      animation: transitionFlash 1.6s forwards;
    }

    #transition-noise {
      position: absolute;
      inset: 0;
      opacity: .9;
      background:
        repeating-radial-gradient(
          circle at center,
          #fff 0px,
          #222 1px,
          #000 2px,
          #888 3px
        );
      animation: noise .08s infinite;
    }

    #transition-line {
      position: absolute;
      width: 100%;
      height: 3px;
      background: #c8ff9b;
      box-shadow: 0 0 20px #9fdf76;
      animation: crt 1.1s .35s forwards;
    }

    #boot-text {
      position: relative;
      z-index: 2;
      color: #b7d69a;
      font-family: "Courier New", monospace;
      text-align: center;
      line-height: 1.8;
      letter-spacing: 2px;
      opacity: 0;
      animation: bootText .7s .7s forwards;
      text-shadow: 0 0 10px #8aad6b;
    }

    @keyframes noise {
      0% { transform: translate(0); }
      25% { transform: translate(4px,-3px); }
      50% { transform: translate(-3px,3px); }
      75% { transform: translate(3px,2px); }
      100% { transform: translate(-2px,-2px); }
    }

    @keyframes crt {
      0% {
        height: 3px;
        transform: scaleY(1);
      }

      100% {
        height: 100%;
        transform: scaleY(1);
        opacity: 0;
      }
    }

    @keyframes bootText {
      to { opacity: 1; }
    }

    @keyframes transitionFlash {
      0% { filter: brightness(4); }
      10% { filter: brightness(1); }
      100% { opacity: 1; }
    }
  `;

  document.head.appendChild(style);

  setTimeout(() => {
    overlay.remove();
    style.remove();
  }, 1700);
}

// ============================================================
// START GAME
// ============================================================

function startGame() {
  transitionActive = false;
  gameRunning = true;
  gameEnded = false;

  moths = [];
  spawnTimer = 0;

  bannerText = randomMockery(currentError);
  bannerTimer = 2500;

  messageText = "";
  messageTimer = 0;

  updateHUD();

  playSound("spawn", 0.5);

  requestAnimationFrame(gameLoop);
}

// ============================================================
// INPUT
// ============================================================

function handleMouseMove(event) {
  mouseX = event.clientX;
  mouseY = event.clientY;
}

function handleCanvasClick(event) {
  if (!gameRunning || gameEnded) return;

  mouseX = event.clientX;
  mouseY = event.clientY;

  swingTimer = 160;

  playSound("swing", 0.6);

  let hitSomething = false;

  for (let i = moths.length - 1; i >= 0; i--) {
    const moth = moths[i];

    const distance = Math.hypot(
      mouseX - moth.x,
      mouseY - moth.y
    );

    if (distance < moth.radius + 45) {
      moths.splice(i, 1);

      totalSwats++;

      localStorage.setItem(
        "hopperSwats",
        totalSwats
      );

      playSound("hit", 0.8);

      screenShake = 90;

      hitSomething = true;

      checkRank();

      break;
    }
  }

  if (hitSomething) {
    updateHUD();
  }

  if (
    errorCount >= 1 &&
    totalSwats > 0 &&
    totalSwats % 5 === 0
  ) {
    // occasional encouragement
    messageText = "A most righteous swatting!";
    messageTimer = 900;
  }
}

// ============================================================
// MOTH SPAWNING
// ============================================================

function spawnMoth() {
  const creature = getCreature(currentError);

  const margin = 70;

  let x;
  let y;

  const side = Math.floor(Math.random() * 4);

  if (side === 0) {
    x = margin;
    y = Math.random() * innerHeight;
  } else if (side === 1) {
    x = innerWidth - margin;
    y = Math.random() * innerHeight;
  } else if (side === 2) {
    x = Math.random() * innerWidth;
    y = margin + 50;
  } else {
    x = Math.random() * innerWidth;
    y = innerHeight - margin;
  }

  const moth = {
    x,
    y,

    vx: (Math.random() - .5) * 2,
    vy: (Math.random() - .5) * 2,

    radius: 18 + Math.random() * 8,

    age: 0,

    phase: Math.random() * Math.PI * 2,

    type: currentError,

    color: "#d8c48b",

    creature: creature
  };

  moths.push(moth);

  playSound("spawn", 0.25);

  bannerText = randomMockery(currentError);
  bannerTimer = 1800;
}

// ============================================================
// UPDATE MOTH
// ============================================================

function updateMoth(moth, dt) {
  moth.age += dt;

  const t = moth.age / 1000;

  switch (moth.type) {

    case "SyntaxError":
      // Slow straight-line
      moth.x += moth.vx * dt * .05;
      moth.y += moth.vy * dt * .05;
      break;

    case "TypeError":
      // Erratic zig-zag
      moth.x += moth.vx * dt * .12;
      moth.y +=
        Math.sin(t * 8 + moth.phase) *
        dt *
        .15;
      break;

    case "NameError":
      // Blink/teleport
      moth.x += moth.vx * dt * .06;
      moth.y += moth.vy * dt * .06;

      if (Math.random() < .003) {
        moth.x = Math.random() * innerWidth;
        moth.y = 80 + Math.random() * (innerHeight - 150);
      }

      break;

    case "IndexError":
    case "KeyError":
      // Grows larger
      moth.x += moth.vx * dt * .08;
      moth.y += moth.vy * dt * .08;

      moth.radius += dt * .002;

      if (moth.radius > 50) {
        moth.radius = 50;
      }

      break;

    case "ZeroDivisionError":
      // Circular orbit
      moth.x += Math.cos(t * 3 + moth.phase) * dt * .12;
      moth.y += Math.sin(t * 3 + moth.phase) * dt * .12;
      break;

    case "AttributeError":
      // Ghostly drifting
      moth.x += Math.sin(t * 4) * dt * .12;
      moth.y += Math.cos(t * 3) * dt * .1;
      break;

    case "TimeoutError":
      // Slowly accelerates
      moth.vx *= 1.001;
      moth.vy *= 1.001;

      moth.x += moth.vx * dt * .1;
      moth.y += moth.vy * dt * .1;
      break;

    default:
      moth.x += moth.vx * dt * .08;
      moth.y += moth.vy * dt * .08;
  }

  // Bounce from screen
  if (moth.x < 30 || moth.x > innerWidth - 30) {
    moth.vx *= -1;
  }

  if (moth.y < 80 || moth.y > innerHeight - 30) {
    moth.vy *= -1;
  }
}

// ============================================================
// DRAW BACKGROUND
// ============================================================

function drawBackground() {
  const gradient = ctx.createRadialGradient(
    innerWidth / 2,
    innerHeight / 2,
    50,
    innerWidth / 2,
    innerHeight / 2,
    innerWidth
  );

  gradient.addColorStop(0, "#51472d");
  gradient.addColorStop(.6, "#302a1d");
  gradient.addColorStop(1, "#11100c");

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    innerWidth,
    innerHeight
  );

  // Machine table
  ctx.fillStyle = "#17150f";

  ctx.fillRect(
    0,
    innerHeight * .78,
    innerWidth,
    innerHeight * .22
  );

  // Mark II machine
  drawMachine();
}

// ============================================================
// DRAW MACHINE
// ============================================================

function drawMachine() {
  const x = innerWidth / 2;
  const y = innerHeight * .70;

  ctx.save();

  ctx.fillStyle = "#262318";

  ctx.fillRect(
    x - 180,
    y - 120,
    360,
    110
  );

  ctx.strokeStyle = "#766b4a";
  ctx.lineWidth = 2;

  ctx.strokeRect(
    x - 180,
    y - 120,
    360,
    110
  );

  // tubes
  for (let i = 0; i < 9; i++) {
    const tx = x - 145 + i * 36;

    ctx.fillStyle = i % 2
      ? "#718d55"
      : "#9b7544";

    ctx.fillRect(
      tx,
      y - 100,
      12,
      45
    );

    ctx.beginPath();
    ctx.arc(
      tx + 6,
      y - 100,
      6,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.fillStyle = "#d8c48b";
  ctx.font = "12px Courier New";
  ctx.textAlign = "center";

  ctx.fillText(
    "HARVARD MARK II",
    x,
    y - 130
  );

  ctx.restore();
}

// ============================================================
// DRAW GRACE HOPPER
// ============================================================

function drawGrace() {
  const x = innerWidth / 2;
  const y = innerHeight * .86;

  ctx.save();

  // Ground shadow
  ctx.fillStyle = "rgba(0,0,0,.5)";

  ctx.beginPath();

  ctx.ellipse(
    x,
    y + 10,
    85,
    15,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Body / jacket
  ctx.fillStyle = "#354332";

  ctx.beginPath();

  ctx.moveTo(x - 45, y - 95);
  ctx.lineTo(x + 45, y - 95);
  ctx.lineTo(x + 60, y);
  ctx.lineTo(x - 60, y);
  ctx.closePath();

  ctx.fill();

  // White blouse
  ctx.fillStyle = "#d9d0b5";

  ctx.beginPath();

  ctx.moveTo(x - 15, y - 90);
  ctx.lineTo(x + 15, y - 90);
  ctx.lineTo(x + 25, y - 35);
  ctx.lineTo(x - 25, y - 35);
  ctx.closePath();

  ctx.fill();

  // Neck
  ctx.fillStyle = "#c49573";

  ctx.fillRect(
    x - 10,
    y - 112,
    20,
    22
  );

  // Head
  ctx.beginPath();

  ctx.arc(
    x,
    y - 130,
    29,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Hair
  ctx.fillStyle = "#30271e";

  ctx.beginPath();

  ctx.arc(
    x,
    y - 140,
    31,
    Math.PI,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillRect(
    x - 30,
    y - 140,
    10,
    25
  );

  ctx.fillRect(
    x + 20,
    y - 140,
    10,
    25
  );

  // Glasses
  ctx.strokeStyle = "#1d1b18";
  ctx.lineWidth = 2;

  ctx.strokeRect(
    x - 23,
    y - 137,
    19,
    12
  );

  ctx.strokeRect(
    x + 4,
    y - 137,
    19,
    12
  );

  ctx.beginPath();

  ctx.moveTo(x - 4, y - 131);
  ctx.lineTo(x + 4, y - 131);

  ctx.stroke();

  // Legs
  ctx.fillStyle = "#292822";

  ctx.fillRect(
    x - 32,
    y,
    25,
    35
  );

  ctx.fillRect(
    x + 7,
    y,
    25,
    35
  );

  // Shoes
  ctx.fillStyle = "#151412";

  ctx.fillRect(
    x - 38,
    y + 30,
    34,
    10
  );

  ctx.fillRect(
    x + 5,
    y + 30,
    34,
    10
  );

  // Arm + flyswatter
  drawSwatter(x, y);

  // Name plate
  ctx.fillStyle = "#d8c48b";
  ctx.font = "bold 13px Courier New";
  ctx.textAlign = "center";

  ctx.fillText(
    "GRACE HOPPER",
    x,
    y + 60
  );

  ctx.restore();
}

// ============================================================
// SWATTER
// ============================================================

function drawSwatter(x, y) {
  const swinging = swingTimer > 0;

  const angle = swinging
    ? -0.8
    : -0.25;

  ctx.save();

  ctx.translate(
    x + 30,
    y - 65
  );

  ctx.rotate(angle);

  // Arm
  ctx.strokeStyle = "#c49573";
  ctx.lineWidth = 13;
  ctx.lineCap = "round";

  ctx.beginPath();

  ctx.moveTo(0, 0);
  ctx.lineTo(45, -20);

  ctx.stroke();

  // Handle
  ctx.strokeStyle = "#8b6a42";
  ctx.lineWidth = 7;

  ctx.beginPath();

  ctx.moveTo(35, -20);
  ctx.lineTo(105, -65);

  ctx.stroke();

  // Swatter head
  ctx.strokeStyle = "#c8b47c";
  ctx.lineWidth = 4;

  ctx.strokeRect(
    90,
    -85,
    42,
    30
  );

  // holes
  ctx.strokeStyle = "#766747";
  ctx.lineWidth = 1;

  for (let a = 0; a < 4; a++) {
    for (let b = 0; b < 3; b++) {
      ctx.beginPath();

      ctx.arc(
        100 + a * 9,
        -78 + b * 8,
        2,
        0,
        Math.PI * 2
      );

      ctx.stroke();
    }
  }

  ctx.restore();
}

// ============================================================
// DRAW MOTH
// ============================================================

function drawMoth(moth) {
  ctx.save();

  ctx.translate(moth.x, moth.y);

  const flap =
    Math.sin(moth.age * .02) * .4;

  ctx.rotate(
    Math.atan2(moth.vy, moth.vx)
  );

  // glow
  ctx.shadowColor = "#d8c48b";
  ctx.shadowBlur = 12;

  // left wing
  ctx.fillStyle = "#9f8a55";

  ctx.beginPath();

  ctx.ellipse(
    -moth.radius * .55,
    0,
    moth.radius,
    moth.radius * (.6 + flap),
    -.4,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // right wing
  ctx.beginPath();

  ctx.ellipse(
    moth.radius * .55,
    0,
    moth.radius,
    moth.radius * (.6 - flap),
    .4,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // body
  ctx.fillStyle = "#252015";

  ctx.beginPath();

  ctx.ellipse(
    0,
    0,
    moth.radius * .25,
    moth.radius * .8,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // antenna
  ctx.strokeStyle = "#d8c48b";
  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(-3, -moth.radius * .5);
  ctx.quadraticCurveTo(
    -12,
    -moth.radius,
    -18,
    -moth.radius * 1.2
  );

  ctx.moveTo(3, -moth.radius * .5);
  ctx.quadraticCurveTo(
    12,
    -moth.radius,
    18,
    -moth.radius * 1.2
  );

  ctx.stroke();

  ctx.restore();
}

// ============================================================
// GAME LOOP
// ============================================================

function gameLoop(timestamp) {
  if (!gameRunning) return;

  const dt = Math.min(
    timestamp - lastTime || 16,
    40
  );

  lastTime = timestamp;

  if (!gameEnded) {
    updateGame(dt);
    drawGame();
  }

  requestAnimationFrame(gameLoop);
}

function updateGame(dt) {
  // Swing timer
  if (swingTimer > 0) {
    swingTimer -= dt;
  }

  // Screen shake
  if (screenShake > 0) {
    screenShake -= dt;
  }

  // Banner
  if (bannerTimer > 0) {
    bannerTimer -= dt;
  }

  // Message
  if (messageTimer > 0) {
    messageTimer -= dt;
  }

  // Spawn
  spawnTimer -= dt;

  if (spawnTimer <= 0) {
    spawnMoth();

    // More errors = faster spawning
    const difficulty =
      Math.min(errorCount * 70, 500);

    spawnTimer =
      Math.max(500, 1500 - difficulty);
  }

  for (const moth of moths) {
    updateMoth(moth, dt);
  }

  // Win condition
  if (
    moths.length === 0 &&
    totalSwats > 0 &&
    totalSwats % 10 === 0
  ) {
    // Don't automatically trigger repeatedly.
    if (!gameEnded && Math.random() < .002) {
      endGame(true);
    }
  }

  updateHUD();
}

// ============================================================
// DRAW GAME
// ============================================================

function drawGame() {
  ctx.save();

  if (screenShake > 0) {
    const amount = 5;

    ctx.translate(
      (Math.random() - .5) * amount,
      (Math.random() - .5) * amount
    );
  }

  drawBackground();

  for (const moth of moths) {
    drawMoth(moth);
  }

  drawGrace();

  ctx.restore();

  if (bannerTimer > 0) {
    const banner =
      document.getElementById("game-banner");

    if (banner) {
      banner.textContent = bannerText;
    }
  }

  const message =
    document.getElementById("game-message");

  if (message) {
    message.textContent = messageText;

    message.style.opacity =
      messageTimer > 0 ? "1" : "0";
  }
}

// ============================================================
// HUD
// ============================================================

function updateHUD() {
  const swatCount =
    document.getElementById("swat-count");

  const bugCount =
    document.getElementById("bug-count");

  const rankDisplay =
    document.getElementById("rank-display");

  if (swatCount) {
    swatCount.textContent = totalSwats;
  }

  if (bugCount) {
    bugCount.textContent = moths.length;
  }

  if (rankDisplay) {
    rankDisplay.textContent =
      getRank().name.toUpperCase();
  }
}

// ============================================================
// RANK CHECK
// ============================================================

function checkRank() {
  const newRankIndex =
    ranks.findIndex(
      rank => rank.name === getRank().name
    );

  if (newRankIndex > rankIndex) {
    rankIndex = newRankIndex;

    localStorage.setItem(
      "hopperRank",
      rankIndex
    );

    showRankUp(ranks[rankIndex]);
  }
}

function showRankUp(rank) {
  playSound("fanfare", 0.8);

  const overlay =
    document.getElementById("rank-overlay");

  const title =
    document.getElementById("rank-title");

  const jab =
    document.getElementById("rank-jab");

  if (!overlay) return;

  title.textContent = rank.name;

  jab.textContent =
    "Thou hast achieved distinction. " +
    "Whether thou hast achieved understanding remaineth doubtful.";

  overlay.style.display = "flex";

  setTimeout(() => {
    overlay.style.display = "none";
  }, 3000);
}

// ============================================================
// LOGBOOK UI
// ============================================================

function openLogbook() {
  const overlay =
    document.getElementById("logbook-overlay");

  const content =
    document.getElementById("logbook-content");

  if (!overlay || !content) return;

  const entries = getLogbook();

  if (entries.length === 0) {
    content.innerHTML = `
      <p>
        The logbook remaineth empty.
        Commit more bugs to posterity.
      </p>
    `;
  } else {
    content.innerHTML = entries
      .slice()
      .reverse()
      .map(entry => `
        <div class="log-entry">
          <div class="log-date">
            ${escapeHTML(entry.date)}
          </div>

          <div>
            ${escapeHTML(entry.text)}
          </div>
        </div>
      `)
      .join("");
  }

  overlay.style.display = "flex";
}

function closeLogbook() {
  const overlay =
    document.getElementById("logbook-overlay");

  if (overlay) {
    overlay.style.display = "none";
  }
}

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ============================================================
// WIN / LOSS
// ============================================================

function endGame(won) {
  if (gameEnded) return;

  gameEnded = true;
  gameRunning = false;

  if (won) {
    playSound("win", 0.9);

    saveLogEntry(currentError);

    showEnding(
      `Hark! On this eve did the ${getCreature(currentError).adjective} ${getCreature(currentError).noun} beset the relay, and was struck down in glorious combat. Let it be known the programmer's folly remaineth entirely his own to discover.`,
      "win"
    );

  } else {
    playSound("loss", 0.9);

    showEnding(
      "LET THE LOGBOOK SHOW:<br><br>THOU HAST BEEN BESTED BY A MOTH",
      "loss"
    );
  }
}

function showEnding(text, type) {
  const overlay =
    document.getElementById("ending-overlay");

  const endingText =
    document.getElementById("ending-text");

  if (!overlay) return;

  endingText.innerHTML = text;

  overlay.style.display = "flex";

  const button =
    document.getElementById("ending-button");

  button.textContent =
    type === "win"
      ? "RETURN TO THE MACHINE"
      : "ACCEPT THY DEFEAT";
}

// ============================================================
// RETURN TO PRESENT
// ============================================================

function returnToPresent() {
  gameRunning = false;
  gameEnded = false;
  transitionActive = false;

  moths = [];

  const overlay =
    document.getElementById("ending-overlay");

  if (overlay) {
    overlay.style.display = "none";
  }

  screen1947.classList.remove("active");
  screenPresent.classList.add("active");

  updateHUD();
}

// ============================================================
// KEYBOARD SHORTCUT
// ============================================================

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeLogbook();
  }
});

// ============================================================
// DEBUG HELPERS
// ============================================================

// These are useful during your demo testing.
// Open browser console and type:
// forceWin()
// forceLoss()

window.forceWin = function () {
  if (!gameRunning) return;

  moths = [];
  totalSwats += 1;

  endGame(true);
};

window.forceLoss = function () {
  if (!gameRunning) return;

  endGame(false);
};

console.log(
  "%cGRACE HOPPER'S BUG HUNT",
  "color:#b7d69a;font-size:20px;font-weight:bold;"
);

console.log(
  "The ancient machine awaiteth thy mistakes."
);