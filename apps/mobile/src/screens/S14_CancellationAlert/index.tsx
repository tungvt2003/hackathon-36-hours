// apps/mobile/src/screens/S14_CancellationAlert/index.tsx
import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCancellationAlert } from './useCancellationAlert.hook';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { theme } from '../../theme/theme';
import { BrandedBackground } from '../../components/BrandedBackground';

const CancellationAlertScreen = () => {
  const insets = useSafeAreaInsets();
  const { info, isFood, onFindAnother, onGoHome } = useCancellationAlert();

  const iconScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(iconScale, {
      toValue: 1,
      tension: 35,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <BrandedBackground variant="default">
      <View style={styles.root}>
        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.dragHandle} />

          <Animated.View
            style={[styles.iconCircle, { transform: [{ scale: iconScale }] }]}
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          >
            <MaterialCommunityIcons name="alert-circle" size={44} color={theme.colors.error} />
          </Animated.View>

          <Text style={styles.heading}>{info.heading}</Text>
          <Text style={styles.body}>{info.body}</Text>

          <View style={styles.refundCard}>
            <View style={styles.refundRow}>
              <MaterialCommunityIcons name="currency-usd-off" size={20} color={theme.colors.warning} />
              <Text style={styles.refundText}>{info.refundNote}</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <PrimaryButton 
              label={info.primaryActionLabel} 
              onPress={onFindAnother} 
            />
            <View style={styles.buttonSpacer} />
            <SecondaryButton 
              label="Về trang chủ" 
              onPress={onGoHome} 
            />
          </View>
        </View>
      </View>
    </BrandedBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: theme.colors.border,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 96,
    height: 96,
    backgroundColor: theme.colors.errorBg,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
  },
  body: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    lineHeight: 26,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
    fontWeight: '400',
  },
  refundCard: {
    backgroundColor: theme.colors.warningBg,
    borderRadius: theme.radius.card,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 40,
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  refundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refundText: {
    fontSize: 15,
    color: theme.colors.warningText,
    fontWeight: '700',
    flex: 1,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto',
  },
  primaryBtn: {
    height: 60,
  },
  secondaryBtn: {
    height: 60,
  },
  buttonSpacer: {
    marginTop: 12,
  },
});

export default CancellationAlertScreen;
