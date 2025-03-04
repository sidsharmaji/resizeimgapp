import { keyframes } from '@emotion/react';

// Slide transitions
export const slideInRight = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

export const slideInLeft = keyframes`
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

// Fade transitions
export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

// Scale transitions
export const scaleIn = keyframes`
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

// Loading animations
export const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

// Animation durations and timing functions
export const durations = {
  short: '150ms',
  medium: '300ms',
  long: '500ms'
};

export const easings = {
  easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
};

// Helper function to combine animation properties
export const createTransition = (animation, duration = durations.medium, easing = easings.easeInOut) => `
  animation: ${animation} ${duration} ${easing};
`;

// Presets for common transitions
export const transitions = {
  pageEnter: createTransition(slideInRight),
  pageExit: createTransition(fadeOut),
  modalEnter: createTransition(scaleIn),
  modalExit: createTransition(fadeOut, durations.short),
  loading: createTransition(spin, durations.long, 'linear')
};