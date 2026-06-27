export type TrackingStatus = 'received' | 'preparing' | 'delivering' | 'delivered';

export interface TrackingStep {
  id: TrackingStatus;
  label: string;
  icon: string;
}

export const TRACKING_STEPS: TrackingStep[] = [
  { id: 'received', label: 'Đã nhận đơn', icon: 'receipt' },
  { id: 'preparing', label: 'Đang chuẩn bị', icon: 'chef-hat' },
  { id: 'delivering', label: 'Đang giao', icon: 'bike' },
  { id: 'delivered', label: 'Đã giao', icon: 'check-circle' },
];

export const STATUS_ANNOUNCEMENTS: Record<TrackingStatus, string> = {
  received: 'Đơn hàng đã được nhận.',
  preparing: 'Nhà hàng đang chuẩn bị đơn của bạn.',
  delivering: 'Tài xế đang trên đường giao hàng.',
  delivered: 'Đơn hàng đã được giao thành công!',
};
