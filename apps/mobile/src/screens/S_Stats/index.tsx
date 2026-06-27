import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/ScreenHeader';
import { BrandedBackground } from '../../components/BrandedBackground';
import { BottomNavBar, BottomNavTab } from '../../components/BottomNavBar';
import { RootStackParamList } from '../../navigation/types';
import { theme } from '../../theme/theme';

export default function StatsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const onTabPress = (tab: BottomNavTab) => {
    if (tab === 'home') navigation.navigate('Dashboard');
    if (tab === 'settings') navigation.navigate('Settings');
  };

  return (
    <BrandedBackground variant="default">
      <SafeAreaView edges={['top']} style={styles.root}>
        <ScreenHeader title="Thống kê" showLogo={false} onBack={() => navigation.goBack()} />

        <View style={styles.center}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="chart-bar" size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Đang phát triển</Text>
          <Text style={styles.subtitle}>
            Thống kê chi tiêu, số đơn đã đặt, thời gian sử dụng sẽ có ở bản cập nhật sau.
          </Text>
        </View>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']}>
        <BottomNavBar activeTab="stats" onTabPress={onTabPress} />
      </SafeAreaView>
    </BrandedBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
