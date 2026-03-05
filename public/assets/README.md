# External Asset Drop Zone

Place downloaded art/audio packs here after extraction.

Suggested structure:
- public/assets/kenney/platformer-pack-redux/
- public/assets/kenney/space-shooter-redux/
- public/assets/kenney/ui-pack/
- public/assets/audio/

After adding files, wire them in `src/scenes/BootScene.ts` by replacing generated placeholder textures with `this.load.image(...)`, spritesheets, and audio keys.
