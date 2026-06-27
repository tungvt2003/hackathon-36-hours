import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import { api } from './api';
import {
  PartnerCode,
  PartnerQuote,
  VoiceOrderResponse,
  ConfirmOrderResponse,
} from './types';

// TODO (team voice): sau khi có expo-audio + expo-speech, thay TextInput bằng:
//   1. Nút "Giữ để nói" -> dùng expo-audio ghi âm -> gửi audioBase64 lên API
//   2. responseText nhận về -> dùng expo-speech để đọc lại cho người dùng
//   3. expo-haptics rung xác nhận sau mỗi thao tác
//   Cài: npx expo install expo-audio expo-speech expo-haptics

const PARTNER_LABEL: Record<PartnerCode, string> = {
  [PartnerCode.GRAB]: 'Grab',
  [PartnerCode.BE]: 'Be',
  [PartnerCode.XANH_SM]: 'Xanh SM',
};

export default function HomeScreen() {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<VoiceOrderResponse | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmOrderResponse | null>(null);

  async function handleSend() {
    if (!transcript.trim()) {
      Alert.alert('Vui lòng nhập yêu cầu');
      return;
    }
    setLoading(true);
    setOrderResult(null);
    setConfirmResult(null);
    try {
      const result = await api.voiceOrder({ transcript });
      setOrderResult(result);
      // TODO (team voice): gọi expo-speech đọc result.responseText
      AccessibilityInfo.announceForAccessibility(result.responseText);
    } catch (err) {
      Alert.alert('Lỗi', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(partner: PartnerCode) {
    if (!orderResult) return;
    setLoading(true);
    try {
      const result = await api.confirmOrder({ orderId: orderResult.orderId, partner });
      setConfirmResult(result);
      // TODO (team voice): gọi expo-speech đọc result.responseText
      AccessibilityInfo.announceForAccessibility(result.responseText);
    } catch (err) {
      Alert.alert('Lỗi', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      accessible={false}
    >
      <Text style={styles.title} accessibilityRole="header">
        Voice Mobility
      </Text>
      <Text style={styles.subtitle}>Đặt xe · Đồ ăn · Bằng giọng nói</Text>

      {/* Input tạm thời — team voice thay bằng nút ghi âm */}
      <Text style={styles.label}>
        Nhập yêu cầu{'\n'}
        <Text style={styles.hint}>(tạm gõ tay, sau thay bằng giọng nói)</Text>
      </Text>
      <TextInput
        style={styles.input}
        value={transcript}
        onChangeText={setTranscript}
        placeholder="vd: đặt xe từ nhà đến sân bay Tân Sơn Nhất"
        multiline
        accessibilityLabel="Ô nhập yêu cầu đặt xe hoặc đặt đồ ăn"
        accessibilityRole="none"
        returnKeyType="send"
        onSubmitEditing={handleSend}
      />

      {/* TODO (team voice): đặt nút ghi âm ở đây thay TextInput */}

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={handleSend}
        disabled={loading}
        accessibilityLabel="Gửi yêu cầu"
        accessibilityRole="button"
        accessibilityHint="Nhấn để gửi yêu cầu đặt xe hoặc đặt đồ ăn"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Gửi yêu cầu</Text>
        )}
      </TouchableOpacity>

      {/* Kết quả báo giá */}
      {orderResult && !confirmResult && (
        <View style={styles.resultBox} accessible accessibilityLabel={orderResult.responseText}>
          <Text style={styles.responseText}>{orderResult.responseText}</Text>

          <Text style={styles.sectionLabel}>Chọn đối tác:</Text>
          {orderResult.quotes
            .filter((q) => q.available)
            .sort((a, b) => a.price - b.price)
            .map((q: PartnerQuote) => (
              <TouchableOpacity
                key={q.partner}
                style={styles.quoteBtn}
                onPress={() => handleConfirm(q.partner)}
                accessibilityLabel={`${PARTNER_LABEL[q.partner]}, ${q.price.toLocaleString('vi-VN')} đồng, khoảng ${q.etaMinutes} phút`}
                accessibilityRole="button"
              >
                <Text style={styles.quoteBtnName}>{PARTNER_LABEL[q.partner]}</Text>
                <Text style={styles.quoteBtnDetail}>
                  {q.price.toLocaleString('vi-VN')} đ · {q.etaMinutes} phút
                  {q.driverName ? `  · ${q.driverName}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      )}

      {/* Kết quả xác nhận */}
      {confirmResult && (
        <View style={styles.resultBox} accessible accessibilityLabel={confirmResult.responseText}>
          <Text style={styles.successTitle}>Đặt thành công!</Text>
          <Text style={styles.responseText}>{confirmResult.responseText}</Text>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              setOrderResult(null);
              setConfirmResult(null);
              setTranscript('');
            }}
            accessibilityLabel="Đặt chuyến mới"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>Đặt chuyến mới</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 24, paddingTop: 64, paddingBottom: 48 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 32 },
  label: { fontSize: 16, color: '#e2e8f0', marginBottom: 8 },
  hint: { fontSize: 12, color: '#64748b' },
  input: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  resultBox: {
    marginTop: 24,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  responseText: { color: '#e2e8f0', fontSize: 16, lineHeight: 24, marginBottom: 16 },
  sectionLabel: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  quoteBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    minHeight: 56,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  quoteBtnName: { color: '#f8fafc', fontSize: 17, fontWeight: '600' },
  quoteBtnDetail: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  successTitle: { color: '#22c55e', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  secondaryBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
});
