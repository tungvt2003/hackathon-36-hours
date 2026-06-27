export const PLATFORM_AI_GREETING =
  "Hello! I'm Suara, your voice assistant. Which platform would you like to use? You can say Grab, Be, Xanh SM, or Shopee Food.";

export const loginService = {
  mockGrabAuth: async (): Promise<boolean> => {
    return new Promise((resolve) => setTimeout(resolve, 1500));
  },
};
