import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AudioVisualizer } from '../../components/AudioVisualizer';
import { api } from '../../api';
import { FoodQuote, OrderStatus, PartnerCode, PartnerQuote } from '../../types';
import { theme } from '../../theme/theme';
import { BrandedBackground } from '../../components/BrandedBackground';
import { SuaraLogo } from '../../components/SuaraLogo';
import { ASSETS } from '../../assets';
import { ScreenHeader } from '../../components/ScreenHeader';
import { getSpeechRecognitionModule, STT_AVAILABLE } from '../../services/speechRecognition';
import { DEV_FORCE_TEXT_INPUT } from '../../constants/devFlags';
import {
  PARTNER_VOICE_KEYWORDS,
  PARTNER_LABEL,
} from '../../services/voice/voice.constants';
import { parseVoiceInput } from '../../services/voice/voice-nlu.service';
import { voiceNlg } from '../../services/voice/voice-nlg.service';

// Ép modal nhập text khi không nói được (simulator) hoặc DEV_FORCE_TEXT_INPUT=true.
// Voice flow gốc giữ nguyên — chỉ tắt cờ này khi build Android thiết bị thật.
const USE_TEXT_INPUT = !STT_AVAILABLE || DEV_FORCE_TEXT_INPUT;

type Stage =
  | 'IDLE'
  | 'LISTENING'
  | 'COLLECTING'
  | 'QUOTING'
  | 'TRACKING'
  | 'DELIVERED'
  | 'REVIEWING';

const ORDINAL_WORDS = ['mot', 'nhat', '1', 'hai', '2', 'ba', '3', 'bon', '4', 'nam', '5'];

function tts(text: string, onDone?: () => void) {
  Speech.stop();
  Speech.speak(text, { language: 'vi-VN', onDone, onStopped: onDone });
  AccessibilityInfo.announceForAccessibility(text);
}

/** Map câu trả lời bằng giọng ("Be", "số 1", "rẻ nhất"...) sang partner trong list quote đang hiển thị (đã sort theo giá tăng dần) */
function matchPartnerFromVoice(
  rawText: string,
  quotes: { partner: PartnerCode }[],
): PartnerCode | null {
  const text = rawText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd');

  if (quotes.length === 0) return null;

  // ưu tiên match tên đối tác trực tiếp (chỉ trong số đối tác đang được quote)
  for (const { code, words } of PARTNER_VOICE_KEYWORDS) {
    if (!quotes.some((q) => q.partner === code)) continue;
    if (words.some((w) => text.includes(w))) return code;
  }

  // "rẻ nhất" / "đầu tiên" -> phần tử đầu (đã sort tăng dần theo giá)
  if (/re\s*nhat|dau\s*tien|so\s*1\b|thu\s*nhat/.test(text)) {
    return quotes[0].partner;
  }
  // "đắt nhất" / "cuối" -> phần tử cuối
  if (/dat\s*nhat|cuoi\s*cung|cuoi/.test(text)) {
    return quotes[quotes.length - 1].partner;
  }
  // số thứ tự nói ra ("số 2", "thứ hai", "hai")
  const ordinalIdx = ORDINAL_WORDS.findIndex((w) => new RegExp(`\\b${w}\\b`).test(text));
  if (ordinalIdx >= 0) {
    const idx = Math.floor(ordinalIdx / 2); // mỗi số có 2 dạng chữ/số trong ORDINAL_WORDS
    if (quotes[idx]) return quotes[idx].partner;
  }

  return null;
}

export default function VoiceAssistantScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [stage, setStage] = useState<Stage>('IDLE');
  const [loading, setLoading] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [rideQuotes, setRideQuotes] = useState<PartnerQuote[]>([]);
  const [foodQuotes, setFoodQuotes] = useState<FoodQuote[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [accessibilityFlag, setAccessibilityFlag] = useState(false);
  // dev text-input mode: luôn tự mở lại ô nhập sau mỗi câu hỏi, giống hành vi auto-chain mic của người khiếm thị
  const autoChain = accessibilityFlag || USE_TEXT_INPUT;
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [collectingInput, setCollectingInput] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const nextActionCue = USE_TEXT_INPUT ? 'Bạn có thể bắt đầu nhập.' : 'Bạn có thể bắt đầu nói.';

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatusRef = useRef<OrderStatus | null>(null);
  const finalTranscriptRef = useRef('');
  const submitTranscriptRef = useRef<(text: string) => void>(() => {});
  const sessionIdRef = useRef<string | null>(null);
  // fallback: nếu native 'end' không tự bắn sau khi im lặng (gặp trên 1 số Android), tự dừng
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SILENCE_TIMEOUT_MS = 4000;
  // mic đang mở nhưng chưa có tiếng nói nào -> tự dừng sau timeout
  const noInputTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const NO_INPUT_TIMEOUT_MS = 4000;
  // tracking voice activity for AudioVisualizer
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // Stop STT when screen loses focus (navigating to S10 etc.) to avoid listener conflicts
  useEffect(() => {
    if (!isFocused) {
      const speechModule = getSpeechRecognitionModule();
      try { speechModule?.stop(); } catch { /* ignore */ }
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      if (noInputTimerRef.current) { clearTimeout(noInputTimerRef.current); noInputTimerRef.current = null; }
      if (stage === 'LISTENING') setStage('IDLE');
    }
  }, [isFocused]);

  function clearNoInputTimer() {
    if (noInputTimerRef.current) {
      clearTimeout(noInputTimerRef.current);
      noInputTimerRef.current = null;
    }
  }

  /** Mic mở mà không có tiếng nói sau timeout -> tự dừng, về IDLE */
  function armNoInputTimer() {
    clearNoInputTimer();
    noInputTimerRef.current = setTimeout(() => {
      const speechModule = getSpeechRecognitionModule();
      try { speechModule?.stop(); } catch { /* ignore */ }
      setStage('IDLE');
    }, NO_INPUT_TIMEOUT_MS);
  }

    // Lấy GPS một lần khi mở màn hình, không chặn luồng chính nếu thất bại.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch { /* GPS không khả dụng, tìm kiếm không kèm vị trí. */ }
    })();
  }, []);

  // ── STT event subscriptions (dev build only) ─────────────────
  useEffect(() => {
    const speechModule = getSpeechRecognitionModule();
    if (!speechModule) return;

    const clearSilenceTimer = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    const armSilenceTimer = () => {
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        try { speechModule.stop(); } catch { /* ignore */ }
      }, SILENCE_TIMEOUT_MS);
    };

    let subs: { remove(): void }[] = [];
    try {
      subs = [
        speechModule.addListener('result', (event: any) => {
          clearNoInputTimer();
          const text: string = event.results?.[0]?.transcript ?? '';
          setLiveTranscript(text);
          if (event.isFinal && text) finalTranscriptRef.current = text;
          armSilenceTimer();
          // drive AudioVisualizer with actual voice activity
          setIsSpeaking(true);
          if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
          speakingTimerRef.current = setTimeout(() => setIsSpeaking(false), 600);
        }),
        speechModule.addListener('end', () => {
          clearSilenceTimer();
          clearNoInputTimer();
          if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
          setIsSpeaking(false);
          const text = finalTranscriptRef.current;
          finalTranscriptRef.current = '';
          setLiveTranscript('');
          if (text) submitTranscriptRef.current(text);
          else setStage('IDLE');
        }),
        speechModule.addListener('error', (event: any) => {
          clearSilenceTimer();
          clearNoInputTimer();
          if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
          setIsSpeaking(false);
          console.warn('STT error', event.error, event.message);
          setStage('IDLE');
        }),
      ];
    } catch (e) {
      console.warn('STT listeners failed', e);
    }

    return () => {
      clearSilenceTimer();
      clearNoInputTimer();
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
      subs.forEach(s => s?.remove());
      try { speechModule.abort(); } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  // ── Helpers ─────────────────────────────────────────────────

  /** Quotes hợp nhất ride+food, sort tăng dần theo giá — dùng cả cho render và match voice */
  function getAllQuotes() {
    return [
      ...rideQuotes.filter(q => q.available).map(q => ({
        partner: q.partner, price: q.price, etaMinutes: q.etaMinutes,
        driverName: q.driverName, label: `${q.price.toLocaleString('vi-VN')}d`,
      })),
      ...foodQuotes.filter(q => q.available).map(q => ({
        partner: q.partner, price: q.totalVnd, etaMinutes: q.etaMinutes,
        driverName: q.driverName,
        label: `${q.totalVnd.toLocaleString('vi-VN')}d${q.promoDescription ? ` (${q.promoDescription})` : ''}`,
      })),
    ].sort((a, b) => a.price - b.price);
  }

  function speakPromptWithCue(text: string, onDone?: () => void) {
    tts(`${text} ${nextActionCue}`, onDone);
  }

  /** Nghe xong khi đang ở QUOTING -> hiểu câu trả lời là chọn đối tác, không gửi qua conversation API */
  async function handleVoicePartnerChoice(text: string) {
    const quotes = getAllQuotes();
    const partner = matchPartnerFromVoice(text, quotes);
    if (partner) {
      await handleConfirm(partner);
      return;
    }
    const retryText = 'Mình chưa nghe rõ bạn chọn đối tác nào. Vui lòng nói lại tên đối tác, ví dụ Be hoặc Grab.';
    setPromptText(retryText);
    if (autoChain) {
      speakPromptWithCue(retryText, () => startListening(false, true));
    } else {
      speakPromptWithCue(retryText);
    }
  }

  async function submitTranscript(text: string) {
    if (stage === 'QUOTING') {
      return handleVoicePartnerChoice(text);
    }

    if (!sessionIdRef.current && (stage === 'IDLE' || stage === 'COLLECTING')) {
      const platformNlu = parseVoiceInput(text, 'platform_select');
      if (platformNlu.intent === 'PLATFORM_UNSUPPORTED') {
        const msg = voiceNlg.platformUnsupported(platformNlu.slots.platform as PartnerCode);
        setPromptText(msg);
        setStage('COLLECTING');
        if (autoChain) speakPromptWithCue(msg, () => startListening(false, true));
        else speakPromptWithCue(msg);
        return;
      }
      if (platformNlu.intent === 'SELECT_PLATFORM') {
        const msg = voiceNlg.platformGrabSelected();
        setPromptText(msg);
        setStage('COLLECTING');
        if (autoChain) speakPromptWithCue(msg, () => startListening(false, true));
        else speakPromptWithCue(msg);
        return;
      }
      if (platformNlu.intent === 'UNKNOWN' && !sessionIdRef.current) {
        const msg = voiceNlg.platformUnclear(0);
        setPromptText(msg);
        if (autoChain) speakPromptWithCue(msg, () => startListening(false, true));
        else speakPromptWithCue(msg);
        return;
      }
    }

    setLoading(true);
    try {
      let sid = sessionIdRef.current;
      if (!sid) {
        const s = await api.conversation.start();
        sid = s.sessionId;
        setSessionId(sid);
      }
      const res = await api.conversation.input(sid, text, userLocation?.lat, userLocation?.lng);

      if (res.state === 'COLLECTING') {
        setPromptText(res.promptText);
        setCollectingInput('');
        setStage('COLLECTING');
        if (autoChain) {
          speakPromptWithCue(res.promptText, () => startListening(false, true));
        } else {
          speakPromptWithCue(res.promptText);
        }
      } else if (res.state === 'ORDERING') {
        setPromptText(res.promptText);
        setRideQuotes(res.quotes ?? []);
        setFoodQuotes(res.foodQuotes ?? []);
        setOrderId(res.orderId ?? null);
        setStage('QUOTING');
        if (autoChain) {
          speakPromptWithCue(res.promptText, () => startListening(false, true));
        } else {
          speakPromptWithCue(res.promptText);
        }
      }
    } catch (err) {
      Alert.alert('Lỗi', (err as Error).message);
      setStage('IDLE');
    } finally {
      setLoading(false);
    }
  }

  submitTranscriptRef.current = submitTranscript;

  /** autoCue=true: đọc "Bạn có thể bắt đầu nói" rồi mới mở mic — dùng cho luồng tự động chain theo voice.
   *  autoCue=false (mặc định, nút bấm tay): mở mic ngay, giữ nguyên hành vi cũ. Nút bấm luôn còn để backup. */
  async function startListening(autoCue = false, skipCue = false) {
    setLiveTranscript('');
    finalTranscriptRef.current = '';
    setStage('LISTENING');

    if (USE_TEXT_INPUT) {
      if (!skipCue) tts(nextActionCue);
      return;
    }
    try {
      const speechModule = getSpeechRecognitionModule();
      if (!speechModule) {
        if (!skipCue) tts('Bạn có thể bắt đầu nhập.');
        return;
      }
      const perm = await speechModule.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Cần quyền microphone');
        setStage('IDLE');
        return;
      }
      const begin = () => {
        try {
          speechModule.start({
            lang: 'vi-VN',
            continuous: false,
            interimResults: true,
            iosTaskHint: 'unspecified',
            requiresOnDeviceRecognition: false,
          });
          armNoInputTimer();
        } catch (e) {
          console.warn('STT start failed', e);
          setStage('IDLE');
        }
      };
      if (autoCue) {
        tts(nextActionCue, begin);
      } else {
        if (!skipCue) tts('Đang lắng nghe');
        begin();
      }
    } catch (e) {
      console.warn('STT start failed', e);
      setStage('IDLE');
    }
  }

  function stopListening() {
    const speechModule = getSpeechRecognitionModule();
    if (speechModule && !USE_TEXT_INPUT) {
      try { speechModule.stop(); } catch { /* ignore */ }
    } else {
      const text = liveTranscript.trim();
      setLiveTranscript('');
      if (text) submitTranscript(text);
      else setStage('IDLE');
    }
  }

  async function submitCollecting() {
    if (!collectingInput.trim()) return;
    const text = collectingInput;
    setCollectingInput('');
    await submitTranscript(text);
  }

  async function handleConfirm(partner: PartnerCode) {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await api.conversation.confirm(sessionId, partner);
      tts(res.promptText);
      setOrderId(res.orderId);
      setStage('TRACKING');
      startPolling(res.orderId);
    } catch (err) {
      Alert.alert('Lỗi', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function startPolling(oid: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const s = await api.orders.status(oid);
        if (s.driverName) setDriverName(s.driverName);
        if (s.status !== prevStatusRef.current) {
          prevStatusRef.current = s.status;
          setOrderStatus(s.status);
          tts(s.responseText);
        }
        if (s.status === OrderStatus.DELIVERED) {
          clearInterval(pollRef.current!);
          setStage('DELIVERED');
        }
      } catch { /* ignore */ }
    }, 5000);
  }

  async function handleReview() {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await api.orders.review(orderId, {
        restaurantRating,
        driverRating,
        voiceText: `nhà hàng: ${restaurantRating} sao, tài xế: ${driverRating} sao`,
      });
      tts(res.responseText);
      setStage('REVIEWING');
    } catch (err) {
      Alert.alert('Lỗi', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    const speechModule = getSpeechRecognitionModule();
    if (speechModule) try { speechModule.abort(); } catch { /* ignore */ }
    if (pollRef.current) clearInterval(pollRef.current);
    prevStatusRef.current = null;
    finalTranscriptRef.current = '';
    setStage('IDLE');
    setSessionId(null);
    setOrderId(null);
    setPromptText('');
    setLiveTranscript('');
    setCollectingInput('');
    setRideQuotes([]);
    setFoodQuotes([]);
    setOrderStatus(null);
    setDriverName(null);
    setRestaurantRating(5);
    setDriverRating(5);
  }

  const allQuotes = getAllQuotes();

  const isDarkStage = stage === 'LISTENING' || stage === 'COLLECTING';

  return (
    <BrandedBackground variant={isDarkStage ? "voice" : "default"}>
      <SafeAreaView edges={['top', 'bottom']} style={s.root}>
        <ScreenHeader
          title="Trợ lý giọng nói"
          showLogo={stage === 'IDLE'}
          onBack={() => navigation.goBack()}
        />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.toggleRow}>
          <MaterialCommunityIcons name="eye-off-outline" size={20} color="#6B7280" />
          <Text style={s.toggleLabel}>Hỗ trợ tiếp cận</Text>
          <Switch value={accessibilityFlag} onValueChange={setAccessibilityFlag}
            trackColor={{ false: '#D1D5DB', true: '#00B14F' }}
            accessibilityLabel="Bật hỗ trợ tiếp cận" />
        </View>

        {/* ── IDLE ── */}
        {stage === 'IDLE' && (
          <View style={s.centerBlock}>
            <TouchableOpacity style={s.bigMic} onPress={() => startListening()}
              accessibilityLabel="Nhấn để bắt đầu nói" accessibilityRole="button">
              <MaterialCommunityIcons name="microphone-outline" size={56} color="#fff" />
            </TouchableOpacity>
            <Text style={s.idleHint}>Nhấn để nói</Text>
            <Text style={s.idleSub}>Đặt xe · Đặt món · Bằng giọng nói</Text>
          </View>
        )}

        {/* ── LISTENING ── */}
          {stage === 'LISTENING' && (
            <View style={s.centerBlock}>
              <AudioVisualizer active={isSpeaking} />
              <Text style={s.listeningLabel}>
                {USE_TEXT_INPUT ? 'Nhập yêu cầu' : 'Đang lắng nghe...'}
              </Text>

              {!USE_TEXT_INPUT && liveTranscript !== '' && (
                <View style={s.liveBox}>
                  <Text style={s.liveText}>{liveTranscript}</Text>
                </View>
              )}

              {USE_TEXT_INPUT && (
                <TextInput
                  style={[s.input, { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)', color: 'white' }]}
                  value={liveTranscript}
                  onChangeText={setLiveTranscript}
                  placeholder="Ví dụ: đặt xe đến sân bay..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoFocus
                  onSubmitEditing={stopListening}
                  returnKeyType="send"
                />
              )}

              <TouchableOpacity style={s.stopBtn} onPress={stopListening}>
                <MaterialCommunityIcons name={USE_TEXT_INPUT ? 'send' : 'stop'} size={24} color="#fff" />
                <Text style={s.stopBtnText}>{USE_TEXT_INPUT ? 'Gửi' : 'Dừng'}</Text>
              </TouchableOpacity>
              {loading && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 16 }} />}
            </View>
          )}

          {/* ── COLLECTING ── */}
          {stage === 'COLLECTING' && (
            <View style={s.inputBlock}>
              {promptText !== '' && (
                <View style={s.promptBoxDark} accessible accessibilityLabel={`${promptText}. ${nextActionCue}`}>
                  <MaterialCommunityIcons name="robot" size={20} color={theme.colors.primary} style={{ marginBottom: 8 }} />
                  <Text style={s.promptTextDark}>{promptText}</Text>
                  <Text style={s.actionCueDark}>{nextActionCue}</Text>
                </View>
              )}
              <TouchableOpacity style={s.voiceReBtnDark} onPress={() => startListening()}>
                <MaterialCommunityIcons name="microphone" size={22} color={theme.colors.primary} />
                <Text style={s.voiceReBtnTextDark}>{USE_TEXT_INPUT ? 'Nhập' : 'Nói'}</Text>
              </TouchableOpacity>
              <TextInput 
                style={s.inputDark} 
                value={collectingInput} 
                onChangeText={setCollectingInput}
                placeholder="Hoặc nhập thủ công..." 
                placeholderTextColor="rgba(255,255,255,0.4)"
                returnKeyType="send" 
                onSubmitEditing={submitCollecting} 
              />
              <TouchableOpacity style={s.primaryBtn} onPress={submitCollecting}
                disabled={loading || !collectingInput.trim()}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Gửi</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.ghostBtnDark} onPress={reset}>
                <Text style={s.ghostBtnTextDark}>Hủy</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── QUOTING ── */}
          {stage === 'QUOTING' && (
            <View style={s.section}>
              {promptText !== '' && (
                <View style={[s.promptBox, s.shadow]} accessible accessibilityLabel={`${promptText}. ${nextActionCue}`}>
                  <MaterialCommunityIcons name="robot" size={20} color={theme.colors.primary} style={{ marginBottom: 8 }} />
                  <Text style={s.promptText}>{promptText}</Text>
                  <Text style={s.actionCue}>{nextActionCue}</Text>
                </View>
              )}
              <Text style={s.sectionLabel}>Chọn đối tác:</Text>
              {allQuotes.map(q => (
                <TouchableOpacity key={q.partner} style={[s.quoteCard, s.shadow]}
                  onPress={() => handleConfirm(q.partner)} disabled={loading}>
                  <View style={s.quoteRow}>
                    <View style={s.partnerRow}>
                      {q.partner === PartnerCode.GRAB && ASSETS.images.grabLogo ? (
                        <Image source={ASSETS.images.grabLogo} style={s.partnerLogo} resizeMode="contain" />
                      ) : (
                        <Text style={s.quoteName}>{PARTNER_LABEL[q.partner]}</Text>
                      )}
                    </View>
                    <Text style={s.quotePrice}>{q.label}</Text>
                  </View>
                  <Text style={s.quoteEta}>~{q.etaMinutes} phút{q.driverName ? ` · ${q.driverName}` : ''}</Text>
                </TouchableOpacity>
              ))}
              {loading && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 16 }} />}
              <TouchableOpacity style={s.ghostBtn} onPress={reset}>
                <Text style={s.ghostBtnText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── TRACKING ── */}
          {stage === 'TRACKING' && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>Trạng thái đơn hàng</Text>
              <Text style={s.statusTextDisplay} accessibilityLiveRegion="polite">
                {orderStatus ?? 'Đang khởi động...'}
              </Text>
              {driverName && (
                <View style={[s.driverCard, s.shadow]}>
                  <MaterialCommunityIcons name="account" size={22} color={theme.colors.primary} />
                  <Text style={s.driverText}>Tài xế: {driverName}</Text>
                </View>
              )}
              <ActivityIndicator color={theme.colors.primary} size="large" style={{ marginTop: 40 }} />
              <Text style={s.hint}>Cập nhật mỗi 5 giây</Text>
            </View>
          )}

          {/* ── DELIVERED ── */}
          {stage === 'DELIVERED' && (
            <View style={s.section}>
              <View style={s.successHero}>
                <MaterialCommunityIcons name="check-circle" size={64} color={theme.colors.primary} />
                <Text style={s.successText}>Đã giao thành công!</Text>
                <SuaraLogo size="md" />
              </View>

              <View style={[s.ratingBox, s.shadow]}>
                <Text style={s.ratingLabel}>Đánh giá nhà hàng:</Text>
                <View style={s.starRow}>
                  {[1,2,3,4,5].map(n => (
                    <TouchableOpacity key={n} onPress={() => setRestaurantRating(n)}>
                      <MaterialCommunityIcons 
                        name="star" 
                        size={36} 
                        color={restaurantRating >= n ? "#FBBF24" : theme.colors.border} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[s.ratingLabel, { marginTop: 20 }]}>Đánh giá tài xế:</Text>
                <View style={s.starRow}>
                  {[1,2,3,4,5].map(n => (
                    <TouchableOpacity key={n} onPress={() => setDriverRating(n)}>
                      <MaterialCommunityIcons 
                        name="star" 
                        size={36} 
                        color={driverRating >= n ? "#FBBF24" : theme.colors.border} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={s.primaryBtn} onPress={handleReview} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Gửi đánh giá</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ── REVIEWING ── */}
          {stage === 'REVIEWING' && (
            <View style={s.section}>
              <MaterialCommunityIcons name="heart" size={64} color={theme.colors.primary} style={s.iconCentred} />
              <Text style={s.successText}>Cảm ơn bạn!</Text>
              <Text style={s.hint}>Đánh giá của bạn giúp dịch vụ tốt hơn.</Text>
              <TouchableOpacity style={s.primaryBtn} onPress={reset}>
                <Text style={s.primaryBtnText}>Đặt lại</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.goBack()}>
                <Text style={s.ghostBtnText}>Về trang chủ</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </BrandedBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  content: { padding: 20 },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border,
  },
  toggleRowDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'transparent',
  },
  toggleLabel: { flex: 1, fontSize: 15, color: theme.colors.textPrimary, fontWeight: '600' },
  toggleLabelDark: { color: 'white' },
  centerBlock: { alignItems: 'center', paddingTop: 60, gap: 20 },
  bigMic: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  idleHint: { fontSize: 24, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 10 },
  idleSub: { fontSize: 16, color: theme.colors.textSecondary, fontWeight: '500' },
  listeningLabel: { fontSize: 20, fontWeight: '800', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  liveBox: {
    backgroundColor: 'rgba(0,177,79,0.1)', borderRadius: theme.radius.lg, borderWidth: 1.5, borderColor: theme.colors.primary,
    padding: 20, width: '100%',
  },
  liveText: { fontSize: 22, color: 'white', lineHeight: 32, textAlign: 'center', fontWeight: '600' },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.colors.error,
    borderRadius: theme.radius.full, paddingVertical: 16, paddingHorizontal: 40, marginTop: 20,
  },
  stopBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  inputBlock: { gap: 16 },
  promptBox: {
    backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.card, padding: 20, borderWidth: 1, borderColor: 'rgba(0,177,79,0.1)',
  },
  promptBoxDark: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: theme.radius.card, padding: 20,
  },
  promptText: { fontSize: 20, color: theme.colors.textPrimary, lineHeight: 30, fontWeight: '500' },
  promptTextDark: { fontSize: 20, color: 'white', lineHeight: 30, fontWeight: '500' },
  actionCue: { marginTop: 14, fontSize: 16, color: theme.colors.primary, lineHeight: 24, fontWeight: '800' },
  actionCueDark: { marginTop: 14, fontSize: 16, color: theme.colors.primary, lineHeight: 24, fontWeight: '800' },
  voiceReBtnDark: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 2, borderColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 16,
  },
  voiceReBtnTextDark: { fontSize: 18, fontWeight: '800', color: theme.colors.primary },
  inputDark: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: theme.radius.lg, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    padding: 16, fontSize: 18, color: 'white', minHeight: 80, textAlignVertical: 'top',
  },
  input: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1.5, borderColor: theme.colors.border,
    padding: 18, fontSize: 18, color: theme.colors.textPrimary, minHeight: 80, textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 20,
    alignItems: 'center', minHeight: 64, justifyContent: 'center', marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 19, fontWeight: '800' },
  ghostBtnDark: {
    borderRadius: theme.radius.full, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', marginTop: 4,
  },
  ghostBtnTextDark: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '700' },
  ghostBtn: {
    borderRadius: theme.radius.full, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: theme.colors.border, marginTop: 4,
  },
  ghostBtnText: { color: theme.colors.textSecondary, fontSize: 16, fontWeight: '700' },
  section: { gap: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  quoteCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 20, borderWidth: 1, borderColor: theme.colors.border,
  },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  partnerRow: { flex: 1 },
  partnerLogo: { width: 64, height: 24 },
  quoteName: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary },
  quotePrice: { fontSize: 19, fontWeight: '800', color: theme.colors.primary },
  quoteEta: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
  statusTextDisplay: { fontSize: 28, fontWeight: '800', color: theme.colors.primary, textAlign: 'center', paddingVertical: 20 },
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg, padding: 20, borderWidth: 1, borderColor: theme.colors.border,
  },
  driverText: { fontSize: 17, color: theme.colors.textPrimary, fontWeight: '700' },
  hint: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', marginTop: 8, fontWeight: '500' },
  iconCentred: { alignSelf: 'center', marginBottom: 12 },
  successHero: { alignItems: 'center', gap: 12, marginBottom: 20 },
  successText: { fontSize: 26, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'center' },
  ratingBox: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 24, marginBottom: 12,
  },
  ratingLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 12, textAlign: 'center' },
  starRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
});
