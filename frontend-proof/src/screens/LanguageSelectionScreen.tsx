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

  const handleNext = async () => {
    try {
      const updatedUserData = {
        ...userData,
        preferredLanguage: selectedLanguage
      };

      navigation.navigate('AvatarSelection', { userData: updatedUserData });
    } catch (error) {
      Alert.alert('Fehler', 'Spracheinstellung konnte nicht gespeichert werden');
    }
  };

  const renderLanguageOption = (language: Language) => (
    <TouchableOpacity
      key={language.code}
      style={[
        styles.languageOption,
        selectedLanguage === language.code && {
          backgroundColor: colors.primary + '15',
          borderColor: colors.primary,
        }
      ]}
      onPress={() => handleLanguageSelect(language.code)}
    >
      <Text style={styles.flag}>{language.flag}</Text>
      <Text style={[
        styles.languageName,
        selectedLanguage === language.code && { color: colors.primary }
      ]}>
        {language.name}
      </Text>
      <View style={[
        styles.radioButton,
        selectedLanguage === language.code && { backgroundColor: colors.primary }
      ]}>
        {selectedLanguage === language.code && (
          <View style={styles.radioButtonInner} />
        )}
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: spacing.large,
      paddingTop: spacing.extraLarge,
      alignItems: 'center',
    },
    title: {
      ...typography.heading,
      color: colors.text,
      marginBottom: spacing.small,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.medium,
    },
    infoBox: {
      backgroundColor: colors.primary + '10',
      padding: spacing.medium,
      borderRadius: 8,
      marginBottom: spacing.large,
    },
    infoText: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.medium,
      marginBottom: spacing.small,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    flag: {
      fontSize: 24,
      marginRight: spacing.medium,
    },
    languageName: {
      ...typography.body,
      color: colors.text,
      flex: 1,
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioButtonInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.background,
    },
    footer: {
      padding: spacing.large,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.medium,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonText: {
      ...typography.button,
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

        <View>
          {languages.map(renderLanguageOption)}
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