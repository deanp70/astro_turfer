export function shouldUseTouchControls(scene: Phaser.Scene): boolean {
  const { device } = scene.sys.game;
  const touchCapable = device.input.touch;
  const mobileOs = device.os.android || device.os.iOS || device.os.windowsPhone;
  const coarsePointer =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(any-pointer: coarse)').matches);
  const shortestEdge = Math.min(scene.scale.gameSize.width, scene.scale.gameSize.height);

  return touchCapable && (mobileOs || (coarsePointer && shortestEdge <= 900));
}
