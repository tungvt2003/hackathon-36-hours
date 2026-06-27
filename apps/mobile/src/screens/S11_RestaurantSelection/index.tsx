// apps/mobile/src/screens/S11_RestaurantSelection/index.tsx
import React from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRestaurantSelection } from './useRestaurantSelection.hook';
import { ScreenHeader } from '../../components/ScreenHeader';
import { theme } from '../../theme/theme';
import { MockRestaurant } from './restaurantSelection.service';
import { ASSETS } from '../../assets';
import { BrandedBackground } from '../../components/BrandedBackground';
import { AIBubble } from '../../components/AIBubble';
import { useVoice } from '../../contexts/VoiceContext';

export default function RestaurantSelectionScreen() {
  const { restaurants, onSelect, onBack } = useRestaurantSelection();
  const { openVoice } = useVoice();

  const getRestaurantImage = (id: string) => {
    switch(id) {
      case 'r1': return ASSETS.images.phoBoTai;
      case 'r2': return ASSETS.images.restaurantDefault;
      case 'r3': return ASSETS.images.phoGa;
      default: return ASSETS.images.restaurantDefault;
    }
  };

  const renderItem = ({ item, index }: { item: MockRestaurant, index: number }) => {
    const imageSource = getRestaurantImage(item.id);

    return (
      <TouchableOpacity 
        style={[styles.card, styles.shadow]} 
        onPress={() => onSelect(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, đánh giá ${item.rating}, giao trong ${item.etaMin} phút`}
      >
        <View style={styles.cardRow}>
          <View style={styles.imageContainer}>
            {imageSource ? (
              <Image 
                source={imageSource} 
                style={styles.restaurantImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="food-variant" size={32} color={theme.colors.primary} />
              </View>
            )}
            <View style={styles.optionBadge}>
              <Text style={styles.optionBadgeText}>{index + 1}</Text>
            </View>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.nameHeader}>
              <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
              {item.badge && (
                <View style={[
                  styles.badgePill, 
                  item.badge === 'Phổ biến' ? styles.badgePopular : styles.badgeFastest
                ]}>
                  <Text style={[
                    styles.badgeText, 
                    item.badge === 'Phổ biến' ? styles.badgeTextPopular : styles.badgeTextFastest
                  ]}>
                    {item.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.cuisineText}>{item.cuisine}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.iconTextPair}>
                <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
                <Text style={styles.metaValue}>{item.rating}</Text>
              </View>
              <Text style={styles.dot}>·</Text>
              <View style={styles.iconTextPair}>
                <MaterialCommunityIcons name="map-marker-outline" size={13} color={theme.colors.textSecondary} />
                <Text style={styles.metaValue}>{item.distanceKm}km</Text>
              </View>
              <Text style={styles.dot}>·</Text>
              <View style={styles.iconTextPair}>
                <MaterialCommunityIcons name="clock-outline" size={13} color={theme.colors.textSecondary} />
                <Text style={styles.metaValue}>~{item.etaMin} phút</Text>
              </View>
            </View>

            <Text style={styles.priceLabel}>{item.priceMin}k – {item.priceMax}k</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <BrandedBackground variant="default">
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <ScreenHeader title="Chọn nhà hàng" showLogo={false} onBack={onBack} />
        
        <AIBubble
          text="Tôi tìm thấy 3 nhà hàng phù hợp. Bạn muốn đặt từ đâu?"
          variant="light"
          style={{ marginHorizontal: 20, marginBottom: 16 }}
        />

        <FlatList
          data={restaurants}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity
          style={styles.voiceFab}
          onPress={() => openVoice('home', 'Bạn cần trợ giúp gì? Tôi có thể đặt lại hoặc thay đổi đơn hàng cho bạn.')}
          accessibilityRole="button"
          accessibilityLabel="Nhấn để nói với AI"
        >
          <MaterialCommunityIcons name="microphone" size={32} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    </BrandedBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  aiMessageCard: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.card,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,177,79,0.1)',
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  aiText: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '500',
    lineHeight: 26,
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.primarySoft,
    position: 'relative',
  },
  optionBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 28,
    height: 28,
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  optionBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  iconBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    marginLeft: 8,
  },
  badgePopular: {
    backgroundColor: theme.colors.infoBg,
  },
  badgeFastest: {
    backgroundColor: theme.colors.primarySoft,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badgeTextPopular: {
    color: theme.colors.infoText,
  },
  badgeTextFastest: {
    color: theme.colors.primary,
  },
  cuisineText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  iconTextPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaValue: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  dot: {
    marginHorizontal: 8,
    color: theme.colors.border,
  },
  priceLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 8,
  },
  voiceFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});
