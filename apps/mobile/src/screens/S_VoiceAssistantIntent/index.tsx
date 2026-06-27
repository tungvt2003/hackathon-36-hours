import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AudioVisualizer } from '../../components/AudioVisualizer';
import { AIBubble } from '../../components/AIBubble';
import { useVoiceAssistantIntent } from './useVoiceAssistantIntent.hook';

export default function VoiceAssistantIntentScreen() {
  const insets = useSafeAreaInsets();
  const { phase, aiGreeting, onDismiss, onMicPress } = useVoiceAssistantIntent();

  return (
    <View style={styles.root}>
      <AIBubble
        text={aiGreeting}
        variant="dark"
        style={{ marginHorizontal: 24, marginTop: insets.top + 70 }}
      />

      <View style={styles.micArea}>
        {phase === 'ai_speaking' && (
          <>
            <AudioVisualizer active />
            <Text style={styles.hint}>AI đang nói...</Text>
          </>
        )}

        {phase === 'listening' && (
          <>
            <TouchableOpacity
              style={styles.micButton}
              onPress={onMicPress}
              accessibilityRole="button"
              accessibilityLabel="Nói ngay bây giờ"
            >
              <MaterialCommunityIcons name="microphone" size={48} color="white" />
            </TouchableOpacity>
            <Text style={styles.hint}>Nói ngay bây giờ</Text>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.dismiss, { top: insets.top + 12 }]}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Đóng và quay lại"
      >
        <MaterialCommunityIcons name="close" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(8,20,12,0.94)' },
  micArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  micButton: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(0,177,79,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  hint: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 24 },
  dismiss: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
