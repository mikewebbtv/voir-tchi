/**
 * Voir-tchi — Tamagotchi for Smart Glasses
 *
 * MentraOS app that puts Michael-tchi on your glasses.
 * Voice commands: feed, play, coffee, work, sleep, love, status, revive.
 * Stats decay every 30s. Keep your pixel pet alive!
 */

import { AppServer, AppSession, ViewType } from '@mentra/sdk';
import { VoirTchiGame } from './game';
import { parseVoiceCommand, getUnrecognizedResponse } from './voice';
import { prerenderAllSprites } from './renderer';

// ─── Config ───

const PACKAGE_NAME = process.env.PACKAGE_NAME || 'org.voir.tchi';
const MENTRAOS_API_KEY = process.env.MENTRAOS_API_KEY || '';
const PORT = parseInt(process.env.PORT || '3020');
console.log(`[Config] PORT env=${process.env.PORT} using=${PORT}`);

// ─── State ───

let spriteCache: Record<string, string>;

// ─── App Server ───

class VoirTchiServer extends AppServer {
  constructor() {
    super({
      packageName: PACKAGE_NAME,
      apiKey: MENTRAOS_API_KEY,
      port: PORT,
    });
  }

  protected async onSession(session: AppSession, sessionId: string, userId: string): Promise<void> {
    console.log(`[Voir-tchi] Session started: ${sessionId} (user: ${userId})`);
    try {

    const game = new VoirTchiGame({
      onTick: (stats, state) => {
        updateDashboard(session, stats, state);
      },
      onDeath: () => {
        session.layouts.showReferenceCard(
          '💀 Michael-tchi has died',
          'Say "revive" to bring him back!',
          { durationMs: 30000 }
        );
        showBitmap(session, 'dead');
      },
      onLowStat: (stat, value) => {
        const emoji = stat === 'hunger' ? '🍖' : stat === 'happiness' ? '😊' : '⚡';
        const urgency = value < 15 ? 'URGENT' : 'Warning';
        session.layouts.showTextWall(
          `${urgency}: ${emoji} ${stat} is at ${value}%!`,
          { durationMs: 8000 }
        );
      },
    });

    // Show welcome then character
    session.layouts.showTextWall('🐣 Voir-tchi\nSay: feed, play, coffee, work, sleep, love', { durationMs: 5000 });

    const initialState = game.getStats();
    showBitmap(session, initialState.state);
    updateDashboard(session, game.stats, initialState.state);

    game.start();

    // Voice commands
    session.events.onTranscription((data) => {
      const text = data.text || '';
      if (!text.trim()) return;
      console.log(`[Voir-tchi] Voice: "${text}"`);
      handleCommand(session, game, text);
    });

    // Button press
    session.events.onButtonPress((data) => {
      const action = data.pressType === 'single' ? 'status'
        : data.pressType === 'double' ? 'feed'
        : 'sleep';
      console.log(`[Voir-tchi] Button: ${data.pressType} → ${action}`);
      handleCommand(session, game, action);
    });

    // Cleanup
    session.events.onDisconnected(() => {
      game.stop();
      console.log(`[Voir-tchi] Session ended: ${sessionId}`);
    });

    } catch (err: any) {
      console.error(`[Voir-tchi] ❌ onSession error:`, err?.message || err);
      console.error(`[Voir-tchi] ❌ Stack:`, err?.stack || 'no stack');
    }
  }
}

// ─── Display Helpers ───

function showBitmap(session: AppSession, state: string): void {
  const bmp = spriteCache[state] || spriteCache.happy;
  if (bmp) {
    try {
      session.layouts.showBitmapView(bmp);
    } catch (e: any) {
      console.error(`[Voir-tchi] Bitmap display error:`, e?.message);
      // Fallback to text
      showCharacterText(session, state);
    }
  } else {
    showCharacterText(session, state);
  }
}

function showCharacterText(session: AppSession, state: string): void {
  const emojis: Record<string, string> = {
    happy: '😊', hungry: '😰', sad: '😢', tired: '😫',
    working: '💻', creative: '💡', dead: '💀',
  };
  const emoji = emojis[state] || '😊';
  session.layouts.showDoubleTextWall(
    `${emoji} Michael-tchi`,
    `Mood: ${state}`
  );
}

function showActionResult(session: AppSession, result: any): void {
  const { state, dialogue, action } = result;

  // Show pixel art character
  showBitmap(session, state);

  // Show dialogue as text overlay (replaces bitmap after brief moment)
  if (action === 'status') {
    // Show full stats text after bitmap
    setTimeout(() => {
      session.layouts.showTextWall(dialogue, { durationMs: 6000 });
    }, 1500);
  } else if (state === 'dead') {
    session.layouts.showReferenceCard(
      '💀 R.I.P. Michael-tchi',
      `${dialogue}\n\nSay "revive" to bring him back`,
      { durationMs: 30000 }
    );
  } else {
    // Brief bitmap, then dialogue
    setTimeout(() => {
      session.layouts.showDoubleTextWall(
        dialogue,
        `Mood: ${state}`
      );
    }, 1500);
  }
}

function handleCommand(session: AppSession, game: VoirTchiGame, text: string): void {
  const action = parseVoiceCommand(text);

  if (!action) {
    const validActions = ['feed', 'entertain', 'coffee', 'work', 'sleep', 'love', 'status', 'revive'];
    const lower = text.toLowerCase();
    if (validActions.includes(lower)) {
      const result = game.doAction(lower as any);
      showActionResult(session, result);
      return;
    }
    session.layouts.showTextWall(getUnrecognizedResponse(text), { durationMs: 5000 });
    return;
  }

  const result = game.doAction(action);
  showActionResult(session, result);
}

function updateDashboard(session: AppSession, stats: any, state: string): void {
  const emoji = state === 'dead' ? '💀' : state === 'hungry' ? '😰' : state === 'tired' ? '😫' : state === 'sad' ? '😢' : '😊';

  try {
    session.dashboard.content.writeToMain(
      `${emoji} 🍖${stats.hunger} 😊${stats.happiness} ⚡${stats.energy} 🎨${stats.creativity}`
    );
  } catch (e: any) {
    console.error(`[Voir-tchi] Dashboard error:`, e?.message);
  }
}

// ─── Main ───

async function main() {
  console.log('Voir-tchi v0.1.0 — Tamagotchi for Smart Glasses');
  console.log(`  Package: ${PACKAGE_NAME}`);
  console.log(`  Port: ${PORT}`);

  console.log('  Pre-rendering sprites...');
  spriteCache = prerenderAllSprites();
  console.log(`  Cached ${Object.keys(spriteCache).length} sprites`);

  const server = new VoirTchiServer();
  await server.start();

  Bun.serve({
    port: PORT,
    fetch: server.fetch.bind(server),
  });

  console.log(`  🐣 Voir-tchi is live on port ${PORT}!`);
  console.log('  Waiting for MentraOS connections...');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});