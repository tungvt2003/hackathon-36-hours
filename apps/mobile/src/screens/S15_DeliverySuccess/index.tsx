// apps/mobile/src/screens/S15_DeliverySuccess/index.tsx
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDeliverySuccess } from './useDeliverySuccess.hook';
import { theme } from '../../theme/theme';
import { SuaraLogo } from '../../components/SuaraLogo';
import { BrandedBackground } from '../../components/BrandedBackground';

const DeliverySuccessScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    content,
    circleScale,
    confettiAnims,
    isListening,
    onRateNow,
    onOrderAgain,
    onDone,
  } = useDeliverySuccess();

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
          <View style={styles.voiceHint}>
            <MaterialCommunityIcons
              name={isListening ? 'microphone' : 'microphone-outline'}
              size={28}
              color={isListening ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text style={[styles.voiceHintText, isListening && styles.voiceHintActive]}>
              {isListening ? 'Đang lắng nghe...' : 'Nói "Có" để tiếp tục · "Không" để thoát'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onDone}
            style={styles.doneBtn}
            accessibilityRole="button"
            accessibilityLabel="Về trang chủ"
          >
            <Text style={styles.doneText}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    gap: 12,
  },
  voiceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,177,79,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,177,79,0.15)',
    width: '100%',
  },
  voiceHintText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  voiceHintActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  doneBtn: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
});

export default DeliverySuccessScreen;
