import { create } from 'zustand';
import { MusicTrack } from '@types/index';
import laptopTransferService from '@services/LaptopTransferService';

interface MusicStore {
  // State
  availableTracks: MusicTrack[];
  selectedTrack: MusicTrack | null;
  loading: boolean;

  // Actions
  loadTracks: () => Promise<void>;
  selectTrack: (track: MusicTrack) => void;
  clearSelection: () => void;
}

export const useMusicStore = create<MusicStore>((set) => ({
  // Initial state
  availableTracks: [],
  selectedTrack: null,
  loading: false,

  // Actions
  loadTracks: async () => {
    set({ loading: true });

    try {
      const serverTracks = await laptopTransferService.fetchMusicTracks();

      const tracks: MusicTrack[] = serverTracks.map((t, index) => ({
        id: String(index + 1),
        title: t.name,
        filename: t.filename,
      }));

      set({
        availableTracks: tracks,
        loading: false,
      });
    } catch (error) {
      console.error('[MusicStore] Failed to load tracks:', error);
      set({ loading: false, availableTracks: [] });
    }
  },

  selectTrack: (track: MusicTrack) => {
    set({ selectedTrack: track });
  },

  clearSelection: () => {
    set({ selectedTrack: null });
  },
}));
