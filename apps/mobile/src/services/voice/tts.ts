import * as Speech from 'expo-speech';
import { AccessibilityInfo } from 'react-native';

/** Stop any in-progress speech, then speak the next line in Vietnamese. */
export function tts(text: string, onDone?: () => void) {
  Speech.stop();
  Speech.speak(text, { language: 'vi-VN', onDone, onStopped: onDone });
  AccessibilityInfo.announceForAccessibility(text);
}
