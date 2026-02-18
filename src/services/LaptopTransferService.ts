/**
 * LaptopTransferService - Handles video upload to laptop processing server
 *
 * Fire-and-forget: uploads video then phone is free for next session.
 * Laptop handles processing independently.
 */

import axios, {AxiosProgressEvent} from 'axios';
import RNFS from 'react-native-fs';
import {
  ILaptopTransferService,
  LaptopUploadResponse,
  LaptopHealthResponse,
} from '../types';

class LaptopTransferService implements ILaptopTransferService {
  private baseUrl: string = 'http://192.168.1.200:3001';
  private isConnected: boolean = false;

  /**
   * Set laptop server URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
    this.isConnected = false;
  }

  /**
   * Get current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Check if laptop server is reachable
   */
  async checkHealth(): Promise<LaptopHealthResponse> {
    try {
      const response = await axios.get<LaptopHealthResponse>(
        `${this.baseUrl}/health`,
        {
          timeout: 5000,
        },
      );

      this.isConnected = response.data.online;
      return response.data;
    } catch (error) {
      this.isConnected = false;
      throw new Error(
        `Cannot reach laptop server at ${this.baseUrl}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Fetch available music tracks from laptop server
   */
  async fetchMusicTracks(): Promise<{filename: string; name: string}[]> {
    try {
      const response = await axios.get<{tracks: {filename: string; name: string}[]}>(
        `${this.baseUrl}/music`,
        {timeout: 5000},
      );
      return response.data.tracks;
    } catch (error) {
      console.error('[LaptopTransfer] Failed to fetch music tracks:', error);
      throw new Error(
        `Failed to fetch music tracks: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Upload video to laptop for processing (fire-and-forget)
   */
  async uploadVideo(
    videoPath: string,
    eventName: string,
    customerName: string,
    customerPhone: string,
    template: string,
    onProgress?: (progress: number) => void,
    musicFile?: string,
  ): Promise<string> {
    try {
      // Verify file exists
      const fileExists = await RNFS.exists(videoPath);
      if (!fileExists) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      // Get file info
      const fileInfo = await RNFS.stat(videoPath);
      console.log(
        `[LaptopTransfer] Uploading ${fileInfo.size} bytes from ${videoPath}`,
      );

      // Create form data
      // IMPORTANT: React Native requires file:// prefix for local paths
      const fileUri = videoPath.startsWith('file://')
        ? videoPath
        : `file://${videoPath}`;
      const fileName = videoPath.split('/').pop() || 'video.mp4';

      console.log(`[LaptopTransfer] File URI: ${fileUri}`);
      console.log(`[LaptopTransfer] File name: ${fileName}`);
      console.log(`[LaptopTransfer] Upload URL: ${this.baseUrl}/upload`);

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: 'video/mp4',
        name: fileName,
      } as any);
      formData.append('eventName', eventName);
      formData.append('customerName', customerName);
      formData.append('customerPhone', customerPhone);
      formData.append('template', template);
      if (musicFile) {
        formData.append('musicFile', musicFile);
      }

      console.log('[LaptopTransfer] Starting upload request...');

      // Upload with progress tracking
      const response = await axios.post<LaptopUploadResponse>(
        `${this.baseUrl}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 600000, // 10 minutes for large files
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
              const percentComplete = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              onProgress?.(percentComplete);
              console.log(`[LaptopTransfer] Upload progress: ${percentComplete}%`);
            }
          },
        },
      );

      if (!response.data.success) {
        throw new Error('Upload failed: ' + response.data.message);
      }

      console.log(
        `[LaptopTransfer] Upload successful, jobId: ${response.data.jobId}`,
      );
      return response.data.jobId;
    } catch (error) {
      console.error('[LaptopTransfer] Upload error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Upload failed: ${error.response?.data?.error || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get connection status
   */
  isServerConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export default new LaptopTransferService();
