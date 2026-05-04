/**
 * Voir-tchi Game Engine
 * Ported from michael-tchi — tamagotchi state machine for smart glasses.
 *
 * Stats decay every tick (30s). Actions boost stats. Death at 0 on any stat.
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

export type CharacterState = 'happy' | 'hungry' | 'sad' | 'tired' | 'working' | 'creative' | 'dead';

export type Action = 'feed' | 'entertain' | 'coffee' | 'work' | 'sleep' | 'love' | 'status' | 'revive';

export interface ActionResult {
  state: CharacterState;
  dialogue: string;
  stats: Stats;
  action: string;
}

// ─── Constants ───

const TICK_INTERVAL_MS = 30_000; // 30 seconds per tick

const DECAY = {
  hunger: 3,
  happiness: 2,
  energy: 2,
  creativity: 1,
};

const ACTION_EFFECTS: Record<string, Partial<Stats> & { _action: string }> = {
  feed:      { hunger: 30, happiness: 5, energy: 5, creativity: 0, _action: 'fed' },
  entertain: { hunger: -5, happiness: 25, energy: -5, creativity: 5, _action: 'entertained' },
  coffee:    { hunger: -5, happiness: 5, energy: 20, creativity: 5, _action: 'coffeed' },
  work:      { hunger: -10, happiness: -5, energy: -15, creativity: 15, _action: 'worked' },
  sleep:     { hunger: -10, happiness: 5, energy: 40, creativity: 0, _action: 'slept' },
  love:      { hunger: 0, happiness: 20, energy: 5, creativity: 5, _action: 'loved' },
};

// ─── Dialogue ───

const DIALOGUE: Record<string, string[]> = {
  happy: [
    "Living the dream! 🌟",
    "Who needs sleep when you've got ambition?",
    "I'm basically unstoppable right now",
    "Life is good when the agency is thriving",
    "Feeling focused, feeling good! 🎯",
    "This is the life! Digital nomad energy ☀️",
    "All systems go! Let's build something great",
    "I could pitch a brand deal right now I'm that on it",
  ],
  hungry: [
    "I could murder a pizza right now 🍕",
    "My stomach is rumbling louder than my startup ideas",
    "Feed me or I start making bad decisions",
    "Hangry doesn't even cover it",
    "I've been living on coffee fumes and vibes",
    "If you don't feed me I'm going to start eating my business plan",
    "Zero calories, zero patience",
  ],
  sad: [
    "Nobody understands me... 😢",
    "Even my WiFi signal is weak today",
    "I miss the days when life was simple",
    "Maybe I should just become a farmer",
    "The algorithm doesn't love me anymore",
    "Sometimes I wonder if anyone even reads my outreach emails",
    "I put my heart into that pitch and they said no 💔",
  ],
  tired: [
    "I need a nap... but first let me just finish this one thing",
    "Digital nomad life isn't all beaches 🏖️",
    "My eyelids are heavier than my startup roadmap",
    "Running on empty... and not the good kind",
    "If I close my eyes for just a second...",
    "I've been awake since the last timezone",
    "Coffee isn't working anymore. I've leveled past it.",
  ],
  creative: [
    "Ideas are flowing like coffee on a Monday! 💡",
    "I just thought of something brilliant",
    "The muse has arrived! Quick, someone get a notepad!",
    "This is the zone. THE zone. 💫",
    "Every problem is just a feature waiting to happen",
    "I could restructure this whole deal right now",
  ],
  working: [
    "Shipping features like it's going out of style 💻",
    "The agency won't build itself",
    "Grind mode: ACTIVATED",
    "Deadline? More like lifeline. Let's go.",
    "This deal doesn't close itself",
    "Head down, building",
  ],
  sleeping: [
    "Zzz... 💤",
    "Don't disturb... dreaming of revenue... zzz",
    "Sleep is just vertical thinking... zzz...",
    "I'll be back... zzz... in 5 minutes... zzz",
  ],
  dead: [
    "Tell WhoFor... I tried... 💀",
    "I've gone on an indefinite digital nomad retreat",
    "Looks like neglect was my biggest competitor",
    "The agency... it needed me... and I... needed pizza...",
    "Death by starvation. The most startup way to go.",
    "I had one job. Keep me alive. One job.",
    "RIP Michael-tchi. He died doing what he loved: not being fed",
  ],
  fed: [
    "Oh YES. That hit the spot! 🍕",
    "Finally! I was about to eat my own business cards",
    "Mmm, delicious! You really do care",
    "My stomach thanks you. My brain thanks you. Everyone wins.",
    "Food! The real startup fuel!",
    "Is this what they mean by 'product-market fit'?",
  ],
  entertained: [
    "HAHAHAHA okay that was good 😂",
    "My sides! My sides are in stitches!",
    "Laughter is the best medicine. Well, second best after pizza.",
    "You really know how to cheer a guy up!",
    "I needed that! 😄",
    "Okay okay, you're funnier than my last client call",
  ],
  coffeed: [
    "COFFEE! Now we're talking! ☕",
    "The beans have entered the bloodstream. Time to work.",
    "I can feel the caffeine rearranging my neurons",
    "This is the good stuff. The really good stuff.",
    "Coffee: because morning is a construct ☕",
    "I don't have a coffee problem. I have a coffee SOLUTION.",
  ],
  worked: [
    "Crushed it! Features shipped! 💻",
    "That was productive. Someone give me a high five.",
    "Work work work. The grind never stops.",
    "The agency grows! Revenue awaits!",
    "Another day, another deal structured.",
    "I put the 'work' in 'network'. Actually that doesn't work. Never mind.",
  ],
  slept: [
    "Zzz... 💤... five more minutes...",
    "Recharging my batteries... zzz...",
    "Power nap engaged. Do not disturb.",
    "Goodnight world. Don't ship without me.",
  ],
  loved: [
    "Aww, you care about me! ❤️",
    "My heart just did a little flutter",
    "That's the good stuff right there 🥰",
    "You're the reason I keep going!",
    "Love is all you need. Well, love and pizza.",
    "Who's cutting onions in here? 😭❤️",
  ],
  revived: [
    "I'M BACK! 💪",
    "Resurrected! Like a startup that just got funded!",
    "Second chances! This time I'm eating EVERYTHING",
    "Back from the dead. Literally. Let's do this!",
    "Reports of my death were greatly exaggerated 🧟",
  ],
};

function getDialogue(state: string): string {
  const options = DIALOGUE[state] || DIALOGUE.happy;
  return options[Math.floor(Math.random() * options.length)];
}

function getCharacterState(stats: Stats): CharacterState {
  if (!stats.alive) return 'dead';
  if (stats.energy < 20) return 'tired';
  if (stats.hunger < 20) return 'hungry';
  if (stats.happiness < 25) return 'sad';
  if (stats.creativity > 75 && stats.energy > 50) return 'creative';
  if (stats.happiness > 60 && stats.hunger > 40 && stats.energy > 40) return 'happy';
  return 'happy';
}

// ─── Game Engine ───

export class VoirTchiGame {
  stats: Stats;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private onTick?: (stats: Stats, state: CharacterState) => void;
  private onDeath?: () => void;
  private onLowStat?: (stat: string, value: number) => void;

  constructor(opts?: {
    onTick?: (stats: Stats, state: CharacterState) => void;
    onDeath?: () => void;
    onLowStat?: (stat: string, value: number) => void;
  }) {
    this.stats = {
      hunger: 70,
      happiness: 70,
      energy: 70,
      creativity: 50,
      born: Date.now(),
      alive: true,
    };
    this.onTick = opts?.onTick;
    this.onDeath = opts?.onDeath;
    this.onLowStat = opts?.onLowStat;
  }

  start(): void {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
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
      this.onDeath?.();
      return;
    }

    // Low stat warnings
    if (this.stats.hunger < 25) this.onLowStat?.('hunger', this.stats.hunger);
    if (this.stats.happiness < 25) this.onLowStat?.('happiness', this.stats.happiness);
    if (this.stats.energy < 25) this.onLowStat?.('energy', this.stats.energy);

    const state = getCharacterState(this.stats);
    this.onTick?.(this.stats, state);
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
      const state = getCharacterState(this.stats);
      return { state, dialogue: getDialogue('revived'), stats: { ...this.stats }, action: 'revive' };
    }

    if (!this.stats.alive) {
      return {
        state: 'dead',
        dialogue: getDialogue('dead'),
        stats: { ...this.stats },
        action: 'dead',
      };
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
      return { state: 'dead', dialogue: getDialogue('dead'), stats: { ...this.stats }, action: effects._action };
    }

    const state = getCharacterState(this.stats);
    return { state, dialogue: getDialogue(effects._action), stats: { ...this.stats }, action: effects._action };
  }

  private formatStatus(): string {
    const age = Math.floor((Date.now() - this.stats.born) / 60000);
    const ageStr = age < 60 ? `${age}m` : `${Math.floor(age / 60)}h ${age % 60}m`;
    const emoji = this.stats.alive ? this.stateEmoji() : '💀';
    return `${emoji} Age:${ageStr}\n🍖${bar(this.stats.hunger)} 😊${bar(this.stats.happiness)}\n⚡${bar(this.stats.energy)} 🎨${bar(this.stats.creativity)}`;
  }

  private stateEmoji(): string {
    if (!this.stats.alive) return '💀';
    if (this.stats.energy < 20) return '😫';
    if (this.stats.hunger < 20) return '😰';
    if (this.stats.happiness < 25) return '😢';
    if (this.stats.creativity > 75 && this.stats.energy > 50) return '💡';
    return '😊';
  }

  getStats(): Stats & { state: CharacterState } {
    return { ...this.stats, state: getCharacterState(this.stats) };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function bar(v: number): string {
  if (v >= 80) return '████';
  if (v >= 60) return '███░';
  if (v >= 40) return '██░░';
  if (v >= 20) return '█░░░';
  return '░░░░';
}