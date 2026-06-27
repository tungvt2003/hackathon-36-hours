import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDeliverySuccess } from './useDeliverySuccess.hook';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';

const DeliverySuccessScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    content,
    circleScale,
    confettiAnims,
    onRateNow,
    onOrderAgain,
    onDone,
  } = useDeliverySuccess();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.centerArea}>
        <View style={styles.confettiContainer}>
          {confettiAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confettiDot,
                {
                  transform: [{ translateX: anim.x }, { translateY: anim.y }],
                  opacity: anim.opacity,
                  backgroundColor:
                    i % 3 === 0 ? '#00B14F' : i % 3 === 1 ? '#F59E0B' : '#3B82F6',
                },
              ]}
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            />
          ))}
          <Animated.View
            style={[
              styles.successCircle,
              { transform: [{ scale: circleScale }] },
            ]}
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          >
            <MaterialCommunityIcons name="check-circle" size={80} color="#00B14F" />
          </Animated.View>
        </View>

        <Text
          style={styles.heading}
          accessibilityRole="header"
        >
          {content.heading}
        </Text>
        <Text style={styles.body}>{content.body}</Text>
        <Text style={styles.timeLabel}>{content.timeLabel}</Text>

        <View style={styles.starRow}>
          <Text style={styles.starPrompt}>Bạn có hài lòng không?</Text>
          <View style={styles.starsContainer}>
            {[0, 1, 2, 3, 4].map((i) => (
              <TouchableOpacity
                key={i}
                style={styles.starBtn}
                onPress={onRateNow}
                accessibilityRole="button"
                accessibilityLabel={`Đánh giá ${i + 1} sao`}
              >
                <MaterialCommunityIcons name="star" size={36} color="#F59E0B" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label="Đánh giá ngay"
          onPress={onRateNow}
        />
        <View style={styles.buttonSpacer} />
        <SecondaryButton label="Đặt lại" onPress={onOrderAgain} />
        <TouchableOpacity
          onPress={onDone}
          style={styles.doneBtn}
          accessibilityRole="button"
          accessibilityLabel="Xong, về trang chủ"
        >
          <Text style={styles.doneText}>Xong</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'white',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'relative',
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  successCircle: {
    width: 160,
    height: 160,
    backgroundColor: '#E8F8EF',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginTop: 28,
    textAlign: 'center',
  },
  body: {
    fontSize: 17,
    color: '#374151',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 26,
  },
  timeLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
  },
  starRow: {
    marginTop: 32,
    alignItems: 'center',
  },
  starPrompt: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 14,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  starBtn: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 24,
  },
  buttonSpacer: {
    marginTop: 12,
  },
  doneBtn: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  doneText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default DeliverySuccessScreen;
