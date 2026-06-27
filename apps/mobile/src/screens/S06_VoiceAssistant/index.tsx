import * as Speech from 'expo-speech';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AudioVisualizer } from '../../components/AudioVisualizer';
import { api } from '../../api';
import { FoodQuote, OrderStatus, PartnerCode, PartnerQuote } from '../../types';

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

export default function VoiceAssistantScreen() {
  const navigation = useNavigation();
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

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatusRef = useRef<OrderStatus | null>(null);
  const finalTranscriptRef = useRef('');
  // always-fresh ref so STT event handlers don't capture stale closures
  const submitTranscriptRef = useRef<(text: string) => void>(() => {});
  const sessionIdRef = useRef<string | null>(null);

  // keep sessionIdRef in sync
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // ── STT event subscriptions (dev build only) ─────────────────
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

  // ── Helpers ─────────────────────────────────────────────────

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
      Alert.alert('Loi', (err as Error).message);
      setStage('IDLE');
    } finally {
      setLoading(false);
    }
  }

  // keep ref fresh every render
  submitTranscriptRef.current = submitTranscript;

  async function startListening() {
    setLiveTranscript('');
    finalTranscriptRef.current = '';
    setStage('LISTENING');

    if (!STT_AVAILABLE) {
      tts('Nhap yeu cau cua ban');
      return;
    }
    try {
      const speechModule = getSpeechRecognitionModule();
      if (!speechModule) {
        tts('Nhap yeu cau cua ban');
        return;
      }
      const perm = await speechModule.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Can quyen microphone');
        setStage('IDLE');
        return;
      }
      tts('Dang lang nghe');
      speechModule.start({ lang: 'vi-VN', continuous: false, interimResults: true });
    } catch (e) {
      console.warn('STT start failed', e);
      setStage('IDLE');
    }
  }

  function stopListening() {
    const speechModule = getSpeechRecognitionModule();
    if (speechModule) {
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
      Alert.alert('Loi', (err as Error).message);
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
        voiceText: `nha hang: ${restaurantRating} sao, tai xe: ${driverRating} sao`,
      });
      tts(res.responseText);
      setStage('REVIEWING');
    } catch (err) {
      Alert.alert('Loi', (err as Error).message);
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
      driverName: q.driverName, label: `${q.price.toLocaleString('vi-VN')}d`,
    })),
    ...foodQuotes.filter(q => q.available).map(q => ({
      partner: q.partner, price: q.totalVnd, etaMinutes: q.etaMinutes,
      driverName: q.driverName,
      label: `${q.totalVnd.toLocaleString('vi-VN')}d${q.promoDescription ? ` (${q.promoDescription})` : ''}`,
    })),
  ].sort((a, b) => a.price - b.price);

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']} style={s.safeTop}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}
            accessibilityLabel="Quay lai" accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={s.headerTitle} accessibilityRole="header">Tro ly giong noi</Text>
          <View style={s.backBtn} />
        </View>
      </SafeAreaView>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.toggleRow}>
          <MaterialCommunityIcons name="eye-off-outline" size={20} color="#6B7280" />
          <Text style={s.toggleLabel}>Ho tro nguoi khiem thi</Text>
          <Switch value={accessibilityFlag} onValueChange={setAccessibilityFlag}
            trackColor={{ false: '#D1D5DB', true: '#00B14F' }}
            accessibilityLabel="Bat che do ho tro nguoi khiem thi" />
        </View>

        {/* ── IDLE ── */}
        {stage === 'IDLE' && (
          <View style={s.centerBlock}>
            <TouchableOpacity style={s.bigMic} onPress={startListening}
              accessibilityLabel="Nhan de bat dau noi" accessibilityRole="button">
              <MaterialCommunityIcons name="microphone-outline" size={56} color="#fff" />
            </TouchableOpacity>
            <Text style={s.idleHint}>Nhan de noi</Text>
            <Text style={s.idleSub}>Dat xe · Do an · Bang giong noi</Text>
          </View>
        )}

        {/* ── LISTENING ── */}
        {stage === 'LISTENING' && (
          <View style={s.centerBlock}>
            <AudioVisualizer active={STT_AVAILABLE} />
            <Text style={s.listeningLabel}>
              {STT_AVAILABLE ? 'Dang lang nghe...' : 'Nhap yeu cau'}
            </Text>

            {STT_AVAILABLE && liveTranscript !== '' && (
              <View style={s.liveBox}>
                <Text style={s.liveText}>{liveTranscript}</Text>
              </View>
            )}

            {!STT_AVAILABLE && (
              <TextInput
                style={[s.input, { width: '100%' }]}
                value={liveTranscript}
                onChangeText={setLiveTranscript}
                placeholder="vd: dat xe den san bay, dat pho bo"
                placeholderTextColor="#9CA3AF"
                multiline
                autoFocus
                accessibilityLabel="Nhap yeu cau"
              />
            )}

            <TouchableOpacity style={s.stopBtn} onPress={stopListening}
              accessibilityLabel={STT_AVAILABLE ? 'Dung lai' : 'Gui'} accessibilityRole="button">
              <MaterialCommunityIcons name={STT_AVAILABLE ? 'stop-circle-outline' : 'send'} size={24} color="#fff" />
              <Text style={s.stopBtnText}>{STT_AVAILABLE ? 'Dung' : 'Gui'}</Text>
            </TouchableOpacity>
            {loading && <ActivityIndicator color="#00B14F" style={{ marginTop: 16 }} />}
          </View>
        )}

        {/* ── COLLECTING ── */}
        {stage === 'COLLECTING' && (
          <View style={s.inputBlock}>
            {promptText !== '' && (
              <View style={s.promptBox} accessible accessibilityLabel={promptText}>
                <MaterialCommunityIcons name="robot-outline" size={18} color="#00B14F" style={{ marginBottom: 6 }} />
                <Text style={s.promptText}>{promptText}</Text>
              </View>
            )}
            <TouchableOpacity style={s.voiceReBtn} onPress={startListening}
              accessibilityLabel="Noi lai" accessibilityRole="button">
              <MaterialCommunityIcons name="microphone" size={22} color="#00B14F" />
              <Text style={s.voiceReBtnText}>{STT_AVAILABLE ? 'Noi' : 'Nhap'}</Text>
            </TouchableOpacity>
            <TextInput style={s.input} value={collectingInput} onChangeText={setCollectingInput}
              placeholder="Hoac go tay..." placeholderTextColor="#9CA3AF"
              multiline accessibilityLabel="Go tay cau tra loi"
              returnKeyType="send" onSubmitEditing={submitCollecting} />
            <TouchableOpacity style={s.primaryBtn} onPress={submitCollecting}
              disabled={loading || !collectingInput.trim()} accessibilityRole="button">
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Gui</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={reset} accessibilityRole="button">
              <Text style={s.ghostBtnText}>Huy</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── QUOTING ── */}
        {stage === 'QUOTING' && (
          <View style={s.section}>
            {promptText !== '' && (
              <View style={s.promptBox} accessible accessibilityLabel={promptText}>
                <MaterialCommunityIcons name="robot-outline" size={18} color="#00B14F" style={{ marginBottom: 6 }} />
                <Text style={s.promptText}>{promptText}</Text>
              </View>
            )}
            <Text style={s.sectionLabel}>Chon doi tac:</Text>
            {allQuotes.map(q => (
              <TouchableOpacity key={q.partner} style={s.quoteCard}
                onPress={() => handleConfirm(q.partner)} disabled={loading}
                accessibilityLabel={`${PARTNER_LABEL[q.partner]}, ${q.label}, khoang ${q.etaMinutes} phut`}
                accessibilityRole="button">
                <View style={s.quoteRow}>
                  <Text style={s.quoteName}>{PARTNER_LABEL[q.partner]}</Text>
                  <Text style={s.quotePrice}>{q.label}</Text>
                </View>
                <Text style={s.quoteEta}>{q.etaMinutes} phut{q.driverName ? ` · ${q.driverName}` : ''}</Text>
              </TouchableOpacity>
            ))}
            {loading && <ActivityIndicator color="#00B14F" style={{ marginTop: 16 }} />}
            <TouchableOpacity style={s.ghostBtn} onPress={reset} accessibilityRole="button">
              <Text style={s.ghostBtnText}>Huy</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── TRACKING ── */}
        {stage === 'TRACKING' && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Trang thai don hang</Text>
            <Text style={s.statusText} accessibilityLiveRegion="polite">
              {orderStatus ?? '...'}
            </Text>
            {driverName && (
              <View style={s.driverCard}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#00B14F" />
                <Text style={s.driverText}>Tai xe: {driverName}</Text>
              </View>
            )}
            <ActivityIndicator color="#00B14F" size="large" style={{ marginTop: 32 }} />
            <Text style={s.hint}>Dang cap nhat moi 5 giay</Text>
          </View>
        )}

        {/* ── DELIVERED ── */}
        {stage === 'DELIVERED' && (
          <View style={s.section}>
            <MaterialCommunityIcons name="check-circle-outline" size={56} color="#00B14F" style={s.icon} />
            <Text style={s.successText}>Da giao thanh cong!</Text>
            <Text style={s.sectionLabel}>Danh gia nha hang:</Text>
            <View style={s.starRow}>
              {[1,2,3,4,5].map(n => (
                <TouchableOpacity key={n} onPress={() => setRestaurantRating(n)}
                  accessibilityLabel={`${n} sao nha hang`} accessibilityRole="button">
                  <Text style={[s.star, restaurantRating >= n && s.starOn]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.sectionLabel}>Danh gia tai xe:</Text>
            <View style={s.starRow}>
              {[1,2,3,4,5].map(n => (
                <TouchableOpacity key={n} onPress={() => setDriverRating(n)}
                  accessibilityLabel={`${n} sao tai xe`} accessibilityRole="button">
                  <Text style={[s.star, driverRating >= n && s.starOn]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.primaryBtn} onPress={handleReview} disabled={loading}
              accessibilityRole="button">
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Gui danh gia</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── REVIEWING ── */}
        {stage === 'REVIEWING' && (
          <View style={s.section}>
            <MaterialCommunityIcons name="heart-outline" size={56} color="#00B14F" style={s.icon} />
            <Text style={s.successText}>Cam on ban!</Text>
            <Text style={s.hint}>Danh gia da duoc ghi nhan.</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={reset} accessibilityRole="button">
              <Text style={s.primaryBtnText}>Dat moi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.goBack()} accessibilityRole="button">
              <Text style={s.ghostBtnText}>Ve trang chu</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9F9FF' },
  safeTop: { backgroundColor: '#F9F9FF' },
  header: {
    height: 56, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: '#111827' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  toggleLabel: { flex: 1, fontSize: 14, color: '#374151' },
  centerBlock: { alignItems: 'center', paddingTop: 40, gap: 16 },
  bigMic: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#00B14F',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#00B14F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  idleHint: { fontSize: 20, fontWeight: '700', color: '#111827' },
  idleSub: { fontSize: 14, color: '#9CA3AF' },
  listeningLabel: { fontSize: 18, fontWeight: '600', color: '#00B14F' },
  liveBox: {
    backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0',
    padding: 14, width: '100%',
  },
  liveText: { fontSize: 16, color: '#166534', lineHeight: 24, textAlign: 'center' },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EF4444',
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32,
  },
  stopBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  inputBlock: { gap: 12 },
  promptBox: {
    backgroundColor: '#F0FDF4', borderRadius: 14, borderWidth: 1, borderColor: '#BBF7D0', padding: 14,
  },
  promptText: { fontSize: 16, color: '#166534', lineHeight: 24 },
  voiceReBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: '#00B14F', borderRadius: 14, paddingVertical: 14,
  },
  voiceReBtnText: { fontSize: 16, fontWeight: '700', color: '#00B14F' },
  input: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB',
    padding: 16, fontSize: 16, color: '#111827', minHeight: 72, textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: '#00B14F', borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', minHeight: 56, justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  ghostBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB', marginTop: 4,
  },
  ghostBtnText: { color: '#6B7280', fontSize: 15 },
  section: { gap: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', marginTop: 4 },
  quoteCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  quoteName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  quotePrice: { fontSize: 17, fontWeight: '700', color: '#00B14F' },
  quoteEta: { fontSize: 13, color: '#9CA3AF' },
  statusText: { fontSize: 26, fontWeight: '800', color: '#00B14F', textAlign: 'center', paddingVertical: 12 },
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff',
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB',
  },
  driverText: { fontSize: 16, color: '#374151', fontWeight: '500' },
  hint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  icon: { alignSelf: 'center', marginBottom: 8 },
  successText: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8 },
  starRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 8 },
  star: { fontSize: 40, color: '#D1D5DB' },
  starOn: { color: '#FBBF24' },
});
