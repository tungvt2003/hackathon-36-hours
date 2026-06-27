import { create } from 'zustand';

export interface AppStoreState {
  apiBaseUrl: string;
  userId: string | null;
  isReady: boolean;
  setApiBaseUrl: (apiBaseUrl: string) => void;
  setUserId: (userId: string | null) => void;
  setReady: (isReady: boolean) => void;
  resetSession: () => void;
}

const initialState = {
  apiBaseUrl: 'http://localhost:3000',
  userId: null,
  isReady: false,
};

const useAppStore = create<AppStoreState>((set) => ({
  ...initialState,
  setApiBaseUrl: (apiBaseUrl) => set({ apiBaseUrl }),
  setUserId: (userId) => set({ userId }),
  setReady: (isReady) => set({ isReady }),
  resetSession: () => set({ userId: null }),
}));

export default useAppStore;