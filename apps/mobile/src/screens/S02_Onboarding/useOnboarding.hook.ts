import { useCallback, useRef, useState, useEffect } from 'react';
import { AccessibilityInfo, FlatList, NativeScrollEvent, NativeSyntheticEvent, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { onboardingService, OnboardingSlide } from './onboarding.service';

const { width } = Dimensions.get('window');

export interface OnboardingViewModel {
  slides: OnboardingSlide[];
  currentIndex: number;
  flatListRef: React.RefObject<FlatList | null>;
  handleSkip: () => void;
  handleNext: () => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export const useOnboarding = (): OnboardingViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const slides = onboardingService.getSlides();

  const handleSkip = useCallback(() => {
    navigation.replace('ConnectGrabAccount');
  }, [navigation]);

  const handleNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      navigation.replace('ConnectGrabAccount');
    }
  }, [currentIndex, navigation, slides.length]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / width);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`Slide ${currentIndex + 1} of ${slides.length}: ${slides[currentIndex].title}`);
  }, [currentIndex, slides]);

  return {
    slides,
    currentIndex,
    flatListRef,
    handleSkip,
    handleNext,
    onScroll,
  };
};
