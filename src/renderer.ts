/**
 * Voir-tchi BMP Renderer v4
 * 
 * Full-screen 576×135 1-bit BMP layout:
 * - Left side: pixel art character (always visible)
 * - Right side: stats bars + action labels (speakable commands)
 * - Background: transparent (all 0 bits)
 * 
 * On Even G1: 1 = green pixel ON, 0 = transparent OFF
 */

// ─── Sprite Definitions ───

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

const HEAD_BASE: Pixel[] = [
  ...rect(5, 0, 5, 1),
  ...rect(4, 1, 7, 1),
  ...rect(3, 2, 9, 1),
  ...rect(3, 3, 9, 7),
  ...rect(3, 3, 3, 2),
  ...rect(3, 4, 2, 1),
];

interface SpriteFrame {
  head: Pixel[];
  body: Pixel[];
  accessories: Pixel[];
}

const SPRITES: Record<string, SpriteFrame> = {
  happy: {
    head: [...HEAD_BASE, [5, 5], [9, 5], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [5, 7], [9, 7]],
    body: [...rect(5, 10, 5, 1), ...rect(3, 11, 9, 6), ...rect(2, 12, 1, 3), ...rect(12, 12, 1, 3), ...rect(4, 17, 3, 2), ...rect(8, 17, 3, 2), [6, 13], [7, 13], [6, 14], [7, 14]],
    accessories: [],
  },
  hungry: {
    head: [...HEAD_BASE, [4, 5], [5, 5], [9, 5], [10, 5], [5, 8], [6, 8], [7, 8], [5, 9], [11, 3]],
    body: [...rect(5, 10, 5, 1), ...rect(3, 11, 9, 6), ...rect(2, 12, 1, 3), ...rect(12, 12, 1, 3), ...rect(4, 17, 3, 2), ...rect(8, 17, 3, 2)],
    accessories: [[1, 14], [0, 13], [13, 14], [14, 13]],
  },
  sad: {
    head: [...HEAD_BASE, [5, 6], [9, 6], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [5, 9], [9, 9], [10, 6], [10, 7]],
    body: [...rect(5, 10, 5, 1), ...rect(3, 11, 9, 6), ...rect(2, 12, 1, 3), ...rect(12, 12, 1, 3), ...rect(4, 17, 3, 2), ...rect(8, 17, 3, 2)],
    accessories: [],
  },
  tired: {
    head: [...HEAD_BASE, [4, 6], [5, 6], [9, 6], [10, 6], [6, 8], [7, 8], [12, 1], [13, 2], [12, 0], [13, 1]],
    body: [...rect(5, 10, 5, 1), ...rect(3, 11, 9, 6), ...rect(2, 12, 1, 3), ...rect(12, 12, 1, 3), ...rect(4, 17, 3, 2), ...rect(8, 17, 3, 2)],
    accessories: [],
  },
  working: {
    head: [...HEAD_BASE, ...rect(4, 5, 7, 1), [5, 6], [9, 6], [4, 6], [7, 6], [8, 6], [11, 6], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8]],
    body: [...rect(5, 10, 5, 1), ...rect(3, 11, 9, 6), ...rect(2, 12, 1, 3), ...rect(12, 12, 1, 3), ...rect(4, 17, 3, 2), ...rect(8, 17, 3, 2)],
    accessories: [[13, 13], [14, 13], [13, 14], [14, 14]],
  },
  creative: {
    head: [...HEAD_BASE, [4, 5], [5, 5], [9, 5], [10, 5], [5, 6], [6, 6], [8, 6], [9, 6], [5, 7], [10, 7], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8]],
    body: [...rect(5, 10, 5, 1), ...rect(3, 11, 9, 6), ...rect(2, 12, 1, 3), ...rect(12, 12, 1, 3), ...rect(4, 17, 3, 2), ...rect(8, 17, 3, 2), [6, 13], [7, 13], [6, 14], [7, 14]],
    accessories: [[0, 0], [15, 1]],
  },
  dead: {
    head: [...rect(5, 0, 5, 1), ...rect(4, 1, 7, 1), ...rect(3, 2, 9, 1), ...rect(3, 3, 9, 7), ...rect(3, 10, 9, 1), [4, 4], [5, 5], [5, 4], [4, 5], [8, 4], [9, 5], [9, 4], [8, 5], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8]],
    body: [...rect(5, 10, 5, 1), ...rect(3, 11, 9, 6), ...rect(2, 12, 1, 3), ...rect(12, 12, 1, 3), ...rect(4, 17, 3, 2), ...rect(8, 17, 3, 2)],
    accessories: [[0, 4], [15, 4]],
  },
};

// ─── Pixel Font (3x5) ───
// Minimal pixel font for labels on the glasses display
// Each char is 3 wide x 5 tall, with 1px spacing

const FONT: Record<string, number[]> = {
  'A': [0b111, 0b101, 0b111, 0b101, 0b101],
  'B': [0b110, 0b101, 0b110, 0b101, 0b110],
  'C': [0b111, 0b100, 0b100, 0b100, 0b111],
  'D': [0b110, 0b101, 0b101, 0b101, 0b110],
  'E': [0b111, 0b100, 0b110, 0b100, 0b111],
  'F': [0b111, 0b100, 0b110, 0b100, 0b100],
  'G': [0b111, 0b100, 0b101, 0b101, 0b111],
  'H': [0b101, 0b101, 0b111, 0b101, 0b101],
  'I': [0b111, 0b010, 0b010, 0b010, 0b111],
  'K': [0b101, 0b110, 0b100, 0b110, 0b101],
  'L': [0b100, 0b100, 0b100, 0b100, 0b111],
  'M': [0b101, 0b111, 0b111, 0b101, 0b101],
  'N': [0b101, 0b111, 0b111, 0b101, 0b101],
  'O': [0b111, 0b101, 0b101, 0b101, 0b111],
  'P': [0b111, 0b101, 0b111, 0b100, 0b100],
  'R': [0b111, 0b101, 0b111, 0b110, 0b101],
  'S': [0b111, 0b100, 0b111, 0b001, 0b111],
  'T': [0b111, 0b010, 0b010, 0b010, 0b010],
  'U': [0b101, 0b101, 0b101, 0b101, 0b111],
  'V': [0b101, 0b101, 0b101, 0b101, 0b010],
  'W': [0b101, 0b101, 0b111, 0b111, 0b101],
  'X': [0b101, 0b101, 0b010, 0b101, 0b101],
  'Y': [0b101, 0b101, 0b010, 0b010, 0b010],
  'Z': [0b111, 0b001, 0b010, 0b100, 0b111],
  '0': [0b111, 0b101, 0b101, 0b101, 0b111],
  '1': [0b010, 0b110, 0b010, 0b010, 0b111],
  '2': [0b111, 0b001, 0b111, 0b100, 0b111],
  '3': [0b111, 0b001, 0b111, 0b001, 0b111],
  '4': [0b101, 0b101, 0b111, 0b001, 0b001],
  '5': [0b111, 0b100, 0b111, 0b001, 0b111],
  '6': [0b111, 0b100, 0b111, 0b101, 0b111],
  '7': [0b111, 0b001, 0b001, 0b001, 0b001],
  '8': [0b111, 0b101, 0b111, 0b101, 0b111],
  '9': [0b111, 0b101, 0b111, 0b001, 0b111],
  ':': [0b000, 0b010, 0b000, 0b010, 0b000],
  '%': [0b101, 0b001, 0b010, 0b100, 0b101],
  ' ': [0b000, 0b000, 0b000, 0b000, 0b000],
  '-': [0b000, 0b000, 0b111, 0b000, 0b000],
  '!': [0b010, 0b010, 0b010, 0b000, 0b010],
};

// Draw text using pixel font at given position
function drawText(onPixels: Set<string>, text: string, startX: number, startY: number, scale: number = 1): void {
  let cursorX = startX;
  const upper = text.toUpperCase();
  
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    const glyph = FONT[ch];
    if (!glyph) {
      cursorX += 4 * scale; // Skip unknown chars
      continue;
    }
    
    for (let row = 0; row < 5; row++) {
      const rowBits = glyph[row];
      for (let col = 0; col < 3; col++) {
        if (rowBits & (1 << (2 - col))) {
          // Draw scaled pixel
          for (let dx = 0; dx < scale; dx++) {
            for (let dy = 0; dy < scale; dy++) {
              const px = cursorX + col * scale + dx;
              const py = startY + row * scale + dy;
              onPixels.add(`${px},${py}`);
            }
          }
        }
      }
    }
    cursorX += 4 * scale; // 3px char + 1px spacing
  }
}

// Draw a horizontal bar
function drawBar(onPixels: Set<string>, x: number, y: number, width: number, height: number, fillPct: number): void {
  // Outline
  for (let bx = x; bx < x + width; bx++) {
    for (let by = y; by < y + height; by++) {
      onPixels.add(`${bx},${by}`);
    }
  }
  // Clear inner
  for (let bx = x + 1; bx < x + width - 1; bx++) {
    for (let by = y + 1; by < y + height - 1; by++) {
      onPixels.delete(`${bx},${by}`);
    }
  }
  // Fill
  const fillW = Math.max(0, Math.floor((fillPct / 100) * (width - 2)));
  for (let bx = x + 1; bx < x + 1 + fillW; bx++) {
    for (let by = y + 1; by < y + height - 1; by++) {
      onPixels.add(`${bx},${by}`);
    }
  }
}

// ─── Canvas ───

// SDK pads 526×100 → 576×135 with left:50, top:35
// So the VISIBLE area on glasses is 526×100
const DISPLAY_W = 526;
const DISPLAY_H = 100;

// Character on left side, smaller to fit
const CHAR_SCALE = 4;
const CHAR_X = 5;
const CHAR_Y = 5;

// Right panel
const PANEL_X = CHAR_X + 16 * CHAR_SCALE + 8; // ~77

// ─── Render Full Display ───

export function renderDisplay(
  state: string,
  stats: { hunger: number; happiness: number; energy: number; creativity: number },
  dialogue?: string
): string {
  const sprite = SPRITES[state] || SPRITES.happy;
  const allPixels = [...sprite.head, ...sprite.body, ...sprite.accessories];
  const onPixels = new Set<string>();

  // Draw character (left side)
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

  // ─── Right panel: stats (compact) ───
  const fontSize = 1;
  const barW = 60;
  const barH = 6;
  const barGap = 12;
  let panelY = 2;

  // Stats title
  drawText(onPixels, 'STATS', PANEL_X, panelY, 2);
  panelY += 12;

  // Hunger bar
  drawText(onPixels, 'H', PANEL_X, panelY + 1, fontSize);
  drawBar(onPixels, PANEL_X + 8, panelY, barW, barH, stats.hunger);
  drawText(onPixels, `${stats.hunger}`, PANEL_X + 8 + barW + 2, panelY + 1, fontSize);
  panelY += barGap;

  // Happiness bar
  drawText(onPixels, 'P', PANEL_X, panelY + 1, fontSize);
  drawBar(onPixels, PANEL_X + 8, panelY, barW, barH, stats.happiness);
  drawText(onPixels, `${stats.happiness}`, PANEL_X + 8 + barW + 2, panelY + 1, fontSize);
  panelY += barGap;

  // Energy bar
  drawText(onPixels, 'E', PANEL_X, panelY + 1, fontSize);
  drawBar(onPixels, PANEL_X + 8, panelY, barW, barH, stats.energy);
  drawText(onPixels, `${stats.energy}`, PANEL_X + 8 + barW + 2, panelY + 1, fontSize);
  panelY += barGap;

  // Creativity bar
  drawText(onPixels, 'C', PANEL_X, panelY + 1, fontSize);
  drawBar(onPixels, PANEL_X + 8, panelY, barW, barH, stats.creativity);
  drawText(onPixels, `${stats.creativity}`, PANEL_X + 8 + barW + 2, panelY + 1, fontSize);
  panelY += barGap + 2;

  // ─── Right panel: action buttons (compact) ───
  const btnFontSize = 1;
  const btnH = 9;
  const btnGap = 2;

  drawText(onPixels, 'SAY:', PANEL_X, panelY, 2);
  panelY += 10;

  const actions = state === 'dead'
    ? ['REVIVE']
    : ['FEED', 'PLAY', 'COFFEE', 'WORK', 'SLEEP', 'LOVE'];

  // Lay out actions in 2 columns if space is tight
  const col1X = PANEL_X;
  const col2X = PANEL_X + 70;
  let row = 0;

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const x = i % 2 === 0 ? col1X : col2X;
    const y = panelY + Math.floor(i / 2) * (btnH + btnGap);

    if (y + btnH > DISPLAY_H - 8) break;

    // Button outline
    const btnW = action.length * 4 * btnFontSize + 4;
    for (let bx = x; bx < x + btnW; bx++) {
      onPixels.add(`${bx},${y}`);
      onPixels.add(`${bx},${y + btnH - 1}`);
    }
    for (let by = y; by < y + btnH; by++) {
      onPixels.add(`${x},${by}`);
      onPixels.add(`${x + btnW - 1},${by}`);
    }
    // Label
    drawText(onPixels, action, x + 2, y + 2, btnFontSize);
  }

  // ─── Bottom: dialogue line ───
  if (dialogue) {
    const maxChars = Math.floor((DISPLAY_W - 10) / (4 * 1));
    const truncated = dialogue.length > maxChars ? dialogue.substring(0, maxChars - 1) + '!' : dialogue;
    drawText(onPixels, truncated.toUpperCase(), 5, DISPLAY_H - 7, 1);
  }

  return pixelsTo1BitBmpBase64(onPixels, DISPLAY_W, DISPLAY_H);
}

// ─── Simple sprite-only render (for fallback) ───

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

// ─── BMP File Format (1-bit) ───

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
  buf.writeUInt8(0, offset);   // B
  buf.writeUInt8(255, offset+1); // G
  buf.writeUInt8(0, offset+2); // R
  buf.writeUInt8(0, offset+3);
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