import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useSessionStore } from '@stores/sessionStore';
import { useMusicStore } from '@stores/musicStore';
import { useDeviceStore } from '@stores/deviceStore';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { config, state, startSession, stopSession, emergencyStop } = useSessionStore();
  const { selectedTrack, loadTracks } = useMusicStore();
  const { devices, refreshStatus } = useDeviceStore();
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Load music tracks on mount
    loadTracks();

    // Refresh device status periodically
    const interval = setInterval(() => {
      refreshStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Pulse animation for recording state
  useEffect(() => {
    if (state.status === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state.status]);

  const handleStartSession = async () => {
    try {
      await startSession();
    } catch (error: any) {
      Alert.alert('Error', `Failed to start session: ${error.message}`);
    }
  };

  const handleStopSession = async () => {
    Alert.alert(
      'Stop Session',
      'Are you sure you want to stop the recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              await stopSession();
            } catch (error: any) {
              Alert.alert('Error', `Failed to stop session: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const handleEmergencyStop = async () => {
    try {
      await emergencyStop();
    } catch (error: any) {
      console.error('Emergency stop error:', error);
    }
  };

  const isRecording = state.status === 'recording';
  const isPreparing = state.status === 'preparing';
  const canStart = state.status === 'idle' && devices.gopro.connected && devices.booth.connected;

  return (
    <View style={styles.container}>
      {/* Status Display */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Session Status</Text>
        <Text style={[styles.statusText, isRecording && styles.statusRecording]}>
          {state.status.toUpperCase()}
        </Text>

        {isRecording && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {state.elapsedTime}s / {config.duration}s
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(state.elapsedTime / config.duration) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}

        {state.error && (
          <Text style={styles.errorText}>{state.error}</Text>
        )}
      </View>

      {/* Session Config Display */}
      <View style={styles.configCard}>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Duration:</Text>
          <Text style={styles.configValue}>{config.duration}s</Text>
        </View>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Music:</Text>
          <Text style={styles.configValue}>
            {selectedTrack ? selectedTrack.title : 'None'}
          </Text>
        </View>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Speed:</Text>
          <Text style={styles.configValue}>{config.rotationSpeed}%</Text>
        </View>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Resolution:</Text>
          <Text style={styles.configValue}>{config.resolution}</Text>
        </View>

        <TouchableOpacity
          style={styles.editConfigButton}
          onPress={() => navigation.navigate('SessionConfig')}
          disabled={isRecording || isPreparing}
        >
          <Text style={styles.editConfigText}>Edit Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Main Action Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[
            styles.mainButton,
            isRecording && styles.mainButtonRecording,
            !canStart && !isRecording && styles.mainButtonDisabled,
          ]}
          onPress={isRecording ? handleStopSession : handleStartSession}
          disabled={!canStart && !isRecording}
        >
          <Text style={styles.mainButtonText}>
            {isRecording ? 'STOP SESSION' : isPreparing ? 'PREPARING...' : 'START SESSION'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('MusicSelection')}
          disabled={isRecording || isPreparing}
        >
          <Text style={styles.quickActionText}>🎵 Music</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('ManualControl')}
          disabled={isRecording || isPreparing}
        >
          <Text style={styles.quickActionText}>🎮 Manual</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, styles.emergencyButton]}
          onPress={handleEmergencyStop}
        >
          <Text style={styles.quickActionText}>🛑 Emergency</Text>
        </TouchableOpacity>
      </View>

      {/* Device Status Footer */}
      <View style={styles.deviceStatus}>
        <View style={styles.deviceStatusItem}>
          <View
            style={[
              styles.deviceStatusDot,
              devices.gopro.connected && styles.deviceStatusDotConnected,
            ]}
          />
          <Text style={styles.deviceStatusText}>
            GoPro {devices.gopro.battery ? `(${devices.gopro.battery}%)` : ''}
          </Text>
        </View>
        <View style={styles.deviceStatusItem}>
          <View
            style={[
              styles.deviceStatusDot,
              devices.booth.connected && styles.deviceStatusDotConnected,
            ]}
          />
          <Text style={styles.deviceStatusText}>Booth</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusRecording: {
    color: '#f44336',
  },
  timerContainer: {
    marginTop: 15,
    width: '100%',
  },
  timerText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 10,
  },
  configCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  configLabel: {
    fontSize: 16,
    color: '#999',
  },
  configValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  editConfigButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
  editConfigText: {
    color: '#2196f3',
    fontSize: 16,
    fontWeight: '600',
  },
  mainButton: {
    backgroundColor: '#4caf50',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  mainButtonRecording: {
    backgroundColor: '#f44336',
  },
  mainButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionButton: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  emergencyButton: {
    backgroundColor: '#d32f2f',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deviceStatus: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  deviceStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginRight: 8,
  },
  deviceStatusDotConnected: {
    backgroundColor: '#4caf50',
  },
  deviceStatusText: {
    color: '#999',
    fontSize: 14,
  },
});
