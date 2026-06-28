export const PLATFORM_AI_GREETING =
  'Xin chào, mình là Suara, trợ lý giọng nói của bạn. Bạn muốn dùng nền tảng nào? Bạn có thể nói Grab, Be, Xanh SM hoặc Shopee Food.';

export const loginService = {
  mockGrabAuth: async (): Promise<boolean> => {
    return new Promise((resolve) => setTimeout(resolve, 1500));
  },
};
