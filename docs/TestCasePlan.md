# Kế Hoạch Tình Huống Kiểm Thử Cho Video Minh Họa

Mục đích: chuẩn hóa 2 tình huống kiểm thử cho phần pitch, tập trung đúng người dùng Việt và đúng điểm khác biệt của sản phẩm: đặt xe/đặt món bằng giọng nói, hỗ trợ người khuyết tật, thông báo cho tài xế/nhà hàng và đánh giá sau khi giao hàng.

Quy ước: mỗi tình huống phải chạy riêng, đọc đúng câu đã ghi trong kịch bản, không tự thêm câu tiếng Anh hoặc diễn giải khác khi quay.

## Lưu Ý Quan Trọng

### Cờ hỗ trợ tiếp cận phải đi bằng giọng nói

Hiện code vẫn có `accessibilityFlag` qua switch trong `S06_VoiceAssistant`. Với video minh họa hướng tới người khiếm thị, không nên quay thao tác bật switch bằng tay. Luồng đúng cần là:

1. Hỏi một lần khi tạo hồ sơ hoặc lần đầu bắt đầu hội thoại: "Bạn có muốn tài xế và nhà hàng biết bạn cần hỗ trợ đặc biệt không? Nói có hoặc không."
2. Người dùng nói "Có".
3. Lưu vào `User.accessibilityFlag`.
4. Khi tạo đơn, `Order` đọc flag từ hồ sơ người dùng.
5. Khi xác nhận đơn, hệ thống trả thông báo cho tài xế hoặc nhà hàng nếu flag là `true`.

### Câu đánh giá phải dùng đúng câu đã code

Sau khi đơn chuyển sang `DELIVERED`, hệ thống phải nói:

**"Đơn hàng đã giao thành công. Bạn thấy thế nào? Nói 'tốt', 'bình thường', hoặc 'kém'."**

Cả 2 tình huống đều dùng đúng câu này ở cuối. Không dùng câu tự bịa như "Bạn cần hỗ trợ gì thêm không?".

## Tình Huống 1: Đặt Xe Đến Sân Bay Có Cảnh Báo Mưa

### Mục tiêu

Chứng minh người dùng Việt có thể đặt xe bằng giọng nói, hệ thống kiểm tra thời tiết/địa điểm, cảnh báo khi có mưa và chỉ tiếp tục sau khi người dùng xác nhận bằng giọng nói.

### Dữ liệu chuẩn bị

- Nền tảng: Grab.
- Điểm đến: `place-tsn` trong seed, tên hiển thị là "Sân bay Tân Sơn Nhất".
- Keyword hợp lệ khi nói: "sân bay", "tân sơn nhất", "tsn".
- Weather provider nên dùng mock khi quay: `PROVIDER_WEATHER=mock`.
- `place-tsn` đã có `rainOverride: true`, nên tình huống này luôn có cảnh báo mưa.
- `accessibilityFlag=true` đã được set bằng thiết lập giọng nói.

### Luồng chạy

1. Người dùng mở app và bắt đầu trợ lý giọng nói.
2. Hệ thống hỏi nền tảng, người dùng nói: "Grab".
3. Hệ thống hỏi muốn làm gì, người dùng nói: "Đặt xe đến sân bay Tân Sơn Nhất".
4. Backend parse intent `NAVIGATE`, lấy destination là sân bay.
5. Backend kiểm tra thời tiết, thấy sắp mưa.
6. Hệ thống nói: "Trời sắp mưa tại khu vực đó, bạn có muốn tiếp tục đặt xe không?"
7. Người dùng nói: "Có".
8. Backend lấy báo giá từ partner-sim.
9. Hệ thống đọc báo giá: "Grab báo giá X đồng, dự kiến Y phút. Bạn xác nhận đặt không?"
10. Người dùng nói: "Có".
11. Đơn được tạo và chuyển trạng thái tới `CONFIRMED`, sau đó `DRIVER_ASSIGNED`, `IN_TRANSIT`, `DELIVERED`.
12. Khi `DELIVERED`, hệ thống đọc đúng câu đánh giá đã ghi ở trên.
13. Người dùng nói: "Tốt".
14. Backend lưu đánh giá và cộng 50 AccessPoints cho tài xế nếu đủ điều kiện.

### Kịch bản đọc khi quay

| Bước | Ai nói | Câu chính xác | Kết quả mong đợi |
|---|---|---|---|
| 1 | Người dùng | **"Grab"** | Chọn nền tảng Grab |
| 2 | Người dùng | **"Đặt xe đến sân bay Tân Sơn Nhất"** | Intent `NAVIGATE` |
| 3 | Hệ thống | "Trời sắp mưa tại khu vực đó, bạn có muốn tiếp tục đặt xe không?" | Chỉ đọc khi `willRain=true` |
| 4 | Người dùng | **"Có"** | Intent `CONFIRM_YES` |
| 5 | Hệ thống | "Grab báo giá X đồng, dự kiến Y phút. Bạn xác nhận đặt không?" | Có báo giá từ partner-sim |
| 6 | Người dùng | **"Có"** | Xác nhận đặt xe |
| 7 | Hệ thống | **"Đơn hàng đã giao thành công. Bạn thấy thế nào? Nói 'tốt', 'bình thường', hoặc 'kém'."** | Trigger khi `DELIVERED` |
| 8 | Người dùng | **"Tốt"** | Lưu đánh giá, cộng AccessPoints |

### Điều kiện pass

- [ ] STT/NLU nhận đúng câu tiếng Việt.
- [ ] Không còn câu hướng dẫn tiếng Anh trong UI/TTS.
- [ ] Cảnh báo mưa chỉ xuất hiện khi có rủi ro.
- [ ] Người dùng phải xác nhận bằng giọng nói trước khi đặt tiếp.
- [ ] `driverNotification` hiển thị hoặc có thể quay được trong video minh họa.
- [ ] Đánh giá "Tốt" lưu thành công và cộng điểm cho tài xế.

## Tình Huống 2: Đặt Món Phở, Chọn Quán Bằng Giọng Nói

### Mục tiêu

Chứng minh luồng đặt đồ ăn bằng tiếng Việt: tìm món, hỏi ngân sách, đọc danh sách quán có đánh giá, chọn quán bằng giọng nói, gửi thông báo cho nhà hàng khi người dùng cần hỗ trợ.

### Dữ liệu chuẩn bị

- Nền tảng: Grab hoặc partner-sim đồ ăn hiện có.
- Món dùng để minh họa: "phở".
- Quán seed có liên quan: "Phở Hà Nội" và các quán phở tương ứng trong seed.
- `accessibilityFlag=true` đã được set từ Tình huống 1, không hỏi lại.
- Mức giá dùng để minh họa nên dùng: "khoảng 50 nghìn" hoặc "dưới 70 nghìn", tùy dữ liệu seed thực tế.

### Luồng chạy

1. Người dùng bắt đầu trợ lý giọng nói.
2. Người dùng nói: "Đặt món phở".
3. Backend parse intent `ORDER_FOOD`, slot `food_query = "phở"`.
4. Nếu chưa có ngân sách, hệ thống hỏi: "Bạn muốn mức giá khoảng bao nhiêu để mình đề xuất quán phù hợp?"
5. Người dùng nói: "Khoảng 50 nghìn".
6. Backend lọc quán đang mở, lọc theo giá và sắp xếp theo điểm đánh giá.
7. Hệ thống đọc 3 lựa chọn: "Quán 1: Phở Hà Nội, đánh giá 4.5 sao. Quán 2: ..."
8. Người dùng nói: "Số 1" hoặc "Phở Hà Nội".
9. Backend tạo báo giá cho đơn đồ ăn.
10. Hệ thống hỏi xác nhận: "Quán báo giá X đồng, dự kiến Y phút. Bạn xác nhận đặt không?"
11. Người dùng nói: "Có".
12. Đơn chuyển trạng thái tới `DELIVERED`.
13. Hệ thống đọc câu đánh giá đã chuẩn hóa.
14. Người dùng nói: "Tốt".
15. Backend lưu đánh giá và cộng AccessPoints theo rule hiện có.

### Kịch bản đọc khi quay

| Bước | Ai nói | Câu chính xác | Kết quả mong đợi |
|---|---|---|---|
| 1 | Người dùng | **"Đặt món phở"** | Intent `ORDER_FOOD` |
| 2 | Hệ thống | "Bạn muốn mức giá khoảng bao nhiêu để mình đề xuất quán phù hợp?" | Chỉ hỏi khi thiếu giá |
| 3 | Người dùng | **"Khoảng 50 nghìn"** | Ghi nhận budget |
| 4 | Hệ thống | "Quán 1: Phở Hà Nội, đánh giá X sao. Quán 2: ..." | Đọc tên và điểm đánh giá |
| 5 | Người dùng | **"Số 1"** | Chọn quán đầu tiên |
| 6 | Hệ thống | "Quán báo giá X đồng, dự kiến Y phút. Bạn xác nhận đặt không?" | Có báo giá đồ ăn |
| 7 | Người dùng | **"Có"** | Xác nhận đặt món |
| 8 | Hệ thống | **"Đơn hàng đã giao thành công. Bạn thấy thế nào? Nói 'tốt', 'bình thường', hoặc 'kém'."** | Trigger khi `DELIVERED` |
| 9 | Người dùng | **"Tốt"** | Lưu đánh giá, cộng AccessPoints |

### Điều kiện pass

- [ ] STT/NLU nhận đúng câu tiếng Việt cho món ăn.
- [ ] Không cần thao tác switch bằng tay trong video.
- [ ] Hệ thống đọc tên quán và điểm đánh giá bằng tiếng Việt.
- [ ] Chọn quán bằng "Số 1" hoặc tên quán hoạt động.
- [ ] Thông báo cho nhà hàng có nội dung tiếng Việt: "Đơn hàng cho khách cần hỗ trợ đặc biệt. Vui lòng kiểm tra kỹ đơn và đóng gói cẩn thận."
- [ ] Đánh giá "Tốt" lưu thành công sau khi `DELIVERED`.

## Các Gap Cần Code/Verify

- [ ] Chuyển `accessibilityFlag` sang thiết lập bằng giọng nói và lưu ở `User`.
- [ ] Không hiển thị switch hỗ trợ tiếp cận trong video minh họa chỉ dùng giọng nói.
- [ ] `ConversationService` và `OrdersService` phải đọc flag từ user/order, không phụ thuộc tham số rời từng request.
- [ ] Hiển thị rõ `driverNotification` hoặc `restaurantNotification` để quay video minh họa.
- [ ] Tình huống đặt đồ ăn cần luồng hỏi ngân sách trước khi đề xuất nếu chưa có giá.
- [ ] Tình huống đặt đồ ăn cần đọc điểm đánh giá trong phản hồi giọng nói.
- [ ] Kiểm tra parser chỉ cần câu ngắn: "Có", "Không", "Số 1", "Tốt".
