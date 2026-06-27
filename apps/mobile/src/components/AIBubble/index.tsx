import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface AIBubbleProps {
  text: string;
  variant?: 'light' | 'dark';
  label?: string;
  style?: ViewStyle;
  showPulse?: boolean;
  accessibilityLiveRegion?: 'polite' | 'assertive';
}

function naturalizeAiText(text: string): string {
  const numberedOptionsStart = text.search(/\s1\s*,/);
  let cleaned = (numberedOptionsStart >= 0 ? text.slice(0, numberedOptionsStart) : text)
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([?.!,])/g, '$1')
    .trim();

  cleaned = cleaned.replace(/Bạn muốn ăn gì\?\s*$/i, 'Bạn muốn ăn món nào?');
  return cleaned;
}

export const AIBubble: React.FC<AIBubbleProps> = ({
  text,
  variant = 'light',
  label = 'Suara NÓI',
  style,
  showPulse = false,
  accessibilityLiveRegion = 'polite',
}) => {
  const displayText = naturalizeAiText(text);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  useEffect(() => {
    if (!showPulse) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [showPulse, pulse]);

  const isDark = variant === 'dark';

  return (
    <Animated.View
      style={[
        isDark ? styles.containerDark : styles.containerLight,
        { opacity, transform: [{ translateY }] },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`AI nói: ${displayText}`}
      accessibilityLiveRegion={accessibilityLiveRegion}
    >
      <View style={styles.headerRow}>
        {showPulse ? (
          <Animated.View style={[styles.dot, { opacity: pulse }]} />
        ) : (
          <View style={[styles.dot, { opacity: 1 }]} />
        )}
        <Text style={isDark ? styles.labelDark : styles.labelLight}>{label}</Text>
      </View>
      <Text style={isDark ? styles.textDark : styles.textLight}>{displayText}</Text>
    </Animated.View>
  );
};

// Android paints elevation as an opaque grey/black shadow plane regardless of
// shadowColor — combined with a translucent backgroundColor it shows up as a
// muddy box around the card. iOS shadow* props don't have that problem, so
// only suppress elevation on Android and rely on the border for definition.
const androidSafeElevation = Platform.OS === 'android' ? 0 : undefined;

const styles = StyleSheet.create({
  containerLight: {
    backgroundColor: 'rgba(0,177,79,0.07)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(0,177,79,0.22)',
    padding: 20,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: androidSafeElevation ?? 4,
  },
  containerDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(0,177,79,0.28)',
    padding: 22,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: androidSafeElevation ?? 8,
  },
  labelLight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B14F',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  labelDark: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(0,177,79,0.9)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00B14F',
    marginRight: 10,
  },
  textLight: { fontSize: 20, fontWeight: '500', color: '#111827', lineHeight: 30 },
  textDark: { fontSize: 22, fontWeight: '600', color: 'rgba(255,255,255,0.95)', lineHeight: 34 },
});

export default AIBubble;
