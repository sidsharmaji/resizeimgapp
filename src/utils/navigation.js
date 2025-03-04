import { setupSwipe } from './touchGestures';

class NavigationManager {
  constructor() {
    this.currentPath = window.location.pathname;
    this.setupHistoryListener();
    this.onNavigationChange = null;
    this.transitionState = 'idle';
    this.transitionDuration = 300; // matches with animation.js medium duration
  }

  setupHistoryListener() {
    window.addEventListener('popstate', (event) => {
      if (event.state) {
        this.currentPath = event.state.path;
        if (this.onNavigationChange) {
          this.onNavigationChange(event.state.view || 'home');
        }
      } else {
        // If no state exists, default to home view
        if (this.onNavigationChange) {
          this.onNavigationChange('home');
        }
      }
    });
  }

  async navigate(path, title = '', view = 'home') {
    if (this.currentPath !== path) {
      this.transitionState = 'exiting';
      await new Promise(resolve => setTimeout(resolve, this.transitionDuration));
      window.history.pushState({ path, view }, title, path);
      this.currentPath = path;
      this.transitionState = 'entering';
      await new Promise(resolve => setTimeout(resolve, this.transitionDuration));
      this.transitionState = 'idle';
    }
  }

  setNavigationChangeHandler(handler) {
    this.onNavigationChange = handler;
  }

  getTransitionState() {
    return this.transitionState;
  }

  setupMobileNavigation(element, onNavigateLeft, onNavigateRight) {
    if ('ontouchstart' in window) {
      return setupSwipe(element, onNavigateLeft, onNavigateRight);
    }
    return null;
  }

  goBack() {
    window.history.back();
  }

  goForward() {
    window.history.forward();
  }
}

const navigationManager = new NavigationManager();
export default navigationManager;