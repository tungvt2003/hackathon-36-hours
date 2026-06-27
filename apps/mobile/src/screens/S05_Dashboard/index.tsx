import React from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDashboard } from './useDashboard.hook';
import { MicButton } from '../../components/MicButton';
import { BottomNavBar } from '../../components/BottomNavBar';
import { DashboardAction } from './dashboard.service';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40) / 2;

export default function DashboardScreen() {
  const { userName, actions, micState, onMicPress, onActionPress, onTabPress } = useDashboard();

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>JD</Text>
      </View>
      <View style={styles.headerText}>
        <Text style={styles.greeting}>Good morning,</Text>
        <Text style={styles.userName}>{userName}</Text>
      </View>
      <TouchableOpacity 
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <MaterialCommunityIcons name="bell-outline" size={24} color="#374151" />
      </TouchableOpacity>
    </View>
  );

  const renderAction = ({ item }: { item: DashboardAction }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onActionPress(item)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint={item.hint}
    >
      <View style={styles.iconBadge}>
        <MaterialCommunityIcons name={item.icon as any} size={28} color={theme.colors.primary} />
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardHint}>{item.hint}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafe} edges={['top']}>
        {renderHeader()}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
      </SafeAreaView>

      <FlatList
        data={actions}
        renderItem={renderAction}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.micWrapper}>
        <MicButton state={micState} onPress={onMicPress} />
        <Text style={styles.micLabel}>Tap to speak</Text>
      </View>

      <SafeAreaView style={styles.bottomSafe} edges={['bottom']}>
        <BottomNavBar activeTab="home" onTabPress={onTabPress} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9F9FF',
  },
  topSafe: {
    backgroundColor: '#F9F9FF',
  },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F8EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00B14F',
  },
  headerText: {
    flex: 1,
    paddingHorizontal: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  iconButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 160,
  },
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 8,
    padding: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E8F8EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  micWrapper: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    alignItems: 'center',
  },
  micLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  bottomSafe: {
    backgroundColor: '#FFFFFF',
  },
});
