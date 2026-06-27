import { PartnerCode } from '../../types';

export const PLATFORM_KEYWORDS: Record<string, string[]> = {
  GRAB: ['grab'],
  BE: ['be'],
  XANH_SM: ['xanh sm', 'xanh'],
  SHOPEE: ['shopee', 'shopee food'],
};

export const SUPPORTED_PLATFORMS: PartnerCode[] = [PartnerCode.GRAB];

export const FOOD_SERVICE_PATTERN =
  /food|eat|hungry|order food|order|đặt đồ ăn|dat do an|đồ ăn|do an|ăn|an|gợi ý|goi y|pho|phở|rice|cơm|com|noodle|chicken|gà|ga|gà rán|ga ran|burger|meal|lunch|dinner|breakfast|snack|kfc|com tam|broken rice/i;

export const RIDE_SERVICE_PATTERN =
  /ride|car|taxi|drive|take me|book a ride|go to|i need a car|transport|airport|destination|đặt xe|dat xe|đi xe|di xe|đi đến|di den|sân bay|san bay|đi đâu|di dau/i;

export const FOOD_KEYWORDS = [
  'food', 'eat', 'hungry', 'order food', 'order', 'pho', 'rice', 'noodle',
  'chicken', 'burger', 'meal', 'lunch', 'dinner', 'breakfast', 'snack', 'kfc',
];

export const RIDE_KEYWORDS = [
  'ride', 'car', 'taxi', 'drive', 'take me', 'book a ride', 'go to',
  'transport', 'airport', 'destination',
];

export const UNSUPPORTED_FOOD_KEYWORDS = [
  'pizza', 'sushi', 'sandwich', 'pasta', 'steak', 'salad', 'tacos', 'ramen',
];

export const YES_PATTERN =
  /^(yes|yeah|yep|yup|ok|okay|sure|confirm|correct|right|go ahead|do it|book it|order|absolutely|definitely|please|of course|grab|alright|có|co|đúng|dung|ừ|uh|ừm|um|oke|xác nhận|xac nhan|đặt đi|dat di|thanh toán|thanh toan)$/i;

export const NO_PATTERN =
  /^(no|nope|nah|cancel|stop|don't|back|return|never mind|not now|skip|go back|negative|không|khong|hủy|huy|quay lại|quay lai|thôi|thoi)$/i;

export const GLOBAL_PATTERNS: { pattern: RegExp; intent: string }[] = [
  { pattern: /(cancel|stop|quit|abort|hủy|huy|ngừng|ngung|thôi|thoi)/i, intent: 'GLOBAL_CANCEL' },
  { pattern: /(go back|back|return|previous|quay lại|quay lai|trở lại|tro lai)/i, intent: 'GLOBAL_BACK' },
  { pattern: /(repeat|say again|again|what did you say|come again|read again|đọc lại|doc lai|nói lại|noi lai|lặp lại|lap lai)/i, intent: 'GLOBAL_REPEAT' },
  { pattern: /(read options|list options|what are my options|choices|đọc lựa chọn|doc lua chon|có lựa chọn nào|co lua chon nao)/i, intent: 'GLOBAL_REPEAT_OPTIONS' },
  { pattern: /(more|more options|show more|thêm|them|lựa chọn khác|lua chon khac)/i, intent: 'GLOBAL_MORE_OPTIONS' },
  { pattern: /(help|what can i say|how does this work|instructions|trợ giúp|tro giup|giúp|giup)/i, intent: 'GLOBAL_HELP' },
  { pattern: /(my order|what's in my order|cart|what did i order|đơn của tôi|don cua toi|giỏ hàng|gio hang)/i, intent: 'GLOBAL_READ_ORDER' },
  { pattern: /(pause|hold on|wait|chờ|cho|đợi|doi)/i, intent: 'GLOBAL_PAUSE' },
  { pattern: /(resume|continue|go on|keep going|tiếp tục|tiep tuc)/i, intent: 'GLOBAL_RESUME' },
  { pattern: /(stop listening|mute|be quiet|ngừng nghe|ngung nghe|im lặng|im lang)/i, intent: 'GLOBAL_STOP' },
];

export const VALID_PLACES = [
  { id: 'place-tsn', name: 'Sân bay Tân Sơn Nhất', keywords: ['tan son nhat', 'tân sơn nhất', 'airport', 'the airport', 'san bay', 'sân bay', 'tsn', 'tansonnhat'] },
  { id: 'place-ben-xe-md', name: 'Bến xe Miền Đông', keywords: ['mien dong', 'miền đông', 'mien dong bus station', 'bus station', 'ben xe', 'bến xe', 'eastern bus'] },
  { id: 'place-ben-thanh', name: 'Chợ Bến Thành', keywords: ['ben thanh', 'bến thành', 'ben thanh market', 'cho ben thanh', 'chợ bến thành', 'central market', 'market'] },
  { id: 'place-bitexco', name: 'Bitexco Financial Tower', keywords: ['bitexco', 'bitexco tower', 'financial tower'] },
  { id: 'place-quan-1', name: 'Quận 1', keywords: ['district one', 'district 1', 'd1', 'quan 1', 'quận 1'] },
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
    keywords: ['pho', 'pho bo', 'beef pho', 'pho bo tai', 'rare beef', 'beef noodle'],
  },
  {
    restaurantId: 'r-pho-hn',
    restaurantName: 'Phở Hà Nội',
    dishName: 'Phở Bò Chín',
    priceVnd: 65000,
    distanceKm: 1.2,
    etaMin: 25,
    keywords: ['well done beef', 'pho bo chin', 'cooked beef pho'],
  },
  {
    restaurantId: 'r-pho-hn',
    restaurantName: 'Phở Hà Nội',
    dishName: 'Phở Gà',
    priceVnd: 55000,
    distanceKm: 1.2,
    etaMin: 25,
    keywords: ['chicken pho', 'pho ga', 'chicken noodle'],
  },
  {
    restaurantId: 'r-pho-hn',
    restaurantName: 'Phở Hà Nội',
    dishName: 'Phở Đặc Biệt',
    priceVnd: 85000,
    distanceKm: 1.2,
    etaMin: 25,
    keywords: ['special pho', 'pho dac biet', 'pho special'],
  },
  {
    restaurantId: 'r-com-tk',
    restaurantName: 'Cơm Tấm Thuận Kiều',
    dishName: 'Cơm Tấm Sườn',
    priceVnd: 55000,
    distanceKm: 0.8,
    etaMin: 20,
    keywords: ['broken rice', 'com tam', 'grilled pork rice', 'suon', 'pork chop rice'],
  },
  {
    restaurantId: 'r-com-tk',
    restaurantName: 'Cơm Tấm Thuận Kiều',
    dishName: 'Cơm Tấm Bì',
    priceVnd: 50000,
    distanceKm: 0.8,
    etaMin: 20,
    keywords: ['pork skin rice', 'com bi'],
  },
  {
    restaurantId: 'r-com-tk',
    restaurantName: 'Cơm Tấm Thuận Kiều',
    dishName: 'Cơm Tấm Sườn Bì Chả',
    priceVnd: 70000,
    distanceKm: 0.8,
    etaMin: 20,
    keywords: ['combo rice', 'sbc', 'full combo', 'pork combo'],
  },
  {
    restaurantId: 'r-com-tk',
    restaurantName: 'Cơm Tấm Thuận Kiều',
    dishName: 'Cơm Tấm Chả',
    priceVnd: 50000,
    distanceKm: 0.8,
    etaMin: 20,
    keywords: ['steamed pork rice', 'com cha', 'meatloaf rice'],
  },
  {
    restaurantId: 'r-com-tk',
    restaurantName: 'Cơm Tấm Thuận Kiều',
    dishName: 'Cơm Gà',
    priceVnd: 55000,
    distanceKm: 0.8,
    etaMin: 20,
    keywords: ['chicken rice', 'com ga'],
  },
  {
    restaurantId: 'r-kfc',
    restaurantName: 'KFC Bến Thành',
    dishName: 'Gà Rán Original 1 miếng',
    priceVnd: 45000,
    distanceKm: 1.5,
    etaMin: 30,
    keywords: ['fried chicken', 'kfc', 'kentucky', 'crispy chicken', 'chicken piece'],
  },
  {
    restaurantId: 'r-kfc',
    restaurantName: 'KFC Bến Thành',
    dishName: 'Gà Rán 2 miếng',
    priceVnd: 85000,
    distanceKm: 1.5,
    etaMin: 30,
    keywords: ['two piece chicken', '2 piece', 'double chicken'],
  },
  {
    restaurantId: 'r-kfc',
    restaurantName: 'KFC Bến Thành',
    dishName: 'Burger Gà Giòn',
    priceVnd: 55000,
    distanceKm: 1.5,
    etaMin: 30,
    keywords: ['chicken burger', 'crispy burger', 'burger'],
  },
  {
    restaurantId: 'r-kfc',
    restaurantName: 'KFC Bến Thành',
    dishName: 'Khoai Tây Chiên',
    priceVnd: 35000,
    distanceKm: 1.5,
    etaMin: 30,
    keywords: ['fries', 'french fries', 'potato', 'chips'],
  },
  {
    restaurantId: 'r-pho-hn',
    restaurantName: 'Phở Hà Nội',
    dishName: 'Trà đá',
    priceVnd: 10000,
    distanceKm: 1.2,
    etaMin: 25,
    keywords: ['iced tea', 'tea', 'tra da'],
  },
  {
    restaurantId: 'r-kfc',
    restaurantName: 'KFC Bến Thành',
    dishName: 'Pepsi',
    priceVnd: 20000,
    distanceKm: 1.5,
    etaMin: 30,
    keywords: ['soda', 'coke', 'pepsi', 'cola', 'soft drink'],
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
  { stars: 1, words: ['one star', '1 star', 'one', '1'] },
  { stars: 2, words: ['two stars', '2 stars', 'two', '2'] },
  { stars: 3, words: ['three stars', '3 stars', 'three', '3', 'okay', 'average'] },
  { stars: 4, words: ['four stars', '4 stars', 'four', '4', 'good'] },
  { stars: 5, words: ['five stars', '5 stars', 'five', '5', 'excellent', 'perfect', 'amazing', 'great'] },
];
