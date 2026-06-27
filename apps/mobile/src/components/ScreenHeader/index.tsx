// apps/mobile/src/components/ScreenHeader/index.tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { SuaraLogo } from '../SuaraLogo';
import { styles } from './styles';

interface ScreenHeaderProps {
  title?: string;
  showLogo?: boolean;   // ← NEW: renders SuaraLogo in the center slot
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showLogo = false,
  onBack,
  rightElement,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerItem}>
        {onBack && (
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the previous screen"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.colors.textPrimary}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.titleContainer}>
        {showLogo ? (
          <SuaraLogo size="md" />
        ) : title ? (
          <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>

      <View style={styles.headerItem}>
        {rightElement && (
          <View style={styles.rightContainer}>
            {rightElement}
          </View>
        )}
      </View>
    </View>
  );
};
