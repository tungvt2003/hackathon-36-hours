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
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <ScreenHeader title="Đánh giá dịch vụ" onBack={onBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 120, paddingHorizontal: 20 },
          ]}
        >
          {/* ORDER RECAP CARD */}
          <View
            style={styles.recapCard}
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
                      size={42}
                      color={stars >= n ? '#F59E0B' : '#D1D5DB'}
                    />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
            {stars > 0 && (
              <Text style={styles.starsCountText}>{stars}/5 sao</Text>
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
              placeholderTextColor="#9CA3AF"
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
          { paddingBottom: insets.bottom + 16 },
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  recapCard: {
    backgroundColor: '#F9F9FF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    marginTop: 8,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00B14F',
  },
  itemText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  starBtn: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starsCountText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagPillActive: {
    backgroundColor: '#00B14F',
    borderColor: '#00B14F',
  },
  tagText: {
    fontSize: 14,
    color: '#374151',
  },
  tagTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  commentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  commentInput: {
    height: 100,
    backgroundColor: '#F9F9FF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  skipBtn: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default RatingScreen;
