// apps/mobile/src/screens/S16_RatingScreen/index.tsx
import React from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRating } from './useRating.hook';
import { RATING_TAGS } from './rating.service';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { theme } from '../../theme/theme';
import { SuaraLogo } from '../../components/SuaraLogo';
import { BrandedBackground } from '../../components/BrandedBackground';

const RatingScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    stars,
    selectedTags,
    comment,
    loading,
    starAnims,
    onStarPress,
    onTagPress,
    onCommentChange,
    onSubmit,
    onSkip,
    onBack,
  } = useRating();

  return (
    <BrandedBackground variant="default">
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <ScreenHeader title="Đánh giá dịch vụ" showLogo={false} onBack={onBack} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 140, paddingHorizontal: 20 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* ORDER RECAP CARD */}
            <View
              style={[styles.recapCard, styles.shadow]}
              accessibilityLabel="Đơn hàng Phở Hà Nội, Phở Bò Tái, 80.000 đồng"
            >
              <View style={styles.recapRow}>
                <Text style={styles.restaurantName}>Phở Hà Nội</Text>
                <Text style={styles.priceText}>80.000đ</Text>
              </View>
              <Text style={styles.itemText}>Phở Bò Tái ×1</Text>
            </View>

            {/* STARS SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Đồ ăn và dịch vụ thế nào?</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Animated.View
                    key={n}
                    style={{ transform: [{ scale: starAnims[n - 1] }] }}
                  >
                    <TouchableOpacity
                      onPress={() => onStarPress(n)}
                      style={styles.starBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`${n} sao`}
                      accessibilityState={{ selected: stars >= n }}
                    >
                      <MaterialCommunityIcons
                        name={stars >= n ? 'star' : 'star-outline'}
                        size={48}
                        color={stars >= n ? '#F59E0B' : theme.colors.border}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
              {stars > 0 && (
                <Text style={[styles.starsCountText, { color: stars === 5 ? theme.colors.primary : theme.colors.textSecondary }]}>
                  {stars}/5 sao — {stars === 5 ? 'Tuyệt vời!' : stars >= 4 ? 'Rất tốt' : 'Bình thường'}
                </Text>
              )}
            </View>

            {/* TAGS SECTION */}
            {stars >= 1 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Điều gì nổi bật?</Text>
                <View style={styles.tagsContainer}>
                  {RATING_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => onTagPress(tag)}
                        style={[styles.tagPill, isSelected && styles.tagPillActive]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={tag}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            isSelected && styles.tagTextActive,
                          ]}
                        >
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* COMMENT SECTION */}
            <View style={styles.section}>
              <Text style={styles.commentLabel}>Thêm bình luận (tuỳ chọn)</Text>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={onCommentChange}
                placeholder="Hãy chia sẻ trải nghiệm của bạn..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                accessibilityLabel="Ô nhập bình luận"
                accessibilityHint="Tuỳ chọn. Mô tả trải nghiệm của bạn bằng văn bản."
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* FOOTER */}
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <PrimaryButton
            label={loading ? 'Đang gửi...' : 'Gửi đánh giá'}
            onPress={onSubmit}
            disabled={stars === 0 || loading}
          />
          <TouchableOpacity
            onPress={onSkip}
            style={styles.skipBtn}
            accessibilityRole="button"
            accessibilityLabel="Bỏ qua đánh giá, về trang chủ"
          >
            <Text style={styles.skipText}>Bỏ qua</Text>
          </TouchableOpacity>
          <View style={styles.logoBottom}>
            <SuaraLogo size="sm" />
          </View>
        </View>
      </SafeAreaView>
    </BrandedBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
  },
  recapCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  itemText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starBtn: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starsCountText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagPill: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tagText: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  tagTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  commentLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  commentInput: {
    height: 120,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  skipBtn: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  skipText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  logoBottom: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
});

export default RatingScreen;
