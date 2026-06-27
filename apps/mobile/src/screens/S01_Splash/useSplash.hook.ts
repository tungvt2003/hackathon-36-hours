import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay 
} from 'react-native-reanimated';
import { RootStackParamList } from '../../navigation/types';

export interface SplashViewModel {
  logoScale: any;
  logoOpacity: any;
  taglineOpacity: any;
}

export const useSplash = (): SplashViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const logoScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    logoScale.value = withSpring(1);
    logoOpacity.value = withTiming(1, { duration: 500 });
    taglineOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));

    // Auto-advance to Dashboard — voice handles platform select inline
    const timer = setTimeout(() => {
      navigation.replace('Dashboard');
    }, 2200);

    return () => clearTimeout(timer);
  }, [logoScale, logoOpacity, taglineOpacity, navigation]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return {
    logoScale: logoAnimatedStyle,
    logoOpacity: logoAnimatedStyle, // Combined in logoAnimatedStyle
    taglineOpacity: taglineAnimatedStyle,
  };
};
