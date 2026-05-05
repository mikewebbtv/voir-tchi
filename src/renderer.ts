/**
 * Voir-tchi BMP Renderer v13
 * 
 * MINIMAL pixel character matching reference image:
 * Small square head, dot eyes, tiny mouth, simple body
 * Very few pixels, high contrast, iconic
 * Grid: ~10×10, scaled up for display
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

// Minimal character: ~10 wide × 10 tall
const SPRITES: Record<string, { pixels: Pixel[] }> = {
  happy: {
    pixels: [
      // Head outline (6x4)
      ...rect(2, 0, 6, 1),  // Top
      [2, 1], [7, 1],        // Sides
      [2, 2], [7, 2],        // Sides
      ...rect(2, 3, 6, 1),  // Bottom
      // Eyes
      [3, 1], [6, 1],
      // Mouth (smile)
      [3, 2], [4, 2], [5, 2], [6, 2],
      // Body (4px wide, 3px tall)
      ...rect(3, 4, 4, 3),
      // Arms
      [1, 5], [8, 5],
      // Legs
      [3, 7], [4, 7], [5, 7], [6, 7],
      [3, 8], [6, 8],
    ],
  },
  hungry: {
    pixels: [
      ...rect(2, 0, 6, 1), [2, 1], [7, 1], [2, 2], [7, 2], ...rect(2, 3, 6, 1),
      // Wide eyes
      [3, 1], [4, 1], [5, 1], [6, 1],
      // Small mouth
      [4, 2], [5, 2],
      // Sweat
      [8, 0],
      ...rect(3, 4, 4, 3),
      [1, 5], [8, 5],
      [3, 7], [4, 7], [5, 7], [6, 7],
      [3, 8], [6, 8],
    ],
  },
  sad: {
    pixels: [
      ...rect(2, 0, 6, 1), [2, 1], [7, 1], [2, 2], [7, 2], ...rect(2, 3, 6, 1),
      // Eyes
      [3, 1], [6, 1],
      // Frown
      [3, 2], [6, 2],
      // Tear
      [1, 1], [1, 2],
      ...rect(3, 4, 4, 3),
      [1, 5], [8, 5],
      [3, 7], [4, 7], [5, 7], [6, 7],
      [3, 8], [6, 8],
    ],
  },
  tired: {
    pixels: [
      ...rect(2, 0, 6, 1), [2, 1], [7, 1], [2, 2], [7, 2], ...rect(2, 3, 6, 1),
      // Closed eyes (lines)
      [3, 1], [4, 1], [5, 1], [6, 1],
      // Small mouth
      [4, 2], [5, 2],
      // Zzz
      [8, 0], [9, 1],
      ...rect(3, 4, 4, 3),
      [1, 5], [8, 5],
      [3, 7], [4, 7], [5, 7], [6, 7],
      [3, 8], [6, 8],
    ],
  },
  working: {
    pixels: [
      ...rect(2, 0, 6, 1), [2, 1], [7, 1], [2, 2], [7, 2], ...rect(2, 3, 6, 1),
      // Glasses bar
      [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1],
      // Pupils
      [3, 2], [6, 2],
      // Straight mouth
      [3, 2], [4, 2], [5, 2], [6, 2],
      ...rect(3, 4, 4, 3),
      [1, 5], [8, 5],
      [3, 7], [4, 7], [5, 7], [6, 7],
      [3, 8], [6, 8],
    ],
  },
  creative: {
    pixels: [
      ...rect(2, 0, 6, 1), [2, 1], [7, 1], [2, 2], [7, 2], ...rect(2, 3, 6, 1),
      // Big eyes
      [3, 1], [4, 1], [5, 1], [6, 1],
      // Big grin
      [3, 2], [4, 2], [5, 2], [6, 2],
      ...rect(3, 4, 4, 3),
      // Arms up
      [0, 4], [9, 4],
      [3, 7], [4, 7], [5, 7], [6, 7],
      [3, 8], [6, 8],
    ],
  },
  dead: {
    pixels: [
      ...rect(2, 0, 6, 1), [2, 1], [7, 1], [2, 2], [7, 2], ...rect(2, 3, 6, 1),
      // X eyes
      [3, 1], [5, 1], [4, 2],
      [4, 1], [6, 2], [5, 2],
      // Flat mouth
      [4, 2], [5, 2],
      ...rect(3, 4, 4, 3),
      [1, 5], [8, 5],
      [3, 7], [4, 7], [5, 7], [6, 7],
      [3, 8], [6, 8],
    ],
  },
};

// ─── Pixel Font ───

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
  for (const ch of text.toUpperCase()) {
    const glyph = FONT[ch];
    if (!glyph) { cursorX += 4 * scale; continue; }
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        if (glyph[row] & (1 << (2 - col))) {
          for (let dx = 0; dx < scale; dx++)
            for (let dy = 0; dy < scale; dy++)
              onPixels.add(`${cursorX + col * scale + dx},${startY + row * scale + dy}`);
        }
      }
    }
    cursorX += 4 * scale;
  }
}

function drawBar(onPixels: Set<string>, x: number, y: number, w: number, h: number, pct: number): void {
  for (let bx = x; bx < x + w; bx++) for (let by = y; by < y + h; by++) onPixels.add(`${bx},${by}`);
  for (let bx = x+1; bx < x+w-1; bx++) for (let by = y+1; by < y+h-1; by++) onPixels.delete(`${bx},${by}`);
  const fw = Math.max(0, Math.floor((pct/100)*(w-2)));
  for (let bx = x+1; bx < x+1+fw; bx++) for (let by = y+1; by < y+h-1; by++) onPixels.add(`${bx},${by}`);
}

const DISPLAY_W = 526;
const DISPLAY_H = 100;

export function renderDisplay(
  state: string,
  stats: { hunger: number; happiness: number; energy: number; creativity: number },
  dialogue?: string
): string {
  const sprite = SPRITES[state] || SPRITES.happy;
  const onPixels = new Set<string>();

  // ═══ COL 1: Character (left) — scale 6x for visibility ═══
  const SCALE = 6;
  const OX = 5;
  const OY = 8;
  for (const [sx, sy] of sprite.pixels) {
    if (sx < 0 || sy < 0) continue;
    for (let dx = 0; dx < SCALE; dx++)
      for (let dy = 0; dy < SCALE; dy++) {
        const px = OX + sx * SCALE + dx, py = OY + sy * SCALE + dy;
        if (px < DISPLAY_W && py < DISPLAY_H) onPixels.add(`${px},${py}`);
      }
  }

  // ═══ COL 2: Middle ═══
  const COL2_X = 75;
  const COL3_X = 290;

  const moods: Record<string, string> = {
    happy: 'HAPPY', hungry: 'HUNGRY', sad: 'SAD', tired: 'TIRED',
    working: 'WORK', creative: 'CREATE', dead: 'DEAD',
  };
  drawText(onPixels, moods[state] || 'HAPPY', COL2_X, 3, 2);

  if (dialogue) {
    const maxC = Math.floor((COL3_X - COL2_X) / 8);
    const words = dialogue.toUpperCase().split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > maxC) { if (cur) lines.push(cur.trim()); cur = w; }
      else cur = (cur + ' ' + w).trim();
    }
    if (cur) lines.push(cur.trim());
    let dy = 16;
    for (let i = 0; i < Math.min(lines.length, 4); i++) { drawText(onPixels, lines[i], COL2_X, dy, 2); dy += 12; }
  }

  const actions = state === 'dead' ? ['REVIVE'] : ['FEED', 'PLAY', 'COFFEE', 'WORK', 'SLEEP', 'LOVE'];
  const COL2_W = COL3_X - COL2_X;
  const btnW = Math.floor((COL2_W - 12) / 3);
  const btnH = 14; const btnGX = 6; const btnGY = 3;
  const btnY0 = DISPLAY_H - 2 * btnH - btnGY - 4;

  for (let i = 0; i < actions.length; i++) {
    const c = i % 3, r = Math.floor(i / 3);
    const bx = COL2_X + c * (btnW + btnGX), by = btnY0 + r * (btnH + btnGY);
    if (by + btnH > DISPLAY_H) break;
    for (let px = bx; px < bx + btnW; px++) { onPixels.add(`${px},${by}`); onPixels.add(`${px},${by+btnH-1}`); }
    for (let py = by; py < by + btnH; py++) { onPixels.add(`${bx},${py}`); onPixels.add(`${bx+btnW-1},${py}`); }
    const lw = actions[i].length * 8;
    drawText(onPixels, actions[i], bx + Math.floor((btnW - lw) / 2), by + 4, 2);
  }

  // ═══ COL 3: Stats ═══
  const barW = DISPLAY_W - COL3_X - 20;
  let sy = 2;
  for (const s of [{l:'HUNGER',v:stats.hunger},{l:'HAPPY',v:stats.happiness},{l:'ENERGY',v:stats.energy},{l:'CREATE',v:stats.creativity}]) {
    drawText(onPixels, s.l, COL3_X, sy, 2); sy += 12;
    drawBar(onPixels, COL3_X, sy, barW, 8, s.v);
    drawText(onPixels, `${s.v}`, COL3_X + barW + 3, sy + 1, 2); sy += 11;
  }

  return toBmp(onPixels);
}

export function renderSprite(state: string): string {
  const sprite = SPRITES[state] || SPRITES.happy;
  const onPixels = new Set<string>();
  const s = 6, ox = Math.floor((DISPLAY_W - 10 * s) / 2), oy = Math.floor((DISPLAY_H - 9 * s) / 2);
  for (const [sx, sy] of sprite.pixels) {
    if (sx < 0 || sy < 0) continue;
    for (let dx = 0; dx < s; dx++) for (let dy = 0; dy < s; dy++) {
      const px = ox + sx * s + dx, py = oy + sy * s + dy;
      if (px < DISPLAY_W && py < DISPLAY_H) onPixels.add(`${px},${py}`);
    }
  }
  return toBmp(onPixels);
}

function toBmp(onPixels: Set<string>): string {
  const w = DISPLAY_W, h = DISPLAY_H;
  const rowSize = Math.ceil(w / 32) * 4;
  const pixSize = rowSize * h;
  const fileSize = 14 + 40 + 8 + pixSize;
  const buf = Buffer.alloc(fileSize, 0);
  let o = 0;
  buf.write('BM', o); o += 2;
  buf.writeUInt32LE(fileSize, o); o += 4; o += 4;
  buf.writeUInt32LE(62, o); o += 4;
  buf.writeUInt32LE(40, o); o += 4;
  buf.writeInt32LE(w, o); o += 4;
  buf.writeInt32LE(h, o); o += 4;
  buf.writeUInt16LE(1, o); o += 2;
  buf.writeUInt16LE(1, o); o += 2;
  buf.writeUInt32LE(0, o); o += 4;
  buf.writeUInt32LE(pixSize, o); o += 4;
  buf.writeInt32LE(2835, o); o += 4;
  buf.writeInt32LE(2835, o); o += 4;
  buf.writeUInt32LE(2, o); o += 4;
  buf.writeUInt32LE(0, o); o += 4;
  o += 4; // Index 0: black
  buf[o]=0; buf[o+1]=255; buf[o+2]=0; buf[o+3]=0; o += 4; // Index 1: green
  for (let y = h-1; y >= 0; y--)
    for (let bi = 0; bi < rowSize; bi++) {
      let v = 0;
      for (let b = 0; b < 8; b++) { const x = bi*8+b; if (x < w && onPixels.has(`${x},${y}`)) v |= (1 << (7-b)); }
      buf[o++] = v;
    }
  return buf.toString('base64');
}

export function prerenderAllSprites(): Record<string, string> {
  const c: Record<string, string> = {};
  for (const s of Object.keys(SPRITES)) c[s] = renderSprite(s);
  return c;
}