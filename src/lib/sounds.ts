// Sound effect types
export type SoundEffect = "move" | "win" | "draw" | "click";

// Sound URLs - replace these with actual sound file URLs once you have the audio files
const soundUrls: Record<SoundEffect, string> = {
  move: "/sounds/move.mp3",
  win: "/sounds/win.mp3",
  draw: "/sounds/draw.mp3",
  click: "/sounds/click.mp3",
};

// Number of sounds in each pool (for frequent clicking)
const POOL_SIZE = 4;

// Create audio pools for each sound
const audioPools: Record<SoundEffect, HTMLAudioElement[]> = {
  move: [],
  win: [],
  draw: [],
  click: [],
};

// Track the last used index for each sound type
const lastIndexUsed: Record<SoundEffect, number> = {
  move: -1,
  win: -1,
  draw: -1,
  click: -1,
};

// Initialize sound system
export const initSounds = (): void => {
  Object.entries(soundUrls).forEach(([key, url]) => {
    const soundType = key as SoundEffect;
    const pool = audioPools[soundType];

    // Create multiple instances of each sound
    for (let i = 0; i < POOL_SIZE; i++) {
      try {
        const audio = new Audio(url);
        audio.preload = "auto";

        // Set appropriate volume for each sound type
        audio.volume = soundType === "click" ? 0.5 : 0.7;
        pool.push(audio);
      } catch (error) {
        console.error(`Failed to load sound: ${key}`, error);
      }
    }
  });
};

// Play a sound effect
export const playSound = (effect: SoundEffect): void => {
  const pool = audioPools[effect];
  if (!pool || pool.length === 0) return;

  // Cycle through the audio elements in the pool
  lastIndexUsed[effect] = (lastIndexUsed[effect] + 1) % pool.length;
  const audio = pool[lastIndexUsed[effect]];
  if (!audio) return;

  // For click sounds, add slight pitch variation for game-like feel
  if (effect === "click" || effect === "move") {
    // Random pitch between 0.95 and 1.05
    audio.playbackRate = 0.95 + Math.random() * 0.1;
  }

  // Reset and play
  audio.currentTime = 0;
  audio.play().catch((error) => {
    console.error(`Failed to play sound: ${effect}`, error);
  });

  // Add haptic feedback if available
  if ("vibrate" in navigator) {
    navigator.vibrate(15);
  }
};

// Mute/Unmute all sounds
let muted = false;

export const toggleMute = (): boolean => {
  muted = !muted;

  // Apply mute setting to all audio elements in all pools
  Object.values(audioPools).forEach((pool) => {
    pool.forEach((audio) => {
      audio.muted = muted;
    });
  });

  return muted;
};

export const isMuted = (): boolean => muted;
