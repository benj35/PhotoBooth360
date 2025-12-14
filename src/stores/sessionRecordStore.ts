import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionRecord } from '../types';

interface SessionRecordStore {
  sessions: SessionRecord[];
  loading: boolean;
  currentSessionCount: number; // Counter for GoPro video numbering

  // Actions
  loadSessions: () => Promise<void>;
  createSession: (eventId: string, eventName: string, customerName: string, customerPhone: string) => Promise<SessionRecord>;
  updateSessionStatus: (sessionId: string, status: SessionRecord['status'], error?: string | null) => Promise<void>;
  updateSessionVideo: (sessionId: string, videoFilename: string) => Promise<void>;
  getSessionsByEvent: (eventId: string) => SessionRecord[];
  clearSessions: () => Promise<void>;
}

const STORAGE_KEY = 'photobooth_sessions';
const COUNTER_KEY = 'photobooth_session_counter';

export const useSessionRecordStore = create<SessionRecordStore>((set, get) => ({
  sessions: [],
  loading: false,
  currentSessionCount: 0,

  loadSessions: async () => {
    try {
      set({ loading: true });
      const [sessionsJson, counterJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(COUNTER_KEY),
      ]);

      const sessions = sessionsJson ? JSON.parse(sessionsJson) : [];
      const currentSessionCount = counterJson ? parseInt(counterJson) : 0;

      set({ sessions, currentSessionCount, loading: false });
    } catch (error) {
      console.error('[SessionRecordStore] Failed to load sessions:', error);
      set({ loading: false });
    }
  },

  createSession: async (eventId: string, eventName: string, customerName: string, customerPhone: string) => {
    const currentCount = get().currentSessionCount + 1;

    const newSession: SessionRecord = {
      id: `session_${Date.now()}`,
      eventId,
      eventName,
      customerName,
      customerPhone,
      timestamp: new Date().toISOString(),
      goProVideoNumber: currentCount,
      videoFilename: null,
      status: 'recording',
      error: null,
    };

    const updatedSessions = [...get().sessions, newSession];
    set({ sessions: updatedSessions, currentSessionCount: currentCount });

    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions)),
        AsyncStorage.setItem(COUNTER_KEY, currentCount.toString()),
      ]);
    } catch (error) {
      console.error('[SessionRecordStore] Failed to save session:', error);
    }

    console.log('[SessionRecordStore] Created session:', newSession);
    return newSession;
  },

  updateSessionStatus: async (sessionId: string, status: SessionRecord['status'], error: string | null = null) => {
    const updatedSessions = get().sessions.map((s) =>
      s.id === sessionId ? { ...s, status, error } : s
    );
    set({ sessions: updatedSessions });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (err) {
      console.error('[SessionRecordStore] Failed to update session status:', err);
    }

    console.log(`[SessionRecordStore] Session ${sessionId} status: ${status}`);
  },

  updateSessionVideo: async (sessionId: string, videoFilename: string) => {
    const updatedSessions = get().sessions.map((s) =>
      s.id === sessionId ? { ...s, videoFilename } : s
    );
    set({ sessions: updatedSessions });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (error) {
      console.error('[SessionRecordStore] Failed to update session video:', error);
    }
  },

  getSessionsByEvent: (eventId: string) => {
    return get().sessions.filter((s) => s.eventId === eventId);
  },

  clearSessions: async () => {
    set({ sessions: [], currentSessionCount: 0 });
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEY),
        AsyncStorage.removeItem(COUNTER_KEY),
      ]);
    } catch (error) {
      console.error('[SessionRecordStore] Failed to clear sessions:', error);
    }
  },
}));
