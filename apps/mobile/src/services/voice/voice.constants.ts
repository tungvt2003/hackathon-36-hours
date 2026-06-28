import { PartnerCode } from '../../types';

export const PLATFORM_KEYWORDS: Record<string, string[]> = {
  GRAB: ['grab'],
  BE: ['be'],
  XANH_SM: ['xanh sm', 'xanh'],
  SHOPEE: ['shopee', 'shopee food'],
};

export const SUPPORTED_PLATFORMS: PartnerCode[] = [PartnerCode.GRAB];

export const FOOD_SERVICE_PATTERN =
  /đồ\s*ăn|do\s*an|ăn|an|đói|doi|đặt\s*(?:món|đồ\s*ăn)|dat\s*(?:mon|do\s*an)|gọi\s*(?:món|đồ\s*ăn)|goi\s*(?:mon|do\s*an)|phở|pho|cơm|com|bún|bun|mì|mi|gà|ga|bánh|banh|burger|kfc/i;

export const RIDE_SERVICE_PATTERN =
  /đặt\s*xe|dat\s*xe|gọi\s*xe|goi\s*xe|đi\s*xe|di\s*xe|taxi|xe\s*ôm|xe\s*om|đến|den|tới|toi|sân\s*bay|san\s*bay|đi\s*đâu|di\s*dau/i;

export const FOOD_KEYWORDS = [
  'đồ ăn', 'do an', 'ăn', 'an', 'đói', 'doi', 'đặt món', 'dat mon',
  'phở', 'pho', 'cơm', 'com', 'bún', 'bun', 'gà', 'ga', 'burger', 'kfc',
];

export const RIDE_KEYWORDS = [
  'đặt xe', 'dat xe', 'gọi xe', 'goi xe', 'đi xe', 'di xe', 'taxi',
  'xe ôm', 'xe om', 'đến', 'den', 'tới', 'toi', 'sân bay', 'san bay',
];

export const UNSUPPORTED_FOOD_KEYWORDS = [
  'pizza', 'sushi', 'sandwich', 'pasta', 'steak', 'salad', 'tacos', 'ramen',
];

export const YES_PATTERN =
  /^(có|co|vâng|vang|ừ|uh|ừm|um|ok|okay|được|duoc|đồng ý|dong y|xác nhận|xac nhan|đặt|dat|tiếp tục|tiep tuc|đúng rồi|dung roi|grab)$/i;

export const NO_PATTERN =
  /^(không|khong|hủy|huy|dừng|dung|thôi|thoi|bỏ qua|bo qua|quay lại|quay lai|về lại|ve lai|chưa|chua)$/i;

export const GLOBAL_PATTERNS: { pattern: RegExp; intent: string }[] = [
  { pattern: /(hủy|huy|dừng|dung|thoát|thoat|bỏ qua|bo qua)/i, intent: 'GLOBAL_CANCEL' },
  { pattern: /(quay lại|quay lai|trở lại|tro lai|về trước|ve truoc)/i, intent: 'GLOBAL_BACK' },
  { pattern: /(nhắc lại|nhac lai|nói lại|noi lai|đọc lại|doc lai|lặp lại|lap lai)/i, intent: 'GLOBAL_REPEAT' },
  { pattern: /(đọc lựa chọn|doc lua chon|danh sách lựa chọn|danh sach lua chon|có lựa chọn nào|co lua chon nao)/i, intent: 'GLOBAL_REPEAT_OPTIONS' },
  { pattern: /(thêm lựa chọn|them lua chon|xem thêm|xem them)/i, intent: 'GLOBAL_MORE_OPTIONS' },
  { pattern: /(trợ giúp|tro giup|hướng dẫn|huong dan|tôi nói gì|toi noi gi)/i, intent: 'GLOBAL_HELP' },
  { pattern: /(đơn của tôi|don cua toi|giỏ hàng|gio hang|tôi đã đặt gì|toi da dat gi)/i, intent: 'GLOBAL_READ_ORDER' },
  { pattern: /(tạm dừng|tam dung|chờ chút|cho chut|đợi đã|doi da)/i, intent: 'GLOBAL_PAUSE' },
  { pattern: /(tiếp tục|tiep tuc|nói tiếp|noi tiep)/i, intent: 'GLOBAL_RESUME' },
  { pattern: /(ngừng nghe|ngung nghe|tắt mic|tat mic|im lặng|im lang)/i, intent: 'GLOBAL_STOP' },
];

export const VALID_PLACES = [
  { id: 'place-tsn', name: 'Sân bay Tân Sơn Nhất', keywords: ['tân sơn nhất', 'tan son nhat', 'sân bay', 'san bay', 'tsn'] },
  { id: 'place-ben-xe-md', name: 'Bến xe Miền Đông', keywords: ['miền đông', 'mien dong', 'bến xe', 'ben xe'] },
  { id: 'place-ben-thanh', name: 'Chợ Bến Thành', keywords: ['bến thành', 'ben thanh', 'chợ', 'cho'] },
  { id: 'place-bitexco', name: 'Bitexco Financial Tower', keywords: ['bitexco', 'bitexco tower', 'financial tower'] },
  { id: 'place-quan-1', name: 'Quận 1', keywords: ['quận 1', 'quan 1', 'q1'] },
];

export interface FoodMenuMatch {
  restaurantId: string;
  restaurantName: string;
  dishName: string;
  priceVnd: number;
  distanceKm: number;
  etaMin: number;
  keywords: string[];
}

export const FOOD_MENU_CATALOG: FoodMenuMatch[] = [
  {
    restaurantId: 'r-pho-hn',
    restaurantName: 'Phở Hà Nội',
    dishName: 'Phở Bò Tái',
    priceVnd: 65000,
    distanceKm: 1.2,
    etaMin: 25,
    keywords: ['phở', 'pho', 'phở bò', 'pho bo', 'phở bò tái', 'pho bo tai'],
  },
  {
    restaurantId: 'r-pho-hn',
    restaurantName: 'Phở Hà Nội',
    dishName: 'Phở Bò Chín',
    priceVnd: 65000,
    distanceKm: 1.2,
    etaMin: 25,
    keywords: ['phở bò chín', 'pho bo chin', 'bò chín', 'bo chin'],
  },
  {
    restaurantId: 'r-pho-hn',
    restaurantName: 'Phở Hà Nội',
    dishName: 'Phở Gà',
    priceVnd: 55000,
    distanceKm: 1.2,
    etaMin: 25,
    keywords: ['phở gà', 'pho ga', 'gà', 'ga'],
  },
  {
    restaurantId: 'r-pho-hn',
    restaurantName: 'Phở Hà Nội',
    dishName: 'Phở Đặc Biệt',
    priceVnd: 85000,
    distanceKm: 1.2,
    etaMin: 25,
    keywords: ['phở đặc biệt', 'pho dac biet', 'đặc biệt', 'dac biet'],
  },
  {
    restaurantId: 'r-com-tk',
    restaurantName: 'Cơm Tấm Thuận Kiều',
    dishName: 'Cơm Tấm Sườn',
    priceVnd: 55000,
    distanceKm: 0.8,
    etaMin: 20,
    keywords: ['cơm tấm', 'com tam', 'cơm sườn', 'com suon', 'sườn', 'suon'],
  },
  {
    restaurantId: 'r-com-tk',
    restaurantName: 'Cơm Tấm Thuận Kiều',
    dishName: 'Cơm Tấm Bì',
    priceVnd: 50000,
    distanceKm: 0.8,
    etaMin: 20,
    keywords: ['cơm bì', 'com bi', 'bì', 'bi'],
  },
  {
    restaurantId: 'r-com-tk',
    restaurantName: 'Cơm Tấm Thuận Kiều',
    dishName: 'Cơm Tấm Sườn Bì Chả',
    priceVnd: 70000,
    distanceKm: 0.8,
    etaMin: 20,
    keywords: ['sườn bì chả', 'suon bi cha', 'cơm tấm đặc biệt', 'com tam dac biet'],
  },
  {
    restaurantId: 'r-com-tk',
    restaurantName: 'Cơm Tấm Thuận Kiều',
    dishName: 'Cơm Tấm Chả',
    priceVnd: 50000,
    distanceKm: 0.8,
    etaMin: 20,
    keywords: ['cơm chả', 'com cha', 'chả', 'cha'],
  },
  {
    restaurantId: 'r-com-tk',
    restaurantName: 'Cơm Tấm Thuận Kiều',
    dishName: 'Cơm Gà',
    priceVnd: 55000,
    distanceKm: 0.8,
    etaMin: 20,
    keywords: ['cơm gà', 'com ga', 'gà', 'ga'],
  },
  {
    restaurantId: 'r-kfc',
    restaurantName: 'KFC Bến Thành',
    dishName: 'Gà Rán Original 1 miếng',
    priceVnd: 45000,
    distanceKm: 1.5,
    etaMin: 30,
    keywords: ['gà rán', 'ga ran', 'kfc', 'gà giòn', 'ga gion'],
  },
  {
    restaurantId: 'r-kfc',
    restaurantName: 'KFC Bến Thành',
    dishName: 'Gà Rán 2 miếng',
    priceVnd: 85000,
    distanceKm: 1.5,
    etaMin: 30,
    keywords: ['gà rán 2 miếng', 'ga ran 2 mieng', 'hai miếng gà', 'hai mieng ga'],
  },
  {
    restaurantId: 'r-kfc',
    restaurantName: 'KFC Bến Thành',
    dishName: 'Burger Gà Giòn',
    priceVnd: 55000,
    distanceKm: 1.5,
    etaMin: 30,
    keywords: ['burger gà', 'burger ga', 'burger', 'gà giòn', 'ga gion'],
  },
  {
    restaurantId: 'r-kfc',
    restaurantName: 'KFC Bến Thành',
    dishName: 'Khoai Tây Chiên',
    priceVnd: 35000,
    distanceKm: 1.5,
    etaMin: 30,
    keywords: ['khoai tây chiên', 'khoai tay chien', 'khoai chiên', 'khoai chien'],
  },
  {
    restaurantId: 'r-pho-hn',
    restaurantName: 'Phở Hà Nội',
    dishName: 'Trà đá',
    priceVnd: 10000,
    distanceKm: 1.2,
    etaMin: 25,
    keywords: ['trà đá', 'tra da', 'trà', 'tra'],
  },
  {
    restaurantId: 'r-kfc',
    restaurantName: 'KFC Bến Thành',
    dishName: 'Pepsi',
    priceVnd: 20000,
    distanceKm: 1.5,
    etaMin: 30,
    keywords: ['pepsi', 'nước ngọt', 'nuoc ngot', 'cola'],
  },
];

export const PARTNER_VOICE_KEYWORDS: { code: PartnerCode; words: string[] }[] = [
  { code: PartnerCode.GRAB, words: PLATFORM_KEYWORDS.GRAB },
  { code: PartnerCode.BE, words: PLATFORM_KEYWORDS.BE },
  { code: PartnerCode.XANH_SM, words: PLATFORM_KEYWORDS.XANH_SM },
  { code: PartnerCode.SHOPEE, words: PLATFORM_KEYWORDS.SHOPEE },
];

export const PARTNER_LABEL: Record<PartnerCode, string> = {
  [PartnerCode.GRAB]: 'Grab',
  [PartnerCode.BE]: 'Be',
  [PartnerCode.XANH_SM]: 'Xanh SM',
  [PartnerCode.SHOPEE]: 'Shopee Food',
};

export const STAR_KEYWORDS: { stars: number; words: string[] }[] = [
  { stars: 1, words: ['một sao', 'mot sao', '1 sao', 'một', 'mot', '1', 'kém', 'kem'] },
  { stars: 2, words: ['hai sao', '2 sao', 'hai', '2'] },
  { stars: 3, words: ['ba sao', '3 sao', 'ba', '3', 'bình thường', 'binh thuong', 'ổn', 'on'] },
  { stars: 4, words: ['bốn sao', 'bon sao', '4 sao', 'bốn', 'bon', '4', 'tốt', 'tot'] },
  { stars: 5, words: ['năm sao', 'nam sao', '5 sao', 'năm', 'nam', '5', 'rất tốt', 'rat tot', 'tuyệt vời', 'tuyet voi'] },
];
