/**
 * Voir-tchi Voice Command Parser
 * Maps natural language from MentraOS transcription to game actions.
 */

import { Action } from './game';

// Map of keywords to actions
const COMMAND_MAP: Record<string, Action> = {
  // Feed
  'feed': 'feed',
  'eat': 'feed',
  'pizza': 'feed',
  'food': 'feed',
  'hungry': 'feed',
  'feed me': 'feed',
  'give me food': 'feed',
  'give him food': 'feed',

  // Entertain
  'play': 'entertain',
  'laugh': 'entertain',
  'entertain': 'entertain',
  'joke': 'entertain',
  'fun': 'entertain',
  'make me laugh': 'entertain',

  // Coffee
  'coffee': 'coffee',
  'caffeine': 'coffee',
  'espresso': 'coffee',
  'latte': 'coffee',
  'cappuccino': 'coffee',
  'brew': 'coffee',
  'red bull': 'coffee',
  'energy drink': 'coffee',

  // Work
  'work': 'work',
  'code': 'work',
  'build': 'work',
  'code mode': 'work',
  'grind': 'work',
  'ship it': 'work',
  'focus mode': 'work',
  'let\'s work': 'work',

  // Sleep
  'sleep': 'sleep',
  'nap': 'sleep',
  'rest': 'sleep',
  'bedtime': 'sleep',
  'go to sleep': 'sleep',
  'go to bed': 'sleep',

  // Love
  'love': 'love',
  'hug': 'love',
  'kiss': 'love',
  'care': 'love',
  'i love you': 'love',

  // Status
  'status': 'status',
  'how is he': 'status',
  'how are you': 'status',
  'how\'s it going': 'status',
  'health': 'status',
  'stats': 'status',
  'check': 'status',

  // Revive
  'revive': 'revive',
  'bring back': 'revive',
  'resurrect': 'revive',
  'restart': 'revive',
  'new life': 'revive',
};

/**
 * Parse a voice transcription into a game action.
 * Returns the matching action or null if no command detected.
 */
export function parseVoiceCommand(text: string): Action | null {
  const lower = text.toLowerCase().trim();

  // Check exact matches first (longest phrase first for precedence)
  // Sort by length descending so "feed me" matches before "feed"
  const sortedPhrases = Object.keys(COMMAND_MAP).sort((a, b) => b.length - a.length);

  for (const phrase of sortedPhrases) {
    if (lower.includes(phrase)) {
      return COMMAND_MAP[phrase];
    }
  }

  return null;
}

/**
 * Get a friendly response for an unrecognized command.
 */
export function getUnrecognizedResponse(text: string): string {
  const responses = [
    `I heard "${text}" but I don't know what that means! Try: feed, play, coffee, work, sleep, love, or status`,
    `Hmm, "${text}" — that's not a thing I understand yet. Try feed, play, coffee, work, sleep, or love!`,
    `Did you say "${text}"? I only know: feed, play, coffee, work, sleep, love, and status`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}