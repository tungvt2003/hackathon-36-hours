// apps/mobile/src/screens/S15_DeliverySuccess/index.tsx
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDeliverySuccess } from './useDeliverySuccess.hook';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { theme } from '../../theme/theme';
import { SuaraLogo } from '../../components/SuaraLogo';
import { BrandedBackground } from '../../components/BrandedBackground';
import { useVoice } from '../../contexts/VoiceContext';

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
  const { openVoice } = useVoice();

  return (
    <BrandedBackground variant="success">
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
                      i % 3 === 0 ? theme.colors.primary : i % 3 === 1 ? '#F59E0B' : '#3B82F6',
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
              <MaterialCommunityIcons name="check-circle" size={80} color={theme.colors.primary} />
            </Animated.View>
          </View>

          <Text
            style={styles.heading}
            accessibilityRole="header"
          >
            {content.heading}
          </Text>

          <View style={styles.brandingSpacer}>
            <SuaraLogo size="md" />
          </View>

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

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <PrimaryButton
            label="Đánh giá ngay"
            onPress={onRateNow}
          />
          <View style={styles.buttonSpacer} />
          <SecondaryButton label="Order again" onPress={onOrderAgain} />
          <TouchableOpacity
            onPress={onDone}
            style={styles.doneBtn}
            accessibilityRole="button"
            accessibilityLabel="Xong, về trang chủ"
          >
            <Text style={styles.doneText}>Xong</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.voiceFab}
          onPress={() => openVoice('home', 'Bạn cần trợ giúp gì? Tôi có thể đặt lại hoặc thay đổi đơn hàng cho bạn.')}
          accessibilityRole="button"
          accessibilityLabel="Tap to speak with AI"
        >
          <MaterialCommunityIcons name="microphone" size={32} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    </BrandedBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
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
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 28,
    textAlign: 'center',
  },
  brandingSpacer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  body: {
    fontSize: 17,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 26,
  },
  timeLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  starRow: {
    marginTop: 32,
    alignItems: 'center',
  },
  starPrompt: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
    fontWeight: '600',
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
    marginTop: 8,
  },
  doneText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  voiceFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});

export default DeliverySuccessScreen;
