import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import ApiService from '../services/ApiService';

const { width } = Dimensions.get('window');

interface Avatar {
  id: string;
  name: string;
  category: string;
  image: string;
}

interface AvatarSelectionScreenProps {
  navigation: any;
  route: any;
}

const AvatarSelectionScreen: React.FC<AvatarSelectionScreenProps> = ({ navigation, route }) => {
  const { colors, typography, spacing } = useTheme();
  const { register } = useUser();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('manga_1');
  const [isLoading, setIsLoading] = useState(false);

  const { userData, selectedLanguage } = route.params;

  useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = async () => {
    try {
      const response = await ApiService.getAvatars();
      setAvatars(response.avatars);
    } catch (error) {
      console.error('Error loading avatars:', error);
      // Fallback avatars
      setAvatars([
        { id: 'manga_1', name: 'Manga Style 1', category: 'manga', image: '/avatars/manga_1.png' },
        { id: 'manga_2', name: 'Manga Style 2', category: 'manga', image: '/avatars/manga_2.png' },
        { id: 'realistic_1', name: 'Realistisch 1', category: 'realistic', image: '/avatars/realistic_1.png' },
        { id: 'realistic_2', name: 'Realistisch 2', category: 'realistic', image: '/avatars/realistic_2.png' },
        { id: 'comic_1', name: 'Comic Style 1', category: 'comic', image: '/avatars/comic_1.png' },
        { id: 'comic_2', name: 'Comic Style 2', category: 'comic', image: '/avatars/comic_2.png' },
        { id: 'business_1', name: 'Business 1', category: 'business', image: '/avatars/business_1.png' },
        { id: 'business_2', name: 'Business 2', category: 'business', image: '/avatars/business_2.png' },
      ]);
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      
      await register({
        ...userData,
        language: selectedLanguage,
        avatar: selectedAvatar,
      });

      // Navigation wird automatisch durch UserContext gehandelt
    } catch (error: any) {
      Alert.alert('Fehler', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedAvatars = avatars.reduce((groups: any, avatar) => {
    const category = avatar.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(avatar);
    return groups;
  }, {});

  const categoryNames = {
    manga: 'Manga Style',
    realistic: 'Realistisch',
    comic: 'Comic Style',
    business: 'Business'
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
    categoryTitle: {
      ...typography.subtitle,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
      color: colors.text,
    },
    avatarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    avatarCard: {
      width: (width - spacing.lg * 3) / 2,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    avatarCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    avatarImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.border,
      marginBottom: spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarEmoji: {
      fontSize: 30,
    },
    avatarName: {
      ...typography.caption,
      textAlign: 'center',
      color: colors.text,
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
    buttonDisabled: {
      backgroundColor: colors.border,
    },
    buttonText: {
      ...typography.button,
      color: 'white',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wähle deinen Avatar</Text>
        <Text style={styles.subtitle}>
          Dein Avatar repräsentiert dich in der JunoSixteen Lernwelt
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedAvatars).map(([category, categoryAvatars]: [string, any]) => (
          <View key={category}>
            <Text style={styles.categoryTitle}>
              {categoryNames[category as keyof typeof categoryNames] || category}
            </Text>
            <View style={styles.avatarGrid}>
              {categoryAvatars.map((avatar: Avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarCard,
                    selectedAvatar === avatar.id && styles.avatarCardSelected,
                  ]}
                  onPress={() => setSelectedAvatar(avatar.id)}>
                  <View style={styles.avatarImage}>
                    <Text style={styles.avatarEmoji}>
                      {category === 'manga' ? '🦸' :
                       category === 'realistic' ? '👤' :
                       category === 'comic' ? '🎭' : '👔'}
                    </Text>
                  </View>
                  <Text style={styles.avatarName}>{avatar.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={isLoading}>
          <Text style={styles.buttonText}>
            {isLoading ? 'Registriere...' : 'Registrierung abschließen'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AvatarSelectionScreen; 