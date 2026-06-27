import { useState, useCallback, useRef } from 'react';
import { Animated, AccessibilityInfo } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import * as ratingService from './rating.service';
import { soundService } from '../../services/sound.service';

interface ViewModel {
  stars: number;
  selectedTags: string[];
  comment: string;
  loading: boolean;
  starAnims: Animated.Value[];
  onStarPress: (n: number) => void;
  onTagPress: (tag: string) => void;
  onCommentChange: (text: string) => void;
  onSubmit: () => Promise<void>;
  onSkip: () => void;
  onBack: () => void;
}

export const useRating = (): ViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'RatingScreen'>>();
  const { orderId } = route.params;

  const [stars, setStars] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // 5 star refs
  const starAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  const onStarPress = useCallback((n: number) => {
    setStars(n);
    
    // Spring "pop" the tapped star and all lower stars
    starAnims.forEach((anim, i) => {
      if (i < n) {
        Animated.spring(anim, {
          toValue: 1,
          tension: 60,
          friction: 4,
          useNativeDriver: true,
        }).start();
      }
    });

    // Bounce the selected star more
    Animated.sequence([
      Animated.spring(starAnims[n - 1], {
        toValue: 1.35,
        tension: 80,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.spring(starAnims[n - 1], {
        toValue: 1,
        tension: 80,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    AccessibilityInfo.announceForAccessibility(`${n} sao được chọn`);
  }, [starAnims]);

  const onTagPress = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const onCommentChange = useCallback((text: string) => {
    setComment(text);
  }, []);

  const onSubmit = useCallback(async () => {
    if (stars === 0) return;
    setLoading(true);
    await ratingService.submitRating(orderId, stars, selectedTags, comment);
    setLoading(false);
    soundService.playSuccess();
    navigation.navigate('Dashboard');
  }, [stars, orderId, selectedTags, comment, navigation]);

  const onSkip = useCallback(() => {
    navigation.navigate('Dashboard');
  }, [navigation]);

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    stars,
    selectedTags,
    comment,
    loading,
    starAnims,
    onStarPress,
    onTagPress,
    onCommentChange,
    onSubmit,
    onSkip,
    onBack,
  };
};
