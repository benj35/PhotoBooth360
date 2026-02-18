import { create } from 'zustand';
import { SessionConfig, SessionState } from '../types';
import sessionOrchestrator from '@services/SessionOrchestrator';

interface SessionStore {
  // State
  config: SessionConfig;
  state: SessionState;

  // Actions
  updateConfig: (config: Partial<SessionConfig>) => void;
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  emergencyStop: () => Promise<void>;
  resetConfig: () => void;
  resetSession: () => void; // Reset customer info and state for new session
}

const DEFAULT_CONFIG: SessionConfig = {
  duration: 20, // 20 seconds default
  musicTrackId: null,
  musicFilename: null,
  rotationSpeed: 50, // 50% speed
  videoMode: 'standard',
  resolution: '4k',
  ledPreset: 'wedding-white', // Default LED preset
  eventId: null,
  eventName: '',
  customerName: '',
  customerPhone: '',
};

export const useSessionStore = create<SessionStore>((set, get) => {
  // Subscribe to orchestrator state changes
  sessionOrchestrator.onStateChange((state) => {
    set({ state });
  });

  return {
    // Initial state
    config: DEFAULT_CONFIG,
    state: sessionOrchestrator.getSessionState(),

    // Actions
    updateConfig: (configUpdate) => {
      set((state) => ({
        config: {
          ...state.config,
          ...configUpdate,
        },
      }));
    },

    startSession: async () => {
      const { config } = get();
      try {
        await sessionOrchestrator.startSession(config);
      } catch (error) {
        console.error('[SessionStore] Failed to start session:', error);
        set({
          state: {
            status: 'error',
            startTime: null,
            elapsedTime: 0,
            error: error instanceof Error ? error.message : 'Failed to start session',
          },
        });
        throw error;
      }
    },

    stopSession: async () => {
      try {
        await sessionOrchestrator.stopSession();
      } catch (error) {
        console.error('[SessionStore] Failed to stop session:', error);
        set({
          state: {
            status: 'error',
            startTime: null,
            elapsedTime: 0,
            error: error instanceof Error ? error.message : 'Failed to stop session',
          },
        });
        throw error;
      }
    },

    emergencyStop: async () => {
      try {
        await sessionOrchestrator.emergencyStop();
      } catch (error) {
        console.error('[SessionStore] Emergency stop failed:', error);
        // Force reset to idle regardless of error
        set({
          state: {
            status: 'idle',
            startTime: null,
            elapsedTime: 0,
            error: 'Emergency stop encountered an error',
          },
        });
      }
    },

    resetConfig: () => {
      set({ config: DEFAULT_CONFIG });
    },

    resetSession: () => {
      // Reset customer info but keep session settings (duration, speed, etc.)
      set((currentState) => ({
        config: {
          ...currentState.config,
          customerName: '',
          customerPhone: '',
        },
        state: {
          status: 'idle',
          startTime: null,
          elapsedTime: 0,
          error: null,
          downloadStatus: undefined,
          downloadProgress: undefined,
          laptopProgress: undefined,
        },
      }));
    },
  };
});
