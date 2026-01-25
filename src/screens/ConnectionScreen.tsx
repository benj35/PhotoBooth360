import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useDeviceStore } from '@stores/deviceStore';
import wifiManager from '@services/WiFiManagerService';
import laptopTransferService from '@services/LaptopTransferService';

type ConnectionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Connection'>;
};

export default function ConnectionScreen({ navigation }: ConnectionScreenProps) {
  const [boothUrl, setBoothUrl] = useState('http://192.168.4.1');
  const [skipGoPro, setSkipGoPro] = useState(false); // Temporary: Skip GoPro for testing
  const [showWiFiModal, setShowWiFiModal] = useState(false);

  // Booth WiFi credentials
  const [boothSSID, setBoothSSID] = useState('Benjua');
  const [boothPassword, setBoothPassword] = useState('AZBH@2025');

  // GoPro WiFi credentials
  // Note: SSID is "HERO13 Black" (not the serial number "GP50113778")
  const [goProSSID, setGoProSSID] = useState('HERO13 Black');
  const [goProPassword, setGoProPassword] = useState('R2Q-P>T-fpy');

  // Laptop server configuration
  const [laptopUrl, setLaptopUrl] = useState(laptopTransferService.getBaseUrl());
  const [laptopConnected, setLaptopConnected] = useState(false);
  const [laptopConnecting, setLaptopConnecting] = useState(false);
  const [laptopInfo, setLaptopInfo] = useState<string | null>(null);

  const { devices, connecting, connectGoPro, connectBooth } = useDeviceStore();

  const requestBluetoothPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      // iOS permissions are handled automatically via Info.plist
      return true;
    }

    try {
      const androidVersion = Number(Platform.Version);

      if (androidVersion >= 31) {
        // Android 12+ (API 31+) - Request new Bluetooth permissions
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);

        return (
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // Android < 12 - Request location permission (required for BLE scanning)
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Error requesting Bluetooth permissions:', error);
      return false;
    }
  };

  const requestLocationPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      // iOS handles location permissions differently
      return true;
    }

    try {
      console.log('[ConnectionScreen] Requesting location permissions for WiFi switching...');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission Required',
          message: 'PhotoBooth360 needs location permission to automatically switch WiFi networks between Booth and GoPro.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      console.log('[ConnectionScreen] Location permission result:', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  };

  const handleConnectGoPro = async () => {
    try {
      console.log('[ConnectionScreen] Starting GoPro connection...');

      // Request Bluetooth permissions first
      const hasPermission = await requestBluetoothPermissions();
      console.log('[ConnectionScreen] Permission granted:', hasPermission);

      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Bluetooth permissions are required to connect to GoPro. Please grant permissions in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('[ConnectionScreen] Calling connectGoPro...');
      await connectGoPro();
      console.log('[ConnectionScreen] GoPro connected successfully, showing alert...');

      // Use setTimeout to ensure state update is complete before showing alert
      setTimeout(() => {
        Alert.alert('Success', 'GoPro connected successfully');
      }, 100);
    } catch (error: any) {
      console.error('[ConnectionScreen] GoPro connection error:', error);
      const errorMessage = error?.message || 'Unknown error';
      setTimeout(() => {
        Alert.alert('Error', `Failed to connect GoPro: ${errorMessage}`);
      }, 100);
    }
  };

  const handleConnectBooth = async () => {
    try {
      await connectBooth(boothUrl);

      // === NEW: Request location permissions and configure WiFi credentials ===
      try {
        // Request location permission (required for WiFi operations on Android)
        const hasLocationPermission = await requestLocationPermissions();
        console.log('[ConnectionScreen] Location permission granted:', hasLocationPermission);

        if (!hasLocationPermission) {
          Alert.alert(
            'Warning',
            'Location permission is required for automatic WiFi switching. You can still use the app, but WiFi switching will need to be done manually.',
            [{ text: 'OK' }]
          );
          Alert.alert('Success', 'Booth connected successfully');
          return;
        }

        // Show modal to configure WiFi credentials
        setShowWiFiModal(true);
      } catch (wifiError) {
        console.error('[ConnectionScreen] Error during WiFi setup:', wifiError);
        Alert.alert('Success', 'Booth connected successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to connect booth: ${error.message}`);
    }
  };

  const handleSaveWiFiCredentials = () => {
    if (!boothSSID.trim() || !boothPassword.trim()) {
      Alert.alert('Error', 'Please enter Booth WiFi credentials');
      return;
    }

    if (!goProSSID.trim() || !goProPassword.trim()) {
      Alert.alert('Error', 'Please enter GoPro WiFi credentials');
      return;
    }

    // Save both sets of credentials
    wifiManager.setBoothCredentials(boothSSID.trim(), boothPassword.trim());
    wifiManager.setGoProCredentials(goProSSID.trim(), goProPassword.trim());

    console.log('[ConnectionScreen] WiFi credentials saved:');
    console.log('[ConnectionScreen] - Booth:', boothSSID);
    console.log('[ConnectionScreen] - GoPro:', goProSSID);

    setShowWiFiModal(false);
    Alert.alert('Success', 'Booth connected and WiFi credentials saved!');
  };

  const handleSkipWiFiSetup = () => {
    console.log('[ConnectionScreen] User skipped WiFi setup');
    Alert.alert('Warning', 'WiFi switching will need to be done manually');
    setShowWiFiModal(false);
  };

  const handleConnectLaptop = async () => {
    if (!laptopUrl.trim()) {
      Alert.alert('Error', 'Please enter laptop server URL');
      return;
    }

    setLaptopConnecting(true);
    setLaptopInfo(null);

    try {
      // Update the service URL
      laptopTransferService.setBaseUrl(laptopUrl.trim());

      // Test connection
      const health = await laptopTransferService.checkHealth();

      setLaptopConnected(true);
      setLaptopInfo(`Queue: ${health.queueLength} | Processing: ${health.processingCount}/${health.maxConcurrent}`);

      Alert.alert('Success', `Laptop server connected!\nFFmpeg: ${health.ffmpegVersion}`);
    } catch (error: any) {
      setLaptopConnected(false);
      setLaptopInfo(null);
      Alert.alert('Error', `Failed to connect to laptop server: ${error.message}`);
    } finally {
      setLaptopConnecting(false);
    }
  };

  const handleContinue = () => {
    // Allow continuing if booth is connected (skip GoPro check for testing)
    if (!devices.booth.connected) {
      Alert.alert('Warning', 'Please connect the booth before continuing');
      return;
    }

    if (!devices.gopro.connected && !skipGoPro) {
      Alert.alert(
        'GoPro Not Connected',
        'GoPro is not connected. Continue anyway for testing?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue Anyway',
            onPress: () => {
              setSkipGoPro(true);
              // Navigate to Customer Input first
              navigation.navigate('CustomerInput');
            },
          },
        ]
      );
      return;
    }

    // Navigate to Customer Input to set up the first session
    navigation.navigate('CustomerInput');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect Your Devices</Text>
      <Text style={styles.subtitle}>
        Connect both the GoPro camera and 360° booth to continue
      </Text>

      {/* GoPro Connection */}
      <View style={styles.deviceCard}>
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceName}>GoPro Hero 13</Text>
          <View
            style={[
              styles.statusDot,
              devices.gopro.connected ? styles.statusConnected : styles.statusDisconnected,
            ]}
          />
        </View>

        {devices.gopro.connected ? (
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceInfoText}>
              Battery: {devices.gopro.battery !== null ? `${devices.gopro.battery}%` : 'N/A'}
            </Text>
            <Text style={styles.deviceInfoText}>
              Storage: {devices.gopro.storageRemaining !== null ? `${devices.gopro.storageRemaining} MB` : 'N/A'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnectGoPro}
            disabled={connecting.gopro}
          >
            {connecting.gopro ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Connect via Bluetooth</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Booth Connection */}
      <View style={styles.deviceCard}>
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceName}>360° Booth</Text>
          <View
            style={[
              styles.statusDot,
              devices.booth.connected ? styles.statusConnected : styles.statusDisconnected,
            ]}
          />
        </View>

        {devices.booth.connected ? (
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceInfoText}>Status: Ready</Text>
            <Text style={styles.deviceInfoText}>Speed: {devices.booth.currentSpeed}%</Text>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={boothUrl}
              onChangeText={setBoothUrl}
              placeholder="Enter booth IP address"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnectBooth}
              disabled={connecting.booth}
            >
              {connecting.booth ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Connect via Network</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Laptop Server Connection */}
      <View style={styles.deviceCard}>
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceName}>Laptop Server</Text>
          <View
            style={[
              styles.statusDot,
              laptopConnected ? styles.statusConnected : styles.statusDisconnected,
            ]}
          />
        </View>

        {laptopConnected ? (
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceInfoText}>Status: Online</Text>
            {laptopInfo && <Text style={styles.deviceInfoText}>{laptopInfo}</Text>}
            <TouchableOpacity
              style={styles.reconnectButton}
              onPress={handleConnectLaptop}
            >
              <Text style={styles.reconnectText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={laptopUrl}
              onChangeText={setLaptopUrl}
              placeholder="http://192.168.1.200:3001"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnectLaptop}
              disabled={laptopConnecting}
            >
              {laptopConnecting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Test Connection</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.laptopHint}>
          Video processing server for overlays & music
        </Text>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          !devices.booth.connected && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!devices.booth.connected}
      >
        <Text style={styles.buttonText}>
          {devices.gopro.connected ? 'Continue to App' : 'Continue (Testing Mode)'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.helpText}>
        Need help? Make sure Bluetooth is enabled and the GoPro is in pairing mode.
      </Text>

      {/* WiFi Credentials Modal */}
      <Modal
        visible={showWiFiModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWiFiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.wifiModalContent}>
            <Text style={styles.modalTitle}>WiFi Configuration</Text>
            <Text style={styles.modalSubtitle}>
              Enter WiFi credentials for automatic network switching
            </Text>

            {/* Booth WiFi Section */}
            <Text style={styles.sectionTitle}>Booth WiFi (Main Network)</Text>
            <TextInput
              style={styles.modalInput}
              value={boothSSID}
              onChangeText={setBoothSSID}
              placeholder="Booth WiFi Name (SSID)"
              placeholderTextColor="#666"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              value={boothPassword}
              onChangeText={setBoothPassword}
              placeholder="Booth WiFi Password"
              placeholderTextColor="#666"
              secureTextEntry
              autoCapitalize="none"
            />

            {/* GoPro WiFi Section */}
            <Text style={styles.sectionTitle}>GoPro WiFi</Text>
            <TextInput
              style={styles.modalInput}
              value={goProSSID}
              onChangeText={setGoProSSID}
              placeholder="GoPro WiFi Name (e.g., GP50113778)"
              placeholderTextColor="#666"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              value={goProPassword}
              onChangeText={setGoProPassword}
              placeholder="GoPro WiFi Password"
              placeholderTextColor="#666"
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.modalHint}>
              💡 These credentials enable automatic WiFi switching for video downloads
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSkipButton}
                onPress={handleSkipWiFiSetup}
              >
                <Text style={styles.modalSkipText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveWiFiCredentials}
              >
                <Text style={styles.modalSaveText}>Save & Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 30,
  },
  deviceCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  deviceName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusConnected: {
    backgroundColor: '#4caf50',
  },
  statusDisconnected: {
    backgroundColor: '#666',
  },
  deviceInfo: {
    gap: 8,
  },
  deviceInfoText: {
    fontSize: 14,
    color: '#999',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  connectButton: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#4caf50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  wifiModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 450,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: '90%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
    marginTop: 16,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modalInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalSkipButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  modalSkipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4caf50',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Laptop Server Styles
  reconnectButton: {
    marginTop: 8,
    padding: 8,
    alignItems: 'center',
  },
  reconnectText: {
    color: '#2196f3',
    fontSize: 14,
  },
  laptopHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
