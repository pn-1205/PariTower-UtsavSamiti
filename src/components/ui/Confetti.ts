import confetti from 'canvas-confetti';

export function triggerFestiveConfetti() {
  if (typeof window === 'undefined') return;

  // First burst from center
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#f59e0b', '#ef4444', '#10b981', '#fbbf24', '#f97316', '#6366f1'],
    disableForReducedMotion: true,
  });

  // Secondary side cannon bursts after 200ms
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#fbbf24', '#f59e0b', '#dc2626'],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#10b981', '#3b82f6', '#fbbf24'],
      disableForReducedMotion: true,
    });
  }, 200);
}

export default triggerFestiveConfetti;
