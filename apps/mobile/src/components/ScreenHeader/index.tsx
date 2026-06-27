import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { styles } from './styles';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack, rightElement }) => {
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
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </Pressable>
        )}
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
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
