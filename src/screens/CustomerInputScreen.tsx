import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useEventStore } from '@stores/eventStore';
import { useSessionStore } from '@stores/sessionStore';

type CustomerInputScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CustomerInput'>;
};

export default function CustomerInputScreen({ navigation }: CustomerInputScreenProps) {
  const { events, selectedEventId, selectEvent, loadEvents } = useEventStore();
  const { config, updateConfig } = useSessionStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const handleStartSession = () => {
    if (!selectedEventId) {
      Alert.alert('Error', 'Please select an event first');
      return;
    }

    if (!customerName.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }

    if (!customerPhone.trim()) {
      Alert.alert('Error', 'Please enter customer phone number for Telegram delivery');
      return;
    }

    // Update session config with customer info
    updateConfig({
      eventId: selectedEventId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
    });

    console.log('[CustomerInput] Starting session for:', customerName);

    // Navigate to Home screen (reset stack so back doesn't go to customer input)
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const handleCreateEvent = () => {
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!newEventName.trim()) {
      Alert.alert('Error', 'Please enter an event name');
      return;
    }

    const { createEvent } = useEventStore.getState();
    const newEvent = await createEvent(newEventName.trim(), new Date().toISOString());
    selectEvent(newEvent.id);
    setNewEventName('');
    setShowEventModal(false);
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Text style={styles.title}>Session Setup</Text>
        <Text style={styles.subtitle}>Enter customer information before starting</Text>

        {/* Event Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Event *</Text>
          {events.length === 0 ? (
            <TouchableOpacity style={styles.createButton} onPress={handleCreateEvent}>
              <Text style={styles.createButtonText}>+ Create First Event</Text>
            </TouchableOpacity>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventList}>
                {events.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.eventCard,
                      selectedEventId === event.id && styles.eventCardSelected,
                    ]}
                    onPress={() => selectEvent(event.id)}
                  >
                    <Text
                      style={[
                        styles.eventName,
                        selectedEventId === event.id && styles.eventNameSelected,
                      ]}
                    >
                      {event.name}
                    </Text>
                    <Text style={styles.eventDate}>
                      {new Date(event.date).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.addEventButton} onPress={handleCreateEvent}>
                <Text style={styles.addEventText}>+ Add Event</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Customer Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Customer Name *</Text>
          <TextInput
            style={styles.input}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="e.g., John Smith"
            placeholderTextColor="#666"
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        {/* Customer Phone */}
        <View style={styles.section}>
          <Text style={styles.label}>Phone Number (for Telegram) *</Text>
          <TextInput
            style={styles.input}
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder="e.g., +1234567890"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
            returnKeyType="done"
          />
          <Text style={styles.hint}>Video will be sent to this number via Telegram</Text>
        </View>

        {/* Summary */}
        {selectedEvent && customerName && customerPhone && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Ready to Record:</Text>
            <Text style={styles.summaryText}>Event: {selectedEvent.name}</Text>
            <Text style={styles.summaryText}>Customer: {customerName}</Text>
            <Text style={styles.summaryText}>Phone: {customerPhone}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.startButton,
              (!selectedEventId || !customerName || !customerPhone) && styles.buttonDisabled,
            ]}
            onPress={handleStartSession}
            disabled={!selectedEventId || !customerName || !customerPhone}
          >
            <Text style={styles.startButtonText}>Continue to Session</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Create Event Modal */}
      <Modal
        visible={showEventModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Event</Text>
            <Text style={styles.modalSubtitle}>
              Enter event name (e.g., "Wedding - Sarah & Mike")
            </Text>

            <TextInput
              style={styles.modalInput}
              value={newEventName}
              onChangeText={setNewEventName}
              placeholder="Event name"
              placeholderTextColor="#666"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveEvent}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setNewEventName('');
                  setShowEventModal(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveEvent}
              >
                <Text style={styles.modalSaveText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  eventList: {
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#333',
    minWidth: 200,
  },
  eventCardSelected: {
    borderColor: '#4caf50',
    backgroundColor: '#2a4a2a',
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  eventNameSelected: {
    color: '#4caf50',
  },
  eventDate: {
    fontSize: 12,
    color: '#666',
  },
  addEventButton: {
    padding: 12,
    alignItems: 'center',
  },
  addEventText: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#1a3a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  actions: {
    gap: 12,
  },
  startButton: {
    backgroundColor: '#4caf50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4caf50',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
