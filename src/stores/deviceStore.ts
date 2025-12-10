import { create } from 'zustand';
import { DeviceConnectionState } from '../types';
import goProService from '@services/GoProService';
import boothService from '@services/BoothService';

interface DeviceStore {
  // State
  devices: DeviceConnectionState;
  connecting: {
    gopro: boolean;
    booth: boolean;
  };

  // Actions
  connectGoPro: () => Promise<void>;
  disconnectGoPro: () => Promise<void>;
  connectBooth: (baseUrl: string) => Promise<void>;
  disconnectBooth: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const INITIAL_DEVICE_STATE: DeviceConnectionState = {
  gopro: {
    connected: false,
    battery: null,
    recording: false,
    storageRemaining: null,
  },
  booth: {
    connected: false,
    rotating: false,
    currentSpeed: 0,
  },
};

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  // Initial state
  devices: INITIAL_DEVICE_STATE,
  connecting: {
    gopro: false,
    booth: false,
  },

  // Actions
  connectGoPro: async () => {
    set((state) => ({
      connecting: { ...state.connecting, gopro: true },
    }));

    try {
      console.log('[DeviceStore] Connecting to GoPro...');
      await goProService.connect();
      console.log('[DeviceStore] GoPro connected, getting status...');

      // Get initial status
      const status = await goProService.getStatus();
      console.log('[DeviceStore] Got status:', status);

      console.log('[DeviceStore] Updating state...');
      set((state) => ({
        devices: {
          ...state.devices,
          gopro: {
            connected: true,
            battery: status.battery,
            recording: status.recording,
            storageRemaining: status.sdCardSpace,
          },
        },
        connecting: { ...state.connecting, gopro: false },
      }));
      console.log('[DeviceStore] ✅ GoPro connection complete');
    } catch (error) {
      console.error('[DeviceStore] Failed to connect GoPro:', error);
      set((state) => ({
        connecting: { ...state.connecting, gopro: false },
      }));
      throw error;
    }
  },

  disconnectGoPro: async () => {
    try {
      await goProService.disconnect();

      set((state) => ({
        devices: {
          ...state.devices,
          gopro: {
            connected: false,
            battery: null,
            recording: false,
            storageRemaining: null,
          },
        },
      }));
    } catch (error) {
      console.error('[DeviceStore] Failed to disconnect GoPro:', error);
      throw error;
    }
  },

  connectBooth: async (baseUrl: string) => {
    set((state) => ({
      connecting: { ...state.connecting, booth: true },
    }));

    try {
      await boothService.connect(baseUrl);

      // Get initial status
      const status = await boothService.getStatus();

      set((state) => ({
        devices: {
          ...state.devices,
          booth: {
            connected: true,
            rotating: status.rotating,
            currentSpeed: status.speed,
          },
        },
        connecting: { ...state.connecting, booth: false },
      }));
    } catch (error) {
      console.error('[DeviceStore] Failed to connect booth:', error);
      set((state) => ({
        connecting: { ...state.connecting, booth: false },
      }));
      throw error;
    }
  },

  disconnectBooth: async () => {
    try {
      await boothService.disconnect();

      set((state) => ({
        devices: {
          ...state.devices,
          booth: {
            connected: false,
            rotating: false,
            currentSpeed: 0,
          },
        },
      }));
    } catch (error) {
      console.error('[DeviceStore] Failed to disconnect booth:', error);
      throw error;
    }
  },

  refreshStatus: async () => {
    const { devices } = get();

    try {
      // Refresh GoPro status if connected
      if (devices.gopro.connected) {
        const goProStatus = await goProService.getStatus();
        set((state) => ({
          devices: {
            ...state.devices,
            gopro: {
              ...state.devices.gopro,
              battery: goProStatus.battery,
              recording: goProStatus.recording,
              storageRemaining: goProStatus.sdCardSpace,
            },
          },
        }));
      }

      // Refresh booth status if connected
      if (devices.booth.connected) {
        const boothStatus = await boothService.getStatus();
        set((state) => ({
          devices: {
            ...state.devices,
            booth: {
              ...state.devices.booth,
              rotating: boothStatus.rotating,
              currentSpeed: boothStatus.speed,
            },
          },
        }));
      }
    } catch (error) {
      console.error('[DeviceStore] Failed to refresh status:', error);
    }
  },
}));
