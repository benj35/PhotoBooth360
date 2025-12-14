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
   * Format: EventName_CustomerName_Timestamp.mp4
   */
  generateFilename(eventName: string, customerName: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
                     new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].substring(0, 8);

    // Clean names (remove special chars, spaces to underscores)
    const cleanEvent = eventName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanCustomer = customerName.replace(/[^a-zA-Z0-9]/g, '_');

    return `${cleanEvent}_${cleanCustomer}_${timestamp}.mp4`;
  }

  /**
   * Get destination directory for downloads
   */
  getDownloadDirectory(): string {
    // Use app's document directory
    return `${RNFS.DocumentDirectoryPath}/PhotoBooth360/Videos`;
  }

  /**
   * Ensure download directory exists
   */
  async ensureDownloadDirectory(): Promise<void> {
    const dir = this.getDownloadDirectory();
    const exists = await RNFS.exists(dir);

    if (!exists) {
      console.log('[GoProWiFi] Creating download directory:', dir);
      await RNFS.mkdir(dir, { NSURLIsExcludedFromBackupKey: true });
    }
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
