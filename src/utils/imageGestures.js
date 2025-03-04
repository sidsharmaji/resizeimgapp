import Hammer from 'hammerjs';

export const setupImageGestures = (element, {
  onScale = () => {},
  onRotate = () => {},
  onPan = () => {},
  onDoubleTap = () => {},
}) => {
  const hammer = new Hammer.Manager(element);

  // Add recognizers
  const pinch = new Hammer.Pinch();
  const rotate = new Hammer.Rotate();
  const pan = new Hammer.Pan();
  const doubleTap = new Hammer.Tap({ event: 'doubletap', taps: 2 });

  // Setup recognizers
  hammer.add([doubleTap, pan, pinch, rotate]);

  // Recognize pinch and rotate together
  pinch.recognizeWith(rotate);

  // State management
  let currentScale = 1;
  let lastScale = 1;
  let currentRotation = 0;
  let lastRotation = 0;

  hammer.on('pinchstart rotatestart', () => {
    lastScale = currentScale;
    lastRotation = currentRotation;
  });

  hammer.on('pinch rotate', (ev) => {
    if (ev.type === 'pinch') {
      currentScale = Math.max(0.5, Math.min(lastScale * ev.scale, 3));
      onScale({
        scale: currentScale,
        center: ev.center
      });
    }

    if (ev.type === 'rotate') {
      currentRotation = lastRotation + ev.rotation;
      onRotate({
        rotation: currentRotation,
        center: ev.center
      });
    }
  });

  hammer.on('pan', (ev) => {
    onPan({
      deltaX: ev.deltaX,
      deltaY: ev.deltaY,
      center: ev.center,
      isFinal: false
    });
  });

  hammer.on('panend', (ev) => {
    onPan({
      deltaX: ev.deltaX,
      deltaY: ev.deltaY,
      center: ev.center,
      isFinal: true
    });
  });

  hammer.on('doubletap', (ev) => {
    onDoubleTap({
      center: ev.center
    });
  });

  return {
    hammer,
    cleanup: () => hammer.destroy()
  };
};