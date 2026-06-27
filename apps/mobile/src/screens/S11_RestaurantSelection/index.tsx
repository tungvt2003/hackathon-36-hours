import React from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRestaurantSelection } from './useRestaurantSelection.hook';
import { ScreenHeader } from '../../components/ScreenHeader';
import { theme } from '../../theme/theme';
import { MockRestaurant } from './restaurantSelection.service';
import { ASSETS } from '../../assets';

export default function RestaurantSelectionScreen() {
  const { restaurants, onSelect, onBack } = useRestaurantSelection();

  const getRestaurantImage = (id: string) => {
    switch(id) {
      case 'r1': return ASSETS.images.phoBoTai;
      case 'r2': return ASSETS.images.restaurantDefault;
      case 'r3': return ASSETS.images.phoGa;
      default: return ASSETS.images.restaurantDefault;
    }
  };

  const renderItem = ({ item }: { item: MockRestaurant }) => {
    const imageSource = getRestaurantImage(item.id);

    return (
      <TouchableOpacity 
        style={[styles.card, styles.shadow]} 
        onPress={() => onSelect(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, đánh giá ${item.rating}, giao trong ${item.etaMin} phút`}
      >
        <View style={styles.row}>
          <View style={styles.imageContainer}>
            {imageSource ? (
              <Image 
                source={imageSource} 
                style={styles.restaurantImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="food-variant" size={32} color="#00B14F" />
              </View>
            )}
          </View>
          <View style={styles.flex1}>
            <View style={styles.row}>
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
            
            <View style={styles.infoRow}>
              <View style={styles.iconTextPair}>
                <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
                <Text style={styles.infoTextValue}>{item.rating}</Text>
              </View>
              <Text style={styles.dot}>·</Text>
              <View style={styles.iconTextPair}>
                <MaterialCommunityIcons name="map-marker-outline" size={13} color="#6B7280" />
                <Text style={styles.infoTextValue}>{item.distanceKm}km</Text>
              </View>
              <Text style={styles.dot}>·</Text>
              <View style={styles.iconTextPair}>
                <MaterialCommunityIcons name="clock-outline" size={13} color="#6B7280" />
                <Text style={styles.infoTextValue}>~{item.etaMin} phút</Text>
              </View>
            </View>

            <Text style={styles.priceText}>{item.priceMin}–{item.priceMax}k</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <ScreenHeader title="Chọn nhà hàng" onBack={onBack} />
      
      <View style={styles.aiCard}>
        <Text style={styles.aiLabel}>AI NÓI</Text>
        <Text style={styles.aiGreeting}>Tôi tìm thấy 3 nhà hàng phù hợp. Bạn muốn đặt từ đâu?</Text>
      </View>

      <FlatList
        data={restaurants}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9F9FF',
  },
  aiCard: {
    backgroundColor: '#E8F8EF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00B14F',
    letterSpacing: 1,
    marginBottom: 6,
  },
  aiGreeting: {
    fontSize: 17,
    color: '#111827',
    fontWeight: '400',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
    marginLeft: 14,
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8F8EF',
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
  restaurantName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 8,
  },
  badgePopular: {
    backgroundColor: '#EFF6FF',
  },
  badgeFastest: {
    backgroundColor: '#ECFDF5',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextPopular: {
    color: '#1D4ED8',
  },
  badgeTextFastest: {
    color: '#065F46',
  },
  cuisineText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  iconTextPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  infoTextValue: {
    fontSize: 13,
    color: '#374151',
  },
  dot: {
    marginHorizontal: 4,
    color: '#D1D5DB',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
});
