type HoldControlKey = 'left' | 'right' | 'jump';

export interface MobileControlDock {
  destroy(): void;
}

function getRequiredButton(id: string): HTMLButtonElement | null {
  const element = document.getElementById(id);
  return element instanceof HTMLButtonElement ? element : null;
}

export function mountMobileControlDock(scene: Phaser.Scene): MobileControlDock | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const shell = document.getElementById('app-shell');
  const leftButton = getRequiredButton('touch-left');
  const rightButton = getRequiredButton('touch-right');
  const jumpButton = getRequiredButton('touch-jump');
  const pauseButton = getRequiredButton('touch-pause');

  if (!shell || !leftButton || !rightButton || !jumpButton || !pauseButton) {
    return null;
  }

  const heldPointers: Record<HoldControlKey, Set<number>> = {
    left: new Set<number>(),
    right: new Set<number>(),
    jump: new Set<number>()
  };

  const cleanup: Array<() => void> = [];

  const emitMovementState = (): void => {
    scene.game.events.emit('controls:touch', {
      left: heldPointers.left.size > 0,
      right: heldPointers.right.size > 0,
      jump: heldPointers.jump.size > 0
    });
  };

  const setPressedState = (button: HTMLButtonElement, pressed: boolean): void => {
    button.dataset.active = pressed ? 'true' : 'false';
  };

  const releaseHoldPointer = (key: HoldControlKey, pointerId: number, button: HTMLButtonElement): void => {
    if (!heldPointers[key].delete(pointerId)) {
      return;
    }

    setPressedState(button, heldPointers[key].size > 0);
    emitMovementState();
  };

  const bindHoldButton = (button: HTMLButtonElement, key: HoldControlKey): void => {
    const onPointerDown = (event: PointerEvent): void => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      event.preventDefault();
      heldPointers[key].add(event.pointerId);
      setPressedState(button, true);
      button.setPointerCapture?.(event.pointerId);
      emitMovementState();
    };

    const onPointerUp = (event: PointerEvent): void => {
      event.preventDefault();
      releaseHoldPointer(key, event.pointerId, button);
      if (button.hasPointerCapture?.(event.pointerId)) {
        button.releasePointerCapture(event.pointerId);
      }
    };

    const onPointerCancel = (event: PointerEvent): void => {
      releaseHoldPointer(key, event.pointerId, button);
    };

    const preventContextMenu = (event: Event): void => {
      event.preventDefault();
    };

    button.addEventListener('pointerdown', onPointerDown, { passive: false });
    button.addEventListener('pointerup', onPointerUp);
    button.addEventListener('pointercancel', onPointerCancel);
    button.addEventListener('lostpointercapture', onPointerCancel);
    button.addEventListener('contextmenu', preventContextMenu);

    cleanup.push(() => {
      button.removeEventListener('pointerdown', onPointerDown);
      button.removeEventListener('pointerup', onPointerUp);
      button.removeEventListener('pointercancel', onPointerCancel);
      button.removeEventListener('lostpointercapture', onPointerCancel);
      button.removeEventListener('contextmenu', preventContextMenu);
      heldPointers[key].clear();
      setPressedState(button, false);
    });
  };

  const bindTapButton = (button: HTMLButtonElement, action: () => void): void => {
    const activePointers = new Set<number>();

    const syncVisualState = (): void => {
      setPressedState(button, activePointers.size > 0);
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      event.preventDefault();
      activePointers.add(event.pointerId);
      syncVisualState();
      button.setPointerCapture?.(event.pointerId);
    };

    const onPointerUp = (event: PointerEvent): void => {
      event.preventDefault();
      const wasActive = activePointers.delete(event.pointerId);
      syncVisualState();
      if (button.hasPointerCapture?.(event.pointerId)) {
        button.releasePointerCapture(event.pointerId);
      }

      if (wasActive) {
        action();
      }
    };

    const onPointerCancel = (event: PointerEvent): void => {
      activePointers.delete(event.pointerId);
      syncVisualState();
    };

    const preventContextMenu = (event: Event): void => {
      event.preventDefault();
    };

    button.addEventListener('pointerdown', onPointerDown, { passive: false });
    button.addEventListener('pointerup', onPointerUp);
    button.addEventListener('pointercancel', onPointerCancel);
    button.addEventListener('lostpointercapture', onPointerCancel);
    button.addEventListener('contextmenu', preventContextMenu);

    cleanup.push(() => {
      button.removeEventListener('pointerdown', onPointerDown);
      button.removeEventListener('pointerup', onPointerUp);
      button.removeEventListener('pointercancel', onPointerCancel);
      button.removeEventListener('lostpointercapture', onPointerCancel);
      button.removeEventListener('contextmenu', preventContextMenu);
      activePointers.clear();
      setPressedState(button, false);
    });
  };

  bindHoldButton(leftButton, 'left');
  bindHoldButton(rightButton, 'right');
  bindHoldButton(jumpButton, 'jump');
  bindTapButton(pauseButton, () => {
    scene.game.events.emit('controls:pause');
  });

  shell.classList.add('touch-controls-active');
  shell.dataset.touchControls = 'true';
  emitMovementState();

  requestAnimationFrame(() => {
    scene.scale.refresh();
  });

  return {
    destroy(): void {
      cleanup.forEach((dispose) => {
        dispose();
      });

      scene.game.events.emit('controls:touch', {
        left: false,
        right: false,
        jump: false
      });

      shell.classList.remove('touch-controls-active');
      delete shell.dataset.touchControls;

      requestAnimationFrame(() => {
        scene.scale.refresh();
      });
    }
  };
}
