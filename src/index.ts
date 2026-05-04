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
import { renderDisplay } from './renderer';

// ─── Config ───

const PACKAGE_NAME = process.env.PACKAGE_NAME || 'org.voir.tchi';
const MENTRAOS_API_KEY = process.env.MENTRAOS_API_KEY || '';
const PORT = parseInt(process.env.PORT || '3020');
console.log(`[Config] PORT env=${process.env.PORT} using=${PORT}`);

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
        refreshDisplay(session, game, state);
      },
      onDeath: () => {
        refreshDisplay(session, game, 'dead', 'R.I.P. Say REVIVE');
      },
      onLowStat: (stat, value) => {
        refreshDisplay(session, game, game.getStats().state, `${stat} LOW: ${value}%!`);
      },
    });

    // Initial display
    const init = game.getStats();
    refreshDisplay(session, game, init.state, 'Say FEED, PLAY, COFFEE...');
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

// ─── Display ───

function refreshDisplay(session: AppSession, game: VoirTchiGame, state: string, dialogue?: string): void {
  const stats = game.stats;
  try {
    const bmp = renderDisplay(state, stats, dialogue);
    session.layouts.showBitmapView(bmp);
  } catch (e: any) {
    console.error(`[Voir-tchi] Bitmap error:`, e?.message);
    // Fallback to text
    session.layouts.showDoubleTextWall(
      `${state} Michael-tchi`,
      `H${stats.hunger} P${stats.happiness} E${stats.energy} C${stats.creativity}`
    );
  }

  // Dashboard (persistent bottom area)
  try {
    session.dashboard.content.writeToMain(
      `🍖${stats.hunger} 😊${stats.happiness} ⚡${stats.energy} 🎨${stats.creativity}`
    );
  } catch (e: any) {
    // Dashboard is optional, don't crash
  }
}

// ─── Command Handler ───

function handleCommand(session: AppSession, game: VoirTchiGame, text: string): void {
  const action = parseVoiceCommand(text);

  if (!action) {
    const validActions = ['feed', 'entertain', 'coffee', 'work', 'sleep', 'love', 'status', 'revive'];
    const lower = text.toLowerCase();
    if (validActions.includes(lower)) {
      const result = game.doAction(lower as any);
      showActionResult(session, game, result);
      return;
    }
    refreshDisplay(session, game, game.getStats().state, `Unknown: "${text}"`);
    return;
  }

  const result = game.doAction(action);
  showActionResult(session, game, result);
}

function showActionResult(session: AppSession, game: VoirTchiGame, result: any): void {
  const { state, dialogue } = result;
  // Show dialogue line at bottom of display
  refreshDisplay(session, game, state, dialogue);
}

// ─── Main ───

async function main() {
  console.log('Voir-tchi v0.2.0 — Tamagotchi for Smart Glasses');
  console.log(`  Package: ${PACKAGE_NAME}`);
  console.log(`  Port: ${PORT}`);

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