import React from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOrderHistory } from './useOrderHistory.hook';
import {
  HistoryOrder,
  STATUS_LABELS,
  STATUS_COLORS,
  FilterValue,
} from './orderHistory.service';
import { ScreenHeader } from '../../components/ScreenHeader';

const OrderHistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    filtered,
    searchQuery,
    activeFilter,
    filterOptions,
    onSearchChange,
    onFilterChange,
    onReorder,
    onViewDetail,
    onBack,
  } = useOrderHistory();

  const renderItem = ({ item }: { item: HistoryOrder }) => (
    <TouchableOpacity
      onPress={() => onViewDetail(item)}
      style={styles.orderCard}
      accessibilityRole="button"
      accessibilityLabel={`Đơn ${item.title}, ${item.subtitle}, ${(
        item.total / 1000
      ).toFixed(0)}k đồng, ${STATUS_LABELS[item.status]}, ${item.dateLabel}`}
      accessibilityHint="Nhấn đúp để xem chi tiết đơn hàng"
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons
            name={item.type === 'food' ? 'food' : 'car'}
            size={22}
            color="#00B14F"
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLORS[item.status].bg },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: STATUS_COLORS[item.status].text },
            ]}
          >
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>{item.dateLabel}</Text>
        <Text style={styles.totalText}>
          {(item.total / 1000).toFixed(0)}k đ
        </Text>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            onReorder(item);
          }}
          style={styles.reorderBtn}
          accessibilityRole="button"
          accessibilityLabel={`Đặt lại ${item.title}`}
        >
          <Text style={styles.reorderText}>Đặt lại</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <ScreenHeader title="Lịch sử đơn hàng" onBack={onBack} />

      {/* SEARCH BAR */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Tìm kiếm đơn hàng..."
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          accessibilityLabel="Tìm kiếm đơn hàng"
          accessibilityHint="Nhập tên nhà hàng hoặc món ăn"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => onSearchChange('')}
            style={styles.clearBtn}
            accessibilityRole="button"
            accessibilityLabel="Xoá tìm kiếm"
          >
            <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER CHIPS */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onFilterChange(opt.value as FilterValue)}
              style={[
                styles.filterChip,
                activeFilter === opt.value && styles.filterChipActive,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: activeFilter === opt.value }}
              accessibilityLabel={opt.label}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === opt.value && styles.filterChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="receipt-text-outline"
              size={64}
              color="#D1D5DB"
            />
            <Text style={styles.emptyTitle}>Không có đơn hàng</Text>
            <Text style={styles.emptySubtitle}>
              Thử thay đổi bộ lọc hoặc tìm kiếm
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9F9FF',
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    height: 48,
    alignItems: 'center',
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  clearBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#00B14F',
    borderColor: '#00B14F',
  },
  filterChipText: {
    fontSize: 13,
    color: '#374151',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: '#E8F8EF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 13,
    color: '#9CA3AF',
    flex: 1,
  },
  totalText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginRight: 12,
  },
  reorderBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#00B14F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00B14F',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default OrderHistoryScreen;
