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
import { useEventStore } from '@stores/eventStore';
import telegramDeliveryService from '@services/TelegramDeliveryService';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { config, state, startSession, stopSession, emergencyStop } = useSessionStore();
  const { selectedTrack, loadTracks } = useMusicStore();
  const { devices, refreshStatus } = useDeviceStore();
  const { events, selectedEventId } = useEventStore();
  const [pulseAnim] = useState(new Animated.Value(1));

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const hasCustomerInfo = config.customerName && config.customerPhone;

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
    // Check if customer info is provided
    if (!hasCustomerInfo) {
      Alert.alert(
        'Customer Info Required',
        'Please enter customer information before starting the session',
        [
          {
            text: 'Enter Info',
            onPress: () => navigation.navigate('CustomerInput'),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

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
  const isDownloading = state.status === 'downloading';
  const isWaitingForWifi = state.status === 'waiting_for_wifi';
  const isUploadingToLaptop = state.status === 'uploading_to_laptop';
  const isProcessingOnLaptop = state.status === 'processing_on_laptop';
  const isDownloadingFromLaptop = state.status === 'downloading_from_laptop';
  const isReadyForDelivery = state.status === 'ready_for_delivery';
  const isLaptopProcessing = isUploadingToLaptop || isProcessingOnLaptop || isDownloadingFromLaptop;
  const canStart = state.status === 'idle' && devices.gopro.connected && devices.booth.connected;

  const handleShareToTelegram = async () => {
    if (!state.processedVideoPath) {
      Alert.alert('Error', 'No processed video available');
      return;
    }

    try {
      // First try native share sheet
      const shared = await telegramDeliveryService.shareVideoToTelegram(
        state.processedVideoPath,
        config.customerName
      );

      if (!shared) {
        // If user dismissed share, try opening Telegram directly
        try {
          await telegramDeliveryService.openTelegramChat(config.customerPhone);
        } catch {
          // Telegram might not be installed, show file location
          await telegramDeliveryService.showVideoPath(state.processedVideoPath);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to share: ${error.message}`);
    }
  };

  const handleNewSession = () => {
    // Reset session state for new customer
    useSessionStore.getState().resetSession();
  };

  return (
    <View style={styles.container}>
      {/* Status Display */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Session Status</Text>
        <Text style={[
          styles.statusText,
          isRecording && styles.statusRecording,
          isDownloading && styles.statusDownloading,
          isWaitingForWifi && styles.statusWaitingWifi
        ]}>
          {isWaitingForWifi ? 'ACTION REQUIRED' : state.status.toUpperCase().replace('_', ' ')}
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

        {/* Download Status Display */}
        {isDownloading && (
          <View style={styles.downloadContainer}>
            <Text style={styles.downloadStatusText}>
              {state.downloadStatus || 'Starting download...'}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFillDownload,
                  { width: `${state.downloadProgress || 0}%` },
                ]}
              />
            </View>
            <Text style={styles.downloadProgressText}>
              {state.downloadProgress || 0}%
            </Text>
          </View>
        )}

        {/* Waiting for WiFi - User Action Required */}
        {isWaitingForWifi && (
          <View style={styles.wifiWaitContainer}>
            <Text style={styles.wifiWaitTitle}>⚠️ GoPro WiFi Not Found</Text>
            <Text style={styles.wifiWaitText}>
              {state.downloadStatus || 'Please activate GoPro WiFi manually'}
            </Text>
            <View style={styles.wifiInstructions}>
              <Text style={styles.wifiStep}>1. Open GoPro Quik app</Text>
              <Text style={styles.wifiStep}>2. Tap on your GoPro</Text>
              <Text style={styles.wifiStep}>3. Go to Media → View on Phone</Text>
              <Text style={styles.wifiStep}>4. Wait for WiFi to activate</Text>
            </View>
            <Text style={styles.wifiWaitNote}>
              App will auto-detect when WiFi is available...
            </Text>
          </View>
        )}

        {/* Laptop Processing Status */}
        {isLaptopProcessing && (
          <View style={styles.laptopProcessingContainer}>
            <Text style={styles.laptopProcessingTitle}>
              {isUploadingToLaptop && '📤 Uploading to Laptop'}
              {isProcessingOnLaptop && '🎬 Processing Video'}
              {isDownloadingFromLaptop && '📥 Downloading Result'}
            </Text>
            <Text style={styles.laptopStatusText}>
              {state.downloadStatus || 'Processing...'}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFillLaptop,
                  { width: `${state.laptopProgress || 0}%` },
                ]}
              />
            </View>
            <Text style={styles.laptopProgressText}>
              {state.laptopProgress || 0}%
            </Text>
          </View>
        )}

        {/* Ready for Delivery */}
        {isReadyForDelivery && (
          <View style={styles.deliveryContainer}>
            <Text style={styles.deliveryTitle}>✅ Video Ready!</Text>
            <Text style={styles.deliveryText}>
              Video for {config.customerName} is ready
            </Text>
            <TouchableOpacity
              style={styles.telegramButton}
              onPress={handleShareToTelegram}
            >
              <Text style={styles.telegramButtonText}>📱 Share via Telegram</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.newSessionButton}
              onPress={handleNewSession}
            >
              <Text style={styles.newSessionButtonText}>Start New Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {state.error && (
          <Text style={styles.errorText}>{state.error}</Text>
        )}
      </View>

      {/* Customer Info Display */}
      <View style={styles.customerCard}>
        <View style={styles.customerHeader}>
          <Text style={styles.customerTitle}>Current Customer</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CustomerInput')}
            disabled={isRecording || isPreparing}
          >
            <Text style={styles.editLink}>
              {hasCustomerInfo ? 'Change' : '+ Add'}
            </Text>
          </TouchableOpacity>
        </View>

        {hasCustomerInfo ? (
          <View style={styles.customerInfo}>
            {selectedEvent && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Event:</Text>
                <Text style={styles.infoValue}>{selectedEvent.name}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{config.customerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{config.customerPhone}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noCustomer}>
            <Text style={styles.noCustomerText}>
              Tap "+ Add" to enter customer information
            </Text>
          </View>
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
  statusDownloading: {
    color: '#2196f3',
  },
  statusWaitingWifi: {
    color: '#ff9800',
  },
  downloadContainer: {
    marginTop: 15,
    width: '100%',
  },
  downloadStatusText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  downloadProgressText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  progressFillDownload: {
    height: '100%',
    backgroundColor: '#2196f3',
  },
  wifiWaitContainer: {
    marginTop: 15,
    width: '100%',
    backgroundColor: '#2d2000',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  wifiWaitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff9800',
    textAlign: 'center',
    marginBottom: 10,
  },
  wifiWaitText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  wifiInstructions: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  wifiStep: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 6,
  },
  wifiWaitNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
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
  customerCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  editLink: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '600',
  },
  customerInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  noCustomer: {
    padding: 16,
    alignItems: 'center',
  },
  noCustomerText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
  // Laptop Processing Styles
  laptopProcessingContainer: {
    marginTop: 15,
    width: '100%',
    backgroundColor: '#1a2a1a',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  laptopProcessingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
    textAlign: 'center',
    marginBottom: 10,
  },
  laptopStatusText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressFillLaptop: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  laptopProgressText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  // Delivery Styles
  deliveryContainer: {
    marginTop: 15,
    width: '100%',
    backgroundColor: '#1a2a1a',
    borderRadius: 8,
    padding: 20,
    borderWidth: 2,
    borderColor: '#4caf50',
    alignItems: 'center',
  },
  deliveryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 10,
  },
  deliveryText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  telegramButton: {
    backgroundColor: '#0088cc',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  telegramButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  newSessionButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  newSessionButtonText: {
    color: '#999',
    fontSize: 16,
  },
});
