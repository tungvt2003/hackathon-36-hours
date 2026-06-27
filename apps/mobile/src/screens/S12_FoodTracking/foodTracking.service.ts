export type TrackingStatus = 'received' | 'preparing' | 'delivering' | 'delivered';

export interface TrackingStep {
  id: TrackingStatus;
  label: string;
  icon: string;
}

export const TRACKING_STEPS: TrackingStep[] = [
  { id: 'received', label: 'Order Received', icon: 'receipt' },
  { id: 'preparing', label: 'Preparing', icon: 'chef-hat' },
  { id: 'delivering', label: 'On the Way', icon: 'bike' },
  { id: 'delivered', label: 'Delivered', icon: 'check-circle' },
];

export const STATUS_ANNOUNCEMENTS: Record<TrackingStatus, string> = {
  received: 'Your order has been received by the restaurant.',
  preparing: 'The restaurant is preparing your food.',
  delivering: 'Your driver is on the way with your order.',
  delivered: 'Your order has been delivered. Enjoy your meal!',
};
