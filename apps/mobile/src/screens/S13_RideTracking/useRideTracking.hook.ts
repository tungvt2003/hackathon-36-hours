import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { tts } from '../../services/voice/tts';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { getSpeechRecognitionModule, STT_AVAILABLE } from '../../services/speechRecognition';
import { DEV_FORCE_TEXT_INPUT } from '../../constants/devFlags';
import { isNo, isYes } from '../../services/voice/voice-nlu.service';
import { 
  RIDE_STEPS, 
  RIDE_STATUS_ANNOUNCEMENTS, 
  MOCK_DRIVER, 
  RideStatus, 
  RideStep 
} from './rideTracking.service';
import { soundService } from '../../services/sound.service';

type RatingVoiceStep = 'none' | 'ask_rate' | 'stars' | 'comment' | 'done';
const USE_VOICE_INPUT = STT_AVAILABLE && !DEV_FORCE_TEXT_INPUT;

export interface RideTrackingViewModel {
  currentStatus: RideStatus;
  stepIndex: number;
  steps: RideStep[];
  driver: typeof MOCK_DRIVER;
  orderId: string;
  intent: any;
  canCancel: boolean;
  onCancel: () => void;
  onBack: () => void;
  announcement: string | null;
  otpDigits: string[];
  showOtp: boolean;
  etaLabel: string;
  ratingStep: RatingVoiceStep;
  ratingInput: string;
  setRatingInput: (value: string) => void;
  submitRatingInput: () => void;
  onRatingMicPress: () => void;
}

export const useRideTracking = (): RideTrackingViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'RideTracking'>>();
  const { orderId, intent } = route.params;

  const [currentStatus, setCurrentStatus] = useState<RideStatus>('finding');
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [ratingStep, setRatingStep] = useState<RatingVoiceStep>('none');
  const [ratingInput, setRatingInput] = useState('');
  const ratingStepRef = useRef<RatingVoiceStep>('none');
  const ratingHandledRef = useRef(false);
  
  const stepIndex = RIDE_STEPS.findIndex(s => s.id === currentStatus);
  const canCancel = currentStatus === 'finding' || currentStatus === 'en_route';

  const otpDigits = useMemo(() => MOCK_DRIVER.otp.split(''), []);
  const showOtp = currentStatus === 'arrived';

  const etaLabel = useMemo(() => {
    switch (currentStatus) {
      case 'finding': return '–';
      case 'en_route': return '6 phút';
      case 'arrived': return 'Đã đến';
      case 'completed': return 'Xong';
      default: return '–';
    }
  }, [currentStatus]);

  useEffect(() => {
    ratingStepRef.current = ratingStep;
  }, [ratingStep]);

  const parseStars = useCallback((text: string): number | null => {
    const n = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    if (n.includes('five') || n.includes('5') || n.includes('nam sao')) return 5;
    if (n.includes('four') || n.includes('4') || n.includes('bon sao')) return 4;
    if (n.includes('three') || n.includes('3') || n.includes('ba sao')) return 3;
    if (n.includes('two') || n.includes('2') || n.includes('hai sao')) return 2;
    if (n.includes('one') || n.includes('1') || n.includes('mot sao')) return 1;
    return null;
  }, []);

  const handleRatingTranscript = useCallback((text: string) => {
    const step = ratingStepRef.current;

    if (step === 'ask_rate') {
      if (isYes(text) || text.toLowerCase().includes('yes')) {
        setRatingStep('stars');
        tts('How many stars would you give your driver? Say one star, two stars, three stars, four stars, or five stars.');
        return;
      }
      if (isNo(text) || text.toLowerCase().includes('no')) {
        setRatingStep('done');
        tts('Thank you for your feedback. Taking you back to the home screen.');
        setTimeout(() => navigation.navigate('Dashboard'), 2200);
        return;
      }
      tts('Would you like to rate your driver? Say yes or no.');
      return;
    }

    if (step === 'stars') {
      const stars = parseStars(text);
      if (!stars) {
        tts('I did not catch the rating. Say one star, two stars, three stars, four stars, or five stars.');
        return;
      }
      setRatingStep('comment');
      tts(`You gave ${stars} stars. Would you like to add a comment? Say yes to add one, or no to submit.`);
      return;
    }

    if (step === 'comment') {
      if (isNo(text) || text.toLowerCase().includes('no')) {
        setRatingStep('done');
        tts('Thank you for your feedback. Taking you back to the home screen.');
        setTimeout(() => navigation.navigate('Dashboard'), 2200);
        return;
      }
      if (isYes(text) || text.toLowerCase().includes('yes')) {
        tts('Please say your comment.');
        return;
      }
      setRatingStep('done');
      tts('Thank you for your feedback. Taking you back to the home screen.');
      setTimeout(() => navigation.navigate('Dashboard'), 2200);
    }
  }, [navigation, parseStars]);

  const submitRatingInput = useCallback(() => {
    const text = ratingInput.trim();
    if (!text) return;
    setRatingInput('');
    handleRatingTranscript(text);
  }, [ratingInput, handleRatingTranscript]);

  const onRatingMicPress = useCallback(async () => {
    if (!USE_VOICE_INPUT) {
      submitRatingInput();
      return;
    }
    const speechModule = getSpeechRecognitionModule();
    if (!speechModule) return;
    try {
      const perm = await speechModule.requestPermissionsAsync();
      if (!perm.granted) return;
      ratingHandledRef.current = false;
      speechModule.start({ lang: 'en-US', continuous: false, interimResults: false });
    } catch { /* ignore */ }
  }, [submitRatingInput]);

  useEffect(() => {
    if (!USE_VOICE_INPUT) return;
    const speechModule = getSpeechRecognitionModule();
    if (!speechModule) return;
    const subs = [
      speechModule.addListener('result', (event: { results?: { transcript?: string }[] }) => {
        const transcript = event.results?.[0]?.transcript ?? '';
        if (!transcript || ratingHandledRef.current || ratingStepRef.current === 'none') return;
        ratingHandledRef.current = true;
        try { speechModule.stop(); } catch { /* ignore */ }
        handleRatingTranscript(transcript);
      }),
    ];
    return () => subs.forEach((sub) => sub.remove());
  }, [handleRatingTranscript]);

  useEffect(() => {
    let cancelled = false;

    const advance = (status: RideStatus) => {
      if (cancelled) return;
      setCurrentStatus(status);

      if (status === 'completed') {
        const completePrompt = RIDE_STATUS_ANNOUNCEMENTS['completed'];
        setAnnouncement(completePrompt);
        soundService.playSuccess();
        tts(completePrompt, () => {
          if (cancelled) return;
          setRatingStep('ask_rate');
          tts('Bạn có muốn đánh giá tài xế không? Nói Có hoặc Không.');
        });
        return;
      }

      const text = RIDE_STATUS_ANNOUNCEMENTS[status];
      setAnnouncement(text);
      if (status === 'arrived') soundService.playSuccess();

      const idx = RIDE_STEPS.findIndex(s => s.id === status);
      tts(text, () => {
        if (cancelled) return;
        setTimeout(() => {
          if (!cancelled) advance(RIDE_STEPS[idx + 1].id);
        }, 800);
      });
    };

    advance('finding');
    return () => { cancelled = true; };
  }, []);

  const onCancel = useCallback(() => {
    if (canCancel) {
      soundService.playError();
      navigation.navigate('CancellationAlert', { orderId, intent });
    }
  }, [canCancel, navigation, orderId, intent]);

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    currentStatus,
    stepIndex,
    steps: RIDE_STEPS,
    driver: MOCK_DRIVER,
    orderId,
    intent,
    canCancel,
    onCancel,
    onBack,
    announcement,
    otpDigits,
    showOtp,
    etaLabel,
    ratingStep,
    ratingInput,
    setRatingInput,
    submitRatingInput,
    onRatingMicPress,
  };
};
