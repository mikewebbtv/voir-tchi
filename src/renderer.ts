/**
 * Voir-tchi BMP Renderer v14
 * 
 * CUTE SOLID BLOB character — Game Boy style.
 * On 1-bit: FILLED body with CUTOUT features (eyes, mouth).
 * Big head, tiny body, expressive face.
 * Think: Kirby meets Tamagotchi.
 * 
 * Grid: 12×12, scale 5x = 60×60 on display
 */

type Pixel = [number, number];

function rect(x: number, y: number, w: number, h: number): Pixel[] {
  const p: Pixel[] = [];
  for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < h; dy++) p.push([x+dx, y+dy]);
  return p;
}

// Solid blob body with cutout features
// 12 wide × 14 tall

const SPRITES: Record<string, { pixels: Pixel[] }> = {
  happy: { pixels: [
    // Big round head (filled)
    ...rect(3, 0, 6, 1),    // top
    ...rect(2, 1, 8, 1),
    ...rect(1, 2, 10, 1),
    ...rect(1, 3, 10, 1),
    ...rect(0, 4, 12, 1),   // widest
    ...rect(0, 5, 12, 1),
    ...rect(0, 6, 12, 1),
    ...rect(0, 7, 12, 1),
    ...rect(1, 8, 10, 1),
    ...rect(2, 9, 8, 1),
    ...rect(3, 10, 6, 1),
    // CUTOUT eyes (2x1 black gaps)
    // We DON'T draw these pixels — they stay transparent = black on display
    // But since we're additive (Set), we need to draw everything EXCEPT the eyes.
    // Easier: draw full head, then we'll handle eyes as "not drawn" naturally.
    // Actually — we draw the head outline + fill, and the eyes will be holes.
    // But with Set approach, we can't "undraw". So: draw head as outline + fill,
    // and eyes will be the gaps where we DON'T add pixels.
    // Body
    ...rect(4, 11, 4, 1),   // neck
    ...rect(3, 12, 6, 1),   // body
    ...rect(2, 13, 2, 1),   // left leg
    ...rect(8, 13, 2, 1),   // right leg
  ]},

  // For ALL sprites: draw the FULL head, then we define what to CUT OUT
  // Since we can only add pixels (Set), the "cutouts" are simply pixels we don't add.
  // So: define the full head fill + the features that ARE drawn on top.
  // Features like eyes that should be BLACK = just don't draw those pixels.
};

// Better approach: define EACH sprite as full pixel list, including body.
// Features that should be BLACK (eyes, mouth) are simply NOT in the pixel list.

function makeSprite(eyes: Pixel[], mouth: Pixel[], extras: Pixel[] = []): Pixel[] {
  // Full round head (solid fill)
  const head: Pixel[] = [
    ...rect(3, 0, 6, 1),   // top of head
    ...rect(2, 1, 8, 1),   // upper head
    ...rect(1, 2, 10, 1),  // mid head
    ...rect(1, 3, 10, 1),  
    ...rect(0, 4, 12, 1),  // widest part
    ...rect(0, 5, 12, 1),
    ...rect(0, 6, 12, 1),
    ...rect(0, 7, 12, 1),
    ...rect(1, 8, 10, 1),
    ...rect(2, 9, 8, 1),
    ...rect(3, 10, 6, 1),  // chin
  ];
  
  // Body (solid)
  const body: Pixel[] = [
    ...rect(4, 11, 4, 1),  // neck
    ...rect(3, 12, 6, 2),  // torso
    ...rect(2, 12, 1, 2),  // left arm
    ...rect(9, 12, 1, 2),  // right arm
    ...rect(3, 14, 2, 1),   // left foot
    ...rect(7, 14, 2, 1),   // right foot
  ];

  // Build pixel set from head, body, eyes, mouth, extras
  const allPixels = new Set<string>();
  for (const [x, y] of [...head, ...body, ...eyes, ...mouth, ...extras]) {
    allPixels.add(`${x},${y}`);
  }

  // Now REMOVE eye holes and mouth holes from the solid head
  // Eyes are "holes" — pixels that should be BLACK
  // We need the INVERSE: draw the head everywhere EXCEPT the eye positions
  // With Set, we just don't add them. But head already includes them.
  // So: start from head, remove eye/mouth positions.
  
  // Actually this approach is wrong. Let me use a different strategy:
  // Draw head as SOLID, then the "features" (eyes, mouth) on a SEPARATE layer
  // that we subtract. But Set doesn't support subtraction easily.
  
  // SIMPLEST: Just list ALL pixels that should be ON.
  // Head outline + fill, MINUS eye positions, MINUS mouth positions.
  return [...head, ...body, ...eyes, ...mouth, ...extras].filter(([x, y]) => {
    // Remove pixels that should be eye/mouth holes (they overlap with head fill)
    // Eyes and mouth that are "holes" should NOT be in the final set
    return true; // We'll filter separately
  });
}

// FINAL APPROACH: Each sprite explicitly lists every green pixel.
// Head is SOLID. Eyes/mouth are HOLES (transparent = black on display).
// We achieve holes by NOT including those pixels in the set.

const SPRITE_DEFS: Record<string, { eyes: Pixel[], mouth: Pixel[], extras: Pixel[] }> = {
  happy:       { eyes: [[3,5],[4,5],[7,5],[8,5]], mouth: [[4,8],[5,8],[6,8],[7,8]], extras: [] },
  hungry:      { eyes: [[3,5],[4,5],[5,5],[7,5],[8,5],[9,5]], mouth: [[5,8],[6,8]], extras: [[11,2]] },
  sad:         { eyes: [[3,6],[4,6],[7,6],[8,6]], mouth: [[4,8],[7,8],[5,9],[6,9]], extras: [[0,6],[0,7]] },
  tired:       { eyes: [[3,6],[4,6],[5,6],[7,6],[8,6],[9,6]], mouth: [[5,8],[6,8]], extras: [[11,0],[12,1]] },
  working:     { eyes: [[3,5],[4,5],[7,5],[8,5]], mouth: [[4,8],[5,8],[6,8],[7,8]], extras: [[3,5],[4,5],[7,5],[8,5],[5,6],[6,6]] },
  creative:    { eyes: [[3,5],[4,5],[5,5],[7,5],[8,5],[9,5]], mouth: [[3,8],[4,8],[5,8],[6,8],[7,8],[8,8]], extras: [[0,0],[11,0]] },
  dead:        { eyes: [[4,5],[5,6],[8,5],[9,6],[5,5],[4,6],[8,6],[9,5]], mouth: [[4,8],[5,8],[6,8],[7,8]], extras: [] },
};

function buildPixels(state: string): Pixel[] {
  const def = SPRITE_DEFS[state] || SPRITE_DEFS.happy;
  
  // Solid head pixels
  const headFill: Pixel[] = [
    ...rect(3, 0, 6, 1),   // top
    ...rect(2, 1, 8, 1),   // upper
    ...rect(1, 2, 10, 1),  // mid
    ...rect(1, 3, 10, 1),
    ...rect(0, 4, 12, 1),  // widest
    ...rect(0, 5, 12, 1),
    ...rect(0, 6, 12, 1),
    ...rect(0, 7, 12, 1),
    ...rect(1, 8, 10, 1),
    ...rect(2, 9, 8, 1),
    ...rect(3, 10, 6, 1),  // chin
  ];
  
  // Body
  const body: Pixel[] = [
    ...rect(4, 11, 4, 1),  // neck
    ...rect(3, 12, 6, 2),  // torso
    ...rect(2, 12, 1, 2),  // left arm
    ...rect(9, 12, 1, 2),  // right arm
    ...rect(3, 14, 2, 1),  // left foot
    ...rect(7, 14, 2, 1),  // right foot
  ];

  // Eye/mouth holes — convert to set for fast lookup
  const holes = new Set<string>();
  for (const [x, y] of [...def.eyes, ...def.mouth]) holes.add(`${x},${y}`);

  // Combine: head + body + extras, MINUS holes
  const result: Pixel[] = [];
  const seen = new Set<string>();
  
  for (const [x, y] of [...headFill, ...body, ...def.extras]) {
    if (holes.has(`${x},${y}`)) continue; // Skip hole pixels
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push([x, y]);
  }
  
  // Add extras that aren't in head/body (like Zzz, sweat)
  for (const [x, y] of def.extras) {
    const key = `${x},${y}`;
    if (!seen.has(key) && !holes.has(key)) {
      seen.add(key);
      result.push([x, y]);
    }
  }
  
  return result;
}

// Build actual sprite map
const SPRITES_ACTUAL: Record<string, Pixel[]> = {};
for (const state of Object.keys(SPRITE_DEFS)) {
  SPRITES_ACTUAL[state] = buildPixels(state);
}

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

function drawText(S: Set<string>, text: string, sx: number, sy: number, sc: number = 1): void {
  let cx = sx;
  for (const ch of text.toUpperCase()) {
    const g = FONT[ch]; if (!g) { cx += 4*sc; continue; }
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++)
      if (g[r] & (1 << (2-c))) for (let dx = 0; dx < sc; dx++) for (let dy = 0; dy < sc; dy++) S.add(`${cx+c*sc+dx},${sy+r*sc+dy}`);
    cx += 4*sc;
  }
}

function drawBar(S: Set<string>, x: number, y: number, w: number, h: number, pct: number): void {
  for (let bx=x;bx<x+w;bx++) for (let by=y;by<y+h;by++) S.add(`${bx},${by}`);
  for (let bx=x+1;bx<x+w-1;bx++) for (let by=y+1;by<y+h-1;by++) S.delete(`${bx},${by}`);
  const fw = Math.max(0,Math.floor((pct/100)*(w-2)));
  for (let bx=x+1;bx<x+1+fw;bx++) for (let by=y+1;by<y+h-1;by++) S.add(`${bx},${by}`);
}

const W = 526, H = 100;

export function renderDisplay(state: string, stats: {hunger:number;happiness:number;energy:number;creativity:number}, dialogue?: string): string {
  const S = new Set<string>();
  const pixels = buildPixels(state);
  const SC = 5;
  const OX = 5, OY = 3;
  for (const [x,y] of pixels) {
    if (x<0||y<0) continue;
    for (let dx=0;dx<SC;dx++) for (let dy=0;dy<SC;dy++) {
      const px=OX+x*SC+dx, py=OY+y*SC+dy;
      if (px<W&&py<H) S.add(`${px},${py}`);
    }
  }
  
  const C2=75, C3=290;
  const moods: Record<string,string> = {happy:'HAPPY',hungry:'HUNGRY',sad:'SAD',tired:'TIRED',working:'WORK',creative:'CREATE',dead:'DEAD'};
  drawText(S, moods[state]||'HAPPY', C2, 3, 2);
  if (dialogue) {
    const ml = Math.floor((C3-C2)/8);
    const words = dialogue.toUpperCase().split(' ');
    const lines: string[] = []; let cur = '';
    for (const w of words) { if ((cur+' '+w).trim().length>ml) { if(cur)lines.push(cur.trim()); cur=w; } else cur=(cur+' '+w).trim(); }
    if (cur) lines.push(cur.trim());
    let dy=16; for (let i=0;i<Math.min(lines.length,4);i++) { drawText(S,lines[i],C2,dy,2); dy+=12; }
  }
  
  const actions = state==='dead'?['REVIVE']:['FEED','PLAY','COFFEE','WORK','SLEEP','LOVE'];
  const bw=Math.floor((C3-C2-12)/3), bh=14, gx=6, gy=3;
  const by0=H-2*bh-gy-4;
  for (let i=0;i<actions.length;i++) {
    const c=i%3,r=Math.floor(i/3), bx=C2+c*(bw+gx), by=by0+r*(bh+gy);
    if (by+bh>H) break;
    for (let px=bx;px<bx+bw;px++) { S.add(`${px},${by}`); S.add(`${px},${by+bh-1}`); }
    for (let py=by;py<by+bh;py++) { S.add(`${bx},${py}`); S.add(`${bx+bw-1},${py}`); }
    drawText(S, actions[i], bx+Math.floor((bw-actions[i].length*8)/2), by+4, 2);
  }

  const bW=W-C3-20; let sy=2;
  for (const s of [{l:'HUNGER',v:stats.hunger},{l:'HAPPY',v:stats.happiness},{l:'ENERGY',v:stats.energy},{l:'CREATE',v:stats.creativity}]) {
    drawText(S,s.l,C3,sy,2); sy+=12;
    drawBar(S,C3,sy,bW,8,s.v); drawText(S,`${s.v}`,C3+bW+3,sy+1,2); sy+=11;
  }
  return toBmp(S);
}

export function renderSprite(state: string): string {
  const S = new Set<string>();
  const pixels = buildPixels(state);
  const SC=6, ox=Math.floor((W-12*SC)/2), oy=Math.floor((H-14*SC)/2);
  for (const [x,y] of pixels) {
    if (x<0||y<0) continue;
    for (let dx=0;dx<SC;dx++) for (let dy=0;dy<SC;dy++) {
      const px=ox+x*SC+dx, py=oy+y*SC+dy;
      if (px<W&&py<H) S.add(`${px},${py}`);
    }
  }
  return toBmp(S);
}

function toBmp(S: Set<string>): string {
  const rs=Math.ceil(W/32)*4, ps=rs*H, fs=14+40+8+ps;
  const b=Buffer.alloc(fs,0); let o=0;
  b.write('BM',o);o+=2; b.writeUInt32LE(fs,o);o+=4; o+=4; b.writeUInt32LE(62,o);o+=4;
  b.writeUInt32LE(40,o);o+=4; b.writeInt32LE(W,o);o+=4; b.writeInt32LE(H,o);o+=4;
  b.writeUInt16LE(1,o);o+=2; b.writeUInt16LE(1,o);o+=2; b.writeUInt32LE(0,o);o+=4;
  b.writeUInt32LE(ps,o);o+=4; b.writeInt32LE(2835,o);o+=4; b.writeInt32LE(2835,o);o+=4;
  b.writeUInt32LE(2,o);o+=4; b.writeUInt32LE(0,o);o+=4;
  o+=4; b[o]=0;b[o+1]=255;b[o+2]=0;b[o+3]=0;o+=4;
  for(let y=H-1;y>=0;y--) for(let bi=0;bi<rs;bi++) {
    let v=0; for(let bit=0;bit<8;bit++) { const x=bi*8+bit; if(x<W&&S.has(`${x},${y}`)) v|=(1<<(7-bit)); }
    b[o++]=v;
  }
  return b.toString('base64');
}

export function prerenderAllSprites(): Record<string,string> { const c:Record<string,string>={}; for(const s of Object.keys(SPRITE_DEFS)) c[s]=renderSprite(s); return c; }