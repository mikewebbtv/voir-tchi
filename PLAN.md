# Voir-tchi — Tamagotchi for Smart Glasses

A MentraOS app that puts Michael-tchi on your smart glasses. Keep your pixel pet alive with voice commands.

## Why This Works as a Starter

1. **Proven game logic** — Already built and working on web (michael-tchi.vercel.app)
2. **Simple state machine** — 4 stats, 9 actions, 7 emotional states — easy to map to glasses UI
3. **Voice-first interaction** — Feed, play, work, sleep all work as voice commands (no touch needed)
4. **Bitmap rendering** — MentraOS SDK supports bitmap display + animations = pixel art on glasses
5. **Dashboard persistent** — Stats can live in the always-on dashboard
6. **Proactive pushes** — Stats decay = natural reason to push notifications ("Feed me! 🍕")

## Architecture

```
┌─────────────────────────────────────┐
│         MentraOS Glasses             │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ Dashboard │  │  Main Display   │  │
│  │  (stats) │  │ (bitmap + text) │  │
│  └──────────┘  └──────────────────┘  │
└─────────────┬───────────────────────┘
              │ MentraOS SDK
┌─────────────┴───────────────────────┐
│         Voir-tchi Server            │
│  ┌──────────────┐  ┌─────────────┐  │
│  │  Game Engine │  │  BMP Renderer│ │
│  │  (tick logic)│  │ (pixel→BMP) │  │
│  └──────┬───────┘  └──────┬──────┘  │
│         │                 │          │
│  ┌──────┴────────────────┴──────┐   │
│  │     Voice Command Parser     │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Display Mapping

| Glasses View | Content |
|---|---|
| **Dashboard** (always-on) | `🍖62 😊71 ⚡45 🎨80` — stat bars |
| **TextWall** (action result) | Dialogue text ("Living the dream! 🌟") |
| **DoubleTextWall** (status) | Top: emoji + mood, Bottom: action response |
| **BitmapView** (idle animation) | Pixel art Michael (happy/hungry/sad/tired/dead) |
| **BitmapAnimation** (action) | Feed/sleep/work animation frames |
| **ReferenceCard** (death) | "💀 Michael-tchi has died. Say 'revive' to bring him back." |

## Voice Commands

| Command | Action |
|---|---|
| "feed" / "eat" / "pizza" | Feed (hunger +30) |
| "play" / "laugh" / "entertain" | Entertain (happiness +25) |
| "coffee" / "caffeine" | Coffee (energy +20, creativity +5) |
| "work" / "code" / "build" | Work (creativity +15, energy -15) |
| "sleep" / "nap" / "rest" | Sleep (energy +40, hunger -10) |
| "love" / "hug" | Love (happiness +20) |
| "status" / "how is he" | Show current stats + mood |
| "revive" | Revive if dead |

## Stat Decay (per tick)

Same as web version but ticks every 30 seconds (glasses = occasional glance, not constant attention):
- Hunger: -3/tick
- Happiness: -2/tick  
- Energy: -2/tick
- Creativity: -1/tick

Death at 0 on any stat.

## Pixel Art → BMP Pipeline

1. Define pixel art as `[x, y, color]` arrays (already done in PixelMichael.tsx)
2. Render to 640×200 BMP buffer (Even G1 display resolution)
3. Convert to base64 for `session.layouts.showBitmapView()`
4. Each emotional state = different BMP frame
5. Animations = `showBitmapAnimation()` with multiple frames

## File Structure

```
voir-tchi/
├── src/
│   ├── index.ts          # AppServer + session handler
│   ├── game.ts           # Game engine (state, tick, actions)
│   ├── voice.ts          # Voice command parser
│   ├── renderer.ts       # Pixel art → BMP renderer
│   └── sprites.ts        # Pixel art definitions (from PixelMichael.tsx)
├── assets/
│   └── frames/           # Pre-rendered BMP animation frames (optional)
├── package.json
├── tsconfig.json
└── .env
```

## Implementation Steps

1. ✅ Port game logic from michael-tchi (types, game engine, dialogue)
2. ✅ Build BMP renderer (pixel arrays → 640×200 BMP → base64)
3. ✅ Build voice command parser
4. ✅ Build MentraOS session handler
5. ✅ Add dashboard stats display
6. ✅ Add proactive "feed me" notifications
7. Register on MentraOS Console
8. Test on real glasses