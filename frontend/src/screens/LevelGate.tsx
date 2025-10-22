import React, { useEffect, useState } from "react";
import { View, Text, Button, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { canEnter, checkPenalties } from "../lib/api";
import { PolicyBanner } from "../components/PolicyBanner";

export default function LevelGate() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [penalties, setPenalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userId = "u1";
  const moduleId = "m-cleanroom-01";

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        
        // Check access permission
        const accessResult = await canEnter(userId, moduleId);
        setAllowed(accessResult.allowed);
        
        // Check any penalties
        const penaltyResult = await checkPenalties(userId, moduleId);
        setPenalties(penaltyResult.penalties || []);
        
      } catch (error) {
        console.error("Failed to check policy:", error);
        Alert.alert("Error", "Failed to load level status");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Prüfe Zugangsberechtigung...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clean Room – Level 1</Text>
      <Text style={styles.subtitle}>Hygienezonen & PSA Grundlagen</Text>
      
      <PolicyBanner allowed={allowed || false} />
      
      {penalties.length > 0 && (
        <View style={styles.penaltyContainer}>
          <Text style={styles.penaltyTitle}>⚠️ Aktive Penalties:</Text>
          {penalties.map((penalty, index) => (
            <Text key={index} style={styles.penaltyText}>
              • {penalty.type || 'Unknown penalty'}
            </Text>
          ))}
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        {allowed ? (
          <Button 
            title="🎥 Start Video" 
            onPress={() => {
              Alert.alert("Navigation", "Würde zu Video-Screen navigieren");
              // navigate to video screen
            }} 
          />
        ) : (
          <Button 
            title="📈 XP verdienen" 
            onPress={() => {
              Alert.alert("Navigation", "Würde zu vorherigen Modulen navigieren");
              // navigate to prior modules
            }} 
          />
        )}
        
        <View style={styles.spacer} />
        
        <Button 
          title="🔄 Status neu prüfen" 
          onPress={() => window.location.reload()} 
        />
      </View>
      
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>Debug: User {userId}, Module {moduleId}</Text>
        <Text style={styles.debugText}>Allowed: {String(allowed)}</Text>
        <Text style={styles.debugText}>Penalties: {penalties.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9fafb",
    justifyContent: "center"
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    color: "#1f2937"
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20
  },
  loadingText: {
    marginTop: 16,
    textAlign: "center",
    color: "#6b7280"
  },
  penaltyContainer: {
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444"
  },
  penaltyTitle: {
    fontWeight: "600",
    color: "#991b1b",
    marginBottom: 4
  },
  penaltyText: {
    color: "#7f1d1d",
    fontSize: 14
  },
  buttonContainer: {
    marginTop: 20
  },
  spacer: {
    height: 12
  },
  debugContainer: {
    marginTop: 30,
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8
  },
  debugText: {
    fontSize: 12,
    color: "#6b7280",
    fontFamily: "monospace"
  }
}); 