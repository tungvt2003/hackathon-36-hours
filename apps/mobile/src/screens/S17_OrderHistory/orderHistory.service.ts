export type HistoryOrderType = 'food' | 'ride';
export type HistoryStatus = 'delivered' | 'completed' | 'cancelled';

export interface HistoryOrder {
  id: string;
  type: HistoryOrderType;
  title: string;
  subtitle: string;
  total: number;
  status: HistoryStatus;
  dateLabel: string;
}

export const STATUS_LABELS: Record<HistoryStatus, string> = {
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

export const STATUS_COLORS: Record<HistoryStatus, { bg: string; text: string }> = {
  delivered: { bg: '#ECFDF5', text: '#065F46' },
  completed: { bg: '#EFF6FF', text: '#1D4ED8' },
  cancelled: { bg: '#FEF2F2', text: '#991B1B' },
};

export const FILTER_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đồ ăn', value: 'food' },
  { label: 'Đặt xe', value: 'ride' },
  { label: 'Hoàn thành', value: 'completed' },
  { label: 'Đã huỷ', value: 'cancelled' },
] as const;

export type FilterValue = (typeof FILTER_OPTIONS)[number]['value'];

export function getMockOrders(): HistoryOrder[] {
  return [
    {
      id: 'h1',
      type: 'food',
      title: 'Phở Hà Nội',
      subtitle: 'Phở Bò Tái ×1',
      total: 80000,
      status: 'delivered',
      dateLabel: 'Hôm nay, 12:34',
    },
    {
      id: 'h2',
      type: 'food',
      title: 'Phở Thìn Bờ Hồ',
      subtitle: 'Phở Gà ×2',
      total: 130000,
      status: 'delivered',
      dateLabel: 'Hôm qua, 19:10',
    },
    {
      id: 'h3',
      type: 'ride',
      title: 'GrabCar đến Bến Thành',
      subtitle: 'Từ 123 Lê Lợi',
      total: 45000,
      status: 'completed',
      dateLabel: '25 Th6',
    },
    {
      id: 'h4',
      type: 'food',
      title: 'Quán Phở 24',
      subtitle: 'Combo ×1',
      total: 75000,
      status: 'cancelled',
      dateLabel: '24 Th6',
    },
    {
      id: 'h5',
      type: 'ride',
      title: 'GrabBike đến sân bay',
      subtitle: 'Từ nhà',
      total: 120000,
      status: 'completed',
      dateLabel: '22 Th6',
    },
    {
      id: 'h6',
      type: 'food',
      title: 'Phở Hà Nội',
      subtitle: 'Phở Bò ×1',
      total: 65000,
      status: 'delivered',
      dateLabel: '20 Th6',
    },
  ];
}

export function filterOrders(
  orders: HistoryOrder[],
  query: string,
  filter: FilterValue
): HistoryOrder[] {
  return orders.filter((o) => {
    const matchesQuery =
      query === '' ||
      o.title.toLowerCase().includes(query.toLowerCase()) ||
      o.subtitle.toLowerCase().includes(query.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'food' && o.type === 'food') ||
      (filter === 'ride' && o.type === 'ride') ||
      (filter === 'completed' && o.status === 'completed') ||
      (filter === 'cancelled' && o.status === 'cancelled');
    return matchesQuery && matchesFilter;
  });
}
