// Core type definitions for PhotoBooth360

export interface SessionConfig {
  duration: number; // in seconds
  musicTrackId: string | null;
  rotationSpeed: number; // 0-100
  videoMode: VideoMode;
  resolution: VideoResolution;
  ledPreset: LEDPreset;
}

export type LEDPreset = 'off' | 'wedding-white' | 'party-colors' | 'romantic-pink' | 'corporate-blue' | 'energetic-red' | 'cool-purple';

export type VideoMode = 'standard' | 'slow-motion' | 'time-lapse';
export type VideoResolution = '1080p' | '4k' | '5.3k';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  uri: string; // local file path or URL
  thumbnailUri?: string;
}

export interface SessionState {
  status: 'idle' | 'preparing' | 'recording' | 'stopping' | 'processing' | 'error';
  startTime: number | null;
  elapsedTime: number;
  error: string | null;
}

export interface DeviceConnectionState {
  gopro: {
    connected: boolean;
    battery: number | null;
    recording: boolean;
    storageRemaining: number | null; // in MB
  };
  booth: {
    connected: boolean;
    rotating: boolean;
    currentSpeed: number;
  };
}

export interface ProcessingJob {
  id: string;
  sessionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  videoUri: string | null;
  createdAt: number;
}

// GoPro BLE Types
export interface GoProStatus {
  battery: number;
  recording: boolean;
  encoding: boolean;
  sdCardSpace: number; // in MB
  videoMode: string;
  resolution: string;
}

// ESP32 Booth Types
export interface BoothStatus {
  rotating: boolean;
  speed: number;
  temperature: number;
  errorCode: number | null;
}

// Service Interfaces
export interface IGoProService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  getStatus(): Promise<GoProStatus>;
  setVideoMode(mode: VideoMode): Promise<void>;
  setResolution(resolution: VideoResolution): Promise<void>;
}

export interface IBoothService {
  connect(baseUrl: string): Promise<void>;
  disconnect(): Promise<void>;
  startRotation(speed: number): Promise<void>;
  stopRotation(): Promise<void>;
  getStatus(): Promise<BoothStatus>;
}

export interface IAudioService {
  loadTrack(uri: string): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  getDuration(): number;
  getCurrentTime(): number;
}

export interface ISessionOrchestrator {
  startSession(config: SessionConfig): Promise<void>;
  stopSession(): Promise<void>;
  getSessionState(): SessionState;
  onStateChange(callback: (state: SessionState) => void): () => void;
}
