import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useMusicStore } from '@stores/musicStore';
import { useSessionStore } from '@stores/sessionStore';
import { MusicTrack } from '@types/index';

type MusicSelectionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MusicSelection'>;
};

export default function MusicSelectionScreen({ navigation }: MusicSelectionScreenProps) {
  const { availableTracks, selectedTrack, loading, loadTracks, selectTrack, clearSelection } =
    useMusicStore();
  const { updateConfig } = useSessionStore();

  useEffect(() => {
    if (availableTracks.length === 0 && !loading) {
      loadTracks();
    }
  }, []);

  const handleSelectTrack = async (track: MusicTrack) => {
    try {
      await selectTrack(track);
      updateConfig({ musicTrackId: track.id });
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to select track:', error);
    }
  };

  const handleClearSelection = () => {
    clearSelection();
    updateConfig({ musicTrackId: null });
    navigation.goBack();
  };

  const renderTrackItem = ({ item }: { item: MusicTrack }) => {
    const isSelected = selectedTrack?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.trackItem, isSelected && styles.trackItemSelected]}
        onPress={() => handleSelectTrack(item)}
      >
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle}>{item.title}</Text>
          <Text style={styles.trackArtist}>{item.artist}</Text>
          <Text style={styles.trackDuration}>{item.duration}s</Text>
        </View>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading music library...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Background Music</Text>
        <Text style={styles.headerSubtitle}>
          Select a track to play during the session
        </Text>
      </View>

      <FlatList
        data={availableTracks}
        keyExtractor={(item) => item.id}
        renderItem={renderTrackItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No music tracks available</Text>
            <Text style={styles.emptySubtext}>
              Add music files to your device to see them here
            </Text>
          </View>
        }
      />

      {selectedTrack && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClearSelection}>
          <Text style={styles.clearButtonText}>No Music</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
    marginTop: 16,
  },
  listContent: {
    padding: 20,
  },
  trackItem: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackItemSelected: {
    backgroundColor: '#2a4a2a',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  trackDuration: {
    fontSize: 12,
    color: '#666',
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: '#333',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
