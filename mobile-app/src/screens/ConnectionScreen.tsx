import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useDeviceStore } from '@stores/deviceStore';

type ConnectionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Connection'>;
};

export default function ConnectionScreen({ navigation }: ConnectionScreenProps) {
  const [boothUrl, setBoothUrl] = useState('http://192.168.1.100');
  const { devices, connecting, connectGoPro, connectBooth } = useDeviceStore();

  const handleConnectGoPro = async () => {
    try {
      await connectGoPro();
      Alert.alert('Success', 'GoPro connected successfully');
    } catch (error: any) {
      Alert.alert('Error', `Failed to connect GoPro: ${error.message}`);
    }
  };

  const handleConnectBooth = async () => {
    try {
      await connectBooth(boothUrl);
      Alert.alert('Success', 'Booth connected successfully');
    } catch (error: any) {
      Alert.alert('Error', `Failed to connect booth: ${error.message}`);
    }
  };

  const handleContinue = () => {
    if (!devices.gopro.connected || !devices.booth.connected) {
      Alert.alert('Warning', 'Please connect both devices before continuing');
      return;
    }
    navigation.navigate('Home');
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
            <Text style={styles.deviceInfoText}>Battery: {devices.gopro.battery}%</Text>
            <Text style={styles.deviceInfoText}>
              Storage: {devices.gopro.storageRemaining} MB
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

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          (!devices.gopro.connected || !devices.booth.connected) &&
            styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!devices.gopro.connected || !devices.booth.connected}
      >
        <Text style={styles.buttonText}>Continue to App</Text>
      </TouchableOpacity>

      <Text style={styles.helpText}>
        Need help? Make sure Bluetooth is enabled and the GoPro is in pairing mode.
      </Text>
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
});
