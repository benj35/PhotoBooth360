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
  private bleManager: BleManager;
  private device: Device | null = null;
  private commandChar: Characteristic | null = null;
  private statusChar: Characteristic | null = null;
  private isConnected = false;

  constructor() {
    this.bleManager = new BleManager();
  }

  async connect(): Promise<void> {
    console.log('[GoPro] Starting connection...');

    // Request Bluetooth permissions
    const state = await this.bleManager.state();
    if (state !== 'PoweredOn') {
      throw new Error('Bluetooth is not powered on');
    }

    // Scan for GoPro devices
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.bleManager.stopDeviceScan();
        reject(new Error('GoPro device not found within timeout'));
      }, 30000);

      this.bleManager.startDeviceScan(null, null, async (error, device) => {
        if (error) {
          clearTimeout(timeout);
          this.bleManager.stopDeviceScan();
          reject(error);
          return;
        }

        // Look for GoPro device (name starts with "GoPro")
        if (device && device.name && device.name.startsWith('GoPro')) {
          console.log('[GoPro] Found device:', device.name);
          this.bleManager.stopDeviceScan();
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

            // Subscribe to status updates
            if (this.statusChar) {
              await this.statusChar.monitor((error, characteristic) => {
                if (error) {
                  console.error('[GoPro] Status monitor error:', error);
                  return;
                }
                // Handle status updates
                console.log('[GoPro] Status update received');
              });
            }

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
    const command = Buffer.from(COMMANDS.SET_SHUTTER_ON).toString('base64');
    await this.commandChar.writeWithResponse(command);
    console.log('[GoPro] Recording started');
  }

  async stopRecording(): Promise<void> {
    if (!this.isConnected || !this.commandChar) {
      throw new Error('GoPro is not connected');
    }

    console.log('[GoPro] Stopping recording...');
    const command = Buffer.from(COMMANDS.SET_SHUTTER_OFF).toString('base64');
    await this.commandChar.writeWithResponse(command);
    console.log('[GoPro] Recording stopped');
  }

  async getStatus(): Promise<GoProStatus> {
    if (!this.isConnected || !this.commandChar) {
      throw new Error('GoPro is not connected');
    }

    // Request status
    const command = Buffer.from(COMMANDS.GET_STATUS).toString('base64');
    await this.commandChar.writeWithResponse(command);

    // Parse status response (simplified - actual implementation would parse the full response)
    // This is a mock response for now
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
