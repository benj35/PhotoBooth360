import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useDeviceStore } from '@stores/deviceStore';
import goProService from '@services/GoProService';
import boothService from '@services/BoothService';
import audioService from '@services/AudioService';
import { useMusicStore } from '@stores/musicStore';

type ManualControlScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ManualControl'>;
};

export default function ManualControlScreen({ navigation }: ManualControlScreenProps) {
  const { devices, refreshStatus } = useDeviceStore();
  const { selectedTrack } = useMusicStore();

  const [goProRecording, setGoProRecording] = useState(false);
  const [boothRotating, setBoothRotating] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(50);

  // LED Control State
  const [ledPower, setLedPower] = useState(false);
  const [ledBrightness, setLedBrightness] = useState(255);
  const [ledMode, setLedMode] = useState<'solid' | 'blink' | 'fade'>('solid');
  const [ledR, setLedR] = useState(255);
  const [ledG, setLedG] = useState(255);
  const [ledB, setLedB] = useState(255);
  const [ledInterval, setLedInterval] = useState(500);
  const [ledSpeed, setLedSpeed] = useState(20);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleGoProToggle = async () => {
    try {
      if (goProRecording) {
        await goProService.stopRecording();
        setGoProRecording(false);
        Alert.alert('Success', 'Recording stopped');
      } else {
        await goProService.startRecording();
        setGoProRecording(true);
        Alert.alert('Success', 'Recording started');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleBoothToggle = async () => {
    try {
      if (boothRotating) {
        await boothService.stopRotation();
        setBoothRotating(false);
      } else {
        await boothService.startRotation(rotationSpeed);
        setBoothRotating(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAudioToggle = async () => {
    try {
      if (!selectedTrack) {
        Alert.alert('No Music', 'Please select a track first');
        navigation.navigate('MusicSelection');
        return;
      }

      if (audioPlaying) {
        await audioService.stop();
        setAudioPlaying(false);
      } else {
        await audioService.play();
        setAudioPlaying(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setRotationSpeed(speed);
    if (boothRotating) {
      boothService.startRotation(speed);
    }
  };

  const handleLedToggle = async () => {
    try {
      if (!devices.booth.connected) {
        Alert.alert('Error', 'Booth is not connected');
        return;
      }

      const newPowerState = !ledPower;
      setLedPower(newPowerState);

      if (newPowerState) {
        await boothService.setLED(
          'on',
          ledBrightness,
          ledMode,
          ledR,
          ledG,
          ledB,
          ledInterval,
          ledSpeed
        );
      } else {
        await boothService.ledOff();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLedUpdate = async () => {
    try {
      if (!devices.booth.connected) {
        Alert.alert('Error', 'Booth is not connected');
        return;
      }

      if (ledPower) {
        await boothService.setLED(
          'on',
          ledBrightness,
          ledMode,
          ledR,
          ledG,
          ledB,
          ledInterval,
          ledSpeed
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLedPreset = async (r: number, g: number, b: number, name: string) => {
    try {
      if (!devices.booth.connected) {
        Alert.alert('Error', 'Booth is not connected');
        return;
      }

      setLedR(r);
      setLedG(g);
      setLedB(b);
      setLedMode('solid');
      setLedPower(true);

      await boothService.ledColor(r, g, b, ledBrightness);
      Alert.alert('Success', `LED set to ${name}`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Manual Device Control</Text>
        <Text style={styles.subtitle}>
          Control each device individually for testing
        </Text>

        {/* GoPro Controls */}
        <View style={styles.controlCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>GoPro Camera</Text>
            <View
              style={[
                styles.statusDot,
                devices.gopro.connected ? styles.statusConnected : styles.statusDisconnected,
              ]}
            />
          </View>

          {devices.gopro.connected ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Battery:</Text>
                <Text style={styles.infoValue}>{devices.gopro.battery}%</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Storage:</Text>
                <Text style={styles.infoValue}>{devices.gopro.storageRemaining} MB</Text>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Recording</Text>
                <Switch
                  value={goProRecording}
                  onValueChange={handleGoProToggle}
                  trackColor={{ false: '#333', true: '#4caf50' }}
                  thumbColor={goProRecording ? '#fff' : '#999'}
                />
              </View>
            </>
          ) : (
            <Text style={styles.notConnectedText}>Not connected</Text>
          )}
        </View>

        {/* Booth Controls */}
        <View style={styles.controlCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>360° Booth</Text>
            <View
              style={[
                styles.statusDot,
                devices.booth.connected ? styles.statusConnected : styles.statusDisconnected,
              ]}
            />
          </View>

          {devices.booth.connected ? (
            <>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Rotation</Text>
                <Switch
                  value={boothRotating}
                  onValueChange={handleBoothToggle}
                  trackColor={{ false: '#333', true: '#4caf50' }}
                  thumbColor={boothRotating ? '#fff' : '#999'}
                />
              </View>

              <Text style={styles.speedLabel}>Rotation Speed: {rotationSpeed}%</Text>

              {/* Speed Preset Buttons - 20% apart */}
              <View style={styles.speedButtons}>
                {[20, 40, 60, 80, 100].map((speed) => (
                  <TouchableOpacity
                    key={speed}
                    style={[
                      styles.speedButton,
                      rotationSpeed === speed && styles.speedButtonSelected,
                    ]}
                    onPress={() => handleSpeedChange(speed)}
                  >
                    <Text
                      style={[
                        styles.speedButtonText,
                        rotationSpeed === speed && styles.speedButtonTextSelected,
                      ]}
                    >
                      {speed}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Slider Control */}
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Fine Control:</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={100}
                  step={1}
                  value={rotationSpeed}
                  onValueChange={(value) => handleSpeedChange(Math.round(value))}
                  minimumTrackTintColor="#4caf50"
                  maximumTrackTintColor="#333"
                  thumbTintColor="#4caf50"
                />
              </View>

              {/* Manual Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Exact Value:</Text>
                <TextInput
                  style={styles.speedInput}
                  value={rotationSpeed.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 1;
                    const clampedValue = Math.max(1, Math.min(100, value));
                    handleSpeedChange(clampedValue);
                  }}
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholder="50"
                  placeholderTextColor="#666"
                />
                <Text style={styles.inputUnit}>%</Text>
              </View>
            </>
          ) : (
            <Text style={styles.notConnectedText}>Not connected</Text>
          )}
        </View>

        {/* LED Controls */}
        <View style={styles.controlCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>LED Lights</Text>
          </View>

          {devices.booth.connected ? (
            <>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>LED Power</Text>
                <Switch
                  value={ledPower}
                  onValueChange={handleLedToggle}
                  trackColor={{ false: '#333', true: '#4caf50' }}
                  thumbColor={ledPower ? '#fff' : '#999'}
                />
              </View>

              {ledPower && (
                <>
                  {/* Quick Presets */}
                  <Text style={styles.speedLabel}>Quick Presets:</Text>
                  <View style={styles.speedButtons}>
                    <TouchableOpacity
                      style={styles.ledPresetButton}
                      onPress={() => handleLedPreset(255, 255, 255, 'White')}
                    >
                      <View style={[styles.ledPreviewDot, { backgroundColor: '#ffffff' }]} />
                      <Text style={styles.ledPresetText}>White</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.ledPresetButton}
                      onPress={() => handleLedPreset(255, 0, 0, 'Red')}
                    >
                      <View style={[styles.ledPreviewDot, { backgroundColor: '#ff0000' }]} />
                      <Text style={styles.ledPresetText}>Red</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.ledPresetButton}
                      onPress={() => handleLedPreset(0, 255, 0, 'Green')}
                    >
                      <View style={[styles.ledPreviewDot, { backgroundColor: '#00ff00' }]} />
                      <Text style={styles.ledPresetText}>Green</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.ledPresetButton}
                      onPress={() => handleLedPreset(0, 0, 255, 'Blue')}
                    >
                      <View style={[styles.ledPreviewDot, { backgroundColor: '#0000ff' }]} />
                      <Text style={styles.ledPresetText}>Blue</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Mode Selection */}
                  <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Mode:</Text>
                    <View style={styles.speedButtons}>
                      {['solid', 'blink', 'fade'].map((mode) => (
                        <TouchableOpacity
                          key={mode}
                          style={[
                            styles.speedButton,
                            ledMode === mode && styles.speedButtonSelected,
                          ]}
                          onPress={() => {
                            setLedMode(mode as 'solid' | 'blink' | 'fade');
                            handleLedUpdate();
                          }}
                        >
                          <Text
                            style={[
                              styles.speedButtonText,
                              ledMode === mode && styles.speedButtonTextSelected,
                            ]}
                          >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Brightness Control */}
                  <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Brightness: {ledBrightness}</Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={255}
                      step={1}
                      value={ledBrightness}
                      onValueChange={setLedBrightness}
                      onSlidingComplete={handleLedUpdate}
                      minimumTrackTintColor="#4caf50"
                      maximumTrackTintColor="#333"
                      thumbTintColor="#4caf50"
                    />
                  </View>

                  {/* RGB Color Controls */}
                  <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Red: {ledR}</Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={255}
                      step={1}
                      value={ledR}
                      onValueChange={setLedR}
                      onSlidingComplete={handleLedUpdate}
                      minimumTrackTintColor="#ff0000"
                      maximumTrackTintColor="#333"
                      thumbTintColor="#ff0000"
                    />
                  </View>

                  <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Green: {ledG}</Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={255}
                      step={1}
                      value={ledG}
                      onValueChange={setLedG}
                      onSlidingComplete={handleLedUpdate}
                      minimumTrackTintColor="#00ff00"
                      maximumTrackTintColor="#333"
                      thumbTintColor="#00ff00"
                    />
                  </View>

                  <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Blue: {ledB}</Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={255}
                      step={1}
                      value={ledB}
                      onValueChange={setLedB}
                      onSlidingComplete={handleLedUpdate}
                      minimumTrackTintColor="#0000ff"
                      maximumTrackTintColor="#333"
                      thumbTintColor="#0000ff"
                    />
                  </View>

                  {/* Blink Interval (only for blink mode) */}
                  {ledMode === 'blink' && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Blink Interval:</Text>
                      <TextInput
                        style={styles.speedInput}
                        value={ledInterval.toString()}
                        onChangeText={(text) => {
                          const value = parseInt(text) || 100;
                          const clampedValue = Math.max(100, Math.min(5000, value));
                          setLedInterval(clampedValue);
                        }}
                        onBlur={handleLedUpdate}
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="500"
                        placeholderTextColor="#666"
                      />
                      <Text style={styles.inputUnit}>ms</Text>
                    </View>
                  )}

                  {/* Fade Speed (only for fade mode) */}
                  {ledMode === 'fade' && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Fade Speed:</Text>
                      <TextInput
                        style={styles.speedInput}
                        value={ledSpeed.toString()}
                        onChangeText={(text) => {
                          const value = parseInt(text) || 1;
                          const clampedValue = Math.max(1, Math.min(40, value));
                          setLedSpeed(clampedValue);
                        }}
                        onBlur={handleLedUpdate}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="20"
                        placeholderTextColor="#666"
                      />
                      <Text style={styles.inputUnit}>(1-40)</Text>
                    </View>
                  )}

                  {/* Color Preview */}
                  <View style={styles.colorPreviewContainer}>
                    <Text style={styles.sliderLabel}>Current Color:</Text>
                    <View
                      style={[
                        styles.colorPreview,
                        { backgroundColor: `rgb(${ledR}, ${ledG}, ${ledB})` },
                      ]}
                    />
                  </View>
                </>
              )}
            </>
          ) : (
            <Text style={styles.notConnectedText}>Not connected</Text>
          )}
        </View>

        {/* Audio Controls */}
        <View style={styles.controlCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Audio Playback</Text>
          </View>

          {selectedTrack ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Track:</Text>
                <Text style={styles.infoValue}>{selectedTrack.title}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Artist:</Text>
                <Text style={styles.infoValue}>{selectedTrack.artist}</Text>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Playing</Text>
                <Switch
                  value={audioPlaying}
                  onValueChange={handleAudioToggle}
                  trackColor={{ false: '#333', true: '#4caf50' }}
                  thumbColor={audioPlaying ? '#fff' : '#999'}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.notConnectedText}>No track selected</Text>
              <TouchableOpacity
                style={styles.selectMusicButton}
                onPress={() => navigation.navigate('MusicSelection')}
              >
                <Text style={styles.selectMusicText}>Select Music</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Manual Mode</Text>
          <Text style={styles.warningText}>
            Manual controls are for testing only. Use the main session button for coordinated
            recording.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  controlCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusConnected: {
    backgroundColor: '#4caf50',
  },
  statusDisconnected: {
    backgroundColor: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  switchLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  speedLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    marginBottom: 8,
  },
  speedButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  speedButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  speedButtonSelected: {
    backgroundColor: '#2a4a2a',
    borderColor: '#4caf50',
  },
  speedButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  speedButtonTextSelected: {
    color: '#fff',
  },
  sliderContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  sliderLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  inputLabel: {
    fontSize: 14,
    color: '#999',
    marginRight: 12,
  },
  speedInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  inputUnit: {
    fontSize: 16,
    color: '#999',
    marginLeft: 8,
    fontWeight: '600',
  },
  notConnectedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  selectMusicButton: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  selectMusicText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: '#3a2a1e',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9800',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#ffb74d',
  },
  ledPresetButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  ledPreviewDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
  },
  ledPresetText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  colorPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 12,
  },
  colorPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#666',
  },
});
