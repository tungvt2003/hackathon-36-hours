import { PartnerCode } from '../../types';
import { PARTNER_LABEL } from './voice.constants';
import type { VoiceNluResult } from './voice-nlu.service';

function formatVnd(amount: number): string {
  return amount.toLocaleString('vi-VN');
}

export const voiceNlg = {
  platformGreeting(): string {
    return 'Xin chào, tôi là Suara. Bạn muốn dùng dịch vụ nào? Hiện tại bạn có thể nói Grab để tiếp tục.';
  },

  platformGrabSelected(): string {
    return 'Bạn đã chọn Grab. Hôm nay bạn muốn đặt đồ ăn hay đặt xe?';
  },

  platformGrabConfirmedAfterFallback(): string {
    return 'Đã chọn Grab. Hôm nay bạn muốn đặt đồ ăn hay đặt xe?';
  },

  platformUnsupported(platform: PartnerCode): string {
    const name = PARTNER_LABEL[platform];
    return `Hiện tại ${name} chưa được hỗ trợ. Suara chỉ hỗ trợ Grab trong bản demo này. Bạn có muốn dùng Grab không?`;
  },

  platformRetryPrompt(): string {
    return 'Không sao. Bạn muốn dùng dịch vụ nào? Hiện tại bạn có thể nói Grab.';
  },

  platformUnclear(retryCount: number): string {
    if (retryCount >= 3) {
      return 'Tôi vẫn chưa nghe rõ. Bạn hãy chạm vào nút micro để thử lại.';
    }
    return 'Tôi chưa nghe rõ. Bạn có thể nói Grab để tiếp tục.';
  },

  servicePrompt(): string {
    return 'Bạn muốn đặt đồ ăn hay đặt xe?';
  },

  serviceFoodSelected(): string {
    return 'Bạn muốn ăn món gì? Bạn có thể nói tên món, hoặc nói gợi ý nếu chưa biết ăn gì.';
  },

  serviceRideSelected(): string {
    return 'Bạn muốn đi đâu?';
  },

  serviceUnclear(): string {
    return 'Tôi chưa nghe rõ. Bạn muốn đặt đồ ăn hay đặt xe?';
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
    return `Tôi tìm thấy ${restaurantName}, cách khoảng ${distanceKm} ki lô mét, giao trong khoảng ${etaMin} phút. Quán có ${dishName}, giá ${formatVnd(priceVnd)} đồng. Bạn muốn đặt món này không?`;
  },

  foodMultipleRestaurants(count: number, dishName: string): string {
    return `Tôi tìm thấy ${count} quán có ${dishName}. Bạn muốn chọn quán nào? Hãy nói tên quán.`;
  },

  foodNotFound(): string {
    return 'Hiện tôi chưa tìm thấy món này trên Grab gần bạn. Bạn muốn thử món khác không? Tôi có thể gợi ý cơm tấm, phở bò hoặc gà rán.';
  },

  foodUnclear(): string {
    return 'Tôi chưa nghe rõ món bạn muốn ăn. Bạn có thể nói phở bò, cơm tấm, hoặc gà rán.';
  },

  foodDeclined(): string {
    return 'Không sao. Bạn muốn ăn món gì khác?';
  },

  restaurantSelectPrompt(): string {
    return 'Bạn muốn chọn quán nào? Hãy nói tên quán, ví dụ KFC Bến Thành.';
  },

  restaurantChosen(name: string): string {
    return `Bạn đã chọn ${name}. Tôi sẽ mở thông tin đơn hàng.`;
  },

  rideDestinationPrompt(): string {
    return 'Bạn muốn đi đâu?';
  },

  rideDestinationValid(placeName: string): string {
    return `Bạn muốn đi đến ${placeName}. Tôi đang tìm chuyến xe phù hợp cho bạn.`;
  },

  rideDestinationInvalid(): string {
    return 'Tôi chưa tìm thấy điểm đến đó. Hiện demo có thể đi đến sân bay Tân Sơn Nhất, bến xe Miền Đông, chợ Bến Thành, Bitexco, hoặc Quận 1. Bạn muốn đi đâu?';
  },

  rideUnclear(): string {
    return 'Tôi chưa nghe rõ điểm đến. Bạn có thể nói sân bay, chợ Bến Thành, hoặc Bitexco.';
  },

  rideQuote(placeName: string, priceVnd: number, etaMin: number): string {
    return `Thông tin chuyến đi: GrabCar từ vị trí hiện tại đến ${placeName}. Giá dự kiến ${formatVnd(priceVnd)} đồng. Tài xế đến trong khoảng ${etaMin} phút. Bạn muốn xác nhận đặt xe hay hủy?`;
  },

  rideConfirmed(driverName: string, plate: string, etaMin: number, otp: string): string {
    return `Đặt xe thành công. Tài xế ${driverName} đang đến. Biển số xe là ${plate}. Dự kiến ${etaMin} phút. Mã OTP của bạn là ${otp.split('').join(', ')}.`;
  },

  orderConfirmed(orderId: string): string {
    return `Đặt món thành công. Mã đơn hàng là ${orderId}. Quán đang chuẩn bị món. Tôi sẽ thông báo khi có cập nhật.`;
  },

  orderCancelled(): string {
    return 'Đơn đã được hủy. Bạn muốn đặt món khác không?';
  },

  globalHelp(): string {
    return 'Bạn có thể nói tự nhiên, ví dụ: đặt gà rán, hoặc đặt xe đến sân bay. Bạn cũng có thể nói hủy để dừng.';
  },

  globalCancel(): string {
    return 'Đã hủy. Bạn muốn làm gì tiếp theo?';
  },

  sttError(): string {
    return 'Tôi chưa nghe rõ. Bạn vui lòng thử lại.';
  },

  networkError(): string {
    return 'Có lỗi xảy ra. Tôi sẽ thử lại ngay.';
  },

  networkFatal(): string {
    return 'Tôi đang gặp lỗi kết nối. Bạn hãy kiểm tra mạng và thử lại.';
  },

  idleTimeout(): string {
    return 'Bạn còn ở đó không? Hãy chạm micro để thử lại, hoặc nói về trang chủ.';
  },

  ratingPrompt(isRide = false): string {
    return isRide
      ? 'Bạn muốn đánh giá tài xế mấy sao? Hãy nói từ một sao đến năm sao.'
      : 'Bạn muốn đánh giá đơn hàng mấy sao? Hãy nói từ một sao đến năm sao.';
  },

  ratingReceived(stars: number): string {
    return `Bạn đã đánh giá ${stars} sao. Bạn có muốn thêm nhận xét không?`;
  },

  ratingCommentPrompt(): string {
    return 'Bạn hãy nói nhận xét của mình.';
  },

  ratingThankYou(): string {
    return 'Cảm ơn bạn đã đánh giá. Tôi sẽ đưa bạn về trang chủ.';
  },

  voiceErrorPrompt(): string {
    return 'Có lỗi xảy ra. Bạn muốn thử lại hay quay về trang chủ?';
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
