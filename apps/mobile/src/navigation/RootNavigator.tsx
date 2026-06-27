import React from 'react';
import { Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import DashboardScreen from '../screens/S05_Dashboard';
import SplashScreen from '../screens/S01_Splash';
import OnboardingScreen from '../screens/S02_Onboarding';
import LoginScreen from '../screens/S03_Login';
import ProfileSetupScreen from '../screens/S04_ProfileSetup';

const Stack = createNativeStackNavigator<RootStackParamList>();

const Placeholder = ({ name }: { name: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F9FF' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{name}</Text>
  </View>
);

export const RootNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ConnectGrabAccount" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      
      <Stack.Screen 
        name="VoiceAssistant" 
        component={() => <Placeholder name="VoiceAssistant" />} 
        options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false }}
      />
      
      <Stack.Screen 
        name="RestaurantSelection" 
        component={() => <Placeholder name="RestaurantSelection" />} 
        options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false }}
      />
      
      <Stack.Screen name="OrderConfirmation" component={() => <Placeholder name="OrderConfirmation" />} />
      <Stack.Screen name="FoodTracking" component={() => <Placeholder name="FoodTracking" />} />
      <Stack.Screen name="RideTracking" component={() => <Placeholder name="RideTracking" />} />
      
      <Stack.Screen 
        name="CancellationAlert" 
        component={() => <Placeholder name="CancellationAlert" />} 
        options={{ presentation: 'modal' }}
      />
      
      <Stack.Screen name="DeliverySuccess" component={() => <Placeholder name="DeliverySuccess" />} />
      <Stack.Screen name="RatingScreen" component={() => <Placeholder name="RatingScreen" />} />
      <Stack.Screen name="OrderHistory" component={() => <Placeholder name="OrderHistory" />} />
    </Stack.Navigator>
  );
};
