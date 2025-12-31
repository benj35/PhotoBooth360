import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { IGoProService, GoProStatus, VideoMode, VideoResolution } from '@types/index';
import { encode as base64Encode, decode as base64Decode } from 'base-64';

// GoPro BLE UUIDs (from OpenGoPro documentation)
const GOPRO_SERVICE_UUID = '0000fea6-0000-1000-8000-00805f9b34fb';
const GOPRO_COMMAND_UUID = 'b5f90072-aa8d-11e3-9046-0002a5d5c51b';
const GOPRO_COMMAND_RESPONSE_UUID = 'b5f90073-aa8d-11e3-9046-0002a5d5c51b';
const GOPRO_SETTINGS_UUID = 'b5f90074-aa8d-11e3-9046-0002a5d5c51b';
const GOPRO_SETTINGS_RESPONSE_UUID = 'b5f90075-aa8d-11e3-9046-0002a5d5c51b';
const GOPRO_STATUS_UUID = 'b5f90076-aa8d-11e3-9046-0002a5d5c51b';

// GoPro Commands (OpenGoPro BLE API)
const COMMANDS = {
  SET_SHUTTER_ON: new Uint8Array([0x03, 0x01, 0x01, 0x01]),
  SET_SHUTTER_OFF: new Uint8Array([0x03, 0x01, 0x01, 0x00]),
  GET_STATUS: new Uint8Array([0x01, 0x13]),

  // WiFi AP Control Commands (multiple methods for compatibility)
  // Method 1: Setting-based AP control (0x11 = AP Control setting)
  ENABLE_WIFI: new Uint8Array([0x03, 0x11, 0x01, 0x01]),
  DISABLE_WIFI: new Uint8Array([0x03, 0x11, 0x01, 0x00]),

  // Method 2: OpenGoPro WiFi AP Enable command (Command ID 0x17 = AP Control)
  // Command structure: [length, command_id, param_length, param_value]
  // Mode: 0=disable, 1=enable, 2=bounce (disable then enable)
  WIFI_AP_ON: new Uint8Array([0x03, 0x17, 0x01, 0x01]),    // Enable AP
  WIFI_AP_OFF: new Uint8Array([0x03, 0x17, 0x01, 0x00]),   // Disable AP
  WIFI_AP_BOUNCE: new Uint8Array([0x03, 0x17, 0x01, 0x02]), // Bounce (restart) AP

  // Method 3: Keep Alive / Wake command to ensure camera is responsive
  KEEP_ALIVE: new Uint8Array([0x03, 0x5B, 0x01, 0x42]),

  // Set Turbo Transfer - sometimes needed to activate WiFi properly
  TURBO_ON: new Uint8Array([0x03, 0xD6, 0x01, 0x01]),
  TURBO_OFF: new Uint8Array([0x03, 0xD6, 0x01, 0x00]),

  // Query WiFi AP SSID - Status ID 0x72 (114)
  GET_AP_SSID: new Uint8Array([0x01, 0x72]),
  // Query WiFi AP Password - Status ID 0x73 (115)
  GET_AP_PASSWORD: new Uint8Array([0x01, 0x73]),
  // Query WiFi AP State (on/off) - Status ID 0x45 (69)
  GET_AP_STATE: new Uint8Array([0x01, 0x45]),
};

// Query Response UUID for receiving query responses
const GOPRO_QUERY_UUID = 'b5f90076-aa8d-11e3-9046-0002a5d5c51b';
const GOPRO_QUERY_RESPONSE_UUID = 'b5f90077-aa8d-11e3-9046-0002a5d5c51b';

export interface WiFiAPInfo {
  ssid: string;
  password: string;
  enabled: boolean;
}

export class GoProService implements IGoProService {
  private bleManager: BleManager | null = null;
  private device: Device | null = null;
  private commandChar: Characteristic | null = null;
  private commandResponseChar: Characteristic | null = null;
  private queryChar: Characteristic | null = null;
  private queryResponseChar: Characteristic | null = null;
  private statusChar: Characteristic | null = null;
  private isConnected = false;

  // Response handler for command responses
  private pendingCommandResponse: ((data: Uint8Array) => void) | null = null;

  constructor() {
    // Initialize BLE manager lazily to avoid startup crashes
    console.log('[GoPro] GoProService initialized');
  }

  /**
   * Handle incoming command response notifications
   */
  private handleCommandResponse(value: string): void {
    try {
      const decoded = base64Decode(value);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }

      // If there's a pending response handler, call it
      if (this.pendingCommandResponse) {
        this.pendingCommandResponse(bytes);
        this.pendingCommandResponse = null;
      }
    } catch (e) {
      console.log('[GoPro] Error decoding command response:', e);
    }
  }

  private ensureBleManager(): BleManager {
    if (!this.bleManager) {
      console.log('[GoPro] Creating BleManager instance');
      this.bleManager = new BleManager();
    }
    return this.bleManager;
  }

  async connect(): Promise<void> {
    console.log('[GoPro] Starting connection...');

    try {
      const manager = this.ensureBleManager();

      // Request Bluetooth permissions
      console.log('[GoPro] Checking Bluetooth state...');
      const state = await manager.state();
      console.log('[GoPro] Bluetooth state:', state);

      if (state !== 'PoweredOn') {
        throw new Error(`Bluetooth is not powered on. Current state: ${state}`);
      }
    } catch (error) {
      console.error('[GoPro] Error initializing BLE:', error);
      throw error;
    }

    // Scan for GoPro devices
    return new Promise((resolve, reject) => {
      const manager = this.ensureBleManager();

      console.log('[GoPro] Starting BLE scan for GoPro devices...');
      let devicesFound = 0;

      const timeout = setTimeout(() => {
        console.log(`[GoPro] Scan timeout - found ${devicesFound} BLE devices total, but no GoPro`);
        manager.stopDeviceScan();
        reject(new Error('GoPro device not found within timeout'));
      }, 30000);

      manager.startDeviceScan(null, null, async (error, device) => {
        if (error) {
          console.error('[GoPro] BLE scan error:', error);
          clearTimeout(timeout);
          manager.stopDeviceScan();
          reject(error);
          return;
        }

        if (device) {
          devicesFound++;
          // Log all devices for debugging
          console.log(`[GoPro] Found BLE device #${devicesFound}: "${device.name || 'UNNAMED'}" (${device.id})`);
        }

        // Look for GoPro device (name starts with "GoPro")
        if (device && device.name && device.name.startsWith('GoPro')) {
          console.log('[GoPro] ✅ MATCHED GoPro device:', device.name);
          manager.stopDeviceScan();
          clearTimeout(timeout);

          try {
            // Connect to device
            this.device = await device.connect();
            console.log('[GoPro] Connected to device');

            // Discover services and characteristics
            await this.device.discoverAllServicesAndCharacteristics();
            console.log('[GoPro] Services discovered');

            // Get characteristics
            const services = await this.device.services();
            const goProService = services.find(s => s.uuid.toLowerCase() === GOPRO_SERVICE_UUID);

            if (!goProService) {
              throw new Error('GoPro service not found');
            }

            const characteristics = await goProService.characteristics();
            this.commandChar = characteristics.find(c => c.uuid.toLowerCase() === GOPRO_COMMAND_UUID) || null;
            this.commandResponseChar = characteristics.find(c => c.uuid.toLowerCase() === GOPRO_COMMAND_RESPONSE_UUID) || null;
            this.queryChar = characteristics.find(c => c.uuid.toLowerCase() === GOPRO_QUERY_UUID) || null;
            this.queryResponseChar = characteristics.find(c => c.uuid.toLowerCase() === GOPRO_QUERY_RESPONSE_UUID) || null;
            this.statusChar = characteristics.find(c => c.uuid.toLowerCase() === GOPRO_STATUS_UUID) || null;

            console.log('[GoPro] Characteristics found:');
            console.log('[GoPro]   - Command:', !!this.commandChar);
            console.log('[GoPro]   - Command Response:', !!this.commandResponseChar);
            console.log('[GoPro]   - Query:', !!this.queryChar);
            console.log('[GoPro]   - Query Response:', !!this.queryResponseChar);

            if (!this.commandChar) {
              throw new Error('Command characteristic not found');
            }

            // IMPORTANT: Enable notifications on response characteristics
            // Per OpenGoPro docs: "The GoPro device does not support caching subscriptions
            // so characteristics must be re-subscribed upon each connection"
            console.log('[GoPro] Enabling notifications on response characteristics...');

            if (this.commandResponseChar) {
              try {
                // Start monitoring - this enables notifications
                this.commandResponseChar.monitor((error, char) => {
                  if (error) {
                    // Only log if it's not a disconnection
                    if (!error.message?.includes('disconnected')) {
                      console.log('[GoPro] Command Response notification error:', error.message);
                    }
                    return;
                  }
                  // Handle the response via our handler
                  if (char?.value) {
                    this.handleCommandResponse(char.value);
                  }
                });
                console.log('[GoPro]   ✅ Command Response notifications enabled');
              } catch (e: any) {
                console.log('[GoPro]   ⚠️ Failed to enable Command Response notifications:', e.message);
              }
            }

            if (this.queryResponseChar) {
              try {
                this.queryResponseChar.monitor((error, _char) => {
                  if (error && !error.message?.includes('disconnected')) {
                    console.log('[GoPro] Query Response notification error:', error.message);
                  }
                });
                console.log('[GoPro]   ✅ Query Response notifications enabled');
              } catch (e: any) {
                console.log('[GoPro]   ⚠️ Failed to enable Query Response notifications:', e.message);
              }
            }

            // Wait a moment for the camera to be ready
            console.log('[GoPro] Waiting for camera to be ready...');
            await new Promise<void>(res => setTimeout(res, 1000));

            this.isConnected = true;
            console.log('[GoPro] ✅ Connection complete - notifications enabled');
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      await this.device.cancelConnection();
      this.device = null;
      this.commandChar = null;
      this.statusChar = null;
      this.isConnected = false;
      console.log('[GoPro] Disconnected');
    }
  }

  async startRecording(): Promise<void> {
    if (!this.isConnected || !this.commandChar) {
      throw new Error('GoPro is not connected');
    }

    console.log('[GoPro] Starting recording...');

    try {
      const command = this.uint8ArrayToBase64(COMMANDS.SET_SHUTTER_ON);
      await this.commandChar.writeWithResponse(command);
      console.log('[GoPro] ✅ Recording started');
    } catch (error) {
      console.error('[GoPro] Error starting recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isConnected || !this.commandChar) {
      throw new Error('GoPro is not connected');
    }

    console.log('[GoPro] Stopping recording...');

    try {
      const command = this.uint8ArrayToBase64(COMMANDS.SET_SHUTTER_OFF);
      await this.commandChar.writeWithResponse(command);
      console.log('[GoPro] ✅ Recording stopped');
    } catch (error) {
      console.error('[GoPro] Error stopping recording:', error);
      throw error;
    }
  }

  async getStatus(): Promise<GoProStatus> {
    if (!this.isConnected || !this.commandChar) {
      throw new Error('GoPro is not connected');
    }

    console.log('[GoPro] Getting status...');

    // TODO: Implement actual GoPro status query protocol
    // For now, return mock data to avoid crash
    // The actual implementation requires reading from status characteristic
    // and parsing the binary response according to OpenGoPro spec

    // TEMPORARY: Skip actual BLE communication for now
    // const command = Buffer.from(COMMANDS.GET_STATUS).toString('base64');
    // await this.commandChar.writeWithResponse(command);

    // Return mock status
    return {
      battery: 85,
      recording: false,
      encoding: false,
      sdCardSpace: 32000,
      videoMode: 'standard',
      resolution: '4k',
    };
  }

  async setVideoMode(mode: VideoMode): Promise<void> {
    if (!this.isConnected || !this.commandChar) {
      throw new Error('GoPro is not connected');
    }

    console.log('[GoPro] Setting video mode:', mode);
    // Implementation would send appropriate BLE command
    // For now, just log
  }

  async setResolution(resolution: VideoResolution): Promise<void> {
    if (!this.isConnected || !this.commandChar) {
      throw new Error('GoPro is not connected');
    }

    console.log('[GoPro] Setting resolution:', resolution);
    // Implementation would send appropriate BLE command
    // For now, just log
  }

  /**
   * Send a BLE command and wait for response notification
   * Returns the response bytes or null if timeout
   */
  private async sendCommandWithResponse(
    command: Uint8Array,
    description: string,
    timeoutMs: number = 3000
  ): Promise<Uint8Array | null> {
    if (!this.commandChar) {
      console.log(`[GoPro] ${description}: Missing command characteristic`);
      return null;
    }

    return new Promise(async (resolve) => {
      const timeout = setTimeout(() => {
        console.log(`[GoPro] ${description}: Timeout waiting for response`);
        this.pendingCommandResponse = null;
        resolve(null);
      }, timeoutMs);

      try {
        // Set up response handler BEFORE sending command
        this.pendingCommandResponse = (bytes: Uint8Array) => {
          clearTimeout(timeout);

          console.log(`[GoPro] ${description}: Response: [${Array.from(bytes).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);

          // Check if response indicates success
          // Response format: [length, command_id, status]
          // Status 0x00 = success, 0x01 = error, 0x02 = invalid param
          if (bytes.length >= 3) {
            const status = bytes[2];
            if (status === 0x00) {
              console.log(`[GoPro] ${description}: ✅ SUCCESS`);
            } else {
              console.log(`[GoPro] ${description}: ⚠️ Status: ${status} (0=ok, 1=err, 2=invalid)`);
            }
          }

          resolve(bytes);
        };

        // Send the command
        const commandBase64 = this.uint8ArrayToBase64(command);
        console.log(`[GoPro] ${description}: Sending [${Array.from(command).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
        await this.commandChar!.writeWithResponse(commandBase64);
        console.log(`[GoPro] ${description}: Command sent, waiting for response...`);

      } catch (sendError: any) {
        clearTimeout(timeout);
        this.pendingCommandResponse = null;
        console.log(`[GoPro] ${description}: Send error:`, sendError.message);
        resolve(null);
      }
    });
  }

  /**
   * Enable GoPro WiFi Access Point via BLE
   * This makes the GoPro WiFi network (HERO13 Black) visible for connection
   *
   * Tries multiple command methods for compatibility with Hero 13
   */
  async enableWiFi(): Promise<void> {
    console.log('[GoPro] enableWiFi() called');
    console.log('[GoPro] isConnected:', this.isConnected);
    console.log('[GoPro] commandChar exists:', !!this.commandChar);
    console.log('[GoPro] commandResponseChar exists:', !!this.commandResponseChar);

    if (!this.isConnected || !this.commandChar) {
      const error = new Error('GoPro is not connected via BLE');
      console.error('[GoPro] Cannot enable WiFi:', error.message);
      throw error;
    }

    console.log('[GoPro] ========================================');
    console.log('[GoPro] Enabling WiFi Access Point via BLE');
    console.log('[GoPro] ========================================');

    try {
      // Step 1: Send Keep Alive to wake up camera
      console.log('[GoPro] Step 1/4: Sending Keep Alive...');
      await this.sendCommandWithResponse(COMMANDS.KEEP_ALIVE, 'Keep Alive', 2000);
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      // Step 2: Try BOUNCE command first (most reliable - disables then enables)
      console.log('[GoPro] Step 2/4: Sending WIFI_AP_BOUNCE (mode=2)...');
      const bounceResult = await this.sendCommandWithResponse(COMMANDS.WIFI_AP_BOUNCE, 'AP Bounce', 3000);
      await new Promise<void>((resolve) => setTimeout(resolve, 500));

      // Step 3: If bounce failed, try direct enable
      if (!bounceResult) {
        console.log('[GoPro] Step 3/4: Bounce failed, trying direct WIFI_AP_ON (mode=1)...');
        await this.sendCommandWithResponse(COMMANDS.WIFI_AP_ON, 'AP Enable', 3000);
        await new Promise<void>((resolve) => setTimeout(resolve, 500));
      } else {
        console.log('[GoPro] Step 3/4: Skipped (bounce succeeded)');
      }

      // Step 4: Enable Turbo Transfer (may help activate WiFi)
      console.log('[GoPro] Step 4/4: Sending Turbo Transfer ON...');
      await this.sendCommandWithResponse(COMMANDS.TURBO_ON, 'Turbo Transfer', 2000);

      console.log('[GoPro] ========================================');
      console.log('[GoPro] ✅ All WiFi enable commands sent');
      console.log('[GoPro] WiFi network should appear: HERO13 Black');
      console.log('[GoPro] ========================================');

      // Wait for WiFi hardware to fully activate
      console.log('[GoPro] Waiting 4 seconds for WiFi to activate...');
      await new Promise<void>((resolve) => setTimeout(resolve, 4000));

      console.log('[GoPro] WiFi should now be ready for connection');
    } catch (error) {
      console.error('[GoPro] ❌ Failed to enable WiFi via BLE:', error);
      throw error;
    }
  }

  /**
   * Query WiFi AP credentials from GoPro via BLE
   * This gets the actual SSID and password the camera is using
   *
   * NOTE: This is experimental - if it fails, we fall back to pre-configured credentials
   */
  async getWiFiAPInfo(): Promise<WiFiAPInfo> {
    console.log('[GoPro] getWiFiAPInfo() called');
    console.log('[GoPro] isConnected:', this.isConnected);
    console.log('[GoPro] queryChar exists:', !!this.queryChar);
    console.log('[GoPro] queryResponseChar exists:', !!this.queryResponseChar);

    // If query characteristics aren't available, return empty info
    // This is not a fatal error - we can fall back to pre-configured credentials
    if (!this.isConnected) {
      console.log('[GoPro] Not connected, returning empty WiFi info');
      return { ssid: '', password: '', enabled: false };
    }

    if (!this.queryChar || !this.queryResponseChar) {
      console.log('[GoPro] Query characteristics not available, returning empty WiFi info');
      console.log('[GoPro] This is normal - will use pre-configured credentials instead');
      return { ssid: '', password: '', enabled: false };
    }

    console.log('[GoPro] Querying WiFi AP credentials via BLE...');

    try {
      let ssid = '';
      let password = '';
      let enabled = false;

      // Helper to send query and wait for response
      const sendQuery = async (command: Uint8Array, description: string): Promise<string> => {
        return new Promise(async (resolve, reject) => {
          const timeout = setTimeout(() => {
            console.log(`[GoPro] ${description} query timed out`);
            resolve(''); // Resolve with empty string instead of rejecting
          }, 3000);

          try {
            // Set up response listener
            const subscription = this.queryResponseChar!.monitor((error, characteristic) => {
              if (error) {
                clearTimeout(timeout);
                subscription.remove();
                console.error(`[GoPro] ${description} monitor error:`, error);
                resolve(''); // Resolve with empty string instead of rejecting
                return;
              }

              if (characteristic?.value) {
                clearTimeout(timeout);
                subscription.remove();

                try {
                  // Decode base64 response
                  const decoded = base64Decode(characteristic.value);
                  console.log(`[GoPro] ${description} response received, length:`, decoded.length);

                  // Parse response - format is: [length, status_id, data_length, ...data]
                  // Skip first 3 bytes (header) and extract string data
                  const dataBytes = decoded.slice(3);
                  resolve(dataBytes);
                } catch (decodeError) {
                  console.error(`[GoPro] ${description} decode error:`, decodeError);
                  resolve('');
                }
              }
            });

            // Send query command
            const commandBase64 = this.uint8ArrayToBase64(command);
            await this.queryChar!.writeWithResponse(commandBase64);
            console.log(`[GoPro] ${description} query sent`);
          } catch (sendError) {
            clearTimeout(timeout);
            console.error(`[GoPro] ${description} send error:`, sendError);
            resolve(''); // Resolve with empty string instead of rejecting
          }
        });
      };

      // Query SSID
      console.log('[GoPro] Querying AP SSID...');
      ssid = await sendQuery(COMMANDS.GET_AP_SSID, 'SSID');
      if (ssid) {
        console.log('[GoPro] AP SSID:', ssid);
      }

      // Query Password
      console.log('[GoPro] Querying AP Password...');
      password = await sendQuery(COMMANDS.GET_AP_PASSWORD, 'Password');
      if (password) {
        console.log('[GoPro] AP Password:', password);
      }

      // Query AP State
      console.log('[GoPro] Querying AP State...');
      const stateStr = await sendQuery(COMMANDS.GET_AP_STATE, 'AP State');
      if (stateStr && stateStr.length > 0) {
        enabled = stateStr.charCodeAt(0) === 1;
        console.log('[GoPro] AP Enabled:', enabled);
      }

      const info: WiFiAPInfo = { ssid, password, enabled };
      console.log('[GoPro] WiFi AP Info:', info);

      return info;
    } catch (error) {
      console.error('[GoPro] Failed to query WiFi AP info:', error);
      // Return empty info instead of throwing - this is not a fatal error
      return { ssid: '', password: '', enabled: false };
    }
  }

  /**
   * Disable GoPro WiFi Access Point via BLE
   * Use this after video download is complete to save battery
   */
  async disableWiFi(): Promise<void> {
    if (!this.isConnected || !this.commandChar) {
      throw new Error('GoPro is not connected');
    }

    console.log('[GoPro] Disabling WiFi Access Point via BLE...');

    try {
      // Send BLE command to disable WiFi AP
      const command = this.uint8ArrayToBase64(COMMANDS.DISABLE_WIFI);
      await this.commandChar.writeWithResponse(command);

      console.log('[GoPro] ✅ WiFi disable command sent');
    } catch (error) {
      console.error('[GoPro] Failed to disable WiFi:', error);
      throw error;
    }
  }

  /**
   * Convert Uint8Array to base64 string (for BLE commands)
   */
  private uint8ArrayToBase64(uint8Array: Uint8Array): string {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return base64Encode(binary);
  }

  // Utility method to check connection
  isDeviceConnected(): boolean {
    return this.isConnected;
  }
}

export default new GoProService();
