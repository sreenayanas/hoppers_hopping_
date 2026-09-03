// =========================================================
// GRACE HOPPER BUG HUNT
// COMPLETE FRONTEND GAME ENGINE
// =========================================================


// =========================================================
// CONFIGURATION
// =========================================================

const BACKEND_URL =
  "http://localhost:5000/run";

const SWATS_TO_WIN = 10;

const STARTING_LIVES = 3;

const STORAGE_KEY =
  "grace-hopper-bug-hunt-logbook";

const RANK_STORAGE_KEY =
  "grace-hopper-bug-hunt-rank";


// =========================================================
// DOM REFERENCES
// =========================================================

const runBtn =
  document.getElementById("run-btn");

const codeInput =
  document.getElementById("code-input");

const screenPresent =
  document.getElementById("screen-present");

const screen1947 =
  document.getElementById("screen-1947");

const transition =
  document.getElementById("transition");

const bootText =
  document.getElementById("boot-text");

const editorStatus =
  document.getElementById("editor-status");

const lineNumbers =
  document.getElementById("line-numbers");

const mothAnnouncement =
  document.getElementById("moth-announcement");

const canvas =
  document.getElementById("game-canvas");

const canvasWrapper =
  document.getElementById("canvas-wrapper");

const ctx =
  canvas.getContext("2d");

const scoreElement =
  document.getElementById("score");

const livesElement =
  document.getElementById("lives");

const hitFlash =
  document.getElementById("hit-flash");

const swatIndicator =
  document.getElementById("swat-indicator");

const logbookBtn =
  document.getElementById("logbook-btn");

const logbookOverlay =
  document.getElementById("logbook-overlay");

const closeLogbook =
  document.getElementById("close-logbook");

const logbookPageContent =
  document.getElementById(
    "logbook-page-content"
  );

const logbookCounter =
  document.getElementById(
    "logbook-counter"
  );

const previousEntryBtn =
  document.getElementById(
    "prev-entry"
  );

const nextEntryBtn =
  document.getElementById(
    "next-entry"
  );

const rankOverlay =
  document.getElementById(
    "rank-overlay"
  );

const rankTitle =
  document.getElementById(
    "rank-title"
  );

const rankJab =
  document.getElementById(
    "rank-jab"
  );

const rankDismiss =
  document.getElementById(
    "rank-dismiss"
  );

const endOverlay =
  document.getElementById(
    "end-overlay"
  );

const endSymbol =
  document.getElementById(
    "end-symbol"
  );

const endHeading =
  document.getElementById(
    "end-heading"
  );

const endText =
  document.getElementById(
    "end-text"
  );

const endEntry =
  document.getElementById(
    "end-entry"
  );

const endDismiss =
  document.getElementById(
    "end-dismiss"
  );


// =========================================================
// AUDIO
// =========================================================

const audio = {

  static:
    document.getElementById(
      "audio-static"
    ),

  boot:
    document.getElementById(
      "audio-boot"
    ),

  spawn:
    document.getElementById(
      "audio-spawn"
    ),

  swing:
    document.getElementById(
      "audio-swing"
    ),

  hit:
    document.getElementById(
      "audio-hit"
    ),

  loss:
    document.getElementById(
      "audio-loss"
    ),

  win:
    document.getElementById(
      "audio-win"
    ),

  typewriter:
    document.getElementById(
      "audio-typewriter"
    ),

  fanfare:
    document.getElementById(
      "audio-fanfare"
    )

};


function playSound(
  name,
  volume = 1
) {

  const sound =
    audio[name];

  if (!sound) {
    return;
  }

  try {

    sound.pause();

    sound.currentTime = 0;

    sound.volume =
      Math.max(
        0,
        Math.min(
          1,
          volume
        )
      );

    const promise =
      sound.play();

    if (promise) {

      promise.catch(
        () => {}
      );

    }

  }

  catch (error) {

    console.warn(
      "Audio unavailable:",
      name
    );

  }

}


// =========================================================
// UTILITY
// =========================================================

function sleep(ms) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );

}


function random(min, max) {

  return (
    Math.random() *
    (max - min) +
    min
  );

}


function clamp(
  value,
  min,
  max
) {

  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );

}


// =========================================================
// EDITOR LINE NUMBERS
// =========================================================

function updateLineNumbers() {

  const lineCount =
    codeInput.value
      .split("\n")
      .length;

  const numbers = [];

  for (
    let i = 1;
    i <= lineCount;
    i++
  ) {

    numbers.push(i);

  }

  lineNumbers.textContent =
    numbers.join("\n");

}


codeInput.addEventListener(
  "input",
  updateLineNumbers
);


codeInput.addEventListener(
  "scroll",
  () => {

    lineNumbers.style.transform =
      `translateY(${-codeInput.scrollTop}px)`;

  }
);


updateLineNumbers();


// =========================================================
// BACKEND CONNECTION
// =========================================================

async function runCode() {

  const code =
    codeInput.value;


  if (!code.trim()) {

    editorStatus.textContent =
      "Running...";

  }

  else {

    editorStatus.textContent =
      "Running...";

  }


  runBtn.disabled = true;

  runBtn.textContent =
    "Running...";


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

          body: JSON.stringify({
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
      data.status ===
      "error"
    ) {

      editorStatus.textContent =
        "Process terminated.";

      handleError(
        data.error_type ||
        "UnknownError"
      );

    }

    else if (
      data.status ===
      "clean"
    ) {

      editorStatus.textContent =
        "Process completed.";

      handleSuccess();

    }

    else {

      throw new Error(
        "Unexpected backend response."
      );

    }

  }

  catch (error) {

    console.error(
      "Backend unreachable:",
      error
    );

    editorStatus.textContent =
      "Connection failed.";

    alert(
      "The ancient machine could not be reached.\n\n" +
      "Make sure the Flask backend is running."
    );

  }

  finally {

    runBtn.disabled =
      false;

    runBtn.textContent =
      "Run";

  }

}


runBtn.addEventListener(
  "click",
  runCode
);


// =========================================================
// CLEAN RUN
// =========================================================

function handleSuccess() {

  console.log(
    "Code ran clean."
  );

  // The useless-project joke:
  // clean code gives the user absolutely nothing.

}


// =========================================================
// ERROR HANDLER
// =========================================================

function handleError(
  errorType
) {

  console.log(
    "Error detected:",
    errorType
  );


  startHauntedTransition(
    errorType
  );

}


// =========================================================
// HAUNTED TRANSITION
// =========================================================

let transitionRunning =
  false;


async function startHauntedTransition(
  errorType
) {

  if (transitionRunning) {
    return;
  }

  transitionRunning = true;


  runBtn.disabled =
    true;


  document.body.classList.add(
    "glitching"
  );


  playSound(
    "static",
    0.8
  );


  await sleep(650);


  document.body.classList.remove(
    "glitching"
  );


  transition.classList.add(
    "active"
  );


  transition.classList.add(
    "static-active"
  );


  await sleep(500);


  transition.classList.remove(
    "static-active"
  );


  await sleep(250);


  transition.classList.add(
    "crt-active"
  );


  playSound(
    "boot",
    0.65
  );


  await sleep(900);


  transition.classList.add(
    "boot-active"
  );


  await typeBootSequence(
    errorType
  );


  await sleep(800);


  transition.classList.remove(
    "active"
  );


  transition.classList.remove(
    "crt-active"
  );


  transition.classList.remove(
    "boot-active"
  );


  screenPresent.classList.remove(
    "active"
  );


  screen1947.classList.add(
    "active"
  );


  transitionRunning =
    false;


  startGame(
    errorType
  );

}


// =========================================================
// BOOT SEQUENCE
// =========================================================

async function typeBootSequence(
  errorType
) {

  const lines = [

    "SEPTEMBER 9, 1947",

    "HARVARD MARK II",

    "",

    "RELAY NETWORK: ACTIVE",

    "VACUUM TUBES: NOMINAL",

    "ELECTROMAGNETIC MEMORY: ACTIVE",

    "",

    "ANOMALOUS BEHAVIOUR DETECTED.",

    "",

    "INSECTUAL CONTAMINATION:",

    "CONFIRMED.",

    "",

    "ERROR CLASSIFICATION:",

    errorType.toUpperCase(),

    "",

    "ARCHIVE PROTOCOL ENGAGED.",

    "",

    "THE MOTH HATH RETURNED."

  ];


  bootText.textContent =
    "";


  playSound(
    "typewriter",
    0.35
  );


  for (
    const line of lines
  ) {

    await typeBootLine(
      line
    );

    await sleep(120);

  }

}


async function typeBootLine(
  text
) {

  for (
    let i = 0;
    i < text.length;
    i++
  ) {

    bootText.textContent +=
      text[i];

    await sleep(19);

  }


  bootText.textContent +=
    "\n";

}


// =========================================================
// MOTH DEFINITIONS
// =========================================================

const MOTH_TYPES = {

  SyntaxError: {

    name:
      "Sluggish Syntax-Moth",

    behavior:
      "sluggish",

    speed:
      1.0,

    size:
      18,

    color:
      "#b7d995"

  },


  TypeError: {

    name:
      "Fickle Type-Wraith",

    behavior:
      "zigzag",

    speed:
      2.2,

    size:
      18,

    color:
      "#b7ff9b"

  },


  NameError: {

    name:
      "Vanishing Reference-Sprite",

    behavior:
      "blink",

    speed:
      1.8,

    size:
      17,

    color:
      "#c7e8a7"

  },


  IndexError: {

    name:
      "Overreaching Range-Fiend",

    behavior:
      "growing",

    speed:
      1.45,

    size:
      17,

    color:
      "#e0d39a"

  },


  KeyError: {

    name:
      "Overreaching Range-Fiend",

    behavior:
      "growing",

    speed:
      1.45,

    size:
      17,

    color:
      "#e0d39a"

  },


  ZeroDivisionError: {

    name:
      "Impossible Division-Imp",

    behavior:
      "orbit",

    speed:
      1.8,

    size:
      18,

    color:
      "#d5e7a0"

  },


  AttributeError: {

    name:
      "Nameless Attribute-Ghoul",

    behavior:
      "spiral",

    speed:
      1.65,

    size:
      19,

    color:
      "#a8d28b"

  },


  TimeoutError: {

    name:
      "Endless Loop Revenant",

    behavior:
      "dash",

    speed:
      2.8,

    size:
      21,

    color:
      "#d6c789"

  },


  EmptyInputError: {

    name:
      "Vacant Moth",

    behavior:
      "sluggish",

    speed:
      0.8,

    size:
      18,

    color:
      "#91a681"

  },


  UnknownError: {

    name:
      "Unclassified Error-Moth",

    behavior:
      "zigzag",

    speed:
      1.5,

    size:
      19,

    color:
      "#b7ff9b"

  }

};


// =========================================================
// GAME STATE
// =========================================================

const game = {

  running:
    false,

  errorType:
    "UnknownError",

  score:
    0,

  lives:
    STARTING_LIVES,

  moths:
    [],

  lastSpawn:
    0,

  spawnInterval:
    1600,

  difficulty:
    1,

  animationId:
    null,

  lastFrame:
    0,

  endShown:
    false

};


// =========================================================
// CANVAS RESIZE
// =========================================================

function resizeCanvas() {

  if (!canvas) {
    return;
  }


  const rect =
    canvas.getBoundingClientRect();


  const dpr =
    window.devicePixelRatio ||
    1;


  canvas.width =
    Math.floor(
      rect.width * dpr
    );


  canvas.height =
    Math.floor(
      rect.height * dpr
    );


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


// =========================================================
// START GAME
// =========================================================

function startGame(
  errorType
) {

  game.running =
    true;

  game.errorType =
    errorType;

  game.score =
    0;

  game.lives =
    STARTING_LIVES;

  game.moths =
    [];

  game.lastSpawn =
    performance.now();

  game.spawnInterval =
    1500;

  game.difficulty =
    1;

  game.lastFrame =
    performance.now();

  game.endShown =
    false;


  updateStats();

  resizeCanvas();


  announceMoth(
    errorType
  );


  spawnMoth();


  cancelAnimationFrame(
    game.animationId
  );


  game.animationId =
    requestAnimationFrame(
      gameLoop
    );

}


// =========================================================
// GAME LOOP
// =========================================================

function gameLoop(
  timestamp
) {

  if (!game.running) {
    return;
  }


  const width =
    canvas.clientWidth;

  const height =
    canvas.clientHeight;


  const delta =
    Math.min(
      50,
      timestamp -
      game.lastFrame
    );


  game.lastFrame =
    timestamp;


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  drawBackground(
    width,
    height,
    timestamp
  );


  if (
    timestamp -
    game.lastSpawn >=
    game.spawnInterval
  ) {

    spawnMoth();

    game.lastSpawn =
      timestamp;

  }


  updateMoths(
    delta,
    width,
    height
  );


  drawMoths();


  game.animationId =
    requestAnimationFrame(
      gameLoop
    );

}


// =========================================================
// BACKGROUND
// =========================================================

function drawBackground(
  width,
  height,
  timestamp
) {

  ctx.fillStyle =
    "#0b1109";

  ctx.fillRect(
    0,
    0,
    width,
    height
  );


  const gradient =
    ctx.createRadialGradient(
      width / 2,
      height / 2,
      10,
      width / 2,
      height / 2,
      Math.max(
        width,
        height
      ) * 0.7
    );


  gradient.addColorStop(
    0,
    "rgba(120,170,90,0.13)"
  );


  gradient.addColorStop(
    0.45,
    "rgba(50,80,40,0.05)"
  );


  gradient.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );


  ctx.fillStyle =
    gradient;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );


  // CRT scanlines

  ctx.fillStyle =
    "rgba(170,255,140,0.025)";


  for (
    let y = 0;
    y < height;
    y += 4
  ) {

    ctx.fillRect(
      0,
      y,
      width,
      1
    );

  }


  // Slowly moving phosphor noise

  ctx.fillStyle =
    "rgba(190,255,150,0.012)";


  const offset =
    Math.floor(
      timestamp / 80
    ) % 5;


  for (
    let y = offset;
    y < height;
    y += 17
  ) {

    ctx.fillRect(
      0,
      y,
      width,
      1
    );

  }

}


// =========================================================
// SPAWN MOTH
// =========================================================

function spawnMoth() {

  if (!game.running) {
    return;
  }


  const definition =
    MOTH_TYPES[
      game.errorType
    ] ||
    MOTH_TYPES.UnknownError;


  const width =
    canvas.clientWidth;

  const height =
    canvas.clientHeight;


  const side =
    Math.floor(
      Math.random() * 4
    );


  let x;
  let y;


  if (side === 0) {

    x =
      random(0, width);

    y =
      -50;

  }

  else if (side === 1) {

    x =
      width + 50;

    y =
      random(0, height);

  }

  else if (side === 2) {

    x =
      random(0, width);

    y =
      height + 50;

  }

  else {

    x =
      -50;

    y =
      random(0, height);

  }


  const targetX =
    width / 2;

  const targetY =
    height / 2;


  const angle =
    Math.atan2(
      targetY - y,
      targetX - x
    );


  const speed =
    definition.speed *
    game.difficulty;


  const moth = {

    x,

    y,

    vx:
      Math.cos(angle) *
      speed,

    vy:
      Math.sin(angle) *
      speed,

    size:
      definition.size,

    baseSize:
      definition.size,

    color:
      definition.color,

    behavior:
      definition.behavior,

    age:
      0,

    phase:
      random(
        0,
        Math.PI * 2
      ),

    angle:
      angle,

    orbitRadius:
      random(20, 80),

    blinkVisible:
      true

  };


  game.moths.push(
    moth
  );


  playSound(
    "spawn",
    0.3
  );


  announceMoth(
    game.errorType
  );

}


// =========================================================
// UPDATE MOTHS
// =========================================================

function updateMoths(
  delta,
  width,
  height
) {

  const frame =
    delta / 16.67;


  for (
    let i =
      game.moths.length - 1;

    i >= 0;

    i--
  ) {

    const moth =
      game.moths[i];


    moth.age +=
      frame;


    // -----------------------------------------------------
    // SLUGGISH
    // -----------------------------------------------------

    if (
      moth.behavior ===
      "sluggish"
    ) {

      moth.x +=
        moth.vx *
        0.65 *
        frame;

      moth.y +=
        moth.vy *
        0.65 *
        frame;

    }


    // -----------------------------------------------------
    // ZIGZAG
    // -----------------------------------------------------

    else if (
      moth.behavior ===
      "zigzag"
    ) {

      const wave =
        Math.sin(
          moth.age * 0.11 +
          moth.phase
        );


      moth.x +=
        (
          moth.vx +
          -moth.vy *
          wave *
          0.12
        ) *
        frame;


      moth.y +=
        (
          moth.vy +
          moth.vx *
          wave *
          0.12
        ) *
        frame;

    }


    // -----------------------------------------------------
    // BLINK / TELEPORT
    // -----------------------------------------------------

    else if (
      moth.behavior ===
      "blink"
    ) {

      moth.x +=
        moth.vx *
        frame;

      moth.y +=
        moth.vy *
        frame;


      moth.blinkVisible =
        Math.floor(
          moth.age / 9
        ) % 2 === 0;


      if (
        moth.age % 85 <
        frame
      ) {

        moth.x +=
          random(
            -100,
            100
          );

        moth.y +=
          random(
            -100,
            100
          );

      }

    }


    // -----------------------------------------------------
    // GROWING
    // -----------------------------------------------------

    else if (
      moth.behavior ===
      "growing"
    ) {

      moth.x +=
        moth.vx *
        frame;

      moth.y +=
        moth.vy *
        frame;


      moth.size =
        moth.baseSize +
        Math.min(
          24,
          moth.age *
          0.045
        );

    }


    // -----------------------------------------------------
    // ORBIT
    // -----------------------------------------------------

    else if (
      moth.behavior ===
      "orbit"
    ) {

      moth.x +=
        moth.vx *
        frame;

      moth.y +=
        moth.vy *
        frame;


      const orbitalForce =
        Math.sin(
          moth.age *
          0.08
        );


      moth.x +=
        -moth.vy *
        orbitalForce *
        0.09 *
        frame;


      moth.y +=
        moth.vx *
        orbitalForce *
        0.09 *
        frame;

    }


    // -----------------------------------------------------
    // SPIRAL
    // -----------------------------------------------------

    else if (
      moth.behavior ===
      "spiral"
    ) {

      moth.x +=
        moth.vx *
        frame;

      moth.y +=
        moth.vy *
        frame;


      const spiral =
        Math.sin(
          moth.age *
          0.06
        ) *
        (
          1 +
          moth.age *
          0.008
        );


      moth.x +=
        spiral *
        frame;


      moth.y +=
        Math.cos(
          moth.age *
          0.06
        ) *
        2 *
        frame;

    }


    // -----------------------------------------------------
    // DASH
    // -----------------------------------------------------

    else if (
      moth.behavior ===
      "dash"
    ) {

      const multiplier =
        1 +
        Math.sin(
          moth.age *
          0.045
        ) *
        0.8;


      moth.x +=
        moth.vx *
        multiplier *
        frame;

      moth.y +=
        moth.vy *
        frame;

    }


    // -----------------------------------------------------
    // OUT OF BOUNDS
    // -----------------------------------------------------

    const margin =
      75;


    if (
      moth.x <
        -margin ||

      moth.x >
        width +
        margin ||

      moth.y <
        -margin ||

      moth.y >
        height +
        margin
    ) {

      game.moths.splice(
        i,
        1
      );


      game.lives--;

      updateStats();


      if (
        game.lives <= 0
      ) {

        loseGame();

        return;

      }

    }

  }

}


// =========================================================
// DRAW MOTH
// =========================================================

function drawMoths() {

  for (
    const moth of game.moths
  ) {

    if (
      moth.behavior ===
      "blink" &&
      !moth.blinkVisible
    ) {

      continue;

    }


    drawMoth(
      moth
    );

  }

}


function drawMoth(
  moth
) {

  const x =
    moth.x;

  const y =
    moth.y;

  const s =
    moth.size;


  ctx.save();


  ctx.translate(
    x,
    y
  );


  const flutter =
    Math.sin(
      moth.age *
      0.28
    );


  const wingScale =
    0.75 +
    Math.abs(flutter) *
    0.25;


  // Glow

  ctx.shadowColor =
    moth.color;

  ctx.shadowBlur =
    14;


  // Wing color

  ctx.fillStyle =
    moth.color;


  // Left wing

  ctx.save();

  ctx.rotate(
    -0.25 +
    flutter *
    0.08
  );


  ctx.beginPath();

  ctx.ellipse(
    -s * 0.52,
    -s * 0.08,
    s * 0.65,
    s * 0.34 *
      wingScale,
    -0.35,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();


  // Right wing

  ctx.save();

  ctx.rotate(
    0.25 -
    flutter *
    0.08
  );


  ctx.beginPath();

  ctx.ellipse(
    s * 0.52,
    -s * 0.08,
    s * 0.65,
    s * 0.34 *
      wingScale,
    0.35,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();


  // Body

  ctx.fillStyle =
    "#d8e8b4";


  ctx.beginPath();

  ctx.ellipse(
    0,
    0,
    s * 0.17,
    s * 0.66,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  // Head

  ctx.beginPath();

  ctx.arc(
    0,
    -s * 0.54,
    s * 0.18,
    0,
    Math.PI * 2
  );

  ctx.fill();


  // Antennae

  ctx.strokeStyle =
    moth.color;

  ctx.lineWidth =
    1;


  ctx.beginPath();

  ctx.moveTo(
    -2,
    -s * 0.62
  );

  ctx.quadraticCurveTo(
    -s * 0.35,
    -s * 0.9,
    -s * 0.48,
    -s
  );


  ctx.moveTo(
    2,
    -s * 0.62
  );

  ctx.quadraticCurveTo(
    s * 0.35,
    -s * 0.9,
    s * 0.48,
    -s
  );

  ctx.stroke();


  // Tiny relay-like body detail

  ctx.fillStyle =
    "#172013";


  ctx.fillRect(
    -1,
    -s * 0.2,
    2,
    s * 0.28
  );


  ctx.restore();

}


// =========================================================
// PLAYER — GRACE HOPPER AVATAR
// =========================================================

function drawGraceHopper(
  x,
  y
) {

  ctx.save();

  ctx.translate(
    x,
    y
  );


  // Halo / targeting circle

  ctx.strokeStyle =
    "rgba(210,230,160,0.2)";

  ctx.lineWidth =
    1;

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    27,
    0,
    Math.PI * 2
  );

  ctx.stroke();


  // Body

  ctx.fillStyle =
    "#35402c";


  ctx.fillRect(
    -8,
    5,
    16,
    20
  );


  // Head

  ctx.fillStyle =
    "#d1bd98";


  ctx.beginPath();

  ctx.arc(
    0,
    -8,
    10,
    0,
    Math.PI * 2
  );

  ctx.fill();


  // Hair

  ctx.fillStyle =
    "#77705e";


  ctx.beginPath();

  ctx.arc(
    0,
    -11,
    10,
    Math.PI,
    Math.PI * 2
  );

  ctx.fill();


  // Glasses

  ctx.strokeStyle =
    "#1d211a";

  ctx.lineWidth =
    1;


  ctx.strokeRect(
    -8,
    -10,
    6,
    5
  );


  ctx.strokeRect(
    2,
    -10,
    6,
    5
  );


  ctx.beginPath();

  ctx.moveTo(
    -2,
    -8
  );

  ctx.lineTo(
    2,
    -8
  );

  ctx.stroke();


  // Arms / swatter stance

  ctx.strokeStyle =
    "#d1bd98";

  ctx.lineWidth =
    4;

  ctx.lineCap =
    "round";


  ctx.beginPath();

  ctx.moveTo(
    -6,
    9
  );

  ctx.lineTo(
    -20,
    0
  );

  ctx.moveTo(
    6,
    9
  );

  ctx.lineTo(
    20,
    -1
  );

  ctx.stroke();


  // Swatter

  ctx.strokeStyle =
    "#9c8b65";

  ctx.lineWidth =
    2;


  ctx.beginPath();

  ctx.moveTo(
    17,
    -3
  );

  ctx.lineTo(
    31,
    -17
  );

  ctx.stroke();


  ctx.strokeStyle =
    "#c7bb91";

  ctx.lineWidth =
    2;


  ctx.strokeRect(
    27,
    -22,
    9,
    7
  );


  ctx.restore();

}


// =========================================================
// CLICK HANDLING
// =========================================================

canvas.addEventListener(
  "click",
  handleCanvasClick
);


function handleCanvasClick(
  event
) {

  if (!game.running) {
    return;
  }


  const rect =
    canvas.getBoundingClientRect();


  const x =
    event.clientX -
    rect.left;

  const y =
    event.clientY -
    rect.top;


  showSwatIndicator(
    x,
    y
  );


  playSound(
    "swing",
    0.5
  );


  let hit =
    false;


  for (
    let i =
      game.moths.length - 1;

    i >= 0;

    i--
  ) {

    const moth =
      game.moths[i];


    if (
      moth.behavior ===
        "blink" &&
      !moth.blinkVisible
    ) {

      continue;

    }


    const dx =
      x -
      moth.x;

    const dy =
      y -
      moth.y;


    const distance =
      Math.sqrt(
        dx * dx +
        dy * dy
      );


    if (
      distance <
      moth.size *
      1.65
    ) {

      game.moths.splice(
        i,
        1
      );


      registerHit();

      hit =
        true;

      break;

    }

  }


  if (!hit) {

    // Grace swings heroically
    // at absolutely nothing.

  }

}


// =========================================================
// SWAT INDICATOR
// =========================================================

function showSwatIndicator(
  x,
  y
) {

  swatIndicator.style.left =
    `${x}px`;

  swatIndicator.style.top =
    `${y}px`;


  swatIndicator.classList.remove(
    "active"
  );


  void swatIndicator.offsetWidth;


  swatIndicator.classList.add(
    "active"
  );

}


// =========================================================
// REGISTER HIT
// =========================================================

function registerHit() {

  game.score++;


  playSound(
    "hit",
    0.75
  );


  hitFlash.classList.remove(
    "active"
  );


  void hitFlash.offsetWidth;


  hitFlash.classList.add(
    "active"
  );


  screen1947.classList.remove(
    "screen-shake"
  );


  void screen1947.offsetWidth;


  screen1947.classList.add(
    "screen-shake"
  );


  // Difficulty

  game.difficulty =
    1 +
    game.score *
    0.08;


  game.spawnInterval =
    Math.max(
      650,
      1500 -
      game.score *
      75
    );


  updateStats();


  if (
    game.score >=
    SWATS_TO_WIN
  ) {

    winGame();

  }

}


// =========================================================
// STATS
// =========================================================

function updateStats() {

  scoreElement.textContent =
    game.score;

  livesElement.textContent =
    game.lives;

}


// =========================================================
// ANNOUNCEMENT
// =========================================================

function announceMoth(
  errorType
) {

  const definition =
    MOTH_TYPES[
      errorType
    ] ||
    MOTH_TYPES.UnknownError;


  mothAnnouncement.style.opacity =
    "0";


  setTimeout(
    () => {

      mothAnnouncement.textContent =
        `Beware! The ${definition.name} doth descend!`;

      mothAnnouncement.style.opacity =
        "1";

    },
    60
  );

}


// =========================================================
// MOCKERY GENERATOR
// Shared system used by:
// - spawn banners
// - logbook
// - rank-up jabs
// =========================================================

const MOCKERY = {

  openers: [

    "Hark!",
    "Attend!",
    "Lo!",
    "Mark well!",
    "Behold!",
    "Let the record show!",
    "Hearken, thou operator!"

  ],


  adjectives: [

    "foolish",
    "hapless",
    "ill-starred",
    "wayward",
    "misguided",
    "overconfident",
    "woefully curious"

  ],


  nouns: [

    "programmer",
    "keeper of the relays",
    "tender of the tubes",
    "scribe of the machine",
    "wanderer of the syntax",
    "summoner of errors"

  ],


  contexts: [

    "the ancient apparatus",
    "the sacred relay",
    "the trembling vacuum tubes",
    "the electromagnetic kingdom",
    "the most unreasonable computer",
    "this cursed computation"

  ]

};


function choose(
  array
) {

  return array[
    Math.floor(
      Math.random() *
      array.length
    )
  ];

}


function generateMockery(
  errorType,
  style = "logbook"
) {

  const definition =
    MOTH_TYPES[
      errorType
    ] ||
    MOTH_TYPES.UnknownError;


  const opener =
    choose(
      MOCKERY.openers
    );

  const adjective =
    choose(
      MOCKERY.adjectives
    );

  const noun =
    choose(
      MOCKERY.nouns
    );

  const context =
    choose(
      MOCKERY.contexts
    );


  if (
    style ===
    "spawn"
  ) {

    return (
      `${opener} The ${definition.name} ` +
      `doth descend upon ${context}!`
    );

  }


  if (
    style ===
    "rank"
  ) {

    return (
      `${opener} ${adjective} ${noun}, ` +
      `thy swatting prowess hath now ` +
      `exceeded what ${context} reasonably deserved.`
    );

  }


  const templates = [

    `${opener} On this eve did the ` +
    `${definition.name} beset ${context}, ` +
    `and was struck down in glorious combat. ` +
    `Let it be known that the programmer's ` +
    `folly remaineth entirely his own to discover.`,

    `${opener} The ${definition.name} hath fallen. ` +
    `The ${adjective} ${noun} hath prevailed. ` +
    `Yet concerning the original ${errorType}, ` +
    `this logbook offereth precisely no assistance.`,

    `${opener} A ${definition.name} arose from ` +
    `the ${errorType} and challenged the relay. ` +
    `The beast is vanquished. ` +
    `The cause of the calamity remaineth gloriously concealed.`,

    `${opener} Upon ${context} there occurred ` +
    `a most inconvenient ${errorType}. ` +
    `The insect hath been punished for it, ` +
    `though whether the programmer hath learned ` +
    `anything is doubtful.`

  ];


  return choose(
    templates
  );

}


// =========================================================
// PERSISTENT LOGBOOK
// =========================================================

function loadLogbook() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (!saved) {
      return [];
    }


    const parsed =
      JSON.parse(
        saved
      );


    return Array.isArray(
      parsed
    )
      ? parsed
      : [];

  }

  catch (error) {

    console.warn(
      "Could not load logbook:",
      error
    );

    return [];

  }

}


function saveLogbook(
  entries
) {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        entries
      )
    );

  }

  catch (error) {

    console.warn(
      "Could not save logbook:",
      error
    );

  }

}


function addLogbookEntry(
  errorType
) {

  const entries =
    loadLogbook();


  const entry = {

    errorType,

    text:
      generateMockery(
        errorType,
        "logbook"
      ),

    date:
      new Date()
        .toLocaleString(),

    swats:
      game.score

  };


  entries.push(
    entry
  );


  saveLogbook(
    entries
  );


  return entry;

}


// =========================================================
// LOGBOOK UI
// =========================================================

let logbookIndex =
  0;


function openLogbook() {

  const entries =
    loadLogbook();


  logbookIndex =
    Math.max(
      0,
      entries.length - 1
    );


  renderLogbook();


  logbookOverlay.classList.remove(
    "hidden"
  );

}


function closeLogbookPanel() {

  logbookOverlay.classList.add(
    "hidden"
  );

}


function renderLogbook() {

  const entries =
    loadLogbook();


  if (
    entries.length === 0
  ) {

    logbookPageContent.innerHTML = `

      <div class="logbook-empty">

        The pages remaineth empty.

        <br><br>

        No moth hath yet been
        ceremonially defeated.

      </div>

    `;


    logbookCounter.textContent =
      "0 / 0";


    return;

  }


  logbookIndex =
    clamp(
      logbookIndex,
      0,
      entries.length - 1
    );


  const entry =
    entries[
      logbookIndex
    ];


  logbookPageContent.innerHTML = `

    <article class="logbook-entry">

      <div class="entry-number">
        ENTRY ${logbookIndex + 1}
      </div>

      <div class="entry-error">
        AFFLICTION: ${escapeHTML(
          entry.errorType
        )}
      </div>

      <div>
        ${escapeHTML(
          entry.text
        )}
      </div>

      <div class="entry-date">
        RECORDED: ${escapeHTML(
          entry.date
        )}
      </div>

    </article>

  `;


  logbookCounter.textContent =
    `${logbookIndex + 1} / ${entries.length}`;

}


function escapeHTML(
  value
) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    String(value);


  return div.innerHTML;

}


previousEntryBtn.addEventListener(
  "click",
  () => {

    const entries =
      loadLogbook();


    if (
      entries.length === 0
    ) {
      return;
    }


    logbookIndex--;

    if (
      logbookIndex < 0
    ) {

      logbookIndex =
        entries.length - 1;

    }


    renderLogbook();

  }
);


nextEntryBtn.addEventListener(
  "click",
  () => {

    const entries =
      loadLogbook();


    if (
      entries.length === 0
    ) {
      return;
    }


    logbookIndex++;

    if (
      logbookIndex >=
      entries.length
    ) {

      logbookIndex = 0;

    }


    renderLogbook();

  }
);


logbookBtn.addEventListener(
  "click",
  openLogbook
);


closeLogbook.addEventListener(
  "click",
  closeLogbookPanel
);


logbookOverlay.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      logbookOverlay
    ) {

      closeLogbookPanel();

    }

  }
);


// =========================================================
// RANK SYSTEM
// =========================================================

const RANKS = [

  {
    threshold: 0,

    title:
      "Groundling",

    jab:
      "Thou hast entered the machine. " +
      "This alone is not an achievement."
  },


  {
    threshold: 10,

    title:
      "Apprentice Relay-Sweeper",

    jab:
      "Thy swatter hand showeth promise, " +
      "though thy programming hand remaineth suspect."
  },


  {
    threshold: 25,

    title:
      "Ensign of the Vacuum Tube",

    jab:
      "The tubes acknowledge thy service. " +
      "They do not, however, trust thy code."
  },


  {
    threshold: 50,

    title:
      "Knight of the Flickering Filament",

    jab:
      "Rise, noble knight! Thou hast conquered " +
      "many moths and learned absolutely nothing " +
      "about debugging."
  },


  {
    threshold: 100,

    title:
      "Rear Admiral, Order of the Swatted Wing",

    jab:
      "The ancient machine bows before thee. " +
      "Somewhere, a compiler remaineth disappointed."
  }

];


function getCurrentRank(
  totalSwats
) {

  let current =
    RANKS[0];


  for (
    const rank of RANKS
  ) {

    if (
      totalSwats >=
      rank.threshold
    ) {

      current =
        rank;

    }

  }


  return current;

}


function loadRank() {

  try {

    return Number(
      localStorage.getItem(
        RANK_STORAGE_KEY
      ) || 0
    );

  }

  catch {

    return 0;

  }

}


function saveRank(
  threshold
) {

  try {

    localStorage.setItem(
      RANK_STORAGE_KEY,
      String(threshold)
    );

  }

  catch {

    // Ignore storage failure.

  }

}


function getTotalSwats() {

  const entries =
    loadLogbook();


  return entries.reduce(
    (
      total,
      entry
    ) => {

      return (
        total +
        Number(
          entry.swats || 0
        )
      );

    },
    0
  );

}


// =========================================================
// RANK-UP CHECK
// =========================================================

function checkRankUp() {

  const entries =
    loadLogbook();


  const totalSwats =
    entries.reduce(
      (
        total,
        entry
      ) => {

        return (
          total +
          Number(
            entry.swats || 0
          )
        );

      },
      0
    );


  const currentRank =
    getCurrentRank(
      totalSwats
    );


  const savedThreshold =
    loadRank();


  if (
    currentRank.threshold >
    savedThreshold
  ) {

    saveRank(
      currentRank.threshold
    );


    showRankUp(
      currentRank
    );

  }

}


function showRankUp(
  rank
) {

  rankTitle.textContent =
    rank.title;


  rankJab.textContent =
    generateMockery(
      game.errorType,
      "rank"
    ) +
    " " +
    rank.jab;


  rankOverlay.classList.remove(
    "hidden"
  );


  playSound(
    "fanfare",
    0.8
  );

}


rankDismiss.addEventListener(
  "click",
  () => {

    rankOverlay.classList.add(
      "hidden"
    );

  }
);


// =========================================================
// WIN
// =========================================================

async function winGame() {

  if (
    !game.running ||
    game.endShown
  ) {

    return;

  }


  game.endShown =
    true;

  game.running =
    false;


  cancelAnimationFrame(
    game.animationId
  );


  playSound(
    "win",
    0.85
  );


  const entry =
    addLogbookEntry(
      game.errorType
    );


  await sleep(550);


  endSymbol.textContent =
    "✦";


  endHeading.textContent =
    "THOU HAST PREVAILED";


  endText.innerHTML =
    "The moth hath been vanquished." +
    "<br><br>" +
    "Yet the cause of thy original folly " +
    "remaineth entirely thy concern.";


  endEntry.textContent =
    entry.text;


  endOverlay.classList.remove(
    "hidden"
  );


  checkRankUp();

}


// =========================================================
// LOSS
// =========================================================

async function loseGame() {

  if (
    !game.running ||
    game.endShown
  ) {

    return;

  }


  game.endShown =
    true;

  game.running =
    false;


  cancelAnimationFrame(
    game.animationId
  );


  playSound(
    "loss",
    0.9
  );


  await sleep(550);


  endSymbol.textContent =
    "☠";


  endHeading.textContent =
    "THOU HAST BEEN BESTED";


  endText.innerHTML =
    "LET THE LOGBOOK SHOW:" +
    "<br><br>" +
    "THOU HAST BEEN BESTED " +
    "BY A MOTH.";


  endEntry.textContent =
    "No useful information shall be " +
    "provided concerning the original " +
    "error. Such knowledge would be " +
    "entirely contrary to the purpose " +
    "of this machine.";


  endOverlay.classList.remove(
    "hidden"
  );

}


// =========================================================
// END GAME DISMISS
// =========================================================

endDismiss.addEventListener(
  "click",
  () => {

    endOverlay.classList.add(
      "hidden"
    );


    rankOverlay.classList.add(
      "hidden"
    );


    returnToPresent();

  }
);


// =========================================================
// RETURN TO PRESENT
// =========================================================

function returnToPresent() {

  game.running =
    false;

  game.endShown =
    false;

  game.moths =
    [];


  cancelAnimationFrame(
    game.animationId
  );


  screen1947.classList.remove(
    "active"
  );


  screenPresent.classList.add(
    "active"
  );


  editorStatus.textContent =
    "Ready";


  runBtn.disabled =
    false;

  runBtn.textContent =
    "Run";


  mothAnnouncement.textContent =
    "";


  updateStats();

}


// =========================================================
// ESCAPE KEY
// =========================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      if (
        !logbookOverlay.classList.contains(
          "hidden"
        )
      ) {

        closeLogbookPanel();

      }

    }

  }
);


// =========================================================
// INITIALIZATION
// =========================================================

console.log(
  "======================================"
);

console.log(
  "GRACE HOPPER BUG HUNT"
);

console.log(
  "Frontend initialized."
);

console.log(
  "Persistent logbook entries:",
  loadLogbook().length
);

console.log(
  "======================================"
);