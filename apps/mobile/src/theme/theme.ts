export const theme = {
  colors: {
    primary: '#00B14F',
    primaryDark: '#00913E',
    error: '#E11900',
    background: '#F9F9FF',
    surface: '#FFFFFF',
    textPrimary: '#151C27',
    textSecondary: '#575E70',
    border: '#DCE2F3',
  },
  spacing: [4, 8, 12, 16, 24, 32],
  fontSize: {
    body: 16,
    label: 18,
    heading: 28,
  },
  touchTarget: 48,
};

export type Theme = typeof theme;
