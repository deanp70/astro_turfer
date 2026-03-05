# Free Asset Sources (Curated)

## Primary (Recommended)
- Kenney asset index: https://kenney.nl/assets
- Platformer Pack Redux: https://kenney.nl/assets/platformer-pack-redux
- Space Shooter Redux: https://kenney.nl/assets/space-shooter-redux
- UI Pack: https://kenney.nl/assets/ui-pack

## Supplemental
- OpenGameArt (filter by CC0/permissive): https://opengameart.org/

## Audio
- Freesound: https://freesound.org/
- License FAQ: https://freesound.org/help/faq/#licenses

## What To Download First
1. Platform tiles + props (Kenney Platformer Pack Redux)
2. Astronaut/player + enemy sprites (Kenney Space Shooter Redux)
3. HUD icons/elements (Kenney UI Pack)
4. Jump/collect/hurt SFX + 3 short ambient loops (Moon/Mars/Europa)

## Integration Checklist
1. Copy source metadata into `docs/ASSET_LICENSES.md`.
2. Place files under `public/assets/kenney/...` and `public/assets/audio/...`.
3. In `src/scenes/BootScene.ts`, replace generated textures with concrete file preloads.
4. Update texture/audio keys in `src/assets/assetKeys.ts` if needed.
