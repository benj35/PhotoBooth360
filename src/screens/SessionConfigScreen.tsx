import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useSessionStore } from '@stores/sessionStore';
import { VideoMode, VideoResolution } from '@types/index';

type SessionConfigScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SessionConfig'>;
};

export default function SessionConfigScreen({ navigation }: SessionConfigScreenProps) {
  const { config, updateConfig } = useSessionStore();
  const [localDuration, setLocalDuration] = useState(config.duration);
  const [localSpeed, setLocalSpeed] = useState(config.rotationSpeed);

  const durations = [10, 15, 20, 25, 30, 40, 60];
  const speeds = [25, 50, 75, 100];
  const videoModes: VideoMode[] = ['standard', 'slow-motion', 'time-lapse'];
  const resolutions: VideoResolution[] = ['1080p', '4k', '5.3k'];

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
    });
  };

  return (
    <ScrollView style={styles.container}>
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
          <Text style={styles.sectionTitle}>Rotation Speed</Text>
          <Text style={styles.sectionSubtitle}>Control how fast the booth rotates</Text>

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
});
