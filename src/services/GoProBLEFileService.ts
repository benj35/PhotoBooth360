import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import RNFS from 'react-native-fs';
import { decode as base64Decode } from 'base-64';

/**
 * GoPro BLE File Transfer Service
 *
 * Uses OpenGoPro BLE protocol to download files directly over Bluetooth
 * Note: This is slower than WiFi (typically 100KB/s vs 5MB/s) but doesn't require WiFi switching
 */

// GoPro BLE Service UUIDs
const GOPRO_SERVICE_UUID = '0000fea6-0000-1000-8000-00805f9b34fb';

// Command/Query UUIDs
const GOPRO_COMMAND_UUID = 'b5f90072-aa8d-11e3-9046-0002a5d5c51b';
const GOPRO_COMMAND_RESPONSE_UUID = 'b5f90073-aa8d-11e3-9046-0002a5d5c51b';
const GOPRO_QUERY_UUID = 'b5f90076-aa8d-11e3-9046-0002a5d5c51b';
const GOPRO_QUERY_RESPONSE_UUID = 'b5f90077-aa8d-11e3-9046-0002a5d5c51b';

// Commands
const COMMANDS = {
  // Get media list - Command ID 0x3E
  GET_MEDIA_LIST: new Uint8Array([0x01, 0x3E]),

  // Download file - This is complex and requires multiple steps
  // We'll need to use the query characteristic for file operations
};

export interface MediaFile {
  filename: string;
  size: number;
  created: string;
  modified: string;
}

export class GoProBLEFileService {
  private bleManager: BleManager | null = null;
  private device: Device | null = null;
  private commandChar: Characteristic | null = null;
  private commandResponseChar: Characteristic | null = null;
  private queryChar: Characteristic | null = null;
  private queryResponseChar: Characteristic | null = null;
  private isConnected = false;

  constructor() {
    console.log('[GoProBLEFile] Service initialized');
  }

  /**
   * Initialize with existing BLE manager and device from GoProService
   */
  async initialize(bleManager: BleManager, device: Device): Promise<void> {
    console.log('[GoProBLEFile] Initializing with existing BLE connection');

    this.bleManager = bleManager;
    this.device = device;

    try {
      // Get service
      const services = await device.services();
      const goProService = services.find(s => s.uuid.toLowerCase() === GOPRO_SERVICE_UUID);

      if (!goProService) {
        throw new Error('GoPro service not found');
      }

      // Get characteristics
      const characteristics = await goProService.characteristics();
      this.commandChar = characteristics.find(c => c.uuid.toLowerCase() === GOPRO_COMMAND_UUID) || null;
      this.commandResponseChar = characteristics.find(c => c.uuid.toLowerCase() === GOPRO_COMMAND_RESPONSE_UUID) || null;
      this.queryChar = characteristics.find(c => c.uuid.toLowerCase() === GOPRO_QUERY_UUID) || null;
      this.queryResponseChar = characteristics.find(c => c.uuid.toLowerCase() === GOPRO_QUERY_RESPONSE_UUID) || null;

      if (!this.commandChar || !this.commandResponseChar) {
        throw new Error('Required BLE characteristics not found');
      }

      this.isConnected = true;
      console.log('[GoProBLEFile] ✅ Initialized successfully');
    } catch (error) {
      console.error('[GoProBLEFile] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Get list of media files from GoPro
   */
  async getMediaList(): Promise<MediaFile[]> {
    if (!this.isConnected || !this.commandChar || !this.commandResponseChar) {
      throw new Error('GoPro BLE not initialized');
    }

    console.log('[GoProBLEFile] Getting media list...');

    try {
      // Subscribe to response characteristic
      const responsePromise = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Media list request timeout'));
        }, 10000);

        this.commandResponseChar?.monitor((error, characteristic) => {
          if (error) {
            clearTimeout(timeout);
            reject(error);
            return;
          }

          if (characteristic?.value) {
            clearTimeout(timeout);
            resolve(characteristic.value);
          }
        });
      });

      // Send GET_MEDIA_LIST command
      const command = this.uint8ArrayToBase64(COMMANDS.GET_MEDIA_LIST);
      await this.commandChar.writeWithResponse(command);

      // Wait for response
      const response = await responsePromise;

      // Parse response (this is simplified - actual response is complex JSON)
      console.log('[GoProBLEFile] Media list response received');

      // TODO: Parse actual media list response
      // For now, return mock data
      return [
        {
          filename: 'GOPR0001.MP4',
          size: 104857600, // 100MB
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
      ];
    } catch (error) {
      console.error('[GoProBLEFile] Failed to get media list:', error);
      throw error;
    }
  }

  /**
   * Download a file from GoPro via BLE
   *
   * WARNING: This will be SLOW (100KB/s typical)
   * A 100MB file will take ~16 minutes to download
   */
  async downloadFile(
    filename: string,
    onProgress?: (bytesDownloaded: number, totalBytes: number) => void
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error('GoPro BLE not initialized');
    }

    console.log('[GoProBLEFile] Starting BLE file download:', filename);
    console.log('[GoProBLEFile] ⚠️ WARNING: BLE transfers are SLOW (~100KB/s)');

    try {
      // Step 1: Get file info (size, etc.)
      console.log('[GoProBLEFile] Step 1: Getting file info...');
      const fileInfo = await this.getFileInfo(filename);
      console.log('[GoProBLEFile] File size:', fileInfo.size, 'bytes');
      console.log('[GoProBLEFile] Estimated download time:', Math.ceil(fileInfo.size / 102400), 'minutes');

      // Step 2: Open file for reading
      console.log('[GoProBLEFile] Step 2: Opening file for reading...');
      await this.openFile(filename);

      // Step 3: Read file in chunks
      console.log('[GoProBLEFile] Step 3: Reading file chunks...');
      const chunks: Buffer[] = [];
      let bytesDownloaded = 0;
      const chunkSize = 512; // BLE MTU is typically 512 bytes

      while (bytesDownloaded < fileInfo.size) {
        const chunk = await this.readFileChunk(chunkSize);
        chunks.push(chunk);
        bytesDownloaded += chunk.length;

        if (onProgress) {
          onProgress(bytesDownloaded, fileInfo.size);
        }

        // Log progress every 1MB
        if (bytesDownloaded % 1048576 === 0) {
          const progress = ((bytesDownloaded / fileInfo.size) * 100).toFixed(1);
          console.log(`[GoProBLEFile] Progress: ${progress}% (${bytesDownloaded}/${fileInfo.size} bytes)`);
        }
      }

      // Step 4: Close file
      console.log('[GoProBLEFile] Step 4: Closing file...');
      await this.closeFile();

      // Step 5: Save to device
      console.log('[GoProBLEFile] Step 5: Saving to device...');
      const filePath = await this.saveFile(filename, Buffer.concat(chunks));

      console.log('[GoProBLEFile] ✅ Download complete:', filePath);
      return filePath;
    } catch (error) {
      console.error('[GoProBLEFile] Download failed:', error);
      throw error;
    }
  }

  /**
   * Get file information (size, etc.)
   */
  private async getFileInfo(filename: string): Promise<{ size: number }> {
    // TODO: Implement actual BLE file info query
    // For now, return mock data
    console.log('[GoProBLEFile] Getting file info for:', filename);

    // Mock: assume 100MB video file
    return {
      size: 104857600, // 100MB
    };
  }

  /**
   * Open file for reading via BLE
   */
  private async openFile(filename: string): Promise<void> {
    if (!this.queryChar) {
      throw new Error('Query characteristic not available');
    }

    console.log('[GoProBLEFile] Opening file:', filename);

    // TODO: Send actual open file command
    // This is a complex multi-byte command that includes:
    // - Command ID
    // - File path length
    // - File path string

    // For now, just log
    console.log('[GoProBLEFile] File opened (mock)');
  }

  /**
   * Read a chunk of file data
   */
  private async readFileChunk(size: number): Promise<Buffer> {
    if (!this.queryChar || !this.queryResponseChar) {
      throw new Error('Query characteristics not available');
    }

    // TODO: Send read chunk command and receive data
    // This requires:
    // 1. Sending read command with offset and size
    // 2. Monitoring response characteristic for data chunks
    // 3. Assembling chunks into complete data

    // For now, return mock data
    return Buffer.alloc(size);
  }

  /**
   * Close the currently open file
   */
  private async closeFile(): Promise<void> {
    if (!this.queryChar) {
      throw new Error('Query characteristic not available');
    }

    console.log('[GoProBLEFile] Closing file');

    // TODO: Send close file command
    console.log('[GoProBLEFile] File closed (mock)');
  }

  /**
   * Save file to device storage
   */
  private async saveFile(filename: string, data: Buffer): Promise<string> {
    const directory = `${RNFS.DocumentDirectoryPath}/PhotoBooth360/Videos`;

    // Create directory if it doesn't exist
    await RNFS.mkdir(directory);

    const filePath = `${directory}/${filename}`;

    // Write file
    await RNFS.writeFile(filePath, data.toString('base64'), 'base64');

    console.log('[GoProBLEFile] File saved to:', filePath);
    return filePath;
  }

  /**
   * Convert Uint8Array to base64 string
   */
  private uint8ArrayToBase64(uint8Array: Uint8Array): string {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.isConnected = false;
    this.device = null;
    this.commandChar = null;
    this.commandResponseChar = null;
    this.queryChar = null;
    this.queryResponseChar = null;
    console.log('[GoProBLEFile] Cleaned up');
  }
}

export default new GoProBLEFileService();
