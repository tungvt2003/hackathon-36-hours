import { PartnerCode } from '../../types';
import { PARTNER_LABEL, VALID_PLACES } from './voice.constants';
import type { VoiceNluIntent, VoiceNluResult } from './voice-nlu.service';

function formatVnd(amount: number): string {
  return amount.toLocaleString('en-US');
}

export const voiceNlg = {
  platformGreeting(): string {
    return "Hello! I'm Suara, your voice assistant. Which platform would you like to use? You can say Grab, Be, Xanh SM, or Shopee Food.";
  },

  platformGrabSelected(): string {
    return "You've selected Grab. Great! What would you like to do today? You can say: order food, or book a ride.";
  },

  platformGrabConfirmedAfterFallback(): string {
    return "Great! You've selected Grab. What would you like to do today? You can say: order food, or book a ride.";
  },

  platformUnsupported(platform: PartnerCode): string {
    const name = PARTNER_LABEL[platform];
    return `Sorry, ${name} is not available yet. Right now, Suara only supports Grab. Would you like to use Grab instead?`;
  },

  platformRetryPrompt(): string {
    return 'No problem. Which platform would you like to use? Grab, Be, Xanh SM, or Shopee Food?';
  },

  platformUnclear(retryCount: number): string {
    if (retryCount >= 3) {
      return "I'm having trouble understanding. Please tap the microphone to try again.";
    }
    return "Sorry, I didn't catch that. Please say one of these: Grab, Be, Xanh SM, or Shopee Food.";
  },

  servicePrompt(): string {
    return 'What would you like to do today? You can say: order food, or book a ride.';
  },

  serviceFoodSelected(): string {
    return 'Sure! What would you like to eat? For example, you can say: pho, broken rice, fried chicken, or a burger.';
  },

  serviceRideSelected(): string {
    return 'Sure! Where would you like to go?';
  },

  serviceUnclear(): string {
    return "I didn't quite catch that. Would you like to order food, or book a ride?";
  },

  foodDishPrompt(): string {
    return 'What would you like to eat?';
  },

  foodSingleMatch(
    restaurantName: string,
    dishName: string,
    priceVnd: number,
    distanceKm: number,
    etaMin: number,
  ): string {
    return `I found ${restaurantName}, ${distanceKm} kilometers away, delivering in about ${etaMin} minutes. They have ${dishName} for ${formatVnd(priceVnd)} Vietnamese dong. Would you like to order that?`;
  },

  foodMultipleRestaurants(count: number, dishName: string): string {
    return `I found ${count} restaurants with that dish. Which one would you like? Say one, two, or the restaurant name.`;
  },

  foodNotFound(): string {
    return "Sorry, I couldn't find that dish on Grab right now. Would you like to try something else? For example: pho, broken rice, or fried chicken.";
  },

  foodUnclear(): string {
    return "Sorry, I didn't catch that. What would you like to eat? You can say something like: pho, broken rice, or fried chicken.";
  },

  foodDeclined(): string {
    return 'No problem. What else would you like to eat?';
  },

  restaurantSelectPrompt(): string {
    return 'Which restaurant would you like? Say one, two, three, the name, closest, or cheapest.';
  },

  restaurantChosen(name: string): string {
    return `You've chosen ${name}. Let me pull up your order.`;
  },

  rideDestinationPrompt(): string {
    return 'Where would you like to go?';
  },

  rideDestinationValid(placeName: string): string {
    return `You want to go to ${placeName}. I'm finding a ride for you now...`;
  },

  rideDestinationInvalid(): string {
    return "Sorry, I couldn't find that destination. Right now I can take you to: Tan Son Nhat Airport, Mien Dong Bus Station, Ben Thanh Market, Bitexco Tower, or District 1. Which one would you like?";
  },

  rideUnclear(): string {
    return "Sorry, I didn't catch that. Where would you like to go? For example: the airport, Ben Thanh Market, or Bitexco Tower.";
  },

  rideQuote(placeName: string, priceVnd: number, etaMin: number): string {
    return `Here are your ride details: GrabCar from your current location to ${placeName}. Estimated fare: ${formatVnd(priceVnd)} Vietnamese dong. Your driver will arrive in about ${etaMin} minutes. Say confirm to book the ride, or cancel to go back.`;
  },

  rideConfirmed(driverName: string, plate: string, etaMin: number, otp: string): string {
    return `Ride booked successfully! Driver ${driverName} is on the way. Plate number: ${plate}. Estimated ${etaMin} minutes. Your OTP is ${otp.split('').join(', ')}.`;
  },

  orderConfirmed(orderId: string): string {
    return `Order placed successfully! Your order ID is ${orderId}. The restaurant is preparing your food. I'll notify you when there is an update.`;
  },

  orderCancelled(): string {
    return 'Order cancelled. Would you like to order something else?';
  },

  globalHelp(): string {
    return 'You can speak naturally. For example: order pho, or take me to the airport. Say help anytime for guidance.';
  },

  globalCancel(): string {
    return 'Cancelled. What would you like to do next?';
  },

  sttError(): string {
    return "Sorry, I didn't hear you clearly. Please try again.";
  },

  networkError(): string {
    return "Sorry, something went wrong. I'll try again right away.";
  },

  networkFatal(): string {
    return "I'm having trouble connecting. Please check your internet connection and try again.";
  },

  idleTimeout(): string {
    return 'Are you still there? Tap the microphone to try again, or say go home.';
  },

  ratingPrompt(isRide = false): string {
    return isRide
      ? 'How many stars would you give your driver? Say one star, two stars, three stars, four stars, or five stars.'
      : 'How many stars would you give this order? Say one star, two stars, three stars, four stars, or five stars.';
  },

  ratingReceived(stars: number): string {
    return `You gave ${stars} stars. Would you like to add a comment? Say yes to add one, or no to submit.`;
  },

  ratingCommentPrompt(): string {
    return 'Please go ahead and speak your comment.';
  },

  ratingThankYou(): string {
    return 'Thank you for your review! Taking you back to the home screen.';
  },

  voiceErrorPrompt(): string {
    return 'Sorry, something went wrong. Would you like to try again, or go back to the home screen?';
  },

  fromNlu(context: string, nlu: VoiceNluResult, retryCount = 0): string {
    switch (nlu.intent) {
      case 'SELECT_PLATFORM':
        return voiceNlg.platformGrabSelected();
      case 'PLATFORM_UNSUPPORTED':
        return voiceNlg.platformUnsupported(nlu.slots.platform as PartnerCode);
      case 'SELECT_SERVICE_FOOD':
        return voiceNlg.serviceFoodSelected();
      case 'SELECT_SERVICE_RIDE':
        return voiceNlg.serviceRideSelected();
      case 'SELECT_FOOD_DISH':
        if (Number(nlu.slots.restaurantCount) > 1) {
          return voiceNlg.foodMultipleRestaurants(
            Number(nlu.slots.restaurantCount),
            String(nlu.slots.dishName),
          );
        }
        return voiceNlg.foodSingleMatch(
          String(nlu.slots.restaurantName),
          String(nlu.slots.dishName),
          Number(nlu.slots.priceVnd),
          Number(nlu.slots.distanceKm),
          Number(nlu.slots.etaMin),
        );
      case 'FOOD_NOT_FOUND':
        return voiceNlg.foodNotFound();
      case 'SELECT_DESTINATION':
        return voiceNlg.rideDestinationValid(String(nlu.slots.placeName));
      case 'DESTINATION_INVALID':
        return voiceNlg.rideDestinationInvalid();
      case 'GLOBAL_HELP':
        return voiceNlg.globalHelp();
      case 'GLOBAL_CANCEL':
        return voiceNlg.globalCancel();
      case 'UNKNOWN':
        if (context === 'platform_select') return voiceNlg.platformUnclear(retryCount);
        if (context === 'home') return voiceNlg.serviceUnclear();
        if (context === 'food') return voiceNlg.foodUnclear();
        if (context === 'ride') return voiceNlg.rideUnclear();
        return voiceNlg.sttError();
      default:
        return voiceNlg.sttError();
    }
  },
};
