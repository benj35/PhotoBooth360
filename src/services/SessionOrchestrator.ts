import { ISessionOrchestrator, SessionConfig, SessionState } from '../types';
import goProService from './GoProService';
import boothService from './BoothService';
import audioService from './AudioService';
import wifiManager from './WiFiManagerService';
import goProWiFiService from './GoProWiFiService';

/**
 * Session Orchestrator - Coordinates all devices for automated recording sessions
 * This is the core service that manages the entire booth experience
 */
export class SessionOrchestrator implements ISessionOrchestrator {
  private sessionState: SessionState = {
    status: 'idle',
    startTime: null,
    elapsedTime: 0,
    error: null,
  };

  private stateChangeCallbacks: Array<(state: SessionState) => void> = [];
  private sessionTimer: NodeJS.Timeout | null = null;
  private elapsedTimer: NodeJS.Timeout | null = null;

  /**
   * Start a new recording session
   * Coordinates GoPro, booth rotation, and music playback
   */
  async startSession(config: SessionConfig): Promise<void> {
    console.log('[SessionOrchestrator] Starting session with config:', config);

    try {
      // Update state to preparing
      this.updateState({
        status: 'preparing',
        startTime: null,
        elapsedTime: 0,
        error: null,
      });

      // Validate device connections
      if (!goProService.isDeviceConnected()) {
        throw new Error('GoPro is not connected');
      }

      if (!boothService.isDeviceConnected()) {
        throw new Error('Booth is not connected');
      }

      // Step 1: Load music if selected
      if (config.musicTrackId) {
        console.log('[SessionOrchestrator] Loading music track');
        // In real implementation, we'd get the track URI from music store
        // For now, we'll skip if no URI provided
      }

      // Step 2: Set GoPro video mode and resolution
      console.log('[SessionOrchestrator] Configuring GoPro settings');
      await goProService.setVideoMode(config.videoMode);
      await goProService.setResolution(config.resolution);

      // Step 2.5: Apply LED preset
      console.log('[SessionOrchestrator] Applying LED preset:', config.ledPreset);
      await boothService.applyLEDPreset(config.ledPreset);

      // Small delay to ensure settings are applied
      await this.delay(500);

      // Step 3: Start coordinated recording
      console.log('[SessionOrchestrator] Starting coordinated recording');

      // Update state to recording
      this.updateState({
        status: 'recording',
        startTime: Date.now(),
        elapsedTime: 0,
        error: null,
      });

      // Start elapsed time counter
      this.startElapsedTimer();

      // Start all devices in sequence
      await boothService.startRotation(config.rotationSpeed);
      await this.delay(200); // Small delay between starts

      await goProService.startRecording();
      await this.delay(200);

      // Start music if loaded
      if (config.musicTrackId && audioService.isTrackLoaded()) {
        await audioService.play();
      }

      console.log('[SessionOrchestrator] All devices started successfully');

      // Schedule automatic stop
      this.scheduleSessionStop(config.duration * 1000);

    } catch (error) {
      console.error('[SessionOrchestrator] Error starting session:', error);
      await this.handleSessionError(error);
      throw error;
    }
  }

  /**
   * Stop the current recording session
   * IMPORTANT: This now includes automatic WiFi switching for video download
   */
  async stopSession(): Promise<void> {
    console.log('[SessionOrchestrator] Stopping session');

    try {
      // Update state to stopping
      this.updateState({
        ...this.sessionState,
        status: 'stopping',
      });

      // Clear timers
      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
        this.sessionTimer = null;
      }

      if (this.elapsedTimer) {
        clearInterval(this.elapsedTimer);
        this.elapsedTimer = null;
      }

      // Stop all devices (in reverse order)
      await audioService.stop();
      await this.delay(100);

      await goProService.stopRecording();
      await this.delay(100);

      await boothService.stopRotation();

      console.log('[SessionOrchestrator] All devices stopped successfully');

      // === NEW: AUTOMATIC WIFI SWITCHING FOR VIDEO DOWNLOAD ===
      console.log('[SessionOrchestrator] Starting automatic video download workflow...');

      // Step 1: Enable GoPro WiFi via BLE (required for Hero 13)
      console.log('[SessionOrchestrator] Enabling GoPro WiFi Access Point via BLE...');
      try {
        await goProService.enableWiFi();
        console.log('[SessionOrchestrator] ✅ GoPro WiFi enabled via BLE');

        // Wait for GoPro WiFi to fully activate (network needs time to broadcast)
        console.log('[SessionOrchestrator] Waiting 10 seconds for WiFi network to become visible...');
        console.log('[SessionOrchestrator] PLEASE CHECK: Look at GoPro screen - is WiFi icon visible?');
        await this.delay(10000);
      } catch (error) {
        console.error('[SessionOrchestrator] ❌ Failed to enable GoPro WiFi via BLE:', error);
        // Continue anyway - maybe WiFi was already enabled
      }

      // Step 2: Switch to GoPro WiFi
      console.log('[SessionOrchestrator] Switching to GoPro WiFi network for download...');
      const switchSuccess = await wifiManager.switchToGoProWiFi();

      if (switchSuccess) {
        console.log('[SessionOrchestrator] ✅ Connected to GoPro WiFi');

        // Step 3: Test GoPro WiFi connection
        const goProConnected = await goProWiFiService.testConnection();

        if (goProConnected) {
          console.log('[SessionOrchestrator] ✅ GoPro HTTP API is reachable');
          console.log('[SessionOrchestrator] Ready for video download!');

          // NOTE: Actual download will be triggered by UI
          // This just ensures we're connected and ready

        } else {
          console.error('[SessionOrchestrator] ❌ GoPro WiFi connected but API not reachable');
        }
      } else {
        console.error('[SessionOrchestrator] ❌ Failed to switch to GoPro WiFi');
      }

      // Update state to idle (UI will show download button)
      this.updateState({
        status: 'idle',
        startTime: null,
        elapsedTime: 0,
        error: null,
      });

    } catch (error) {
      console.error('[SessionOrchestrator] Error stopping session:', error);
      await this.handleSessionError(error);
      throw error;
    }
  }

  /**
   * Get current session state
   */
  getSessionState(): SessionState {
    return { ...this.sessionState };
  }

  /**
   * Subscribe to session state changes
   */
  onStateChange(callback: (state: SessionState) => void): () => void {
    this.stateChangeCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Private helper methods
   */

  private updateState(newState: Partial<SessionState>): void {
    this.sessionState = {
      ...this.sessionState,
      ...newState,
    };

    // Notify all callbacks
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(this.getSessionState());
      } catch (error) {
        console.error('[SessionOrchestrator] Error in state change callback:', error);
      }
    });
  }

  private scheduleSessionStop(duration: number): void {
    this.sessionTimer = setTimeout(async () => {
      console.log('[SessionOrchestrator] Auto-stopping session after duration');
      await this.stopSession();
    }, duration);
  }

  private startElapsedTimer(): void {
    this.elapsedTimer = setInterval(() => {
      if (this.sessionState.startTime) {
        const elapsed = Date.now() - this.sessionState.startTime;
        this.updateState({
          elapsedTime: Math.floor(elapsed / 1000),
        });
      }
    }, 1000);
  }

  private async handleSessionError(error: any): Promise<void> {
    console.error('[SessionOrchestrator] Handling session error:', error);

    // Try to stop all devices gracefully
    try {
      await audioService.stop();
    } catch (e) {
      console.error('[SessionOrchestrator] Error stopping audio:', e);
    }

    try {
      await goProService.stopRecording();
    } catch (e) {
      console.error('[SessionOrchestrator] Error stopping GoPro:', e);
    }

    try {
      await boothService.stopRotation();
    } catch (e) {
      console.error('[SessionOrchestrator] Error stopping booth:', e);
    }

    // Clear timers
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    if (this.elapsedTimer) {
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }

    // Update state to error
    this.updateState({
      status: 'error',
      error: error.message || 'Unknown error occurred',
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Emergency stop - forces all devices to stop immediately
   */
  async emergencyStop(): Promise<void> {
    console.log('[SessionOrchestrator] EMERGENCY STOP');

    // Clear all timers
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    if (this.elapsedTimer) {
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }

    // Force stop all devices without waiting
    const stopPromises = [
      audioService.stop().catch(e => console.error('Audio stop failed:', e)),
      goProService.stopRecording().catch(e => console.error('GoPro stop failed:', e)),
      boothService.stopRotation().catch(e => console.error('Booth stop failed:', e)),
    ];

    await Promise.allSettled(stopPromises);

    this.updateState({
      status: 'idle',
      startTime: null,
      elapsedTime: 0,
      error: null,
    });
  }
}

export default new SessionOrchestrator();
