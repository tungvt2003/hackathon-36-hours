import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { styles } from './styles';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack }) => {
  return (
    <View style={styles.container}>
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
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {onBack && <View style={{ width: 48 }} />}
    </View>
  );
};
