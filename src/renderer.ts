/**
 * Voir-tchi BMP Renderer v3
 * 
 * Even G1 hardware: 640×200 green monochrome display.
 * SDK internal format: 576×135 1-bit BMP after conversion.
 * 
 * Strategy: Generate a 24-bit BMP at exactly 576×135.
 * The SDK reads it with Jimp, sees it's already 576×135, skips padding
 * (no black fill!), then converts to 1-bit for the glasses.
 * 
 * On the glasses: green pixels (non-black in 24-bit) = ON, black pixels = OFF (transparent).
 * We use RGB (0, 255, 0) for character pixels → green on glasses.
 * Background is pure black (0, 0, 0) → transparent on glasses (pixel off).
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
    head: [
      ...HEAD_BASE,
      [5, 5], [9, 5],
      [5, 8], [6, 8], [7, 8], [8, 8], [9, 8],
      [5, 7], [9, 7],
    ],
    body: [
      ...rect(5, 10, 5, 1),
      ...rect(3, 11, 9, 6),
      ...rect(2, 12, 1, 3),
      ...rect(12, 12, 1, 3),
      ...rect(4, 17, 3, 2),
      ...rect(8, 17, 3, 2),
      [6, 13], [7, 13], [6, 14], [7, 14],
    ],
    accessories: [],
  },
  hungry: {
    head: [
      ...HEAD_BASE,
      [4, 5], [5, 5], [9, 5], [10, 5],
      [5, 8], [6, 8], [7, 8],
      [5, 9],
      [11, 3],
    ],
    body: [
      ...rect(5, 10, 5, 1),
      ...rect(3, 11, 9, 6),
      ...rect(2, 12, 1, 3),
      ...rect(12, 12, 1, 3),
      ...rect(4, 17, 3, 2),
      ...rect(8, 17, 3, 2),
    ],
    accessories: [[1, 14], [0, 13], [13, 14], [14, 13]],
  },
  sad: {
    head: [
      ...HEAD_BASE,
      [5, 6], [9, 6],
      [5, 8], [6, 8], [7, 8], [8, 8], [9, 8],
      [5, 9], [9, 9],
      [10, 6], [10, 7],
    ],
    body: [
      ...rect(5, 10, 5, 1),
      ...rect(3, 11, 9, 6),
      ...rect(2, 12, 1, 3),
      ...rect(12, 12, 1, 3),
      ...rect(4, 17, 3, 2),
      ...rect(8, 17, 3, 2),
    ],
    accessories: [],
  },
  tired: {
    head: [
      ...HEAD_BASE,
      [4, 6], [5, 6],
      [9, 6], [10, 6],
      [6, 8], [7, 8],
      [12, 1], [13, 2],
      [12, 0], [13, 1],
    ],
    body: [
      ...rect(5, 10, 5, 1),
      ...rect(3, 11, 9, 6),
      ...rect(2, 12, 1, 3),
      ...rect(12, 12, 1, 3),
      ...rect(4, 17, 3, 2),
      ...rect(8, 17, 3, 2),
    ],
    accessories: [],
  },
  working: {
    head: [
      ...HEAD_BASE,
      ...rect(4, 5, 7, 1),
      [5, 6], [9, 6],
      [4, 6], [7, 6], [8, 6], [11, 6],
      [5, 8], [6, 8], [7, 8], [8, 8], [9, 8],
    ],
    body: [
      ...rect(5, 10, 5, 1),
      ...rect(3, 11, 9, 6),
      ...rect(2, 12, 1, 3),
      ...rect(12, 12, 1, 3),
      ...rect(4, 17, 3, 2),
      ...rect(8, 17, 3, 2),
    ],
    accessories: [[13, 13], [14, 13], [13, 14], [14, 14]],
  },
  creative: {
    head: [
      ...HEAD_BASE,
      [4, 5], [5, 5], [9, 5], [10, 5],
      [5, 6], [6, 6], [8, 6], [9, 6],
      [5, 7], [10, 7],
      [5, 8], [6, 8], [7, 8], [8, 8], [9, 8],
    ],
    body: [
      ...rect(5, 10, 5, 1),
      ...rect(3, 11, 9, 6),
      ...rect(2, 12, 1, 3),
      ...rect(12, 12, 1, 3),
      ...rect(4, 17, 3, 2),
      ...rect(8, 17, 3, 2),
      [6, 13], [7, 13],
      [6, 14], [7, 14],
    ],
    accessories: [[0, 0], [15, 1]],
  },
  dead: {
    head: [
      ...rect(5, 0, 5, 1),
      ...rect(4, 1, 7, 1),
      ...rect(3, 2, 9, 1),
      ...rect(3, 3, 9, 7),
      ...rect(3, 10, 9, 1),
      [4, 4], [5, 5],
      [5, 4], [4, 5],
      [8, 4], [9, 5],
      [9, 4], [8, 5],
      [5, 8], [6, 8], [7, 8], [8, 8], [9, 8],
    ],
    body: [
      ...rect(5, 10, 5, 1),
      ...rect(3, 11, 9, 6),
      ...rect(2, 12, 1, 3),
      ...rect(12, 12, 1, 3),
      ...rect(4, 17, 3, 2),
      ...rect(8, 17, 3, 2),
    ],
    accessories: [[0, 4], [15, 4]],
  },
};

// ─── Canvas Config ───

// SDK expects 576×135 — if we match this, no padding = no black rectangle
const DISPLAY_W = 576;
const DISPLAY_H = 135;

// Sprite grid is ~16 wide x ~20 tall
// Scale to fill most of the 135px height: 135 / 20 ≈ 6.75 → use 6
const SPRITE_SCALE = 6;

// Center horizontally and vertically
const SPRITE_OFFSET_X = Math.floor((DISPLAY_W - 16 * SPRITE_SCALE) / 2);
const SPRITE_OFFSET_Y = Math.floor((DISPLAY_H - 20 * SPRITE_SCALE) / 2);

// ─── 24-bit BMP Generation ───

function pixelsTo24BitBmpBase64(onPixels: Set<string>, width: number, height: number): string {
  // 24-bit BMP: 3 bytes per pixel (BGR), rows padded to 4-byte boundary
  const rowBytes = width * 3;
  const rowPadding = (4 - (rowBytes % 4)) % 4;
  const rowSize = rowBytes + rowPadding;
  const pixelDataSize = rowSize * height;
  const fileSize = 14 + 40 + pixelDataSize; // No color table for 24-bit

  const buf = Buffer.alloc(fileSize, 0);
  let offset = 0;

  // File header (14 bytes)
  buf.write('BM', offset); offset += 2;
  buf.writeUInt32LE(fileSize, offset); offset += 4;
  offset += 4; // Reserved
  buf.writeUInt32LE(54, offset); offset += 4; // Pixel data offset (14+40)

  // DIB header (BITMAPINFOHEADER, 40 bytes)
  buf.writeUInt32LE(40, offset); offset += 4;
  buf.writeInt32LE(width, offset); offset += 4;
  buf.writeInt32LE(height, offset); offset += 4; // Positive = bottom-up
  buf.writeUInt16LE(1, offset); offset += 2; // Planes
  buf.writeUInt16LE(24, offset); offset += 2; // Bits per pixel = 24
  buf.writeUInt32LE(0, offset); offset += 4; // No compression (BI_RGB)
  buf.writeUInt32LE(pixelDataSize, offset); offset += 4;
  offset += 16; // Skip resolution (4+4) and colors (4+4)

  // Pixel data (bottom-up, BGR order)
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      if (onPixels.has(key)) {
        // Character pixel: green (B=0, G=255, R=0)
        buf[offset++] = 0;   // B
        buf[offset++] = 255; // G
        buf[offset++] = 0;   // R
      } else {
        // Background: black (transparent on glasses)
        buf[offset++] = 0;
        buf[offset++] = 0;
        buf[offset++] = 0;
      }
    }
    // Row padding
    for (let p = 0; p < rowPadding; p++) {
      buf[offset++] = 0;
    }
  }

  return buf.toString('base64');
}

// ─── Public API ───

export function renderSprite(state: string): string {
  const sprite = SPRITES[state] || SPRITES.happy;
  const allPixels = [...sprite.head, ...sprite.body, ...sprite.accessories];

  const onPixels = new Set<string>();

  for (const [sx, sy] of allPixels) {
    if (sx < 0 || sy < 0) continue;
    for (let dx = 0; dx < SPRITE_SCALE; dx++) {
      for (let dy = 0; dy < SPRITE_SCALE; dy++) {
        const px = SPRITE_OFFSET_X + sx * SPRITE_SCALE + dx;
        const py = SPRITE_OFFSET_Y + sy * SPRITE_SCALE + dy;
        if (px >= 0 && px < DISPLAY_W && py >= 0 && py < DISPLAY_H) {
          onPixels.add(`${px},${py}`);
        }
      }
    }
  }

  return pixelsTo24BitBmpBase64(onPixels, DISPLAY_W, DISPLAY_H);
}

export function renderSpriteWithStats(
  state: string,
  stats: { hunger: number; happiness: number; energy: number; creativity: number }
): string {
  const sprite = SPRITES[state] || SPRITES.happy;
  const allPixels = [...sprite.head, ...sprite.body, ...sprite.accessories];

  const onPixels = new Set<string>();

  // Draw character (slightly smaller to make room for bars)
  const charScale = 5;
  const charOffsetX = Math.floor((DISPLAY_W - 16 * charScale) / 2);
  const charOffsetY = 8;

  for (const [sx, sy] of allPixels) {
    if (sx < 0 || sy < 0) continue;
    for (let dx = 0; dx < charScale; dx++) {
      for (let dy = 0; dy < charScale; dy++) {
        const px = charOffsetX + sx * charScale + dx;
        const py = charOffsetY + sy * charScale + dy;
        if (px >= 0 && px < DISPLAY_W && py >= 0 && py < DISPLAY_H) {
          onPixels.add(`${px},${py}`);
        }
      }
    }
  }

  // Draw stat bars
  const barStartY = 115;
  const barHeight = 6;
  const barMaxWidth = 150;
  const barGap = 8;
  const barX = Math.floor((DISPLAY_W - barMaxWidth) / 2);

  const bars = [
    { value: stats.hunger, y: barStartY },
    { value: stats.happiness, y: barStartY + barGap },
  ];

  // Draw two bars side by side (hunger + happiness top, energy + creativity bottom)
  const barW2 = 70;
  const gap2 = 10;
  const barX2L = Math.floor((DISPLAY_W - barW2 * 2 - gap2) / 2);
  const barX2R = barX2L + barW2 + gap2;

  const allBars = [
    { value: stats.hunger, x: barX2L, label: 'H' },
    { value: stats.happiness, x: barX2R, label: 'P' },
    { value: stats.energy, x: barX2L, y: barStartY + barGap, label: 'E' },
    { value: stats.creativity, x: barX2R, y: barStartY + barGap, label: 'C' },
  ];

  for (const bar of allBars) {
    const by = (bar as any).y || barStartY;
    // Outline
    for (let x = bar.x; x < bar.x + barW2; x++) {
      for (let y = by; y < by + barHeight; y++) {
        if (y < DISPLAY_H && x < DISPLAY_W) onPixels.add(`${x},${y}`);
      }
    }
    // Clear inner
    for (let x = bar.x + 1; x < bar.x + barW2 - 1; x++) {
      for (let y = by + 1; y < by + barHeight - 1; y++) {
        if (y < DISPLAY_H && x < DISPLAY_W) onPixels.delete(`${x},${y}`);
      }
    }
    // Fill
    const fillW = Math.max(1, Math.floor((bar.value / 100) * (barW2 - 2)));
    for (let x = bar.x + 1; x < bar.x + 1 + fillW; x++) {
      for (let y = by + 1; y < by + barHeight - 1; y++) {
        if (y < DISPLAY_H && x < DISPLAY_W) onPixels.add(`${x},${y}`);
      }
    }
  }

  return pixelsTo24BitBmpBase64(onPixels, DISPLAY_W, DISPLAY_H);
}

export function prerenderAllSprites(): Record<string, string> {
  const cache: Record<string, string> = {};
  for (const state of Object.keys(SPRITES)) {
    cache[state] = renderSprite(state);
  }
  return cache;
}