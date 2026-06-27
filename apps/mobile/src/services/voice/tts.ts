import * as Speech from 'expo-speech';
import { AccessibilityInfo } from 'react-native';

/** Stop any in-progress speech, then speak the next line in English. */
export function tts(text: string, onDone?: () => void) {
  Speech.stop();
  Speech.speak(text, { language: 'en-US', onDone, onStopped: onDone });
  AccessibilityInfo.announceForAccessibility(text);
}
