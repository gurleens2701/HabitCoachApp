// app/edit.jsx
import { View, TextInput, Pressable, Text, StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, Switch, Modal } from 'react-native';
import { useState, useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { HabitProvider } from '../context/HabitContext';
import { useHabitContext } from '../context/HabitContext';

export default function EditHabitScreenWrapper() {
  return (
    <HabitProvider>
      <EditHabitScreen />
    </HabitProvider>
  );
}

function EditHabitScreen() {
  const { habits, editHabit } = useHabitContext();
  const params = useLocalSearchParams();
  const habitId = params.id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [habitData, setHabitData] = useState(null);
  
  // Time picker state
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState('7');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [isAM, setIsAM] = useState(true);

  // Load habit data when screen is focused
  useFocusEffect(
    useCallback(() => {
      const currentHabit = habits.find(h => h.id === habitId);
      if (currentHabit) {
        setHabitData({
          name: currentHabit.name,
          description: currentHabit.description || '',
          targetCompletions: currentHabit.targetCompletions.toString(),
          timeframe: currentHabit.timeframe ? currentHabit.timeframe.toString() : '',
          trackStreak: currentHabit.trackStreak || false,
          targetTime: currentHabit.targetTime || null,
        });
        
        // If there's an existing target time, initialize our time picker with it
        if (currentHabit.targetTime) {
          initializeTimeFromString(currentHabit.targetTime);
        } else {
          // Set default time (current time)
          const now = new Date();
          let hours = now.getHours();
          const minutes = now.getMinutes();
          const am = hours < 12;
          
          // Convert to 12-hour format
          if (hours > 12) hours -= 12;
          if (hours === 0) hours = 12;
          
          setSelectedHour(hours.toString());
          setSelectedMinute(minutes.toString().padStart(2, '0'));
          setIsAM(am);
        }
      }
      setIsSubmitting(false);
      setShowTimeModal(false);
      return () => {};
    }, [habitId, habits])
  );

  // Helper to initialize time picker from a time string like "14:30"
  const initializeTimeFromString = (timeString) => {
    try {
      const [hoursStr, minutesStr] = timeString.split(':');
      let hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      
      // Convert from 24-hour to 12-hour format
      const am = hours < 12;
      if (hours > 12) hours -= 12;
      if (hours === 0) hours = 12;
      
      setSelectedHour(hours.toString());
      setSelectedMinute(minutes.toString().padStart(2, '0'));
      setIsAM(am);
    } catch (error) {
      console.error('Error parsing time string:', error);
      // Fallback to default
      setSelectedHour('7');
      setSelectedMinute('00');
      setIsAM(true);
    }
  };

  // Format the time for storage and display
  const formatTimeForStorage = () => {
    let hours = parseInt(selectedHour, 10);
    
    // Convert from 12-hour to 24-hour format
    if (!isAM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${selectedMinute}`;
  };
  
  // Format for display
  const formatTimeForDisplay = () => {
    return `${selectedHour}:${selectedMinute} ${isAM ? 'AM' : 'PM'}`;
  };

  const handleEdit = async () => {
    if (isSubmitting || !habitData) return;
    
    if (!habitData.name.trim()) {
      alert('Please enter a habit name');
      return;
    }
  
    try {
      setIsSubmitting(true);
      
      // Create a copy of habit data with the correctly formatted time
      const dataToSubmit = {
        ...habitData,
        targetTime: habitData.targetTime // This will already be in the correct format
      };
      
      console.log('Editing habit:', { id: habitId, ...dataToSubmit });
      const success = await editHabit(habitId, dataToSubmit);
      if (success) {
        console.log('Successfully edited habit');
        router.back();
      } else {
        alert('Failed to edit habit');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error editing habit:', error);
      alert('Error editing habit');
      setIsSubmitting(false);
    }
  };

  const handleSetTime = () => {
    const formattedTime = formatTimeForStorage();
    setHabitData(prev => ({ 
      ...prev, 
      targetTime: formattedTime 
    }));
    setShowTimeModal(false);
  };

  const handleClearTime = () => {
    setHabitData(prev => ({ 
      ...prev, 
      targetTime: null 
    }));
  };

  if (!habitData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text>Loading habit...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit Habit</Text>
        <View style={styles.placeholder} />
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <TextInput
            style={styles.input}
            placeholder="Habit Name"
            value={habitData.name}
            onChangeText={(text) => setHabitData(prev => ({ ...prev, name: text }))}
          />
          <TextInput
            style={styles.inputMultiline}
            placeholder="Description (optional)"
            value={habitData.description}
            onChangeText={(text) => setHabitData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <TextInput
            style={styles.input}
            placeholder="Target Completions"
            value={habitData.targetCompletions}
            keyboardType="numeric"
            onChangeText={(text) => setHabitData(prev => ({ ...prev, targetCompletions: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Timeframe in Days (optional)"
            value={habitData.timeframe}
            keyboardType="numeric"
            onChangeText={(text) => setHabitData(prev => ({ ...prev, timeframe: text }))}
          />
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Track Streak?</Text>
            <Switch
              value={habitData.trackStreak}
              onValueChange={(value) => setHabitData(prev => ({ ...prev, trackStreak: value }))}
            />
          </View>

          <View style={styles.timeContainer}>
            <Text style={styles.timeLabel}>Daily Target Time (optional)</Text>
            <Text style={styles.timeDisplay}>
              {habitData.targetTime ? `Set for ${habitData.targetTime}` : 'No time set'}
            </Text>
            <View style={styles.timeButtonsRow}>
              <Pressable
                style={styles.timeButton}
                onPress={() => setShowTimeModal(true)}
                disabled={isSubmitting}
              >
                <Text style={styles.timeButtonText}>Change Time</Text>
              </Pressable>
              
              {habitData.targetTime && (
                <Pressable
                  style={[styles.timeButton, styles.clearButton]}
                  onPress={handleClearTime}
                  disabled={isSubmitting}
                >
                  <Text style={styles.clearButtonText}>Clear Time</Text>
                </Pressable>
              )}
            </View>
          </View>
          
          <Pressable 
            style={[
              styles.button,
              isSubmitting && styles.buttonDisabled
            ]}
            onPress={handleEdit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.buttonText}>Saving...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      
      {/* Custom Time Input Modal */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Daily Target Time</Text>
            
            <View style={styles.timeInputContainer}>
              <View style={styles.timeInputGroup}>
                {/* Hour selection */}
                <View style={styles.timeInput}>
                  <Pressable 
                    style={styles.timeButton}
                    onPress={() => {
                      const current = parseInt(selectedHour);
                      if (current < 12) setSelectedHour((current + 1).toString());
                    }}
                  >
                    <Text style={styles.timeButtonText}>▲</Text>
                  </Pressable>
                  
                  <TextInput
                    style={styles.timeInputText}
                    value={selectedHour}
                    onChangeText={(text) => {
                      const num = parseInt(text);
                      if (!isNaN(num) && num >= 1 && num <= 12) {
                        setSelectedHour(num.toString());
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  
                  <Pressable 
                    style={styles.timeButton}
                    onPress={() => {
                      const current = parseInt(selectedHour);
                      if (current > 1) setSelectedHour((current - 1).toString());
                      else setSelectedHour('12');
                    }}
                  >
                    <Text style={styles.timeButtonText}>▼</Text>
                  </Pressable>
                </View>
                
                <Text style={styles.timeColon}>:</Text>
                
                {/* Minute selection */}
                <View style={styles.timeInput}>
                  <Pressable 
                    style={styles.timeButton}
                    onPress={() => {
                      const current = parseInt(selectedMinute);
                      if (current < 59) {
                        setSelectedMinute((current + 1).toString().padStart(2, '0'));
                      } else {
                        setSelectedMinute('00');
                      }
                    }}
                  >
                    <Text style={styles.timeButtonText}>▲</Text>
                  </Pressable>
                  
                  <TextInput
                    style={styles.timeInputText}
                    value={selectedMinute}
                    onChangeText={(text) => {
                      const num = parseInt(text);
                      if (!isNaN(num) && num >= 0 && num <= 59) {
                        setSelectedMinute(num.toString().padStart(2, '0'));
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  
                  <Pressable 
                    style={styles.timeButton}
                    onPress={() => {
                      const current = parseInt(selectedMinute);
                      if (current > 0) {
                        setSelectedMinute((current - 1).toString().padStart(2, '0'));
                      } else {
                        setSelectedMinute('59');
                      }
                    }}
                  >
                    <Text style={styles.timeButtonText}>▼</Text>
                  </Pressable>
                </View>
                
                {/* AM/PM toggle */}
                <Pressable 
                  style={[styles.amPmButton, isAM ? styles.amPmActive : null]}
                  onPress={() => setIsAM(true)}
                >
                  <Text style={[styles.amPmButtonText, isAM ? styles.amPmActiveText : null]}>AM</Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.amPmButton, !isAM ? styles.amPmActive : null]}
                  onPress={() => setIsAM(false)}
                >
                  <Text style={[styles.amPmButtonText, !isAM ? styles.amPmActiveText : null]}>PM</Text>
                </Pressable>
              </View>
              
              <Text style={styles.timePreview}>
                {formatTimeForDisplay()}
              </Text>
            </View>
            
            <View style={styles.modalButtonGroup}>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSetTime}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </Pressable>
              
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTimeModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 8,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  placeholder: {
    width: 50,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputMultiline: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  timeContainer: {
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  timeDisplay: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  timeButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#f8f8f8',
    borderColor: '#ff3b30',
  },
  clearButtonText: {
    color: '#ff3b30',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  buttonDisabled: {
    backgroundColor: '#7FB5F5',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
    gap: 8,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#4cd964', // Green
  },
  cancelButton: {
    backgroundColor: '#ff3b30', // Red
  },
  // Time picker styles
  timeInputContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timeInput: {
    alignItems: 'center',
    width: 60,
  },
  timeButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  timeButtonText: {
    fontSize: 18,
    color: '#333',
  },
  timeInputText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    width: 50,
  },
  timeColon: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 6,
  },
  amPmButton: {
    width: 50,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  amPmButtonText: {
    fontSize: 16,
    color: '#333',
  },
  amPmActive: {
    backgroundColor: '#007AFF',
  },
  amPmActiveText: {
    color: 'white',
  },
  timePreview: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
  },
});