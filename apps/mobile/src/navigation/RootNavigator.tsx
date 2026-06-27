import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { VoiceProvider } from '../contexts/VoiceContext';
import DashboardScreen from '../screens/S05_Dashboard';
import SplashScreen from '../screens/S01_Splash';
import LoginScreen from '../screens/S03_Login';
import ProfileSetupScreen from '../screens/S04_ProfileSetup';
import VoiceAssistantScreen from '../screens/S06_VoiceAssistant';
import VoiceAssistantIntentScreen from '../screens/S_VoiceAssistantIntent';
import VoiceProcessingScreen from '../screens/S07_VoiceProcessing';
import VoiceSpeakingScreen from '../screens/S08_VoiceSpeaking';
import VoiceErrorScreen from '../screens/S09_VoiceError';
import OrderConfirmationScreen from '../screens/S10_OrderConfirmation';
import RestaurantSelectionScreen from '../screens/S11_RestaurantSelection';
import FoodTrackingScreen from '../screens/S12_FoodTracking';
import RideTrackingScreen from '../screens/S13_RideTracking';
import CancellationAlertScreen from '../screens/S14_CancellationAlert';
import DeliverySuccessScreen from '../screens/S15_DeliverySuccess';
import RatingScreen from '../screens/S16_RatingScreen';
import OrderHistoryScreen from '../screens/S17_OrderHistory';
import SettingsScreen from '../screens/S_Settings';
import StatsScreen from '../screens/S_Stats';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <VoiceProvider>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ConnectGrabAccount" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />

        <Stack.Screen
          name="VoiceAssistant"
          component={VoiceAssistantScreen}
          options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false }}
        />

        <Stack.Screen
          name="VoiceAssistantIntent"
          component={VoiceAssistantIntentScreen}
          options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false }}
        />

        <Stack.Screen
          name="VoiceProcessing"
          component={VoiceProcessingScreen}
          options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false }}
        />

        <Stack.Screen
          name="VoiceSpeaking"
          component={VoiceSpeakingScreen}
          options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false }}
        />

        <Stack.Screen
          name="VoiceError"
          component={VoiceErrorScreen}
          options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false }}
        />

        <Stack.Screen
          name="RestaurantSelection"
          component={RestaurantSelectionScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="OrderConfirmation"
          component={OrderConfirmationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FoodTracking"
          component={FoodTrackingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RideTracking"
          component={RideTrackingScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="CancellationAlert"
          component={CancellationAlertScreen}
          options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }}
        />

        <Stack.Screen name="DeliverySuccess" component={DeliverySuccessScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RatingScreen" component={RatingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </VoiceProvider>
  );
};
