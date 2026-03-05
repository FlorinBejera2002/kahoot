// Haptic feedback utility for mobile devices

let hapticsEnabled = true;

export function setHapticsEnabled(enabled) {
  hapticsEnabled = enabled;
  try {
    localStorage.setItem('quizblitz_haptics', enabled ? '1' : '0');
  } catch {}
}

export function isHapticsEnabled() {
  try {
    const stored = localStorage.getItem('quizblitz_haptics');
    if (stored !== null) hapticsEnabled = stored === '1';
  } catch {}
  return hapticsEnabled;
}

function vibrate(pattern) {
  if (!hapticsEnabled) return;
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {}
}

// Light tap - button press
export function tapLight() {
  vibrate(10);
}

// Medium tap - answer selection
export function tapMedium() {
  vibrate(25);
}

// Success pattern - correct answer
export function vibrateSuccess() {
  vibrate([30, 50, 30]);
}

// Error pattern - wrong answer
export function vibrateError() {
  vibrate([50, 30, 50, 30, 80]);
}

// Warning - timer low
export function vibrateWarning() {
  vibrate(15);
}

// Celebration - streak or victory
export function vibrateCelebration() {
  vibrate([20, 40, 20, 40, 20, 40, 60]);
}

// Time up - strong buzz
export function vibrateTimeUp() {
  vibrate([100, 50, 100]);
}
