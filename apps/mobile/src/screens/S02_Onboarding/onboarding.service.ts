export interface OnboardingSlide {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export const onboardingService = {
  getSlides: (): OnboardingSlide[] => [
    {
      id: '1',
      icon: 'human',
      title: 'Designed for everyone',
      description: "Whether you're visually impaired, busy-handed, or just want to order faster - Suara talks with you.",
    },
    {
      id: '2',
      icon: 'microphone',
      title: 'Just speak up',
      description: "Say 'Order beef phở' or 'Call a car home' - AI understands and acts immediately.",
    },
    {
      id: '3',
      icon: 'shield-check',
      title: 'Safe & private',
      description: 'Suara never stores your voice. Every command is encrypted. Your account is always safe.',
    },
  ],
};
