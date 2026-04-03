/**
 * Tactile Vocabulary for Kratos OS
 */
export const haptics = {
  success: () => {
    if ('vibrate' in navigator) navigator.vibrate([10, 30, 10]);
  },
  warning: () => {
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
  },
  critical: () => {
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
  },
  tap: () => {
    if ('vibrate' in navigator) navigator.vibrate(5);
  }
};

/**
 * Web Speech API Coaching Engine
 */
export const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Interrupt previous
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 0.9; // Lower pitch for "Serious Scientist" tone
    window.speechSynthesis.speak(utterance);
  }
};
