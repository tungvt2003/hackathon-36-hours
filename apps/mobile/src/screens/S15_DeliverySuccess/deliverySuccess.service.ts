export interface SuccessContent {
  isFood: boolean;
  heading: string;
  body: string;
  timeLabel: string;
  announcement: string;
}

export function getSuccessContent(orderId: string): SuccessContent {
  const isFood = !orderId.includes('ride');
  return {
    isFood,
    heading: isFood ? 'Đã giao hàng!' : 'Chuyến đi hoàn tất!',
    body: isFood
      ? 'Đơn hàng từ Phở Hà Nội đã được giao.'
      : 'Chuyến đi của bạn đã hoàn tất an toàn.',
    timeLabel: isFood ? 'Đã giao lúc 12:34' : 'Hoàn tất lúc 12:34',
    announcement: isFood
      ? 'Đơn hàng đã được giao. Bạn có muốn đánh giá trải nghiệm không?'
      : 'Chuyến đi đã hoàn tất. Bạn có muốn đánh giá tài xế không?',
  };
}
