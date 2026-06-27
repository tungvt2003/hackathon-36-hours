* **S-01: Splash Screen** – Màn hình khởi động khi vào ứng dụng.  
* **S-02: Onboarding Carousel** – Giới thiệu hướng dẫn sử dụng ứng dụng qua 3 slide.  
* **S-03: Grab OAuth Login** – Đăng nhập thông qua tài khoản Grab.  
* **S-04: Disability Profile Setup** – Thiết lập các tùy chọn hỗ trợ cho người khuyết tật.  
* **S-05: Home — Voice Assistant (Idle)** – Màn hình chính khi trợ lý ảo đang ở trạng thái chờ.  
* **S-06: Voice Active — Listening State** – Trạng thái ứng dụng đang lắng nghe lệnh thoại từ người dùng.  
* **S-07: Voice Active — Processing State** – Trạng thái AI đang xử lý thông tin yêu cầu.  
* **S-08: Voice Active — AI Speaking / Transcript** – AI phản hồi bằng giọng nói và hiển thị bản dịch văn bản.  
* **S-09: Voice Error Recovery** – Xử lý và phục hồi khi gặp lỗi nhận diện giọng nói.  
* **S-10: Order Confirmation (Voice Review)** – Duyệt lại và xác nhận chi tiết đơn hàng bằng giọng nói.  
* **S-11: AI Validation — Ambiguous Order** – AI xác thực lại khi yêu cầu của người dùng chưa rõ ràng.  
* **S-12: Live Tracking — Food Delivery** – Theo dõi quá trình giao đồ ăn trong thời gian thực.  
* **S-13: Live Tracking — Ride (GrabCar/Bike)** – Theo dõi hành trình di chuyển của xe đã đặt.  
* **S-14: Restaurant/Driver Cancellation Alert** – Thông báo khi đơn hàng bị nhà hàng hoặc tài xế hủy.  
* **S-15: Delivery Handoff Screen** – Màn hình xác nhận khi việc giao nhận hàng hoàn tất.  
* **S-16: Voice Rating & Feedback** – Thực hiện đánh giá và phản hồi dịch vụ bằng giọng nói.  
* **S-17: Order History** – Danh sách lịch sử đơn hàng được thiết kế tối ưu cho truy cập bằng giọng nói.

Flow tổng quan

## **User Flow**

1. **S02 – Onboarding**  
   * Giới thiệu Suara.  
   * Có thể **Skip** hoặc **Get Started**.  
   * Chuyển sang **S03 – Connect Grab Account**.  
2. **S03 – Connect Grab Account**  
   * Kết nối tài khoản Grab (mock OAuth).  
   * Có thể **Skip**.  
   * Chuyển sang **S04 – Profile Setup**.  
3. **S04 – Profile Setup**  
   * Chọn Accessibility Mode.  
   * Chọn AI Speaking Speed.  
   * Lưu cấu hình.  
   * Chuyển đến **S05 – Dashboard**.  
4. **S05 – Dashboard**  
   * Order Food.  
   * Book Ride.  
   * View Order History.  
   * Open Profile.  
   * Nhấn Mic để mở **S06–S09 – Voice Assistant**.  
5. **S06–S09 – Voice Assistant**  
   * Listening.  
   * Processing.  
   * AI Response.  
   * Error (nếu có).  
   * Nếu AI tìm thấy nhiều nhà hàng, chuyển sang **S11 – Restaurant Selection**.  
   * Nếu chỉ có một kết quả, chuyển sang **S10 – Order Confirmation**.  
6. **S11 – Restaurant Selection**  
   * Hiển thị danh sách nhà hàng.  
   * Người dùng chọn một nhà hàng.  
   * Chuyển sang **S10 – Order Confirmation**.  
7. **S10 – Order Confirmation**  
   * Hiển thị thông tin đơn hàng.  
   * Hiển thị địa chỉ giao hàng.  
   * Hiển thị phương thức thanh toán.  
   * Hiển thị tổng tiền.  
   * Người dùng xác nhận đặt đơn.  
   * Nếu là Food, chuyển sang **S12 – Food Tracking**.  
   * Nếu là Ride, chuyển sang **S13 – Ride Tracking**.  
8. **S12 – Food Tracking**  
   * Theo dõi trạng thái đơn hàng.  
   * Order Received.  
   * Preparing.  
   * Out for Delivery.  
   * Delivered hoặc Cancelled.  
9. **S13 – Ride Tracking**  
   * Hiển thị tài xế.  
   * Hiển thị biển số xe.  
   * Hiển thị ETA.  
   * Hiển thị OTP.  
   * Ride Completed hoặc Cancelled.  
10. **S14 – Cancellation Alert**  
    * Thông báo đơn bị hủy.  
    * Find Another Restaurant.  
    * Back Home.  
11. **S15 – Delivery Success**  
    * Hiển thị animation thành công.  
    * Order Again.  
    * Rate Now.  
12. **S16 – Rating Screen**  
    * Chọn số sao.  
    * Chọn tag đánh giá.  
    * Submit Review hoặc Skip.  
    * Quay về **S05 – Dashboard**.  
13. **S17 – Order History**  
    * Xem lịch sử đơn hàng.  
    * Tìm kiếm.  
    * Reorder.  
    * View Details.  
    * Reorder mở lại **S10 – Order Confirmation**.  
    * View Details mở **S10 – Order Confirmation** ở chế độ chỉ xem.

