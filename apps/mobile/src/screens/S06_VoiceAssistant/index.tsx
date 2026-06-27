import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { requireOptionalNativeModule } from 'expo';
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
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AudioVisualizer } from '../../components/AudioVisualizer';
import { api } from '../../api';
import { FoodQuote, OrderStatus, PartnerCode, PartnerQuote } from '../../types';
import { theme } from '../../theme/theme';
import { BrandedBackground } from '../../components/BrandedBackground';
import { SuaraLogo } from '../../components/SuaraLogo';
import { ASSETS } from '../../assets';
import { ScreenHeader } from '../../components/ScreenHeader';

// true only in a dev build — false in Expo Go
type SpeechRecognitionModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

let speechRecognitionModule: SpeechRecognitionModule | null | undefined;

function getSpeechRecognitionModule() {
  if (speechRecognitionModule === undefined) {
    speechRecognitionModule = requireOptionalNativeModule<SpeechRecognitionModule>('ExpoSpeechRecognition');
  }
  return speechRecognitionModule;
}

const STT_AVAILABLE = !!getSpeechRecognitionModule();

type Stage =
  | 'IDLE'
  | 'LISTENING'
  | 'COLLECTING'
  | 'QUOTING'
  | 'TRACKING'
  | 'DELIVERED'
  | 'REVIEWING';

const PARTNER_LABEL: Record<PartnerCode, string> = {
  [PartnerCode.GRAB]: 'Grab',
  [PartnerCode.BE]: 'Be',
  [PartnerCode.XANH_SM]: 'Xanh SM',
  [PartnerCode.SHOPEE]: 'Shopee Food',
};

function tts(text: string) {
  Speech.stop();
  Speech.speak(text, { language: 'vi-VN' });
  AccessibilityInfo.announceForAccessibility(text);
}

const TypewriterText = ({ text, style }: { text: string; style: any }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [text]);

  return <Text style={style}>{displayedText}</Text>;
};

export default function VoiceAssistantScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [collectingInput, setCollectingInput] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatusRef = useRef<OrderStatus | null>(null);
  const finalTranscriptRef = useRef('');
  const submitTranscriptRef = useRef<(text: string) => void>(() => {});
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  useEffect(() => {
    const speechModule = getSpeechRecognitionModule();
    if (!speechModule) return;

    let subs: { remove(): void }[] = [];
    try {
      subs = [
        speechModule.addListener('result', (event: any) => {
          const text: string = event.results?.[0]?.transcript ?? '';
          setLiveTranscript(text);
          if (event.isFinal && text) finalTranscriptRef.current = text;
        }),
        speechModule.addListener('end', () => {
          const text = finalTranscriptRef.current;
          finalTranscriptRef.current = '';
          setLiveTranscript('');
          if (text) submitTranscriptRef.current(text);
          else setStage('IDLE');
        }),
        speechModule.addListener('error', (event: any) => {
          console.warn('STT error', event.error, event.message);
          setStage('IDLE');
        }),
      ];
    } catch (e) {
      console.warn('STT listeners failed', e);
    }

    return () => {
      subs.forEach(s => s?.remove());
      try { speechModule.abort(); } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  async function submitTranscript(text: string) {
    setLoading(true);
    try {
      let sid = sessionIdRef.current;
      if (!sid) {
        const s = await api.conversation.start();
        sid = s.sessionId;
        setSessionId(sid);
      }
      const res = await api.conversation.input(sid, text);

      if (res.state === 'COLLECTING') {
        setPromptText(res.promptText);
        tts(res.promptText);
        setCollectingInput('');
        setStage('COLLECTING');
      } else if (res.state === 'ORDERING') {
        setPromptText(res.promptText);
        tts(res.promptText);
        setRideQuotes(res.quotes ?? []);
        setFoodQuotes(res.foodQuotes ?? []);
        setOrderId(res.orderId ?? null);
        setStage('QUOTING');
      }
    } catch (err) {
      Alert.alert('Lỗi', (err as Error).message);
      setStage('IDLE');
    } finally {
      setLoading(false);
    }
  }

  submitTranscriptRef.current = submitTranscript;

  async function submitAudio(uri: string) {
    setLoading(true);
    try {
      // Gọi lên Backend, truyền file âm thanh
      const res = await api.voiceFlow.sendAudio(uri, sessionIdRef.current || '', { lat: 10.7769, lng: 106.7009 });
      
      if (res.session_id) setSessionId(res.session_id);
      
      // Xử lý VoiceFlowResponse từ AI Service trả về
      if (res.step === 'select_destination' && res.data?.ride_options) {
        setRideQuotes(res.data.ride_options);
        setStage('QUOTING');
        tts('Đã tìm thấy chuyến xe. Vui lòng chọn.');
      } else if (res.step === 'search_restaurant' && res.data?.restaurants) {
        // Tạm gán vào foodQuotes để hiển thị UI
        const mappedFood = res.data.restaurants.map((r: any) => ({
          partner: PartnerCode.GRAB,
          totalVnd: 50000,
          etaMinutes: r.estimated_delivery_min,
          promoDescription: r.name,
          available: true
        }));
        setFoodQuotes(mappedFood);
        setStage('QUOTING');
        tts(`Đã tìm thấy ${res.data.restaurants.length} nhà hàng.`);
      } else if (res.message) {
        tts(res.message);
        setPromptText(res.message);
        setStage('COLLECTING');
      } else {
        setStage('IDLE');
      }

    } catch (err) {
      Alert.alert('Lỗi', (err as Error).message);
      setStage('IDLE');
    } finally {
      setLoading(false);
    }
  }

  async function startListening() {
    setLiveTranscript('');
    finalTranscriptRef.current = '';
    setStage('LISTENING');

    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Cần quyền microphone');
        setStage('IDLE');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      
      // Đồng thời bật STT để hiển thị live transcript ("nhảy chữ")
      if (STT_AVAILABLE) {
        const speechModule = getSpeechRecognitionModule();
        if (speechModule) {
          const sttPerm = await speechModule.requestPermissionsAsync();
          if (sttPerm.granted) {
            speechModule.start({ lang: 'vi-VN', continuous: false, interimResults: true });
          }
        }
      }

      tts('Đang lắng nghe');
    } catch (e) {
      console.warn('Audio record start failed', e);
      setStage('IDLE');
    }
  }

  async function stopListening() {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        // Tắt STT
        if (STT_AVAILABLE) {
          const speechModule = getSpeechRecognitionModule();
          if (speechModule) {
            try { speechModule.stop(); } catch { /* ignore */ }
          }
        }
        
        setLiveTranscript('');

        if (uri) {
          setStage('IDLE'); // Show loading while processing audio
          await submitAudio(uri);
          return;
        }
      } catch (err) {
        console.warn('Audio record stop failed', err);
      }
    }
    
    // Fallback STT text if any
    const text = liveTranscript.trim();
    setLiveTranscript('');
    if (text) submitTranscript(text);
    else setStage('IDLE');
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

  const allQuotes = [
    ...rideQuotes.filter(q => q.available).map(q => ({
      partner: q.partner, price: q.price, etaMinutes: q.etaMinutes,
      driverName: q.driverName, label: `${q.price.toLocaleString('vi-VN')}đ`,
    })),
    ...foodQuotes.filter(q => q.available).map(q => ({
      partner: q.partner, price: q.totalVnd, etaMinutes: q.etaMinutes,
      driverName: q.driverName,
      label: `${q.totalVnd.toLocaleString('vi-VN')}đ${q.promoDescription ? ` (${q.promoDescription})` : ''}`,
    })),
  ].sort((a, b) => a.price - b.price);

  const isDarkStage = stage === 'LISTENING' || stage === 'COLLECTING';

  return (
    <BrandedBackground variant={isDarkStage ? "voice" : "default"}>
      <SafeAreaView edges={['top', 'bottom']} style={s.root}>
        <ScreenHeader 
          title="Trợ lý Suara" 
          showLogo 
          onBack={() => navigation.goBack()}
        />

        <ScrollView 
          style={s.scroll} 
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[s.toggleRow, isDarkStage && s.toggleRowDark]}>
            <MaterialCommunityIcons name="eye-off-outline" size={20} color={isDarkStage ? "rgba(255,255,255,0.7)" : theme.colors.textSecondary} />
            <Text style={[s.toggleLabel, isDarkStage && s.toggleLabelDark]}>Hỗ trợ khiếm thị</Text>
            <Switch 
              value={accessibilityFlag} 
              onValueChange={setAccessibilityFlag}
              trackColor={{ false: '#D1D5DB', true: theme.colors.primary }}
              accessibilityLabel="Bật chế độ hỗ trợ người khiếm thị" 
            />
          </View>

          {/* ── IDLE ── */}
          {stage === 'IDLE' && (
            <View style={s.centerBlock}>
              <TouchableOpacity style={s.bigMic} onPress={startListening}
                accessibilityLabel="Nhấn để bắt đầu nói" accessibilityRole="button">
                <MaterialCommunityIcons name="microphone" size={56} color="#fff" />
              </TouchableOpacity>
              <Text style={s.idleHint}>Nhấn để nói</Text>
              <Text style={s.idleSub}>Đặt xe · Đồ ăn · Bằng giọng nói</Text>
            </View>
          )}

          {/* ── LISTENING ── */}
          {stage === 'LISTENING' && (
            <View style={s.centerBlock}>
              <AudioVisualizer active={STT_AVAILABLE} />
              <Text style={s.listeningLabel}>
                {STT_AVAILABLE ? 'Đang lắng nghe...' : 'Nhập yêu cầu'}
              </Text>

              {STT_AVAILABLE && liveTranscript !== '' && (
                <View style={s.liveBox}>
                  <Text style={s.liveText}>{liveTranscript}</Text>
                </View>
              )}

              {!STT_AVAILABLE && (
                <TextInput
                  style={[s.input, { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)', color: 'white' }]}
                  value={liveTranscript}
                  onChangeText={setLiveTranscript}
                  placeholder="vd: đặt xe đến sân bay..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  multiline
                  autoFocus
                />
              )}

              <TouchableOpacity style={s.stopBtn} onPress={stopListening}>
                <MaterialCommunityIcons name={STT_AVAILABLE ? 'stop' : 'send'} size={24} color="#fff" />
                <Text style={s.stopBtnText}>{STT_AVAILABLE ? 'Dừng' : 'Gửi'}</Text>
              </TouchableOpacity>
              {loading && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 16 }} />}
            </View>
          )}

          {/* ── COLLECTING ── */}
          {stage === 'COLLECTING' && (
            <View style={s.inputBlock}>
              {promptText !== '' && (
                <View style={s.promptBoxDark} accessible accessibilityLabel={promptText}>
                  <MaterialCommunityIcons name="robot" size={20} color={theme.colors.primary} style={{ marginBottom: 8 }} />
                  <TypewriterText style={s.promptTextDark} text={promptText} />
                </View>
              )}
              <TouchableOpacity style={s.voiceReBtnDark} onPress={startListening}>
                <MaterialCommunityIcons name="microphone" size={22} color={theme.colors.primary} />
                <Text style={s.voiceReBtnTextDark}>{STT_AVAILABLE ? 'Nói' : 'Nhập'}</Text>
              </TouchableOpacity>
              <TextInput 
                style={s.inputDark} 
                value={collectingInput} 
                onChangeText={setCollectingInput}
                placeholder="Hoặc gõ tay..." 
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline 
                returnKeyType="send" 
                onSubmitEditing={submitCollecting} 
              />
              <TouchableOpacity style={s.primaryBtn} onPress={submitCollecting}
                disabled={loading || !collectingInput.trim()}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Gửi</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.ghostBtnDark} onPress={reset}>
                <Text style={s.ghostBtnTextDark}>Huỷ</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── QUOTING ── */}
          {stage === 'QUOTING' && (
            <View style={s.section}>
              {promptText !== '' && (
                <View style={[s.promptBox, s.shadow]} accessible accessibilityLabel={promptText}>
                  <MaterialCommunityIcons name="robot" size={20} color={theme.colors.primary} style={{ marginBottom: 8 }} />
                  <Text style={s.promptText}>{promptText}</Text>
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
                <Text style={s.ghostBtnText}>Huỷ</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── TRACKING ── */}
          {stage === 'TRACKING' && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>Trạng thái đơn hàng</Text>
              <Text style={s.statusTextDisplay} accessibilityLiveRegion="polite">
                {orderStatus ?? 'Đang khởi tạo...'}
              </Text>
              {driverName && (
                <View style={[s.driverCard, s.shadow]}>
                  <MaterialCommunityIcons name="account" size={22} color={theme.colors.primary} />
                  <Text style={s.driverText}>Tài xế: {driverName}</Text>
                </View>
              )}
              <ActivityIndicator color={theme.colors.primary} size="large" style={{ marginTop: 40 }} />
              <Text style={s.hint}>Đang cập nhật mới mỗi 5 giây</Text>
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
                <Text style={s.primaryBtnText}>Đặt mới</Text>
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
