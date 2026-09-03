/* =========================================================
   THE GRACE HOPPER BUG HUNT
   COMPLETE FRONTEND GAME ENGINE
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
  maxMoths: 5
};


/* =========================================================
   DOM
   ========================================================= */

const screenPresent =
  document.getElementById("screen-present");

const screen1947 =
  document.getElementById("screen-1947");

const runBtn =
  document.getElementById("run-btn");

const codeInput =
  document.getElementById("code-input");

const presentStatus =
  document.getElementById("present-status");

const crtTransition =
  document.getElementById("crt-transition");

const staticLayer =
  document.getElementById("static-layer");

const crtLine =
  document.getElementById("crt-line");

const bootScreen =
  document.getElementById("boot-screen");

const bootText =
  document.getElementById("boot-text");

const gameCanvas =
  document.getElementById("game-canvas");

const gameStage =
  document.querySelector(".game-stage");

const spawnBanner =
  document.getElementById("spawn-banner");

const gameMessage =
  document.getElementById("game-message");

const gameMessageTitle =
  document.getElementById("game-message-title");

const gameMessageText =
  document.getElementById("game-message-text");

const messageButton =
  document.getElementById("message-button");

const errorCategory =
  document.getElementById("error-category");

const livesDisplay =
  document.getElementById("lives-display");

const rankName =
  document.getElementById("rank-name");

const swatCountDisplay =
  document.getElementById("swat-count");

const mothIcon =
  document.getElementById("moth-icon");


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

    sound.volume =
      Math.max(0, Math.min(1, volume));

    const promise = sound.play();

    if (promise) {
      promise.catch(() => {});
    }

  } catch (error) {

    console.warn(
      "Audio unavailable:",
      name
    );

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
  } catch (_) {}
}


/* =========================================================
   CANVAS
   ========================================================= */

const ctx =
  gameCanvas
    ? gameCanvas.getContext("2d")
    : null;

let canvasWidth = 800;
let canvasHeight = 500;


function resizeCanvas() {

  if (!gameCanvas || !gameStage || !ctx) {
    return;
  }

  const rect =
    gameStage.getBoundingClientRect();

  if (
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return;
  }

  const dpr =
    window.devicePixelRatio || 1;

  canvasWidth = rect.width;
  canvasHeight = rect.height;

  gameCanvas.width =
    Math.floor(canvasWidth * dpr);

  gameCanvas.height =
    Math.floor(canvasHeight * dpr);

  gameCanvas.style.width =
    `${canvasWidth}px`;

  gameCanvas.style.height =
    `${canvasHeight}px`;

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );
}


window.addEventListener(
  "resize",
  resizeCanvas
);


/* =========================================================
   STATE
   ========================================================= */

let gameRunning = false;

let currentErrorType =
  "UnknownError";

let lives =
  GAME_CONFIG.startingLives;

let currentSwats = 0;

let totalSwats =
  loadTotalSwats();

let moths = [];

let particles = [];

let spawnTimer = null;

let animationFrame = null;

let previousFrameTime =
  performance.now();

let transitionRunning = false;


/* =========================================================
   RANKS
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
    name:
      "REAR ADMIRAL, ORDER OF THE SWATTED WING"
  }

];


function getRankIndex(count) {

  let index = 0;

  for (
    let i = 0;
    i < RANKS.length;
    i++
  ) {

    if (
      count >= RANKS[i].threshold
    ) {
      index = i;
    }

  }

  return index;
}


function getRank(count) {

  return RANKS[
    getRankIndex(count)
  ];
}


function updateRankDisplay() {

  if (!rankName) {
    return;
  }

  rankName.textContent =
    getRank(totalSwats).name;
}


function checkRankUp(previousTotal) {

  const oldRank =
    getRankIndex(previousTotal);

  const newRank =
    getRankIndex(totalSwats);

  if (newRank > oldRank) {
    showRankUp(RANKS[newRank]);
  }
}


function showRankUp(rank) {

  playSound(
    "fanfare",
    0.8
  );

  gameMessageTitle.textContent =
    "A PROMOTION!";

  gameMessageText.textContent =
    `${rank.name}\n\n` +
    "By decree of the most solemn relay chamber, " +
    "thy swatting prowess hath been acknowledged.";

  gameMessage.classList.add("visible");

  messageButton.textContent =
    "RETURN TO THE HUNT";

  messageButton.onclick = () => {
    gameMessage.classList.remove(
      "visible"
    );
  };
}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function loadTotalSwats() {

  try {

    return Number(
      localStorage.getItem(
        "gh-total-swats"
      )
    ) || 0;

  } catch (_) {

    return 0;

  }
}


function saveTotalSwats() {

  try {

    localStorage.setItem(
      "gh-total-swats",
      String(totalSwats)
    );

  } catch (_) {}
}


function loadLogbook() {

  try {

    const raw =
      localStorage.getItem(
        "gh-logbook"
      );

    if (!raw) {
      return [];
    }

    const data =
      JSON.parse(raw);

    return Array.isArray(data)
      ? data
      : [];

  } catch (_) {

    return [];

  }
}


function saveLogbook(entries) {

  try {

    localStorage.setItem(
      "gh-logbook",
      JSON.stringify(entries)
    );

  } catch (_) {}
}


function addLogbookEntry(errorType) {

  const entries =
    loadLogbook();

  entries.push({

    errorType,

    text:
      generateMockery(errorType),

    timestamp:
      new Date().toISOString()

  });

  saveLogbook(entries);
}


/* =========================================================
   ERROR → MOCKERY
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
  },

  TimeoutError: {
    adjective: "Endless",
    noun: "Loop-Revenant",
    context: "the forbidden loop"
  },

  EmptyInputError: {
    adjective: "Vacant",
    noun: "Moth",
    context: "the empty chamber"
  },

  UnknownError: {
    adjective: "Unclassified",
    noun: "Error-Moth",
    context: "the machine"
  }

};


function getMockeryData(errorType) {

  return (
    MOCKERY[errorType] ||
    MOCKERY.UnknownError
  );
}


function generateMockery(errorType) {

  const data =
    getMockeryData(errorType);

  const templates = [

    `Hark! On this eve did the ${data.adjective} ${data.noun} beset ${data.context}, and was struck down in glorious combat. Let it be known the programmer's folly remaineth entirely his own to discover.`,

    `Upon the solemn machinery of the Harvard chamber descended the ${data.adjective} ${data.noun}. The creature hath been vanquished. The reason for its arrival shall remain a mystery, as decreed by the ancient machine.`,

    `Let the logbook record that a ${data.adjective} ${data.noun} hath troubled ${data.context}. By means most dramatic it was defeated, whilst the underlying matter remaineth magnificently unexplained.`,

    `Behold! The ${data.adjective} ${data.noun} hath been dispatched from the realm of computation. No useful wisdom shall proceed from this victory. Such is the will of the machine.`

  ];

  return templates[
    Math.floor(
      Math.random() *
      templates.length
    )
  ];
}


/* =========================================================
   ERROR → MOTH
   ========================================================= */

const MOTH_TYPES = {

  SyntaxError: {
    name: "Sluggish Syntax-Moth",
    speed: 0.7,
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
    speed: 1.3,
    size: 17,
    behavior: "teleport"
  },

  IndexError: {
    name: "Overreaching Range-Fiend",
    speed: 1.0,
    size: 14,
    behavior: "grow"
  },

  KeyError: {
    name: "Overreaching Range-Fiend",
    speed: 1.0,
    size: 14,
    behavior: "grow"
  },

  ZeroDivisionError: {
    name: "Impossible Division-Imp",
    speed: 1.7,
    size: 15,
    behavior: "circle"
  },

  AttributeError: {
    name: "Nameless Attribute-Ghoul",
    speed: 1.2,
    size: 21,
    behavior: "dash"
  },

  TimeoutError: {
    name: "Endless Loop-Revenant",
    speed: 1.8,
    size: 23,
    behavior: "dash"
  },

  EmptyInputError: {
    name: "Vacant Moth",
    speed: 0.8,
    size: 18,
    behavior: "straight"
  }

};


function getMothType(errorType) {

  return (
    MOTH_TYPES[errorType] ||
    {
      name: "Unclassified Error-Moth",
      speed: 1.2,
      size: 18,
      behavior: "straight"
    }
  );
}


/* =========================================================
   UTILITIES
   ========================================================= */

function sleep(ms) {

  return new Promise(
    resolve => setTimeout(
      resolve,
      ms
    )
  );

}


function random(min, max) {

  return Math.random() *
    (max - min) +
    min;

}


/* =========================================================
   BOOT SEQUENCE
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


async function typeText(
  element,
  text,
  speed = 12
) {

  if (!element) {
    return;
  }

  element.textContent = "";

  playSound(
    "typewriter",
    0.35
  );

  for (
    const character of text
  ) {

    element.textContent +=
      character;

    await sleep(speed);

  }

  stopSound("typewriter");
}


async function startCRTTransition(
  errorType
) {

  if (transitionRunning) {
    return;
  }

  transitionRunning = true;

  currentErrorType =
    errorType ||
    "UnknownError";


  /* Make transition visible FIRST. */

  if (crtTransition) {
    crtTransition.classList.add(
      "active"
    );
  }


  /* Static */

  if (staticLayer) {
    staticLayer.style.opacity = "1";
  }

  playSound(
    "static",
    0.8
  );

  await sleep(350);


  if (staticLayer) {
    staticLayer.style.opacity = "0";
  }

  await sleep(180);


  /* CRT line */

  if (crtLine) {

    crtLine.style.opacity = "1";

    crtLine.animate(
      [
        {
          transform:
            "translate(-50%, -50%) scaleX(0)"
        },

        {
          transform:
            "translate(-50%, -50%) scaleX(1)"
        }
      ],
      {
        duration: 300,
        fill: "forwards"
      }
    );

  }

  playSound(
    "boot",
    0.65
  );

  await sleep(400);


  /* Boot text */

  if (crtLine) {
    crtLine.style.opacity = "0";
  }

  if (bootScreen) {
    bootScreen.style.opacity = "1";
  }

  await sleep(200);

  await typeText(
    bootText,
    bootMessage,
    13
  );

  await sleep(500);


  /* Switch screens */

  screenPresent.classList.remove(
    "active"
  );

  screen1947.classList.add(
    "active"
  );


  if (crtTransition) {
    crtTransition.classList.remove(
      "active"
    );
  }

  if (bootScreen) {
    bootScreen.style.opacity = "0";
  }

  if (bootText) {
    bootText.textContent = "";
  }


  if (errorCategory) {

    errorCategory.textContent =
      `ERROR CATEGORY: ${currentErrorType}`;

  }


  transitionRunning = false;

  await sleep(50);

  resizeCanvas();

  startGame(
    currentErrorType
  );
}


/* =========================================================
   BACKEND
   ========================================================= */

async function runCode() {

  if (
    !runBtn ||
    !codeInput
  ) {
    return;
  }

  const code =
    codeInput.value;

  runBtn.disabled = true;

  runBtn.textContent =
    "Running...";

  if (presentStatus) {
    presentStatus.textContent =
      "contacting machine...";
  }


  try {

    const response =
      await fetch(
        BACKEND_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              code
            })
        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();

    console.log(
      "Backend response:",
      data
    );


    if (
      data.status === "error"
    ) {

      handleError(
        data.error_type
      );

    } else if (
      data.status === "clean"
    ) {

      handleSuccess();

    } else {

      console.warn(
        "Unknown response:",
        data
      );

    }


  } catch (error) {

    console.error(
      "Backend unreachable:",
      error
    );

    if (presentStatus) {

      presentStatus.textContent =
        "machine unavailable";

    }

    alert(
      "Couldn't reach the ancient machine.\n\n" +
      "Make sure Flask is running on port 5000."
    );

  } finally {

    runBtn.disabled = false;

    runBtn.textContent =
      "Run";

  }
}


/* =========================================================
   ERROR / SUCCESS
   ========================================================= */

function handleError(
  errorType
) {

  console.log(
    "Error detected:",
    errorType
  );

  if (presentStatus) {
    presentStatus.textContent =
      "";
  }

  stopGame();

  startCRTTransition(
    errorType
  );
}


function handleSuccess() {

  console.log(
    "Code ran clean."
  );

  if (presentStatus) {

    presentStatus.textContent =
      "executed successfully";

  }

  runBtn.textContent =
    "Success";

  setTimeout(
    () => {

      runBtn.textContent =
        "Run";

      if (presentStatus) {
        presentStatus.textContent =
          "";
      }

    },
    1000
  );
}


/* =========================================================
   GAME START
   ========================================================= */

function startGame(
  errorType
) {

  currentErrorType =
    errorType ||
    "UnknownError";

  lives =
    GAME_CONFIG.startingLives;

  currentSwats = 0;

  moths = [];

  particles = [];

  gameRunning = true;

  updateSwatDisplay();

  updateLivesDisplay();

  updateRankDisplay();


  if (gameMessage) {

    gameMessage.classList.remove(
      "visible"
    );

  }


  resizeCanvas();


  /* First moth */

  showSpawnBanner();

  spawnMoth();


  scheduleNextSpawn();


  previousFrameTime =
    performance.now();


  if (animationFrame) {

    cancelAnimationFrame(
      animationFrame
    );

  }


  animationFrame =
    requestAnimationFrame(
      gameLoop
    );
}


/* =========================================================
   STOP GAME
   ========================================================= */

function stopGame() {

  gameRunning = false;

  moths = [];

  particles = [];


  if (spawnTimer) {

    clearTimeout(
      spawnTimer
    );

    spawnTimer = null;

  }


  if (animationFrame) {

    cancelAnimationFrame(
      animationFrame
    );

    animationFrame = null;

  }

}


/* =========================================================
   DIFFICULTY
   ========================================================= */

function getDifficulty() {

  return 1 +
    Math.floor(
      totalSwats / 10
    ) * 0.15;

}


function getSpawnDelay() {

  return Math.max(

    GAME_CONFIG.minimumSpawnDelay,

    GAME_CONFIG.baseSpawnDelay /
      getDifficulty()

  );

}


function scheduleNextSpawn() {

  if (!gameRunning) {
    return;
  }

  spawnTimer =
    setTimeout(
      () => {

        if (
          gameRunning &&
          moths.length <
            GAME_CONFIG.maxMoths
        ) {

          spawnMoth();

        }

        scheduleNextSpawn();

      },
      getSpawnDelay()
    );

}


/* =========================================================
   SPAWN MOTH
   ========================================================= */

function spawnMoth() {

  if (
    !gameRunning ||
    !ctx
  ) {
    return;
  }


  const type =
    getMothType(
      currentErrorType
    );


  const side =
    Math.floor(
      random(0, 4)
    );


  let x;
  let y;


  if (side === 0) {

    x = -40;
    y = random(
      60,
      canvasHeight - 60
    );

  } else if (side === 1) {

    x = canvasWidth + 40;
    y = random(
      60,
      canvasHeight - 60
    );

  } else if (side === 2) {

    x = random(
      50,
      canvasWidth - 50
    );

    y = -40;

  } else {

    x = random(
      50,
      canvasWidth - 50
    );

    y =
      canvasHeight + 40;

  }


  const targetX =
    canvasWidth / 2;

  const targetY =
    canvasHeight / 2;


  const angle =
    Math.atan2(
      targetY - y,
      targetX - x
    );


  const moth = {

    x,
    y,

    vx:
      Math.cos(angle) *
      type.speed *
      getDifficulty(),

    vy:
      Math.sin(angle) *
      type.speed *
      getDifficulty(),

    size:
      type.size,

    baseSize:
      type.size,

    speed:
      type.speed,

    behavior:
      type.behavior,

    age: 0,

    phase:
      random(
        0,
        Math.PI * 2
      ),

    blinkTimer:
      random(
        800,
        2000
      ),

    visible: true,

    alive: true

  };


  moths.push(
    moth
  );


  playSound(
    "spawn",
    0.55
  );


  showSpawnBanner(
    type.name
  );
}


/* =========================================================
   BANNER
   ========================================================= */

function showSpawnBanner(
  name
) {

  if (!spawnBanner) {
    return;
  }

  const mothName =
    name ||
    getMothType(
      currentErrorType
    ).name;


  spawnBanner.textContent =
    `BEWARE! THE ${mothName.toUpperCase()} DOTH DESCEND!`;


  spawnBanner.classList.remove(
    "show"
  );


  void spawnBanner.offsetWidth;


  spawnBanner.classList.add(
    "show"
  );
}


/* =========================================================
   GAME LOOP
   ========================================================= */

function gameLoop(
  timestamp
) {

  if (!gameRunning) {
    return;
  }


  const delta =
    Math.min(
      32,
      timestamp -
        previousFrameTime
    );


  previousFrameTime =
    timestamp;


  updateMoths(
    delta
  );

  updateParticles(
    delta
  );

  drawGame();


  animationFrame =
    requestAnimationFrame(
      gameLoop
    );
}


/* =========================================================
   UPDATE MOTHS
   ========================================================= */

function updateMoths(
  delta
) {

  const multiplier =
    delta / 16.67;


  for (
    const moth of moths
  ) {

    if (!moth.alive) {
      continue;
    }


    moth.age += delta;


    /* Straight */

    if (
      moth.behavior ===
      "straight"
    ) {

      moth.x +=
        moth.vx *
        multiplier;

      moth.y +=
        moth.vy *
        multiplier;

    }


    /* Zigzag */

    else if (
      moth.behavior ===
      "zigzag"
    ) {

      const wobble =
        Math.sin(
          moth.age *
            0.012 +
          moth.phase
        ) * 3;


      moth.x +=
        moth.vx *
        multiplier +
        wobble;

      moth.y +=
        moth.vy *
        multiplier +
        Math.cos(
          moth.age *
            0.01 +
          moth.phase
        ) * 2;

    }


    /* Teleport */

    else if (
      moth.behavior ===
      "teleport"
    ) {

      moth.x +=
        moth.vx *
        multiplier;

      moth.y +=
        moth.vy *
        multiplier;

      moth.blinkTimer -=
        delta;


      if (
        moth.blinkTimer <= 0
      ) {

        moth.blinkTimer =
          random(
            900,
            2000
          );

        moth.visible =
          false;


        setTimeout(
          () => {

            if (!moth.alive) {
              return;
            }

            moth.x =
              random(
                60,
                canvasWidth - 60
              );

            moth.y =
              random(
                60,
                canvasHeight - 60
              );

            moth.visible =
              true;

          },
          160
        );

      }

    }


    /* Grow */

    else if (
      moth.behavior ===
      "grow"
    ) {

      moth.x +=
        moth.vx *
        multiplier;

      moth.y +=
        moth.vy *
        multiplier;

      moth.size =
        Math.min(
          55,
          moth.baseSize +
            moth.age *
              0.003
        );

    }


    /* Circle */

    else if (
      moth.behavior ===
      "circle"
    ) {

      moth.x +=
        moth.vx *
        multiplier;

      moth.y +=
        moth.vy *
        multiplier;


      const wave =
        Math.sin(
          moth.age *
            0.008 +
          moth.phase
        ) * 4;


      moth.x +=
        wave *
        multiplier;

      moth.y +=
        Math.cos(
          moth.age *
            0.008 +
          moth.phase
        ) *
        4 *
        multiplier;

    }


    /* Dash */

    else if (
      moth.behavior ===
      "dash"
    ) {

      moth.x +=
        moth.vx *
        multiplier;

      moth.y +=
        moth.vy *
        multiplier;


      if (
        Math.sin(
          moth.age *
            0.005 +
          moth.phase
        ) > 0.94
      ) {

        moth.x +=
          moth.vx *
          5 *
          multiplier;

        moth.y +=
          moth.vy *
          5 *
          multiplier;

      }

    }


    /* Escaped */

    if (

      moth.x < -120 ||
      moth.x >
        canvasWidth + 120 ||
      moth.y < -120 ||
      moth.y >
        canvasHeight + 120

    ) {

      moth.alive = false;

      loseLife();

    }

  }


  moths =
    moths.filter(
      moth => moth.alive
    );

}


/* =========================================================
   DRAW EVERYTHING
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


  for (
    const moth of moths
  ) {

    if (
      moth.alive &&
      moth.visible
    ) {

      drawMoth(
        moth
      );

    }

  }


  drawParticles();

}


/* =========================================================
   BACKGROUND
   ========================================================= */

function drawBackground() {

  const gradient =
    ctx.createRadialGradient(
      canvasWidth / 2,
      canvasHeight / 2,
      30,
      canvasWidth / 2,
      canvasHeight / 2,
      Math.max(
        canvasWidth,
        canvasHeight
      )
    );


  gradient.addColorStop(
    0,
    "#4b422e"
  );

  gradient.addColorStop(
    1,
    "#11110d"
  );


  ctx.fillStyle =
    gradient;


  ctx.fillRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );


  /* old machine grid */

  ctx.strokeStyle =
    "rgba(180,150,90,0.07)";

  ctx.lineWidth = 1;


  for (
    let x = 0;
    x < canvasWidth;
    x += 40
  ) {

    ctx.beginPath();

    ctx.moveTo(
      x,
      0
    );

    ctx.lineTo(
      x,
      canvasHeight
    );

    ctx.stroke();

  }


  for (
    let y = 0;
    y < canvasHeight;
    y += 40
  ) {

    ctx.beginPath();

    ctx.moveTo(
      0,
      y
    );

    ctx.lineTo(
      canvasWidth,
      y
    );

    ctx.stroke();

  }


  /* CRT glow */

  const glow =
    ctx.createRadialGradient(
      canvasWidth / 2,
      canvasHeight / 2,
      0,
      canvasWidth / 2,
      canvasHeight / 2,
      260
    );


  glow.addColorStop(
    0,
    "rgba(120,255,160,0.08)"
  );

  glow.addColorStop(
    1,
    "rgba(120,255,160,0)"
  );


  ctx.fillStyle =
    glow;

  ctx.fillRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );
}


/* =========================================================
   GRACE HOPPER
   ========================================================= */

function drawGrace() {

  const x =
    canvasWidth / 2;

  const y =
    canvasHeight / 2;


  ctx.save();

  ctx.translate(
    x,
    y
  );


  /* Ground shadow */

  ctx.fillStyle =
    "rgba(0,0,0,0.4)";

  ctx.beginPath();

  ctx.ellipse(
    0,
    40,
    50,
    12,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* Coat/body */

  ctx.fillStyle =
    "#252820";

  ctx.beginPath();

  ctx.roundRect(
    -22,
    -2,
    44,
    48,
    8
  );

  ctx.fill();


  /* shoulders */

  ctx.fillStyle =
    "#38392f";

  ctx.beginPath();

  ctx.ellipse(
    0,
    3,
    32,
    16,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* neck */

  ctx.fillStyle =
    "#c8a889";

  ctx.fillRect(
    -6,
    -12,
    12,
    10
  );


  /* head */

  ctx.beginPath();

  ctx.arc(
    0,
    -27,
    17,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* hair */

  ctx.fillStyle =
    "#382b25";

  ctx.beginPath();

  ctx.arc(
    0,
    -29,
    18,
    Math.PI,
    Math.PI * 2
  );

  ctx.fill();


  /* hair sides */

  ctx.fillRect(
    -17,
    -29,
    5,
    16
  );

  ctx.fillRect(
    12,
    -29,
    5,
    16
  );


  /* glasses */

  ctx.strokeStyle =
    "#111";

  ctx.lineWidth = 2;


  ctx.strokeRect(
    -13,
    -30,
    10,
    8
  );

  ctx.strokeRect(
    3,
    -30,
    10,
    8
  );


  ctx.beginPath();

  ctx.moveTo(
    -3,
    -27
  );

  ctx.lineTo(
    3,
    -27
  );

  ctx.stroke();


  /* eyes */

  ctx.fillStyle =
    "#111";

  ctx.fillRect(
    -9,
    -27,
    2,
    2
  );

  ctx.fillRect(
    7,
    -27,
    2,
    2
  );


  /* raised arm */

  ctx.strokeStyle =
    "#c8a889";

  ctx.lineWidth = 7;

  ctx.lineCap =
    "round";


  ctx.beginPath();

  ctx.moveTo(
    18,
    5
  );

  ctx.lineTo(
    33,
    -18
  );

  ctx.lineTo(
    39,
    -39
  );

  ctx.stroke();


  /* hand */

  ctx.fillStyle =
    "#c8a889";

  ctx.beginPath();

  ctx.arc(
    40,
    -42,
    6,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* Swatter */

  ctx.strokeStyle =
    "#8f7650";

  ctx.lineWidth = 3;

  ctx.beginPath();

  ctx.moveTo(
    40,
    -42
  );

  ctx.lineTo(
    47,
    -74
  );

  ctx.stroke();


  ctx.strokeStyle =
    "#b69a6b";

  ctx.lineWidth = 2;

  ctx.strokeRect(
    39,
    -83,
    16,
    10
  );


  /* label */

  ctx.shadowColor =
    "#65ff9b";

  ctx.shadowBlur = 12;

  ctx.fillStyle =
    "#78ffad";

  ctx.font =
    "bold 10px Courier New";

  ctx.textAlign =
    "center";

  ctx.fillText(
    "GRACE HOPPER",
    0,
    65
  );


  ctx.restore();
}


/* =========================================================
   MOTH
   ========================================================= */

function drawMoth(
  moth
) {

  ctx.save();

  ctx.translate(
    moth.x,
    moth.y
  );


  const size =
    moth.size;


  const flap =
    Math.sin(
      moth.age *
        0.025
    ) *
    0.35;


  ctx.shadowColor =
    "#9affb7";

  ctx.shadowBlur = 12;


  /* left wing */

  ctx.save();

  ctx.rotate(
    -flap
  );

  ctx.fillStyle =
    "#8ea68f";

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


  /* right wing */

  ctx.save();

  ctx.rotate(
    flap
  );

  ctx.fillStyle =
    "#8ea68f";

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

  ctx.fillStyle =
    "#292a20";

  ctx.beginPath();

  ctx.ellipse(
    0,
    0,
    size * 0.23,
    size * 0.85,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* antennae */

  ctx.strokeStyle =
    "#b5d4b8";

  ctx.lineWidth = 1;


  ctx.beginPath();

  ctx.moveTo(
    -2,
    -size * 0.6
  );

  ctx.quadraticCurveTo(
    -size,
    -size * 1.2,
    -size * 1.2,
    -size * 0.9
  );


  ctx.moveTo(
    2,
    -size * 0.6
  );

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
   INPUT
   ========================================================= */

if (gameCanvas) {

  gameCanvas.addEventListener(
    "click",
    event => {

      if (!gameRunning) {
        return;
      }

      const rect =
        gameCanvas.getBoundingClientRect();

      swat(
        event.clientX -
          rect.left,

        event.clientY -
          rect.top
      );

    }
  );


  gameCanvas.addEventListener(
    "touchstart",
    event => {

      event.preventDefault();

      if (!gameRunning) {
        return;
      }

      const touch =
        event.touches[0];

      const rect =
        gameCanvas.getBoundingClientRect();

      swat(
        touch.clientX -
          rect.left,

        touch.clientY -
          rect.top
      );

    },
    {
      passive: false
    }
  );

}


/* =========================================================
   SWAT
   ========================================================= */

function swat(
  x,
  y
) {

  playSound(
    "swing",
    0.6
  );


  let target =
    null;


  for (
    let i =
      moths.length - 1;
    i >= 0;
    i--
  ) {

    const moth =
      moths[i];


    if (
      !moth.alive ||
      !moth.visible
    ) {
      continue;
    }


    const distance =
      Math.hypot(
        x - moth.x,
        y - moth.y
      );


    if (
      distance <=
      moth.size * 1.6
    ) {

      target =
        moth;

      break;

    }

  }


  if (!target) {
    return;
  }


  target.alive =
    false;


  currentSwats++;

  const previousTotal =
    totalSwats;

  totalSwats++;


  saveTotalSwats();

  updateSwatDisplay();

  updateLivesDisplay();


  playSound(
    "hit",
    0.8
  );


  screenShake();


  createHitParticles(
    target.x,
    target.y
  );


  checkRankUp(
    previousTotal
  );


  if (
    currentSwats >=
    GAME_CONFIG.swatsToWin
  ) {

    setTimeout(
      winGame,
      250
    );

  }
}


/* =========================================================
   DISPLAY
   ========================================================= */

function updateSwatDisplay() {

  if (swatCountDisplay) {

    swatCountDisplay.textContent =
      currentSwats;

  }

  updateRankDisplay();
}


function updateLivesDisplay() {

  if (!livesDisplay) {
    return;
  }

  livesDisplay.textContent =
    "♥ ".repeat(
      Math.max(0, lives)
    ).trim();

}


/* =========================================================
   PARTICLES
   ========================================================= */

function createHitParticles(
  x,
  y
) {

  for (
    let i = 0;
    i < 12;
    i++
  ) {

    particles.push({

      x,
      y,

      vx:
        random(-3, 3),

      vy:
        random(-3, 3),

      life: 1,

      size:
        random(2, 5)

    });

  }

}


function updateParticles(
  delta
) {

  for (
    const particle
    of particles
  ) {

    particle.x +=
      particle.vx *
      (delta / 16.67);

    particle.y +=
      particle.vy *
      (delta / 16.67);

    particle.vy +=
      0.08;

    particle.life -=
      0.04 *
      (delta / 16.67);

  }


  particles =
    particles.filter(
      particle =>
        particle.life > 0
    );

}


function drawParticles() {

  if (!ctx) {
    return;
  }


  for (
    const particle
    of particles
  ) {

    ctx.save();

    ctx.globalAlpha =
      particle.life;

    ctx.fillStyle =
      "#baffcc";

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
        transform:
          "translate(0,0)"
      },

      {
        transform:
          "translate(-5px,2px)"
      },

      {
        transform:
          "translate(5px,-2px)"
      },

      {
        transform:
          "translate(-2px,1px)"
      },

      {
        transform:
          "translate(0,0)"
      }
    ],

    {
      duration: 130
    }

  );

}


/* =========================================================
   LIVES
   ========================================================= */

function loseLife() {

  if (!gameRunning) {
    return;
  }


  lives--;

  updateLivesDisplay();


  if (
    lives <= 0
  ) {

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


  gameRunning =
    false;


  if (spawnTimer) {

    clearTimeout(
      spawnTimer
    );

    spawnTimer =
      null;

  }


  playSound(
    "win",
    0.9
  );


  addLogbookEntry(
    currentErrorType
  );


  showWinMessage();
}


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
    "THE LOGBOOK HATH BEEN UPDATED.";


  gameMessage.classList.add(
    "visible"
  );


  messageButton.textContent =
    "RETURN TO THE MACHINE";


  messageButton.onclick =
    returnToPresent;

}


/* =========================================================
   LOSS
   ========================================================= */

function loseGame() {

  if (!gameRunning) {
    return;
  }


  gameRunning =
    false;


  if (spawnTimer) {

    clearTimeout(
      spawnTimer
    );

    spawnTimer =
      null;

  }


  playSound(
    "loss",
    0.9
  );


  showLossMessage();
}


function showLossMessage() {

  gameMessageTitle.textContent =
    "LET THE LOGBOOK SHOW:";


  gameMessageText.textContent =
    "THOU HAST BEEN BESTED BY A MOTH.";


  gameMessage.classList.add(
    "visible"
  );


  messageButton.textContent =
    "RETURN TO THE MACHINE";


  messageButton.onclick =
    returnToPresent;

}


/* =========================================================
   RETURN
   ========================================================= */

function returnToPresent() {

  stopGame();


  gameMessage.classList.remove(
    "visible"
  );


  screen1947.classList.remove(
    "active"
  );


  screenPresent.classList.add(
    "active"
  );


  updateRankDisplay();

}


/* =========================================================
   MOTH EASTER EGG
   ========================================================= */

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
            transform:
              "rotate(0deg)"
          },

          {
            transform:
              "rotate(-15deg)"
          },

          {
            transform:
              "rotate(15deg)"
          },

          {
            transform:
              "rotate(0deg)"
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
   KEYBOARD
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      screen1947 &&
      screen1947.classList.contains(
        "active"
      )
    ) {

      returnToPresent();

    }

  }
);


/* =========================================================
   RUN BUTTON
   ========================================================= */

if (runBtn) {

  runBtn.addEventListener(
    "click",
    runCode
  );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

updateRankDisplay();

updateSwatDisplay();

updateLivesDisplay();

resizeCanvas();


console.log(
  "Grace Hopper Bug Hunt initialized."
);