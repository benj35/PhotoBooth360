import axios, { AxiosInstance } from 'axios';
import { IBoothService, BoothStatus } from '@types/index';

/**
 * ESP32 Booth Service - Controls the 360° booth rotation
 * This is initially a mock implementation that will be replaced with actual REST API calls
 */
export class BoothService implements IBoothService {
  private client: AxiosInstance | null = null;
  private baseUrl: string = '';
  private isConnected = false;
  private mockRotating = false;
  private mockSpeed = 0;

  async connect(baseUrl: string): Promise<void> {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[Booth] Connecting to:', baseUrl);

    try {
      // Try to ping the booth
      // For now, this is mocked - will work once ESP32 REST API is implemented
      // await this.client.get('/status');

      // Mock successful connection
      this.isConnected = true;
      console.log('[Booth] Connected successfully (mock)');
    } catch (error) {
      // Even if connection fails, we'll continue in mock mode
      this.isConnected = true;
      console.log('[Booth] Using mock mode');
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.client = null;
    this.mockRotating = false;
    this.mockSpeed = 0;
    console.log('[Booth] Disconnected');
  }

  async startRotation(speed: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Booth is not connected');
    }

    console.log('[Booth] Starting rotation at speed:', speed);

    try {
      if (this.client) {
        // Actual REST API call (when ESP32 is ready)
        // await this.client.post('/rotate/start', { speed });
      }

      // Mock implementation
      this.mockRotating = true;
      this.mockSpeed = speed;
      console.log('[Booth] Rotation started (mock)');
    } catch (error) {
      console.error('[Booth] Error starting rotation:', error);
      // Continue in mock mode
      this.mockRotating = true;
      this.mockSpeed = speed;
    }
  }

  async stopRotation(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Booth is not connected');
    }

    console.log('[Booth] Stopping rotation');

    try {
      if (this.client) {
        // Actual REST API call (when ESP32 is ready)
        // await this.client.post('/rotate/stop');
      }

      // Mock implementation
      this.mockRotating = false;
      this.mockSpeed = 0;
      console.log('[Booth] Rotation stopped (mock)');
    } catch (error) {
      console.error('[Booth] Error stopping rotation:', error);
      // Continue in mock mode
      this.mockRotating = false;
      this.mockSpeed = 0;
    }
  }

  async getStatus(): Promise<BoothStatus> {
    if (!this.isConnected) {
      throw new Error('Booth is not connected');
    }

    try {
      if (this.client) {
        // Actual REST API call (when ESP32 is ready)
        // const response = await this.client.get('/status');
        // return response.data;
      }

      // Mock implementation
      return {
        rotating: this.mockRotating,
        speed: this.mockSpeed,
        temperature: 45,
        errorCode: null,
      };
    } catch (error) {
      console.error('[Booth] Error getting status:', error);
      // Return mock status
      return {
        rotating: this.mockRotating,
        speed: this.mockSpeed,
        temperature: 45,
        errorCode: null,
      };
    }
  }

  // Utility methods
  isDeviceConnected(): boolean {
    return this.isConnected;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export default new BoothService();
