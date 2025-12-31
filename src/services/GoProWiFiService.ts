import axios, { AxiosInstance } from 'axios';
import RNFS from 'react-native-fs';

/**
 * GoPro WiFi Service - Downloads videos from GoPro via WiFi HTTP API
 *
 * GoPro creates a WiFi hotspot that the phone connects to.
 * Videos are downloaded via HTTP REST API.
 *
 * GoPro WiFi API Documentation:
 * - Base URL: http://10.5.5.9:8080 (GoPro's default WiFi IP)
 * - Media List: GET /gp/gpMediaList
 * - Download: GET /videos/DCIM/100GOPRO/GOPR0001.MP4
 */
export class GoProWiFiService {
  private client: AxiosInstance;
  private baseUrl: string = 'http://10.5.5.9:8080';
  private isConnected: boolean = false;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 second timeout
    });

    console.log('[GoProWiFi] Service initialized');
  }

  /**
   * Test connection to GoPro WiFi
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[GoProWiFi] Testing connection to GoPro WiFi...');
      const response = await this.client.get('/gp/gpControl/status', { timeout: 5000 });
      this.isConnected = response.status === 200;
      console.log('[GoProWiFi] Connection test:', this.isConnected ? 'SUCCESS' : 'FAILED');
      return this.isConnected;
    } catch (error) {
      console.error('[GoProWiFi] Connection test failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get list of media files from GoPro
   */
  async getMediaList(): Promise<any> {
    try {
      console.log('[GoProWiFi] Fetching media list...');
      const response = await this.client.get('/gp/gpMediaList');
      console.log('[GoProWiFi] Media list retrieved');
      return response.data;
    } catch (error) {
      console.error('[GoProWiFi] Failed to get media list:', error);
      throw error;
    }
  }

  /**
   * Download a specific video file from GoPro
   * @param filename - GoPro filename (e.g., "GOPR0001.MP4")
   * @param destinationPath - Local path to save the file
   * @param onProgress - Progress callback (0-100)
   */
  async downloadVideo(
    filename: string,
    destinationPath: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      console.log('[GoProWiFi] Downloading:', filename);
      console.log('[GoProWiFi] Destination:', destinationPath);

      // GoPro file path pattern: /videos/DCIM/100GOPRO/GOPR0001.MP4
      const goProPath = `/videos/DCIM/100GOPRO/${filename}`;
      const downloadUrl = `${this.baseUrl}${goProPath}`;

      // Use RNFS to download with progress tracking
      const downloadResult = await RNFS.downloadFile({
        fromUrl: downloadUrl,
        toFile: destinationPath,
        progress: (res) => {
          const progressPercent = Math.round((res.bytesWritten / res.contentLength) * 100);
          if (onProgress) {
            onProgress(progressPercent);
          }
          console.log(`[GoProWiFi] Download progress: ${progressPercent}%`);
        },
        progressInterval: 500, // Update every 500ms
      }).promise;

      if (downloadResult.statusCode === 200) {
        console.log('[GoProWiFi] ✅ Download complete:', destinationPath);
        return destinationPath;
      } else {
        throw new Error(`Download failed with status: ${downloadResult.statusCode}`);
      }
    } catch (error) {
      console.error('[GoProWiFi] Download error:', error);
      throw error;
    }
  }

  /**
   * Get the latest video file from GoPro
   * Useful for downloading the most recent recording
   */
  async getLatestVideo(): Promise<{ filename: string; size: number } | null> {
    try {
      const mediaList = await this.getMediaList();

      // Parse GoPro media list response
      // Structure: { media: [{ d: "100GOPRO", fs: [{ n: "GOPR0001.MP4", s: "123456" }] }] }
      if (!mediaList?.media || mediaList.media.length === 0) {
        console.log('[GoProWiFi] No media found on GoPro');
        return null;
      }

      // Get the last directory (most recent)
      const lastDir = mediaList.media[mediaList.media.length - 1];

      // Get the last file in that directory
      if (!lastDir.fs || lastDir.fs.length === 0) {
        console.log('[GoProWiFi] No files in latest directory');
        return null;
      }

      const lastFile = lastDir.fs[lastDir.fs.length - 1];

      return {
        filename: lastFile.n,
        size: parseInt(lastFile.s),
      };
    } catch (error) {
      console.error('[GoProWiFi] Failed to get latest video:', error);
      throw error;
    }
  }

  /**
   * Generate filename for downloaded video
   * Format: CustomerName_EventName_Date_PhotoBooth360.mp4
   */
  generateFilename(eventName: string, customerName: string): string {
    // Date format: YYYY-MM-DD
    const date = new Date().toISOString().split('T')[0];

    // Clean names (remove special chars, spaces to underscores)
    const cleanCustomer = customerName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanEvent = eventName.replace(/[^a-zA-Z0-9]/g, '_');

    // Format: CustomerName_EventName_Date_PhotoBooth360.mp4
    return `${cleanCustomer}_${cleanEvent}_${date}_PhotoBooth360.mp4`;
  }

  /**
   * Generate filename for edited video (raw suffix)
   * Format: CustomerName_EventName_Date_PhotoBooth360_RAW.mp4
   */
  generateRawFilename(eventName: string, customerName: string): string {
    const date = new Date().toISOString().split('T')[0];
    const cleanCustomer = customerName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanEvent = eventName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${cleanCustomer}_${cleanEvent}_${date}_PhotoBooth360_RAW.mp4`;
  }

  /**
   * Get destination directory for downloads
   * Uses DCIM folder for visibility in gallery apps and file managers
   */
  getDownloadDirectory(): string {
    // Use external storage DCIM directory (visible in gallery and file managers)
    // This is the standard location for camera photos/videos on Android
    return `${RNFS.ExternalStorageDirectoryPath}/DCIM/PhotoBooth360`;
  }

  /**
   * Ensure download directory exists
   * Creates in DCIM for gallery visibility, falls back to app storage if needed
   */
  async ensureDownloadDirectory(): Promise<void> {
    const dir = this.getDownloadDirectory();
    console.log('[GoProWiFi] Ensuring download directory exists:', dir);

    try {
      const exists = await RNFS.exists(dir);

      if (!exists) {
        console.log('[GoProWiFi] Creating download directory:', dir);
        await RNFS.mkdir(dir, { NSURLIsExcludedFromBackupKey: false });
        console.log('[GoProWiFi] ✅ Download directory created');
      } else {
        console.log('[GoProWiFi] ✅ Download directory already exists');
      }
    } catch (error) {
      console.error('[GoProWiFi] Failed to create DCIM directory, falling back to app storage:', error);
      // Fallback to internal app storage if external fails (permission issues)
      const fallbackDir = `${RNFS.DocumentDirectoryPath}/PhotoBooth360/Videos`;
      const fallbackExists = await RNFS.exists(fallbackDir);
      if (!fallbackExists) {
        await RNFS.mkdir(fallbackDir, { NSURLIsExcludedFromBackupKey: true });
      }
      // Update the getDownloadDirectory to return fallback
      this.useFallbackStorage = true;
      console.log('[GoProWiFi] Using fallback directory:', fallbackDir);
    }
  }

  private useFallbackStorage: boolean = false;

  /**
   * Get the actual download directory (handles fallback)
   */
  getActualDownloadDirectory(): string {
    if (this.useFallbackStorage) {
      return `${RNFS.DocumentDirectoryPath}/PhotoBooth360/Videos`;
    }
    return this.getDownloadDirectory();
  }

  /**
   * Delete a downloaded video file
   */
  async deleteVideo(filePath: string): Promise<void> {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
        console.log('[GoProWiFi] Deleted:', filePath);
      }
    } catch (error) {
      console.error('[GoProWiFi] Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * Get file size in MB
   */
  async getFileSize(filePath: string): Promise<number> {
    try {
      const stat = await RNFS.stat(filePath);
      return Math.round(stat.size / (1024 * 1024)); // Convert to MB
    } catch (error) {
      console.error('[GoProWiFi] Failed to get file size:', error);
      return 0;
    }
  }

  isDeviceConnected(): boolean {
    return this.isConnected;
  }
}

export default new GoProWiFiService();
