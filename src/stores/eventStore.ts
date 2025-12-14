import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event } from '../types';

interface EventStore {
  events: Event[];
  selectedEventId: string | null;
  loading: boolean;

  // Actions
  loadEvents: () => Promise<void>;
  createEvent: (name: string, date: string) => Promise<Event>;
  selectEvent: (eventId: string | null) => void;
  deleteEvent: (eventId: string) => Promise<void>;
  getSelectedEvent: () => Event | null;
}

const STORAGE_KEY = 'photobooth_events';

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  selectedEventId: null,
  loading: false,

  loadEvents: async () => {
    try {
      set({ loading: true });
      const eventsJson = await AsyncStorage.getItem(STORAGE_KEY);
      const events = eventsJson ? JSON.parse(eventsJson) : [];
      set({ events, loading: false });
    } catch (error) {
      console.error('[EventStore] Failed to load events:', error);
      set({ loading: false });
    }
  },

  createEvent: async (name: string, date: string) => {
    const newEvent: Event = {
      id: `event_${Date.now()}`,
      name,
      date,
      createdAt: new Date().toISOString(),
    };

    const updatedEvents = [...get().events, newEvent];
    set({ events: updatedEvents });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvents));
    } catch (error) {
      console.error('[EventStore] Failed to save event:', error);
    }

    return newEvent;
  },

  selectEvent: (eventId: string | null) => {
    set({ selectedEventId: eventId });
  },

  deleteEvent: async (eventId: string) => {
    const updatedEvents = get().events.filter((e) => e.id !== eventId);
    set({ events: updatedEvents });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvents));
    } catch (error) {
      console.error('[EventStore] Failed to delete event:', error);
    }
  },

  getSelectedEvent: () => {
    const { events, selectedEventId } = get();
    return events.find((e) => e.id === selectedEventId) || null;
  },
}));
