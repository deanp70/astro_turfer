# Astronaut Planet Platformer

Web-first Phaser 3 + TypeScript sidescroller inspired by classic Mario pacing.

## Implemented
- Phaser 3 + TypeScript + Vite project scaffold
- Boot scene + World scene + HUD scene contracts
- Typed level manifest format in JSON (`public/levels/*.json`)
- Three themed levels: Moon, Mars, Europa
- Astronaut movement with coyote time + jump buffer
- Enemy stomp vs damage logic
- Hazards, collectibles, checkpoints, level transitions
- HUD metrics (level, lives, score, oxygen, time)
- Asset licensing ledger (`docs/ASSET_LICENSES.md`)

## Run
1. `npm install`
2. `npm run dev`
3. Open `http://localhost:5173`

## Controls
- Move: `Left` / `Right`
- Jump: `Up` or `Space`

## External Assets
- Drop downloaded packs into `public/assets/` (see `public/assets/README.md`)
- Replace placeholder generated textures in `src/scenes/BootScene.ts` with `this.load.image(...)`/spritesheets/audio

## Level Manifest Contract
Each `public/levels/*.json` includes:
- `id`, `theme`, `tilemapKey`, `backgroundLayers[]`, `musicKey`
- `spawn`, `goal`, `hazards[]`, `collectibles[]`
- `platforms[]`, `enemies[]`, `checkpoints[]`, `timeLimitSeconds`
