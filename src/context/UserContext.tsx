import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import AuthService from '../services/AuthService';
import ApiService from '../services/ApiService';

interface User {
  uid: string;
  email: string;
  displayName: string;
  language: string;
  avatar: string;
  level: number;
  totalPoints: number;
  currentPoints: number;
  progress: {
    completedModules: number[];
    currentModule: number;
    totalModules: number;
  };
  cluster?: string;
  badges?: string[];
  isAdmin: boolean;
  deadlineStatus?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  language: string;
  avatar: string;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check for stored auth token
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        // Set API token and get user data
        ApiService.setAuthToken(token);
        const userData = await ApiService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.log('Auth initialization error:', error);
      await AsyncStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Firebase Auth login
      const authResult = await AuthService.login(email, password);
      const token = await authResult.user.getIdToken();
      
      // Store token
      await AsyncStorage.setItem('authToken', token);
      ApiService.setAuthToken(token);
      
      // Get user data from backend
      const userData = await ApiService.login(token);
      setUser(userData.user);
      
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      
      // Firebase Auth registration
      const authResult = await AuthService.register(userData.email, userData.password);
      const token = await authResult.user.getIdToken();
      
      // Store token
      await AsyncStorage.setItem('authToken', token);
      ApiService.setAuthToken(token);
      
      // Register user in backend
      const backendResult = await ApiService.register({
        email: userData.email,
        displayName: userData.displayName,
        language: userData.language,
        avatar: userData.avatar
      });
      
      setUser(backendResult.user);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registrierung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      await AsyncStorage.removeItem('authToken');
      ApiService.clearAuthToken();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const updatedUser = await ApiService.updateProfile(updates);
      setUser(prev => prev ? { ...prev, ...updatedUser } : null);
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.message || 'Profil-Update fehlgeschlagen');
    }
  };

  const refreshUser = async () => {
    try {
      if (user) {
        const userData = await ApiService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('User refresh error:', error);
    }
  };

  const value: UserContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 