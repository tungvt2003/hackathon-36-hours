import { Intent, PartnerCode } from '../types';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  ConnectGrabAccount: undefined;
  ProfileSetup: undefined;
  Dashboard: undefined;
  VoiceAssistant: { initialPromptHint?: string };
  VoiceProcessing: { userText: string };
  RestaurantSelection: { intent: Intent };
  OrderConfirmation: { orderId: string; partner: PartnerCode; mode?: 'confirm' | 'view' };
  FoodTracking: { orderId: string; intent: Intent };
  RideTracking: { orderId: string; intent: Intent };
  CancellationAlert: { orderId: string; intent: Intent };
  DeliverySuccess: { orderId: string };
  RatingScreen: { orderId: string };
  OrderHistory: undefined;
};
