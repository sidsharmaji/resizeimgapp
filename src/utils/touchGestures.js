import Hammer from 'hammerjs';

export const setupPinchZoom = (element, onScale) => {
  const hammer = new Hammer(element);
  hammer.get('pinch').set({ enable: true });

  let currentScale = 1;
  let lastScale = 1;

  hammer.on('pinchstart', () => {
    lastScale = currentScale;
  });

  hammer.on('pinch', (e) => {
    currentScale = Math.max(0.5, Math.min(lastScale * e.scale, 3));
    onScale(currentScale);
  });

  return hammer;
};

export const setupDoubleTap = (element, onDoubleTap) => {
  const hammer = new Hammer(element);
  hammer.on('doubletap', onDoubleTap);
  return hammer;
};

export const setupPan = (element, onPan, onPanEnd) => {
  const hammer = new Hammer(element);
  hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });

  hammer.on('pan', onPan);
  hammer.on('panend', onPanEnd);

  return hammer;
};

export const setupSwipe = (element, onSwipeLeft, onSwipeRight) => {
  const hammer = new Hammer(element);
  hammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });

  hammer.on('swipeleft', onSwipeLeft);
  hammer.on('swiperight', onSwipeRight);

  return hammer;
};

export const cleanupGestures = (hammer) => {
  if (hammer) {
    hammer.destroy();
  }
};