/**
 * Voir-tchi BMP Renderer v6
 * 
 * 3-column layout for Even G1 (526×100 visible area):
 * - Col 1 (left): Character sprite + mood label
 * - Col 2 (middle): Action buttons (full column width, stacked vertically)
 * - Col 3 (right): Stats bars (full column width)
 * - Bottom: Dialogue line
 * 
 * All text uses 2px font for readability on glasses.
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

// ─── Render ───

export function renderDisplay(
  state: string,
  stats: { hunger: number; happiness: number; energy: number; creativity: number },
  dialogue?: string
): string {
  const sprite = SPRITES[state] || SPRITES.happy;
  const allPixels = [...sprite.head, ...sprite.body, ...sprite.accessories];
  const onPixels = new Set<string>();

  // ═══ COL 1: Character (left, compact) ═══
  const CHAR_SCALE = 4;
  const CHAR_X = 2;
  const CHAR_Y = 5;

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

  // Mood label is now in COL2, not under character

  // ═══ COL 2: Middle (dialogue on top, buttons at bottom) ═══
  const COL2_X = 72;
  const COL3_X = 290;  // Stats start (narrower right column)

  // Mood label + dialogue at top of middle column
  const moodLabels: Record<string, string> = {
    happy: 'HAPPY', hungry: 'HUNGRY', sad: 'SAD', tired: 'TIRED',
    working: 'WORK', creative: 'CREATE', dead: 'DEAD',
  };
  drawText(onPixels, moodLabels[state] || 'HAPPY', COL2_X, 2, 2);

  // Dialogue text below mood label
  if (dialogue) {
    const maxLineChars = Math.floor((COL3_X - COL2_X) / 8);
    const upper = dialogue.toUpperCase();
    // Word-wrap into lines
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
    // Show up to 4 lines of dialogue
    let dialogueY = 16;
    for (let i = 0; i < Math.min(lines.length, 4); i++) {
      drawText(onPixels, lines[i], COL2_X, dialogueY, 2);
      dialogueY += 12;
    }
  }

  // Action buttons at BOTTOM of middle column: 3 cols × 2 rows
  const actions = state === 'dead' ? ['REVIVE'] : ['FEED', 'PLAY', 'COFFEE', 'WORK', 'SLEEP', 'LOVE'];
  const COL2_W = COL3_X - COL2_X;  // Total middle column width
  const btnW = Math.floor((COL2_W - 12) / 3);  // 3 columns with 6px gaps
  const btnH = 14;
  const btnGapX = 6;
  const btnGapY = 3;
  const btnStartY = DISPLAY_H - 2 * btnH - btnGapY - 2;  // Anchor to bottom

  for (let i = 0; i < actions.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = COL2_X + col * (btnW + btnGapX);
    const by = btnStartY + row * (btnH + btnGapY);

    if (by + btnH > DISPLAY_H) break;

    // Button outline
    for (let px = bx; px < bx + btnW; px++) {
      onPixels.add(`${px},${by}`);
      onPixels.add(`${px},${by + btnH - 1}`);
    }
    for (let py = by; py < by + btnH; py++) {
      onPixels.add(`${bx},${py}`);
      onPixels.add(`${bx + btnW - 1},${py}`);
    }
    // Label centered
    const labelW = actions[i].length * 4 * 2;
    const labelX = bx + Math.floor((btnW - labelW) / 2);
    drawText(onPixels, actions[i], labelX, by + 4, 2);
  }

  // ═══ COL 3: Stats (right, narrow column) ═══
  const barW = DISPLAY_W - COL3_X - 20;
  const barH = 8;  // Smaller bars to fit all 4
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