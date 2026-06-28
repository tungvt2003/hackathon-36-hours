import { PartnerCode } from '../../types';
import { PARTNER_LABEL, VALID_PLACES } from './voice.constants';
import type { VoiceNluIntent, VoiceNluResult } from './voice-nlu.service';

function formatVnd(amount: number): string {
  return amount.toLocaleString('vi-VN');
}

export const voiceNlg = {
  platformGreeting(): string {
    return 'Xin chào! Tôi là Suara, trợ lý giọng nói của bạn. Bạn muốn dùng nền tảng nào? Bạn có thể nói Grab, Be, Xanh SM, hoặc Shopee Food.';
  },

  platformGrabSelected(): string {
    return 'Bạn đã chọn Grab. Tuyệt! Hôm nay bạn muốn làm gì? Bạn có thể nói: đặt đồ ăn, hoặc đặt xe.';
  },

  platformGrabConfirmedAfterFallback(): string {
    return 'Bạn đã chọn Grab. Tuyệt! Hôm nay bạn muốn làm gì? Bạn có thể nói: đặt đồ ăn, hoặc đặt xe.';
  },

  platformUnsupported(platform: PartnerCode): string {
    const name = PARTNER_LABEL[platform];
    return `Xin lỗi, ${name} hiện chưa khả dụng. Hiện tại Suara chỉ hỗ trợ Grab. Bạn có muốn dùng Grab không?`;
  },

  platformRetryPrompt(): string {
    return 'Không sao. Bạn muốn dùng nền tảng nào? Grab, Be, Xanh SM hay Shopee Food?';
  },

  platformUnclear(retryCount: number): string {
    if (retryCount >= 3) {
      return 'Mình chưa nghe rõ. Vui lòng nhấn microphone để thử lại.';
    }
    return 'Xin lỗi, mình chưa nghe rõ. Vui lòng nói một trong các lựa chọn: Grab, Be, Xanh SM hoặc Shopee Food.';
  },

  servicePrompt(): string {
    return 'Hôm nay bạn muốn làm gì? Bạn có thể nói: đặt đồ ăn, hoặc đặt xe.';
  },

  serviceFoodSelected(): string {
    return 'Được rồi! Bạn muốn ăn gì? Ví dụ, bạn có thể nói: phở, cơm tấm, gà rán, hoặc burger.';
  },

  serviceRideSelected(): string {
    return 'Được. Bạn muốn đi đâu?';
  },

  serviceUnclear(): string {
    return 'Mình chưa nghe rõ. Bạn muốn đặt món ăn hay đặt xe?';
  },

  foodDishPrompt(): string {
    return 'Bạn muốn ăn món gì?';
  },

  foodSingleMatch(
    restaurantName: string,
    dishName: string,
    priceVnd: number,
    distanceKm: number,
    etaMin: number,
  ): string {
    return `Mình tìm thấy ${restaurantName}, cách khoảng ${distanceKm} km, giao trong khoảng ${etaMin} phút. Quán có ${dishName} giá ${formatVnd(priceVnd)} đồng. Bạn có muốn đặt món này không?`;
  },

  foodMultipleRestaurants(count: number, dishName: string): string {
    return `Mình tìm thấy ${count} quán có món ${dishName}. Bạn muốn chọn quán nào? Hãy nói số một, số hai, hoặc tên quán.`;
  },

  foodNotFound(): string {
    return 'Xin lỗi, hiện tại mình chưa tìm thấy món đó trên Grab. Bạn muốn thử món khác không? Ví dụ: phở, cơm tấm hoặc gà rán.';
  },

  foodUnclear(): string {
    return 'Xin lỗi, mình chưa nghe rõ. Bạn muốn ăn món gì? Bạn có thể nói phở, cơm tấm hoặc gà rán.';
  },

  foodDeclined(): string {
    return 'Không sao. Bạn muốn ăn món nào khác?';
  },

  restaurantSelectPrompt(): string {
    return 'Bạn muốn chọn quán nào? Hãy nói số một, số hai, số ba, tên quán, quán gần nhất hoặc quán rẻ nhất.';
  },

  restaurantChosen(name: string): string {
    return `Bạn đã chọn ${name}. Mình sẽ mở đơn hàng của bạn.`;
  },

  rideDestinationPrompt(): string {
    return 'Bạn muốn đi đâu?';
  },

  rideDestinationValid(placeName: string): string {
    return `Bạn muốn đi đến ${placeName}. Mình đang tìm xe cho bạn.`;
  },

  rideDestinationInvalid(): string {
    return 'Xin lỗi, mình chưa tìm thấy điểm đến đó. Hiện tại mình có thể đưa bạn đến: Sân bay Tân Sơn Nhất, Bến xe Miền Đông, Chợ Bến Thành, Bitexco hoặc Quận 1. Bạn muốn đi đâu?';
  },

  rideUnclear(): string {
    return 'Xin lỗi, mình chưa nghe rõ. Bạn muốn đi đâu? Ví dụ: sân bay, Chợ Bến Thành hoặc Bitexco.';
  },

  rideQuote(placeName: string, priceVnd: number, etaMin: number): string {
    return `Thông tin chuyến xe: GrabCar từ vị trí hiện tại của bạn đến ${placeName}. Giá dự kiến ${formatVnd(priceVnd)} đồng. Tài xế sẽ đến trong khoảng ${etaMin} phút. Hãy nói xác nhận để đặt xe, hoặc hủy để quay lại.`;
  },

  rideConfirmed(driverName: string, plate: string, etaMin: number, otp: string): string {
    return `Đã đặt xe thành công. Tài xế ${driverName} đang đến. Biển số xe: ${plate}. Dự kiến ${etaMin} phút. Mã OTP của bạn là ${otp.split('').join(', ')}.`;
  },

  orderConfirmed(orderId: string): string {
    return `Đã đặt món thành công. Mã đơn hàng của bạn là ${orderId}. Quán đang chuẩn bị món ăn. Mình sẽ thông báo khi có cập nhật.`;
  },

  orderCancelled(): string {
    return 'Đã hủy đơn. Bạn có muốn đặt món khác không?';
  },

  globalHelp(): string {
    return 'Bạn có thể nói tự nhiên. Ví dụ: đặt phở, hoặc đặt xe đến sân bay. Bạn có thể nói trợ giúp bất cứ lúc nào.';
  },

  globalCancel(): string {
    return 'Đã hủy. Tiếp theo bạn muốn làm gì?';
  },

  sttError(): string {
    return 'Xin lỗi, mình nghe chưa rõ. Vui lòng thử lại.';
  },

  networkError(): string {
    return 'Xin lỗi, có lỗi xảy ra. Mình sẽ thử lại ngay.';
  },

  networkFatal(): string {
    return 'Mình đang gặp lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.';
  },

  idleTimeout(): string {
    return 'Bạn còn ở đó không? Hãy nhấn microphone để thử lại, hoặc nói về trang chủ.';
  },

  ratingPrompt(isRide = false): string {
    return isRide
      ? 'Bạn muốn đánh giá tài xế mấy sao? Hãy nói một sao, hai sao, ba sao, bốn sao hoặc năm sao.'
      : 'Bạn muốn đánh giá đơn hàng mấy sao? Hãy nói một sao, hai sao, ba sao, bốn sao hoặc năm sao.';
  },

  ratingReceived(stars: number): string {
    return `Bạn đã đánh giá ${stars} sao. Bạn có muốn thêm bình luận không? Nói có để thêm bình luận, hoặc không để gửi đánh giá.`;
  },

  ratingCommentPrompt(): string {
    return 'Bạn hãy nói bình luận của mình.';
  },

  ratingThankYou(): string {
    return 'Cảm ơn bạn đã đánh giá. Mình sẽ đưa bạn về trang chủ.';
  },

  voiceErrorPrompt(): string {
    return 'Xin lỗi, có lỗi xảy ra. Bạn muốn thử lại hay quay về trang chủ?';
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
