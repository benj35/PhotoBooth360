import Sound from 'react-native-sound';
import { IAudioService } from '@types/index';

/**
 * Audio Service - Handles music playback during sessions
 */
export class AudioService implements IAudioService {
  private sound: Sound | null = null;
  private isLoaded = false;
  private isPaused = false;

  constructor() {
    // Enable playback in silence mode
    Sound.setCategory('Playback');
  }

  async loadTrack(uri: string): Promise<void> {
    console.log('[Audio] Loading track:', uri);

    // Release previous sound if any
    if (this.sound) {
      this.sound.release();
      this.sound = null;
      this.isLoaded = false;
    }

    return new Promise((resolve, reject) => {
      this.sound = new Sound(uri, '', (error) => {
        if (error) {
          console.error('[Audio] Failed to load track:', error);
          reject(error);
          return;
        }

        this.isLoaded = true;
        console.log('[Audio] Track loaded successfully');
        console.log('[Audio] Duration:', this.sound?.getDuration());
        resolve();
      });
    });
  }

  async play(): Promise<void> {
    if (!this.isLoaded || !this.sound) {
      throw new Error('No track loaded');
    }

    return new Promise((resolve, reject) => {
      if (!this.sound) {
        reject(new Error('Sound object is null'));
        return;
      }

      console.log('[Audio] Playing track');
      this.isPaused = false;

      this.sound.play((success) => {
        if (success) {
          console.log('[Audio] Playback finished successfully');
          resolve();
        } else {
          console.error('[Audio] Playback failed');
          reject(new Error('Playback failed'));
        }
      });
    });
  }

  async pause(): Promise<void> {
    if (!this.isLoaded || !this.sound) {
      throw new Error('No track loaded');
    }

    console.log('[Audio] Pausing track');
    this.sound.pause();
    this.isPaused = true;
  }

  async stop(): Promise<void> {
    if (!this.isLoaded || !this.sound) {
      return; // No error if nothing to stop
    }

    console.log('[Audio] Stopping track');
    this.sound.stop(() => {
      console.log('[Audio] Track stopped');
    });
    this.isPaused = false;
  }

  getDuration(): number {
    if (!this.isLoaded || !this.sound) {
      return 0;
    }

    return this.sound.getDuration();
  }

  getCurrentTime(): number {
    if (!this.isLoaded || !this.sound) {
      return 0;
    }

    return new Promise((resolve) => {
      if (!this.sound) {
        resolve(0);
        return;
      }

      this.sound.getCurrentTime((seconds) => {
        resolve(seconds);
      });
    }) as any;
  }

  // Utility methods
  isTrackLoaded(): boolean {
    return this.isLoaded;
  }

  isPlaying(): boolean {
    return this.isLoaded && !this.isPaused && this.sound?.isPlaying() === true;
  }

  setVolume(volume: number): void {
    if (this.sound) {
      this.sound.setVolume(Math.max(0, Math.min(1, volume)));
    }
  }

  release(): void {
    if (this.sound) {
      this.sound.release();
      this.sound = null;
      this.isLoaded = false;
      this.isPaused = false;
      console.log('[Audio] Released sound resources');
    }
  }
}

export default new AudioService();
