export interface DashboardAction {
  id: string;
  title: string;
  hint: string;
  icon: string;
  route: string;
}

export const dashboardService = {
  getActions: (): DashboardAction[] => {
    return [
      { id: '1', title: 'Order Food', hint: 'Say what you want', icon: 'food', route: 'RestaurantSelection' },
      { id: '2', title: 'Book Ride', hint: 'Tell me where to go', icon: 'car', route: 'VoiceAssistant' },
      { id: '3', title: 'Order History', hint: 'View past orders', icon: 'history', route: 'OrderHistory' },
      { id: '4', title: 'Account Settings', hint: 'Manage your profile', icon: 'account', route: 'ProfileSetup' },
    ];
  },
};
