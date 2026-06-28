import { useEffect, useState, useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { tts } from '../../services/voice/tts';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { getSuccessContent, SuccessContent } from './deliverySuccess.service';
import { soundService } from '../../services/sound.service';

interface ViewModel {
  content: SuccessContent;
  circleScale: Animated.Value;
  confettiAnims: { x: Animated.Value; y: Animated.Value; opacity: Animated.Value }[];
  onRateNow: () => void;
  onOrderAgain: () => void;
  onDone: () => void;
}

export const useDeliverySuccess = (): ViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'DeliverySuccess'>>();
  const { orderId } = route.params;
  const content = getSuccessContent(orderId);

  const circleScale = useRef(new Animated.Value(0)).current;
  // 8 confetti particles — pre-compute angles at init
  const confettiAnims = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    // Play sound immediately — no delay
    soundService.playSuccess();

    // Circle spring entrance after 80ms (just enough for screen to mount)
    const circleTimer = setTimeout(() => {
      Animated.spring(circleScale, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }, 80);

    // Confetti burst at 180ms
    const confettiTimer = setTimeout(() => {
      const angles = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);
      const radius = 90;
      Animated.parallel(
        confettiAnims.map((anim, i) => {
          const angle = (angles[i] * Math.PI) / 180;
          return Animated.parallel([
            Animated.timing(anim.x, {
              toValue: Math.cos(angle) * radius,
              duration: 550,
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: Math.sin(angle) * radius,
              duration: 550,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, { toValue: 1, duration: 50, useNativeDriver: true }),
              Animated.delay(300),
              Animated.timing(anim.opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
          ]);
        })
      ).start();
    }, 180);

    const announcementTimer = setTimeout(() => {
      tts(content.announcement);
    }, 600);

    return () => {
      clearTimeout(circleTimer);
      clearTimeout(confettiTimer);
      clearTimeout(announcementTimer);
    };
  }, []);

  const onRateNow = useCallback(() => {
    navigation.navigate('RatingScreen', { orderId });
  }, [navigation, orderId]);

  const onOrderAgain = useCallback(() => {
    navigation.navigate('Dashboard');
  }, [navigation]);

  const onDone = useCallback(() => {
    navigation.navigate('Dashboard');
  }, [navigation]);

  return { content, circleScale, confettiAnims, onRateNow, onOrderAgain, onDone };
};
