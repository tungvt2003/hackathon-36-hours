// apps/mobile/src/components/BottomNavBar/index.tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { styles } from './styles';

interface BottomNavBarProps {
  activeTab: 'home' | 'history' | 'account';
  onTabPress: (tab: 'home' | 'history' | 'account') => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabPress }) => {
  const tabs: { id: 'home' | 'history' | 'account'; label: string; icon: string }[] = [
    { id: 'home',    label: 'Home',    icon: 'home' },
    { id: 'history', label: 'History', icon: 'receipt' },
    { id: 'account', label: 'Account', icon: 'account-circle' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabPress(tab.id)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            {isActive && <View style={styles.activeDot} />}
            <MaterialCommunityIcons
              name={isActive ? tab.icon as any : `${tab.icon}-outline` as any}
              size={24}
              color={isActive ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? theme.colors.primary : theme.colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
