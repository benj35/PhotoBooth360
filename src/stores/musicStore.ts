import { create } from 'zustand';
import { MusicTrack } from '@types/index';
import audioService from '@services/AudioService';

interface MusicStore {
  // State
  availableTracks: MusicTrack[];
  selectedTrack: MusicTrack | null;
  loading: boolean;

  // Actions
  loadTracks: () => Promise<void>;
  selectTrack: (track: MusicTrack) => Promise<void>;
  clearSelection: () => void;
  addTrack: (track: MusicTrack) => void;
  removeTrack: (trackId: string) => void;
}

// Mock tracks for initial development
const MOCK_TRACKS: MusicTrack[] = [
  {
    id: '1',
    title: 'Upbeat Vibes',
    artist: 'DJ Booth',
    duration: 25,
    uri: 'upbeat_vibes.mp3',
    thumbnailUri: undefined,
  },
  {
    id: '2',
    title: 'Party Time',
    artist: 'The 360s',
    duration: 30,
    uri: 'party_time.mp3',
    thumbnailUri: undefined,
  },
  {
    id: '3',
    title: 'Smooth Groove',
    artist: 'Spin Master',
    duration: 20,
    uri: 'smooth_groove.mp3',
    thumbnailUri: undefined,
  },
  {
    id: '4',
    title: 'Electric Dreams',
    artist: 'Rotation Records',
    duration: 28,
    uri: 'electric_dreams.mp3',
    thumbnailUri: undefined,
  },
  {
    id: '5',
    title: 'Feel Good',
    artist: 'Booth Beats',
    duration: 22,
    uri: 'feel_good.mp3',
    thumbnailUri: undefined,
  },
];

export const useMusicStore = create<MusicStore>((set, get) => ({
  // Initial state
  availableTracks: [],
  selectedTrack: null,
  loading: false,

  // Actions
  loadTracks: async () => {
    set({ loading: true });

    try {
      // In real implementation, this would load tracks from device storage or API
      // For now, use mock tracks
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading

      set({
        availableTracks: MOCK_TRACKS,
        loading: false,
      });
    } catch (error) {
      console.error('[MusicStore] Failed to load tracks:', error);
      set({ loading: false });
      throw error;
    }
  },

  selectTrack: async (track: MusicTrack) => {
    try {
      // Preload the track into audio service
      await audioService.loadTrack(track.uri);

      set({ selectedTrack: track });
    } catch (error) {
      console.error('[MusicStore] Failed to select track:', error);
      throw error;
    }
  },

  clearSelection: () => {
    audioService.release();
    set({ selectedTrack: null });
  },

  addTrack: (track: MusicTrack) => {
    set((state) => ({
      availableTracks: [...state.availableTracks, track],
    }));
  },

  removeTrack: (trackId: string) => {
    set((state) => {
      const updatedTracks = state.availableTracks.filter(t => t.id !== trackId);
      const updatedSelection = state.selectedTrack?.id === trackId
        ? null
        : state.selectedTrack;

      if (updatedSelection === null) {
        audioService.release();
      }

      return {
        availableTracks: updatedTracks,
        selectedTrack: updatedSelection,
      };
    });
  },
}));
