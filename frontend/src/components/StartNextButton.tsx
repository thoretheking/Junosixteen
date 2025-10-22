import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface StartNextButtonProps {
  sessionId: string;
  currentIndex: number;
  onPress: () => void;
  disabled?: boolean;
}

export default function StartNextButton({ 
  sessionId, 
  currentIndex, 
  onPress, 
  disabled = false 
}: StartNextButtonProps) {
  const [canStart, setCanStart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    checkNextAvailable();
  }, [sessionId, currentIndex]);

  const checkNextAvailable = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://10.0.2.2:5000/api/mangle/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          // Add minimal context for decision
          userId: 'u1', // Should come from props/context
          level: Math.floor(currentIndex / 10) + 1,
          watched: Array.from({ length: currentIndex }, (_, i) => i + 1),
          answers: [], // Would need real attempt history
          deadlineISO: '2025-08-29T21:59:00Z'
        })
      });
      
      const data = await response.json();
      const nextIdx = data.results?.next_question?.[0]?.col1;
      const currentStatus = data.results?.current_status?.[0]?.col1;
      
      setNextIndex(nextIdx ? parseInt(nextIdx) : null);
      setStatus(currentStatus || 'unknown');
      setCanStart(nextIdx === currentIndex + 1);
      
    } catch (error) {
      console.error('Failed to check next availability:', error);
      setCanStart(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    if (canStart && !disabled) {
      onPress();
    }
  };

  const getButtonText = () => {
    if (loading) return 'Prüfe...';
    
    if (!canStart) {
      if (status === 'RESET_RISK') return 'Risk Failed - Level Reset Required';
      if (status === 'RESET_DEADLINE') return 'Deadline Missed - Reset Required';
      if (nextIndex && nextIndex < currentIndex) return `Gehe zu Frage ${nextIndex}`;
      return 'Nicht verfügbar';
    }
    
    return `▶️ Starte Frage ${currentIndex + 1}`;
  };

  const getButtonStyle = () => {
    if (loading) return styles.loading;
    if (!canStart) return styles.disabled;
    return styles.enabled;
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle()]}
      onPress={handlePress}
      disabled={loading || !canStart || disabled}
    >
      {loading && <ActivityIndicator size="small" color="#ffffff" style={styles.spinner} />}
      <Text style={styles.buttonText}>{getButtonText()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 50,
  },
  enabled: {
    backgroundColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabled: {
    backgroundColor: '#9ca3af',
  },
  loading: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  spinner: {
    marginRight: 8,
  },
}); 