export const loginService = {
  mockGrabAuth: async (): Promise<boolean> => {
    return new Promise((resolve) => setTimeout(resolve, 1500));
  },
};
