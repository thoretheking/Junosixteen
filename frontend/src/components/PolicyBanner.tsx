import React from "react";
import { View, Text } from "react-native";

export const PolicyBanner = ({ allowed }: { allowed: boolean }) => (
  <View style={{ 
    padding: 12, 
    borderRadius: 8, 
    backgroundColor: allowed ? "#d1fae5" : "#fee2e2",
    marginVertical: 8
  }}>
    <Text style={{ 
      fontWeight: "600",
      color: allowed ? "#065f46" : "#991b1b",
      textAlign: "center"
    }}>
      {allowed ? "✅ Freigeschaltet" : "🚫 Gesperrt – Level/XP oder Deadline prüfen"}
    </Text>
  </View>
); 