import React from 'react';
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { MicButton } from '../../components/MicButton';
import { useDashboard } from './useDashboard.hook';
import { theme } from '../../theme/theme';
import { DashboardAction } from './dashboard.service';

export default function DashboardScreen() {
  const { userName, actions, micState, onMicPress, onActionPress } = useDashboard();

  const renderActionItem = ({ item }: { item: DashboardAction }) => (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={() => onActionPress(item)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint={`Navigates to ${item.title}`}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={item.icon as any} size={32} color={theme.colors.primary} />
      </View>
      <Text style={styles.actionTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="AccessAI" />
      
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Hello, {userName}</Text>
        <Text style={styles.subtitle}>What would you like to do?</Text>
      </View>

      <FlatList
        data={actions}
        renderItem={renderActionItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
      />

      <View style={styles.footer}>
        <MicButton state={micState} onPress={onMicPress} />
        <Text style={styles.micHint}>Tap to Speak</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  welcomeSection: {
    padding: theme.spacing[4],
    marginTop: theme.spacing[2],
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing[1],
  },
  listContent: {
    padding: theme.spacing[3],
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: theme.spacing[3],
    marginBottom: theme.spacing[3],
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 48,
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  micHint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
