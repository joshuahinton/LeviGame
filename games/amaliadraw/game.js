// =====================================================================
//  AMALIADRAW
//
//  Learn to draw, one step at a time!
//   Part 1: draw over the dots on the iPad.
//   Part 2: draw the same picture on paper, then take a photo of it.
//  Everything you draw goes in your Journal.
//
//  The lessons (and how to make new ones) are in lessons.js.
//
//  👇 CHANGE THESE to make it your own! 👇
// =====================================================================

const SETTINGS = {
  inkColor: "#2b2b2b",
  inkWidth: 1.4,      // how thick your pencil line is
  closeEnough: 7,     // how near the dots you need to draw (bigger = easier)
  freeColors: ["#2b2b2b", "#e8463c", "#ff8a1e", "#ffd23c", "#2ebd6b", "#3d8bff", "#9b51e0", "#8d5a3b", "#ff7eb6"],
};

// =====================================================================
//  The code is in parts:
//    1. Saving your progress and journal
//    2. Drawing pads (the white squares you draw on)
//    3. The lessons screen
//    4. Part 1: drawing on the iPad
//    5. Part 2: drawing on paper
//    6. The journal
//    7. Free draw
//    8. Pop-ups and messages
// =====================================================================

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------
//  1. SAVING YOUR PROGRESS AND JOURNAL
// ---------------------------------------------------------------------

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // the iPad's storage for this game is full
  }
}

// stars: best stars for each lesson.  paper: lessons you've done on paper
const progress = load("amaliaDrawProgress", { stars: {}, paper: {} });
const journal = load("amaliaDrawJournal", []);

function saveProgress() {
  save("amaliaDrawProgress", progress);
}

function addToJournal(entry) {
  journal.unshift({ ...entry, date: new Date().toLocaleDateString() });
  if (!save("amaliaDrawJournal", journal)) {
    journal.shift();
    showPopup("📒 Journal is full", "<p>Delete some old drawings from your Journal to make room.</p>", [["OK", "grey"]]);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------
//  2. DRAWING PADS
//  A pad is a square canvas. Positions on it go from 0 to 100,
//  whatever the size of the screen.
// ---------------------------------------------------------------------

function makePad(canvas, paint) {
  const pad = { canvas, ctx: canvas.getContext("2d"), size: 0, paint };

  pad.fit = () => {
    const stage = canvas.parentElement;
    const size = Math.max(100, Math.min(stage.clientWidth, stage.clientHeight) - 16);
    const scale = window.devicePixelRatio || 1;
    pad.size = size;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.width = size * scale;
    canvas.height = size * scale;
    // After this, drawing at (100, 100) means the bottom right corner
    pad.ctx.setTransform((size * scale) / 100, 0, 0, (size * scale) / 100, 0, 0);
    pad.redraw();
  };

  pad.redraw = () => {
    pad.ctx.clearRect(0, 0, 100, 100);
    pad.paint(pad.ctx);
  };

  // Turn a finger position into a 0-100 position on the pad
  pad.toPad = (event) => {
    const box = canvas.getBoundingClientRect();
    return [((event.clientX - box.left) / box.width) * 100, ((event.clientY - box.top) / box.height) * 100];
  };

  return pad;
}

// Lets you draw lines on a pad with a finger or Apple Pencil
function letDrawOn(pad, onStart, onFinish) {
  let stroke = null;
  pad.canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    pad.canvas.setPointerCapture(event.pointerId);
    stroke = [pad.toPad(event)];
    onStart(stroke);
    pad.redraw();
  });
  pad.canvas.addEventListener("pointermove", (event) => {
    if (!stroke) return;
    event.preventDefault();
    // Apple Pencil sends extra in-between points: use them for smooth lines
    const events = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
    for (const e of events.length ? events : [event]) {
      const point = pad.toPad(e);
      const last = stroke[stroke.length - 1];
      if (Math.hypot(point[0] - last[0], point[1] - last[1]) > 0.3) stroke.push(point);
    }
    pad.redraw();
  });
  const finish = () => {
    if (!stroke) return;
    const done = stroke;
    stroke = null;
    onFinish(done);
    pad.redraw();
  };
  pad.canvas.addEventListener("pointerup", finish);
  pad.canvas.addEventListener("pointercancel", finish);
}

function drawLine(ctx, points, color, width, dashed = false) {
  if (points.length === 0) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash(dashed ? [1.5, 2.5] : []);
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  if (points.length === 1) ctx.lineTo(points[0][0] + 0.01, points[0][1]);
  for (const p of points) ctx.lineTo(p[0], p[1]);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Points every `gap` along a line, so lines can be compared fairly
function spreadOut(points, gap) {
  if (points.length < 2) return points.slice();
  const result = [points[0]];
  let carried = 0;
  for (let i = 1; i < points.length; i++) {
    let [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    let length = Math.hypot(x1 - x0, y1 - y0);
    while (carried + length >= gap) {
      const t = (gap - carried) / length;
      x0 += (x1 - x0) * t;
      y0 += (y1 - y0) * t;
      result.push([x0, y0]);
      length = Math.hypot(x1 - x0, y1 - y0);
      carried = 0;
    }
    carried += length;
  }
  const last = points[points.length - 1];
  const end = result[result.length - 1];
  if (Math.hypot(last[0] - end[0], last[1] - end[1]) > gap * 0.3) result.push(last);
  return result;
}

function showScreen(id) {
  for (const t of document.querySelectorAll(".toast")) t.remove();
  for (const s of document.querySelectorAll(".screen")) s.classList.add("hidden");
  $(id).classList.remove("hidden");
  for (const pad of [drawPad, paperPad, freePad]) {
    if (pad.canvas.closest(".screen").id === id) pad.fit();
  }
}

// ---------------------------------------------------------------------
//  3. THE LESSONS SCREEN
// ---------------------------------------------------------------------

const HELP_NAMES = { trace: "✏️ Trace it", dots: "🔢 Dot to dot", few: "🤔 Tricky dots" };

function showLessons() {
  const grid = $("lessonGrid");
  grid.innerHTML = "";
  LESSONS.forEach((lesson, n) => {
    const unlocked = n === 0 || progress.stars[LESSONS[n - 1].id] > 0;
    const stars = progress.stars[lesson.id] || 0;
    const card = document.createElement("div");
    card.className = unlocked ? "card" : "card locked";
    card.innerHTML = `
      <div class="big">${unlocked ? lesson.emoji : "🔒"}</div>
      <div class="name">${lesson.name}</div>
      <div class="help">${HELP_NAMES[lesson.help]}</div>
      <div class="stars">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)} ${progress.paper[lesson.id] ? "📄✅" : ""}</div>`;
    card.addEventListener("click", () => {
      if (unlocked) startLesson(lesson);
      else showPopup("🔒 Not yet!", `<p>Finish <b>${LESSONS[n - 1].name}</b> first to unlock this one.</p>`, [["OK", "grey"]]);
    });
    grid.appendChild(card);
  });
  showScreen("lessonsScreen");
}

// ---------------------------------------------------------------------
//  4. PART 1: DRAWING ON THE IPAD
//  Each step shows dots to draw over. When you lift your finger,
//  we check how close your lines are to the dots.
// ---------------------------------------------------------------------

let lesson = null;
let stepNumber = 0;
let ink = [];       // your lines for each step
let stepStars = []; // stars you got for each step
let tries = 0;
let stepDone = false;

const DOT_GAP = { trace: 11, dots: 9, few: 22 };

function startLesson(chosen) {
  lesson = chosen;
  // Work out the guide points and dots for every step
  for (const step of lesson.steps) {
    step.guide = step.lines.map((l) => spreadOut(l, 1));
    step.dots = [];
    for (const l of step.lines) {
      // Space the dots evenly from start to end
      let length = 0;
      for (let i = 1; i < l.length; i++) length += Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]);
      const gap = length / Math.max(1, Math.round(length / DOT_GAP[lesson.help]));
      const dots = spreadOut(l, gap * 0.999);
      const first = dots[0];
      const last = dots[dots.length - 1];
      const closedLoop = dots.length > 2 && Math.hypot(first[0] - last[0], first[1] - last[1]) < 2;
      if (closedLoop) dots.pop();
      step.dots.push(dots);
    }
  }
  stepNumber = 0;
  ink = lesson.steps.map(() => []);
  stepStars = [];
  startStep();
  showScreen("drawScreen");
}

function startStep() {
  tries = 0;
  stepDone = false;
  const step = lesson.steps[stepNumber];
  $("drawTitle").textContent = `${lesson.emoji} ${lesson.name} · Step ${stepNumber + 1} of ${lesson.steps.length}`;
  $("drawText").textContent = step.say;
  drawPad.redraw();
}

function paintLesson(ctx) {
  if (!lesson) return;
  const step = lesson.steps[stepNumber];

  // The help for this step: a dotted line, then the numbered dots
  if (lesson.help === "trace" && !stepDone) {
    for (const l of step.lines) drawLine(ctx, l, "#b9c6da", 1.2, true);
  }

  // Your lines
  ink.forEach((strokes, n) => {
    if (n > stepNumber) return;
    for (const s of strokes) drawLine(ctx, s, SETTINGS.inkColor, SETTINGS.inkWidth);
  });

  if (stepDone) return;
  let number = 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const dots of step.dots) {
    dots.forEach(([x, y], i) => {
      const isStart = i === 0;
      ctx.fillStyle = isStart ? "#2ebd6b" : "#3d8bff";
      ctx.beginPath();
      ctx.arc(x, y, isStart ? 1.6 : 1.1, 0, Math.PI * 2);
      ctx.fill();
      if (lesson.help !== "trace") {
        ctx.font = "bold 2.6px system-ui, sans-serif";
        ctx.fillStyle = "#7a8aa6";
        ctx.fillText(number, x + 2.4, y - 2.2);
      }
      number++;
    });
  }
}

// How good is this step? Returns how much of the dots you covered,
// and how much of your drawing was near where it should be.
function checkStep() {
  const step = lesson.steps[stepNumber];
  const yours = ink[stepNumber].flatMap((s) => spreadOut(s, 1));
  if (yours.length === 0) return { covered: 0, neat: 0 };
  const guide = step.guide.flat();
  const allGuide = lesson.steps.slice(0, stepNumber + 1).flatMap((s) => s.guide.flat());
  const near = (p, list, distance) => list.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < distance);
  const covered = guide.filter((p) => near(p, yours, SETTINGS.closeEnough)).length / guide.length;
  const neat = yours.filter((p) => near(p, allGuide, SETTINGS.closeEnough * 1.5)).length / yours.length;
  return { covered, neat };
}

// When you lift your finger: if it's really good, go straight on
function afterStroke() {
  const { covered, neat } = checkStep();
  if (covered >= 0.85 && neat >= 0.7) passStep(covered, neat);
}

// When you press "Done"
function doneButton() {
  if (stepDone) return;
  if (ink[stepNumber].length === 0) {
    toast("Draw over the dots first!", true);
    return;
  }
  const { covered, neat } = checkStep();
  if (covered >= 0.6 && neat >= 0.5) {
    passStep(covered, neat);
    return;
  }
  tries++;
  if (tries >= 2) {
    passStep(0, 0); // good try! keep going anyway
    return;
  }
  toast(covered < 0.6 ? "Nearly! Go over ALL the dots 🔵" : "Oops! Try to stay near the dots", true);
  ink[stepNumber] = [];
  drawPad.redraw();
}

function passStep(covered, neat) {
  stepDone = true;
  const score = covered * neat;
  const stars = score >= 0.8 ? 3 : score >= 0.6 ? 2 : 1;
  stepStars.push(stars);
  toast(stars === 3 ? "⭐⭐⭐ Amazing!" : stars === 2 ? "⭐⭐ Great!" : "⭐ Good try!");
  drawPad.redraw();
  setTimeout(() => {
    if (stepNumber + 1 < lesson.steps.length) {
      stepNumber++;
      startStep();
    } else {
      finishLesson();
    }
  }, 900);
}

function finishLesson() {
  const average = stepStars.reduce((a, b) => a + b, 0) / stepStars.length;
  const stars = Math.max(1, Math.round(average));
  progress.stars[lesson.id] = Math.max(progress.stars[lesson.id] || 0, stars);
  saveProgress();

  const picture = snapshot((ctx) => ink.forEach((strokes) => strokes.forEach((s) => drawLine(ctx, s, SETTINGS.inkColor, SETTINGS.inkWidth))));
  addToJournal({ kind: "ipad", lesson: lesson.id, name: lesson.name, emoji: lesson.emoji, img: picture });

  showPopup(
    `Ta-da! ${"⭐".repeat(stars)}`,
    `<p>You drew a ${lesson.name}!</p><img src="${picture}" alt=""><p>Now get a pencil and paper, and try it for real!</p>`,
    [
      ["📄 Part 2: On paper", "green", () => startPaper(lesson)],
      ["Lessons", "grey", showLessons],
    ]
  );
}

// Makes a little picture of a drawing to keep in the journal
function snapshot(paint) {
  const c = document.createElement("canvas");
  c.width = 500;
  c.height = 500;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 500, 500);
  ctx.scale(5, 5);
  paint(ctx);
  return c.toDataURL("image/jpeg", 0.75);
}

// ---------------------------------------------------------------------
//  5. PART 2: DRAWING ON PAPER
//  The iPad shows each step, with the new lines in orange.
//  You copy them onto paper, then take a photo.
// ---------------------------------------------------------------------

let paperStep = -1; // -1 means "get your paper ready"

function startPaper(chosen) {
  lesson = chosen;
  paperStep = -1;
  showPaperStep();
  showScreen("paperScreen");
}

function showPaperStep() {
  const steps = lesson.steps;
  if (paperStep < 0) {
    $("paperTitle").textContent = `${lesson.emoji} ${lesson.name} · Part 2`;
    $("paperText").textContent = "Get some paper and a pencil! ✏️📄";
  } else {
    $("paperTitle").textContent = `${lesson.emoji} ${lesson.name} · Step ${paperStep + 1} of ${steps.length}`;
    $("paperText").textContent = steps[paperStep].say;
  }
  $("paperPrev").style.visibility = paperStep < 0 ? "hidden" : "visible";
  $("paperNext").textContent = paperStep === steps.length - 1 ? "📸 I'm done! Take a photo" : paperStep < 0 ? "Let's go! ▶" : "Next ▶";
  paperPad.redraw();
}

function paintPaper(ctx) {
  if (!lesson) return;
  lesson.steps.forEach((step, n) => {
    // Before you start, show the whole picture. Then build it up step by step.
    const show = paperStep < 0 || n <= paperStep;
    if (!show) return;
    const isNew = n === paperStep;
    for (const l of step.lines) drawLine(ctx, l, isNew ? "#ff8a1e" : "#3a3a3a", isNew ? 2 : 1.2);
  });
}

function paperNext() {
  if (paperStep < lesson.steps.length - 1) {
    paperStep++;
    showPaperStep();
    return;
  }
  showPopup(
    "📸 Take a photo",
    "<p>Take a photo of your paper drawing to keep in your Journal.</p>",
    [
      ["📸 Take photo", "green", () => $("photoInput").click()],
      ["Skip", "grey", () => paperFinished(null)],
    ]
  );
}

$("photoInput").addEventListener("change", () => {
  const file = $("photoInput").files[0];
  $("photoInput").value = "";
  if (!file) return;
  const image = new Image();
  image.onload = () => {
    // Make the photo smaller so lots of them fit in the journal
    const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
    const c = document.createElement("canvas");
    c.width = Math.round(image.width * scale);
    c.height = Math.round(image.height * scale);
    c.getContext("2d").drawImage(image, 0, 0, c.width, c.height);
    URL.revokeObjectURL(image.src);
    paperFinished(c.toDataURL("image/jpeg", 0.7));
  };
  image.src = URL.createObjectURL(file);
});

function paperFinished(photo) {
  progress.paper[lesson.id] = true;
  saveProgress();
  let saved = false;
  if (photo) saved = addToJournal({ kind: "paper", lesson: lesson.id, name: lesson.name, emoji: lesson.emoji, img: photo });
  showPopup(
    "Amazing! 📄✅",
    saved ? `<img src="${photo}" alt=""><p>Your paper drawing is in your Journal.</p>` : `<p>Well done for drawing it on paper!</p>`,
    [
      ["📒 Journal", "orange", showJournal],
      ["Lessons", "green", showLessons],
    ]
  );
}

// ---------------------------------------------------------------------
//  6. THE JOURNAL
// ---------------------------------------------------------------------

const KIND_NAMES = { ipad: "✏️ iPad", paper: "📄 Paper", free: "🎨 Free draw" };

function showJournal() {
  const grid = $("journalGrid");
  grid.innerHTML = "";
  if (journal.length === 0) {
    grid.innerHTML = `<p class="empty">Nothing here yet. Finish a lesson and your drawings will appear here!</p>`;
  }
  journal.forEach((entry, n) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${entry.img}" alt="">
      <div class="name">${entry.emoji || "🎨"} ${entry.name || "My drawing"}</div>
      <div class="help">${KIND_NAMES[entry.kind]} · ${entry.date}</div>`;
    card.addEventListener("click", () =>
      showPopup(`${entry.emoji || "🎨"} ${entry.name || "My drawing"}`, `<img src="${entry.img}" alt=""><p>${KIND_NAMES[entry.kind]} · ${entry.date}</p>`, [
        ["Close", "grey"],
        ["🗑 Delete", "pink", () => {
          journal.splice(n, 1);
          save("amaliaDrawJournal", journal);
          showJournal();
        }],
      ])
    );
    grid.appendChild(card);
  });
  showScreen("journalScreen");
}

// ---------------------------------------------------------------------
//  7. FREE DRAW
// ---------------------------------------------------------------------

let freeStrokes = [];
let freeColor = SETTINGS.freeColors[0];
let freeThick = false;

function paintFree(ctx) {
  for (const s of freeStrokes) drawLine(ctx, s.points, s.color, s.width);
}

function buildSwatches() {
  const box = $("swatches");
  for (const color of SETTINGS.freeColors) {
    const b = document.createElement("button");
    b.className = color === freeColor ? "swatch chosen" : "swatch";
    b.style.background = color;
    b.addEventListener("click", () => {
      freeColor = color;
      for (const other of box.children) other.classList.remove("chosen");
      b.classList.add("chosen");
    });
    box.appendChild(b);
  }
}

// ---------------------------------------------------------------------
//  8. POP-UPS AND MESSAGES
// ---------------------------------------------------------------------

// buttons: a list of [label, colour, what to do when tapped]
function showPopup(title, html, buttons) {
  const back = document.createElement("div");
  back.className = "popup-back";
  back.innerHTML = `<div class="popup"><h2>${title}</h2>${html}<div class="buttons"></div></div>`;
  for (const [label, color, onTap] of buttons) {
    const b = document.createElement("button");
    b.className = color;
    b.textContent = label;
    b.addEventListener("click", () => {
      back.remove();
      if (onTap) onTap();
    });
    back.querySelector(".buttons").appendChild(b);
  }
  document.body.appendChild(back);
}

function toast(text, oops = false) {
  const t = document.createElement("div");
  t.className = oops ? "toast oops" : "toast";
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1400);
}

// ---------------------------------------------------------------------
//  Setting everything up
// ---------------------------------------------------------------------

const drawPad = makePad($("drawCanvas"), paintLesson);
const paperPad = makePad($("paperCanvas"), paintPaper);
const freePad = makePad($("freeCanvas"), paintFree);

letDrawOn(
  drawPad,
  (stroke) => {
    if (!stepDone) ink[stepNumber].push(stroke);
  },
  () => {
    if (!stepDone) afterStroke();
  }
);

letDrawOn(
  freePad,
  (stroke) => freeStrokes.push({ points: stroke, color: freeColor, width: freeThick ? 4 : 1.4 }),
  () => {}
);

$("undoButton").addEventListener("click", () => {
  if (stepDone) return;
  ink[stepNumber].pop();
  drawPad.redraw();
});
$("checkButton").addEventListener("click", doneButton);
$("drawBack").addEventListener("click", showLessons);

$("paperBack").addEventListener("click", showLessons);
$("paperPrev").addEventListener("click", () => {
  paperStep = Math.max(-1, paperStep - 1);
  showPaperStep();
});
$("paperNext").addEventListener("click", paperNext);

$("journalButton").addEventListener("click", showJournal);
$("journalBack").addEventListener("click", showLessons);

$("freeButton").addEventListener("click", () => showScreen("freeScreen"));
$("freeBack").addEventListener("click", showLessons);
$("freeUndo").addEventListener("click", () => {
  freeStrokes.pop();
  freePad.redraw();
});
$("freeSize").addEventListener("click", () => {
  freeThick = !freeThick;
  $("freeSize").textContent = freeThick ? "🖍️ Thick" : "✏️ Thin";
});
$("freeClear").addEventListener("click", () => {
  freeStrokes = [];
  freePad.redraw();
});
$("freeSave").addEventListener("click", () => {
  if (freeStrokes.length === 0) return toast("Draw something first!", true);
  const picture = snapshot(paintFree);
  if (addToJournal({ kind: "free", name: "Free drawing", emoji: "🎨", img: picture })) toast("💾 Saved to your Journal!");
});

window.addEventListener("resize", () => {
  for (const pad of [drawPad, paperPad, freePad]) {
    if (!pad.canvas.closest(".screen").classList.contains("hidden")) pad.fit();
  }
});

buildSwatches();
showLessons();
