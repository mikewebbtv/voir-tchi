/**
 * Voir-tchi BMP Renderer v5
 * 
 * 3-column layout for Even G1 glasses (526×100 visible area):
 * - Col 1 (left): Character sprite + mood label
 * - Col 2 (middle): Action buttons (speakable)
 * - Col 3 (right): Stats bars
 * - Bottom: Dialogue line
 * 
 * SDK pads 526×100 → 576×135 with left:50, top:35
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

// ─── Sprite Definitions ───

const HEAD_BASE: Pixel[] = [
  ...rect(5, 0, 5, 1), ...rect(4, 1, 7, 1), ...rect(3, 2, 9, 1),
  ...rect(3, 3, 9, 7), ...rect(3, 3, 3, 2), ...rect(3, 4, 2, 1),
];

interface SpriteFrame { head: Pixel[]; body: Pixel[]; accessories: Pixel[]; }

const SPRITES: Record<string, SpriteFrame> = {
  happy: {
    head: [...HEAD_BASE, [5,5],[9,5],[5,8],[6,8],[7,8],[8,8],[9,8],[5,7],[9,7]],
    body: [...rect(5,10,5,1),...rect(3,11,9,6),...rect(2,12,1,3),...rect(12,12,1,3),...rect(4,17,3,2),...rect(8,17,3,2),[6,13],[7,13],[6,14],[7,14]],
    accessories: [],
  },
  hungry: {
    head: [...HEAD_BASE, [4,5],[5,5],[9,5],[10,5],[5,8],[6,8],[7,8],[5,9],[11,3]],
    body: [...rect(5,10,5,1),...rect(3,11,9,6),...rect(2,12,1,3),...rect(12,12,1,3),...rect(4,17,3,2),...rect(8,17,3,2)],
    accessories: [[1,14],[0,13],[13,14],[14,13]],
  },
  sad: {
    head: [...HEAD_BASE, [5,6],[9,6],[5,8],[6,8],[7,8],[8,8],[9,8],[5,9],[9,9],[10,6],[10,7]],
    body: [...rect(5,10,5,1),...rect(3,11,9,6),...rect(2,12,1,3),...rect(12,12,1,3),...rect(4,17,3,2),...rect(8,17,3,2)],
    accessories: [],
  },
  tired: {
    head: [...HEAD_BASE, [4,6],[5,6],[9,6],[10,6],[6,8],[7,8],[12,1],[13,2],[12,0],[13,1]],
    body: [...rect(5,10,5,1),...rect(3,11,9,6),...rect(2,12,1,3),...rect(12,12,1,3),...rect(4,17,3,2),...rect(8,17,3,2)],
    accessories: [],
  },
  working: {
    head: [...HEAD_BASE, ...rect(4,5,7,1),[5,6],[9,6],[4,6],[7,6],[8,6],[11,6],[5,8],[6,8],[7,8],[8,8],[9,8]],
    body: [...rect(5,10,5,1),...rect(3,11,9,6),...rect(2,12,1,3),...rect(12,12,1,3),...rect(4,17,3,2),...rect(8,17,3,2)],
    accessories: [[13,13],[14,13],[13,14],[14,14]],
  },
  creative: {
    head: [...HEAD_BASE, [4,5],[5,5],[9,5],[10,5],[5,6],[6,6],[8,6],[9,6],[5,7],[10,7],[5,8],[6,8],[7,8],[8,8],[9,8]],
    body: [...rect(5,10,5,1),...rect(3,11,9,6),...rect(2,12,1,3),...rect(12,12,1,3),...rect(4,17,3,2),...rect(8,17,3,2),[6,13],[7,13],[6,14],[7,14]],
    accessories: [[0,0],[15,1]],
  },
  dead: {
    head: [...rect(5,0,5,1),...rect(4,1,7,1),...rect(3,2,9,1),...rect(3,3,9,7),...rect(3,10,9,1),[4,4],[5,5],[5,4],[4,5],[8,4],[9,5],[9,4],[8,5],[5,8],[6,8],[7,8],[8,8],[9,8]],
    body: [...rect(5,10,5,1),...rect(3,11,9,6),...rect(2,12,1,3),...rect(12,12,1,3),...rect(4,17,3,2),...rect(8,17,3,2)],
    accessories: [[0,4],[15,4]],
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

// 3-column layout
const CHAR_SCALE = 4;
const CHAR_X = 5;
const CHAR_Y = 3;
const COL2_X = 85;    // Actions
const COL3_X = 270;   // Stats

// ─── Render ───

export function renderDisplay(
  state: string,
  stats: { hunger: number; happiness: number; energy: number; creativity: number },
  dialogue?: string
): string {
  const sprite = SPRITES[state] || SPRITES.happy;
  const allPixels = [...sprite.head, ...sprite.body, ...sprite.accessories];
  const onPixels = new Set<string>();

  // ═══ COL 1: Character (left) ═══
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

  // Mood label under character
  const moodLabels: Record<string, string> = {
    happy: 'HAPPY', hungry: 'HUNGRY', sad: 'SAD', tired: 'TIRED',
    working: 'WORKING', creative: 'CREATIVE', dead: 'DEAD',
  };
  drawText(onPixels, moodLabels[state] || 'HAPPY', CHAR_X, CHAR_Y + 20 * CHAR_SCALE + 3, 1);

  // ═══ COL 2: Actions (middle) ═══
  let y = 2;
  drawText(onPixels, 'SAY', COL2_X, y, 2);
  y += 14;

  const actions = state === 'dead' ? ['REVIVE'] : ['FEED', 'PLAY', 'COFFEE', 'WORK', 'SLEEP', 'LOVE'];
  const btnW = 60;
  const btnH = 11;
  const btnGap = 2;

  for (let i = 0; i < actions.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = COL2_X + col * (btnW + 4);
    const by = y + row * (btnH + btnGap);
    if (by + btnH > DISPLAY_H - 8) break;

    for (let px = bx; px < bx + btnW; px++) {
      onPixels.add(`${px},${by}`);
      onPixels.add(`${px},${by + btnH - 1}`);
    }
    for (let py = by; py < by + btnH; py++) {
      onPixels.add(`${bx},${py}`);
      onPixels.add(`${bx + btnW - 1},${py}`);
    }
    drawText(onPixels, actions[i], bx + 3, by + 3, 1);
  }

  // ═══ COL 3: Stats (right) ═══
  y = 2;
  drawText(onPixels, 'STATS', COL3_X, y, 2);
  y += 14;

  const barW = 120;
  const barH = 8;
  const statItems = [
    { label: 'HUNGER', value: stats.hunger },
    { label: 'HAPPY', value: stats.happiness },
    { label: 'ENERGY', value: stats.energy },
    { label: 'CREATE', value: stats.creativity },
  ];

  for (const stat of statItems) {
    drawText(onPixels, stat.label, COL3_X, y, 1);
    y += 7;
    drawBar(onPixels, COL3_X, y, barW, barH, stat.value);
    drawText(onPixels, `${stat.value}`, COL3_X + barW + 3, y + 1, 1);
    y += barH + 3;
  }

  // ═══ Bottom: Dialogue ═══
  if (dialogue) {
    const maxChars = Math.floor((DISPLAY_W - 10) / 4);
    const truncated = dialogue.length > maxChars ? dialogue.substring(0, maxChars - 1) + '!' : dialogue;
    drawText(onPixels, truncated.toUpperCase(), 5, DISPLAY_H - 7, 1);
  }

  return pixelsTo1BitBmpBase64(onPixels, DISPLAY_W, DISPLAY_H);
}

export function renderSprite(state: string): string {
  const sprite = SPRITES[state] || SPRITES.happy;
  const allPixels = [...sprite.head, ...sprite.body, ...sprite.accessories];
  const onPixels = new Set<string>();
  for (const [sx, sy] of allPixels) {
    if (sx < 0 || sy < 0) continue;
    for (let dx = 0; dx < 6; dx++) {
      for (let dy = 0; dy < 6; dy++) {
        const px = Math.floor((DISPLAY_W - 16 * 6) / 2) + sx * 6 + dx;
        const py = Math.floor((DISPLAY_H - 20 * 6) / 2) + sy * 6 + dy;
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

  // File header
  buf.write('BM', offset); offset += 2;
  buf.writeUInt32LE(fileSize, offset); offset += 4;
  offset += 4;
  buf.writeUInt32LE(62, offset); offset += 4;

  // DIB header
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

  // Palette: 0=black (off), 1=green (on)
  offset += 4; // Index 0: black
  buf.writeUInt8(0, offset); buf.writeUInt8(255, offset+1); buf.writeUInt8(0, offset+2); buf.writeUInt8(0, offset+3);
  offset += 4; // Index 1: green

  // Pixel data (bottom-up)
  for (let y = height - 1; y >= 0; y--) {
    for (let byteIdx = 0; byteIdx < rowSize; byteIdx++) {
      let byteVal = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = byteIdx * 8 + bit;
        if (x < width && onPixels.has(`${x},${y}`)) {
          byteVal |= (1 << (7 - bit));
        }
      }
      buf[offset++] = byteVal;
    }
  }

  return buf.toString('base64');
}

export function prerenderAllSprites(): Record<string, string> {
  const cache: Record<string, string> = {};
  for (const state of Object.keys(SPRITES)) {
    cache[state] = renderSprite(state);
  }
  return cache;
}