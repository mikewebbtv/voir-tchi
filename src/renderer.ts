/**
 * Voir-tchi BMP Renderer
 * Converts pixel art sprite arrays into MentraOS-compatible BMP bitmaps.
 *
 * Even G1 display: 640x200 (per eye), 1-bit (black/white).
 * We render pixel art centered on the display, with optional text below.
 *
 * The MentraOS SDK expects base64-encoded BMP data for showBitmapView().
 */

// ─── Color Palette ───

const COLORS: Record<string, number> = {
  '#FFD4A8': 1,  // skin (on = black on 1-bit)
  '#5D4037': 1,  // hair
  '#7C3AED': 1,  // shirt
  '#1A1A2E': 1,  // eyes
  '#E57373': 1,  // mouth happy
  '#795548': 1,  // mouth sad
  '#37474F': 1,  // glasses
  '#9E9E9E': 1,  // dead
  '#4A148C': 1,  // legs
  '#FFD600': 1,  // accents
  '#B71C1C': 1,  // dead eyes
  '#42A5F5': 1,  // tears/sweat
  '#B0BEC5': 1,  // zzz
  '#E0E0E0': 1,  // ghost
  '#FF9800': 1,  // rumble lines
  '#78909C': 1,  // laptop
  '#90A4AE': 1,  // laptop light
  '#FFFFFF': 1,  // white accents
  '#FFF176': 1,  // lightbulb glow
};

// ─── Sprite Definitions (from PixelMichael.tsx) ───

type Pixel = [number, number, string];

interface SpriteFrame {
  head: Pixel[];
  body: Pixel[];
  accessories: Pixel[];
}

function rect(x: number, y: number, w: number, h: number, color: string): Pixel[] {
  const pixels: Pixel[] = [];
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      pixels.push([x + dx, y + dy, color]);
    }
  }
  return pixels;
}

// Base head shape (8x8 grid at x=4, y=1)
const BASE_HEAD: Pixel[] = [
  ...rect(6, 1, 4, 1, '#5D4037'),
  ...rect(5, 2, 6, 1, '#5D4037'),
  ...rect(4, 3, 8, 1, '#5D4037'),
  ...rect(4, 4, 8, 6, '#FFD4A8'),
  ...rect(4, 10, 8, 1, '#FFD4A8'),
  ...rect(4, 3, 3, 2, '#5D4037'),
  ...rect(4, 4, 2, 1, '#5D4037'),
];

const SPRITES: Record<string, SpriteFrame> = {
  happy: {
    head: [
      ...BASE_HEAD,
      [6, 5, '#1A1A2E'], [9, 5, '#1A1A2E'],
      [6, 8, '#E57373'], [7, 8, '#E57373'], [8, 8, '#E57373'], [9, 8, '#E57373'],
      [6, 7, '#E57373'], [9, 7, '#E57373'],
    ],
    body: [
      ...rect(4, 11, 8, 1, '#7C3AED'),
      ...rect(3, 12, 10, 5, '#7C3AED'),
      ...rect(2, 13, 1, 3, '#7C3AED'),
      ...rect(13, 13, 1, 3, '#7C3AED'),
      ...rect(4, 17, 3, 2, '#4A148C'),
      ...rect(9, 17, 3, 2, '#4A148C'),
      [7, 14, '#FFD600'], [8, 14, '#FFD600'],
      [7, 15, '#FFD600'], [8, 15, '#FFD600'],
    ],
    accessories: [],
  },
  hungry: {
    head: [
      ...BASE_HEAD,
      [5, 5, '#1A1A2E'], [6, 5, '#1A1A2E'], [9, 5, '#1A1A2E'], [10, 5, '#1A1A2E'],
      [6, 8, '#E57373'], [7, 8, '#E57373'], [8, 8, '#E57373'],
      [6, 9, '#E57373'],
      [11, 4, '#42A5F5'],
    ],
    body: [
      ...rect(4, 11, 8, 1, '#7C3AED'),
      ...rect(3, 12, 10, 5, '#7C3AED'),
      ...rect(2, 13, 1, 3, '#7C3AED'),
      ...rect(13, 13, 1, 3, '#7C3AED'),
      ...rect(4, 17, 3, 2, '#4A148C'),
      ...rect(9, 17, 3, 2, '#4A148C'),
    ],
    accessories: [
      [2, 15, '#FF9800'], [1, 14, '#FF9800'],
      [13, 15, '#FF9800'], [14, 14, '#FF9800'],
    ],
  },
  sad: {
    head: [
      ...BASE_HEAD,
      [6, 6, '#1A1A2E'], [9, 6, '#1A1A2E'],
      [6, 8, '#795548'], [7, 8, '#795548'], [8, 8, '#795548'], [9, 8, '#795548'],
      [6, 9, '#795548'], [9, 9, '#795548'],
      [10, 6, '#42A5F5'], [10, 7, '#42A5F5'],
    ],
    body: [
      ...rect(4, 11, 8, 1, '#7C3AED'),
      ...rect(3, 12, 10, 5, '#7C3AED'),
      ...rect(2, 13, 1, 3, '#7C3AED'),
      ...rect(13, 13, 1, 3, '#7C3AED'),
      ...rect(4, 17, 3, 2, '#4A148C'),
      ...rect(9, 17, 3, 2, '#4A148C'),
    ],
    accessories: [],
  },
  tired: {
    head: [
      ...BASE_HEAD,
      [5, 6, '#1A1A2E'], [6, 6, '#1A1A2E'],
      [9, 6, '#1A1A2E'], [10, 6, '#1A1A2E'],
      [7, 8, '#795548'], [8, 8, '#795548'],
      [11, 2, '#B0BEC5'], [12, 3, '#B0BEC5'],
      [11, 1, '#B0BEC5'], [12, 2, '#B0BEC5'],
    ],
    body: [
      ...rect(4, 11, 8, 1, '#7C3AED'),
      ...rect(3, 12, 10, 5, '#7C3AED'),
      ...rect(2, 13, 1, 3, '#7C3AED'),
      ...rect(13, 13, 1, 3, '#7C3AED'),
      ...rect(4, 17, 3, 2, '#4A148C'),
      ...rect(9, 17, 3, 2, '#4A148C'),
    ],
    accessories: [],
  },
  working: {
    head: [
      ...BASE_HEAD,
      [5, 5, '#37474F'], [6, 5, '#37474F'], [7, 5, '#37474F'],
      [8, 5, '#37474F'], [9, 5, '#37474F'], [10, 5, '#37474F'],
      [6, 6, '#1A1A2E'], [9, 6, '#1A1A2E'],
      [5, 6, '#37474F'], [7, 6, '#37474F'], [8, 6, '#37474F'], [10, 6, '#37474F'],
      [6, 8, '#1A1A2E'], [7, 8, '#1A1A2E'], [8, 8, '#1A1A2E'], [9, 8, '#1A1A2E'],
    ],
    body: [
      ...rect(4, 11, 8, 1, '#7C3AED'),
      ...rect(3, 12, 10, 5, '#7C3AED'),
      ...rect(2, 13, 1, 3, '#7C3AED'),
      ...rect(13, 13, 1, 3, '#7C3AED'),
      ...rect(4, 17, 3, 2, '#4A148C'),
      ...rect(9, 17, 3, 2, '#4A148C'),
    ],
    accessories: [
      [13, 14, '#78909C'], [14, 14, '#78909C'],
      [13, 15, '#90A4AE'], [14, 15, '#90A4AE'],
    ],
  },
  creative: {
    head: [
      ...BASE_HEAD,
      [5, 5, '#FFFFFF'], [6, 5, '#FFFFFF'], [9, 5, '#FFFFFF'], [10, 5, '#FFFFFF'],
      [5, 6, '#1A1A2E'], [6, 6, '#1A1A2E'], [9, 6, '#1A1A2E'], [10, 6, '#1A1A2E'],
      [6, 8, '#E57373'], [7, 8, '#E57373'], [8, 8, '#E57373'], [9, 8, '#E57373'],
      [5, 7, '#E57373'], [10, 7, '#E57373'],
    ],
    body: [
      ...rect(4, 11, 8, 1, '#7C3AED'),
      ...rect(3, 12, 10, 5, '#7C3AED'),
      ...rect(2, 13, 1, 3, '#7C3AED'),
      ...rect(13, 13, 1, 3, '#7C3AED'),
      ...rect(4, 17, 3, 2, '#4A148C'),
      ...rect(9, 17, 3, 2, '#4A148C'),
      [7, 14, '#FFD600'], [8, 14, '#FFD600'],
      [7, 15, '#FFF176'], [8, 15, '#FFF176'],
    ],
    accessories: [
      [1, 1, '#FFD600'], [14, 2, '#FFD600'],
    ],
  },
  dead: {
    head: [
      ...rect(6, 1, 4, 1, '#9E9E9E'),
      ...rect(5, 2, 6, 1, '#9E9E9E'),
      ...rect(4, 3, 8, 1, '#9E9E9E'),
      ...rect(4, 4, 8, 6, '#9E9E9E'),
      ...rect(4, 10, 8, 1, '#9E9E9E'),
      [5, 5, '#B71C1C'], [6, 6, '#B71C1C'],
      [6, 5, '#B71C1C'], [5, 6, '#B71C1C'],
      [9, 5, '#B71C1C'], [10, 6, '#B71C1C'],
      [10, 5, '#B71C1C'], [9, 6, '#B71C1C'],
      [6, 8, '#B71C1C'], [7, 8, '#B71C1C'], [8, 8, '#B71C1C'], [9, 8, '#B71C1C'],
    ],
    body: [
      ...rect(4, 11, 8, 1, '#9E9E9E'),
      ...rect(3, 12, 10, 5, '#9E9E9E'),
      ...rect(2, 13, 1, 3, '#9E9E9E'),
      ...rect(13, 13, 1, 3, '#9E9E9E'),
      ...rect(4, 17, 3, 2, '#9E9E9E'),
      ...rect(9, 17, 3, 2, '#9E9E9E'),
    ],
    accessories: [
      [1, 5, '#E0E0E0'], [14, 5, '#E0E0E0'],
      [0, 6, '#E0E0E0'], [15, 6, '#E0E0E0'],
    ],
  },
};

// ─── BMP Generation ───

// Even G1 display: 640 pixels wide, up to ~200 pixels tall
// 1-bit BMP: each pixel = 1 bit (0=black, 1=white)
// We scale the 16x20 sprite grid to fit nicely on the display

const DISPLAY_W = 640;
const DISPLAY_H = 100; // Compact for tamagotchi — character + small text
const SPRITE_SCALE = 5; // Each sprite pixel = 5x5 display pixels
const SPRITE_OFFSET_X = Math.floor((DISPLAY_W - 16 * SPRITE_SCALE) / 2); // Center horizontally
const SPRITE_OFFSET_Y = 5; // Small top margin

/**
 * Render a character state as a 1-bit BMP, base64-encoded for MentraOS.
 */
export function renderSprite(state: string): string {
  const sprite = SPRITES[state] || SPRITES.happy;
  const allPixels = [...sprite.head, ...sprite.body, ...sprite.accessories];

  // Create 1-bit pixel buffer (0=black/on, 1=white/off)
  const pixels = new Uint8Array(DISPLAY_W * DISPLAY_H);
  pixels.fill(1); // White background

  // Plot sprite pixels (scaled up)
  for (const [sx, sy, color] of allPixels) {
    const isOn = COLORS[color] ?? 1;
    if (isOn) {
      for (let dx = 0; dx < SPRITE_SCALE; dx++) {
        for (let dy = 0; dy < SPRITE_SCALE; dy++) {
          const px = SPRITE_OFFSET_X + sx * SPRITE_SCALE + dx;
          const py = SPRITE_OFFSET_Y + sy * SPRITE_SCALE + dy;
          if (px >= 0 && px < DISPLAY_W && py >= 0 && py < DISPLAY_H) {
            pixels[py * DISPLAY_W + px] = 0; // Black
          }
        }
      }
    }
  }

  return pixelsTo1BitBmpBase64(pixels, DISPLAY_W, DISPLAY_H);
}

/**
 * Render stat bars as a simple BMP (for dashboard-style display).
 * Shows: 🍖███░ 😊████ ⚡██░░ 🎨█░░░
 */
export function renderStatsBars(stats: { hunger: number; happiness: number; energy: number; creativity: number }): string {
  const pixels = new Uint8Array(DISPLAY_W * DISPLAY_H);
  pixels.fill(1); // White background

  const bars = [
    { label: 'H', value: stats.hunger, y: 10 },
    { label: 'J', value: stats.happiness, y: 30 },
    { label: 'E', value: stats.energy, y: 50 },
    { label: 'C', value: stats.creativity, y: 70 },
  ];

  for (const bar of bars) {
    // Label letter (tiny 3x5 pixel font, at x=10)
    drawTinyChar(pixels, 10, bar.y, bar.label);

    // Bar background (empty) at x=30, width=200, height=12
    for (let x = 30; x < 230; x++) {
      for (let y = bar.y; y < bar.y + 12; y++) {
        if (y < DISPLAY_H) pixels[y * DISPLAY_W + x] = 0; // outline
      }
    }
    // Fill inner (white)
    for (let x = 31; x < 229; x++) {
      for (let y = bar.y + 1; y < bar.y + 11; y++) {
        if (y < DISPLAY_H) pixels[y * DISPLAY_W + x] = 1;
      }
    }
    // Fill bar
    const fillW = Math.floor((bar.value / 100) * 197);
    for (let x = 32; x < 32 + fillW; x++) {
      for (let y = bar.y + 2; y < bar.y + 10; y++) {
        if (y < DISPLAY_H && x < DISPLAY_W) pixels[y * DISPLAY_W + x] = 0; // black fill
      }
    }
  }

  return pixelsTo1BitBmpBase64(pixels, DISPLAY_W, DISPLAY_H);
}

// ─── Tiny 3x5 pixel font ───

const TINY_FONT: Record<string, number[][]> = {
  'H': [[1,0,1],[1,1,1],[1,0,1]],
  'J': [[1,1,1],[0,0,1],[1,1,1]],
  'E': [[1,1,0],[1,1,0],[1,1,1]],
  'C': [[1,1,1],[1,0,0],[1,1,1]],
};

function drawTinyChar(pixels: Uint8Array, x0: number, y0: number, ch: string) {
  const glyph = TINY_FONT[ch];
  if (!glyph) return;
  for (let y = 0; y < glyph.length; y++) {
    for (let x = 0; x < glyph[y].length; x++) {
      if (glyph[y][x]) {
        const px = x0 + x;
        const py = y0 + y;
        if (px >= 0 && px < DISPLAY_W && py >= 0 && py < DISPLAY_H) {
          pixels[py * DISPLAY_W + px] = 0; // black
        }
      }
    }
  }
}

// ─── BMP File Format ───

/**
 * Convert a 1-bit pixel buffer to a BMP file, base64-encoded.
 * MentraOS SDK accepts base64 BMP data for showBitmapView().
 */
function pixelsTo1BitBmpBase64(pixels: Uint8Array, width: number, height: number): string {
  // BMP is stored bottom-up, so we flip vertically
  const rowSize = Math.ceil(width / 32) * 4; // 1-bit rows padded to 4-byte boundary
  const pixelDataSize = rowSize * height;
  const fileSize = 14 + 40 + 8 + pixelDataSize; // 14 (file header) + 40 (DIB) + 8 (color table) + pixels

  const buf = Buffer.alloc(fileSize, 0);
  let offset = 0;

  // File header (14 bytes)
  buf.write('BM', offset); offset += 2;       // Signature
  buf.writeUInt32LE(fileSize, offset); offset += 4;  // File size
  offset += 4;                                    // Reserved
  buf.writeUInt32LE(62, offset); offset += 4;       // Pixel data offset (14+40+8)

  // DIB header (40 bytes) - BITMAPINFOHEADER
  buf.writeUInt32LE(40, offset); offset += 4;       // Header size
  buf.writeInt32LE(width, offset); offset += 4;     // Width
  buf.writeInt32LE(height, offset); offset += 4;     // Height (positive = bottom-up)
  buf.writeUInt16LE(1, offset); offset += 2;        // Planes
  buf.writeUInt16LE(1, offset); offset += 2;        // Bits per pixel (1-bit)
  buf.writeUInt32LE(0, offset); offset += 4;        // Compression (none)
  buf.writeUInt32LE(pixelDataSize, offset); offset += 4; // Image size
  offset += 16;                                    // Skip resolution + colors used/important

  // Color table (2 entries for 1-bit: index 0 = black, index 1 = white)
  // In 1-bit BMP: bit=0 → color index 0, bit=1 → color index 1
  buf.writeUInt8(0, offset);   buf.writeUInt8(0, offset + 1);
  buf.writeUInt8(0, offset + 2); buf.writeUInt8(255, offset + 3);  // Index 0: Black (RGB + reserved)
  offset += 4;
  buf.writeUInt8(255, offset); buf.writeUInt8(255, offset + 1);
  buf.writeUInt8(255, offset + 2); buf.writeUInt8(255, offset + 3);  // Index 1: White
  offset += 4;

  // Pixel data (bottom-up, 1-bit per pixel)
  // pixels[] is 0=black, 1=white. In BMP: bit 0 = palette index 0 (black), bit 1 = palette index 1 (white)
  // So pixel value directly maps to the bit value.
  for (let y = height - 1; y >= 0; y--) {
    for (let byteIdx = 0; byteIdx < rowSize; byteIdx++) {
      let byteVal = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = byteIdx * 8 + bit;
        if (x < width) {
          // pixels[]: 0=black → BMP bit=0 (palette 0=black), 1=white → BMP bit=1 (palette 1=white)
          const pixelVal = pixels[y * width + x];
          byteVal |= (pixelVal << (7 - bit));
        }
      }
      buf[offset++] = byteVal;
    }
  }

  return buf.toString('base64');
}

/**
 * Pre-render all sprite states as base64 BMPs.
 * Call once at startup, then use the cache for instant display.
 */
export function prerenderAllSprites(): Record<string, string> {
  const cache: Record<string, string> = {};
  for (const state of Object.keys(SPRITES)) {
    cache[state] = renderSprite(state);
  }
  return cache;
}