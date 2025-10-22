import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert 
} from 'react-native';

interface PolicyResult {
  status?: string;
  nextIdx?: number;
  pointsRaw?: number;
  pointsFinal?: number;
  allowed?: boolean;
  penalties?: any[];
  rawResponse?: any;
}

export default function PolicyDebug() {
  const [sessionId, setSessionId] = useState('sess_u1_active');
  const [userId, setUserId] = useState('u1');
  const [moduleId, setModuleId] = useState('m-cleanroom-01');
  const [result, setResult] = useState<PolicyResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const BASE_URL = 'http://10.0.2.2:5000'; // Android emu

  const checkDecision = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/mangle/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          level: 3, // Example level
          watched: [1, 2, 3],
          answers: [
            { idx: 1, part: 'A', correct: true },
            { idx: 2, part: 'A', correct: true },
            { idx: 5, part: 'A', correct: false } // Risk failure
          ],
          deadlineISO: '2025-08-29T21:59:00Z'
        })
      });
      
      const data = await response.json();
      setResult({
        ...data,
        rawResponse: data
      });
      
    } catch (error) {
      Alert.alert('Error', `Failed to fetch decision: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkGate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/policy/gate/${userId}/${moduleId}`);
      const data = await response.json();
      
      setResult({
        allowed: data.allowed,
        rawResponse: data
      });
      
    } catch (error) {
      Alert.alert('Error', `Failed to check gate: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkPenalties = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/policy/penalty/${userId}/${moduleId}`);
      const data = await response.json();
      
      setResult({
        penalties: data.penalties,
        rawResponse: data
      });
      
    } catch (error) {
      Alert.alert('Error', `Failed to check penalties: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => setResult(null);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Policy Debug Console</Text>
      
      {/* Input Fields */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Session ID:</Text>
        <TextInput
          style={styles.input}
          value={sessionId}
          onChangeText={setSessionId}
          placeholder="sess_u1_active"
        />
        
        <Text style={styles.label}>User ID:</Text>
        <TextInput
          style={styles.input}
          value={userId}
          onChangeText={setUserId}
          placeholder="u1"
        />
        
        <Text style={styles.label}>Module ID:</Text>
        <TextInput
          style={styles.input}
          value={moduleId}
          onChangeText={setModuleId}
          placeholder="m-cleanroom-01"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonSection}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={checkDecision}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '⏳ Loading...' : '🎯 Get Decision'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={checkGate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🚪 Check Gate</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.warningButton]} 
          onPress={checkPenalties}
          disabled={loading}
        >
          <Text style={styles.buttonText}>⚠️ Check Penalties</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResult}
        >
          <Text style={styles.buttonText}>🗑️ Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Results Display */}
      {result && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>📊 Results</Text>
          
          {result.status && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Status:</Text>
              <Text style={[styles.resultValue, getStatusStyle(result.status)]}>
                {result.status}
              </Text>
            </View>
          )}
          
          {result.allowed !== undefined && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Allowed:</Text>
              <Text style={[styles.resultValue, result.allowed ? styles.success : styles.error]}>
                {result.allowed ? '✅ YES' : '❌ NO'}
              </Text>
            </View>
          )}
          
          {result.nextIdx && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Next Question:</Text>
              <Text style={styles.resultValue}>{result.nextIdx}</Text>
            </View>
          )}
          
          {result.pointsRaw !== undefined && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Points (Raw):</Text>
              <Text style={styles.resultValue}>{result.pointsRaw}</Text>
            </View>
          )}
          
          {result.pointsFinal !== undefined && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Points (Final):</Text>
              <Text style={styles.resultValue}>{result.pointsFinal}</Text>
            </View>
          )}
          
          {result.penalties && result.penalties.length > 0 && (
            <View style={styles.penaltiesSection}>
              <Text style={styles.resultLabel}>Penalties:</Text>
              {result.penalties.map((penalty, index) => (
                <Text key={index} style={styles.penaltyText}>
                  • {penalty.type || 'Unknown'}: {penalty.reason || 'No reason'}
                </Text>
              ))}
            </View>
          )}
          
          {/* Raw Response (Collapsible) */}
          <View style={styles.rawSection}>
            <Text style={styles.rawTitle}>🔍 Raw Response:</Text>
            <ScrollView style={styles.rawScrollView} horizontal>
              <Text style={styles.rawText}>
                {JSON.stringify(result.rawResponse, null, 2)}
              </Text>
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'PASSED': return { color: '#10b981' };
    case 'RESET_RISK': 
    case 'RESET_DEADLINE': return { color: '#ef4444' };
    case 'IN_PROGRESS': return { color: '#3b82f6' };
    default: return { color: '#6b7280' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1f2937'
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#374151'
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff'
  },
  buttonSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    borderRadius: 8,
    padding: 12,
    margin: 4,
    minWidth: '45%',
    alignItems: 'center'
  },
  primaryButton: {
    backgroundColor: '#3b82f6'
  },
  secondaryButton: {
    backgroundColor: '#10b981'
  },
  warningButton: {
    backgroundColor: '#f59e0b'
  },
  clearButton: {
    backgroundColor: '#6b7280'
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14
  },
  resultSection: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937'
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  resultValue: {
    fontSize: 14,
    color: '#1f2937'
  },
  success: {
    color: '#10b981'
  },
  error: {
    color: '#ef4444'
  },
  penaltiesSection: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  penaltyText: {
    fontSize: 12,
    color: '#991b1b',
    marginBottom: 2,
  },
  rawSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  rawTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151'
  },
  rawScrollView: {
    maxHeight: 200,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    padding: 8,
  },
  rawText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#1f2937'
  }
}); 