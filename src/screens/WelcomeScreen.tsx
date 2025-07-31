import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  navigation: any;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const { colors, typography, spacing } = useTheme();
  const { login, register } = useUser();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus');
      return;
    }

    if (!isLogin && !displayName) {
      Alert.alert('Fehler', 'Bitte geben Sie Ihren Namen ein');
      return;
    }

    try {
      setIsLoading(true);
      
      if (isLogin) {
        await login(email, password);
      } else {
        // For new users, go to language selection first
        navigation.navigate('Language', {
          userData: {
            email,
            password,
            displayName,
          }
        });
        return;
      }
    } catch (error: any) {
      Alert.alert('Fehler', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      alignItems: 'center',
      paddingTop: height * 0.1,
      paddingHorizontal: spacing.lg,
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: spacing.md,
    },
    title: {
      ...typography.title,
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      textAlign: 'center',
      color: colors.textSecondary,
      marginBottom: spacing.xl,
    },
    formContainer: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      justifyContent: 'center',
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.md,
      fontSize: 16,
      color: colors.text,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    buttonText: {
      ...typography.button,
      color: 'white',
    },
    buttonDisabled: {
      backgroundColor: colors.border,
    },
    switchButton: {
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    switchButtonText: {
      ...typography.body,
      color: colors.primary,
    },
    features: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    featureIcon: {
      fontSize: 20,
      marginRight: spacing.sm,
    },
    featureText: {
      ...typography.body,
      color: colors.textSecondary,
      flex: 1,
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>JunoSixteen</Text>
        <Text style={styles.subtitle}>
          Gamifizierte Lernplattform mit adaptiven Inhalten
        </Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="E-Mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Passwort"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Ihr Name"
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
          />
        )}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={isLoading}>
          <Text style={styles.buttonText}>
            {isLoading ? 'Lädt...' : isLogin ? 'Anmelden' : 'Registrieren'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchButtonText}>
            {isLogin 
              ? 'Noch kein Konto? Jetzt registrieren' 
              : 'Bereits registriert? Anmelden'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.features}>
        <View style={styles.featureRow}>
          <Text style={styles.featureIcon}>🎮</Text>
          <Text style={styles.featureText}>Gamification mit Level-System</Text>
        </View>
        <View style={styles.featureRow}>
          <Text style={styles.featureIcon}>🤖</Text>
          <Text style={styles.featureText}>KI-gestützte adaptive Inhalte</Text>
        </View>
        <View style={styles.featureRow}>
          <Text style={styles.featureIcon}>🌍</Text>
          <Text style={styles.featureText}>Mehrsprachig verfügbar</Text>
        </View>
        <View style={styles.featureRow}>
          <Text style={styles.featureIcon}>👤</Text>
          <Text style={styles.featureText}>Wählbare Avatare</Text>
        </View>
        <View style={styles.featureRow}>
          <Text style={styles.featureIcon}>📊</Text>
          <Text style={styles.featureText}>Detaillierte Fortschrittsverfolgung</Text>
        </View>
        <View style={styles.featureRow}>
          <Text style={styles.featureIcon}>🏆</Text>
          <Text style={styles.featureText}>Zertifikate & Badges</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default WelcomeScreen; 