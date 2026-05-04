/**
 * Voir-tchi BMP Renderer v2
 * 
 * Even G1 display: 640×200, 1-bit (green on black).
 * - Bit = 1 → pixel ON (green on glasses)
 * - Bit = 0 → pixel OFF (black/transparent on glasses)
 * 
 * We render pixel art as large as possible, centered, using the full 640×200 canvas.
 * Background is all zeros (transparent/black).
 * Character pixels are all ones (green on display).
 *
 * MentraOS SDK accepts base64-encoded BMP for showBitmapView().
 */

import { BitmapUtils } from '@mentra/sdk';

// ─── Sprite Definitions ───
// Same pixel art from PixelMichael.tsx, but simplified:
// All character pixels = 1 (green), background = 0 (black)

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

// Base head shape (16x20 grid, origin at 0,0)
// Head occupies roughly x:3-12, y:0-10
// Body occupies roughly x:2-13, y:10-19
const HEAD_BASE: Pixel[] = [
  // Hair top
  ...rect(5, 0, 5, 1),
  // Hair mid
  ...rect(4, 1, 7, 1),
  // Hair wide
  ...rect(3, 2, 9, 1),
  // Face
  ...rect(3, 3, 9, 7),
  // Hair overlay on face
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
      // Eyes
      [5, 5], [9, 5],
      // Happy mouth
      [5, 8], [6, 8], [7, 8], [8, 8], [9, 8],
      [5, 7], [9, 7],
    ],
    body: [
      // Neck
      ...rect(5, 10, 5, 1),
      // Shirt
      ...rect(3, 11, 9, 6),
      // Left arm
      ...rect(2, 12, 1, 3),
      // Right arm
      ...rect(12, 12, 1, 3),
      // Left leg
      ...rect(4, 17, 3, 2),
      // Right leg
      ...rect(8, 17, 3, 2),
      // Target emoji on shirt
      [6, 13], [7, 13], [6, 14], [7, 14],
    ],
    accessories: [],
  },
  hungry: {
    head: [
      ...HEAD_BASE,
      // Worried eyes (wider)
      [4, 5], [5, 5], [9, 5], [10, 5],
      // Open mouth
      [5, 8], [6, 8], [7, 8],
      [5, 9],
      // Sweat drop
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
    accessories: [
      // Stomach rumble
      [1, 14], [0, 13],
      [13, 14], [14, 13],
    ],
  },
  sad: {
    head: [
      ...HEAD_BASE,
      // Sad eyes (lower)
      [5, 6], [9, 6],
      // Sad mouth (down curve)
      [5, 8], [6, 8], [7, 8], [8, 8], [9, 8],
      [5, 9], [9, 9],
      // Tear
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
      // Closed eyes (lines)
      [4, 6], [5, 6],
      [9, 6], [10, 6],
      // Slight mouth
      [6, 8], [7, 8],
      // Zzz
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
      // Glasses bridge
      ...rect(4, 5, 7, 1),
      // Eyes behind glasses
      [5, 6], [9, 6],
      // Glasses sides
      [4, 6], [7, 6], [8, 6], [11, 6],
      // Determined mouth
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
    accessories: [
      // Laptop
      [13, 13], [14, 13],
      [13, 14], [14, 14],
    ],
  },
  creative: {
    head: [
      ...HEAD_BASE,
      // Wide eyes
      [4, 5], [5, 5], [9, 5], [10, 5],
      [5, 6], [6, 6], [8, 6], [9, 6],
      // Big smile
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
      // Lightbulb on shirt
      [6, 13], [7, 13],
      [6, 14], [7, 14],
    ],
    accessories: [
      // Sparkles
      [0, 0], [15, 1],
    ],
  },
  dead: {
    head: [
      // Skull shape (same outline, different fill)
      ...rect(5, 0, 5, 1),
      ...rect(4, 1, 7, 1),
      ...rect(3, 2, 9, 1),
      ...rect(3, 3, 9, 7),
      ...rect(3, 10, 9, 1),
      // X eyes
      [4, 4], [5, 5],
      [5, 4], [4, 5],
      [8, 4], [9, 5],
      [9, 4], [8, 5],
      // Flat mouth
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
    accessories: [
      // Ghost wisps
      [0, 4], [15, 4],
      [-1, 5], [16, 5],
    ],
  },
};

// ─── BMP Generation ───

// Even G1 display resolution
const DISPLAY_W = 640;
const DISPLAY_H = 200;

// Scale: make the character fill most of the display height
// Sprite grid is ~16 wide x ~20 tall
// To fill 180px of height: scale = 180/20 = 9
const SPRITE_SCALE = 9;

// Center the sprite horizontally and give some top margin
const SPRITE_OFFSET_X = Math.floor((DISPLAY_W - 16 * SPRITE_SCALE) / 2);
const SPRITE_OFFSET_Y = 10;

/**
 * Render a character state as a 1-bit BMP, base64-encoded.
 * On Even G1: 1 = green pixel ON, 0 = black/transparent pixel OFF.
 */
export function renderSprite(state: string): string {
  const sprite = SPRITES[state] || SPRITES.happy;
  const allPixels = [...sprite.head, ...sprite.body, ...sprite.accessories];

  // Create pixel buffer: 0 = off (black), 1 = on (green)
  const pixels = new Uint8Array(DISPLAY_W * DISPLAY_H);
  pixels.fill(0); // Black background

  // Plot sprite pixels (scaled up)
  for (const [sx, sy] of allPixels) {
    // Skip out-of-bounds pixels (like the ghost wisps at -1)
    if (sx < 0 || sy < 0) continue;
    for (let dx = 0; dx < SPRITE_SCALE; dx++) {
      for (let dy = 0; dy < SPRITE_SCALE; dy++) {
        const px = SPRITE_OFFSET_X + sx * SPRITE_SCALE + dx;
        const py = SPRITE_OFFSET_Y + sy * SPRITE_SCALE + dy;
        if (px >= 0 && px < DISPLAY_W && py >= 0 && py < DISPLAY_H) {
          pixels[py * DISPLAY_W + px] = 1; // Green ON
        }
      }
    }
  }

  return pixelsTo1BitBmpBase64(pixels, DISPLAY_W, DISPLAY_H);
}

/**
 * Render stats bars below the character (for full-screen view).
 * Top half = character, bottom 60px = stat bars.
 */
export function renderSpriteWithStats(state: string, stats: { hunger: number; happiness: number; energy: number; creativity: number }): string {
  const sprite = SPRITES[state] || SPRITES.happy;
  const allPixels = [...sprite.head, ...sprite.body, ...sprite.accessories];

  const pixels = new Uint8Array(DISPLAY_W * DISPLAY_H);
  pixels.fill(0);

  // Draw character smaller — scale 7, offset to top portion
  const charScale = 7;
  const charOffsetX = Math.floor((DISPLAY_W - 16 * charScale) / 2);
  const charOffsetY = 5;

  for (const [sx, sy] of allPixels) {
    if (sx < 0 || sy < 0) continue;
    for (let dx = 0; dx < charScale; dx++) {
      for (let dy = 0; dy < charScale; dy++) {
        const px = charOffsetX + sx * charScale + dx;
        const py = charOffsetY + sy * charScale + dy;
        if (px >= 0 && px < DISPLAY_W && py >= 0 && py < DISPLAY_H) {
          pixels[py * DISPLAY_W + px] = 1;
        }
      }
    }
  }

  // Draw stat bars in bottom section
  const barStartY = 155;
  const barHeight = 8;
  const barMaxWidth = 200;
  const barGap = 20;

  const bars = [
    { value: stats.hunger, y: barStartY },
    { value: stats.happiness, y: barStartY + barGap },
    { value: stats.energy, y: barStartY + barGap * 2 },
    { value: stats.creativity, y: barStartY + barGap * 3 },
  ];

  const barX = 220; // Left-aligned bars

  for (const bar of bars) {
    // Bar outline
    for (let x = barX; x < barX + barMaxWidth; x++) {
      for (let y = bar.y; y < bar.y + barHeight; y++) {
        if (y < DISPLAY_H && x < DISPLAY_W) {
          pixels[y * DISPLAY_W + x] = 1;
        }
      }
    }
    // Clear inner (make it hollow — outline only)
    for (let x = barX + 1; x < barX + barMaxWidth - 1; x++) {
      for (let y = bar.y + 1; y < bar.y + barHeight - 1; y++) {
        if (y < DISPLAY_H && x < DISPLAY_W) {
          pixels[y * DISPLAY_W + x] = 0;
        }
      }
    }
    // Fill bar
    const fillW = Math.max(1, Math.floor((bar.value / 100) * (barMaxWidth - 2)));
    for (let x = barX + 1; x < barX + 1 + fillW; x++) {
      for (let y = bar.y + 1; y < bar.y + barHeight - 1; y++) {
        if (y < DISPLAY_H && x < DISPLAY_W) {
          pixels[y * DISPLAY_W + x] = 1;
        }
      }
    }
  }

  return pixelsTo1BitBmpBase64(pixels, DISPLAY_W, DISPLAY_H);
}

// ─── BMP File Format ───

function pixelsTo1BitBmpBase64(pixels: Uint8Array, width: number, height: number): string {
  // 1-bit BMP: palette index 0 = black (OFF), palette index 1 = green (ON)
  // pixels[]: 0 = OFF, 1 = ON
  // BMP stores bottom-up, each row padded to 4-byte boundary
  
  const rowSize = Math.ceil(width / 32) * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 14 + 40 + 8 + pixelDataSize;

  const buf = Buffer.alloc(fileSize, 0);
  let offset = 0;

  // File header (14 bytes)
  buf.write('BM', offset); offset += 2;
  buf.writeUInt32LE(fileSize, offset); offset += 4;
  offset += 4; // Reserved
  buf.writeUInt32LE(62, offset); offset += 4; // Pixel data offset (14+40+8)

  // DIB header (40 bytes)
  buf.writeUInt32LE(40, offset); offset += 4;
  buf.writeInt32LE(width, offset); offset += 4;
  buf.writeInt32LE(height, offset); offset += 4; // Positive = bottom-up
  buf.writeUInt16LE(1, offset); offset += 2; // Planes
  buf.writeUInt16LE(1, offset); offset += 2; // Bits per pixel
  buf.writeUInt32LE(0, offset); offset += 4; // No compression
  buf.writeUInt32LE(pixelDataSize, offset); offset += 4; // Image size
  offset += 16; // Skip resolution + colors

  // Color table: 2 entries for 1-bit
  // Index 0 = black (OFF) — matches pixel value 0
  // Index 1 = green (ON) — matches pixel value 1
  // On Even G1, both green and white palette entries render as green.
  // We use green (0,255,0) for ON pixels.
  buf.writeUInt8(0, offset);   // B
  buf.writeUInt8(0, offset+1); // G
  buf.writeUInt8(0, offset+2); // R
  buf.writeUInt8(0, offset+3); // Reserved
  offset += 4; // Index 0: Black
  
  buf.writeUInt8(0, offset);   // B
  buf.writeUInt8(255, offset+1); // G  
  buf.writeUInt8(0, offset+2); // R
  buf.writeUInt8(0, offset+3); // Reserved
  offset += 4; // Index 1: Green

  // Pixel data (bottom-up)
  for (let y = height - 1; y >= 0; y--) {
    for (let byteIdx = 0; byteIdx < rowSize; byteIdx++) {
      let byteVal = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = byteIdx * 8 + bit;
        if (x < width) {
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
 */
export function prerenderAllSprites(): Record<string, string> {
  const cache: Record<string, string> = {};
  for (const state of Object.keys(SPRITES)) {
    cache[state] = renderSprite(state);
  }
  return cache;
}