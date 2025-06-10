/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens/Components
import WelcomeScreen from './src/screens/WelcomeScreen';
import AvatarSelectionScreen from './src/screens/AvatarSelectionScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import HomeScreen from './src/screens/HomeScreen';
import ModuleScreen from './src/screens/ModuleScreen';
import QuizScreen from './src/screens/QuizScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import AdminScreen from './src/screens/AdminScreen';

// Services
import AuthService from './src/services/AuthService';
import ApiService from './src/services/ApiService';

// Context
import { UserProvider, useUser } from './src/context/UserContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// JunoSixteen Design Colors
const COLORS = {
  primary: '#3B82F6',
  secondary: '#F59E0B', 
  danger: '#EF4444',
  success: '#10B981',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB'
};

// Tab Navigator
function MainTabs() {
  const { user } = useUser();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingTop: 5,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: false,
      }}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Start',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Modules" 
        component={ModuleScreen}
        options={{
          tabBarLabel: 'Module',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📚</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Fortschritt',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        options={{
          tabBarLabel: 'Rangliste',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏆</Text>
          ),
        }}
      />
      {user?.isAdmin && (
        <Tab.Screen 
          name="Admin" 
          component={AdminScreen}
          options={{
            tabBarLabel: 'Admin',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>⚙️</Text>
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image 
          source={require('./assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>JunoSixteen wird geladen...</Text>
    </View>
  );
}

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Onboarding Flow
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Language" component={LanguageSelectionScreen} />
            <Stack.Screen name="Avatar" component={AvatarSelectionScreen} />
          </>
        ) : (
          // Main App
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Main App Component
function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <UserProvider>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        <SafeAreaView style={styles.container}>
          <AppNavigator />
          <DeadlineAlert />
        </SafeAreaView>
      </UserProvider>
    </ThemeProvider>
  );
}

// Deadline Alert Component
function DeadlineAlert() {
  const { user } = useUser();
  const [deadlineInfo, setDeadlineInfo] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (user) {
      checkDeadline();
    }
  }, [user]);

  const checkDeadline = async () => {
    try {
      const response = await ApiService.checkDeadline();
      if (response.hasDeadline) {
        setDeadlineInfo(response);
        if (response.status === 'urgent' || response.status === 'expired') {
          setShowAlert(true);
        }
      }
    } catch (error) {
      console.log('Deadline check error:', error);
    }
  };

  const handleExtensionRequest = () => {
    Alert.prompt(
      'Verlängerung beantragen',
      'Bitte gib einen Grund für die Verlängerung an:',
      async (reason) => {
        if (reason && reason.length >= 10) {
          try {
            await ApiService.requestExtension(reason);
            Alert.alert('Erfolg', 'Verlängerungsanfrage wurde eingereicht');
            setShowAlert(false);
          } catch (error) {
            Alert.alert('Fehler', 'Verlängerungsanfrage konnte nicht eingereicht werden');
          }
        } else {
          Alert.alert('Fehler', 'Bitte gib einen ausführlichen Grund an (mindestens 10 Zeichen)');
        }
      }
    );
  };

  if (!showAlert || !deadlineInfo) return null;

  return (
    <Modal
      visible={showAlert}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowAlert(false)}>
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.alertTitle}>
            {deadlineInfo.status === 'expired' ? '⚠️ Frist abgelaufen!' : '🕐 Frist läuft bald ab!'}
          </Text>
          <Text style={styles.alertMessage}>
            {deadlineInfo.status === 'expired' 
              ? deadlineInfo.message 
              : `Noch ${deadlineInfo.daysRemaining} Tag(e) bis zur Deadline`}
          </Text>
          <View style={styles.alertButtons}>
            {deadlineInfo.canExtend && (
              <TouchableOpacity 
                style={[styles.alertButton, styles.primaryButton]}
                onPress={handleExtensionRequest}>
                <Text style={styles.buttonTextWhite}>Verlängerung beantragen</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.alertButton, styles.secondaryButton]}
              onPress={() => setShowAlert(false)}>
              <Text style={styles.buttonTextDark}>Später erinnern</Text>
            </TouchableOpacity>
        </View>
        </View>
    </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  alertButtons: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
  },
  alertButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.border,
  },
  buttonTextWhite: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDark: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
