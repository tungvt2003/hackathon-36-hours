# AccessAI — Master Copilot Prompt Pack (Voice-First Redesign)
> **Read before using:** Paste each prompt in order, one at a time. Wait for full output and integrate before moving to the next. Each prompt is self-contained with a GOAL, CONTEXT, and OUTPUT.

---

## Architecture Contract (never violate this)

Every screen follows exactly this three-file pattern:
- `index.tsx` — pure JSX only, zero business logic, consumes the hook
- `use<Screen>.hook.ts` — all state, navigation, side-effects, returns typed ViewModel
- `<screen>.service.ts` — pure functions and mock data, no React, no imports from React Navigation

**Voice Architecture:** The voice flow (`VoiceAssistant` → `VoiceProcessing` → `VoiceSpeaking`) is a **transparent modal overlay** that sits above any screen. Every screen has access to a `<FloatingMic />` component that launches it. The mic is a first-class citizen, not an afterthought.

**AI-speaks-first rule:** Every voice interaction begins with the AI speaking. The user never has to initiate a conversation blind.

**No S02 Onboarding:** The screen `S02_Onboarding` is deleted entirely. `S01_Splash` goes directly to `S03_Login` (ConnectGrabAccount). There is no carousel.

---

## PROMPT 1 — Foundation: Types, Navigation & Global Voice Context

**GOAL:** Wire the new navigation skeleton, delete S02, add `VoiceContext`, update `RootStackParamList`, and add a `FloatingMicProvider` that makes the mic globally accessible from any screen.

**CONTEXT:**
- Current `RootStackParamList` in `src/navigation/types.ts` includes `Onboarding: undefined` — this must be removed
- Current `RootNavigator.tsx` routes `Splash → Onboarding → ConnectGrabAccount`. Change to `Splash → ConnectGrabAccount`
- `S06_VoiceListening` is currently a `transparentModal`. This stays. But a new `VoiceContext` + `FloatingMicButton` component must be added so any screen can trigger it
- The `BottomNavBar` component currently has `activeTab="home"|"history"|"account"`. It needs a fourth tab: `food` and the nav must be updated to 4 tabs: Home (mic icon), Food (utensils), Ride (car), Settings (cog)

**OUTPUT — produce all of these files in full:**

```
FILE 1: src/navigation/types.ts
Remove Onboarding from RootStackParamList.
Add: VoiceAssistantIntent: { context: 'platform_select' | 'home' | 'food' | 'ride'; aiGreeting: string }
The final RootStackParamList must be:
  Splash: undefined
  ConnectGrabAccount: undefined
  ProfileSetup: undefined
  Dashboard: undefined
  VoiceAssistant: { initialPromptHint?: string }
  VoiceAssistantIntent: { context: 'platform_select' | 'home' | 'food' | 'ride'; aiGreeting: string }
  VoiceProcessing: { userText: string }
  VoiceSpeaking: { userText: string; aiText: string }
  VoiceError: undefined
  RestaurantSelection: { intent: Intent }
  OrderConfirmation: { orderId: string; partner: PartnerCode; mode?: 'confirm' | 'view' }
  FoodTracking: { orderId: string; intent: Intent }
  RideTracking: { orderId: string; intent: Intent }
  CancellationAlert: { orderId: string; intent: Intent }
  DeliverySuccess: { orderId: string }
  RatingScreen: { orderId: string }
  OrderHistory: undefined
  Settings: undefined

FILE 2: src/contexts/VoiceContext.tsx
Create a React context + provider that:
  - Stores: isVoiceOpen: boolean, currentAiGreeting: string, voiceContext: string
  - Provides: openVoice(context, aiGreeting) — navigates to 'VoiceAssistantIntent' with those params
  - Provides: closeVoice() — navigation.goBack()
  All navigation done via useNavigation hook inside the provider.
  Export: VoiceProvider, useVoice

FILE 3: src/components/FloatingMicButton/index.tsx
A standalone component that:
  - Renders a circle 88×88px, bg theme.colors.primary, borderRadius full, mic icon white 40px
  - LIQUID GLASS style: backdrop blur effect using a View with 
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)'
    backgroundColor: 'rgba(0,177,79,0.85)'
    shadow: shadowColor primary, offset {0,10}, opacity 0.35, radius 24, elevation 10
  - Has a continuous idle breathing animation: Animated scale 1.0 → 1.04 → 1.0, 2200ms loop, useNativeDriver:true
  - Props: onPress: () => void; style?: ViewStyle; size?: number (default 88)
  - The ring around the button: 3 concentric Animated.View circles (not borders), bg primary at opacity 0.12, 0.07, 0.03, sizes +24, +48, +72 from button. All scale from 1.0 → 1.08 loop, staggered 400ms apart
  - accessibilityRole="button", accessibilityLabel="Nhấn để nói với AI"
  Export default FloatingMicButton

FILE 4: src/components/BottomNavBar/index.tsx (REPLACE ENTIRELY)
4-tab nav bar:
  tabs = [
    { key: 'home', icon: 'home', label: 'Trang chủ' },
    { key: 'food', icon: 'food', label: 'Đặt đồ ăn' },
    { key: 'ride', icon: 'car', label: 'Đặt xe' },
    { key: 'settings', icon: 'cog', label: 'Cài đặt' },
  ]
  Props: activeTab: 'home' | 'food' | 'ride' | 'settings'; onTabPress: (tab: string) => void
  Height 72px, bg white, borderTop 1px #E5E7EB
  Active tab: icon + label both #00B14F, small 3×24px pill bar above icon bg #00B14F
  Inactive: icon + label both #9CA3AF
  All icons from MaterialCommunityIcons, size 26px
  Each tab: TouchableOpacity, minHeight 56px, justifyContent center, alignItems center, flex 1
  accessibilityRole="tab" on each tab

FILE 5: src/navigation/RootNavigator.tsx (REPLACE ENTIRELY)
Remove all Onboarding references.
Import VoiceProvider from contexts/VoiceContext.
Wrap Stack.Navigator in <VoiceProvider>.
initialRouteName="Splash"
Screens and options:
  Splash:                  headerShown: false
  ConnectGrabAccount:      headerShown: false
  ProfileSetup:            headerShown: false
  Dashboard:               headerShown: false
  VoiceAssistant:          presentation: 'transparentModal', animation: 'fade', headerShown: false
  VoiceAssistantIntent:    presentation: 'transparentModal', animation: 'fade', headerShown: false
  VoiceProcessing:         presentation: 'transparentModal', animation: 'fade', headerShown: false
  VoiceSpeaking:           presentation: 'transparentModal', animation: 'fade', headerShown: false
  VoiceError:              presentation: 'transparentModal', animation: 'fade', headerShown: false
  RestaurantSelection:     headerShown: false
  OrderConfirmation:       headerShown: false
  FoodTracking:            headerShown: false
  RideTracking:            headerShown: false
  CancellationAlert:       presentation: 'modal', headerShown: false, gestureEnabled: false
  DeliverySuccess:         headerShown: false
  RatingScreen:            headerShown: false
  OrderHistory:            headerShown: false
  Settings:                headerShown: false
```

No explanation. Full files only.

---

## PROMPT 2 — S01 Splash: Update navigation target

**GOAL:** Remove the `Onboarding` navigation from `useSplash.hook.ts`. After 2200ms, replace to `ConnectGrabAccount` directly, not Onboarding.

**CONTEXT:**
```
Current useSplash.hook.ts:
  navigation.replace('Onboarding')  ← change to navigation.replace('ConnectGrabAccount')
```

The `S01_Splash/index.tsx` visual design is already good — do NOT touch it.
The `S01_Splash/splash.service.ts` is already good — do NOT touch it.

**OUTPUT:**
```
FILE: src/screens/S01_Splash/useSplash.hook.ts
Only change: navigation.replace('Onboarding') → navigation.replace('ConnectGrabAccount')
Output the full file. No other changes.
```

---

## PROMPT 3 — Delete S02 Onboarding

**GOAL:** Remove the S02 Onboarding screen entirely. Clean up all references.

**CONTEXT:** The files to delete are:
- `src/screens/S02_Onboarding/index.tsx`
- `src/screens/S02_Onboarding/onboarding.service.ts`
- `src/screens/S02_Onboarding/useOnboarding.hook.ts`

**OUTPUT:**
```
No files to output — this prompt instructs deletion only.
Run in terminal:
  rm -rf src/screens/S02_Onboarding

Then verify no remaining import of S02_Onboarding or 'Onboarding' route exists in:
  - src/navigation/RootNavigator.tsx (already fixed in Prompt 1)
  - src/navigation/types.ts (already fixed in Prompt 1)
  - src/screens/S01_Splash/useSplash.hook.ts (already fixed in Prompt 2)
```

---

## PROMPT 4 — S03 Login: Voice-first platform selection

**GOAL:** Replace the visual grid + button login screen with a voice-first experience. The AI speaks first, listing the platforms. The user responds by voice. Upon completion, navigate to ProfileSetup. Keep the visual fallback buttons for accessibility.

**CONTEXT:**
- Current `S03_Login/index.tsx` shows a visual grid of 4 partner tiles (Grab, Be, XanhSM, ShopeeFood) and a "Connect with Grab" button
- Current `useLogin.hook.ts` has `handleConnect → ProfileSetup` and `handleSkip → ProfileSetup`
- The new experience: when the screen mounts, the AI voice says: *"Xin chào! Tôi là AccessAI. Vui lòng chọn nền tảng bạn dùng: Grab, Be, Xanh SM, hoặc ShopeeFood."* Then waits for voice input
- The screen must auto-open the VoiceAssistant modal with context `'platform_select'` after a 600ms delay (to let the screen render)
- Visual fallback: still show the 4 platform tiles for users who want to tap instead of speak
- After any platform tap or voice recognition of a platform name → `navigation.navigate('ProfileSetup')`

**OUTPUT — produce all three files in full:**

```
FILE 1: src/screens/S03_Login/login.service.ts
Add:
  export const PLATFORM_AI_GREETING = 
    'Xin chào! Tôi là AccessAI. Vui lòng chọn nền tảng bạn muốn dùng: Grab, Be, Xanh SM, hoặc ShopeeFood.';
  
  Keep: mockGrabAuth() as-is

FILE 2: src/screens/S03_Login/useLogin.hook.ts
State: loading: boolean, autoOpenedVoice: boolean
On mount (useEffect, runs once):
  - After 600ms: call navigation.navigate('VoiceAssistantIntent', { 
      context: 'platform_select', 
      aiGreeting: PLATFORM_AI_GREETING 
    })
  - Set autoOpenedVoice = true
  - AccessibilityInfo.announceForAccessibility(PLATFORM_AI_GREETING)
handleConnect (tap): setLoading true → mockGrabAuth() → setLoading false → navigation.navigate('ProfileSetup')
handleSkip: navigation.navigate('ProfileSetup')
handleBack: navigation.goBack()
ViewModel: { loading, handleConnect, handleSkip, handleBack, autoOpenedVoice }

FILE 3: src/screens/S03_Login/index.tsx
Layout: BrandedBackground > SafeAreaView edges=['top','bottom']

Structure:
  TOP (paddingHorizontal 24, paddingTop 16):
    SuaraLogo size="sm" centered, marginBottom 24
    
    AI SPEAK CARD — the "liquid glass" AI greeting card:
      View style:
        backgroundColor: 'rgba(0,177,79,0.08)'
        borderRadius: 24
        borderWidth: 1.5
        borderColor: 'rgba(0,177,79,0.25)'
        padding: 20
        marginBottom: 28
        shadowColor: '#00B14F', shadowOffset:{0,4}, shadowOpacity:0.12, shadowRadius:16, elevation:4
      Inside:
        Row (alignItems center, marginBottom 10):
          View 32×32 bg='rgba(0,177,79,0.15)' borderRadius 16:
            MaterialCommunityIcons 'robot' 18px #00B14F
          Text "ACCESSAI NÓI" — 11px weight:700 #00B14F letterSpacing:1.2 textTransform uppercase, marginLeft 8
        Text PLATFORM_AI_GREETING — fontSize:18 fontWeight:'500' color theme.colors.textPrimary lineHeight:27

  PLATFORM TILES (4 tiles in 2×2 grid):
    Each tile: TouchableOpacity, 47% width, aspectRatio:1.1, bg white, borderRadius 20, borderWidth 1.5
    Active (Grab): borderColor #00B14F, bg '#E8F8EF', shadow green
    Locked: bg '#F9FAFB', borderColor '#E5E7EB', opacity 0.6
    Content center: logo image (Grab) or MaterialCommunityIcons icon + Text name + Text 'Sắp ra mắt' if locked
    accessibilityRole="button" on each

  VOICE HINT (centered, marginTop 20):
    Row: MaterialCommunityIcons 'microphone' 16px #00B14F | Text 'Hoặc nói tên nền tảng bạn muốn' — 14px #6B7280

  FOOTER (paddingHorizontal 24, paddingBottom insets.bottom+20):
    PrimaryButton label={loading ? 'Đang kết nối...' : 'Kết nối với Grab'} onPress={handleConnect} disabled={loading}
    TouchableOpacity onPress={handleSkip} height 48 justifyContent center alignItems center:
      Text 'Thử trước, kết nối sau' — 15px #6B7280 fontWeight:500
```

No explanation. Full files only.

---

## PROMPT 5 — VoiceAssistantIntent: Context-aware AI-speaks-first overlay

**GOAL:** Create a new screen `VoiceAssistantIntent` that the app navigates to when it wants the AI to speak first with a specific greeting based on context (`platform_select`, `home`, `food`, `ride`). This is the "AI-initiates" version of VoiceAssistant. It renders the same dark overlay but the AI text card appears immediately before any mic input.

**CONTEXT:**
- Route params: `{ context: 'platform_select' | 'home' | 'food' | 'ride'; aiGreeting: string }`
- The AI greeting is displayed immediately in a glowing card
- After 1200ms, the mic auto-activates (transitions to VoiceProcessing with the greeting echo as the user "heard" it)
- The user can tap the mic early to speak immediately
- The X button always exits to the previous screen
- This replaces the cold-start VoiceAssistant flow for all AI-initiated conversations

**OUTPUT — produce all files in full:**

```
FILE 1: src/screens/S_VoiceAssistantIntent/useVoiceAssistantIntent.hook.ts
Route: 'VoiceAssistantIntent', params: { context, aiGreeting }

State: phase: 'ai_speaking' | 'listening' | 'done' (starts at 'ai_speaking')

On mount:
  1. AccessibilityInfo.announceForAccessibility(aiGreeting)
  2. After 1200ms: setPhase('listening')
  3. After 1200ms + 3000ms (4200ms total from mount): navigate to VoiceProcessing with:
       userText based on context:
         'platform_select' → 'Grab'
         'home' → 'Tôi muốn đặt đồ ăn'
         'food' → 'Tôi muốn đặt phở bò'
         'ride' → 'Đặt xe đến Bến Thành'

onDismiss: navigation.goBack()
onMicPress (when phase==='listening'): immediately navigate to VoiceProcessing with context-appropriate userText (same mapping)

Return ViewModel: { phase, aiGreeting, context, onDismiss, onMicPress }
Cleanup all timers in useEffect return.

FILE 2: src/screens/S_VoiceAssistantIntent/index.tsx
Root: View flex:1 bg='rgba(8,20,12,0.94)'

Uses same visual structure as S06_VoiceListening dark overlay.

LIQUID GLASS AI CARD (position at upper-center, appears when phase==='ai_speaking' OR 'listening'):
  Animated.View, entrance: opacity 0→1 + translateY 20→0 over 400ms on mount
  Style:
    marginHorizontal: 24, marginTop: insets.top + 70
    backgroundColor: 'rgba(255,255,255,0.06)'
    borderRadius: 28
    borderWidth: 1.5
    borderColor: 'rgba(0,177,79,0.3)'
    padding: 24
    backdropFilter: 'blur(20px)'  (note: RN doesn't support this natively — use BlurView from expo-blur if available, else simulate with layered semi-transparent views)
    shadowColor: '#00B14F', shadowOffset:{0,8}, shadowOpacity:0.2, shadowRadius:24, elevation:8
  
  Inside card:
    Row alignItems center mb 12:
      Animated pulsing green dot (8×8, bg #00B14F, borderRadius 4, opacity 0.4→1 loop 800ms) when phase='ai_speaking'
      Animated static dot when phase='listening'
      Text 'ACCESSAI NÓI' — 11px weight:700 color:'rgba(0,177,79,0.9)' letterSpacing:1.5 uppercase, ml 10
    Text aiGreeting — fontSize:22 fontWeight:'500' color:'rgba(255,255,255,0.95)' lineHeight:33

MIC AREA (flex:1 justifyContent:center alignItems:center):
  When phase==='ai_speaking':
    AudioVisualizer active={true} (shows AI is speaking)
    Below visualizer (marginTop 20): Text 'AI đang nói...' — 14px color:'rgba(255,255,255,0.5)'

  When phase==='listening':
    Standard ripple rings + 116×116 mic button (same as S06_VoiceListening)
    Text 'Nói ngay bây giờ' — 14px color:'rgba(255,255,255,0.7)' marginTop 56

X DISMISS (position:absolute, top:insets.top+12, right:20):
  48×48 circle, bg:'rgba(255,255,255,0.10)', borderRadius:24
  MaterialCommunityIcons 'close' size:22 color:white
  onPress={onDismiss}
  accessibilityRole="button", accessibilityLabel="Đóng và quay lại"

Add route to RootNavigator (already done in Prompt 1 — just add the Screen component reference).
```

No explanation. Full files only.

---

## PROMPT 6 — S05 Dashboard: Voice-first, mic-centered, clean

**GOAL:** Completely rebuild the Dashboard. Remove the 2×2 grid of action cards. The new dashboard has ONE central large mic button, a minimal greeting, and the 4-tab bottom nav (Home, Food, Ride, Settings). When the screen appears, after 800ms the AI greets the user via voice. The mic is surrounded by ambient rings.

**CONTEXT:**
- Current `S05_Dashboard/index.tsx` has: header row with avatar, FlatList of action cards (2-column), floating mic FAB, BottomNavBar
- Current `S05_Dashboard/useDashboard.hook.ts` has: `userName`, `actions`, `micState`, `onMicPress`, `onActionPress`, `onTabPress`
- New dashboard: No action grid. No FlatList. Only the mic + greeting text + bottom nav
- When dashboard mounts for the first time after onboarding, auto-open VoiceAssistantIntent with context='home' after 800ms
- The bottom nav tabs for 'food' and 'ride' directly navigate to VoiceAssistantIntent with the relevant context

**OUTPUT — produce all three files in full:**

```
FILE 1: src/screens/S05_Dashboard/dashboard.service.ts
Keep PARTNER_LABEL as-is if it exists.
ADD:
  export const HOME_AI_GREETING = 'Xin chào! Hôm nay bạn cần gì? Đặt đồ ăn, gọi xe, hay xem lịch sử đơn hàng?'
  export const FOOD_AI_GREETING = 'Bạn muốn đặt món gì hôm nay? Hãy nói tên món hoặc nhà hàng.'
  export const RIDE_AI_GREETING = 'Bạn muốn đi đâu? Hãy nói địa điểm bạn muốn đến.'

FILE 2: src/screens/S05_Dashboard/useDashboard.hook.ts
State: hasGreeted: boolean (local state, starts false)

On mount (useEffect, runs once):
  After 800ms:
    if (!hasGreeted):
      setHasGreeted(true)
      navigation.navigate('VoiceAssistantIntent', {
        context: 'home',
        aiGreeting: HOME_AI_GREETING,
      })

onMicPress: navigate to 'VoiceAssistantIntent' { context: 'home', aiGreeting: HOME_AI_GREETING }

onTabPress(tab):
  'home' → no-op (already on dashboard)
  'food' → navigate to 'VoiceAssistantIntent' { context: 'food', aiGreeting: FOOD_AI_GREETING }
  'ride' → navigate to 'VoiceAssistantIntent' { context: 'ride', aiGreeting: RIDE_AI_GREETING }
  'settings' → navigate to 'Settings'

onHistoryPress: navigate to 'OrderHistory'

ViewModel: { userName: 'Minh', onMicPress, onTabPress, onHistoryPress, hasGreeted }

FILE 3: src/screens/S05_Dashboard/index.tsx
Imports: React, Animated, StyleSheet, Text, TouchableOpacity, View, StatusBar
Import: SafeAreaView, useSafeAreaInsets
Import: MaterialCommunityIcons
Import: useDashboard
Import: FloatingMicButton from ../../components/FloatingMicButton
Import: BottomNavBar
Import: BrandedBackground

Root: BrandedBackground variant="default" > StatusBar style="dark" / SafeAreaView edges=['top'] flex:1

LAYOUT: View flex:1 (column, space-between):

  TOP BAR (height:56, paddingHorizontal:20, flexDirection:row, alignItems:center, justifyContent:space-between):
    SuaraLogo size="sm"
    TouchableOpacity 48×48 onPress={onHistoryPress} accessibilityLabel="Lịch sử đơn hàng":
      MaterialCommunityIcons 'history' 24px theme.colors.textSecondary

  CENTER AREA (flex:1, justifyContent:center, alignItems:center):
    Text 'Xin chào, {userName}' — fontSize:26 fontWeight:'700' color:theme.colors.textPrimary textAlign:center marginBottom:8
    Text 'Nhấn mic và nói điều bạn cần' — fontSize:17 color:theme.colors.textSecondary textAlign:center marginBottom:52

    MIC ZONE (relative, width:240, height:240, justifyContent:center, alignItems:center):
      FloatingMicButton onPress={onMicPress} size={96}
      (The ambient rings are inside FloatingMicButton already)
    
    STATUS HINT (marginTop:32, flexDirection:row, alignItems:center, gap:8):
      View 8×8 bg:'rgba(0,177,79,0.6)' borderRadius:4
      Text 'AI sẵn sàng lắng nghe' — fontSize:14 color:theme.colors.textMuted

  BOTTOM NAV (SafeAreaView edges=['bottom']):
    BottomNavBar activeTab="home" onTabPress={onTabPress}

StyleSheet rules:
  All background: transparent (BrandedBackground provides the bg)
  No card shadows in center — the mic button already has its own shadow
  The StatusBar is set to 'dark' since BrandedBackground is light
```

No explanation. Full files only.

---

## PROMPT 7 — Global Mic Integration: FloatingMicButton on every non-voice screen

**GOAL:** Add a `FloatingMicButton` FAB to every screen that is NOT a voice overlay. The button appears at bottom-right (`position: absolute, bottom: 96, right: 20`) above the bottom nav bar when present. Each screen's FAB calls `useVoice().openVoice(...)` with an appropriate context and greeting.

**CONTEXT:**
- Screens that need the FAB added: `S10_OrderConfirmation`, `S11_RestaurantSelection`, `S12_FoodTracking`, `S13_RideTracking`, `S15_DeliverySuccess`, `S16_RatingScreen`, `S17_OrderHistory`
- Screens that do NOT need FAB: S01 Splash, S03 Login, S04 ProfileSetup, S05 Dashboard (has its own center mic), S06-S09 voice overlays, S14 CancellationAlert (modal)
- The FAB is always 72×72px (smaller variant of FloatingMicButton) in these screens
- Each FAB navigates to `'VoiceAssistantIntent'` with context-appropriate greeting

**OUTPUT — for each screen below, output ONLY the `index.tsx` change. Do NOT touch hooks or services.**

```
RULE FOR ALL SCREENS:
Add at the end of the root View/SafeAreaView, BEFORE the closing tag:
  {/* Global Voice FAB */}
  <TouchableOpacity
    style={styles.voiceFab}
    onPress={() => navigation.navigate('VoiceAssistantIntent', { 
      context: 'home', 
      aiGreeting: 'Bạn cần trợ giúp gì? Tôi có thể đặt lại hoặc thay đổi đơn hàng cho bạn.' 
    })}
    accessibilityRole="button"
    accessibilityLabel="Nhấn để nói với AI"
  >
    <MaterialCommunityIcons name="microphone" size={32} color="white" />
  </TouchableOpacity>

Add to StyleSheet of each screen:
  voiceFab: {
    position: 'absolute',
    bottom: 96,  // above bottom nav if present; use 24 for screens without bottom nav
    right: 20,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  }

EACH SCREEN gets useNavigation added if not already imported:
  import { useNavigation } from '@react-navigation/native'
  import { NativeStackNavigationProp } from '@react-navigation/native-stack'
  import { RootStackParamList } from '../../navigation/types'
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

Output the full updated index.tsx for:
  src/screens/S10_OrderConfirmation/index.tsx
  src/screens/S11_RestaurantSelection/index.tsx
  src/screens/S12_FoodTracking/index.tsx
  src/screens/S13_RideTracking/index.tsx
  src/screens/S15_DeliverySuccess/index.tsx
  src/screens/S16_RatingScreen/index.tsx
  src/screens/S17_OrderHistory/index.tsx
```

No explanation. Full files only.

---

## PROMPT 8 — Liquid Glass AI Card: Shared Component

**GOAL:** Create a reusable `AIBubble` component that replaces all existing "AI NÓI" card implementations across the app. It uses the liquid glass aesthetic: semi-transparent frosted background, green glow border, elegant typography.

**CONTEXT:**
- Current implementations scattered: `S08_VoiceSpeaking` has `styles.aiCard` with `backgroundColor: theme.colors.primarySoft`, `S11_RestaurantSelection` has `aiMessageCard`, `S06_VoiceAssistant` has inline AI card styles
- These are all being replaced by one canonical component
- "Liquid glass" in React Native: simulate with layered semi-transparent Views + colored borders + shadow. No actual `backdrop-filter` support in RN — use `backgroundColor: 'rgba(0,177,79,0.07)'` on light backgrounds and `'rgba(255,255,255,0.06)'` on dark backgrounds.

**OUTPUT:**

```
FILE: src/components/AIBubble/index.tsx

Props:
  text: string                          — the AI's message
  variant?: 'light' | 'dark'           — 'light' = on white bg, 'dark' = on dark overlay bg (default: 'light')
  label?: string                        — overrides the "ACCESSAI NÓI" label (optional)
  style?: ViewStyle                     — outer container override
  animated?: boolean                    — if true, text fades in word-by-word (default: false for now, use simple fade-in)
  accessibilityLiveRegion?: 'polite' | 'assertive'   (default: 'polite')

LIGHT VARIANT styles:
  container: {
    backgroundColor: 'rgba(0,177,79,0.07)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(0,177,79,0.22)',
    padding: 20,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  }
  label: { fontSize:11, fontWeight:'700', color:'#00B14F', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }
  text:  { fontSize:20, fontWeight:'500', color:'#111827', lineHeight:30 }

DARK VARIANT styles:
  container: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(0,177,79,0.28)',
    padding: 22,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  }
  label: { fontSize:11, fontWeight:'700', color:'rgba(0,177,79,0.9)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }
  text:  { fontSize:22, fontWeight:'600', color:'rgba(255,255,255,0.95)', lineHeight:34 }

ENTRANCE ANIMATION: Animated.Value opacity 0→1, translateY 12→0, duration:350ms ease-out, runs on mount.
Wrap entire container in Animated.View with these transforms.

ACCESSIBILITY:
  accessibilityRole="text"
  accessibilityLabel={`AI nói: ${text}`}
  accessibilityLiveRegion={accessibilityLiveRegion}

After creating AIBubble, update these files to USE it (replacing their inline AI card code):
  src/screens/S08_VoiceSpeaking/index.tsx — replace aiCard View with <AIBubble text={aiText} variant="dark" />
  src/screens/S11_RestaurantSelection/index.tsx — replace aiMessageCard View with <AIBubble text="Tôi tìm thấy 3 nhà hàng phù hợp. Bạn muốn đặt từ đâu?" variant="light" style={{marginHorizontal:20, marginBottom:16}} />
  src/screens/S_VoiceAssistantIntent/index.tsx — replace the manual liquid glass card with <AIBubble text={aiGreeting} variant="dark" style={{marginHorizontal:24, marginTop:insets.top+70}} />
```

No explanation. Full files only.

---

## PROMPT 9 — S08 VoiceSpeaking: Intent-based navigation routing

**GOAL:** The `useVoiceSpeaking.hook.ts` currently always navigates to `OrderConfirmation` on confirm. It must now route intelligently based on the voice context. Add a `context` parameter passed through the voice chain so the confirmation knows where to go.

**CONTEXT:**
- Current flow: VoiceAssistant → VoiceProcessing → VoiceSpeaking → always OrderConfirmation
- New flow: VoiceAssistantIntent (with context) → VoiceProcessing → VoiceSpeaking → routes based on context
- `VoiceProcessing` needs to pass its `context` (if available) through to `VoiceSpeaking`
- `VoiceSpeaking` routes: if context='food' → RestaurantSelection; if context='ride' → RideTracking (mock); if context='home' → RestaurantSelection (default); if context='platform_select' → ProfileSetup

**OUTPUT — produce these files in full:**

```
FILE 1: src/navigation/types.ts
Update VoiceProcessing params: { userText: string; context?: string }
Update VoiceSpeaking params:   { userText: string; aiText: string; context?: string }

FILE 2: src/screens/S07_VoiceProcessing/useVoiceProcessing.hook.ts
Read context from route.params (optional).
Pass context to VoiceSpeaking navigate call:
  navigation.navigate('VoiceSpeaking', { 
    userText, 
    aiText: 'Tôi tìm thấy Phở Hà Nội. Phở Bò Tái 65.000đ, giao 25 phút. Xác nhận không?',
    context: route.params.context,  // pass through
  })

FILE 3: src/screens/S08_VoiceSpeaking/useVoiceSpeaking.hook.ts
Read context from route.params.
onConfirm routes:
  context === 'platform_select' → navigation.navigate('ProfileSetup')
  context === 'food' OR context === 'home' OR undefined → navigation.navigate('OrderConfirmation', { orderId: 'mock-food-001', partner: PartnerCode.GRAB, mode: 'confirm' })
  context === 'ride' → navigation.navigate('RideTracking', { orderId: 'mock-ride-001', intent: { type: OrderType.RIDE, origin: '123 Lê Lợi, Q.1', destination: 'Bến Thành Market' } })
onCancel and onDismiss: navigation.navigate('Dashboard')
Return ViewModel now includes context.

FILE 4: src/screens/S08_VoiceSpeaking/index.tsx
Only change: replace aiCard View with <AIBubble text={aiText} variant="dark" /> (from Prompt 8)
Do not change any other logic.
Output full file.
```

No explanation. Full files only.

---

## PROMPT 10 — Real expo-speech-recognition integration in S06 + S_VoiceAssistantIntent

**GOAL:** The S06 VoiceListening currently uses a 3000ms fake timer to mock speech input. Integrate `expo-speech-recognition` (already in `app.json` plugins) to capture real voice input. When recognition fires a result, navigate to VoiceProcessing with the real transcript.

**CONTEXT:**
- `app.json` already has `"expo-speech-recognition"` in plugins array and Android microphone permission
- Package: `expo-speech-recognition` (Expo SDK 56 compatible — check AGENTS.md)
- The recognition result replaces the hard-coded `'Đặt phở bò từ Phở Hà Nội'` userText
- If recognition fails or times out (8 seconds), navigate to VoiceError
- The user can also tap the mic button while listening to stop early and process what was heard

**OUTPUT:**

```
FILE: src/screens/S06_VoiceListening/useVoiceListening.hook.ts

Import: ExpoSpeechRecognitionModule, useSpeechRecognitionEvent from 'expo-speech-recognition'

On mount:
  1. AccessibilityInfo.announceForAccessibility('Đang nghe. Hãy nói ngay.')
  2. Start recognition:
       ExpoSpeechRecognitionModule.start({
         lang: 'vi-VN',
         interimResults: false,
         maxAlternatives: 1,
       })
  3. Set 8-second fallback timer: if no result by 8s, navigate to 'VoiceError'

useSpeechRecognitionEvent('result', (event) => {
  const transcript = event.results[0]?.transcript ?? '';
  if (transcript.length > 0) {
    clearFallbackTimer();
    navigation.navigate('VoiceProcessing', { 
      userText: transcript,
      context: route.params?.context ?? 'home',
    });
  }
})

useSpeechRecognitionEvent('error', (event) => {
  clearFallbackTimer();
  navigation.navigate('VoiceError');
})

onDismiss: ExpoSpeechRecognitionModule.stop(); clearFallbackTimer(); navigation.goBack()
onMicPress: same as onDismiss (stop and go back)

Clean up: on unmount, call ExpoSpeechRecognitionModule.stop() and clearFallbackTimer()

ViewModel: { phase, onDismiss, onMicPress, initialPromptHint }
(phase still works: 'listening' always while this screen is mounted)

Also update the 'VoiceAssistant' route params in types.ts to include optional context:
  VoiceAssistant: { initialPromptHint?: string; context?: string }
```

No explanation. Full file only. Note: if expo-speech-recognition API differs from above, adapt to the actual API from the Expo v56 docs.

---

## PROMPT 11 — S04 ProfileSetup: Voice-guided accessibility onboarding

**GOAL:** When ProfileSetup mounts, the AI greets the user and guides them through accessibility setup via voice. The screen still shows the visual toggle cards, but the AI speaks first and the user can respond by voice ("yes visual", "no", "slow speed", etc.).

**CONTEXT:**
- Current `S04_ProfileSetup/index.tsx` shows toggle cards for visual/motor/handsFree modes + speed chips
- Current `useProfileSetup.hook.ts` has `modes`, `speed`, `toggleMode`, `setSpeed`, `handleSave`
- New: on mount, after 500ms, navigate to VoiceAssistantIntent with:
    `context: 'home'`
    `aiGreeting: 'Chào mừng bạn đến với AccessAI! Tôi sẽ điều chỉnh giao diện theo nhu cầu của bạn. Bạn có bị khiếm thị không?'`
- After the voice overlay closes (back to ProfileSetup), the user sees the visual toggles to confirm/adjust
- The "Save & Continue" button navigates to Dashboard

**OUTPUT:**

```
FILE: src/screens/S04_ProfileSetup/useProfileSetup.hook.ts
Add: hasGreeted: boolean state, starts false
On mount after 500ms:
  if (!hasGreeted):
    setHasGreeted(true)
    navigation.navigate('VoiceAssistantIntent', {
      context: 'home',
      aiGreeting: 'Chào mừng bạn đến với AccessAI! Tôi sẽ điều chỉnh giao diện theo nhu cầu của bạn. Bạn có bị khiếm thị không?'
    })

handleSave: save to useProfileStore → navigation.replace('Dashboard')
All other logic unchanged.
Output full file.
```

No explanation. Full file only.

---

## PROMPT 12 — Settings Screen

**GOAL:** Create a minimal `Settings` screen (S_Settings) accessible via the bottom nav "Settings" tab. It shows accessibility mode toggles (re-using ProfileSetup state from useProfileStore), speaking speed, and an "About" section. Has a floating mic FAB.

**CONTEXT:**
- Route: `'Settings'`, params: `undefined`
- Bottom nav tab 'settings' navigates here from Dashboard
- Reads and writes to `useProfileStore` directly
- No heavy form logic — just expose the same toggles from S04

**OUTPUT — produce all three files in full:**

```
FILE 1: src/screens/S_Settings/settings.service.ts
export const SETTINGS_SECTIONS = {
  accessibility: 'Trợ năng',
  voice: 'Giọng nói',
  about: 'Giới thiệu',
}
export const ABOUT_TEXT = 'AccessAI v1.0 — Được xây dựng cho Grab the Future Hackathon 2026. Giải pháp đặt xe và đồ ăn bằng giọng nói cho người khuyết tật.'

FILE 2: src/screens/S_Settings/useSettings.hook.ts
Read/write useProfileStore.
onBack: navigation.goBack()
onMicPress: navigation.navigate('VoiceAssistantIntent', { context: 'home', aiGreeting: 'Bạn muốn thay đổi cài đặt nào?' })
ViewModel: { modes, speed, toggleMode, setSpeed, onBack, onMicPress }

FILE 3: src/screens/S_Settings/index.tsx
BrandedBackground > SafeAreaView edges=['top','bottom']
ScreenHeader title="Cài đặt" showLogo={false} onBack={onBack}

ScrollView paddingHorizontal:20 paddingBottom:120:
  Same toggle cards as S04 for accessibility modes
  Same speed chips as S04
  
  ABOUT SECTION (marginTop:32):
    Text 'GIỚI THIỆU' — 11px weight:700 #9CA3AF letterSpacing:0.9 textTransform uppercase marginBottom:12
    View bg:white borderRadius:20 padding:20 shadow.sm:
      Text ABOUT_TEXT — 15px color:#374151 lineHeight:22

Voice FAB: voiceFab style, onPress={onMicPress}, bottom:24 (no bottom nav on this screen)

Add to RootNavigator (already done in Prompt 1).
```

No explanation. Full files only.

---

## PROMPT 13 — Final Navigator + Dead Link Audit

**GOAL:** Final pass to ensure all navigation links are valid, all screens are registered, and the flow from `S01 → S03 → S04 → S05` works without any Onboarding references. Also ensure `S_VoiceAssistantIntent` and `S_Settings` are imported and registered.

**CONTEXT:**
This is a verification + wiring pass. All screens were created in previous prompts.

**OUTPUT:**

```
FILE 1: src/navigation/RootNavigator.tsx (FINAL VERSION)
Import and register every screen:
  SplashScreen                  from '../screens/S01_Splash'
  LoginScreen                   from '../screens/S03_Login'
  ProfileSetupScreen            from '../screens/S04_ProfileSetup'
  DashboardScreen               from '../screens/S05_Dashboard'
  VoiceListeningScreen          from '../screens/S06_VoiceListening'
  VoiceProcessingScreen         from '../screens/S07_VoiceProcessing'
  VoiceSpeakingScreen           from '../screens/S08_VoiceSpeaking'
  VoiceErrorScreen              from '../screens/S09_VoiceError'
  OrderConfirmationScreen       from '../screens/S10_OrderConfirmation'
  RestaurantSelectionScreen     from '../screens/S11_RestaurantSelection'
  FoodTrackingScreen            from '../screens/S12_FoodTracking'
  RideTrackingScreen            from '../screens/S13_RideTracking'
  CancellationAlertScreen       from '../screens/S14_CancellationAlert'
  DeliverySuccessScreen         from '../screens/S15_DeliverySuccess'
  RatingScreen                  from '../screens/S16_RatingScreen'
  OrderHistoryScreen            from '../screens/S17_OrderHistory'
  VoiceAssistantIntentScreen    from '../screens/S_VoiceAssistantIntent'
  SettingsScreen                from '../screens/S_Settings'

Wrap Stack.Navigator in VoiceProvider from '../contexts/VoiceContext'.
initialRouteName: "Splash"
All screen options as defined in Prompt 1.
Verify: NO reference to 'Onboarding' anywhere.

FILE 2: src/navigation/types.ts (FINAL VERSION)
Complete RootStackParamList as defined in Prompt 1 + VoiceProcessing and VoiceSpeaking updated with optional context from Prompt 9.
Final shape:
  Splash: undefined
  ConnectGrabAccount: undefined
  ProfileSetup: undefined
  Dashboard: undefined
  VoiceAssistant: { initialPromptHint?: string; context?: string }
  VoiceAssistantIntent: { context: 'platform_select' | 'home' | 'food' | 'ride'; aiGreeting: string }
  VoiceProcessing: { userText: string; context?: string }
  VoiceSpeaking: { userText: string; aiText: string; context?: string }
  VoiceError: undefined
  RestaurantSelection: { intent: Intent }
  OrderConfirmation: { orderId: string; partner: PartnerCode; mode?: 'confirm' | 'view' }
  FoodTracking: { orderId: string; intent: Intent }
  RideTracking: { orderId: string; intent: Intent }
  CancellationAlert: { orderId: string; intent: Intent }
  DeliverySuccess: { orderId: string }
  RatingScreen: { orderId: string }
  OrderHistory: undefined
  Settings: undefined
```

No explanation. Full files only.

---

## Navigation Flow Reference (for verification)

```
S01 Splash (2200ms) 
  → replace → S03 ConnectGrabAccount

S03 Login (mounts)
  → 600ms → navigate(VoiceAssistantIntent, platform_select)
    User says 'Grab' or taps tile → onConfirm in VoiceSpeaking → navigate(ProfileSetup)

S04 ProfileSetup (mounts)
  → 500ms → navigate(VoiceAssistantIntent, home, welcome greeting)
    After voice overlay closes → user sees toggles → handleSave → replace(Dashboard)

S05 Dashboard (mounts)
  → 800ms → navigate(VoiceAssistantIntent, home, home greeting)
  Food tab pressed → navigate(VoiceAssistantIntent, food, food greeting)
  Ride tab pressed → navigate(VoiceAssistantIntent, ride, ride greeting)
  History icon pressed → navigate(OrderHistory)

VoiceAssistantIntent
  → phase='ai_speaking' (AI greeting shown)
  → 1200ms → phase='listening' → mic activates
  → user speaks (or 4200ms timeout) → navigate(VoiceProcessing, {userText, context})

VoiceProcessing
  → 1800ms → navigate(VoiceSpeaking, {userText, aiText, context})

VoiceSpeaking
  → onConfirm → routes by context:
      'platform_select' → ProfileSetup
      'food' / 'home' / undefined → OrderConfirmation
      'ride' → RideTracking
  → onCancel / X → Dashboard

OrderConfirmation → FoodTracking → DeliverySuccess → RatingScreen → Dashboard
RideTracking → DeliverySuccess → RatingScreen → Dashboard
FoodTracking / RideTracking → CancellationAlert → RestaurantSelection OR Dashboard

Every non-voice screen:
  → FloatingMicButton FAB → navigate(VoiceAssistantIntent, home, context-relevant greeting)
```

---

## Accessibility Requirements (non-negotiable, applies to every prompt)

```
1. Every TouchableOpacity/Pressable: accessibilityRole + accessibilityLabel
2. Every status change: AccessibilityInfo.announceForAccessibility()
3. All text ≥ 16px. AI bubble text ≥ 20px. Never smaller.
4. Minimum touch target: 56×56px on interactive elements
5. No emoji characters in JSX or strings — use MaterialCommunityIcons
6. Vietnamese strings for all user-visible text
7. AI always speaks (announces) before user input is requested
8. X dismiss button on every voice overlay, always at top-right
```
