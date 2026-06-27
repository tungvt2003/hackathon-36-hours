import { requireOptionalNativeModule } from 'expo';

// true only in a dev build — false in Expo Go
type SpeechRecognitionModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

let speechRecognitionModule: SpeechRecognitionModule | null | undefined;

export function getSpeechRecognitionModule() {
  if (speechRecognitionModule === undefined) {
    speechRecognitionModule = requireOptionalNativeModule<SpeechRecognitionModule>('ExpoSpeechRecognition');
  }
  return speechRecognitionModule;
}

export const STT_AVAILABLE = !!getSpeechRecognitionModule();
