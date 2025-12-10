import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { IGoProService, GoProStatus, VideoMode, VideoResolution } from '@types/index';

// GoPro BLE UUIDs (from OpenGoPro documentation)
const GOPRO_SERVICE_UUID = '0000fea6-0000-1000-8000-00805f9b34fb';
const GOPRO_COMMAND_UUID = 'b5f90072-aa8d-11e3-9046-0002a5d5c51b';
const GOPRO_COMMAND_RESPONSE_UUID = 'b5f90073-aa8d-11e3-9046-0002a5d5c51b';
const GOPRO_SETTINGS_UUID = 'b5f90074-aa8d-11e3-9046-0002a5d5c51b';
const GOPRO_SETTINGS_RESPONSE_UUID = 'b5f90075-aa8d-11e3-9046-0002a5d5c51b';
const GOPRO_STATUS_UUID = 'b5f90076-aa8d-11e3-9046-0002a5d5c51b';

// GoPro Commands
const COMMANDS = {
  SET_SHUTTER_ON: new Uint8Array([0x03, 0x01, 0x01, 0x01]),
  SET_SHUTTER_OFF: new Uint8Array([0x03, 0x01, 0x01, 0x00]),
  GET_STATUS: new Uint8Array([0x01, 0x13]),
};

export class GoProService implements IGoProService {
  private bleManager: BleManager | null = null;
  private device: Device | null = null;
  private commandChar: Characteristic | null = null;
  private statusChar: Characteristic | null = null;
  private isConnected = false;

  constructor() {
    // Initialize BLE manager lazily to avoid startup crashes
    console.log('[GoPro] GoProService initialized');
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
            this.statusChar = characteristics.find(c => c.uuid.toLowerCase() === GOPRO_STATUS_UUID) || null;

            if (!this.commandChar) {
              throw new Error('Command characteristic not found');
            }

            // TODO: Subscribe to status updates (disabled for now to prevent crashes)
            // The monitor() callback can cause issues if not properly handled
            // if (this.statusChar) {
            //   await this.statusChar.monitor((error, characteristic) => {
            //     if (error) {
            //       console.error('[GoPro] Status monitor error:', error);
            //       return;
            //     }
            //     console.log('[GoPro] Status update received');
            //   });
            // }

            this.isConnected = true;
            console.log('[GoPro] Connection complete');
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
      const command = Buffer.from(COMMANDS.SET_SHUTTER_ON).toString('base64');
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
      const command = Buffer.from(COMMANDS.SET_SHUTTER_OFF).toString('base64');
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

  // Utility method to check connection
  isDeviceConnected(): boolean {
    return this.isConnected;
  }
}

export default new GoProService();
