# **Suara — Master Sprint Plan (Grab Hackathon 36h)**

**Vai trò:** Principal Architect / Tech Lead view. **Nguồn phân tích:** `codebase.xml` (backend NestJS+Prisma, frontend Expo RN đã scaffold `HomeScreen`) \+ 16 file mockup `apps/mobile/docs/S2.MD → S17.MD` \+ `ARCHITECTURE_BLUEPRINT.md`.

## **0\. Sự thật quan trọng phát hiện được trước khi chia sprint**

1. **Backend đã chạy được lõi voice-order**: `POST /orders/voice` (STT→NLU→Places/Weather→Partners→quotes) và `POST /orders/confirm` đã có, có Prisma (`Order`, `OrderEvent`, `Place`, `PartnerRate`). Đừng viết lại — **tái sử dụng**.  
2. **Frontend chưa có Navigation.** `App.tsx` hiện chỉ render thẳng `<HomeScreen />`, `package.json` mobile **chưa có** `@react-navigation/*`. → Đây là task chặn đường (blocker) phải làm **đầu tiên**, trước cả màn hình nào khác.  
3. **Không có NativeWind/Tailwind** trong `apps/mobile` — pattern thật của dự án là `StyleSheet.create` (xem `Home/index.tsx`). Toàn bộ 16 file mockup `S*.MD` là HTML/Tailwind demo (Stitch/Figma export) — **chỉ dùng để lấy layout & copy, không copy code**.  
4. **Bottom nav bị vẽ KHÔNG đồng nhất** giữa các mockup:  
   * S5: `Home / Orders / History / Account`  
   * S6, S7, S8, S12, S17: `Voice / Modes / Library / Settings`  
   * S13: `Home / Activity / Messages / Account` → Quyết định kiến trúc: **chuẩn hoá về DUY NHẤT 1 bottom nav** 4 tab: `Trang chủ / Hoạt động / Lịch sử / Tài khoản`. Mọi prompt ở File 2 đều ép theo chuẩn này, bỏ qua nav vẽ riêng lẻ trong từng mockup.  
5. **Backend còn thiếu 5 nhóm API** mà mockup yêu cầu — phải bổ sung dần theo sprint (chi tiết bên dưới):  
   * Tìm **nhiều** quán ăn ứng viên (S-11) — hiện `PlacesProvider.getStatus()` chỉ trả 1 địa điểm.  
   * Theo dõi đơn theo thời gian thực / polling (S-12, S-13).  
   * Huỷ đơn mô phỏng (S-14).  
   * Đánh giá đơn (S-16).  
   * Lịch sử đơn hàng theo user (S-17).  
   * Lưu accessibility preference của user (S-04).  
6. **Bản đồ 17 màn hình:**

| Mã | Tên màn hình (đã chuẩn hoá tiếng Việt) | Vai trò trong flow | Độ ưu tiên demo |
| ----- | ----- | ----- | ----- |
| S-01 | Home (bản nháp gõ tay) — **đã có sẵn, dùng làm reference kiến trúc** | Tham chiếu pattern | Reference |
| S-05 | Trang chủ Dashboard | Entry point sau onboarding | 🔴 Lõi |
| S-06 | Đang nghe (Listening) | Voice input | 🔴 Lõi |
| S-07 | Đang xử lý (Processing) | Loading state | 🔴 Lõi |
| S-08 | AI trả lời / Xác nhận giọng nói | Voice output | 🔴 Lõi |
| S-09 | Lỗi kết nối (Voice Error) | Error handling | 🔴 Lõi |
| S-11 | Chọn quán ăn (Restaurant Selection) | Disambiguation | 🟠 Lõi mở rộng |
| S-10 | Xác nhận đơn (Order Confirmation) | Checkout | 🔴 Lõi |
| S-12 | Theo dõi đơn — GrabFood | Tracking | 🟠 Lõi mở rộng |
| S-13 | Theo dõi đơn — GrabCar/Bike | Tracking | 🟠 Lõi mở rộng |
| S-14 | Cảnh báo huỷ đơn | Exception flow | 🟡 Phụ |
| S-15 | Giao hàng thành công | Completion | 🟡 Phụ |
| S-16 | Đánh giá (Rating) | Engagement | 🟡 Phụ |
| S-02 | Onboarding | First-run | 🟢 Râu ria |
| S-03 | Kết nối tài khoản Grab | Auth mock | 🟢 Râu ria |
| S-04 | Thiết lập hồ sơ Accessibility | Settings | 🟢 Râu ria |
| S-17 | Lịch sử đơn hàng | Retention | 🟢 Râu ria |

**Chiến thuật:** Core voice loop (Home→Listening→Processing→AI trả lời→Confirm) lên đầu vì đây là "WOW moment" giám khảo cần thấy. Tracking đẩy giữa vì cho thấy tích hợp đối tác thật. Onboarding/Account/History đẩy cuối — nếu hết giờ, **mock bằng nút "Skip" thẳng vào Dashboard**, app vẫn demo được full flow.

---

## **Sprint 0 — Foundation & Design System (≈3h)**

**Mục tiêu lõi:** Dựng "đường ray" để mọi sprint sau đi vào guồng ngay, không ai phải tự quyết kiến trúc giữa đường.

### **Frontend Tasks**

* Cài `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`. Tạo `src/navigation/RootNavigator.tsx` (Native Stack) \+ `src/navigation/types.ts` (typed `RootStackParamList` cho toàn bộ 16 route S2–S17).  
* Tạo `src/theme/theme.ts`: màu Grab chuẩn `primary: '#00B14F'`, `primaryDark: '#00913E'`, `error: '#E11900'`, neutral scale, `spacing` scale, `fontSize` scale (tối thiểu 16, heading 24–32), `touchTarget: 48`.  
* Tạo `src/components/` (shared, dùng chung mọi page):  
  * `MicButton/index.tsx` (+ `useMicButton.hook.ts`) — nút mic tròn lớn (≥64px), 3 state: idle / listening (pulse animation) / disabled.  
  * `AudioVisualizer/index.tsx` — thanh sóng âm animate khi AI nói hoặc user nói.  
  * `BottomNavBar/index.tsx` — 4 tab chuẩn hoá: `Trang chủ / Hoạt động / Lịch sử / Tài khoản`.  
  * `ScreenHeader/index.tsx` — back button \+ title, accessibility chuẩn.  
  * `PrimaryButton`, `SecondaryButton` — `StyleSheet`, min-height 48, font-size 18+.  
* Mở rộng `src/types.ts` (mobile) thêm các type sẽ cần ở Sprint 2–5 (đặt placeholder ngay, tránh phải sửa nhiều file sau): `RestaurantMatch`, `OrderTrackingStatus`, `OrderSummary`, `RateOrderRequest`, `AccessibilityProfile`.  
* Mở rộng `src/services/api.ts` với các method stub (throw "not implemented") cho các API sẽ thêm dần — giúp các hook ở sprint sau code trước, nối API sau (mock-first).

### **Backend Tasks (API Contract)**

* Không có API mới. Backend dùng thời gian này để: chạy `prisma:setup` (migrate \+ seed), xác nhận `POST /orders/voice` và `POST /orders/confirm` trả đúng theo `types.ts`, export OpenAPI (`npm run gen:openapi`) để FE chạy `gen:types` đồng bộ type.  
* Backend bắt đầu thiết kế schema mở rộng cho `Order.status` (sẽ cần thêm `PICKED_UP | DELIVERING | ARRIVING | DELIVERED` cho Sprint 3\) — chỉ thiết kế, chưa migrate vội để tránh đụng Sprint 1\.

### **Definition of Done (Output)**

App chạy được, có khung Navigation rỗng (stack chứa tất cả 16 route, mỗi route render placeholder `<Text>S-xx</Text>`), bấm chuyển qua lại được giữa các màn không crash. Design tokens \+ 5 shared component build xong, có thể `import` vào page bất kỳ.

---

## **Sprint 1 — Core Voice Loop (Trái tim của Demo) (≈6h)**

**Mục tiêu lõi:** Người dùng mở app → bấm mic → nói câu lệnh → AI xử lý → AI đọc kết quả bằng giọng nói. Đây là phần giám khảo sẽ nhớ nhất.

### **Frontend Tasks**

* Màn hình: **S-05** (Trang chủ Dashboard), **S-06** (Đang nghe), **S-07** (Đang xử lý), **S-08** (AI trả lời), **S-09** (Lỗi kết nối).  
* Mỗi màn 1 page-package: `src/screens/S05_Dashboard/{index.tsx, useDashboard.hook.ts, dashboard.service.ts}` (tương tự pattern `Home` đã có).  
* `useListening.hook.ts` (S-06) chịu trách nhiệm: bật mic (mock bằng `TextInput` ẩn dưới banner "Đang nghe" tạm thời nếu STT thật chưa kịp, comment `// TODO: thay bằng expo-av khi có audio thật`), gọi `homeService.submitVoiceOrder`.  
* Trạng thái Processing (S-07) chỉ là UI loading có animation, không gọi API riêng — nó là state hiển thị trong lúc `useListening` đang `await`.  
* S-08 dùng `AudioVisualizer` \+ đọc to bằng `expo-speech` (`Speech.speak(responseText, { language: 'vi-VN' })`) đồng thời `AccessibilityInfo.announceForAccessibility`.  
* S-09 bind vào `catch` của mọi service call (interceptor lỗi mạng dùng chung, không viết riêng từng màn).

### **Backend Tasks (API Contract)**

Tái sử dụng 100% API đã có — không cần code backend mới ở sprint này:

* `POST /orders/voice` — body `{ userId?, transcript?, audioBase64? }` → `VoiceOrderResponse { orderId, transcript, intent, enrichment, quotes, responseText }`.  
* `GET /health` — FE dùng để hiện banner "Mất kết nối server" ở S-09 khi app mở lại từ background.

### **Definition of Done (Output)**

Flow thật chạy end-to-end: Dashboard → bấm mic → gõ/nói "đặt phở từ nhà đến..." → Processing → AI đọc to danh sách quote đối tác (Grab/Be/Xanh SM) bằng giọng nói \+ hiện trên màn S-08. Lỗi mạng → rơi đúng vào S-09 có nút "Thử lại".

---

## **Sprint 2 — Disambiguation & Checkout (≈5h)**

**Mục tiêu lõi:** Khi AI tìm thấy nhiều lựa chọn (nhiều quán phở), người dùng chọn 1, xem lại đơn, xác nhận — số tiền và đối tác phải khớp 100% với dữ liệu BE trả.

### **Frontend Tasks**

* Màn hình: **S-11** (Chọn quán ăn), **S-10** (Xác nhận đơn).  
* `S11_RestaurantSelection`: nhận `intent` từ S-08 qua navigation params, hiển thị tối đa 3 card (tên, rating, khoảng cách, giá từ), hỗ trợ chọn bằng giọng nói ("Chọn 1/2/3") **và** bằng tap (đảm bảo Motor Impairment mode vẫn dùng được).  
* `S10_OrderConfirmation`: render item, địa chỉ giao, phương thức thanh toán (`GrabPay Wallet` — hard-code label, chưa cần tích hợp ví thật), tổng tiền tính từ `PartnerQuote` đã chọn. Nút "Đặt hàng" gọi `confirmOrder`.

### **Backend Tasks (API Contract) — cần bổ sung mới**

* `GET /places/search?q=<keyword>&limit=3` → `RestaurantMatch[] { placeId, name, rating, distanceKm, etaMinutes, priceFrom, isOpen }`. Triển khai bằng cách mở rộng `Place` model thêm cột `rating Float`, `priceFrom Int`, và viết hàm match theo `keywords` (đơn giản: `LIKE` \+ sort theo rating). Không cần ML, hackathon-grade là đủ.  
* `POST /orders/confirm` — **đã có**, tái sử dụng nguyên (`{ orderId, partner }` → `ConfirmOrderResponse`).

### **Definition of Done (Output)**

Từ câu nói "tìm quán phở gần đây", app hiện đúng 3 quán (dữ liệu thật từ DB, không hard-code FE), chọn 1 quán → ra màn xác nhận đúng giá → bấm đặt hàng → `Order.status = CONFIRMED` trong DB.

---

## **Sprint 3 — Live Tracking (Food \+ Ride) (≈6h)**

**Mục tiêu lõi:** Sau khi đặt, người dùng thấy đơn đang di chuyển thật (mô phỏng), tăng độ tin cậy "production-ready" trước giám khảo.

### **Frontend Tasks**

* Màn hình: **S-12** (Theo dõi GrabFood), **S-13** (Theo dõi GrabCar/Bike).  
* Cả 2 dùng chung 1 hook pattern `useOrderTracking.hook.ts` (khác nhau ở UI: S-12 hiện step Đã nhận/Đang giao/Giao xong; S-13 hiện step Đã ghép xe/Tài xế đến/Đang đi \+ mã xác nhận 4 ký tự).  
* Polling: `setInterval` gọi `GET /orders/:id/tracking` mỗi 5s, dừng khi `status` là `DELIVERED` hoặc `CANCELLED` (chuyển sang S-15 hoặc S-14 tương ứng qua `navigation.replace`).  
* Đọc to thay đổi trạng thái quan trọng bằng `AccessibilityInfo.announceForAccessibility` (không đọc lại mỗi 5s, chỉ đọc khi `status` đổi).

### **Backend Tasks (API Contract) — cần bổ sung mới**

* Mở rộng `OrderStatus` enum: thêm `PICKED_UP`, `DELIVERING`, `ARRIVING`, `DELIVERED` (food) — dùng chung field cho ride với label khác ở FE.  
* `GET /orders/:id/tracking` → `{ orderId, status, etaMinutes, driver: { name, rating, vehicle, plate }, confirmationCode? }`. Triển khai nhanh: state machine tính theo `Date.now() - order.createdAt`, KHÔNG cần cron job thật — mỗi lần gọi tự tính lại stage dựa trên mốc thời gian (deterministic, demo-safe, không cần worker).  
* `confirmationCode` sinh 1 lần khi `confirmOrder` được gọi (4 ký tự, lưu vào `Order` hoặc `OrderEvent`).

### **Definition of Done (Output)**

Sau khi xác nhận đơn ở Sprint 2, app tự động chuyển sang màn tracking và **status tự tiến triển theo thời gian thực** (không cần can thiệp tay) cho tới khi giao xong.

---

## **Sprint 4 — Exceptions & Post-Order Engagement (≈5h)**

**Mục tiêu lõi:** Phủ các nhánh phụ khiến app trông "đầy đặn": huỷ đơn, hoàn tất, đánh giá.

### **Frontend Tasks**

* Màn hình: **S-14** (Cảnh báo huỷ đơn), **S-15** (Giao hàng thành công), **S-16** (Đánh giá).  
* S-14: nhận lý do huỷ \+ thông tin hoàn tiền từ BE, có nút "Tìm quán khác" (quay lại S-11 với cùng `intent`) và "Về trang chủ".  
* S-15: hiện chi tiết đơn đã thanh toán \+ CTA "Đánh giá ngay" → S-16.  
* S-16: chọn số sao (1–5, tap hoặc nói "Năm sao") \+ chip lý do (Giao nhanh / Tài xế thân thiện / Đồ ăn ngon / Đóng gói cẩn thận) — chip dùng `multi-select`, không bắt buộc.

### **Backend Tasks (API Contract) — cần bổ sung mới**

* `POST /orders/:id/cancel` → mô phỏng huỷ đơn (random hoặc trigger bằng giá trị test cố định trong demo script), trả `{ reason, refund: { amount, etaDays } }`. Cập nhật `Order.status = CANCELLED`.  
* `POST /orders/:id/rate` body `{ stars: number, tags?: string[], comment?: string }` → `{ success: true }`. Tạo bảng `OrderRating` (cuid id, orderId, stars, tags Json, comment, createdAt) qua Prisma migration mới.

### **Definition of Done (Output)**

Có thể demo cả 2 nhánh: (a) đơn giao thành công → đánh giá 5 sao lưu vào DB; (b) đơn bị huỷ → thấy lý do \+ hoàn tiền → quay lại chọn quán khác mà không mất context giọng nói ban đầu.

---

## **Sprint 5 — Account & History (Vùng đệm rủi ro — làm cuối cùng) (≈6h)**

**Mục tiêu lõi:** Hoàn thiện trải nghiệm first-run và retention. Đây là nhóm **được phép cắt bớt nếu cháy giờ** — luôn có "Skip" để không chặn demo chính.

### **Frontend Tasks**

* Màn hình: **S-02** (Onboarding 3 slide), **S-03** (Kết nối Grab — mock OAuth), **S-04** (Thiết lập Accessibility), **S-17** (Lịch sử đơn hàng).  
* S-02/S-03 đều có nút "Skip"/"Skip, try first" đi thẳng vào S-05 — đảm bảo app vẫn demo được nếu 2 màn này chưa code kịp.  
* S-04: lưu lựa chọn (`Visual Impairment` / `Motor Impairment` / `Hands-free`) \+ tốc độ AI nói vào `AccessibilityProfile`, áp dụng ngay vào `theme.ts` runtime (font size scale lên, mic to hơn) thông qua 1 Zustand store toàn cục `useAccessibilityStore`.  
* S-17: list đơn \+ search \+ nút "Đặt lại" (gọi lại `POST /orders/voice` với transcript được tái dựng từ đơn cũ, hoặc gọi thẳng `confirmOrder` nếu giữ nguyên y hệt).

### **Backend Tasks (API Contract) — cần bổ sung mới**

* `POST /users/profile` body `{ userId, accessibilityModes: string[], aiSpeed: 'SLOW'|'NORMAL'|'FAST' }` → lưu vào `User` (mở rộng model thêm cột `accessibilityModes String[]`, `aiSpeed String?`).  
* `POST /auth/connect-grab` — **mock hoàn toàn** (không OAuth thật trong 36h), trả `{ connected: true, mockToken: 'demo-token' }`, ghi rõ comment `// TODO post-hackathon: OAuth 2.0 thật`.  
* `GET /orders?userId=<id>&limit=20` → `OrderSummary[] { orderId, restaurant/destination, totalPrice, status, createdAt }`.

### **Definition of Done (Output)**

First-run flow đầy đủ từ Onboarding → Connect Account (mock) → Setup Accessibility → Dashboard. Lịch sử hiện đúng đơn đã tạo ở các sprint trước, "Đặt lại" hoạt động.

---

## **Sprint 6 — Hardening, Accessibility Audit & Demo Prep (≈4–5h)**

**Mục tiêu lõi:** Không phải code feature mới — là làm cho cái đã có **không sập trên sân khấu**.

### **Frontend Tasks**

* Audit toàn bộ 17 màn: mọi `TouchableOpacity`/`Pressable` có `accessibilityLabel` \+ `accessibilityRole` \+ `accessibilityHint`; mọi touch target ≥ 48px; mọi text quan trọng có `accessible` \+ được đọc qua `AccessibilityInfo.announceForAccessibility` khi đổi state.  
* Test bằng VoiceOver (iOS)/TalkBack (Android) thật trên ít nhất 3 màn lõi (S-05, S-06, S-08).  
* Bọc toàn app bằng 1 `ErrorBoundary` \+ global network-error toast, tránh crash trắng màn hình giữa demo.  
* Quay **video demo backup** (phòng khi WiFi hội trường chết).

### **Backend Tasks**

* Deploy backend lên Railway/Render, set `DATABASE_URL` production, chạy `prisma:setup` trên môi trường thật.  
* Kiểm tra CORS cho domain Expo dev tunnel / app build.  
* Seed dữ liệu demo "đẹp" (tên quán, giá, rating thật-giả hợp lý) thay seed test ngẫu nhiên.

### **Definition of Done (Output)**

App chạy ổn định trên thiết bị thật, có kết nối backend production, đã test bằng screen reader thật, có video backup. **Sẵn sàng lên sân khấu.**

---

## **Phương án cắt giảm khi cháy giờ (Risk Register)**

| Nếu còn ít hơn... | Cắt ngay |
| ----- | ----- |
| 10h | Sprint 5 toàn bộ (Onboarding/Account/History) — dùng `App.tsx` trỏ thẳng vào Dashboard |
| 6h | S-14, S-16 (giữ S-15 vì là "happy ending" cho demo) |
| 3h | S-13 (giữ S-12 vì food-order là use-case chính của transcript demo) |

## **Checklist trước khi lên sân khấu**

* \[ \] Mic thật hoạt động (không chỉ TextInput mock) trên thiết bị demo  
* \[ \] Backend production tỉnh táo (ping `/health` trước giờ thi)  
* \[ \] Ít nhất 1 câu lệnh giọng nói "chắc thắng" đã test 5 lần không lỗi  
* \[ \] Video backup đã quay, mở được offline

