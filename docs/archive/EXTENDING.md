# Extending the 360° Photo Booth System

Guide for developers who want to extend, customize, or integrate new features into the photo booth system.

---

## Table of Contents
1. [Adding New Devices](#adding-new-devices)
2. [Creating Custom UI Screens](#creating-custom-ui-screens)
3. [Extending Video Processing](#extending-video-processing)
4. [Adding New Session Types](#adding-new-session-types)
5. [Integration with External Systems](#integration-with-external-systems)
6. [Custom Branding](#custom-branding)

---

## Adding New Devices

### Example: Adding a Secondary Camera

**1. Create the Service**

```typescript
// src/services/SecondaryCameraService.ts
import { IDeviceService } from '@types/index';

export interface SecondaryCameraStatus {
  connected: boolean;
  recording: boolean;
  battery: number;
}

export class SecondaryCameraService implements IDeviceService {
  private isConnected = false;

  async connect(): Promise<void> {
    // Implement connection logic
    console.log('[SecondaryCamera] Connecting...');
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  async startRecording(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Secondary camera not connected');
    }
    // Recording logic
  }

  async stopRecording(): Promise<void> {
    // Stop recording logic
  }

  async getStatus(): Promise<SecondaryCameraStatus> {
    return {
      connected: this.isConnected,
      recording: false,
      battery: 100,
    };
  }
}

export default new SecondaryCameraService();
```

**2. Update Type Definitions**

```typescript
// src/types/index.ts
export interface DeviceConnectionState {
  gopro: { ... };
  booth: { ... };
  secondaryCamera: {  // Add this
    connected: boolean;
    recording: boolean;
    battery: number;
  };
}
```

**3. Update Device Store**

```typescript
// src/stores/deviceStore.ts
export const useDeviceStore = create<DeviceStore>((set, get) => ({
  devices: {
    // ... existing devices
    secondaryCamera: {
      connected: false,
      recording: false,
      battery: null,
    },
  },

  connectSecondaryCamera: async () => {
    await secondaryCameraService.connect();
    const status = await secondaryCameraService.getStatus();
    set((state) => ({
      devices: {
        ...state.devices,
        secondaryCamera: status,
      },
    }));
  },
}));
```

**4. Integrate into SessionOrchestrator**

```typescript
// src/services/SessionOrchestrator.ts
import secondaryCameraService from './SecondaryCameraService';

async startSession(config: SessionConfig): Promise<void> {
  // ... existing logic

  // Add secondary camera
  if (config.useSecondaryCamera) {
    await secondaryCameraService.startRecording();
  }

  // ... rest of logic
}
```

---

## Creating Custom UI Screens

### Example: Adding a Video Gallery Screen

**1. Create the Screen Component**

```typescript
// src/screens/GalleryScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  createdAt: number;
}

export default function GalleryScreen() {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    // Load videos from storage
    // Implementation depends on your storage solution
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video Gallery</Text>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VideoThumbnail video={item} />
        )}
      />
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});
```

**2. Add to Navigation**

```typescript
// App.tsx
import GalleryScreen from './src/screens/GalleryScreen';

export type RootStackParamList = {
  // ... existing screens
  Gallery: undefined;
};

<Stack.Screen
  name="Gallery"
  component={GalleryScreen}
  options={{ title: 'Video Gallery' }}
/>
```

**3. Add Navigation Link**

```typescript
// In HomeScreen.tsx or other screen
<TouchableOpacity
  onPress={() => navigation.navigate('Gallery')}
>
  <Text>View Gallery</Text>
</TouchableOpacity>
```

---

## Extending Video Processing

### Example: Adding a Custom Filter

**1. Create Filter Service**

```typescript
// src/services/VideoFilterService.ts
import { FFmpegKit } from 'ffmpeg-kit-react-native';

export class VideoFilterService {
  async applyVintageFilter(inputPath: string, outputPath: string): Promise<void> {
    const command = `-i ${inputPath} -vf "curves=vintage" -c:a copy ${outputPath}`;

    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    if (!returnCode.isSuccess()) {
      throw new Error('Filter application failed');
    }
  }

  async applyBlackAndWhite(inputPath: string, outputPath: string): Promise<void> {
    const command = `-i ${inputPath} -vf "hue=s=0" -c:a copy ${outputPath}`;
    await FFmpegKit.execute(command);
  }

  async applyCustomLUT(
    inputPath: string,
    lutPath: string,
    outputPath: string
  ): Promise<void> {
    const command = `-i ${inputPath} -vf "lut3d=${lutPath}" -c:a copy ${outputPath}`;
    await FFmpegKit.execute(command);
  }
}

export default new VideoFilterService();
```

**2. Create Filter Store**

```typescript
// src/stores/filterStore.ts
import { create } from 'zustand';

interface Filter {
  id: string;
  name: string;
  thumbnail: string;
  apply: (input: string, output: string) => Promise<void>;
}

interface FilterStore {
  availableFilters: Filter[];
  selectedFilter: Filter | null;
  selectFilter: (filter: Filter) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  availableFilters: [
    {
      id: 'vintage',
      name: 'Vintage',
      thumbnail: 'vintage_thumb.jpg',
      apply: videoFilterService.applyVintageFilter,
    },
    // ... more filters
  ],
  selectedFilter: null,
  selectFilter: (filter) => set({ selectedFilter: filter }),
}));
```

**3. Integrate into Processing Pipeline**

```typescript
// src/services/VideoProcessingService.ts
async processVideo(sessionId: string): Promise<string> {
  const session = await getSession(sessionId);
  const { selectedFilter } = useFilterStore.getState();

  let currentFile = session.rawVideoPath;

  // Apply filter if selected
  if (selectedFilter) {
    const filteredPath = `${outputDir}/filtered_${sessionId}.mp4`;
    await selectedFilter.apply(currentFile, filteredPath);
    currentFile = filteredPath;
  }

  // Continue with merging audio, etc.
  // ...

  return finalPath;
}
```

---

## Adding New Session Types

### Example: Adding a "Burst Mode" Session

**1. Update Types**

```typescript
// src/types/index.ts
export type SessionMode = 'standard' | 'burst' | 'timelapse';

export interface SessionConfig {
  // ... existing fields
  mode: SessionMode;
  burstCount?: number;  // For burst mode
  burstInterval?: number;  // Seconds between bursts
}
```

**2. Create Burst Session Logic**

```typescript
// src/services/BurstSessionService.ts
export class BurstSessionService {
  async executeBurstSession(config: SessionConfig): Promise<void> {
    const { burstCount = 3, burstInterval = 2 } = config;

    for (let i = 0; i < burstCount; i++) {
      console.log(`[Burst] Taking photo ${i + 1} of ${burstCount}`);

      // Trigger GoPro photo
      await goProService.takePhoto();

      // Wait for interval
      if (i < burstCount - 1) {
        await this.delay(burstInterval * 1000);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**3. Update SessionOrchestrator**

```typescript
// src/services/SessionOrchestrator.ts
async startSession(config: SessionConfig): Promise<void> {
  if (config.mode === 'burst') {
    return burstSessionService.executeBurstSession(config);
  }

  // Standard session logic
  // ...
}
```

**4. Add UI Controls**

```typescript
// src/screens/SessionConfigScreen.tsx
const sessionModes: SessionMode[] = ['standard', 'burst', 'timelapse'];

<View>
  <Text>Session Mode</Text>
  {sessionModes.map(mode => (
    <TouchableOpacity
      key={mode}
      onPress={() => updateConfig({ mode })}
    >
      <Text>{mode}</Text>
    </TouchableOpacity>
  ))}

  {config.mode === 'burst' && (
    <View>
      <Text>Burst Count: {config.burstCount}</Text>
      {/* Add slider or buttons to adjust */}
    </View>
  )}
</View>
```

---

## Integration with External Systems

### Example: Webhook Notifications

**1. Create Webhook Service**

```typescript
// src/services/WebhookService.ts
import axios from 'axios';

export interface WebhookConfig {
  url: string;
  events: string[];
  headers?: Record<string, string>;
}

export class WebhookService {
  private config: WebhookConfig | null = null;

  configure(config: WebhookConfig): void {
    this.config = config;
  }

  async send(event: string, data: any): Promise<void> {
    if (!this.config || !this.config.events.includes(event)) {
      return;
    }

    try {
      await axios.post(this.config.url, {
        event,
        timestamp: Date.now(),
        data,
      }, {
        headers: this.config.headers,
      });
    } catch (error) {
      console.error('[Webhook] Failed to send:', error);
    }
  }
}

export default new WebhookService();
```

**2. Integrate into SessionOrchestrator**

```typescript
// src/services/SessionOrchestrator.ts
async startSession(config: SessionConfig): Promise<void> {
  // ... session start logic

  await webhookService.send('session.started', {
    sessionId: generateId(),
    config,
  });

  // ...
}

async stopSession(): Promise<void> {
  // ... session stop logic

  await webhookService.send('session.completed', {
    sessionId: this.currentSessionId,
    duration: this.sessionState.elapsedTime,
  });
}
```

**3. Add Configuration UI**

```typescript
// src/screens/SettingsScreen.tsx
<TextInput
  placeholder="Webhook URL"
  value={webhookUrl}
  onChangeText={setWebhookUrl}
/>
<Button
  title="Save Webhook Config"
  onPress={() => {
    webhookService.configure({
      url: webhookUrl,
      events: ['session.started', 'session.completed'],
    });
  }}
/>
```

---

## Custom Branding

### Example: White-Label Configuration

**1. Create Theme Configuration**

```typescript
// src/config/theme.ts
export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  logo: string;
  companyName: string;
}

export const defaultTheme: ThemeConfig = {
  primaryColor: '#4caf50',
  secondaryColor: '#2196f3',
  backgroundColor: '#121212',
  logo: 'default_logo.png',
  companyName: '360° Photo Booth',
};

let currentTheme = defaultTheme;

export const setTheme = (theme: Partial<ThemeConfig>) => {
  currentTheme = { ...currentTheme, ...theme };
};

export const getTheme = (): ThemeConfig => currentTheme;
```

**2. Create Theme Store**

```typescript
// src/stores/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeStore {
  theme: ThemeConfig;
  updateTheme: (theme: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: defaultTheme,
      updateTheme: (themeUpdate) =>
        set((state) => ({
          theme: { ...state.theme, ...themeUpdate },
        })),
      resetTheme: () => set({ theme: defaultTheme }),
    }),
    {
      name: 'theme-storage',
      storage: AsyncStorage,
    }
  )
);
```

**3. Use Theme in Components**

```typescript
// src/screens/HomeScreen.tsx
const { theme } = useThemeStore();

<TouchableOpacity
  style={[
    styles.mainButton,
    { backgroundColor: theme.primaryColor }
  ]}
>
  <Text>{theme.companyName}</Text>
</TouchableOpacity>
```

**4. Add Branding Configuration Screen**

```typescript
// src/screens/BrandingScreen.tsx
export default function BrandingScreen() {
  const { theme, updateTheme } = useThemeStore();
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);

  return (
    <ScrollView>
      <Text>Primary Color</Text>
      <ColorPicker
        color={primaryColor}
        onColorChange={(color) => {
          setPrimaryColor(color);
          updateTheme({ primaryColor: color });
        }}
      />

      <Text>Company Logo</Text>
      <ImagePicker
        onImageSelected={(uri) => {
          updateTheme({ logo: uri });
        }}
      />

      {/* More customization options */}
    </ScrollView>
  );
}
```

---

## Best Practices for Extension

### 1. Follow Existing Patterns
- Use the same service interface pattern
- Keep stores in `src/stores/`
- Keep services in `src/services/`
- Follow TypeScript typing conventions

### 2. Maintain Backwards Compatibility
- Add new features as optional
- Don't break existing configurations
- Provide migration paths for data

### 3. Error Handling
```typescript
try {
  await newFeature.execute();
} catch (error) {
  console.error('[NewFeature] Error:', error);
  // Gracefully degrade or notify user
}
```

### 4. Testing
```typescript
// Add tests for new features
describe('NewFeature', () => {
  it('should work correctly', async () => {
    const result = await newFeature.execute();
    expect(result).toBe(expected);
  });
});
```

### 5. Documentation
- Update README with new features
- Add inline code comments
- Create examples for complex features
- Update ARCHITECTURE.md if needed

---

## Common Extension Scenarios

### Adding API Integration
1. Create service in `src/services/`
2. Add configuration to stores
3. Integrate into SessionOrchestrator or appropriate location
4. Add UI for configuration

### Adding UI Features
1. Create component in `src/components/` or screen in `src/screens/`
2. Add to navigation if it's a screen
3. Connect to appropriate store
4. Style consistently with existing UI

### Adding Processing Features
1. Create processing service
2. Integrate with VideoProcessingService
3. Add configuration options
4. Update UI to show processing status

### Adding Hardware Devices
1. Create device service implementing common interface
2. Update type definitions
3. Add to deviceStore
4. Integrate into SessionOrchestrator
5. Add connection UI

---

## Resources

- **React Native Docs**: https://reactnative.dev/
- **Zustand Docs**: https://github.com/pmndrs/zustand
- **GoPro API**: https://gopro.github.io/OpenGoPro/
- **FFmpeg Guide**: https://ffmpeg.org/documentation.html

---

**Questions or need help extending the system?**
- Open an issue on GitHub
- Check existing documentation
- Review code examples in this guide

---

**Last Updated:** 2025-10-12
