import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { BottomNavTab } from '../../components/BottomNavBar';
import { useProfileStore } from '../../stores/useProfileStore';

export function useSettings() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { accessibilityModes, speakingSpeed, setAccessibilityModes, setSpeakingSpeed } =
    useProfileStore();

  function toggleMode(mode: keyof typeof accessibilityModes) {
    setAccessibilityModes({ ...accessibilityModes, [mode]: !accessibilityModes[mode] });
  }

  function onBack() {
    navigation.goBack();
  }

  function onMicPress() {
    navigation.navigate('VoiceAssistantIntent', {
      context: 'home',
      aiGreeting: 'Bạn muốn thay đổi cài đặt nào?',
    });
  }

  function onTabPress(tab: BottomNavTab) {
    if (tab === 'home') navigation.navigate('Dashboard');
    if (tab === 'stats') navigation.navigate('Stats');
  }

  return {
    modes: accessibilityModes,
    speed: speakingSpeed,
    toggleMode,
    setSpeed: setSpeakingSpeed,
    onBack,
    onMicPress,
    onTabPress,
  };
}
