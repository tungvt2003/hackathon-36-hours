import { Intent, PartnerCode } from '../types';

export type VoiceIntentContext = 'platform_select' | 'home' | 'food' | 'ride';

export type RootStackParamList = {
  Splash: undefined;
  ConnectGrabAccount: undefined;
  ProfileSetup: undefined;
  Dashboard: undefined;
  VoiceAssistant: { initialPromptHint?: string; context?: string };
  VoiceAssistantIntent: { context: VoiceIntentContext; aiGreeting: string };
  VoiceProcessing: { audioBase64?: string; userText?: string; context?: string };
  VoiceSpeaking: {
    userText: string;
    aiText: string;
    context?: string;
    sessionId?: string;
    quotePartner?: PartnerCode;
    canConfirmOrder?: boolean;
    audioBase64?: string;
  };
  VoiceError: undefined;
  RestaurantSelection: { intent: Intent };
  OrderConfirmation: { orderId: string; partner: PartnerCode; mode?: 'confirm' | 'view' };
  FoodTracking: { orderId: string; intent: Intent };
  RideTracking: { orderId: string; intent: Intent };
  CancellationAlert: { orderId: string; intent: Intent };
  DeliverySuccess: { orderId: string };
  RatingScreen: { orderId: string };
  OrderHistory: undefined;
  Settings: undefined;
  Stats: undefined;
};
