/**
 * Voir-tchi BMP Renderer v12
 * 
 * SPACE INVADERS STYLE character:
 * - Square head with blocky protrusions (antennae/helmet)
 * - Two small square eyes, rectangular nose, wide mouth
 * - Symmetrical, front-facing, minimal
 * - Bright green on pure black, 8-bit retro
 * - Thick geometric outlines, solid shapes only
 * 
 * Grid: 16×24, scale 4x
 * Head is OUTLINE (thick border), features are SOLID blocks inside
 * Body is simple geometric shapes below
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

// ─── SPACE INVADERS STYLE CHARACTER ───
// 16 wide × 24 tall
// Symmetrical, geometric, iconic

// Head: thick square outline with antennae/helmet protrusions
// Features inside: square eyes, rect nose, wide mouth

const SPRITES: Record<string, { pixels: Pixel[] }> = {
  happy: {
    pixels: [
      // ── ANTENNAE / HELMET TOP ──
      ...rect(6, 0, 4, 1),    // Center antenna
      [3, 1], [4, 1],         // Left antenna
      [11, 1], [12, 1],       // Right antenna
      ...rect(2, 2, 12, 1),   // Helmet top bar
      
      // ── HEAD (thick square outline, 2px border) ──
      ...rect(2, 3, 12, 1),   // Top edge
      ...rect(1, 4, 14, 1),   // Top edge (wider)
      // Left wall
      ...rect(1, 5, 2, 8),
      // Right wall  
      ...rect(13, 5, 2, 8),
      // Bottom edge
      ...rect(1, 12, 14, 1),
      ...rect(2, 13, 12, 1),
      
      // ── FACE FEATURES (inside hollow head) ──
      // Eyes (2x2 squares, evenly spaced)
      ...rect(4, 6, 2, 2),    // Left eye
      ...rect(10, 6, 2, 2),   // Right eye
      
      // Nose (1x2 rectangle, center)
      ...rect(7, 7, 2, 2),
      
      // Mouth (wide horizontal rectangle)
      ...rect(4, 10, 8, 2),
      
      // ── BODY (simple geometric) ──
      // Neck
      ...rect(6, 14, 4, 1),
      
      // Torso (thick outline)
      ...rect(4, 15, 8, 1),   // Shoulders
      ...rect(3, 16, 10, 1),  // Upper body
      ...rect(3, 17, 10, 1),  // Mid body
      ...rect(3, 18, 10, 1),  // Lower body
      ...rect(4, 19, 8, 1),   // Waist
      
      // Arms (blocky, sticking out)
      ...rect(1, 16, 2, 2),   // Left arm
      ...rect(13, 16, 2, 2),  // Right arm
      
      // Target emoji on chest
      [6, 16], [7, 16], [8, 16], [9, 16],
      [6, 17], [7, 17], [8, 17], [9, 17],
      
      // ── LEGS (blocky, geometric) ──
      ...rect(4, 20, 3, 1),   // Left leg top
      ...rect(9, 20, 3, 1),   // Right leg top
      ...rect(4, 21, 3, 1),   // Left leg mid
      ...rect(9, 21, 3, 1),   // Right leg mid
      ...rect(3, 22, 4, 1),   // Left foot
      ...rect(9, 22, 4, 1),   // Right foot
      ...rect(3, 23, 4, 1),   // Left foot
      ...rect(9, 23, 4, 1),   // Right foot
    ],
  },
  
  hungry: {
    pixels: [
      // Antennae
      ...rect(6, 0, 4, 1),
      [3, 1], [4, 1], [11, 1], [12, 1],
      ...rect(2, 2, 12, 1),
      // Head outline
      ...rect(2, 3, 12, 1),
      ...rect(1, 4, 14, 1),
      ...rect(1, 5, 2, 8),
      ...rect(13, 5, 2, 8),
      ...rect(1, 12, 14, 1),
      ...rect(2, 13, 12, 1),
      // Eyes (wider, worried)
      ...rect(3, 6, 3, 2),
      ...rect(10, 6, 3, 2),
      // Nose
      ...rect(7, 7, 2, 2),
      // Mouth (small, worried)
      ...rect(6, 10, 4, 2),
      // Sweat drop
      [14, 4], [14, 5],
      // Body
      ...rect(6, 14, 4, 1),
      ...rect(4, 15, 8, 1),
      ...rect(3, 16, 10, 1),
      ...rect(3, 17, 10, 1),
      ...rect(3, 18, 10, 1),
      ...rect(4, 19, 8, 1),
      ...rect(1, 16, 2, 2),
      ...rect(13, 16, 2, 2),
      [6, 16], [7, 16], [8, 16], [9, 16],
      [6, 17], [7, 17], [8, 17], [9, 17],
      // Legs
      ...rect(4, 20, 3, 1), ...rect(9, 20, 3, 1),
      ...rect(4, 21, 3, 1), ...rect(9, 21, 3, 1),
      ...rect(3, 22, 4, 1), ...rect(9, 22, 4, 1),
      ...rect(3, 23, 4, 1), ...rect(9, 23, 4, 1),
    ],
  },
  
  sad: {
    pixels: [
      // Antennae (droopy)
      ...rect(6, 0, 4, 1),
      [3, 1], [4, 1], [11, 1], [12, 1],
      ...rect(2, 2, 12, 1),
      // Head outline
      ...rect(2, 3, 12, 1),
      ...rect(1, 4, 14, 1),
      ...rect(1, 5, 2, 8),
      ...rect(13, 5, 2, 8),
      ...rect(1, 12, 14, 1),
      ...rect(2, 13, 12, 1),
      // Eyes (droopy - lower in face)
      ...rect(4, 8, 2, 2),
      ...rect(10, 8, 2, 2),
      // Nose
      ...rect(7, 8, 2, 1),
      // Mouth (frown - inverted)
      [4, 11], [5, 11], [10, 11], [11, 11],
      [5, 10], [10, 10],
      // Tear
      [2, 8], [2, 9], [2, 10],
      // Body
      ...rect(6, 14, 4, 1),
      ...rect(4, 15, 8, 1),
      ...rect(3, 16, 10, 1),
      ...rect(3, 17, 10, 1),
      ...rect(3, 18, 10, 1),
      ...rect(4, 19, 8, 1),
      ...rect(1, 16, 2, 2),
      ...rect(13, 16, 2, 2),
      [6, 16], [7, 16], [8, 16], [9, 16],
      [6, 17], [7, 17], [8, 17], [9, 17],
      // Legs
      ...rect(4, 20, 3, 1), ...rect(9, 20, 3, 1),
      ...rect(4, 21, 3, 1), ...rect(9, 21, 3, 1),
      ...rect(3, 22, 4, 1), ...rect(9, 22, 4, 1),
      ...rect(3, 23, 4, 1), ...rect(9, 23, 4, 1),
    ],
  },
  
  tired: {
    pixels: [
      // Antennae (floppy)
      ...rect(6, 0, 4, 1),
      [3, 1], [4, 1], [11, 1], [12, 1],
      ...rect(2, 2, 12, 1),
      // Head outline
      ...rect(2, 3, 12, 1),
      ...rect(1, 4, 14, 1),
      ...rect(1, 5, 2, 8),
      ...rect(13, 5, 2, 8),
      ...rect(1, 12, 14, 1),
      ...rect(2, 13, 12, 1),
      // Eyes (horizontal lines - half closed)
      [4, 7], [5, 7],
      [10, 7], [11, 7],
      // Nose
      ...rect(7, 8, 2, 1),
      // Mouth (yawn - small open)
      ...rect(6, 10, 4, 1),
      [5, 11], [10, 11],
      ...rect(6, 11, 4, 1),
      // Zzz
      [14, 1], [15, 1],
      [15, 2], [15, 3],
      // Body
      ...rect(6, 14, 4, 1),
      ...rect(4, 15, 8, 1),
      ...rect(3, 16, 10, 1),
      ...rect(3, 17, 10, 1),
      ...rect(3, 18, 10, 1),
      ...rect(4, 19, 8, 1),
      ...rect(1, 16, 2, 2),
      ...rect(13, 16, 2, 2),
      [6, 16], [7, 16], [8, 16], [9, 16],
      [6, 17], [7, 17], [8, 17], [9, 17],
      // Legs
      ...rect(4, 20, 3, 1), ...rect(9, 20, 3, 1),
      ...rect(4, 21, 3, 1), ...rect(9, 21, 3, 1),
      ...rect(3, 22, 4, 1), ...rect(9, 22, 4, 1),
      ...rect(3, 23, 4, 1), ...rect(9, 23, 4, 1),
    ],
  },
  
  working: {
    pixels: [
      // Antennae
      ...rect(6, 0, 4, 1),
      [3, 1], [4, 1], [11, 1], [12, 1],
      ...rect(2, 2, 12, 1),
      // Head outline
      ...rect(2, 3, 12, 1),
      ...rect(1, 4, 14, 1),
      ...rect(1, 5, 2, 8),
      ...rect(13, 5, 2, 8),
      ...rect(1, 12, 14, 1),
      ...rect(2, 13, 12, 1),
      // Glasses (horizontal bar across eyes)
      ...rect(3, 6, 10, 1),   // Top of glasses
      ...rect(3, 8, 10, 1),   // Bottom of glasses
      [7, 6], [8, 6],        // Bridge top
      [7, 8], [8, 8],        // Bridge bottom
      [3, 7], [7, 7], [8, 7], [12, 7], // Side arms
      // Pupils
      [5, 7], [10, 7],
      // Nose
      ...rect(7, 9, 2, 1),
      // Mouth (determined line)
      ...rect(5, 11, 6, 1),
      // Body
      ...rect(6, 14, 4, 1),
      ...rect(4, 15, 8, 1),
      ...rect(3, 16, 10, 1),
      ...rect(3, 17, 10, 1),
      ...rect(3, 18, 10, 1),
      ...rect(4, 19, 8, 1),
      ...rect(1, 16, 2, 2),
      ...rect(13, 16, 2, 2),
      [6, 16], [7, 16], [8, 16], [9, 16],
      [6, 17], [7, 17], [8, 17], [9, 17],
      // Laptop
      ...rect(14, 17, 2, 1),
      ...rect(14, 18, 2, 2),
      // Legs
      ...rect(4, 20, 3, 1), ...rect(9, 20, 3, 1),
      ...rect(4, 21, 3, 1), ...rect(9, 21, 3, 1),
      ...rect(3, 22, 4, 1), ...rect(9, 22, 4, 1),
      ...rect(3, 23, 4, 1), ...rect(9, 23, 4, 1),
    ],
  },
  
  creative: {
    pixels: [
      // Antennae (bigger, excited)
      ...rect(6, 0, 4, 1),
      [2, 1], [3, 1], [12, 1], [13, 1],
      ...rect(2, 2, 12, 1),
      // Head outline
      ...rect(2, 3, 12, 1),
      ...rect(1, 4, 14, 1),
      ...rect(1, 5, 2, 8),
      ...rect(13, 5, 2, 8),
      ...rect(1, 12, 14, 1),
      ...rect(2, 13, 12, 1),
      // Eyes (big, wide open - 3x3)
      ...rect(3, 6, 3, 3),
      ...rect(10, 6, 3, 3),
      // Nose
      ...rect(7, 8, 2, 1),
      // Mouth (huge grin - wide rectangle)
      ...rect(3, 10, 10, 2),
      // Sparkles
      [0, 0], [15, 0],
      [0, 3], [15, 3],
      // Body
      ...rect(6, 14, 4, 1),
      ...rect(4, 15, 8, 1),
      ...rect(3, 16, 10, 1),
      ...rect(3, 17, 10, 1),
      ...rect(3, 18, 10, 1),
      ...rect(4, 19, 8, 1),
      // Arms up
      ...rect(0, 14, 2, 2),
      ...rect(14, 14, 2, 2),
      [6, 16], [7, 16], [8, 16], [9, 16],
      [6, 17], [7, 17], [8, 17], [9, 17],
      // Legs
      ...rect(4, 20, 3, 1), ...rect(9, 20, 3, 1),
      ...rect(4, 21, 3, 1), ...rect(9, 21, 3, 1),
      ...rect(3, 22, 4, 1), ...rect(9, 22, 4, 1),
      ...rect(3, 23, 4, 1), ...rect(9, 23, 4, 1),
    ],
  },
  
  dead: {
    pixels: [
      // Antennae (limp)
      ...rect(6, 0, 4, 1),
      [3, 1], [4, 1], [11, 1], [12, 1],
      ...rect(2, 2, 12, 1),
      // Head outline
      ...rect(2, 3, 12, 1),
      ...rect(1, 4, 14, 1),
      ...rect(1, 5, 2, 8),
      ...rect(13, 5, 2, 8),
      ...rect(1, 12, 14, 1),
      ...rect(2, 13, 12, 1),
      // X eyes (big, clearly visible)
      [4, 6], [5, 7],
      [5, 6], [4, 7],
      [10, 6], [11, 7],
      [11, 6], [10, 7],
      // Nose
      ...rect(7, 8, 2, 1),
      // Mouth (flat line)
      ...rect(5, 10, 6, 1),
      // Body
      ...rect(6, 14, 4, 1),
      ...rect(4, 15, 8, 1),
      ...rect(3, 16, 10, 1),
      ...rect(3, 17, 10, 1),
      ...rect(3, 18, 10, 1),
      ...rect(4, 19, 8, 1),
      ...rect(1, 16, 2, 2),
      ...rect(13, 16, 2, 2),
      // Legs
      ...rect(4, 20, 3, 1), ...rect(9, 20, 3, 1),
      ...rect(4, 21, 3, 1), ...rect(9, 21, 3, 1),
      ...rect(3, 22, 4, 1), ...rect(9, 22, 4, 1),
      ...rect(3, 23, 4, 1), ...rect(9, 23, 4, 1),
      // Ghost wisps
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
  const onPixels = new Set<string>();

  // ═══ COL 1: Character (left) ═══
  const CHAR_SCALE = 4;
  const CHAR_X = 2;
  const CHAR_Y = 0;

  for (const [sx, sy] of sprite.pixels) {
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

  // ═══ COL 2: Middle (mood + dialogue top, buttons bottom) ═══
  const COL2_X = 72;
  const COL3_X = 290;

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
  const onPixels = new Set<string>();
  const scale = 4;
  const ox = Math.floor((DISPLAY_W - 16 * scale) / 2);
  const oy = Math.floor((DISPLAY_H - 24 * scale) / 2);
  for (const [sx, sy] of sprite.pixels) {
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