export interface DashboardAction {
  id: string;
  title: string;
  icon: string;
  route: string;
}

export const dashboardService = {
  getQuickActions: (): DashboardAction[] => {
    return [
      { id: '1', title: 'Order Food', icon: 'food', route: 'RestaurantSelection' },
      { id: '2', title: 'Book Ride', icon: 'car', route: 'VoiceAssistant' },
      { id: '3', title: 'Order History', icon: 'history', route: 'OrderHistory' },
      { id: '4', title: 'Account Settings', icon: 'account', route: 'ProfileSetup' },
    ];
  },
};
