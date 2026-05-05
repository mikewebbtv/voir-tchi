/**
 * Voir-tchi BMP Renderer v15
 *
 * Compact pixel character with animation frames.
 * BMP = character only (centered). Dialogue/stats via SDK text.
 * Solid blob head with cutout eyes/mouth — Game Boy style.
 *
 * Grid: 10w × 12h, scale 6x = 60×72 on display
 */

type Pixel = [number, number];

function rect(x: number, y: number, w: number, h: number): Pixel[] {
  const p: Pixel[] = [];
  for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < h; dy++) p.push([x + dx, y + dy]);
  return p;
}

// ─── Character Sprites ───
// Solid round head with cutout (black) eyes + mouth.
// On 1-bit display: green blob with black holes = readable face.
// Grid: 10 wide × 12 tall

// Full head fill (round blob)
const HEAD_FILL: Pixel[] = [
  ...rect(2, 0, 6, 1),  // top
  ...rect(1, 1, 8, 1),  // upper
  ...rect(0, 2, 10, 1), // mid-upper
  ...rect(0, 3, 10, 1), // widest
  ...rect(0, 4, 10, 1),
  ...rect(0, 5, 10, 1),
  ...rect(0, 6, 10, 1),
  ...rect(0, 7, 10, 1),
  ...rect(1, 8, 8, 1),  // lower
  ...rect(2, 9, 6, 1),  // chin
];

// Body (small, under head)
const BODY: Pixel[] = [
  ...rect(3, 10, 4, 1),  // neck
  ...rect(2, 11, 6, 1),  // body
  ...rect(1, 11, 1, 1),  // left arm
  ...rect(8, 11, 1, 1),  // right arm
  ...rect(2, 12, 2, 1),  // left foot
  ...rect(6, 12, 2, 1),  // right foot
];

// ─── Expression Definitions ───
// eyes + mouth = HOLES (pixels that should be BLACK/transparent)
// extras = additional green pixels OUTSIDE the head (sweat, Zzz, etc.)

interface ExprDef {
  eyes: Pixel[];
  mouth: Pixel[];
  extras: Pixel[];
}

const EXPRESSIONS: Record<string, ExprDef> = {
  happy: {
    eyes: [[2, 4], [3, 4], [6, 4], [7, 4]],
    mouth: [[3, 7], [4, 7], [5, 7], [6, 7]],
    extras: [],
  },
  hungry: {
    eyes: [[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4]], // wide worried
    mouth: [[4, 7], [5, 7]], // tiny o
    extras: [[10, 1], [11, 2]], // sweat drop
  },
  sad: {
    eyes: [[2, 5], [3, 5], [6, 5], [7, 5]], // low eyes
    mouth: [[3, 8], [6, 8], [4, 9], [5, 9]], // frown
    extras: [[0, 5], [0, 6]], // tear
  },
  tired: {
    eyes: [[2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5]], // closed line
    mouth: [[4, 7], [5, 7]], // tiny
    extras: [[10, 0], [11, 1], [12, 0]], // Zzz
  },
  working: {
    eyes: [[2, 4], [3, 4], [6, 4], [7, 4]], // focused
    mouth: [[4, 7], [5, 7], [6, 7]], // small line
    extras: [...rect(0, 0, 10, 1), ...rect(0, 0, 1, 4), ...rect(9, 0, 1, 4)], // screen/helmet outline
  },
  creative: {
    eyes: [[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4]], // wide star
    mouth: [[3, 7], [4, 7], [5, 7], [6, 7], [7, 7]], // big grin
    extras: [[0, 0], [9, 0]], // sparkles
  },
  dead: {
    eyes: [[2, 4], [3, 5], [3, 4], [2, 5], [6, 4], [7, 5], [7, 4], [6, 5]], // X eyes
    mouth: [[3, 7], [4, 7], [5, 7], [6, 7]], // flat
    extras: [],
  },
};

// ─── Animation Frames ───
// Idle: 3 frames — normal, slight bounce up, blink
// Each frame is a full pixel set for that animation state

function buildFramePixels(expr: string, animFrame: number): Pixel[] {
  const def = EXPRESSIONS[expr] || EXPRESSIONS.happy;
  const holes = new Set<string>();
  for (const [x, y] of [...def.eyes, ...def.mouth]) holes.add(`${x},${y}`);

  const result: Pixel[] = [];
  const seen = new Set<string>();
  const add = (x: number, y: number) => {
    if (holes.has(`${x},${y}`)) return;
    const k = `${x},${y}`;
    if (seen.has(k)) return;
    seen.add(k);
    result.push([x, y]);
  };

  // Animation: frame 0 = normal, frame 1 = bounce up 1px, frame 2 = blink
  const offsetY = animFrame === 1 ? -1 : 0;
  const isBlink = animFrame === 2;

  // Head (shifted for bounce)
  for (const [x, y] of HEAD_FILL) add(x, y + offsetY);

  // Body (doesn't move in bounce — anchored)
  for (const [x, y] of BODY) add(x, y);

  // Blink override: if blink frame, replace eye holes with closed-eye line
  if (isBlink) {
    // Remove normal eye holes, add closed-eye line pixels (these ARE green)
    // Closed eyes = thin line where eyes were
    const closedEyes: Pixel[] = [
      [2, 4 + offsetY], [3, 4 + offsetY], // left closed
      [6, 4 + offsetY], [7, 4 + offsetY], // right closed
    ];
    // These pixels ARE in the head fill area but we want them GREEN (not holes)
    // Since blink removes eye holes and adds green lines, we need to:
    // 1. NOT add eye positions to holes
    // 2. Add closed-eye pixels as green
    // Easier: rebuild without eye holes for blink frame
    // Actually — let's just rebuild for blink specially
  }

  // Extras
  for (const [x, y] of def.extras) add(x, y);

  return result;
}

// Better: separate blink frame logic
function buildPixels(expr: string, animFrame: number = 0): Pixel[] {
  const def = EXPRESSIONS[expr] || EXPRESSIONS.happy;
  const isBlink = animFrame === 2;
  const offsetY = animFrame === 1 ? -1 : 0;

  // Holes set (eyes + mouth that should be BLACK)
  // For blink frame: don't make eyes holes (they'll be drawn as lines instead)
  const holes = new Set<string>();
  if (!isBlink) {
    for (const [x, y] of def.eyes) holes.add(`${x},${y}`);
  }
  for (const [x, y] of def.mouth) holes.add(`${x},${y + offsetY}`);

  const result: Pixel[] = [];
  const seen = new Set<string>();

  const addPixel = (x: number, y: number) => {
    if (holes.has(`${x},${y}`)) return;
    const k = `${x},${y}`;
    if (seen.has(k)) return;
    seen.add(k);
    result.push([x, y]);
  };

  // Head fill
  for (const [x, y] of HEAD_FILL) addPixel(x, y + offsetY);

  // Body (stays put during bounce)
  for (const [x, y] of BODY) addPixel(x, y);

  // Blink frame: draw closed-eye lines (green) across where eyes would be
  if (isBlink) {
    addPixel(2, 4 + offsetY);
    addPixel(3, 4 + offsetY);
    addPixel(6, 4 + offsetY);
    addPixel(7, 4 + offsetY);
  }

  // Extras
  for (const [x, y] of def.extras) addPixel(x, y);

  return result;
}

// ─── Render to BMP ───

const W = 526, H = 100;
const SC = 6; // scale factor: 10×12 grid × 6 = 60×72 pixels

export function renderCharacter(state: string, animFrame: number = 0): string {
  const S = new Set<string>();
  const pixels = buildPixels(state, animFrame);
  const ox = Math.floor((W - 10 * SC) / 2);
  const oy = Math.floor((H - 13 * SC) / 2);

  for (const [x, y] of pixels) {
    if (x < 0 || y < 0) continue;
    for (let dx = 0; dx < SC; dx++) for (let dy = 0; dy < SC; dy++) {
      const px = ox + x * SC + dx, py = oy + y * SC + dy;
      if (px < W && py < H) S.add(`${px},${py}`);
    }
  }

  return toBmp(S);
}

// Render all animation frames for a state (returns array of base64 BMPs)
export function renderAnimationFrames(state: string): string[] {
  return [0, 1, 2].map(frame => renderCharacter(state, frame));
}

// ─── BMP Encoder (1-bit, 526×100) ───

function toBmp(S: Set<string>): string {
  const rs = Math.ceil(W / 32) * 4, ps = rs * H, fs = 14 + 40 + 8 + ps;
  const b = Buffer.alloc(fs, 0);
  let o = 0;
  b.write('BM', o); o += 2;
  b.writeUInt32LE(fs, o); o += 4;
  o += 4; // reserved
  b.writeUInt32LE(62, o); o += 4; // pixel offset
  b.writeUInt32LE(40, o); o += 4; // DIB header size
  b.writeInt32LE(W, o); o += 4;
  b.writeInt32LE(H, o); o += 4;
  b.writeUInt16LE(1, o); o += 2; // planes
  b.writeUInt16LE(1, o); o += 2; // bits per pixel
  b.writeUInt32LE(0, o); o += 4; // compression
  b.writeUInt32LE(ps, o); o += 4; // image size
  b.writeInt32LE(2835, o); o += 4; // h res
  b.writeInt32LE(2835, o); o += 4; // v res
  b.writeUInt32LE(2, o); o += 4; // colors
  b.writeUInt32LE(0, o); o += 4; // important colors
  // Color table: index 0 = black (off), index 1 = green (on)
  o += 4; // palette 0 = 0x000000 = black
  b[o] = 0; b[o + 1] = 255; b[o + 2] = 0; b[o + 3] = 0; o += 4; // palette 1 = green
  // Pixel data (bottom-up)
  for (let y = H - 1; y >= 0; y--) for (let bi = 0; bi < rs; bi++) {
    let v = 0;
    for (let bit = 0; bit < 8; bit++) {
      const x = bi * 8 + bit;
      if (x < W && S.has(`${x},${y}`)) v |= (1 << (7 - bit));
    }
    b[o++] = v;
  }
  return b.toString('base64');
}

// ─── Pre-render all states × all frames (for startup cache) ───

export function prerenderAll(): Record<string, string[]> {
  const cache: Record<string, string[]> = {};
  for (const state of Object.keys(EXPRESSIONS)) {
    cache[state] = renderAnimationFrames(state);
  }
  return cache;
}

// Keep renderDisplay for backward compat / testing
export function renderDisplay(state: string, stats: { hunger: number; happiness: number; energy: number; creativity: number }, dialogue?: string): string {
  return renderCharacter(state, 0);
}