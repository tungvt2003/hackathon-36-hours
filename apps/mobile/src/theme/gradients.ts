// apps/mobile/src/theme/gradients.ts
// Used with expo-linear-gradient wherever subtle background gradients are needed.

export const gradients = {
  // Main app background — very subtle cool-white to slightly warm-gray
  appCanvas: ['#FFFFFF', '#F5F6FA'] as const,

  // Dashboard top-to-mid — very subtle green warmth
  dashboardHero: ['#F0FAF5', '#F5F6FA'] as const,

  // Voice zone bottom sheet green glow
  voiceSheet: ['#FFFFFF', '#F0FAF5'] as const,

  // Splash background
  splash: ['#FFFFFF', '#F5F6FA'] as const,

  // Success / Delivery completion celebration
  success: ['#F0FAF5', '#FFFFFF'] as const,
} as const;
