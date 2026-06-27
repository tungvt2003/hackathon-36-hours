import type { VoucherEntry } from "../types.ts";

interface VoucherFixture {
  code: string;
  label: string;
  type: "fixed" | "percent";
  value: number;
  cap?: number;
  min_subtotal: number;
}

const VOUCHERS: VoucherFixture[] = [
  {
    code: "SALE20",
    label: "giảm 20 nghìn cho đơn từ 80 nghìn",
    type: "fixed",
    value: 20000,
    min_subtotal: 80000,
  },
  {
    code: "SALE15",
    label: "giảm 15% tối đa 30 nghìn",
    type: "percent",
    value: 15,
    cap: 30000,
    min_subtotal: 50000,
  },
  {
    code: "FREESHIP",
    label: "miễn phí giao hàng",
    type: "fixed",
    value: 15000,
    min_subtotal: 0,
  },
];

export function getEligibleVouchers(
  _restaurantId: string,
  subtotal: number,
): VoucherEntry[] {
  return VOUCHERS.filter((v) => subtotal >= v.min_subtotal).map((v) => {
    let discountApplied: number;
    if (v.type === "fixed") {
      discountApplied = v.value;
    } else {
      discountApplied = Math.round(subtotal * v.value / 100);
      if (v.cap && discountApplied > v.cap) discountApplied = v.cap;
    }
    return {
      code: v.code,
      label: v.label,
      type: v.type,
      value: v.value,
      cap: v.cap,
      discount_applied: discountApplied,
    };
  });
}

export function validateVoucher(
  code: string,
  _restaurantId: string,
  subtotal: number,
): { eligible: boolean; discount: number; reason: string | null } {
  const v = VOUCHERS.find((x) => x.code === code.toUpperCase());
  if (!v) return { eligible: false, discount: 0, reason: "Voucher không tồn tại" };
  if (subtotal < v.min_subtotal) {
    return {
      eligible: false,
      discount: 0,
      reason: `Đơn tối thiểu ${formatVND(v.min_subtotal)}`,
    };
  }
  let discount: number;
  if (v.type === "fixed") {
    discount = v.value;
  } else {
    discount = Math.round(subtotal * v.value / 100);
    if (v.cap && discount > v.cap) discount = v.cap;
  }
  return { eligible: true, discount, reason: null };
}

function formatVND(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)} nghìn`;
  return `${n} đồng`;
}
