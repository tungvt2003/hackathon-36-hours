import React, { useEffect, useRef } from 'react';
import { 
  Animated, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useVoiceSpeaking } from './useVoiceSpeaking.hook';
import { AudioVisualizer } from '../../components/AudioVisualizer';
import { theme } from '../../theme/theme';

export default function VoiceSpeakingScreen() {
  const insets = useSafeAreaInsets();
  const { userText, aiText, onConfirm, onCancel, onDismiss } = useVoiceSpeaking();

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

        <View style={styles.aiCard}>
          <Text style={styles.aiCardLabel}>AI NÓI</Text>
          <Text style={styles.aiText}>{aiText}</Text>
        </View>
      </View>

      <View style={[styles.bottomZone, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.visualizerContainer}>
          <AudioVisualizer active={true} />
        </View>

        <View style={styles.micContainer}>
          <Animated.View style={[styles.micCircle, { transform: [{ scale: pulseVal }] }]}>
            <MaterialCommunityIcons name="volume-high" size={36} color="#00B14F" />
          </Animated.View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelBtnText}>Huỷ</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.confirmBtn} 
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel="Confirm"
          >
            <Text style={styles.confirmBtnText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.93)',
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
    paddingBottom: 24,
  },
  userCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  userCardLabel: {
    fontSize: 11,
    color: '#6B7280',
    letterSpacing: 1,
    fontWeight: '500',
  },
  userText: {
    fontSize: 18,
    color: '#E5E7EB',
    fontWeight: '400',
    lineHeight: 26,
    marginTop: 6,
  },
  aiCard: {
    backgroundColor: '#0F2A18',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 177, 79, 0.3)',
  },
  aiCardLabel: {
    fontSize: 11,
    color: '#00B14F',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 8,
  },
  aiText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 32,
  },
  bottomZone: {
    paddingHorizontal: 24,
  },
  visualizerContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  micCircle: {
    width: 96,
    height: 96,
    backgroundColor: '#E8F8EF',
    borderWidth: 3,
    borderColor: '#00B14F',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#00B14F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
