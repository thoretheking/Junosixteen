import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import AvatarSelectionScreen from '../screens/AvatarSelectionScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ModuleScreen from '../screens/ModuleScreen';
import BereichScreen from '../screens/BereichScreen';
import GameScreen from '../screens/GameScreen';
import MinigameScreen from '../screens/MinigameScreen';
import GameCompleteScreen from '../screens/GameCompleteScreen';
import FreiwilligePfadeScreen from '../screens/FreiwilligePfadeScreen';
import WissenssnackDetail from '../screens/WissenssnackDetail';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Explore') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Module') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Bereiche') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'FreiwilligePfade') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen}
        options={{ title: 'Entdecken' }}
      />
      <Tab.Screen 
        name="Module" 
        component={ModuleScreen}
        options={{ title: 'Module' }}
      />
      <Tab.Screen 
        name="Bereiche" 
        component={BereichScreen}
        options={{ title: 'Bereiche' }}
      />
      <Tab.Screen 
        name="FreiwilligePfade" 
        component={FreiwilligePfadeScreen}
        options={{ title: 'Lernpfade' }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Onboarding Screens */}
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="LanguageSelection" 
          component={LanguageSelectionScreen}
          options={{ 
            title: 'Sprache wählen',
            headerShown: true,
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: '#fff'
          }}
        />
        <Stack.Screen 
          name="AvatarSelection" 
          component={AvatarSelectionScreen}
          options={{ 
            title: 'Avatar wählen',
            headerShown: true,
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: '#fff'
          }}
        />

        {/* Main App */}
        <Stack.Screen 
          name="MainApp" 
          component={TabNavigator}
          options={{ headerShown: false }}
        />

        {/* Game Screens */}
        <Stack.Screen 
          name="Game" 
          component={GameScreen}
          options={{ 
            title: 'Quiz',
            headerShown: true,
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: '#fff',
            headerBackTitleVisible: false
          }}
        />

        {/* Minigame Screens */}
        <Stack.Screen 
          name="MinigameReward" 
          component={MinigameScreen}
          options={{ 
            title: '🎮 Minigame Belohnung',
            headerShown: true,
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: '#fff',
            headerBackTitleVisible: false,
            gestureEnabled: false, // Verhindert zurück-swipe
            headerLeft: null // Entfernt zurück-button
          }}
        />

        <Stack.Screen 
          name="GameComplete" 
          component={GameCompleteScreen}
          options={{ 
            title: 'Level abgeschlossen',
            headerShown: true,
            headerStyle: { backgroundColor: '#4ECDC4' },
            headerTintColor: '#fff',
            headerBackTitleVisible: false,
            gestureEnabled: false,
            headerLeft: null
          }}
        />

        {/* Detail Screens */}
        <Stack.Screen 
          name="WissenssnackDetail" 
          component={WissenssnackDetail}
          options={{ 
            title: 'Wissenssnack',
            headerShown: true,
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: '#fff',
            headerBackTitleVisible: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 