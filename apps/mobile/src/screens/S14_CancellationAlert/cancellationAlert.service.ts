export interface CancellationInfo {
  heading: string;
  body: string;
  refundNote: string;
  primaryActionLabel: string;
  announcement: string;
}

export function getCancellationInfo(isFood: boolean): CancellationInfo {
  return isFood
    ? {
        heading: 'Đơn đã bị huỷ',
        body: 'Nhà hàng đã huỷ đơn của bạn. Tiền sẽ được hoàn trong 3–5 ngày làm việc.',
        refundNote: 'Hoàn tiền 80.000đ trong 3–5 ngày làm việc',
        primaryActionLabel: 'Tìm nhà hàng khác',
        announcement: 'Đơn hàng đã bị nhà hàng huỷ. Vui lòng chọn hành động.',
      }
    : {
        heading: 'Chuyến đi đã bị huỷ',
        body: 'Tài xế đã huỷ chuyến đi của bạn. Chúng tôi sẽ giúp bạn tìm xe mới.',
        refundNote: 'Hoàn tiền 45.000đ trong 3–5 ngày làm việc',
        primaryActionLabel: 'Tìm xe mới',
        announcement: 'Tài xế đã huỷ chuyến. Vui lòng chọn hành động.',
      };
}
