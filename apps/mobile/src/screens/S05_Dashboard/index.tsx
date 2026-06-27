// apps/mobile/src/screens/S05_Dashboard/index.tsx
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDashboard } from './useDashboard.hook';
import { FloatingMicButton } from '../../components/FloatingMicButton';
import { AIBubble } from '../../components/AIBubble';
import { AudioVisualizer } from '../../components/AudioVisualizer';
import { BottomNavBar } from '../../components/BottomNavBar';
import { BrandedBackground } from '../../components/BrandedBackground';
import { SuaraLogo } from '../../components/SuaraLogo';
import { theme } from '../../theme/theme';

export default function DashboardScreen() {
  const {
    aiText,
    userText,
    stage,
    sttAvailable,
    manualInput,
    setManualInput,
    submitManualInput,
    onMicPress,
    onTabPress,
    onHistoryPress,
  } = useDashboard();

  return (
    <BrandedBackground variant="default">
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
      >
        <SafeAreaView edges={['top']} style={styles.root}>
          <View style={styles.topBar}>
            <SuaraLogo size="sm" />
            <TouchableOpacity
              style={styles.historyButton}
              onPress={onHistoryPress}
              accessibilityRole="button"
              accessibilityLabel="Order history"
            >
              <MaterialCommunityIcons name="history" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.conversationArea}>
            <AIBubble key={aiText} text={aiText} variant="light" />

            {userText !== '' && (
              <View>
                <View style={styles.userEcho}>
                  <Text style={styles.userEchoLabel}>YOU SAID</Text>
                  <Text style={styles.userEchoText}>{userText}</Text>
                </View>
                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={onHistoryPress}
                  accessibilityRole="button"
                  accessibilityLabel="Lịch sử đơn hàng"
                >
                  <MaterialCommunityIcons name="history" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )
            }
          </View>

          <View style={styles.center}>
            {stage === 'listening' && (
              <>
                <AudioVisualizer active={sttAvailable} />
                <Text style={styles.statusLabel}>
                  {sttAvailable ? 'Listening...' : 'Type your request'}
                </Text>
                {sttAvailable && (
                  <View style={styles.statusHint}>
                    <View style={[styles.statusDot, styles.statusDotActive]} />
                    <Text style={styles.statusText}>Recording — tap mic to stop</Text>
                  </View>
                )}
              </>
            )}

            {stage === 'thinking' && <Text style={styles.statusLabel}>AI is processing...</Text>}

            {!sttAvailable && stage === 'listening' && (
              <View style={styles.manualInputRow}>
                <TextInput
                  style={styles.manualInput}
                  value={manualInput}
                  onChangeText={setManualInput}
                  placeholder="Type your request..."
                  placeholderTextColor={theme.colors.textMuted}
                  autoFocus
                  returnKeyType="send"
                  onSubmitEditing={submitManualInput}
                  accessibilityLabel="Type your request"
                />
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={submitManualInput}
                  accessibilityRole="button"
                  accessibilityLabel="Send"
                >
                  <MaterialCommunityIcons name="send" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}

            <View
              style={styles.micZone}
              accessibilityLabel="Tap mic and say what you need"
            >
              {stage === 'thinking' ? (
                <ActivityIndicator color={theme.colors.primary} size="large" />
              ) : (
                <FloatingMicButton onPress={onMicPress} size={128} />
              )}
            </View>

            <View style={styles.center}>
              {stage === 'listening' && (
                <>
                  <AudioVisualizer active={sttAvailable} />
                  <Text style={styles.statusLabel}>
                    {sttAvailable ? 'Đang lắng nghe...' : 'Nhập yêu cầu'}
                  </Text>
                  {sttAvailable && (
                    <View style={styles.statusHint}>
                      <View style={[styles.statusDot, styles.statusDotActive]} />
                      <Text style={styles.statusText}>Đang ghi âm — chạm mic để dừng</Text>
                    </View>
                  )}
                </>
              )}

              {stage === 'thinking' && <Text style={styles.statusLabel}>AI đang xử lý...</Text>}

              {!sttAvailable && stage === 'listening' && (
                <View style={styles.manualInputRow}>
                  <TextInput
                    style={styles.manualInput}
                    value={manualInput}
                    onChangeText={setManualInput}
                    placeholder="Nhập yêu cầu..."
                    placeholderTextColor={theme.colors.textMuted}
                    autoFocus
                    returnKeyType="send"
                    onSubmitEditing={submitManualInput}
                    accessibilityLabel="Nhập yêu cầu"
                  />
                  <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={submitManualInput}
                    accessibilityRole="button"
                    accessibilityLabel="Gửi"
                  >
                    <MaterialCommunityIcons name="send" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              )}

              <View
                style={styles.micZone}
                accessibilityLabel="Nhấn mic và nói điều bạn cần"
              >
                {stage === 'thinking' ? (
                  <ActivityIndicator color={theme.colors.primary} size="large" />
                ) : (
                  <FloatingMicButton onPress={onMicPress} size={128} />
                )}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <SafeAreaView edges={['bottom']}>
        <BottomNavBar activeTab="home" onTabPress={onTabPress} />
      </SafeAreaView>
    </BrandedBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  topBar: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoWrapper: {
    // Chỉnh vị trí logo thủ công ở đây
    marginTop: 0,
    marginLeft: 0,
    transform: [{ translateY: 0 }],
  },
  historyButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  conversationArea: { paddingHorizontal: 20, marginTop: 32 },
  userEcho: {
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 16,
    padding: 14,
  },
  userEchoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  userEchoText: { fontSize: 15, color: theme.colors.textSecondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  subGreeting: {
    fontSize: 17,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 36,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 24,
  },
  manualInputRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 24 },
  manualInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micZone: { width: 240, height: 240, justifyContent: 'center', alignItems: 'center' },
  statusHint: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,177,79,0.6)' },
  statusDotActive: { backgroundColor: '#EF4444' },
  statusText: { fontSize: 14, color: theme.colors.textMuted },
});
