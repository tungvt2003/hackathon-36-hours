// apps/mobile/src/screens/S08_VoiceSpeaking/index.tsx
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useVoiceSpeaking } from './useVoiceSpeaking.hook';
import { AudioVisualizer } from '../../components/AudioVisualizer';
import { AIBubble } from '../../components/AIBubble';
import { theme } from '../../theme/theme';

export default function VoiceSpeakingScreen() {
  const insets = useSafeAreaInsets();
  const { userText, aiText, loading, onConfirm, onCancel, onDismiss } = useVoiceSpeaking();

  const pulseVal = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseVal, {
          toValue: 1.05,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(pulseVal, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.root}>
      <TouchableOpacity 
        style={[styles.closeButton, { top: insets.top + 12 }]} 
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <MaterialCommunityIcons name="close" size={22} color="white" />
      </TouchableOpacity>

      <View style={styles.topArea}>
        <View style={styles.userCard}>
          <Text style={styles.userCardLabel}>BẠN NÓI</Text>
          <Text style={styles.userText}>{userText}</Text>
        </View>

        <AIBubble text={aiText} variant="dark" />
      </View>

      <View style={[styles.bottomZone, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.visualizerContainer}>
          <AudioVisualizer active={true} />
        </View>

        <View style={styles.micContainer}>
          <Animated.View style={[styles.micCircle, { transform: [{ scale: pulseVal }] }]}>
            <MaterialCommunityIcons name="volume-high" size={40} color={theme.colors.primary} />
          </Animated.View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Hủy"
          >
            <Text style={styles.cancelBtnText}>Hủy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={onConfirm}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Confirm"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmBtnText}>Confirm</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A1F14',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  topArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: theme.radius.card,
    padding: 16,
    marginBottom: 16,
  },
  userCardLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
    lineHeight: 26,
    marginTop: 6,
  },
  aiCard: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.card,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 177, 79, 0.3)',
  },
  aiCardLabel: {
    fontSize: 11,
    color: theme.colors.primary,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  aiText: {
    fontSize: 26,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    lineHeight: 38,
  },
  bottomZone: {
    paddingHorizontal: 24,
  },
  visualizerContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  micCircle: {
    width: 104,
    height: 104,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 60,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    height: 60,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
