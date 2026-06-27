// Cờ debug toàn app — gom 1 chỗ để dễ thấy, dễ tắt trước khi build thật.

// true: ép luồng voice dùng modal nhập text thay mic (debug trên simulator không hỗ trợ STT).
// Đặt lại false khi build cho Android thiết bị thật để dùng voice flow đầy đủ.
export const DEV_FORCE_TEXT_INPUT = true;
