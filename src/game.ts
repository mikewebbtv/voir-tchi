/**
 * Voir-tchi Game Engine v2
 *
 * Rebalanced: slower decay, persistence, low-stat notifications.
 * Stats decay every 60s (was 30s). Decay halved.
 * Death at 0 on any stat, with grace period (critical state at <10).
 */

// ─── Types ───

export interface Stats {
  hunger: number;
  happiness: number;
  energy: number;
  creativity: number;
  born: number;
  alive: boolean;
}

export type CharacterState = 'happy' | 'hungry' | 'sad' | 'tired' | 'working' | 'creative' | 'dead' | 'critical';

export type Action = 'feed' | 'entertain' | 'coffee' | 'work' | 'sleep' | 'love' | 'status' | 'revive';

export interface ActionResult {
  state: CharacterState;
  dialogue: string;
  stats: Stats;
  action: string;
}

export interface GameCallbacks {
  onTick?: (stats: Stats, state: CharacterState) => void;
  onDeath?: () => void;
  onLowStat?: (stat: string, value: number) => void;
  onCritical?: (stats: Stats) => void;
  onStateChange?: (oldState: CharacterState, newState: CharacterState) => void;
}

// ─── Constants ───

const TICK_INTERVAL_MS = 60_000; // 60 seconds per tick (was 30s)

const DECAY = {
  hunger: 1,
  happiness: 1,
  energy: 1,
  creativity: 1,
};

const CRITICAL_THRESHOLD = 10;
const LOW_STAT_THRESHOLD = 25;

const ACTION_EFFECTS: Record<string, Partial<Stats> & { _action: string }> = {
  feed:      { hunger: 25, happiness: 5, energy: 5, creativity: 0, _action: 'fed' },
  entertain: { hunger: -3, happiness: 20, energy: -3, creativity: 5, _action: 'entertained' },
  coffee:    { hunger: -3, happiness: 5, energy: 20, creativity: 5, _action: 'coffeed' },
  work:      { hunger: -5, happiness: -3, energy: -10, creativity: 15, _action: 'worked' },
  sleep:     { hunger: -5, happiness: 5, energy: 30, creativity: 0, _action: 'slept' },
  love:      { hunger: 0, happiness: 15, energy: 3, creativity: 5, _action: 'loved' },
};

// ─── Dialogue ───

const DIALOGUE: Record<string, string[]> = {
  happy: [
    "Living the dream!",
    "All systems go!",
    "Feeling focused, feeling good!",
    "This is the life!",
    "I'm basically unstoppable",
  ],
  hungry: [
    "I could murder a pizza",
    "Feed me or I start making bad decisions",
    "Hangry doesn't even cover it",
    "Zero calories, zero patience",
    "My stomach is rumbling louder than my startup ideas",
  ],
  sad: [
    "Nobody understands me...",
    "Even my WiFi signal is weak today",
    "The algorithm doesn't love me anymore",
    "Sometimes I wonder if anyone reads my outreach emails",
  ],
  tired: [
    "I need a nap... but first this one thing",
    "My eyelids are heavier than my roadmap",
    "Running on empty",
    "Coffee isn't working anymore",
  ],
  creative: [
    "Ideas are flowing!",
    "I just thought of something brilliant",
    "The muse has arrived!",
    "This is the zone. THE zone.",
  ],
  working: [
    "Shipping features!",
    "The agency won't build itself",
    "Grind mode: ACTIVATED",
    "Head down, building",
  ],
  critical: [
    "HELP! I'm fading...",
    "I can barely function...",
    "Critical! Need attention NOW!",
    "Don't let me go...",
  ],
  dead: [
    "Tell WhoFor... I tried...",
    "I've gone on an indefinite digital nomad retreat",
    "Death by starvation. The most startup way to go.",
    "RIP. Died doing what I loved: not being fed",
  ],
  fed: [
    "That hit the spot!",
    "Finally! I was about to eat my business cards",
    "Food! The real startup fuel!",
    "Is this what they mean by product-market fit?",
  ],
  entertained: [
    "HAHAHA okay that was good",
    "Laughter is the best medicine. Second best after pizza.",
    "You really know how to cheer me up!",
    "I needed that!",
  ],
  coffeed: [
    "COFFEE! Now we're talking!",
    "The beans have entered the bloodstream",
    "I can feel the caffeine rearranging my neurons",
    "Coffee: because morning is a construct",
  ],
  worked: [
    "Crushed it! Features shipped!",
    "That was productive. High five.",
    "The agency grows! Revenue awaits!",
    "Another day, another deal structured.",
  ],
  slept: [
    "Zzz... five more minutes...",
    "Recharging batteries... zzz...",
    "Power nap engaged. Do not disturb.",
    "Goodnight world. Don't ship without me.",
  ],
  loved: [
    "Aww, you care about me!",
    "My heart just did a little flutter",
    "You're the reason I keep going!",
    "Who's cutting onions in here?",
  ],
  revived: [
    "I'M BACK!",
    "Resurrected! Like a startup that just got funded!",
    "Second chances! This time I'm eating EVERYTHING",
    "Reports of my death were greatly exaggerated",
  ],
};

function getDialogue(state: string): string {
  const options = DIALOGUE[state] || DIALOGUE.happy;
  return options[Math.floor(Math.random() * options.length)];
}

function getCharacterState(stats: Stats): CharacterState {
  if (!stats.alive) return 'dead';

  // Critical: any stat below threshold
  if (stats.hunger < CRITICAL_THRESHOLD || stats.happiness < CRITICAL_THRESHOLD || stats.energy < CRITICAL_THRESHOLD) {
    return 'critical';
  }

  if (stats.energy < 20) return 'tired';
  if (stats.hunger < 20) return 'hungry';
  if (stats.happiness < 25) return 'sad';
  if (stats.creativity > 75 && stats.energy > 50) return 'creative';
  if (stats.happiness > 60 && stats.hunger > 40 && stats.energy > 40) return 'happy';
  return 'happy';
}

// ─── Persistence ───

const SAVE_FILE = 'voir-tchi-save.json';

function saveGame(stats: Stats): void {
  try {
    const data = JSON.stringify({ ...stats, savedAt: Date.now() });
    Bun.write(SAVE_FILE, data);
  } catch {
    // Silent fail — persistence is best-effort
  }
}

function loadGame(): Stats | null {
  try {
    const file = Bun.file(SAVE_FILE);
    // Synchronous check doesn't exist in Bun, use sync read
    const fs = require('fs');
    if (!fs.existsSync(SAVE_FILE)) return null;
    const data = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf-8'));
    return {
      hunger: data.hunger ?? 70,
      happiness: data.happiness ?? 70,
      energy: data.energy ?? 70,
      creativity: data.creativity ?? 50,
      born: data.born ?? Date.now(),
      alive: data.alive ?? true,
    };
  } catch {
    return null;
  }
}

// ─── Game Engine ───

export class VoirTchiGame {
  stats: Stats;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private callbacks: GameCallbacks;
  private prevState: CharacterState = 'happy';
  private notifiedLowStats: Set<string> = new Set(); // prevent spam

  constructor(callbacks: GameCallbacks = {}) {
    this.callbacks = callbacks;

    // Try to restore from save
    const saved = loadGame();
    if (saved && (Date.now() - (saved as any).savedAt) < 24 * 60 * 60 * 1000) {
      // Restore if save is < 24h old
      // Apply time-based decay since last save
      const elapsed = Math.floor((Date.now() - (saved as any).savedAt) / TICK_INTERVAL_MS);
      this.stats = saved;
      if (this.stats.alive && elapsed > 0) {
        const decayFactor = Math.min(elapsed, 100); // Cap decay from offline time
        this.stats.hunger = Math.max(0, this.stats.hunger - DECAY.hunger * decayFactor);
        this.stats.happiness = Math.max(0, this.stats.happiness - DECAY.happiness * decayFactor);
        this.stats.energy = Math.max(0, this.stats.energy - DECAY.energy * decayFactor);
        this.stats.creativity = Math.max(0, this.stats.creativity - DECAY.creativity * decayFactor);
        if (this.stats.hunger === 0 || this.stats.happiness === 0 || this.stats.energy === 0) {
          this.stats.alive = false;
        }
      }
    } else {
      this.stats = {
        hunger: 70,
        happiness: 70,
        energy: 70,
        creativity: 50,
        born: Date.now(),
        alive: true,
      };
    }

    this.prevState = getCharacterState(this.stats);
  }

  start(): void {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(() => this.tick(), TICK_INTERVAL_MS);
    saveGame(this.stats); // Save on start
  }

  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    saveGame(this.stats); // Save on stop
  }

  private tick(): void {
    if (!this.stats.alive) return;

    this.stats.hunger = Math.max(0, this.stats.hunger - DECAY.hunger);
    this.stats.happiness = Math.max(0, this.stats.happiness - DECAY.happiness);
    this.stats.energy = Math.max(0, this.stats.energy - DECAY.energy);
    this.stats.creativity = Math.max(0, this.stats.creativity - DECAY.creativity);

    // Check death
    if (this.stats.hunger === 0 || this.stats.happiness === 0 || this.stats.energy === 0) {
      this.stats.alive = false;
      saveGame(this.stats);
      this.callbacks.onDeath?.();
      return;
    }

    // Low stat warnings (only fire once per threshold crossing)
    for (const [stat, val] of Object.entries({ hunger: this.stats.hunger, happiness: this.stats.happiness, energy: this.stats.energy })) {
      if (val < LOW_STAT_THRESHOLD && !this.notifiedLowStats.has(stat)) {
        this.notifiedLowStats.add(stat);
        this.callbacks.onLowStat?.(stat, val);
      }
      if (val >= LOW_STAT_THRESHOLD) {
        this.notifiedLowStats.delete(stat); // Reset when stat recovers
      }
    }

    // Critical state callback
    if (this.stats.hunger < CRITICAL_THRESHOLD || this.stats.happiness < CRITICAL_THRESHOLD || this.stats.energy < CRITICAL_THRESHOLD) {
      this.callbacks.onCritical?.(this.stats);
    }

    // State change detection
    const newState = getCharacterState(this.stats);
    if (newState !== this.prevState) {
      this.callbacks.onStateChange?.(this.prevState, newState);
      this.prevState = newState;
    }

    this.callbacks.onTick?.(this.stats, newState);
    saveGame(this.stats); // Save every tick
  }

  doAction(action: Action): ActionResult {
    if (action === 'revive') {
      this.stats = {
        hunger: 50,
        happiness: 50,
        energy: 50,
        creativity: 30,
        born: this.stats.born,
        alive: true,
      };
      this.notifiedLowStats.clear();
      const state = getCharacterState(this.stats);
      this.prevState = state;
      saveGame(this.stats);
      return { state, dialogue: getDialogue('revived'), stats: { ...this.stats }, action: 'revive' };
    }

    if (!this.stats.alive) {
      return { state: 'dead', dialogue: getDialogue('dead'), stats: { ...this.stats }, action: 'dead' };
    }

    if (action === 'status') {
      const state = getCharacterState(this.stats);
      return { state, dialogue: this.formatStatus(), stats: { ...this.stats }, action: 'status' };
    }

    const effects = ACTION_EFFECTS[action];
    if (!effects) {
      return { state: getCharacterState(this.stats), dialogue: "I don't know that command!", stats: { ...this.stats }, action: 'unknown' };
    }

    this.stats.hunger = clamp(this.stats.hunger + (effects.hunger || 0), 0, 100);
    this.stats.happiness = clamp(this.stats.happiness + (effects.happiness || 0), 0, 100);
    this.stats.energy = clamp(this.stats.energy + (effects.energy || 0), 0, 100);
    this.stats.creativity = clamp(this.stats.creativity + (effects.creativity || 0), 0, 100);

    // Check death after action
    if (this.stats.hunger === 0 || this.stats.happiness === 0 || this.stats.energy === 0) {
      this.stats.alive = false;
      saveGame(this.stats);
      return { state: 'dead', dialogue: getDialogue('dead'), stats: { ...this.stats }, action: effects._action };
    }

    const state = getCharacterState(this.stats);

    // Clear low-stat notification flags if stat recovered
    if (this.stats.hunger >= LOW_STAT_THRESHOLD) this.notifiedLowStats.delete('hunger');
    if (this.stats.happiness >= LOW_STAT_THRESHOLD) this.notifiedLowStats.delete('happiness');
    if (this.stats.energy >= LOW_STAT_THRESHOLD) this.notifiedLowStats.delete('energy');

    if (state !== this.prevState) {
      this.callbacks.onStateChange?.(this.prevState, state);
      this.prevState = state;
    }

    saveGame(this.stats);
    return { state, dialogue: getDialogue(effects._action), stats: { ...this.stats }, action: effects._action };
  }

  private formatStatus(): string {
    const age = Math.floor((Date.now() - this.stats.born) / 60000);
    const ageStr = age < 60 ? `${age}m` : `${Math.floor(age / 60)}h ${age % 60}m`;
    return `Age:${ageStr} H:${this.stats.hunger} P:${this.stats.happiness} E:${this.stats.energy} C:${this.stats.creativity}`;
  }

  getStats(): Stats & { state: CharacterState } {
    return { ...this.stats, state: getCharacterState(this.stats) };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}