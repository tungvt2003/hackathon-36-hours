export type RideStatus = 'finding' | 'en_route' | 'arrived' | 'completed';

export interface RideStep {
  id: RideStatus;
  label: string;
  icon: string;
}

export const RIDE_STEPS: RideStep[] = [
  { id: 'finding', label: 'Đang tìm xe', icon: 'magnify' },
  { id: 'en_route', label: 'Tài xế đang đến', icon: 'car' },
  { id: 'arrived', label: 'Tài xế đã đến', icon: 'map-marker-check' },
  { id: 'completed', label: 'Hoàn thành', icon: 'check-circle' },
];

export const MOCK_DRIVER = {
  name: 'Trần Minh B',
  rating: 4.95,
  vehicle: 'GrabCar · Vios',
  plate: '51G-12345',
  otp: '8472'
};

export const RIDE_STATUS_ANNOUNCEMENTS: Record<RideStatus, string> = {
  finding: 'Đang tìm tài xế cho bạn.',
  en_route: 'Tài xế đã nhận chuyến và đang đến.',
  arrived: 'Tài xế đã đến. OTP của bạn là 8-4-7-2',
  completed: 'Chuyến đi đã hoàn thành. Cảm ơn bạn!',
};
