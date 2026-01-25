import { ISessionOrchestrator, SessionConfig, SessionState } from '../types';
import goProService from './GoProService';
import boothService from './BoothService';
import audioService from './AudioService';
import wifiManager from './WiFiManagerService';
import goProWiFiService from './GoProWiFiService';
import laptopTransferService from './LaptopTransferService';

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
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;
  private elapsedTimer: ReturnType<typeof setInterval> | null = null;
  private currentConfig: SessionConfig | null = null; // Store config for laptop processing

  /**
   * Start a new recording session
   * Coordinates GoPro, booth rotation, and music playback
   */
  async startSession(config: SessionConfig): Promise<void> {
    console.log('[SessionOrchestrator] Starting session with config:', config);

    // Store config for use in stopSession (for laptop processing)
    this.currentConfig = config;

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
   * Uses stored currentConfig from startSession for laptop processing
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

      // === AUTOMATIC WIFI SWITCHING FOR VIDEO DOWNLOAD ===
      // Wrapped in try-catch to prevent crashes - WiFi switching is optional
      try {
        console.log('[SessionOrchestrator] Starting automatic video download workflow...');

        // Update status - starting download workflow
        this.updateState({
          ...this.sessionState,
          status: 'downloading',
          downloadStatus: 'Enabling GoPro WiFi...',
          downloadProgress: 0,
        });

        // Step 1: Enable GoPro WiFi via BLE (required for Hero 13)
        console.log('[SessionOrchestrator] Enabling GoPro WiFi Access Point via BLE...');
        try {
          await goProService.enableWiFi();
          console.log('[SessionOrchestrator] ✅ GoPro WiFi enabled via BLE');
        } catch (enableError) {
          console.error('[SessionOrchestrator] ❌ Failed to enable GoPro WiFi via BLE:', enableError);
          // Continue anyway - maybe WiFi was already enabled
        }

        // Step 2: Check if GoPro WiFi is available
        this.updateState({
          ...this.sessionState,
          downloadStatus: 'Scanning for GoPro WiFi...',
          downloadProgress: 10,
        });

        // First quick check
        let wifiAvailable = await wifiManager.isGoProWiFiAvailable();

        if (!wifiAvailable) {
          // WiFi not available - wait a bit and check again
          this.updateState({
            ...this.sessionState,
            downloadStatus: 'Waiting for GoPro WiFi to appear...',
            downloadProgress: 12,
          });

          // Wait up to 15 seconds for WiFi to appear
          wifiAvailable = await wifiManager.waitForGoProWiFi(15, 3000);
        }

        if (!wifiAvailable) {
          // Still not available - prompt user to activate via GoPro Quik
          console.log('[SessionOrchestrator] ⚠️ GoPro WiFi not available - user needs to activate via Quik app');
          this.updateState({
            ...this.sessionState,
            status: 'waiting_for_wifi',
            downloadStatus: 'Open GoPro Quik → Media → Transfer to activate WiFi',
            downloadProgress: 0,
          });

          // Wait for user action - check every 5 seconds for up to 2 minutes
          const maxWaitForUser = 120; // 2 minutes
          const checkInterval = 5000; // 5 seconds
          const startWait = Date.now();

          while (Date.now() - startWait < maxWaitForUser * 1000) {
            await this.delay(checkInterval);
            wifiAvailable = await wifiManager.isGoProWiFiAvailable();

            if (wifiAvailable) {
              console.log('[SessionOrchestrator] ✅ GoPro WiFi is now available!');
              this.updateState({
                ...this.sessionState,
                downloadStatus: 'GoPro WiFi detected!',
                downloadProgress: 15,
              });
              break;
            }

            const elapsed = Math.round((Date.now() - startWait) / 1000);
            console.log(`[SessionOrchestrator] Still waiting for GoPro WiFi... (${elapsed}s)`);
          }

          if (!wifiAvailable) {
            console.error('[SessionOrchestrator] ❌ User did not activate GoPro WiFi in time');
            this.updateState({
              ...this.sessionState,
              downloadStatus: 'WiFi activation timed out - video not downloaded',
              downloadProgress: 0,
            });
            // Skip the download workflow
            throw new Error('GoPro WiFi not activated');
          }
        }

        // Step 3: Switch to GoPro WiFi (using pre-configured credentials from ConnectionScreen)
        this.updateState({
          ...this.sessionState,
          downloadStatus: 'Connecting to GoPro WiFi...',
          downloadProgress: 20,
        });
        console.log('[SessionOrchestrator] Switching to GoPro WiFi network for download...');
        let switchSuccess = false;
        try {
          switchSuccess = await wifiManager.switchToGoProWiFi();
        } catch (switchError) {
          console.error('[SessionOrchestrator] ❌ WiFi switch error:', switchError);
        }

        if (switchSuccess) {
          console.log('[SessionOrchestrator] ✅ Connected to GoPro WiFi');

          // Step 3: Test GoPro WiFi connection
          this.updateState({
            ...this.sessionState,
            downloadStatus: 'Testing GoPro connection...',
            downloadProgress: 30,
          });
          try {
            const goProConnected = await goProWiFiService.testConnection();

            if (goProConnected) {
              console.log('[SessionOrchestrator] ✅ GoPro HTTP API is reachable');

              // Step 4: Download the latest video
              this.updateState({
                ...this.sessionState,
                downloadStatus: 'Finding latest video...',
                downloadProgress: 40,
              });
              console.log('[SessionOrchestrator] Starting video download...');
              try {
                // Ensure download directory exists
                await goProWiFiService.ensureDownloadDirectory();

                // Get the latest video info
                const latestVideo = await goProWiFiService.getLatestVideo();

                if (latestVideo) {
                  const sizeMB = Math.round(latestVideo.size / 1024 / 1024);
                  console.log('[SessionOrchestrator] Latest video found:', latestVideo.filename);
                  console.log('[SessionOrchestrator] Size:', sizeMB, 'MB');

                  this.updateState({
                    ...this.sessionState,
                    downloadStatus: `Downloading video (${sizeMB} MB)...`,
                    downloadProgress: 45,
                  });

                  // Generate destination filename
                  const destFilename = goProWiFiService.generateFilename('PhotoBooth', 'Session');
                  const destPath = `${goProWiFiService.getActualDownloadDirectory()}/${destFilename}`;

                  console.log('[SessionOrchestrator] Downloading to:', destPath);

                  // Download with progress
                  const downloadedPath = await goProWiFiService.downloadVideo(
                    latestVideo.filename,
                    destPath,
                    (progress) => {
                      console.log(`[SessionOrchestrator] Download progress: ${progress}%`);
                      // Map download progress to 45-90% of total progress
                      const totalProgress = 45 + Math.round(progress * 0.45);
                      this.updateState({
                        ...this.sessionState,
                        downloadStatus: `Downloading... ${progress}%`,
                        downloadProgress: totalProgress,
                      });
                    }
                  );

                  console.log('[SessionOrchestrator] ✅ Video downloaded:', downloadedPath);

                  // Step 5: Switch back to booth WiFi
                  this.updateState({
                    ...this.sessionState,
                    downloadStatus: 'Switching back to booth WiFi...',
                    downloadProgress: 96,
                  });
                  console.log('[SessionOrchestrator] Switching back to booth WiFi...');
                  try {
                    const switchBackSuccess = await wifiManager.switchToBoothWiFi();
                    if (switchBackSuccess) {
                      console.log('[SessionOrchestrator] ✅ Back on booth WiFi');

                      // Wait for WiFi connection to stabilize and verify we can reach the laptop
                      // Note: SSID check is unreliable because GoPro sometimes spoofs SSID names
                      // Instead, we verify by actually reaching the laptop server
                      this.updateState({
                        ...this.sessionState,
                        downloadStatus: 'Verifying network connection...',
                        downloadProgress: 97,
                      });

                      // Wait up to 30 seconds for laptop to be reachable
                      let canReachLaptop = false;
                      for (let attempt = 1; attempt <= 10; attempt++) {
                        console.log(`[SessionOrchestrator] Verifying laptop reachable (attempt ${attempt}/10)...`);

                        // First wait for network to stabilize
                        await this.delay(3000);

                        // Log current SSID for debugging
                        try {
                          const currentSSID = await wifiManager.getCurrentSSID();
                          console.log(`[SessionOrchestrator] Current SSID: ${currentSSID}`);
                        } catch (e) {
                          console.log('[SessionOrchestrator] Could not get current SSID');
                        }

                        // Try to reach the laptop server
                        try {
                          const health = await laptopTransferService.checkHealth();
                          console.log('[SessionOrchestrator] ✅ Laptop server reachable:', health);
                          canReachLaptop = true;
                          break;
                        } catch (healthError) {
                          console.log(`[SessionOrchestrator] Laptop not reachable yet: ${healthError}`);
                        }

                        this.updateState({
                          ...this.sessionState,
                          downloadStatus: `Waiting for booth network... (${attempt}/10)`,
                          downloadProgress: 97 + attempt * 0.3,
                        });
                      }

                      if (!canReachLaptop) {
                        console.error('[SessionOrchestrator] ❌ Could not reach laptop after switching WiFi');
                        this.updateState({
                          ...this.sessionState,
                          downloadStatus: 'Download complete (laptop not reachable)',
                          downloadProgress: 100,
                        });
                        return; // Skip laptop processing
                      }

                      this.updateState({
                        ...this.sessionState,
                        downloadStatus: 'Download complete!',
                        downloadProgress: 100,
                      });

                      // Step 6: Start laptop processing workflow
                      if (this.currentConfig) {
                        await this.processVideoOnLaptop(downloadedPath, this.currentConfig);
                      }

                    } else {
                      console.error('[SessionOrchestrator] ❌ Failed to switch back to booth WiFi');
                      this.updateState({
                        ...this.sessionState,
                        downloadStatus: 'Download complete (WiFi switch failed)',
                        downloadProgress: 100,
                      });
                    }
                  } catch (switchBackError) {
                    console.error('[SessionOrchestrator] ❌ Switch back error:', switchBackError);
                  }

                } else {
                  console.error('[SessionOrchestrator] ❌ No video found on GoPro');
                  this.updateState({
                    ...this.sessionState,
                    downloadStatus: 'No video found on GoPro',
                    downloadProgress: 0,
                  });
                }
              } catch (downloadError) {
                console.error('[SessionOrchestrator] ❌ Download failed:', downloadError);
                this.updateState({
                  ...this.sessionState,
                  downloadStatus: 'Download failed',
                  downloadProgress: 0,
                });
              }

            } else {
              console.error('[SessionOrchestrator] ❌ GoPro WiFi connected but API not reachable');
              this.updateState({
                ...this.sessionState,
                downloadStatus: 'GoPro API not reachable',
                downloadProgress: 0,
              });
            }
          } catch (testError) {
            console.error('[SessionOrchestrator] ❌ GoPro connection test error:', testError);
          }
        } else {
          console.error('[SessionOrchestrator] ❌ Failed to switch to GoPro WiFi');
          this.updateState({
            ...this.sessionState,
            downloadStatus: 'WiFi switch failed',
            downloadProgress: 0,
          });
        }
      } catch (wifiWorkflowError) {
        console.error('[SessionOrchestrator] ❌ WiFi workflow failed (non-fatal):', wifiWorkflowError);
        this.updateState({
          ...this.sessionState,
          downloadStatus: 'WiFi workflow failed',
          downloadProgress: 0,
        });
        // This is non-fatal - session completed, just WiFi switching failed
      }

      // Update state to idle (UI will show download button)
      // Clear stored config
      this.currentConfig = null;
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

    // Clear stored config and update state to error
    this.currentConfig = null;
    this.updateState({
      status: 'error',
      error: error.message || 'Unknown error occurred',
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process video on laptop server
   * Uploads raw video, polls for completion, downloads processed video
   */
  private async processVideoOnLaptop(
    videoPath: string,
    config: SessionConfig,
  ): Promise<void> {
    console.log('[SessionOrchestrator] Starting laptop processing workflow');

    try {
      // Check if laptop server is available (with retries for network stability)
      this.updateState({
        ...this.sessionState,
        status: 'uploading_to_laptop',
        downloadStatus: 'Checking laptop server...',
        laptopProgress: 0,
      });

      // Retry health check up to 3 times with delays
      let healthCheckSuccess = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`[SessionOrchestrator] Health check attempt ${attempt}/3...`);
          const health = await laptopTransferService.checkHealth();
          console.log('[SessionOrchestrator] ✅ Laptop server is online:', health);
          healthCheckSuccess = true;
          break;
        } catch (healthError) {
          console.warn(`[SessionOrchestrator] Health check attempt ${attempt} failed:`, healthError);
          if (attempt < 3) {
            this.updateState({
              ...this.sessionState,
              downloadStatus: `Retrying server connection (${attempt}/3)...`,
            });
            await this.delay(2000); // Wait 2 seconds before retry
          }
        }
      }

      if (!healthCheckSuccess) {
        console.error('[SessionOrchestrator] ❌ Laptop server not reachable after 3 attempts');
        this.updateState({
          ...this.sessionState,
          status: 'ready_for_delivery',
          downloadStatus: 'Laptop server not available - manual editing required',
        });
        return;
      }

      // Step 1: Upload video to laptop
      this.updateState({
        ...this.sessionState,
        status: 'uploading_to_laptop',
        downloadStatus: 'Uploading video to laptop...',
        laptopProgress: 0,
      });

      const jobId = await laptopTransferService.uploadVideo(
        videoPath,
        config.eventName || 'Event',
        config.customerName || 'Customer',
        config.customerPhone || '',
        'party', // Default template - can be made configurable later
        (progress) => {
          this.updateState({
            ...this.sessionState,
            downloadStatus: `Uploading to laptop... ${progress}%`,
            laptopProgress: progress,
          });
        },
      );

      console.log('[SessionOrchestrator] ✅ Video uploaded, jobId:', jobId);

      // Step 2: Poll for processing completion
      this.updateState({
        ...this.sessionState,
        status: 'processing_on_laptop',
        downloadStatus: 'Processing video on laptop...',
        laptopJobId: jobId,
        laptopProgress: 0,
      });

      await laptopTransferService.pollUntilComplete(
        jobId,
        (status) => {
          this.updateState({
            ...this.sessionState,
            downloadStatus: `Processing on laptop... ${status.progress}%`,
            laptopProgress: status.progress,
          });
        },
        3000, // Poll every 3 seconds
        600000, // 10 minute timeout
      );

      console.log('[SessionOrchestrator] ✅ Processing complete');

      // Step 3: Download processed video
      this.updateState({
        ...this.sessionState,
        status: 'downloading_from_laptop',
        downloadStatus: 'Downloading processed video...',
        laptopProgress: 0,
      });

      const processedVideoPath = await laptopTransferService.downloadProcessedVideo(
        jobId,
        (progress) => {
          this.updateState({
            ...this.sessionState,
            downloadStatus: `Downloading from laptop... ${progress}%`,
            laptopProgress: progress,
          });
        },
      );

      console.log('[SessionOrchestrator] ✅ Processed video downloaded:', processedVideoPath);

      // Step 4: Ready for delivery
      this.updateState({
        ...this.sessionState,
        status: 'ready_for_delivery',
        downloadStatus: 'Video ready for delivery!',
        laptopProgress: 100,
        processedVideoPath,
      });

    } catch (error) {
      console.error('[SessionOrchestrator] ❌ Laptop processing failed:', error);
      this.updateState({
        ...this.sessionState,
        status: 'error',
        error: `Laptop processing failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
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

    // Clear stored config
    this.currentConfig = null;
    this.updateState({
      status: 'idle',
      startTime: null,
      elapsedTime: 0,
      error: null,
    });
  }
}

export default new SessionOrchestrator();
