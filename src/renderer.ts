/**
 * Voir-tchi BMP Renderer v10
 * 
 * CUTE pixel character: big round head, tiny squat body, stubby arms & legs
 * Very expressive face with big eyes. Retro pixel art style.
 * 
 * Grid: 16×24 (head takes up most of the height, body is squat)
 * 
 * Layout: 3-col (character | dialogue+buttons | stats)
 * Visible area: 526×100 after SDK padding
 */

type Pixel = [number, number];

function rect(x: number, y: number, w: number, h: number): Pixel[] {
  const pixels: Pixel[] = [];
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      pixels.push([x + dx, y + dy]);
    }
  }
  return pixels;
}

// ─── CUTE CHARACTER SPRITES ───
// 16 wide × 24 tall
// Head: rows 0-15 (big, round, expressive)
// Body: rows 16-23 (squat, stubby arms & legs)

// Shared HEAD outline - big round head with spiky hair
const HEAD_OUTLINE: Pixel[] = [
  // Spiky hair
  [7, 0], [6, 1], [8, 1], [5, 2], [9, 2],
  // Hair mass (wide)
  ...rect(4, 3, 8, 1),
  ...rect(3, 4, 10, 1),
  // Head sides (round curve down)
  ...rect(3, 5, 10, 1),
  ...rect(2, 6, 12, 1),
  ...rect(2, 7, 12, 1),
  ...rect(2, 8, 12, 1),
  ...rect(2, 9, 12, 1),
  ...rect(2, 10, 12, 1),
  ...rect(3, 11, 10, 1),
  ...rect(3, 12, 10, 1),
  ...rect(4, 13, 8, 1),
  ...rect(5, 14, 6, 1),
  // Ears
  [1, 7], [1, 8],
  [14, 7], [14, 8],
];

// Shared SQUAT body with arms & legs
const BODY_BASE: Pixel[] = [
  // Neck (short)
  ...rect(6, 15, 4, 1),
  // Body (squat, wide)
  ...rect(4, 16, 8, 1),   // Shoulders
  ...rect(3, 17, 10, 2),  // Torso (wide & short)
  ...rect(4, 19, 8, 1),   // Belt/waist
  // Left arm (stubby, sticking out)
  [2, 16], [1, 17], [1, 18], [2, 18],
  // Right arm (stubby, sticking out)
  [13, 16], [14, 17], [14, 18], [13, 18],
  // Left leg (short, stubby)
  ...rect(5, 20, 2, 2),
  ...rect(4, 22, 3, 2),   // Foot (wider)
  // Right leg (short, stubby)
  ...rect(9, 20, 2, 2),
  ...rect(9, 22, 3, 2),   // Foot (wider)
  // Target emoji on shirt
  [6, 17], [7, 17], [8, 17],
  [6, 18], [7, 18], [8, 18],
];

interface SpriteFrame { head: Pixel[]; body: Pixel[]; accessories: Pixel[]; }

const SPRITES: Record<string, SpriteFrame> = {
  happy: {
    head: [
      ...HEAD_OUTLINE,
      // Big cute eyes (3px each, sparkly)
      [4, 7], [5, 7], [6, 7],   // Left eye top
      [4, 8], [5, 8], [6, 8],   // Left eye mid
      [5, 9],                    // Left pupil
      [9, 7], [10, 7], [11, 7], // Right eye top
      [9, 8], [10, 8], [11, 8], // Right eye mid
      [10, 9],                   // Right pupil
      // Blush cheeks
      [3, 10], [12, 10],
      // Happy mouth (wide curved smile)
      [5, 11], [6, 11], [7, 11], [8, 11], [9, 11], [10, 11],
      [5, 12], [10, 12],
    ],
    body: [
      ...BODY_BASE,
      // Arms up slightly (celebrating)
      [0, 16], [0, 15],
      [15, 16], [15, 15],
    ],
    accessories: [],
  },
  hungry: {
    head: [
      ...HEAD_OUTLINE,
      // Big worried eyes
      [4, 7], [5, 7], [6, 7],
      [4, 8], [5, 8], [6, 8],
      [5, 9],
      [9, 7], [10, 7], [11, 7],
      [9, 8], [10, 8], [11, 8],
      [10, 9],
      // No blush
      // Wavy mouth (worried)
      [6, 11], [7, 11], [8, 11], [9, 11],
      [6, 12], [9, 12],
      [7, 12], [8, 12],
      // Sweat drop
      [13, 5], [13, 6],
    ],
    body: BODY_BASE,
    accessories: [
      // Rumble lines
      [1, 20], [0, 21],
    ],
  },
  sad: {
    head: [
      ...HEAD_OUTLINE,
      // Droopy sad eyes
      [4, 8], [5, 8], [6, 8],
      [4, 9], [5, 9], [6, 9],
      [5, 10],
      [9, 8], [10, 8], [11, 8],
      [9, 9], [10, 9], [11, 9],
      [10, 10],
      // Sad mouth (downturned)
      [6, 12], [7, 12], [8, 12], [9, 12],
      [5, 11], [10, 11],
      // Tear
      [3, 9], [3, 10], [3, 11],
    ],
    body: BODY_BASE,
    accessories: [],
  },
  tired: {
    head: [
      ...HEAD_OUTLINE,
      // Half-closed eyes (lines)
      [4, 8], [5, 8], [6, 8],
      [9, 8], [10, 8], [11, 8],
      // Small mouth (yawning)
      [6, 11], [7, 11], [8, 11], [9, 11],
      [6, 12], [9, 12],
      [7, 12], [8, 12],
      // Zzz floating above
      [12, 1], [13, 1],
      [13, 2], [14, 2],
      [14, 3], [15, 3],
    ],
    body: BODY_BASE,
    accessories: [],
  },
  working: {
    head: [
      ...HEAD_OUTLINE,
      // Glasses (square frames)
      ...rect(3, 7, 4, 3),   // Left lens outline
      ...rect(9, 7, 4, 3),   // Right lens outline
      [7, 8], [8, 8],        // Bridge
      // Eyes behind glasses
      [4, 8], [5, 8],        // Left pupil
      [10, 8], [11, 8],      // Right pupil
      // Determined mouth (straight line)
      [6, 11], [7, 11], [8, 11], [9, 11],
    ],
    body: BODY_BASE,
    accessories: [
      // Laptop to the right
      ...rect(14, 17, 2, 1),
      ...rect(14, 18, 2, 2),
    ],
  },
  creative: {
    head: [
      ...HEAD_OUTLINE,
      // Wide sparkly eyes (extra big!)
      [4, 7], [5, 7], [6, 7],
      [4, 8], [5, 8], [6, 8],
      [4, 9], [5, 9], [6, 9],
      [9, 7], [10, 7], [11, 7],
      [9, 8], [10, 8], [11, 8],
      [9, 9], [10, 9], [11, 9],
      // Star pupils
      [5, 8], [10, 8],
      // Huge grin
      [4, 11], [5, 11], [6, 11], [7, 11], [8, 11], [9, 11], [10, 11],
      [4, 12], [10, 12],
      [5, 12], [6, 12], [7, 12], [8, 12], [9, 12],
      // Blush
      [3, 10], [12, 10],
    ],
    body: [
      ...BODY_BASE,
      // Arms up (excited)
      [0, 15], [0, 14],
      [15, 15], [15, 14],
    ],
    accessories: [
      // Sparkles around head
      [0, 3], [1, 4],
      [14, 0], [15, 1],
    ],
  },
  dead: {
    head: [
      // Ghostly head outline (no hair detail)
      ...rect(5, 0, 6, 1),
      ...rect(4, 1, 8, 1),
      ...rect(3, 2, 10, 1),
      ...rect(2, 3, 12, 1),
      ...rect(2, 4, 12, 1),
      ...rect(2, 5, 12, 1),
      ...rect(2, 6, 12, 1),
      ...rect(2, 7, 12, 1),
      ...rect(2, 8, 12, 1),
      ...rect(2, 9, 12, 1),
      ...rect(2, 10, 12, 1),
      ...rect(3, 11, 10, 1),
      ...rect(3, 12, 10, 1),
      ...rect(4, 13, 8, 1),
      ...rect(5, 14, 6, 1),
      // X eyes
      [4, 7], [6, 9],
      [6, 7], [4, 9],
      [9, 7], [11, 9],
      [11, 7], [9, 9],
      // Flat mouth
      [6, 11], [7, 11], [8, 11], [9, 11],
    ],
    body: [
      ...BODY_BASE.slice(0, -6), // No target emoji
    ],
    accessories: [
      // Ghost wisp
      [0, 5], [15, 5],
    ],
  },
};

// ─── Pixel Font (3x5) ───

const FONT: Record<string, number[]> = {
  'A':[0b111,0b101,0b111,0b101,0b101],'B':[0b110,0b101,0b110,0b101,0b110],
  'C':[0b111,0b100,0b100,0b100,0b111],'D':[0b110,0b101,0b101,0b101,0b110],
  'E':[0b111,0b100,0b110,0b100,0b111],'F':[0b111,0b100,0b110,0b100,0b100],
  'G':[0b111,0b100,0b101,0b101,0b111],'H':[0b101,0b101,0b111,0b101,0b101],
  'I':[0b111,0b010,0b010,0b010,0b111],'K':[0b101,0b110,0b100,0b110,0b101],
  'L':[0b100,0b100,0b100,0b100,0b111],'M':[0b101,0b111,0b111,0b101,0b101],
  'N':[0b101,0b111,0b111,0b101,0b101],'O':[0b111,0b101,0b101,0b101,0b111],
  'P':[0b111,0b101,0b111,0b100,0b100],'R':[0b111,0b101,0b111,0b110,0b101],
  'S':[0b111,0b100,0b111,0b001,0b111],'T':[0b111,0b010,0b010,0b010,0b010],
  'U':[0b101,0b101,0b101,0b101,0b111],'V':[0b101,0b101,0b101,0b101,0b010],
  'W':[0b101,0b101,0b111,0b111,0b101],'X':[0b101,0b101,0b010,0b101,0b101],
  'Y':[0b101,0b101,0b010,0b010,0b010],'Z':[0b111,0b001,0b010,0b100,0b111],
  '0':[0b111,0b101,0b101,0b101,0b111],'1':[0b010,0b110,0b010,0b010,0b111],
  '2':[0b111,0b001,0b111,0b100,0b111],'3':[0b111,0b001,0b111,0b001,0b111],
  '4':[0b101,0b101,0b111,0b001,0b001],'5':[0b111,0b100,0b111,0b001,0b111],
  '6':[0b111,0b100,0b111,0b101,0b111],'7':[0b111,0b001,0b001,0b001,0b001],
  '8':[0b111,0b101,0b111,0b101,0b111],'9':[0b111,0b101,0b111,0b001,0b111],
  ':':[0b000,0b010,0b000,0b010,0b000],' ':[0b000,0b000,0b000,0b000,0b000],
  '-':[0b000,0b000,0b111,0b000,0b000],'!':[0b010,0b010,0b010,0b000,0b010],
  '.':[0b000,0b000,0b000,0b000,0b010],'?':[0b111,0b001,0b010,0b000,0b010],
};

function drawText(onPixels: Set<string>, text: string, startX: number, startY: number, scale: number = 1): void {
  let cursorX = startX;
  const upper = text.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    const glyph = FONT[ch];
    if (!glyph) { cursorX += 4 * scale; continue; }
    for (let row = 0; row < 5; row++) {
      const rowBits = glyph[row];
      for (let col = 0; col < 3; col++) {
        if (rowBits & (1 << (2 - col))) {
          for (let dx = 0; dx < scale; dx++) {
            for (let dy = 0; dy < scale; dy++) {
              onPixels.add(`${cursorX + col * scale + dx},${startY + row * scale + dy}`);
            }
          }
        }
      }
    }
    cursorX += 4 * scale;
  }
}

function drawBar(onPixels: Set<string>, x: number, y: number, width: number, height: number, fillPct: number): void {
  for (let bx = x; bx < x + width; bx++) {
    for (let by = y; by < y + height; by++) { onPixels.add(`${bx},${by}`); }
  }
  for (let bx = x + 1; bx < x + width - 1; bx++) {
    for (let by = y + 1; by < y + height - 1; by++) { onPixels.delete(`${bx},${by}`); }
  }
  const fillW = Math.max(0, Math.floor((fillPct / 100) * (width - 2)));
  for (let bx = x + 1; bx < x + 1 + fillW; bx++) {
    for (let by = y + 1; by < y + height - 1; by++) { onPixels.add(`${bx},${by}`); }
  }
}

// ─── Canvas ───

const DISPLAY_W = 526;
const DISPLAY_H = 100;

// ─── Render ───

export function renderDisplay(
  state: string,
  stats: { hunger: number; happiness: number; energy: number; creativity: number },
  dialogue?: string
): string {
  const sprite = SPRITES[state] || SPRITES.happy;
  const allPixels = [...sprite.head, ...sprite.body, ...sprite.accessories];
  const onPixels = new Set<string>();

  // ═══ COL 1: Cute character (left) ═══
  const CHAR_SCALE = 4;
  const CHAR_X = 2;
  const CHAR_Y = 0;

  for (const [sx, sy] of allPixels) {
    if (sx < 0 || sy < 0) continue;
    for (let dx = 0; dx < CHAR_SCALE; dx++) {
      for (let dy = 0; dy < CHAR_SCALE; dy++) {
        const px = CHAR_X + sx * CHAR_SCALE + dx;
        const py = CHAR_Y + sy * CHAR_SCALE + dy;
        if (px >= 0 && px < DISPLAY_W && py >= 0 && py < DISPLAY_H) {
          onPixels.add(`${px},${py}`);
        }
      }
    }
  }

  // ═══ COL 2: Middle (dialogue top, buttons bottom) ═══
  const COL2_X = 72;
  const COL3_X = 290;

  // Mood label + dialogue at top of middle column
  const moodLabels: Record<string, string> = {
    happy: 'HAPPY', hungry: 'HUNGRY', sad: 'SAD', tired: 'TIRED',
    working: 'WORK', creative: 'CREATE', dead: 'DEAD',
  };
  drawText(onPixels, moodLabels[state] || 'HAPPY', COL2_X, 3, 2);

  if (dialogue) {
    const maxLineChars = Math.floor((COL3_X - COL2_X) / 8);
    const upper = dialogue.toUpperCase();
    const words = upper.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length > maxLineChars) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine = (currentLine + ' ' + word).trim();
      }
    }
    if (currentLine) lines.push(currentLine.trim());
    let dialogueY = 16;
    for (let i = 0; i < Math.min(lines.length, 4); i++) {
      drawText(onPixels, lines[i], COL2_X, dialogueY, 2);
      dialogueY += 12;
    }
  }

  // Action buttons at BOTTOM: 3 cols × 2 rows
  const actions = state === 'dead' ? ['REVIVE'] : ['FEED', 'PLAY', 'COFFEE', 'WORK', 'SLEEP', 'LOVE'];
  const COL2_W = COL3_X - COL2_X;
  const btnW = Math.floor((COL2_W - 12) / 3);
  const btnH = 14;
  const btnGapX = 6;
  const btnGapY = 3;
  const btnStartY = DISPLAY_H - 2 * btnH - btnGapY - 4;

  for (let i = 0; i < actions.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = COL2_X + col * (btnW + btnGapX);
    const by = btnStartY + row * (btnH + btnGapY);
    if (by + btnH > DISPLAY_H) break;

    for (let px = bx; px < bx + btnW; px++) {
      onPixels.add(`${px},${by}`);
      onPixels.add(`${px},${by + btnH - 1}`);
    }
    for (let py = by; py < by + btnH; py++) {
      onPixels.add(`${bx},${py}`);
      onPixels.add(`${bx + btnW - 1},${py}`);
    }
    const labelW = actions[i].length * 4 * 2;
    const labelX = bx + Math.floor((btnW - labelW) / 2);
    drawText(onPixels, actions[i], labelX, by + 4, 2);
  }

  // ═══ COL 3: Stats (right) ═══
  const barW = DISPLAY_W - COL3_X - 20;
  const barH = 8;
  const barGap = 3;
  let statY = 2;

  const statItems = [
    { label: 'HUNGER', value: stats.hunger },
    { label: 'HAPPY', value: stats.happiness },
    { label: 'ENERGY', value: stats.energy },
    { label: 'CREATE', value: stats.creativity },
  ];

  for (const stat of statItems) {
    drawText(onPixels, stat.label, COL3_X, statY, 2);
    statY += 12;
    drawBar(onPixels, COL3_X, statY, barW, barH, stat.value);
    drawText(onPixels, `${stat.value}`, COL3_X + barW + 3, statY + 1, 2);
    statY += barH + barGap;
  }

  return pixelsTo1BitBmpBase64(onPixels, DISPLAY_W, DISPLAY_H);
}

export function renderSprite(state: string): string {
  const sprite = SPRITES[state] || SPRITES.happy;
  const allPixels = [...sprite.head, ...sprite.body, ...sprite.accessories];
  const onPixels = new Set<string>();
  const scale = 4;
  const ox = Math.floor((DISPLAY_W - 16 * scale) / 2);
  const oy = Math.floor((DISPLAY_H - 24 * scale) / 2);
  for (const [sx, sy] of allPixels) {
    if (sx < 0 || sy < 0) continue;
    for (let dx = 0; dx < scale; dx++) {
      for (let dy = 0; dy < scale; dy++) {
        const px = ox + sx * scale + dx;
        const py = oy + sy * scale + dy;
        if (px >= 0 && px < DISPLAY_W && py >= 0 && py < DISPLAY_H) {
          onPixels.add(`${px},${py}`);
        }
      }
    }
  }
  return pixelsTo1BitBmpBase64(onPixels, DISPLAY_W, DISPLAY_H);
}

// ─── 1-bit BMP ───

function pixelsTo1BitBmpBase64(onPixels: Set<string>, width: number, height: number): string {
  const rowBits = width;
  const rowSize = Math.ceil(rowBits / 32) * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 14 + 40 + 8 + pixelDataSize;
  const buf = Buffer.alloc(fileSize, 0);
  let offset = 0;
  buf.write('BM', offset); offset += 2;
  buf.writeUInt32LE(fileSize, offset); offset += 4;
  offset += 4;
  buf.writeUInt32LE(62, offset); offset += 4;
  buf.writeUInt32LE(40, offset); offset += 4;
  buf.writeInt32LE(width, offset); offset += 4;
  buf.writeInt32LE(height, offset); offset += 4;
  buf.writeUInt16LE(1, offset); offset += 2;
  buf.writeUInt16LE(1, offset); offset += 2;
  buf.writeUInt32LE(0, offset); offset += 4;
  buf.writeUInt32LE(pixelDataSize, offset); offset += 4;
  buf.writeInt32LE(2835, offset); offset += 4;
  buf.writeInt32LE(2835, offset); offset += 4;
  buf.writeUInt32LE(2, offset); offset += 4;
  buf.writeUInt32LE(0, offset); offset += 4;
  offset += 4; // Index 0: black
  buf.writeUInt8(0, offset); buf.writeUInt8(255, offset+1); buf.writeUInt8(0, offset+2); buf.writeUInt8(0, offset+3);
  offset += 4; // Index 1: green
  for (let y = height - 1; y >= 0; y--) {
    for (let byteIdx = 0; byteIdx < rowSize; byteIdx++) {
      let byteVal = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = byteIdx * 8 + bit;
        if (x < width && onPixels.has(`${x},${y}`)) byteVal |= (1 << (7 - bit));
      }
      buf[offset++] = byteVal;
    }
  }
  return buf.toString('base64');
}

export function prerenderAllSprites(): Record<string, string> {
  const cache: Record<string, string> = {};
  for (const state of Object.keys(SPRITES)) cache[state] = renderSprite(state);
  return cache;
}