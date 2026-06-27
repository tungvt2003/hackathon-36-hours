import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCancellationAlert } from './useCancellationAlert.hook';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';

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
    <View style={styles.root}>
      <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dragHandle} />

        <Animated.View
          style={[styles.iconCircle, { transform: [{ scale: iconScale }] }]}
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
        >
          <MaterialCommunityIcons name="close-circle" size={44} color="#EF4444" />
        </Animated.View>

        <Text style={styles.heading}>{info.heading}</Text>
        <Text style={styles.body}>{info.body}</Text>

        <View style={styles.refundCard}>
          <View style={styles.refundRow}>
            <MaterialCommunityIcons name="cash-refund" size={18} color="#92400E" />
            <Text style={styles.refundText}>{info.refundNote}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton label={info.primaryActionLabel} onPress={onFindAnother} />
          <View style={styles.buttonSpacer} />
          <SecondaryButton label="Về trang chủ" onPress={onGoHome} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'white',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#FEE2E2',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  refundCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 32,
    width: '100%',
  },
  refundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refundText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto',
  },
  buttonSpacer: {
    marginTop: 12,
  },
});

export default CancellationAlertScreen;
