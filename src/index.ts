/**
 * Voir-tchi — Tamagotchi for Smart Glasses
 *
 * MentraOS app that puts Michael-tchi on your glasses.
 * Voice commands: feed, play, coffee, work, sleep, love, status, revive.
 * Stats decay every 30s. Keep your pixel pet alive!
 */

import { AppServer, AppSession, DashboardMode } from '@mentra/sdk';
import { VoirTchiGame } from './game';
import { parseVoiceCommand, getUnrecognizedResponse } from './voice';
import { prerenderAllSprites } from './renderer';

// ─── Config ───

const PACKAGE_NAME = process.env.PACKAGE_NAME || 'org.voir.tchi';
const MENTRAOS_API_KEY = process.env.MENTRAOS_API_KEY || '';
// Railway dynamically assigns PORT — must use whatever it gives us
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

    // ─── Create game instance for this session ───

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
        session.layouts.showBitmapView(spriteCache.dead || '');
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

    // ─── Show welcome ───

    session.layouts.showDoubleTextWall(
      '🐣 Voir-tchi',
      'Say feed, play, coffee, work, sleep, or love!',
      { durationMs: 8000 }
    );

    const initialState = game.getStats();
    session.layouts.showBitmapView(spriteCache[initialState.state] || spriteCache.happy);
    updateDashboard(session, game.stats, initialState.state);

    // ─── Start game tick ───

    game.start();

    // ─── Voice commands via transcription ───

    session.events.onTranscription((data) => {
      const text = data.text || '';
      if (!text.trim()) return;

      console.log(`[Voir-tchi] Voice: "${text}"`);
      handleCommand(session, game, text);
    });

    // ─── Button press as alternative input ───

    session.events.onButtonPress((data) => {
      // Single press = status, double press = feed, long press = sleep
      const action = data.pressType === 'single' ? 'status'
        : data.pressType === 'double' ? 'feed'
        : 'sleep';

      console.log(`[Voir-tchi] Button: ${data.pressType} → ${action}`);
      handleCommand(session, game, action);
    });

    // ─── Cleanup on session end ───

    session.events.onDisconnected(() => {
      game.stop();
      console.log(`[Voir-tchi] Session ended: ${sessionId}`);
    });
  }
}

// ─── Command Handler ───

function handleCommand(session: AppSession, game: VoirTchiGame, text: string): void {
  // Try voice command parsing first
  const action = parseVoiceCommand(text) || (isAction(text) ? text as any : null);

  if (!action) {
    // Check for direct action words (from button presses etc.)
    const validActions = ['feed', 'entertain', 'coffee', 'work', 'sleep', 'love', 'status', 'revive'];
    if (validActions.includes(text.toLowerCase())) {
      const result = game.doAction(text.toLowerCase() as any);
      showActionResult(session, result);
      return;
    }

    // Unrecognized
    session.layouts.showTextWall(getUnrecognizedResponse(text), { durationMs: 5000 });
    return;
  }

  const result = game.doAction(action);
  showActionResult(session, result);
}

function isAction(text: string): boolean {
  return ['feed', 'entertain', 'coffee', 'work', 'sleep', 'love', 'status', 'revive'].includes(text.toLowerCase());
}

// ─── Display Helpers ───

function showActionResult(session: AppSession, result: any): void {
  const { state, dialogue, action } = result;

  // Show pixel art
  const bmp = spriteCache[state] || spriteCache.happy;
  session.layouts.showBitmapView(bmp);

  // Show dialogue as text overlay
  if (action === 'status') {
    // Status gets the formatted text view
    session.layouts.showTextWall(dialogue, { durationMs: 8000 });
  } else if (state === 'dead') {
    session.layouts.showReferenceCard(
      '💀 R.I.P. Michael-tchi',
      `${dialogue}\n\nSay "revive" to bring him back`,
      { durationMs: 30000 }
    );
  } else {
    // Action response — short and punchy for glasses
    session.layouts.showDoubleTextWall(
      getActionEmoji(action),
      dialogue,
      { durationMs: 5000 }
    );
  }
}

function getActionEmoji(action: string): string {
  const emojis: Record<string, string> = {
    feed: '🍕 FED',
    entertained: '😂 PLAY',
    coffeed: '☕ COFFEE',
    worked: '💻 WORK',
    slept: '💤 SLEEP',
    loved: '❤️ LOVE',
    revived: '🧟 REVIVED',
    status: '📊 STATUS',
    dead: '💀 DEAD',
  };
  return emojis[action] || '🎯';
}

function updateDashboard(session: AppSession, stats: any, state: string): void {
  const emoji = state === 'dead' ? '💀' : state === 'hungry' ? '😰' : state === 'tired' ? '😫' : state === 'sad' ? '😢' : '😊';

  // Dashboard card format: compact stats
  const left = `${emoji} tchi`;
  const right = `🍖${stats.hunger} 😊${stats.happiness} ⚡${stats.energy}`;

  session.dashboard.writeToMain(`${emoji} 🍖${stats.hunger} 😊${stats.happiness} ⚡${stats.energy} 🎨${stats.creativity}`);
}

// ─── Main ───

async function main() {
  console.log('Voir-tchi v0.1.0 — Tamagotchi for Smart Glasses');
  console.log(`  Package: ${PACKAGE_NAME}`);
  console.log(`  Port: ${PORT}`);
  console.log(`[Config] PORT env=${process.env.PORT} using=${PORT}`);

  // Pre-render all sprites at startup
  console.log('  Pre-rendering sprites...');
  spriteCache = prerenderAllSprites();
  console.log(`  Cached ${Object.keys(spriteCache).length} sprites`);

  // Start MentraOS app server
  const server = new VoirTchiServer();
  await server.start();

  // The SDK extends Hono but doesn't start an HTTP server in start().
  // We need to serve it ourselves using Bun's built-in server.
  const port = PORT;
  console.log(`  Starting HTTP server on 0.0.0.0:${port}...`);

  Bun.serve({
    port,
    fetch: server.fetch.bind(server),
  });

  console.log(`  🐣 Voir-tchi is live on port ${port}!`);
  console.log('  Waiting for MentraOS connections...');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});