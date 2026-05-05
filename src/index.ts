/**
 * Voir-tchi v0.3.0 — Tamagotchi for Smart Glasses
 *
 * Features:
 * - Animated character on glasses (3-frame idle loop per mood)
 * - Dialogue via SDK text (not pixel font)
 * - Proactive low-stat notifications pushed to glasses
 * - Session persistence (survives reconnects)
 * - Rebalanced game pacing (60s ticks, slower decay)
 *
 * Voice: feed, play, coffee, work, sleep, love, status, revive
 */

import { AppServer, AppSession, ViewType } from '@mentra/sdk';
import { VoirTchiGame } from './game';
import { parseVoiceCommand } from './voice';
import { renderCharacter, renderAnimationFrames, prerenderAll } from './renderer';

// ─── Config ───

const PACKAGE_NAME = process.env.PACKAGE_NAME || 'org.voir.tchi';
const MENTRAOS_API_KEY = process.env.MENTRAOS_API_KEY || '';
const PORT = parseInt(process.env.PORT || '3020');
console.log(`[Config] PORT env=${process.env.PORT} using=${PORT}`);

// ─── Animation State ───

interface AnimationController {
  stop(): void;
}

// ─── Pre-rendered Frame Cache ───

const frameCache: Record<string, string[]> = prerenderAll();
console.log('[Cache] Pre-rendered frames for:', Object.keys(frameCache).join(', '));

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
      await runSession(session, sessionId, userId);
    } catch (err: any) {
      console.error(`[Voir-tchi] ❌ onSession error:`, err?.message || err);
      console.error(`[Voir-tchi] ❌ Stack:`, err?.stack || 'no stack');
    }
  }
}

async function runSession(session: AppSession, sessionId: string, userId: string): Promise<void> {
  let currentAnimation: AnimationController | null = null;
  let lastState: string = '';
  let lastDialogue: string = '';
  let idleTimeout: ReturnType<typeof setTimeout> | null = null;

  const game = new VoirTchiGame({
    onTick: (stats, state) => {
      updateDisplay(state);
      updateDashboard(stats);
    },
    onDeath: () => {
      stopAnimation();
      const frames = frameCache['dead'] || [renderCharacter('dead')];
      session.layouts.showBitmapAnimation(frames, 1650, true);
      session.layouts.showDoubleTextWall('Voir-tchi has died', 'Say REVIVE to bring me back');
      updateDashboard(game.stats);
    },
    onLowStat: (stat, value) => {
      pushLowStatNotification(session, stat, value);
    },
    onCritical: (stats) => {
      // Push urgent notification
      const lowest = Math.min(stats.hunger, stats.happiness, stats.energy);
      const label = lowest === stats.hunger ? 'Hunger' : lowest === stats.energy ? 'Energy' : 'Happiness';
      session.layouts.showReferenceCard(
        '⚠️ CRITICAL',
        `${label} at ${lowest}%! Act now!`
      );
    },
    onStateChange: (oldState, newState) => {
      console.log(`[Voir-tchi] State: ${oldState} → ${newState}`);
      updateDisplay(newState);
    },
  });

  // Initial display
  const init = game.getStats();
  lastState = init.state;
  showAnimatedCharacter(init.state);
  session.layouts.showDoubleTextWall('Voir-tchi', 'Say FEED, PLAY, COFFEE, WORK, SLEEP, or LOVE');
  updateDashboard(game.stats);
  game.start();

  // ─── Display Functions ───

  function showAnimatedCharacter(state: string): void {
    stopAnimation();
    const frames = frameCache[state] || frameCache['happy'];
    if (frames && frames.length > 1) {
      currentAnimation = session.layouts.showBitmapAnimation(frames, 1650, true);
    } else {
      session.layouts.showBitmapView(frames?.[0] || renderCharacter(state));
    }
    lastState = state;
  }

  function stopAnimation(): void {
    if (currentAnimation) {
      try { currentAnimation.stop(); } catch { /* already stopped */ }
      currentAnimation = null;
    }
  }

  function updateDisplay(state: string): void {
    if (state !== lastState) {
      showAnimatedCharacter(state);
    }
    updateDashboard(game.stats);
  }

  function showActionFeedback(state: string, dialogue: string): void {
    lastDialogue = dialogue;
    showAnimatedCharacter(state);
    // Show dialogue via SDK text
    session.layouts.showDoubleTextWall(moodLabel(state), dialogue);
    // Return to idle after 5s
    resetIdleTimeout();
  }

  function resetIdleTimeout(): void {
    if (idleTimeout) clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      const currentState = game.getStats().state;
      showAnimatedCharacter(currentState);
      session.layouts.showDoubleTextWall(moodLabel(currentState), getidleText(currentState));
    }, 5000);
  }

  function updateDashboard(stats: typeof game.stats): void {
    try {
      session.dashboard.content.writeToMain(
        `H:${stats.hunger} P:${stats.happiness} E:${stats.energy} C:${stats.creativity}`
      );
    } catch { /* optional */ }
  }

  // ─── Voice & Button Handlers ───

  session.events.onTranscription((data) => {
    const text = data.text || '';
    if (!text.trim()) return;
    console.log(`[Voir-tchi] Voice: "${text}"`);
    handleCommand(text);
  });

  session.events.onButtonPress((data) => {
    const action = data.pressType === 'short' ? 'status'
      : data.pressType === 'long' ? 'sleep'
      : 'status';
    console.log(`[Voir-tchi] Button: ${data.pressType} → ${action}`);
    handleCommand(action);
  });

  session.events.onDisconnected(() => {
    game.stop();
    stopAnimation();
    if (idleTimeout) clearTimeout(idleTimeout);
    console.log(`[Voir-tchi] Session ended: ${sessionId}`);
  });

  function handleCommand(text: string): void {
    const action = parseVoiceCommand(text);

    if (!action) {
      // Check if it's a raw action word
      const validActions = ['feed', 'entertain', 'coffee', 'work', 'sleep', 'love', 'status', 'revive'];
      const lower = text.toLowerCase().trim();
      if (validActions.includes(lower)) {
        const result = game.doAction(lower as any);
        showActionFeedback(result.state, result.dialogue);
        return;
      }
      // Unknown command
      session.layouts.showDoubleTextWall('??', `Unknown: "${text}"`);
      resetIdleTimeout();
      return;
    }

    const result = game.doAction(action);
    showActionFeedback(result.state, result.dialogue);
  }
}

// ─── Helpers ───

function moodLabel(state: string): string {
  const labels: Record<string, string> = {
    happy: '😊 Happy',
    hungry: '🍽️ Hungry',
    sad: '😢 Sad',
    tired: '😴 Tired',
    working: '💻 Working',
    creative: '💡 Creative',
    critical: '⚠️ Critical',
    dead: '💀 Dead',
  };
  return labels[state] || '😊 Happy';
}

function getidleText(state: string): string {
  const idle: Record<string, string> = {
    happy: 'All good! Say a command',
    hungry: 'Feed me!',
    sad: 'I need some love...',
    tired: 'I should sleep...',
    working: 'In the zone',
    creative: 'Ideas flowing!',
    critical: 'Need help!',
    dead: 'Say REVIVE',
  };
  return idle[state] || 'Say a command';
}

function pushLowStatNotification(session: AppSession, stat: string, value: number): void {
  const labels: Record<string, string> = { hunger: 'Hunger', happiness: 'Happiness', energy: 'Energy' };
  const label = labels[stat] || stat;
  const emoji = stat === 'hunger' ? '🍽️' : stat === 'happiness' ? '😊' : '⚡';

  session.layouts.showReferenceCard(
    `${emoji} ${label} Low!`,
    `${label} is at ${value}%. Take care of me!`
  );
}

// ─── Main ───

async function main() {
  console.log('Voir-tchi v0.3.0 — Tamagotchi for Smart Glasses');
  console.log(`  Package: ${PACKAGE_NAME}`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Animation: 3-frame idle loop per mood`);
  console.log(`  Decay: -1 per 60s (pet lasts ~3h ignored)`);
  console.log(`  Persistence: auto-save on tick + action`);

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