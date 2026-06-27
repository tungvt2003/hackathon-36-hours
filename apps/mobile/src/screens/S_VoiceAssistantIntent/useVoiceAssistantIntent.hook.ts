import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';

type Phase = 'ai_speaking' | 'listening' | 'done';

export function useVoiceAssistantIntent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VoiceAssistantIntent'>>();
  const { context, aiGreeting } = route.params;

  const [phase, setPhase] = useState<Phase>('ai_speaking');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    isCancelledRef.current = false;
    AccessibilityInfo.announceForAccessibility(aiGreeting);

    // AI phát âm thanh chào mừng bằng giọng nói
    Speech.stop();
    Speech.speak(aiGreeting, {
      language: 'vi-VN',
      onDone: () => {
        if (!isCancelledRef.current) {
          setPhase('listening');
        }
      },
      onStopped: () => {
        if (!isCancelledRef.current) {
          setPhase('listening');
        }
      },
    });

    return () => {
      isCancelledRef.current = true;
      Speech.stop();
    };
  }, [aiGreeting]);

  // Tự động kích hoạt ghi âm khi chuyển sang phase 'listening'
  useEffect(() => {
    if (phase === 'listening') {
      startRecording();
    }
    return () => {
      cleanupRecording();
    };
  }, [phase]);

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Cần quyền microphone');
        setPhase('done');
        navigation.goBack();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
    } catch (e) {
      console.warn('Ghi âm thất bại', e);
    }
  }

  async function cleanupRecording() {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch { /* ignore */ }
    }
  }

  async function stopAndProcess() {
    if (!recording) return;
    setPhase('done');
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // Đọc file ra Base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });

        navigation.navigate('VoiceProcessing', {
          audioBase64: base64,
          context,
        });
      } else {
        navigation.goBack();
      }
    } catch (err) {
      console.warn('Lỗi xử lý file âm thanh', err);
      navigation.navigate('VoiceError');
    }
  }

  function onDismiss() {
    navigation.goBack();
  }

  function onMicPress() {
    if (phase !== 'listening') return;
    stopAndProcess();
  }

  return { phase, aiGreeting, context, onDismiss, onMicPress };
}
