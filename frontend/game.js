/* =========================================================
   THE GRACE HOPPER BUG HUNT
   Frontend Game Engine
   ========================================================= */


/* =========================================================
   CONFIG
   ========================================================= */

const BACKEND_URL = "http://localhost:5000/run";

const GAME_CONFIG = {
  startingLives: 3,
  swatsToWin: 10,
  baseSpawnDelay: 1400,
  minimumSpawnDelay: 450,
  mothBaseSpeed: 1.5,
  maxMoths: 5
};


/* =========================================================
   AUDIO
   ========================================================= */

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

  if (!sound) {
    return;
  }

  try {
    sound.pause();
    sound.currentTime = 0;
    sound.volume = Math.max(0, Math.min(1, volume));

    const promise = sound.play();

    if (promise && typeof promise.catch === "function") {
      promise.catch(() => {});
    }
  } catch (error) {
    console.warn("Audio unavailable:", name);
  }
}


function stopSound(name) {
  const sound = audio[name];

  if (!sound) {
    return;
  }

  try {
    sound.pause();
    sound.currentTime = 0;
  } catch (error) {
    console.warn("Could not stop audio:", name);
  }
}


/* =========================================================
   DOM REFERENCES
   ========================================================= */

const screenPresent = document.getElementById("screen-present");
const screen1947 = document.getElementById("screen-1947");

const runBtn = document.getElementById("run-btn");
const codeInput = document.getElementById("code-input");

const crtTransition = document.getElementById("crt-transition");
const staticLayer = document.getElementById("static-layer");
const crtLine = document.getElementById("crt-line");
const bootScreen = document.getElementById("boot-screen");
const bootText = document.getElementById("boot-text");

const gameCanvas = document.getElementById("game-canvas");
const gameStage = document.querySelector(".game-stage");

const spawnBanner = document.getElementById("spawn-banner");

const gameMessage = document.getElementById("game-message");
const gameMessageTitle = document.getElementById("game-message-title");
const gameMessageText = document.getElementById("game-message-text");

const errorCategory = document.getElementById("error-category");

const rankName = document.getElementById("rank-name");
const swatCountDisplay = document.getElementById("swat-count");


/* =========================================================
   CANVAS
   ========================================================= */

const ctx = gameCanvas ? gameCanvas.getContext("2d") : null;

let canvasWidth = 0;
let canvasHeight = 0;

function resizeCanvas() {
  if (!gameCanvas || !gameStage) {
    return;
  }

  const rect = gameStage.getBoundingClientRect();

  const dpr = window.devicePixelRatio || 1;

  canvasWidth = rect.width;
  canvasHeight = rect.height;

  gameCanvas.width = Math.floor(rect.width * dpr);
  gameCanvas.height = Math.floor(rect.height * dpr);

  gameCanvas.style.width = `${rect.width}px`;
  gameCanvas.style.height = `${rect.height}px`;

  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

window.addEventListener("resize", resizeCanvas);


/* =========================================================
   GAME STATE
   ========================================================= */

let gameRunning = false;
let gamePaused = false;

let animationFrame = null;
let spawnTimer = null;

let currentErrorType = "UnknownError";

let lives = GAME_CONFIG.startingLives;
let currentSwats = 0;
let totalSwats = loadTotalSwats();

let moths = [];

let gameStartTime = 0;

let transitionRunning = false;


/* =========================================================
   RANK SYSTEM
   ========================================================= */

const RANKS = [
  {
    threshold: 0,
    name: "GROUNDLING"
  },
  {
    threshold: 10,
    name: "APPRENTICE RELAY-SWEEPER"
  },
  {
    threshold: 25,
    name: "ENSIGN OF THE VACUUM TUBE"
  },
  {
    threshold: 50,
    name: "KNIGHT OF THE FLICKERING FILAMENT"
  },
  {
    threshold: 100,
    name: "REAR ADMIRAL, ORDER OF THE SWATTED WING"
  }
];


function getRankForSwats(count) {
  let currentRank = RANKS[0];

  for (const rank of RANKS) {
    if (count >= rank.threshold) {
      currentRank = rank;
    }
  }

  return currentRank;
}


function getRankIndex(count) {
  let index = 0;

  for (let i = 0; i < RANKS.length; i++) {
    if (count >= RANKS[i].threshold) {
      index = i;
    }
  }

  return index;
}


function updateRankDisplay() {
  const rank = getRankForSwats(totalSwats);

  if (rankName) {
    rankName.textContent = rank.name;
  }
}


function checkRankUp(previousTotal) {
  const oldIndex = getRankIndex(previousTotal);
  const newIndex = getRankIndex(totalSwats);

  if (newIndex > oldIndex) {
    showRankUp(RANKS[newIndex]);
  }
}


function showRankUp(rank) {
  playSound("fanfare", 0.8);

  gameMessageTitle.textContent = "A PROMOTION!";
  gameMessageText.textContent =
    `${rank.name}\n\n` +
    "By decree of the most solemn relay chamber, " +
    "thy swatting prowess hath been acknowledged.";

  gameMessage.classList.add("visible");

  setTimeout(() => {
    if (gameRunning) {
      gameMessage.classList.remove("visible");
    }
  }, 3000);
}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function loadTotalSwats() {
  try {
    return Number(localStorage.getItem("gh-total-swats")) || 0;
  } catch (error) {
    return 0;
  }
}


function saveTotalSwats() {
  try {
    localStorage.setItem("gh-total-swats", String(totalSwats));
  } catch (error) {
    console.warn("Could not save swat count.");
  }
}


function loadLogbook() {
  try {
    const data = localStorage.getItem("gh-logbook");

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}


function saveLogbook(entries) {
  try {
    localStorage.setItem("gh-logbook", JSON.stringify(entries));
  } catch (error) {
    console.warn("Could not save logbook.");
  }
}


function addLogbookEntry(errorType) {
  const entries = loadLogbook();

  const entry = generateMockery(errorType);

  entries.push({
    errorType,
    text: entry,
    timestamp: new Date().toISOString()
  });

  saveLogbook(entries);
}


/* =========================================================
   MOCKERY GENERATOR
   ========================================================= */

const MOCKERY = {
  SyntaxError: {
    adjective: "Sluggish",
    noun: "Syntax-Moth",
    context: "the punctuation chamber"
  },

  TypeError: {
    adjective: "Fickle",
    noun: "Type-Wraith",
    context: "the relay"
  },

  NameError: {
    adjective: "Vanishing",
    noun: "Reference-Sprite",
    context: "the naming bureau"
  },

  IndexError: {
    adjective: "Overreaching",
    noun: "Range-Fiend",
    context: "the indexed vault"
  },

  KeyError: {
    adjective: "Overreaching",
    noun: "Range-Fiend",
    context: "the key cabinet"
  },

  ZeroDivisionError: {
    adjective: "Impossible",
    noun: "Division-Imp",
    context: "the arithmetic relay"
  },

  AttributeError: {
    adjective: "Nameless",
    noun: "Attribute-Ghoul",
    context: "the object registry"
  }
};


const DEFAULT_MOCKERY = {
  adjective: "Unwholesome",
  noun: "Computational Moth",
  context: "the machine"
};


function getMockeryData(errorType) {
  return MOCKERY[errorType] || DEFAULT_MOCKERY;
}


function generateMockery(errorType) {
  const data = getMockeryData(errorType);

  const templates = [
    `Hark! On this eve did the ${data.adjective} ${data.noun} beset ${data.context}, and was struck down in glorious combat. Let it be known the programmer's folly remaineth entirely his own to discover.`,

    `Upon the solemn machinery of the Harvard chamber descended the ${data.adjective} ${data.noun}. The creature hath been vanquished. The reason for its arrival shall remain a mystery, as decreed by the ancient machine.`,

    `Let the logbook record that a ${data.adjective} ${data.noun} hath troubled ${data.context}. By means most dramatic it was defeated, whilst the underlying matter remaineth magnificently unexplained.`,

    `Behold! The ${data.adjective} ${data.noun} hath been dispatched from the realm of computation. No useful wisdom shall proceed from this victory. Such is the will of the machine.`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}


/* =========================================================
   ERROR → MOTH MAPPING
   ========================================================= */

const MOTH_TYPES = {
  SyntaxError: {
    name: "Sluggish Syntax-Moth",
    speed: 0.65,
    size: 20,
    behavior: "straight"
  },

  TypeError: {
    name: "Fickle Type-Wraith",
    speed: 1.7,
    size: 18,
    behavior: "zigzag"
  },

  NameError: {
    name: "Vanishing Reference-Sprite",
    speed: 1.35,
    size: 17,
    behavior: "teleport"
  },

  IndexError: {
    name: "Overreaching Range-Fiend",
    speed: 1.0,
    size: 13,
    behavior: "grow"
  },

  KeyError: {
    name: "Overreaching Range-Fiend",
    speed: 1.0,
    size: 13,
    behavior: "grow"
  },

  ZeroDivisionError: {
    name: "Impossible Division-Imp",
    speed: 2.1,
    size: 15,
    behavior: "circle"
  },

  AttributeError: {
    name: "Nameless Attribute-Ghoul",
    speed: 1.15,
    size: 22,
    behavior: "dash"
  }
};


function getMothType(errorType) {
  return MOTH_TYPES[errorType] || {
    name: "Unclassified Error-Moth",
    speed: 1.2,
    size: 18,
    behavior: "straight"
  };
}


/* =========================================================
   BOOT MESSAGE
   ========================================================= */

const bootMessage =
`SEPTEMBER 9, 1947

HARVARD MARK II

COMPUTING RELAY SYSTEM
INITIALIZING...

VACUUM TUBES ............. READY
ELECTROMECHANICAL RELAYS . READY
LOGBOOK .................. READY

ERROR DETECTED.

MOTH PROTOCOL ENGAGED.

`;


/* =========================================================
   UTILITY
   ========================================================= */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function random(min, max) {
  return Math.random() * (max - min) + min;
}


function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


/* =========================================================
   TYPEWRITER
   ========================================================= */

async function typeText(element, text, speed = 18) {
  if (!element) {
    return;
  }

  element.textContent = "";

  playSound("typewriter", 0.35);

  for (const character of text) {
    element.textContent += character;

    await sleep(speed);
  }

  stopSound("typewriter");
}


/* =========================================================
   CRT TRANSITION
   ========================================================= */

async function startCRTTransition(errorType) {
  if (transitionRunning) {
    return;
  }

  transitionRunning = true;

  currentErrorType = errorType || "UnknownError";

  crtTransition.classList.add("active");

  staticLayer.style.opacity = "0";
  crtLine.style.opacity = "0";
  bootScreen.style.opacity = "0";

  /* STATIC BURST */

  playSound("static", 0.8);

  staticLayer.style.opacity = "0.9";

  await sleep(350);

  staticLayer.style.opacity = "0";

  await sleep(200);

  /* CRT POWER LINE */

  crtLine.style.opacity = "1";

  crtLine.animate(
    [
      {
        transform: "scaleX(0)",
        opacity: 1
      },
      {
        transform: "scaleX(1)",
        opacity: 1
      }
    ],
    {
      duration: 300,
      easing: "ease-out",
      fill: "forwards"
    }
  );

  playSound("boot", 0.65);

  await sleep(350);

  /* BOOT SCREEN */

  crtLine.style.opacity = "0";

  bootScreen.style.opacity = "1";

  await sleep(200);

  await typeText(bootText, bootMessage, 15);

  await sleep(700);

  /* ENTER 1947 */

  if (screenPresent) {
    screenPresent.classList.remove("active");
  }

  if (screen1947) {
    screen1947.classList.add("active");
  }

  crtTransition.classList.remove("active");

  bootScreen.style.opacity = "0";
  bootText.textContent = "";

  errorCategory.textContent =
    `ERROR CATEGORY: ${currentErrorType}`;

  transitionRunning = false;

  resizeCanvas();

  startGame(currentErrorType);
}


/* =========================================================
   RUN CODE
   ========================================================= */

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

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    const data = await response.json();

    console.log("Backend response:", data);

    if (data.hasError) {
      handleError(data.errorType);
    } else {
      handleSuccess();
    }

  } catch (error) {

    console.error("Backend unreachable:", error);

    alert(
      "Couldn't reach the backend.\n\n" +
      "Make sure your friend's Flask server is running."
    );

  } finally {

    runBtn.disabled = false;
    runBtn.textContent = "Run";

  }
}


/* =========================================================
   ERROR / SUCCESS
   ========================================================= */

function handleError(errorType) {
  console.log("Error detected:", errorType);

  stopGame();

  startCRTTransition(errorType);
}


function handleSuccess() {
  console.log("Code ran clean.");

  /*
   * Deliberately no useful debugging information.
   * Clean code simply remains on the present-day screen.
   */

  runBtn.textContent = "Success";

  setTimeout(() => {
    runBtn.textContent = "Run";
  }, 900);
}


/* =========================================================
   START GAME
   ========================================================= */

function startGame(errorType) {
  currentErrorType = errorType || "UnknownError";

  lives = GAME_CONFIG.startingLives;
  currentSwats = 0;

  moths = [];

  gameRunning = true;
  gamePaused = false;

  gameStartTime = performance.now();

  gameMessage.classList.remove("visible");

  updateSwatDisplay();
  updateRankDisplay();

  resizeCanvas();

  showSpawnBanner();

  spawnMoth();

  scheduleNextSpawn();

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  animationFrame = requestAnimationFrame(gameLoop);
}


/* =========================================================
   STOP GAME
   ========================================================= */

function stopGame() {
  gameRunning = false;
  gamePaused = false;

  moths = [];

  if (spawnTimer) {
    clearTimeout(spawnTimer);
    spawnTimer = null;
  }

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}


/* =========================================================
   SPAWN SYSTEM
   ========================================================= */

function getDifficulty() {
  return 1 + Math.floor(totalSwats / 10) * 0.15;
}


function getSpawnDelay() {
  const difficulty = getDifficulty();

  return Math.max(
    GAME_CONFIG.minimumSpawnDelay,
    GAME_CONFIG.baseSpawnDelay / difficulty
  );
}


function scheduleNextSpawn() {
  if (!gameRunning) {
    return;
  }

  if (spawnTimer) {
    clearTimeout(spawnTimer);
  }

  spawnTimer = setTimeout(() => {

    if (gameRunning && !gamePaused) {
      if (moths.length < GAME_CONFIG.maxMoths) {
        spawnMoth();
      }
    }

    scheduleNextSpawn();

  }, getSpawnDelay());
}


/* =========================================================
   CREATE MOTH
   ========================================================= */

function spawnMoth() {
  if (!gameRunning || !ctx) {
    return;
  }

  const type = getMothType(currentErrorType);

  const side = Math.floor(random(0, 4));

  let x;
  let y;

  if (side === 0) {
    x = -30;
    y = random(50, canvasHeight - 50);
  } else if (side === 1) {
    x = canvasWidth + 30;
    y = random(50, canvasHeight - 50);
  } else if (side === 2) {
    x = random(50, canvasWidth - 50);
    y = -30;
  } else {
    x = random(50, canvasWidth - 50);
    y = canvasHeight + 30;
  }

  const targetX = canvasWidth / 2;
  const targetY = canvasHeight / 2;

  const angle = Math.atan2(targetY - y, targetX - x);

  const moth = {
    id: Date.now() + Math.random(),

    x,
    y,

    vx: Math.cos(angle) * type.speed * getDifficulty(),
    vy: Math.sin(angle) * type.speed * getDifficulty(),

    baseSpeed: type.speed,

    size: type.size,

    baseSize: type.size,

    behavior: type.behavior,

    age: 0,

    angle: random(0, Math.PI * 2),

    phase: random(0, Math.PI * 2),

    rotation: random(0, Math.PI * 2),

    blinkTimer: random(1000, 2500),

    visible: true,

    alive: true
  };

  moths.push(moth);

  playSound("spawn", 0.55);

  showSpawnBanner(type.name);
}


/* =========================================================
   SPAWN BANNER
   ========================================================= */

function showSpawnBanner(name) {
  if (!spawnBanner) {
    return;
  }

  const mothName = name || getMothType(currentErrorType).name;

  spawnBanner.textContent =
    `BEWARE! THE ${mothName.toUpperCase()} DOTH DESCEND!`;

  spawnBanner.classList.remove("show");

  /*
   * Force animation restart.
   */
  void spawnBanner.offsetWidth;

  spawnBanner.classList.add("show");
}


/* =========================================================
   GAME LOOP
   ========================================================= */

let previousFrameTime = performance.now();

function gameLoop(timestamp) {
  if (!gameRunning) {
    return;
  }

  const delta = Math.min(
    32,
    timestamp - previousFrameTime
  );

  previousFrameTime = timestamp;

  if (!gamePaused) {
    updateMoths(delta);
    drawGame();
  }

  animationFrame = requestAnimationFrame(gameLoop);
}


/* =========================================================
   UPDATE MOTHS
   ========================================================= */

function updateMoths(delta) {
  const multiplier = delta / 16.67;

  for (const moth of moths) {

    if (!moth.alive) {
      continue;
    }

    moth.age += delta;
    moth.angle += 0.03 * multiplier;

    /* -----------------------------------------
       SLUGGISH SYNTAX-MOTH
    ----------------------------------------- */

    if (moth.behavior === "straight") {

      moth.x += moth.vx * multiplier;
      moth.y += moth.vy * multiplier;
    }


    /* -----------------------------------------
       FICKLE TYPE-WRAITH
    ----------------------------------------- */

    else if (moth.behavior === "zigzag") {

      const wobble =
        Math.sin(moth.age * 0.012 + moth.phase) * 2.8;

      const perpendicularX = -moth.vy;
      const perpendicularY = moth.vx;

      moth.x +=
        (moth.vx + perpendicularX * 0.025 * wobble) *
        multiplier;

      moth.y +=
        (moth.vy + perpendicularY * 0.025 * wobble) *
        multiplier;
    }


    /* -----------------------------------------
       VANISHING REFERENCE-SPRITE
    ----------------------------------------- */

    else if (moth.behavior === "teleport") {

      moth.x += moth.vx * multiplier;
      moth.y += moth.vy * multiplier;

      moth.blinkTimer -= delta;

      if (moth.blinkTimer <= 0) {

        moth.blinkTimer = random(900, 2200);

        moth.visible = false;

        setTimeout(() => {

          if (!moth.alive) {
            return;
          }

          moth.x = random(50, canvasWidth - 50);
          moth.y = random(50, canvasHeight - 50);

          moth.visible = true;

        }, 150);
      }
    }


    /* -----------------------------------------
       OVERREACHING RANGE-FIEND
    ----------------------------------------- */

    else if (moth.behavior === "grow") {

      moth.x += moth.vx * multiplier;
      moth.y += moth.vy * multiplier;

      moth.size =
        Math.min(
          55,
          moth.baseSize + moth.age * 0.003
        );
    }


    /* -----------------------------------------
       IMPOSSIBLE DIVISION-IMP
    ----------------------------------------- */

    else if (moth.behavior === "circle") {

      moth.x += moth.vx * multiplier;
      moth.y += moth.vy * multiplier;

      const orbit =
        Math.sin(moth.age * 0.006 + moth.phase) * 3;

      moth.x += orbit * multiplier;

      moth.y +=
        Math.cos(moth.age * 0.006 + moth.phase) *
        3 *
        multiplier;
    }


    /* -----------------------------------------
       NAMELESS ATTRIBUTE-GHOUL
    ----------------------------------------- */

    else if (moth.behavior === "dash") {

      moth.x += moth.vx * multiplier;
      moth.y += moth.vy * multiplier;

      if (
        Math.sin(moth.age * 0.004 + moth.phase) > 0.94
      ) {

        moth.x += moth.vx * 5 * multiplier;
        moth.y += moth.vy * 5 * multiplier;
      }
    }


    /* -----------------------------------------
       BOUNDARY CHECK
    ----------------------------------------- */

    if (
      moth.x < -100 ||
      moth.x > canvasWidth + 100 ||
      moth.y < -100 ||
      moth.y > canvasHeight + 100
    ) {

      moth.alive = false;

      /*
       * A moth escaping costs one life.
       */
      loseLife();
    }
  }

  moths = moths.filter(moth => moth.alive);
}


/* =========================================================
   DRAW GAME
   ========================================================= */

function drawGame() {
  if (!ctx) {
    return;
  }

  ctx.clearRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  drawBackground();

  drawGrace();

  for (const moth of moths) {

    if (!moth.alive || !moth.visible) {
      continue;
    }

    drawMoth(moth);
  }
}


/* =========================================================
   DRAW BACKGROUND
   ========================================================= */

function drawBackground() {

  const gradient = ctx.createRadialGradient(
    canvasWidth / 2,
    canvasHeight / 2,
    50,
    canvasWidth / 2,
    canvasHeight / 2,
    Math.max(canvasWidth, canvasHeight)
  );

  gradient.addColorStop(0, "#3f3826");
  gradient.addColorStop(1, "#14130e");

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );


  /* parchment-like grid */

  ctx.strokeStyle =
    "rgba(150, 120, 70, 0.08)";

  ctx.lineWidth = 1;

  const gridSize = 40;

  for (
    let x = 0;
    x < canvasWidth;
    x += gridSize
  ) {

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }

  for (
    let y = 0;
    y < canvasHeight;
    y += gridSize
  ) {

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }


  /* central glow */

  const glow = ctx.createRadialGradient(
    canvasWidth / 2,
    canvasHeight / 2,
    10,
    canvasWidth / 2,
    canvasHeight / 2,
    250
  );

  glow.addColorStop(
    0,
    "rgba(120,255,160,0.06)"
  );

  glow.addColorStop(
    1,
    "rgba(120,255,160,0)"
  );

  ctx.fillStyle = glow;

  ctx.fillRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );
}


/* =========================================================
   DRAW GRACE
   ========================================================= */

function drawGrace() {

  const x = canvasWidth / 2;
  const y = canvasHeight / 2;

  ctx.save();

  ctx.translate(x, y);

  /* shadow */

  ctx.fillStyle =
    "rgba(0,0,0,0.35)";

  ctx.beginPath();

  ctx.ellipse(
    0,
    34,
    42,
    12,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* body */

  ctx.fillStyle = "#25261f";

  ctx.beginPath();

  ctx.roundRect(
    -18,
    -4,
    36,
    45,
    8
  );

  ctx.fill();


  /* shoulders */

  ctx.fillStyle = "#313329";

  ctx.beginPath();

  ctx.ellipse(
    0,
    4,
    30,
    15,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* head */

  ctx.fillStyle = "#c9a889";

  ctx.beginPath();

  ctx.arc(
    0,
    -22,
    15,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* hair */

  ctx.fillStyle = "#392b24";

  ctx.beginPath();

  ctx.arc(
    0,
    -25,
    16,
    Math.PI,
    Math.PI * 2
  );

  ctx.fill();


  /* glasses */

  ctx.strokeStyle = "#111";

  ctx.lineWidth = 2;

  ctx.strokeRect(
    -12,
    -25,
    9,
    7
  );

  ctx.strokeRect(
    3,
    -25,
    9,
    7
  );

  ctx.beginPath();

  ctx.moveTo(-3, -22);
  ctx.lineTo(3, -22);

  ctx.stroke();


  /* raised swatting arm */

  ctx.strokeStyle = "#c9a889";

  ctx.lineWidth = 7;

  ctx.lineCap = "round";

  ctx.beginPath();

  ctx.moveTo(17, 3);

  ctx.lineTo(33, -17);

  ctx.lineTo(39, -35);

  ctx.stroke();


  /* hand */

  ctx.fillStyle = "#c9a889";

  ctx.beginPath();

  ctx.arc(
    39,
    -38,
    5,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* green glow */

  ctx.shadowColor = "#65ff9b";

  ctx.shadowBlur = 12;

  ctx.fillStyle = "#78ffad";

  ctx.font = "bold 10px Courier New";

  ctx.textAlign = "center";

  ctx.fillText(
    "GRACE",
    0,
    57
  );

  ctx.restore();
}


/* =========================================================
   DRAW MOTH
   ========================================================= */

function drawMoth(moth) {

  ctx.save();

  ctx.translate(
    moth.x,
    moth.y
  );

  moth.rotation += 0.01;

  ctx.rotate(
    Math.sin(moth.age * 0.006) * 0.15
  );

  const size = moth.size;

  /* glow */

  ctx.shadowColor = "#8affb5";
  ctx.shadowBlur = 10;

  /* wings */

  ctx.fillStyle = "#8da58e";

  const wingFlap =
    Math.sin(moth.age * 0.025) * 0.35;

  ctx.save();

  ctx.rotate(-wingFlap);

  ctx.beginPath();

  ctx.ellipse(
    -size * 0.55,
    0,
    size * 0.65,
    size,
    -0.35,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();


  ctx.save();

  ctx.rotate(wingFlap);

  ctx.beginPath();

  ctx.ellipse(
    size * 0.55,
    0,
    size * 0.65,
    size,
    0.35,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();


  /* body */

  ctx.shadowBlur = 4;

  ctx.fillStyle = "#292a20";

  ctx.beginPath();

  ctx.ellipse(
    0,
    0,
    size * 0.22,
    size * 0.85,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* antennae */

  ctx.strokeStyle = "#a4c6a8";

  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(-2, -size * 0.6);

  ctx.quadraticCurveTo(
    -size,
    -size * 1.2,
    -size * 1.2,
    -size * 0.9
  );

  ctx.moveTo(2, -size * 0.6);

  ctx.quadraticCurveTo(
    size,
    -size * 1.2,
    size * 1.2,
    -size * 0.9
  );

  ctx.stroke();


  ctx.restore();
}


/* =========================================================
   MOUSE / TOUCH INPUT
   ========================================================= */

gameCanvas.addEventListener("click", handleCanvasClick);

gameCanvas.addEventListener(
  "touchstart",
  handleCanvasTouch,
  {
    passive: false
  }
);


function getCanvasPosition(event) {

  const rect =
    gameCanvas.getBoundingClientRect();

  return {
    x:
      event.clientX -
      rect.left,

    y:
      event.clientY -
      rect.top
  };
}


function handleCanvasClick(event) {

  if (!gameRunning || gamePaused) {
    return;
  }

  const position =
    getCanvasPosition(event);

  swat(position.x, position.y);
}


function handleCanvasTouch(event) {

  event.preventDefault();

  if (!gameRunning || gamePaused) {
    return;
  }

  const touch =
    event.touches[0];

  const rect =
    gameCanvas.getBoundingClientRect();

  const x =
    touch.clientX -
    rect.left;

  const y =
    touch.clientY -
    rect.top;

  swat(x, y);
}


/* =========================================================
   SWAT
   ========================================================= */

function swat(x, y) {

  playSound("swing", 0.65);

  let target = null;

  for (let i = moths.length - 1; i >= 0; i--) {

    const moth = moths[i];

    if (!moth.alive || !moth.visible) {
      continue;
    }

    const distance =
      Math.hypot(
        x - moth.x,
        y - moth.y
      );

    if (
      distance <=
      moth.size * 1.5
    ) {

      target = moth;

      break;
    }
  }

  if (!target) {
    return;
  }

  target.alive = false;

  currentSwats++;
  totalSwats++;

  saveTotalSwats();

  updateSwatDisplay();

  playSound("hit", 0.8);

  screenShake();

  createHitParticles(
    target.x,
    target.y
  );

  const previousTotal =
    totalSwats - 1;

  checkRankUp(previousTotal);

  if (
    currentSwats >=
    GAME_CONFIG.swatsToWin
  ) {

    setTimeout(() => {
      winGame();
    }, 180);

  }
}


/* =========================================================
   SWAT COUNTER
   ========================================================= */

function updateSwatDisplay() {

  if (swatCountDisplay) {
    swatCountDisplay.textContent =
      currentSwats;
  }

  updateRankDisplay();
}


/* =========================================================
   PARTICLES
   ========================================================= */

let particles = [];


function createHitParticles(x, y) {

  for (let i = 0; i < 10; i++) {

    particles.push({
      x,
      y,

      vx: random(-3, 3),
      vy: random(-3, 3),

      life: 1,

      size: random(2, 5)
    });
  }

  animateParticles();
}


let particleAnimationRunning = false;


function animateParticles() {

  if (particleAnimationRunning) {
    return;
  }

  particleAnimationRunning = true;

  function frame() {

    if (!gameRunning) {
      particleAnimationRunning = false;
      return;
    }

    for (const particle of particles) {

      particle.x += particle.vx;
      particle.y += particle.vy;

      particle.vy += 0.08;

      particle.life -= 0.035;
    }

    particles =
      particles.filter(
        particle =>
          particle.life > 0
      );

    drawParticles();

    if (particles.length > 0) {
      requestAnimationFrame(frame);
    } else {
      particleAnimationRunning = false;
    }
  }

  requestAnimationFrame(frame);
}


function drawParticles() {

  if (!ctx) {
    return;
  }

  for (const particle of particles) {

    ctx.save();

    ctx.globalAlpha =
      particle.life;

    ctx.fillStyle =
      "#b7ffd0";

    ctx.shadowColor =
      "#6aff9a";

    ctx.shadowBlur = 8;

    ctx.fillRect(
      particle.x,
      particle.y,
      particle.size,
      particle.size
    );

    ctx.restore();
  }
}


/* =========================================================
   SCREEN SHAKE
   ========================================================= */

function screenShake() {

  if (!gameStage) {
    return;
  }

  gameStage.animate(
    [
      {
        transform: "translate(0, 0)"
      },

      {
        transform: "translate(-4px, 2px)"
      },

      {
        transform: "translate(4px, -2px)"
      },

      {
        transform: "translate(-2px, 1px)"
      },

      {
        transform: "translate(0, 0)"
      }
    ],
    {
      duration: 130
    }
  );
}


/* =========================================================
   LIFE SYSTEM
   ========================================================= */

function loseLife() {

  if (!gameRunning) {
    return;
  }

  lives--;

  /*
   * We don't expose technical information.
   * The player simply suffers the consequences.
   */

  if (lives <= 0) {
    loseGame();
  }
}


/* =========================================================
   WIN
   ========================================================= */

function winGame() {

  if (!gameRunning) {
    return;
  }

  gameRunning = false;

  if (spawnTimer) {
    clearTimeout(spawnTimer);
    spawnTimer = null;
  }

  playSound("win", 0.9);

  addLogbookEntry(
    currentErrorType
  );

  showWinMessage();
}


/* =========================================================
   LOSS
   ========================================================= */

function loseGame() {

  if (!gameRunning) {
    return;
  }

  gameRunning = false;

  if (spawnTimer) {
    clearTimeout(spawnTimer);
    spawnTimer = null;
  }

  playSound("loss", 0.9);

  showLossMessage();
}


/* =========================================================
   WIN MESSAGE
   ========================================================= */

function showWinMessage() {

  const entry =
    generateMockery(
      currentErrorType
    );

  gameMessageTitle.textContent =
    "VICTORY";

  gameMessageText.textContent =
    entry +
    "\n\n" +
    "THE LOGBOOK HATH BEEN UPDATED." +
    "\n\n" +
    "CLICK TO RETURN TO THE MACHINE.";

  gameMessage.classList.add("visible");

  gameMessage.onclick =
    returnToPresent;
}


/* =========================================================
   LOSS MESSAGE
   ========================================================= */

function showLossMessage() {

  gameMessageTitle.textContent =
    "LET THE LOGBOOK SHOW:";

  gameMessageText.textContent =
    "THOU HAST BEEN BESTED BY A MOTH." +
    "\n\n" +
    "CLICK TO RETURN TO THE MACHINE.";

  gameMessage.classList.add("visible");

  gameMessage.onclick =
    returnToPresent;
}


/* =========================================================
   RETURN TO PRESENT
   ========================================================= */

function returnToPresent() {

  gameMessage.classList.remove(
    "visible"
  );

  gameMessage.onclick = null;

  stopGame();

  screen1947.classList.remove(
    "active"
  );

  screenPresent.classList.add(
    "active"
  );

  updateRankDisplay();
}


/* =========================================================
   LOGBOOK ACCESS
   ========================================================= */

/*
 * The logbook is intentionally simple for this first
 * complete version. Entries are stored in localStorage.
 *
 * A future UI can expose page flipping without changing
 * the storage system.
 */

function getLogbookEntries() {
  return loadLogbook();
}


/* =========================================================
   MOTH ICON EASTER EGG
   ========================================================= */

const mothIcon =
  document.getElementById("moth-icon");

if (mothIcon) {

  mothIcon.addEventListener(
    "click",
    () => {

      playSound(
        "spawn",
        0.4
      );

      mothIcon.animate(
        [
          {
            transform: "rotate(0deg)"
          },

          {
            transform: "rotate(-15deg)"
          },

          {
            transform: "rotate(15deg)"
          },

          {
            transform: "rotate(0deg)"
          }
        ],
        {
          duration: 250
        }
      );
    }
  );
}


/* =========================================================
   KEYBOARD SUPPORT
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    /*
     * Escape can return from the game after it has ended.
     */

    if (
      event.key === "Escape" &&
      !gameRunning &&
      screen1947.classList.contains("active")
    ) {

      returnToPresent();
    }

  }
);


/* =========================================================
   RUN BUTTON
   ========================================================= */

runBtn.addEventListener(
  "click",
  runCode
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

updateRankDisplay();

if (swatCountDisplay) {
  swatCountDisplay.textContent = "0";
}

resizeCanvas();

console.log(
  "Grace Hopper Bug Hunt initialized."
);