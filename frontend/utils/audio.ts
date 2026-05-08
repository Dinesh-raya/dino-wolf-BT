// Placeholder for actual sound paths. User will need to add assets.
const SOUNDS = {
  dice: '/sounds/dice.mp3',
  buy: '/sounds/buy.mp3',
  rent: '/sounds/rent.mp3',
  auction: '/sounds/auction.mp3',
};

class SoundManager {
  private enabled: boolean = true;
  private audioMap: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    // Preload
    Object.entries(SOUNDS).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.audioMap.set(key, audio);
    });
  }

  play(soundName: keyof typeof SOUNDS) {
    if (!this.enabled) return;
    const audio = this.audioMap.get(soundName);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.warn('Audio play failed:', e));
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

export const soundManager = new SoundManager();
