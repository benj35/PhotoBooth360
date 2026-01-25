/**
 * LaptopTransferService - Handles video upload/download with laptop processing server
 *
 * Workflow:
 * 1. Upload raw video from phone to laptop server
 * 2. Poll status until processing completes
 * 3. Download processed video back to phone
 */

import axios, {AxiosProgressEvent} from 'axios';
import RNFS from 'react-native-fs';
import {
  ILaptopTransferService,
  LaptopUploadResponse,
  LaptopStatusResponse,
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
   * Upload video to laptop for processing
   */
  async uploadVideo(
    videoPath: string,
    eventName: string,
    customerName: string,
    customerPhone: string,
    template: string,
    onProgress?: (progress: number) => void,
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
   * Check processing status
   */
  async checkStatus(jobId: string): Promise<LaptopStatusResponse> {
    try {
      const response = await axios.get<LaptopStatusResponse>(
        `${this.baseUrl}/status/${jobId}`,
        {
          timeout: 10000,
        },
      );

      console.log(
        `[LaptopTransfer] Status for ${jobId}: ${response.data.status} (${response.data.progress}%)`,
      );
      return response.data;
    } catch (error) {
      console.error('[LaptopTransfer] Status check error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(`Job ${jobId} not found on server`);
      }
      throw new Error(
        `Failed to check status: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Download processed video from laptop to phone
   */
  async downloadProcessedVideo(
    jobId: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    try {
      // First check if job is completed
      const status = await this.checkStatus(jobId);
      if (status.status !== 'completed') {
        throw new Error(
          `Cannot download - job status is: ${status.status}`,
        );
      }

      if (!status.outputFilename) {
        throw new Error('No output filename in job status');
      }

      // Create download path
      const downloadDir = `${RNFS.DocumentDirectoryPath}/processed_videos`;
      await RNFS.mkdir(downloadDir);

      const localPath = `${downloadDir}/${status.outputFilename}`;

      console.log(
        `[LaptopTransfer] Downloading processed video to ${localPath}`,
      );

      // Download file
      const downloadResult = await RNFS.downloadFile({
        fromUrl: `${this.baseUrl}/download/${jobId}`,
        toFile: localPath,
        begin: res => {
          console.log(
            `[LaptopTransfer] Download started, size: ${res.contentLength} bytes`,
          );
        },
        progress: res => {
          if (res.contentLength > 0) {
            const percentComplete = Math.round(
              (res.bytesWritten * 100) / res.contentLength,
            );
            onProgress?.(percentComplete);
            console.log(
              `[LaptopTransfer] Download progress: ${percentComplete}%`,
            );
          }
        },
      }).promise;

      if (downloadResult.statusCode !== 200) {
        throw new Error(
          `Download failed with status code: ${downloadResult.statusCode}`,
        );
      }

      console.log(`[LaptopTransfer] Download completed: ${localPath}`);
      return localPath;
    } catch (error) {
      console.error('[LaptopTransfer] Download error:', error);
      throw new Error(
        `Download failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Poll status until job completes or fails
   */
  async pollUntilComplete(
    jobId: string,
    onProgressUpdate?: (status: LaptopStatusResponse) => void,
    pollInterval: number = 3000,
    timeout: number = 600000, // 10 minutes default
  ): Promise<LaptopStatusResponse> {
    const startTime = Date.now();

    while (true) {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(
          `Polling timeout after ${timeout / 1000} seconds`,
        );
      }

      // Get status
      const status = await this.checkStatus(jobId);
      onProgressUpdate?.(status);

      // Check if done
      if (status.status === 'completed') {
        console.log(`[LaptopTransfer] Job ${jobId} completed successfully`);
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(
          `Processing failed: ${status.error || 'Unknown error'}`,
        );
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * Complete workflow: upload + poll + download
   */
  async processVideo(
    videoPath: string,
    eventName: string,
    customerName: string,
    customerPhone: string,
    template: string,
    onUploadProgress?: (progress: number) => void,
    onProcessingProgress?: (status: LaptopStatusResponse) => void,
    onDownloadProgress?: (progress: number) => void,
  ): Promise<string> {
    console.log('[LaptopTransfer] Starting complete video processing workflow');

    // 1. Upload
    const jobId = await this.uploadVideo(
      videoPath,
      eventName,
      customerName,
      customerPhone,
      template,
      onUploadProgress,
    );

    // 2. Poll until complete
    await this.pollUntilComplete(jobId, onProcessingProgress);

    // 3. Download
    const processedVideoPath = await this.downloadProcessedVideo(
      jobId,
      onDownloadProgress,
    );

    console.log(
      `[LaptopTransfer] Complete workflow finished: ${processedVideoPath}`,
    );
    return processedVideoPath;
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
