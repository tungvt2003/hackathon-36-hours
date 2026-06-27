export const PLATFORM_AI_GREETING =
  'Xin chào! Tôi là AccessAI. Vui lòng chọn nền tảng bạn muốn dùng: Grab, Be, Xanh SM, hoặc ShopeeFood.';

export const loginService = {
  mockGrabAuth: async (): Promise<boolean> => {
    return new Promise((resolve) => setTimeout(resolve, 1500));
  },
};
