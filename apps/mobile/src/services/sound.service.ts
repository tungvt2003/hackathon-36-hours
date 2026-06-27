import { Audio, AVPlaybackStatus } from 'expo-av';
import { ASSETS } from '../assets';

const soundCache = new Map<string, Audio.Sound>();

// Preload sounds
(async () => {
  try {
    const successAsset = ASSETS.sounds.success;
    if (successAsset) {
      const { sound } = await Audio.Sound.createAsync(successAsset);
      soundCache.set('success', sound);
    }
  } catch (err) {
    console.warn('Failed to preload sounds:', err);
  }
})();

async function playSound(key: string) {
  try {
    const sound = soundCache.get(key);
    if (sound) {
      await sound.replayAsync();
      
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          // Reset status update to avoid memory leaks or unexpected behavior
          sound.setOnPlaybackStatusUpdate(null);
        }
      });
    }
  } catch (err) {
    console.warn(`Error playing ${key} sound:`, err);
  }
}

export const soundService = {
  playSuccess: () => playSound('success'),
};
