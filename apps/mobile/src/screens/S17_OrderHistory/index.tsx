// apps/mobile/src/screens/S17_OrderHistory/index.tsx
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
import { theme } from '../../theme/theme';
import { SuaraLogo } from '../../components/SuaraLogo';
import { BrandedBackground } from '../../components/BrandedBackground';
import { useVoice } from '../../contexts/VoiceContext';

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
  const { openVoice } = useVoice();

  const renderItem = ({ item }: { item: HistoryOrder }) => (
    <TouchableOpacity
      onPress={() => onViewDetail(item)}
      style={[styles.orderCard, styles.shadow]}
      accessibilityRole="button"
      accessibilityLabel={`Đơn ${item.title}, ${item.subtitle}, ${(item.total / 1000).toFixed(0)}k đồng, ${STATUS_LABELS[item.status]}, ${item.dateLabel}`}
      accessibilityHint="Nhấn đúp để xem chi tiết đơn hàng"
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons
            name={item.type === 'food' ? 'food' : 'car-side'}
            size={24}
            color={theme.colors.primary}
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
    <BrandedBackground variant="default">
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <ScreenHeader title="Lịch sử đơn hàng" showLogo={false} onBack={onBack} />

        {/* SEARCH BAR */}
        <View style={[styles.searchBar, styles.shadowSm]}>
          <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Tìm theo tên nhà hàng, món ăn..."
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="search"
            accessibilityLabel="Tìm kiếm đơn hàng"
            blurOnSubmit={true}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              style={styles.clearBtn}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* FILTER CHIPS */}
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {filterOptions.map((opt) => {
              const isActive = activeFilter === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => onFilterChange(opt.value as FilterValue)}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isActive }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <SuaraLogo size="md" />
              <View style={styles.mt24}>
                <Text style={styles.emptyTitle}>Không có đơn hàng nào</Text>
                <Text style={styles.emptySubtitle}>
                  Thử tìm kiếm từ khoá khác hoặc đổi bộ lọc nhé
                </Text>
              </View>
            </View>
          }
        />

        {/* Floating Mic FAB */}
        <TouchableOpacity
          style={[styles.micFab, { bottom: Math.max(insets.bottom, 24) + 16 }]}
          onPress={() => openVoice('home', 'Bạn cần trợ giúp gì? Tôi có thể đặt lại hoặc thay đổi đơn hàng cho bạn.')}
          accessibilityRole="button"
          accessibilityLabel="Voice Assistant"
        >
          <MaterialCommunityIcons name="microphone" size={36} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    </BrandedBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    height: 52,
    alignItems: 'center',
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: 8,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
  },
  filterWrapper: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterChip: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '800',
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 8,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    flex: 1,
    fontWeight: '500',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginRight: 12,
  },
  reorderBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  mt24: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  micFab: {
    position: 'absolute',
    right: 20,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
});

export default OrderHistoryScreen;
