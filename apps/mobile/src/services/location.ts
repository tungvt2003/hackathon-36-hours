import * as Location from 'expo-location';

/**
 * Lấy vị trí GPS hiện tại của người dùng.
 * Nếu chưa được cấp quyền hoặc lỗi, tự động fallback về tọa độ TP.HCM (10.7769, 106.7009).
 */
export async function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Quyền truy cập vị trí bị từ chối, sử dụng tọa độ mặc định (TP.HCM).');
      return { lat: 10.7769, lng: 106.7009 };
    }
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  } catch (e) {
    console.warn('Không lấy được vị trí GPS, sử dụng tọa độ mặc định.', e);
    return { lat: 10.7769, lng: 106.7009 };
  }
}
