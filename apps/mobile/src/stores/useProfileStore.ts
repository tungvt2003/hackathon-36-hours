import { create } from 'zustand';

interface ProfileState {
  accessibilityModes: { visual: boolean; motor: boolean; handsFree: boolean };
  speakingSpeed: 'slow' | 'normal' | 'fast';
  isConfigured: boolean;
  setAccessibilityModes: (modes: ProfileState['accessibilityModes']) => void;
  setSpeakingSpeed: (speed: ProfileState['speakingSpeed']) => void;
  setConfigured: (v: boolean) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  accessibilityModes: { visual: false, motor: false, handsFree: false },
  speakingSpeed: 'normal',
  isConfigured: false,
  setAccessibilityModes: (accessibilityModes) => set({ accessibilityModes }),
  setSpeakingSpeed: (speakingSpeed) => set({ speakingSpeed }),
  setConfigured: (isConfigured) => set({ isConfigured }),
}));
