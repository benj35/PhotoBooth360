import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useSessionStore } from '@stores/sessionStore';
import { VideoMode, VideoResolution, LEDPreset } from '../types';

type SessionConfigScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SessionConfig'>;
};

export default function SessionConfigScreen({ navigation }: SessionConfigScreenProps) {
  const { config, updateConfig } = useSessionStore();
  const [localDuration, setLocalDuration] = useState(config.duration);
  const [localSpeed, setLocalSpeed] = useState(config.rotationSpeed);

  const durations = [10, 15, 20, 25, 30, 40, 60];
  const speeds = [20, 40, 60, 80, 100]; // Changed to 20% apart
  const videoModes: VideoMode[] = ['standard', 'slow-motion', 'time-lapse'];
  const resolutions: VideoResolution[] = ['1080p', '4k', '5.3k'];

  const ledPresets: Array<{ value: LEDPreset; label: string; color: string; description: string }> = [
    { value: 'off', label: 'LED Off', color: '#333333', description: 'No lighting' },
    { value: 'wedding-white', label: 'Wedding White', color: '#ffffff', description: 'Bright white for weddings' },
    { value: 'party-colors', label: 'Party Colors', color: '#ff00ff', description: 'Rainbow cycling effect' },
    { value: 'romantic-pink', label: 'Romantic Pink', color: '#ff69b4', description: 'Soft pink lighting' },
    { value: 'corporate-blue', label: 'Corporate Blue', color: '#1e90ff', description: 'Professional blue tone' },
    { value: 'energetic-red', label: 'Energetic Red', color: '#ff0000', description: 'Bold red lighting' },
    { value: 'cool-purple', label: 'Cool Purple', color: '#9370db', description: 'Modern purple vibe' },
  ];

  const handleSave = () => {
    updateConfig({
      duration: localDuration,
      rotationSpeed: localSpeed,
    });
    navigation.goBack();
  };

  const handleReset = () => {
    setLocalDuration(20);
    setLocalSpeed(50);
    updateConfig({
      duration: 20,
      rotationSpeed: 50,
      videoMode: 'standard',
      resolution: '4k',
      ledPreset: 'wedding-white',
    });
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {/* Duration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Duration</Text>
          <Text style={styles.sectionSubtitle}>How long should the recording last?</Text>

          <View style={styles.optionsGrid}>
            {durations.map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.optionButton,
                  localDuration === duration && styles.optionButtonSelected,
                ]}
                onPress={() => setLocalDuration(duration)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    localDuration === duration && styles.optionButtonTextSelected,
                  ]}
                >
                  {duration}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rotation Speed Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rotation Speed: {localSpeed}%</Text>
          <Text style={styles.sectionSubtitle}>Control how fast the booth rotates</Text>

          {/* Speed Preset Buttons - 20% apart */}
          <View style={styles.optionsGrid}>
            {speeds.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.optionButton,
                  localSpeed === speed && styles.optionButtonSelected,
                ]}
                onPress={() => setLocalSpeed(speed)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    localSpeed === speed && styles.optionButtonTextSelected,
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
              value={localSpeed}
              onValueChange={(value) => setLocalSpeed(Math.round(value))}
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
              value={localSpeed.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 1;
                const clampedValue = Math.max(1, Math.min(100, value));
                setLocalSpeed(clampedValue);
              }}
              keyboardType="number-pad"
              maxLength={3}
              placeholder="50"
              placeholderTextColor="#666"
            />
            <Text style={styles.inputUnit}>%</Text>
          </View>
        </View>

        {/* Video Mode Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Mode</Text>
          <Text style={styles.sectionSubtitle}>Choose the recording style</Text>

          <View style={styles.optionsList}>
            {videoModes.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.listOptionButton,
                  config.videoMode === mode && styles.listOptionButtonSelected,
                ]}
                onPress={() => updateConfig({ videoMode: mode })}
              >
                <Text
                  style={[
                    styles.listOptionText,
                    config.videoMode === mode && styles.listOptionTextSelected,
                  ]}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
                </Text>
                {config.videoMode === mode && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resolution Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Resolution</Text>
          <Text style={styles.sectionSubtitle}>Higher quality = larger file size</Text>

          <View style={styles.optionsList}>
            {resolutions.map((resolution) => (
              <TouchableOpacity
                key={resolution}
                style={[
                  styles.listOptionButton,
                  config.resolution === resolution && styles.listOptionButtonSelected,
                ]}
                onPress={() => updateConfig({ resolution })}
              >
                <Text
                  style={[
                    styles.listOptionText,
                    config.resolution === resolution && styles.listOptionTextSelected,
                  ]}
                >
                  {resolution.toUpperCase()}
                </Text>
                {config.resolution === resolution && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* LED Lighting Preset Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LED Lighting</Text>
          <Text style={styles.sectionSubtitle}>Select booth lighting for the session</Text>

          <View style={styles.optionsList}>
            {ledPresets.map((preset) => (
              <TouchableOpacity
                key={preset.value}
                style={[
                  styles.ledPresetOption,
                  config.ledPreset === preset.value && styles.ledPresetOptionSelected,
                ]}
                onPress={() => updateConfig({ ledPreset: preset.value })}
              >
                <View style={styles.ledPresetInfo}>
                  <View style={[styles.ledColorDot, { backgroundColor: preset.color }]} />
                  <View style={styles.ledPresetTextContainer}>
                    <Text
                      style={[
                        styles.listOptionText,
                        config.ledPreset === preset.value && styles.listOptionTextSelected,
                      ]}
                    >
                      {preset.label}
                    </Text>
                    <Text style={styles.ledPresetDescription}>{preset.description}</Text>
                  </View>
                </View>
                {config.ledPreset === preset.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#2a4a2a',
    borderColor: '#4caf50',
  },
  optionButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  optionButtonTextSelected: {
    color: '#fff',
  },
  optionsList: {
    gap: 10,
  },
  listOptionButton: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  listOptionButtonSelected: {
    backgroundColor: '#2a4a2a',
    borderColor: '#4caf50',
  },
  listOptionText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  listOptionTextSelected: {
    color: '#fff',
  },
  checkmark: {
    color: '#4caf50',
    fontSize: 20,
    fontWeight: 'bold',
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
  actions: {
    marginTop: 20,
    gap: 12,
  },
  resetButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4caf50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ledPresetOption: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  ledPresetOptionSelected: {
    backgroundColor: '#2a4a2a',
    borderColor: '#4caf50',
  },
  ledPresetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ledColorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#666',
  },
  ledPresetTextContainer: {
    flex: 1,
    gap: 4,
  },
  ledPresetDescription: {
    fontSize: 12,
    color: '#666',
  },
});
