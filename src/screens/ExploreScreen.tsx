import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

type Wissenssnack = {
  id: string;
  title: string;
  status: string;
};

const ExploreScreen = () => {
  const [wissenssnacks, setWissenssnacks] = useState<Wissenssnack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Beispielhafte Ladedaten (Mockup)
    const data: Wissenssnack[] = [
      { id: '1', title: 'Hygiene Basics', status: 'neu' },
      { id: '2', title: 'Clean Room Verhalten', status: 'abgeschlossen' },
    ];
    setWissenssnacks(data);
    setLoading(false);
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#5479F7" style={{ marginTop: 100 }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {wissenssnacks.map((snack) => (
        <View key={snack.id} style={styles.card}>
          <Text style={styles.title}>{snack.title}</Text>
          <Text>Status: {snack.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default ExploreScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: '#CADDFF',
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});
