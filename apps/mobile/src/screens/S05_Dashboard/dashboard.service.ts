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
      { id: '1', title: 'Food Delivery', hint: 'Order from best shops', icon: 'food', route: 'RestaurantSelection' },
      { id: '2', title: 'Ride Hailing', hint: 'Go anywhere safely', icon: 'car', route: 'VoiceAssistant' },
      { id: '3', title: 'Quick Track', hint: 'Follow your active orders', icon: 'map-marker-distance', route: 'OrderHistory' },
      { id: '4', title: 'Voice Help', hint: 'Ask AI anything', icon: 'microphone', route: 'VoiceAssistant' },
    ];
  },
};
