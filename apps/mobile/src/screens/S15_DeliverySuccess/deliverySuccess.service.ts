export interface SuccessContent {
  isFood: boolean;
  heading: string;
  body: string;
  timeLabel: string;
  announcement: string;
}

export function getSuccessContent(orderId: string): SuccessContent {
  const isFood = orderId.includes('food') || orderId.includes('mock-food') || orderId.startsWith('h');
  return {
    isFood,
    heading: isFood ? 'Đã giao thành công' : 'Chuyến đi hoàn thành',
    body: isFood ? 'Đơn hàng từ Phở Hà Nội đã được giao đến bạn.' : 'Chuyến đi của bạn đã hoàn thành an toàn.',
    timeLabel: isFood ? 'Giao lúc 12:34 CH' : 'Kết thúc lúc 12:34 CH',
    announcement: isFood
      ? 'Đơn hàng đã giao thành công! Bạn có muốn đánh giá dịch vụ không?'
      : 'Chuyến đi đã hoàn thành! Bạn có muốn đánh giá tài xế không?',
  };
}
