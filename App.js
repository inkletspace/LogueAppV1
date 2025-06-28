import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { IdeasProvider } from './src/context/IdeasContext';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize app data
    const initializeApp = async () => {
      try {
        // Check if it's first time user
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (!hasLaunched) {
          // Set default data for first time users
          await AsyncStorage.setItem('hasLaunched', 'true');
          await AsyncStorage.setItem('ideas', JSON.stringify([]));
          await AsyncStorage.setItem('categories', JSON.stringify([
            'YouTube', 'TikTok', 'Instagram', 'Fashion', 'Content', 
            'Personal', 'Brain Dumps', 'Food', 'Travel', 'Tech', 
            'Art', 'Music', 'Photography', 'Other'
          ]));
        }
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return null; // You can add a splash screen here later
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <IdeasProvider>
          <NavigationContainer>
            <StatusBar style="dark" backgroundColor="#FAFAFA" />
            <AppNavigator />
          </NavigationContainer>
        </IdeasProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}