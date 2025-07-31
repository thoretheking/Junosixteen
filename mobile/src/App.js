// ===================================================
// 📱 JUNOSIXTEEN MOBILE APP
// React Native App für Android & iOS
// ===================================================

import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  Alert,
  Platform
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Context
import { UserProvider } from './context/UserContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import QuizScreen from './screens/QuizScreen';
import ProgressScreen from './screens/ProgressScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';

// Services
import { ApiService } from './services/ApiService';
import { NotificationService } from './services/NotificationService';

// Components
import LoadingScreen from './components/LoadingScreen';
import SplashScreen from './components/SplashScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ===================================================
// 🎨 THEME CONFIGURATION
// ===================================================

const lightTheme = {
  primary: '#667eea',
  secondary: '#764ba2',
  accent: '#f093fb',
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#e1e5e9'
};

const darkTheme = {
  primary: '#667eea',
  secondary: '#764ba2',
  accent: '#f093fb',
  background: '#121212',
  surface: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#333333'
};

// ===================================================
// 🧭 BOTTOM TAB NAVIGATOR
// ===================================================

function TabNavigator() {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Quiz':
              iconName = 'quiz';
              break;
            case 'Progress':
              iconName = 'trending-up';
              break;
            case 'Leaderboard':
              iconName = 'leaderboard';
              break;
            case 'Profile':
              iconName = 'person';
              break;
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8
        },
        headerStyle: {
          backgroundColor: theme.primary,
          elevation: 0,
          shadowOpacity: 0
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18
        }
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Quiz" 
        component={QuizScreen}
        options={{ title: 'Quiz' }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressScreen}
        options={{ title: 'Fortschritt' }}
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        options={{ title: 'Bestenliste' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

// ===================================================
// 📱 MAIN APP COMPONENT
// ===================================================

function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const { theme } = useTheme();
  
  useEffect(() => {
    initializeApp();
  }, []);
  
  const initializeApp = async () => {
    try {
      // Splash Screen anzeigen
      setTimeout(() => setShowSplash(false), 2000);
      
      // Check authentication
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        // Validate token
        const isValid = await ApiService.validateToken(token);
        setIsAuthenticated(isValid);
      }
      
      // Initialize services
      await NotificationService.initialize();
      
      // Get device info
      const deviceInfo = {
        brand: await DeviceInfo.getBrand(),
        model: await DeviceInfo.getModel(),
        systemVersion: await DeviceInfo.getSystemVersion(),
        appVersion: DeviceInfo.getVersion()
      };
      
      console.log('🚀 JunoSixteen Mobile App initialized:', deviceInfo);
      
    } catch (error) {
      console.error('App initialization error:', error);
      Alert.alert('Fehler', 'App konnte nicht initialisiert werden');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (showSplash) {
    return <SplashScreen />;
  }
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <NavigationContainer
      theme={{
        dark: theme === darkTheme,
        colors: {
          primary: theme.primary,
          background: theme.background,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
          notification: theme.accent
        }
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.primary,
            elevation: 0,
            shadowOpacity: 0
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold'
          }
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen 
              name="Main" 
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ 
                title: 'Einstellungen',
                presentation: 'modal'
              }}
            />
          </>
        ) : (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ 
              headerShown: false,
              gestureEnabled: false
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ===================================================
// 🎨 APP WRAPPER WITH PROVIDERS
// ===================================================

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  
  return (
    <SafeAreaProvider>
      <ThemeProvider initialTheme={isDarkMode ? darkTheme : lightTheme}>
        <UserProvider>
          <StatusBar 
            barStyle="light-content"
            backgroundColor="#667eea"
            translucent={false}
          />
          <AppNavigator />
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// ===================================================
// 🎨 STYLES
// ===================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  }
});

console.log('📱 JunoSixteen Mobile App loaded'); 