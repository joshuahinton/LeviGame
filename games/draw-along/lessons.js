// =====================================================================
//  DRAW ALONG  -  the lessons
//
//  Every drawing is made of steps. Each step has some lines to draw.
//  The drawing area goes from 0 to 100 across and 0 to 100 down
//  (0, 0 is the top left corner).
//
//  help: how much help you get
//    "trace" = a dotted line AND numbered dots
//    "dots"  = numbered dots, like a dot-to-dot
//    "few"   = only a few dots. Tricky!
//
//  To add your own lesson, copy one and change the shapes!
// =====================================================================

// ---- Shape makers. Each one gives back a list of [x, y] points ----

// A circle. It starts at the top and goes round clockwise.
function circle(cx, cy, r) {
  return ellipse(cx, cy, r, r);
}

function ellipse(cx, cy, rx, ry) {
  const points = [];
  for (let i = 0; i <= 48; i++) {
    const a = -Math.PI / 2 + (i / 48) * Math.PI * 2;
    points.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return points;
}

// Part of a circle. Angles are in degrees: 0 = right, 90 = down.
function arc(cx, cy, r, fromAngle, toAngle) {
  const points = [];
  for (let i = 0; i <= 24; i++) {
    const a = ((fromAngle + ((toAngle - fromAngle) * i) / 24) * Math.PI) / 180;
    points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return points;
}

function line(x1, y1, x2, y2) {
  return [[x1, y1], [x2, y2]];
}

// Straight lines joining the points
function joinDots(points) {
  return points;
}

// A smooth bendy line that goes through every point
function curve(points) {
  const result = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    for (let t = 0; t < 1; t += 0.1) {
      const t2 = t * t;
      const t3 = t2 * t;
      const point = [0, 1].map((k) =>
        0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)
      );
      result.push(point);
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

// A fluffy cloud shape (for trees!)
function fluffy(cx, cy, r, bumps) {
  const points = [];
  for (let i = 0; i <= 96; i++) {
    const a = -Math.PI / 2 + (i / 96) * Math.PI * 2;
    const radius = r + Math.abs(Math.sin((a * bumps) / 2)) * r * 0.18;
    points.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
  }
  return points;
}

// A snail-shell spiral
function spiral(cx, cy, outer, inner, turns) {
  const points = [];
  const total = Math.round(turns * 48);
  for (let i = 0; i <= total; i++) {
    const t = i / total;
    const a = Math.PI / 2 + t * turns * Math.PI * 2;
    const r = outer + (inner - outer) * t;
    points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return points;
}

// ---- The lessons ----

const LESSONS = [
  {
    id: "sun",
    name: "Happy Sun",
    emoji: "☀️",
    help: "trace",
    steps: [
      { say: "Draw a big circle for the sun", lines: [circle(50, 50, 22)] },
      { say: "Two little eyes", lines: [circle(42, 45, 2.5), circle(58, 45, 2.5)] },
      { say: "A big smile", lines: [arc(50, 50, 12, 30, 150)] },
      {
        say: "Sunshine rays all the way round",
        lines: [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return line(50 + Math.cos(a) * 28, 50 + Math.sin(a) * 28, 50 + Math.cos(a) * 40, 50 + Math.sin(a) * 40);
        }),
      },
    ],
  },
  {
    id: "fish",
    name: "Fish",
    emoji: "🐟",
    help: "trace",
    steps: [
      { say: "A lemon shape for the body", lines: [curve([[20, 50], [45, 32], [72, 50]]), curve([[72, 50], [45, 68], [20, 50]])] },
      { say: "A triangle tail", lines: [joinDots([[72, 50], [88, 36], [88, 64], [72, 50]])] },
      { say: "An eye", lines: [circle(32, 47, 3)] },
      { say: "A fin in the middle", lines: [curve([[42, 42], [50, 50], [42, 58]])] },
      { say: "Bubbles!", lines: [circle(12, 36, 3), circle(9, 25, 2)] },
    ],
  },
  {
    id: "house",
    name: "House",
    emoji: "🏠",
    help: "trace",
    steps: [
      { say: "A square for the walls", lines: [joinDots([[25, 47], [25, 85], [75, 85], [75, 47], [25, 47]])] },
      { say: "A pointy roof", lines: [joinDots([[20, 49], [50, 18], [80, 49]])] },
      { say: "A door", lines: [joinDots([[44, 85], [44, 65], [56, 65], [56, 85]])] },
      {
        say: "Two windows",
        lines: [joinDots([[30, 53], [40, 53], [40, 62], [30, 62], [30, 53]]), joinDots([[60, 53], [70, 53], [70, 62], [60, 62], [60, 53]])],
      },
      { say: "A chimney", lines: [joinDots([[62, 30], [62, 20], [70, 20], [70, 37]])] },
    ],
  },
  {
    id: "cat",
    name: "Cat",
    emoji: "🐱",
    help: "dots",
    steps: [
      { say: "A big circle for the head", lines: [circle(50, 55, 25)] },
      { say: "Two pointy ears", lines: [joinDots([[30, 40], [30, 18], [45, 31]]), joinDots([[55, 31], [70, 18], [70, 40]])] },
      { say: "Two eyes", lines: [ellipse(41, 51, 3, 5), ellipse(59, 51, 3, 5)] },
      { say: "A nose and a smile", lines: [joinDots([[47, 60], [53, 60], [50, 64], [47, 60]]), curve([[42, 68], [46, 71], [50, 65], [54, 71], [58, 68]])] },
      { say: "Whiskers!", lines: [line(35, 62, 16, 58), line(35, 66, 16, 69), line(65, 62, 84, 58), line(65, 66, 84, 69)] },
    ],
  },
  {
    id: "tree",
    name: "Apple Tree",
    emoji: "🌳",
    help: "dots",
    steps: [
      { say: "A tree trunk", lines: [joinDots([[44, 90], [46, 62], [54, 62], [56, 90]])] },
      { say: "A fluffy top", lines: [fluffy(50, 40, 24, 8)] },
      { say: "Some apples", lines: [circle(40, 34, 3), circle(60, 42, 3), circle(52, 26, 3)] },
      { say: "Spiky grass", lines: [joinDots([[18, 90], [23, 83], [28, 90], [33, 83], [38, 90]]), joinDots([[62, 90], [67, 83], [72, 90], [77, 83], [82, 90]])] },
    ],
  },
  {
    id: "rocket",
    name: "Rocket",
    emoji: "🚀",
    help: "dots",
    steps: [
      { say: "The rocket body", lines: [curve([[40, 80], [39, 45], [50, 14], [61, 45], [60, 80]]), line(40, 80, 60, 80)] },
      { say: "A round window", lines: [circle(50, 45, 6)] },
      { say: "Two fins", lines: [joinDots([[40, 64], [28, 82], [40, 80]]), joinDots([[60, 64], [72, 82], [60, 80]])] },
      { say: "Fire!", lines: [curve([[43, 82], [46, 93], [50, 86], [54, 93], [57, 82]])] },
      { say: "Twinkly stars", lines: [line(16, 25, 24, 25), line(20, 21, 20, 29), line(76, 40, 84, 40), line(80, 36, 80, 44)] },
    ],
  },
  {
    id: "snail",
    name: "Snail",
    emoji: "🐌",
    help: "few",
    steps: [
      { say: "A swirly shell", lines: [spiral(57, 52, 22, 3, 2.25)] },
      { say: "A long body", lines: [curve([[80, 74], [50, 77], [22, 74], [14, 62], [21, 55], [31, 66]])] },
      { say: "Two feelers", lines: [line(18, 57, 13, 43), circle(13, 41, 2), line(23, 56, 25, 42), circle(25, 40, 2)] },
    ],
  },
  {
    id: "owl",
    name: "Owl",
    emoji: "🦉",
    help: "few",
    steps: [
      { say: "An egg shape for the body", lines: [ellipse(50, 56, 24, 30)] },
      { say: "Pointy ear tufts", lines: [joinDots([[32, 36], [34, 22], [42, 29]]), joinDots([[58, 29], [66, 22], [68, 36]])] },
      { say: "Big round eyes", lines: [circle(40, 45, 8), circle(60, 45, 8)] },
      { say: "Pupils and a beak", lines: [circle(40, 46, 2.5), circle(60, 46, 2.5), joinDots([[47, 54], [53, 54], [50, 61], [47, 54]])] },
      { say: "Wings", lines: [curve([[28, 50], [22, 63], [31, 76]]), curve([[72, 50], [78, 63], [69, 76]])] },
      { say: "Little feet", lines: [line(42, 85, 40, 92), line(45, 86, 45, 92), line(55, 86, 55, 92), line(58, 85, 60, 92)] },
    ],
  },
  {
    id: "dog",
    name: "Puppy",
    emoji: "🐶",
    help: "few",
    steps: [
      { say: "An oval for the head", lines: [ellipse(50, 52, 22, 24)] },
      { say: "Floppy ears", lines: [curve([[33, 36], [20, 44], [17, 64], [27, 68], [31, 52]]), curve([[67, 36], [80, 44], [83, 64], [73, 68], [69, 52]])] },
      { say: "Two eyes", lines: [circle(42, 47, 3), circle(58, 47, 3)] },
      { say: "A nose", lines: [ellipse(50, 58, 5, 3.5)] },
      { say: "A mouth", lines: [line(50, 61.5, 50, 66), curve([[42, 64], [46, 68.5], [50, 66], [54, 68.5], [58, 64]])] },
      { say: "A tongue", lines: [curve([[47, 68], [47, 75], [50, 77], [53, 75], [53, 68]])] },
    ],
  },
];
