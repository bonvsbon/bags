// Decides whether to render the live app edge-to-edge like a native app
// (no desktop showcase chrome, no simulated phone bezel) vs. the showcase
// phone mockup used on desktop.

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    window.matchMedia?.('(display-mode: fullscreen)')?.matches === true ||
    window.navigator?.standalone === true || // iOS Safari "Add to Home Screen"
    window.Capacitor != null || // wrapped as a native app (Play Store build)
    new URLSearchParams(window.location.search).has('app') // ?app=1 force
  );
}

export function isPhoneViewport() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia) return window.matchMedia('(max-width: 600px)').matches;
  return window.innerWidth <= 600;
}

// Full-bleed = a real phone (browser, installed PWA, or native shell).
// On desktop this is false, so the showcase phone mockup still renders.
export function isFullBleed() {
  return isStandalone() || isPhoneViewport();
}
