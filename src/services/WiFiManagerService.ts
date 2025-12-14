import WifiManager from 'react-native-wifi-reborn';

/**
 * WiFi Manager Service - Handles automatic WiFi network switching
 *
 * This service coordinates switching between:
 * 1. Booth WiFi (for booth control + GoPro BLE)
 * 2. GoPro WiFi (for video downloads via HTTP API)
 *
 * Critical for real-time workflow:
 * - After recording → Switch to GoPro WiFi
 * - After download → Switch back to Booth WiFi
 */
export class WiFiManagerService {
  private boothSSID: string = '';
  private boothPassword: string = '';
  private goProSSID: string = '';
  private goProPassword: string = '';
  private currentNetwork: 'booth' | 'gopro' | 'unknown' = 'unknown';

  constructor() {
    console.log('[WiFiManager] Service initialized');
  }

  /**
   * Configure booth WiFi credentials
   * Call this after connecting to booth WiFi in ConnectionScreen
   */
  setBoothCredentials(ssid: string, password: string): void {
    this.boothSSID = ssid;
    this.boothPassword = password;
    console.log('[WiFiManager] Booth WiFi configured:', ssid);
  }

  /**
   * Configure GoPro WiFi credentials
   * Call this during initial setup in ConnectionScreen
   */
  setGoProCredentials(ssid: string, password: string): void {
    this.goProSSID = ssid;
    this.goProPassword = password;
    console.log('[WiFiManager] GoPro WiFi configured:', ssid);
  }

  /**
   * Get configured credentials (for debugging)
   */
  getConfiguredNetworks(): { booth: string; gopro: string } {
    return {
      booth: this.boothSSID || 'Not configured',
      gopro: this.goProSSID || 'Not configured',
    };
  }

  /**
   * Get current WiFi SSID
   */
  async getCurrentSSID(): Promise<string> {
    try {
      const ssid = await WifiManager.getCurrentWifiSSID();
      console.log('[WiFiManager] Current SSID:', ssid);

      // Update internal state
      if (ssid === this.goProSSID) {
        this.currentNetwork = 'gopro';
      } else if (ssid === this.boothSSID) {
        this.currentNetwork = 'booth';
      } else {
        this.currentNetwork = 'unknown';
      }

      return ssid;
    } catch (error) {
      console.error('[WiFiManager] Failed to get current SSID:', error);
      throw error;
    }
  }

  /**
   * Switch to GoPro WiFi for video download
   * Returns true if successful
   */
  async switchToGoProWiFi(): Promise<boolean> {
    try {
      console.log('[WiFiManager] === Starting GoPro WiFi Switch ===');
      console.log('[WiFiManager] Target SSID:', this.goProSSID);
      console.log('[WiFiManager] Target Password:', this.goProPassword.substring(0, 3) + '***');

      // Get current network before disconnecting
      try {
        const currentSSID = await WifiManager.getCurrentWifiSSID();
        console.log('[WiFiManager] Currently connected to:', currentSSID);
      } catch (e) {
        console.log('[WiFiManager] Not currently connected to any WiFi');
      }

      // Scan for available networks first to verify GoPro WiFi is visible
      console.log('[WiFiManager] Scanning for available WiFi networks...');
      try {
        const networks = await WifiManager.loadWifiList();
        console.log('[WiFiManager] Found', networks.length, 'WiFi networks:');
        networks.forEach((net: any, index: number) => {
          console.log(`[WiFiManager]   ${index + 1}. ${net.SSID} (Signal: ${net.level})`);
        });

        const goProNetwork = networks.find((net: any) => net.SSID === this.goProSSID);
        if (goProNetwork) {
          console.log('[WiFiManager] ✅ GoPro WiFi FOUND in scan:', this.goProSSID);
          console.log('[WiFiManager] Signal strength:', goProNetwork.level);
        } else {
          console.error('[WiFiManager] ❌ GoPro WiFi NOT FOUND in scan!');
          console.error('[WiFiManager] Expected SSID:', this.goProSSID);
          console.error('[WiFiManager] This means GoPro WiFi is not broadcasting');
          console.error('[WiFiManager] Possible causes:');
          console.error('[WiFiManager]   1. BLE WiFi enable command failed');
          console.error('[WiFiManager]   2. GoPro WiFi hardware not responding');
          console.error('[WiFiManager]   3. Need more wait time after BLE command');
          return false;
        }
      } catch (scanError) {
        console.error('[WiFiManager] WiFi scan failed:', scanError);
        // Continue anyway - maybe scan isn't supported
      }

      // Disconnect from current network first
      console.log('[WiFiManager] Disconnecting from current network...');
      await WifiManager.disconnect();
      console.log('[WiFiManager] Disconnected from current network');

      // Wait a moment for disconnect to complete
      console.log('[WiFiManager] Waiting 1 second for disconnect to complete...');
      await this.sleep(1000);

      // Connect to GoPro WiFi
      console.log('[WiFiManager] Connecting to GoPro WiFi:', this.goProSSID);
      await WifiManager.connectToProtectedSSID(
        this.goProSSID,
        this.goProPassword,
        false, // Not hidden network
        false  // Not WEP (using WPA2)
      );

      console.log('[WiFiManager] ✅ Connected to GoPro WiFi');
      this.currentNetwork = 'gopro';

      // Wait for connection to stabilize
      console.log('[WiFiManager] Waiting 2 seconds for connection to stabilize...');
      await this.sleep(2000);

      // Verify connection
      const currentSSID = await this.getCurrentSSID();
      const success = currentSSID === this.goProSSID;

      if (success) {
        console.log('[WiFiManager] ✅ Successfully switched to GoPro WiFi');
      } else {
        console.error('[WiFiManager] ❌ Failed to switch to GoPro WiFi');
        console.error('[WiFiManager] Expected:', this.goProSSID);
        console.error('[WiFiManager] Got:', currentSSID);
      }

      return success;
    } catch (error) {
      console.error('[WiFiManager] ❌ Error switching to GoPro WiFi:', error);
      console.error('[WiFiManager] Error type:', typeof error);
      console.error('[WiFiManager] Error message:', error instanceof Error ? error.message : String(error));
      this.currentNetwork = 'unknown';
      return false;
    }
  }

  /**
   * Switch back to Booth WiFi for next session
   * Returns true if successful
   */
  async switchToBoothWiFi(): Promise<boolean> {
    try {
      if (!this.boothSSID) {
        console.error('[WiFiManager] Booth WiFi not configured! Call setBoothCredentials() first.');
        return false;
      }

      console.log('[WiFiManager] Switching to Booth WiFi:', this.boothSSID);

      // Disconnect from current network first
      await WifiManager.disconnect();
      console.log('[WiFiManager] Disconnected from current network');

      // Wait a moment for disconnect to complete
      await this.sleep(1000);

      // Connect to Booth WiFi
      await WifiManager.connectToProtectedSSID(
        this.boothSSID,
        this.boothPassword,
        false, // Not hidden network
        false  // Not WEP (using WPA2)
      );

      console.log('[WiFiManager] ✅ Connected to Booth WiFi');
      this.currentNetwork = 'booth';

      // Wait for connection to stabilize
      await this.sleep(2000);

      // Verify connection
      const currentSSID = await this.getCurrentSSID();
      const success = currentSSID === this.boothSSID;

      if (!success) {
        console.error('[WiFiManager] ❌ Failed to switch to Booth WiFi');
      }

      return success;
    } catch (error) {
      console.error('[WiFiManager] Error switching to Booth WiFi:', error);
      this.currentNetwork = 'unknown';
      return false;
    }
  }

  /**
   * Check if currently connected to GoPro WiFi
   */
  async isConnectedToGoPro(): Promise<boolean> {
    try {
      const ssid = await this.getCurrentSSID();
      return ssid === this.goProSSID;
    } catch (error) {
      console.error('[WiFiManager] Failed to check GoPro connection:', error);
      return false;
    }
  }

  /**
   * Check if currently connected to Booth WiFi
   */
  async isConnectedToBooth(): Promise<boolean> {
    try {
      const ssid = await this.getCurrentSSID();
      return ssid === this.boothSSID;
    } catch (error) {
      console.error('[WiFiManager] Failed to check Booth connection:', error);
      return false;
    }
  }

  /**
   * Get list of available WiFi networks
   * Useful for troubleshooting
   */
  async scanNetworks(): Promise<any[]> {
    try {
      console.log('[WiFiManager] Scanning for WiFi networks...');
      const networks = await WifiManager.loadWifiList();
      console.log('[WiFiManager] Found networks:', networks.length);
      return networks;
    } catch (error) {
      console.error('[WiFiManager] Failed to scan networks:', error);
      return [];
    }
  }

  /**
   * Get current network type
   */
  getCurrentNetworkType(): 'booth' | 'gopro' | 'unknown' {
    return this.currentNetwork;
  }

  /**
   * Utility: Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Test WiFi switching (for debugging)
   */
  async testWiFiSwitching(): Promise<void> {
    console.log('[WiFiManager] === WiFi Switching Test ===');

    // Get current network
    const current = await this.getCurrentSSID();
    console.log('[WiFiManager] Current network:', current);

    // Switch to GoPro
    console.log('[WiFiManager] Switching to GoPro WiFi...');
    const goProSuccess = await this.switchToGoProWiFi();
    console.log('[WiFiManager] GoPro switch result:', goProSuccess ? 'SUCCESS' : 'FAILED');

    if (goProSuccess) {
      // Wait 5 seconds
      await this.sleep(5000);

      // Switch back to Booth
      console.log('[WiFiManager] Switching back to Booth WiFi...');
      const boothSuccess = await this.switchToBoothWiFi();
      console.log('[WiFiManager] Booth switch result:', boothSuccess ? 'SUCCESS' : 'FAILED');
    }

    console.log('[WiFiManager] === Test Complete ===');
  }
}

export default new WiFiManagerService();
