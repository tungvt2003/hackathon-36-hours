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
    heading: isFood ? 'Delivered!' : 'Ride Complete!',
    body: isFood
      ? 'Your order from Phở Hà Nội has been delivered.'
      : 'Your ride has been completed safely.',
    timeLabel: isFood ? 'Delivered at 12:34 PM' : 'Completed at 12:34 PM',
    announcement: isFood
      ? 'Your order has been delivered! Would you like to rate your experience?'
      : 'Your ride is complete! Would you like to rate your driver?',
  };
}
