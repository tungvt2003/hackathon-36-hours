// apps/mobile/src/screens/S05_Dashboard/dashboard.service.ts
import { PartnerCode } from '../../types';

export const PLATFORM_SELECT_GREETING =
  'Xin chào! Trước tiên, bạn muốn dùng nền tảng nào: Grab, Be, Xanh SM, hoặc ShopeeFood?';
export const HOME_AI_GREETING = 'Hôm nay bạn cần gì? Đặt đồ ăn, gọi xe, hay xem lịch sử đơn hàng?';

export const PARTNER_LABEL: Record<PartnerCode, string> = {
  [PartnerCode.GRAB]: 'Grab',
  [PartnerCode.BE]: 'Be',
  [PartnerCode.XANH_SM]: 'Xanh SM',
  [PartnerCode.SHOPEE]: 'ShopeeFood',
};

const PARTNER_KEYWORDS: { code: PartnerCode; words: string[] }[] = [
  { code: PartnerCode.BE, words: ['be'] },
  { code: PartnerCode.GRAB, words: ['grab'] },
  { code: PartnerCode.XANH_SM, words: ['xanh sm', 'xanh'] },
  { code: PartnerCode.SHOPEE, words: ['shopee', 'shopee food'] },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd');
}

export function matchPlatformFromVoice(rawText: string): PartnerCode | null {
  const text = normalize(rawText);
  for (const { code, words } of PARTNER_KEYWORDS) {
    if (words.some((w) => text.includes(w))) return code;
  }
  return null;
}
