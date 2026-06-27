export const RATING_TAGS: string[] = [
  'Giao nhanh',
  'Đồ ăn nóng',
  'Tài xế thân thiện',
  'Đúng món',
  'Đóng gói tốt',
  'Giá tốt',
];

export async function submitRating(
  orderId: string,
  rating: number,
  tags: string[],
  comment: string
): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 800));
}
