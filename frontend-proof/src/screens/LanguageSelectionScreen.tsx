import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ApiService from '../services/ApiService';
import i18n, { LanguageCode } from '../services/i18n';

const { width } = Dimensions.get('window');

interface Language {
  code: LanguageCode;
  name: string;
  flag: string;
}

interface LanguageSelectionScreenProps {
  navigation: any;
  route: any;
}

const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({ navigation, route }) => {
  const { colors, typography, spacing } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('de');
  
  const { userData } = route.params;

  useEffect(() => {
    // Initialize with system language if available
    const systemLanguage = getUserSystemLanguage();
    setSelectedLanguage(systemLanguage);
    i18n.setLanguage(systemLanguage);
  }, []);

  const getUserSystemLanguage = (): LanguageCode => {
    // In a real app, you'd get this from the device
    // For now, default to German
    return 'de';
  };

  const languages = i18n.getAvailableLanguages();

  const handleLanguageSelect = (languageCode: LanguageCode) => {
    setSelectedLanguage(languageCode);
    i18n.setLanguage(languageCode);
  };

  const handleNext = () => {
    // Save language choice
    navigation.navigate('Avatar', {
      userData: {
        ...userData,
        language: selectedLanguage
      },
      selectedLanguage,
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: spacing.lg,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      ...typography.title,
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    languageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    languageCard: {
      width: (width - spacing.lg * 3) / 2,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      minHeight: 100,
      justifyContent: 'center',
    },
    languageCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    languageFlag: {
      fontSize: 32,
      marginBottom: spacing.sm,
    },
    languageName: {
      ...typography.body,
      textAlign: 'center',
      color: colors.text,
      fontWeight: '600',
    },
    footer: {
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    buttonText: {
      ...typography.button,
      color: 'white',
    },
    infoBox: {
      backgroundColor: colors.primary + '10',
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    infoText: {
      ...typography.caption,
      color: colors.primary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('selectLanguage')}</Text>
        <Text style={styles.subtitle}>
          {i18n.t('languageDescription')}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {i18n.t('languageInfo')}
          </Text>
        </View>

        <View style={styles.languageGrid}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageCard,
                selectedLanguage === language.code && styles.languageCardSelected,
              ]}
              onPress={() => handleLanguageSelect(language.code)}>
              <Text style={styles.languageFlag}>{language.flag}</Text>
              <Text style={styles.languageName}>{language.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>{i18n.t('continueToAvatar')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LanguageSelectionScreen; 