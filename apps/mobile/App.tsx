import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
// import HomeScreen from './src/screens/Home'; // reference implementation, remove after Dashboard + VoiceAssistant ship

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <RootNavigator />
    </NavigationContainer>
  );
}
