import { useState, useCallback, useMemo, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  getMockOrders,
  filterOrders,
  HistoryOrder,
  FilterValue,
  FILTER_OPTIONS,
} from './orderHistory.service';
import { PartnerCode } from '../../types';

interface ViewModel {
  filtered: HistoryOrder[];
  searchQuery: string;
  activeFilter: FilterValue;
  filterOptions: typeof FILTER_OPTIONS;
  onSearchChange: (text: string) => void;
  onFilterChange: (filter: FilterValue) => void;
  onReorder: (order: HistoryOrder) => void;
  onViewDetail: (order: HistoryOrder) => void;
  onBack: () => void;
}

export const useOrderHistory = (): ViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  
  const allOrders = useMemo(() => getMockOrders(), []);
  
  const filtered = useMemo(
    () => filterOrders(allOrders, searchQuery, activeFilter),
    [allOrders, searchQuery, activeFilter]
  );

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `Lịch sử đơn hàng. ${allOrders.length} đơn được tìm thấy.`
    );
  }, [allOrders.length]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${filtered.length} kết quả`);
  }, [filtered.length]);

  const onReorder = useCallback(
    (order: HistoryOrder) => {
      navigation.navigate('OrderConfirmation', {
        orderId: order.id,
        partner: 'GRAB' as PartnerCode,
        mode: 'confirm',
      });
    },
    [navigation]
  );

  const onViewDetail = useCallback(
    (order: HistoryOrder) => {
      navigation.navigate('OrderConfirmation', {
        orderId: order.id,
        partner: 'GRAB' as PartnerCode,
        mode: 'view',
      });
    },
    [navigation]
  );

  const onBack = useCallback(() => navigation.goBack(), [navigation]);

  return {
    filtered,
    searchQuery,
    activeFilter,
    filterOptions: FILTER_OPTIONS,
    onSearchChange: setSearchQuery,
    onFilterChange: setActiveFilter,
    onReorder,
    onViewDetail,
    onBack,
  };
};
