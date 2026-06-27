import * as Speech from 'expo-speech';
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
import { api } from '../../api';
import { FoodQuote, OrderStatus, PartnerCode, PartnerQuote } from '../../types';

type Screen =
  | 'IDLE'
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

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: 'vi-VN' });
  AccessibilityInfo.announceForAccessibility(text);
}

export default function HomeScreen() {
  const [screen, setScreen] = useState<Screen>('IDLE');
  const [transcript, setTranscript] = useState('');
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop polling khi unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function startSession() {
    const s = await api.conversation.start();
    setSessionId(s.sessionId);
    setPromptText(s.promptText);
    speak(s.promptText);
    setScreen('COLLECTING');
  }

  async function handleSend() {
    if (!transcript.trim()) { Alert.alert('Vui lòng nhập yêu cầu'); return; }
    setLoading(true);
    try {
      let sid = sessionId;
      if (!sid) {
        const s = await api.conversation.start();
        sid = s.sessionId;
        setSessionId(sid);
      }

      const res = await api.conversation.input(sid, transcript);
      setTranscript('');

      if (res.state === 'COLLECTING') {
        setPromptText(res.promptText);
        speak(res.promptText);
        setScreen('COLLECTING');
      } else if (res.state === 'ORDERING') {
        setPromptText(res.promptText);
        speak(res.promptText);
        setRideQuotes(res.quotes ?? []);
        setFoodQuotes(res.foodQuotes ?? []);
        setOrderId(res.orderId ?? null);
        setScreen('QUOTING');
      }
    } catch (err) {
      Alert.alert('Lỗi', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(partner: PartnerCode) {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await api.conversation.confirm(sessionId, partner);
      speak(res.promptText);
      setOrderId(res.orderId);
      setScreen('TRACKING');
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
        setOrderStatus(s.status);
        if (s.driverName) setDriverName(s.driverName);

        if (s.status !== orderStatus) speak(s.responseText);

        if (s.status === OrderStatus.DELIVERED) {
          clearInterval(pollRef.current!);
          setScreen('DELIVERED');
          speak(s.responseText);
        }
      } catch { /* ignore poll errors */ }
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
      speak(res.responseText);
      setScreen('REVIEWING');
    } catch (err) {
      Alert.alert('Lỗi', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    if (pollRef.current) clearInterval(pollRef.current);
    setScreen('IDLE');
    setSessionId(null);
    setOrderId(null);
    setTranscript('');
    setPromptText('');
    setRideQuotes([]);
    setFoodQuotes([]);
    setOrderStatus(null);
    setDriverName(null);
    setRestaurantRating(5);
    setDriverRating(5);
  }

  const allQuotes: { partner: PartnerCode; price: number; etaMinutes: number; driverName?: string; label: string }[] = [
    ...rideQuotes.filter((q) => q.available).map((q) => ({
      partner: q.partner,
      price: q.price,
      etaMinutes: q.etaMinutes,
      driverName: q.driverName,
      label: `${q.price.toLocaleString('vi-VN')}đ`,
    })),
    ...foodQuotes.filter((q) => q.available).map((q) => ({
      partner: q.partner,
      price: q.totalVnd,
      etaMinutes: q.etaMinutes,
      driverName: q.driverName,
      label: `${q.totalVnd.toLocaleString('vi-VN')}đ${q.promoDescription ? ` (${q.promoDescription})` : ''}`,
    })),
  ].sort((a, b) => a.price - b.price);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} accessible={false}>
      {/* Header */}
      <Text style={s.title} accessibilityRole="header">AccessAI</Text>
      <Text style={s.subtitle}>Đặt xe · Đồ ăn · Bằng giọng nói</Text>

      {/* Disability toggle */}
      <View style={s.row}>
        <Text style={s.label}>Hỗ trợ người khiếm thị</Text>
        <Switch
          value={accessibilityFlag}
          onValueChange={setAccessibilityFlag}
          trackColor={{ true: '#3b82f6' }}
          accessibilityLabel="Bật chế độ hỗ trợ người khiếm thị"
        />
      </View>

      {/* IDLE / COLLECTING — input */}
      {(screen === 'IDLE' || screen === 'COLLECTING') && (
        <>
          {screen === 'IDLE' && (
            <TouchableOpacity style={s.primaryBtn} onPress={startSession}
              accessibilityLabel="Bắt đầu" accessibilityRole="button">
              <Text style={s.primaryBtnText}>Bắt đầu</Text>
            </TouchableOpacity>
          )}

          {screen === 'COLLECTING' && promptText !== '' && (
            <View style={s.promptBox} accessible accessibilityLabel={promptText}>
              <Text style={s.promptText}>{promptText}</Text>
            </View>
          )}

          <TextInput
            style={s.input}
            value={transcript}
            onChangeText={setTranscript}
            placeholder="vd: đặt xe đến sân bay, đặt phở bò"
            placeholderTextColor="#475569"
            multiline
            accessibilityLabel="Nhập yêu cầu"
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={s.primaryBtn} onPress={handleSend} disabled={loading}
            accessibilityLabel="Gửi" accessibilityRole="button">
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Gửi</Text>}
          </TouchableOpacity>
        </>
      )}

      {/* QUOTING */}
      {screen === 'QUOTING' && (
        <View style={s.card} accessible accessibilityLabel={promptText}>
          <Text style={s.responseText}>{promptText}</Text>
          <Text style={s.sectionLabel}>Chọn đối tác:</Text>
          {allQuotes.map((q) => (
            <TouchableOpacity key={q.partner} style={s.quoteBtn}
              onPress={() => handleConfirm(q.partner)}
              accessibilityLabel={`${PARTNER_LABEL[q.partner]}, ${q.label}, khoảng ${q.etaMinutes} phút`}
              accessibilityRole="button">
              <Text style={s.quoteName}>{PARTNER_LABEL[q.partner]}</Text>
              <Text style={s.quoteDetail}>
                {q.label} · {q.etaMinutes} phút{q.driverName ? `  · ${q.driverName}` : ''}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.secondaryBtn} onPress={reset} accessibilityRole="button">
            <Text style={s.secondaryBtnText}>Huỷ</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* TRACKING */}
      {screen === 'TRACKING' && (
        <View style={s.card}>
          <Text style={s.sectionLabel}>Trạng thái đơn</Text>
          <Text style={s.statusBadge}>{orderStatus ?? '...'}</Text>
          {driverName && <Text style={s.driverText}>Tài xế: {driverName}</Text>}
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 16 }} />
          <Text style={s.hint}>Đang cập nhật mỗi 5 giây...</Text>
        </View>
      )}

      {/* DELIVERED — rating */}
      {screen === 'DELIVERED' && (
        <View style={s.card}>
          <Text style={s.successTitle}>Đã giao thành công!</Text>
          <Text style={s.sectionLabel}>Đánh giá nhà hàng:</Text>
          <View style={s.ratingRow}>
            {[1,2,3,4,5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRestaurantRating(n)}
                accessibilityLabel={`${n} sao nhà hàng`} accessibilityRole="button">
                <Text style={[s.star, restaurantRating >= n && s.starActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.sectionLabel}>Đánh giá tài xế:</Text>
          <View style={s.ratingRow}>
            {[1,2,3,4,5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setDriverRating(n)}
                accessibilityLabel={`${n} sao tài xế`} accessibilityRole="button">
                <Text style={[s.star, driverRating >= n && s.starActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.primaryBtn} onPress={handleReview} disabled={loading}
            accessibilityLabel="Gửi đánh giá" accessibilityRole="button">
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Gửi đánh giá</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* REVIEWING — done */}
      {screen === 'REVIEWING' && (
        <View style={s.card}>
          <Text style={s.successTitle}>Cảm ơn bạn!</Text>
          <Text style={s.responseText}>Đánh giá của bạn đã được ghi nhận.</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={reset} accessibilityRole="button">
            <Text style={s.primaryBtnText}>Đặt mới</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 24, paddingTop: 64, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  label: { fontSize: 15, color: '#e2e8f0' },
  hint: { fontSize: 12, color: '#64748b', marginTop: 8, textAlign: 'center' },
  promptBox: { backgroundColor: '#1e3a5f', borderRadius: 10, padding: 14, marginBottom: 12 },
  promptText: { color: '#93c5fd', fontSize: 16, lineHeight: 24 },
  input: {
    backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: 12,
    padding: 16, fontSize: 16, minHeight: 80, marginBottom: 16,
    borderWidth: 1, borderColor: '#334155', textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 18,
    alignItems: 'center', minHeight: 56, justifyContent: 'center', marginBottom: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  secondaryBtn: {
    marginTop: 12, borderWidth: 1, borderColor: '#3b82f6', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  secondaryBtnText: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
  card: { marginTop: 16, backgroundColor: '#1e293b', borderRadius: 12, padding: 16 },
  responseText: { color: '#e2e8f0', fontSize: 16, lineHeight: 24, marginBottom: 16 },
  sectionLabel: { color: '#94a3b8', fontSize: 14, marginBottom: 8, marginTop: 4 },
  quoteBtn: {
    backgroundColor: '#0f172a', borderRadius: 10, padding: 16, marginBottom: 10,
    minHeight: 56, justifyContent: 'center', borderWidth: 1, borderColor: '#334155',
  },
  quoteName: { color: '#f8fafc', fontSize: 17, fontWeight: '600' },
  quoteDetail: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  statusBadge: { color: '#22c55e', fontSize: 22, fontWeight: '700', marginVertical: 12 },
  driverText: { color: '#e2e8f0', fontSize: 16 },
  successTitle: { color: '#22c55e', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', marginBottom: 16 },
  star: { fontSize: 36, color: '#334155', marginRight: 8 },
  starActive: { color: '#facc15' },
});
