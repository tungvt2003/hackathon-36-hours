import React, { createContext, useContext, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, VoiceIntentContext } from '../navigation/types';

interface VoiceContextValue {
  openVoice: (context: VoiceIntentContext, aiGreeting: string) => void;
  closeVoice: () => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const value = useMemo<VoiceContextValue>(
    () => ({
      openVoice: (context, aiGreeting) => {
        navigation.navigate('VoiceAssistantIntent', { context, aiGreeting });
      },
      closeVoice: () => {
        navigation.goBack();
      },
    }),
    [navigation],
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};

export function useVoice(): VoiceContextValue {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider');
  return ctx;
}
