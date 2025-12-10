import axios, { AxiosInstance } from 'axios';
import { IBoothService, BoothStatus } from '../types';

/**
 * ESP32 Booth Service - Controls the 360° booth rotation via REST API
 *
 * API Endpoints:
 * - Motor: /api/motor?action=on&dir=fwd&speed=50
 * - LED: /api/led?power=true&mode=solid&r=255&g=255&b=255
 *
 * Example base URL: http://192.168.4.1
 */
export class BoothService implements IBoothService {
  private client: AxiosInstance | null = null;
  private baseUrl: string = '';
  private isConnected = false;
  private currentSpeed = 0;
  private isRotating = false;

  /**
   * Connect to ESP32 booth controller
   * @param baseUrl - Base URL of ESP32 (e.g., http://192.168.1.100)
   */
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
      // Test connection by calling motor status (action off)
      await this.client.get('/api/motor', {
        params: {
          action: 'off',
        },
      });

      this.isConnected = true;
      this.isRotating = false;
      this.currentSpeed = 0;
      console.log('[Booth] ✅ Connected successfully');
    } catch (error) {
      console.error('[Booth] ❌ Connection failed:', error);
      throw new Error('Failed to connect to booth. Check IP address and network.');
    }
  }

  /**
   * Disconnect from booth
   */
  async disconnect(): Promise<void> {
    // Stop rotation before disconnecting
    if (this.isRotating) {
      await this.stopRotation();
    }

    this.isConnected = false;
    this.client = null;
    this.isRotating = false;
    this.currentSpeed = 0;
    console.log('[Booth] Disconnected');
  }

  /**
   * Start booth rotation
   * @param speed - Rotation speed (1-100)
   */
  async startRotation(speed: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      throw new Error('Booth is not connected');
    }

    // Validate speed
    const validSpeed = Math.max(1, Math.min(100, Math.round(speed)));

    console.log('[Booth] Starting rotation at speed:', validSpeed);

    try {
      // Call ESP32 motor API
      await this.client.get('/api/motor', {
        params: {
          action: 'on',
          dir: 'fwd', // Forward direction for 360° rotation
          speed: validSpeed,
        },
      });

      this.isRotating = true;
      this.currentSpeed = validSpeed;
      console.log('[Booth] ✅ Rotation started');
    } catch (error) {
      console.error('[Booth] ❌ Error starting rotation:', error);
      throw new Error('Failed to start booth rotation');
    }
  }

  /**
   * Stop booth rotation
   */
  async stopRotation(): Promise<void> {
    if (!this.isConnected || !this.client) {
      throw new Error('Booth is not connected');
    }

    console.log('[Booth] Stopping rotation');

    try {
      // Call ESP32 motor API to stop
      await this.client.get('/api/motor', {
        params: {
          action: 'off',
        },
      });

      this.isRotating = false;
      this.currentSpeed = 0;
      console.log('[Booth] ✅ Rotation stopped');
    } catch (error) {
      console.error('[Booth] ❌ Error stopping rotation:', error);
      throw new Error('Failed to stop booth rotation');
    }
  }

  /**
   * Get booth status
   */
  async getStatus(): Promise<BoothStatus> {
    if (!this.isConnected) {
      throw new Error('Booth is not connected');
    }

    // For now, return cached status
    // ESP32 doesn't have a dedicated status endpoint
    // We track state locally based on our commands
    return {
      rotating: this.isRotating,
      speed: this.currentSpeed,
      temperature: 0, // ESP32 doesn't report temperature
      errorCode: null,
    };
  }

  /**
   * Control LED lights
   * @param power - 'on' or 'off'
   * @param brightness - Brightness 0-255
   * @param mode - 'solid', 'blink', or 'fade'
   * @param r - Red value (0-255)
   * @param g - Green value (0-255)
   * @param b - Blue value (0-255)
   * @param interval - Blink interval in ms (optional, for blink mode)
   * @param speed - Fade speed 1-40 (optional, for fade mode)
   */
  async setLED(
    power: 'on' | 'off',
    brightness: number = 255,
    mode: 'solid' | 'blink' | 'fade' = 'solid',
    r: number = 255,
    g: number = 255,
    b: number = 255,
    interval?: number,
    speed?: number
  ): Promise<void> {
    if (!this.isConnected || !this.client) {
      throw new Error('Booth is not connected');
    }

    try {
      const params: any = {
        power,
        brightness: Math.max(0, Math.min(255, brightness)),
        mode,
        r: Math.max(0, Math.min(255, r)),
        g: Math.max(0, Math.min(255, g)),
        b: Math.max(0, Math.min(255, b)),
      };

      // Add interval for blink mode
      if (mode === 'blink' && interval) {
        params.interval = interval;
      }

      // Add speed for fade mode
      if (mode === 'fade' && speed) {
        params.speed = Math.max(1, Math.min(40, speed));
      }

      await this.client.get('/api/led', { params });

      console.log('[Booth] LED updated:', params);
    } catch (error) {
      console.error('[Booth] Error setting LED:', error);
      // Don't throw - LED is optional feature
    }
  }

  /**
   * Quick LED presets
   */
  async ledOff(): Promise<void> {
    await this.setLED('off', 0, 'solid', 0, 0, 0);
  }

  async ledWhite(brightness: number = 255): Promise<void> {
    await this.setLED('on', brightness, 'solid', 255, 255, 255);
  }

  async ledColor(r: number, g: number, b: number, brightness: number = 255): Promise<void> {
    await this.setLED('on', brightness, 'solid', r, g, b);
  }

  async ledBlink(r: number, g: number, b: number, interval: number = 500): Promise<void> {
    await this.setLED('on', 255, 'blink', r, g, b, interval);
  }

  async ledFade(r: number, g: number, b: number, speed: number = 20): Promise<void> {
    await this.setLED('on', 255, 'fade', r, g, b, undefined, speed);
  }

  /**
   * Apply LED preset from session configuration
   * @param preset - LED preset identifier
   */
  async applyLEDPreset(preset: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      throw new Error('Booth is not connected');
    }

    console.log('[Booth] Applying LED preset:', preset);

    try {
      switch (preset) {
        case 'off':
          await this.ledOff();
          break;

        case 'wedding-white':
          await this.ledWhite(255); // Bright white at full brightness
          break;

        case 'party-colors':
          // Rainbow cycling effect using fade mode
          await this.setLED('on', 255, 'fade', 255, 0, 255, undefined, 15); // Fast fade
          break;

        case 'romantic-pink':
          await this.ledColor(255, 105, 180, 200); // Hot pink at 200 brightness
          break;

        case 'corporate-blue':
          await this.ledColor(30, 144, 255, 220); // Dodger blue at 220 brightness
          break;

        case 'energetic-red':
          await this.ledColor(255, 0, 0, 255); // Pure red at full brightness
          break;

        case 'cool-purple':
          await this.ledColor(147, 112, 219, 210); // Medium purple at 210 brightness
          break;

        default:
          console.warn('[Booth] Unknown LED preset:', preset);
          await this.ledWhite(255); // Default to white
      }

      console.log('[Booth] ✅ LED preset applied');
    } catch (error) {
      console.error('[Booth] Error applying LED preset:', error);
      // Don't throw - LED is optional feature
    }
  }

  // Utility methods
  isDeviceConnected(): boolean {
    return this.isConnected;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getCurrentSpeed(): number {
    return this.currentSpeed;
  }

  isCurrentlyRotating(): boolean {
    return this.isRotating;
  }
}

export default new BoothService();
