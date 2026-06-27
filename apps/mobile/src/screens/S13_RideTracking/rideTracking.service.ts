export type RideStatus = 'finding' | 'en_route' | 'arrived' | 'completed';

export interface RideStep {
  id: RideStatus;
  label: string;
  icon: string;
}

export const RIDE_STEPS: RideStep[] = [
  { id: 'finding', label: 'Finding Driver', icon: 'magnify' },
  { id: 'en_route', label: 'Driver On the Way', icon: 'car' },
  { id: 'arrived', label: 'Driver Arrived', icon: 'map-marker-check' },
  { id: 'completed', label: 'Completed', icon: 'check-circle' },
];

export const MOCK_DRIVER = {
  name: 'Tran Minh B',
  rating: 4.95,
  vehicle: 'GrabCar · Vios',
  plate: '51G-12345',
  otp: '8472',
};

export const RIDE_STATUS_ANNOUNCEMENTS: Record<RideStatus, string> = {
  finding: 'Looking for a driver for you.',
  en_route: 'Your driver has accepted the ride and is on the way.',
  arrived: 'Your driver has arrived. Your OTP is 8, 4, 7, 2.',
  completed: 'Your ride is complete. Thank you for riding with Suara!',
};
