import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AudioVisualizer } from '../../components/AudioVisualizer';
import { AIBubble } from '../../components/AIBubble';
import { useVoiceAssistantIntent } from './useVoiceAssistantIntent.hook';

export default function VoiceAssistantIntentScreen() {
  const insets = useSafeAreaInsets();
  const {
    phase,
    aiGreeting,
    useTextInput,
    textInput,
    setTextInput,
    submitTextInput,
    onDismiss,
    onMicPress,
  } = useVoiceAssistantIntent();

  return (
    <View style={styles.root}>
      <AIBubble
        text={aiGreeting}
        variant="dark"
        showPulse={phase === 'ai_speaking'}
        style={{ marginHorizontal: 24, marginTop: insets.top + 70 }}
      />

      <View style={styles.micArea}>
        {phase === 'ai_speaking' && (
          <>
            <AudioVisualizer active />
            <Text style={styles.hint}>AI is speaking...</Text>
          </>
        )}

        {phase === 'listening' && !useTextInput && (
          <>
            <TouchableOpacity
              style={styles.micButton}
              onPress={onMicPress}
              accessibilityRole="button"
              accessibilityLabel="Speak now"
            >
              <MaterialCommunityIcons name="microphone" size={48} color="white" />
            </TouchableOpacity>
            <Text style={styles.hint}>Speak now</Text>
          </>
        )}

        {phase === 'listening' && useTextInput && (
          <View style={styles.textInputBlock}>
            <TextInput
              style={styles.textInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Type your response..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              accessibilityLabel="Type your response"
              onSubmitEditing={submitTextInput}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={submitTextInput}
              accessibilityRole="button"
              accessibilityLabel="Send"
            >
              <MaterialCommunityIcons name="send" size={22} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {phase === 'processing' && (
          <Text style={styles.hint}>Processing...</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.dismiss, { top: insets.top + 12 }]}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Close and go back"
      >
        <MaterialCommunityIcons name="close" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(8,20,12,0.94)' },
  micArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
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
  hint: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 24, textAlign: 'center' },
  textInputBlock: { width: '100%', gap: 12 },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,177,79,0.3)',
    padding: 16,
    fontSize: 18,
    color: 'white',
    minHeight: 56,
  },
  sendButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,177,79,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
