// apps/mobile/src/screens/S05_Dashboard/dashboard.service.ts

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
      {
        id: '1',
        title: 'Món ăn & Thực phẩm',
        hint: 'Đặt phở, cơm, hoặc đi chợ hằng ngày',
        icon: 'food-fork-drink',
        route: 'RestaurantSelection',
      },
      {
        id: '2',
        title: 'Di chuyển & Giao hàng',
        hint: 'Đặt xe máy, ô tô hoặc gửi kiện hàng',
        icon: 'moped-outline',
        route: 'VoiceAssistant',
      },
      {
        id: '3',
        title: 'Ưu đãi của tôi',
        hint: 'Xem các mã giảm giá Grab đang có',
        icon: 'ticket-percent-outline',
        route: 'OrderHistory', // Mock route for now
      },
      {
        id: '4',
        title: 'Trung tâm hỗ trợ',
        hint: 'Hỗ trợ khẩn cấp hoặc giải đáp thắc mắc',
        icon: 'help-circle-outline',
        route: 'OrderHistory', // Mock route for now
      },
    ];
  },
};
