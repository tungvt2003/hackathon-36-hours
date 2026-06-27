import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useHome } from './useHome.hook';

export default function HomeScreen() {
  const {
    transcript,
    loading,
    orderResult,
    confirmResult,
    availableQuotes,
    setTranscript,
    handleSend,
    handleConfirm,
    handleReset,
    getPartnerLabel,
  } = useHome();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} accessible={false}>
      <Text style={styles.title} accessibilityRole="header">
        Voice Mobility
      </Text>
      <Text style={styles.subtitle}>Đặt xe · Đồ ăn · Bằng giọng nói</Text>

      <Text style={styles.label}>
        Nhập yêu cầu{"\n"}
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

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={handleSend}
        disabled={loading}
        accessibilityLabel="Gửi yêu cầu"
        accessibilityRole="button"
        accessibilityHint="Nhấn để gửi yêu cầu đặt xe hoặc đặt đồ ăn"
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Gửi yêu cầu</Text>}
      </TouchableOpacity>

      {orderResult && !confirmResult && (
        <View style={styles.resultBox} accessible accessibilityLabel={orderResult.responseText}>
          <Text style={styles.responseText}>{orderResult.responseText}</Text>

          <Text style={styles.sectionLabel}>Chọn đối tác:</Text>
          {availableQuotes.map((quote) => (
            <TouchableOpacity
              key={quote.partner}
              style={styles.quoteBtn}
              onPress={() => handleConfirm(quote.partner)}
              accessibilityLabel={`${getPartnerLabel(quote.partner)}, ${quote.price.toLocaleString('vi-VN')} đồng, khoảng ${quote.etaMinutes} phút`}
              accessibilityRole="button"
            >
              <Text style={styles.quoteBtnName}>{getPartnerLabel(quote.partner)}</Text>
              <Text style={styles.quoteBtnDetail}>
                {quote.price.toLocaleString('vi-VN')} đ · {quote.etaMinutes} phút
                {quote.driverName ? `  · ${quote.driverName}` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {confirmResult && (
        <View style={styles.resultBox} accessible accessibilityLabel={confirmResult.responseText}>
          <Text style={styles.successTitle}>Đặt thành công!</Text>
          <Text style={styles.responseText}>{confirmResult.responseText}</Text>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleReset}
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