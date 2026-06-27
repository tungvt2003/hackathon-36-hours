export const PLATFORM_AI_GREETING =
  'Xin chào, tôi là Suara. Bạn muốn dùng dịch vụ nào? Hiện tại bạn có thể nói Grab để tiếp tục.';

export const loginService = {
  mockGrabAuth: async (): Promise<boolean> => {
    return new Promise((resolve) => setTimeout(resolve, 1500));
  },
};
