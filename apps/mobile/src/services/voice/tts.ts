import * as Speech from 'expo-speech';
import { AccessibilityInfo } from 'react-native';

const TTS_PRONUNCIATION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bShopee\s*Food\b/gi, 'Sốp pi Phút'],
  [/\bShopeeFood\b/gi, 'Sốp pi Phút'],
  [/\bShopee\b/gi, 'Sốp pi'],
  [/\bXanh\s*SM\b/gi, 'Xanh ét em'],
  [/\bGrabCar\b/gi, 'Gờ ráp ca'],
  [/\bGrab\b/gi, 'Gờ ráp'],
  [/\bBe\b/g, 'Bê'],
];

export function normalizeVietnameseTtsText(text: string): string {
  return TTS_PRONUNCIATION_REPLACEMENTS.reduce(
    (spokenText, [pattern, replacement]) => spokenText.replace(pattern, replacement),
    text,
  );
}

function isEnglishTtsText(text: string): boolean {
  const asciiLetters = text.match(/[a-z]/gi)?.length ?? 0;
  const vietnameseLetters = text.match(/[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/gi)?.length ?? 0;
  return asciiLetters > 0 && vietnameseLetters === 0;
}

/** Stop any in-progress speech, then speak the next line in Vietnamese. */
export function tts(text: string, onDone?: () => void) {
  const useEnglishVoice = isEnglishTtsText(text);
  const spokenText = useEnglishVoice ? text : normalizeVietnameseTtsText(text);
  Speech.stop();
  Speech.speak(spokenText, { language: useEnglishVoice ? 'en-US' : 'vi-VN', onDone, onStopped: onDone });
  AccessibilityInfo.announceForAccessibility(spokenText);
}
