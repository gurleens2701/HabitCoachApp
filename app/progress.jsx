// app/progress.jsx
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator, 
  Platform, 
  Modal, 
  TouchableOpacity,
  TextInput,
  FlatList
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { HabitProvider } from '../context/HabitContext';
import { useHabitContext } from '../context/HabitContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ProgressScreenWrapper() {
  return (
    <HabitProvider>
      <ProgressScreen />
    </HabitProvider>
  );
}

function ProgressScreen() {
  const params = useLocalSearchParams();
  const habitId = params.id;
  
  const { habits, logHabitProgress, isLoading: contextLoading, error: contextError } = useHabitContext();
  const [habit, setHabit] = useState(null);
  const [isLogging, setIsLogging] = useState(false);
  
  // Date selection
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Our custom time input
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [isAM, setIsAM] = useState(true);
  
  // Completion options modal
  const [showCompletionOptionsModal, setShowCompletionOptionsModal] = useState(false);
  
  // Mood tracking
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState('');
  const [customMood, setCustomMood] = useState('');
  const [pendingHabitLog, setPendingHabitLog] = useState(null);
  
  // Predefined mood options
  const moodOptions = [
    'Happy', 'Energetic', 'Calm', 'Proud', 'Satisfied',
    'Neutral', 'Tired', 'Stressed', 'Disappointed', 'Other'
  ];
  
  // Track what we're logging
  const [pendingLog, setPendingLog] = useState(null); // { completed, date }

  useEffect(() => {
    if (habitId) {
      const currentHabit = habits.find(h => h.id === habitId);
      setHabit(currentHabit);
    }
  }, [habitId, habits]);

  // Initialize time with current time
  useEffect(() => {
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
  }, [showTimeModal]); // Reset time when modal opens

  // Format the time properly for storage
  const formatTimeForStorage = () => {
    let hours = parseInt(selectedHour, 10);
    
    // Convert from 12-hour to 24-hour format
    if (!isAM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${selectedMinute}`;
  };

  const resetAllStates = () => {
    setShowTimeModal(false);
    setShowDatePicker(false);
    setShowCompletionOptionsModal(false);
    setShowMoodModal(false);
    setPendingLog(null);
    setPendingHabitLog(null);
    setSelectedMood('');
    setCustomMood('');
  };

  // New function to save the habit log with mood data
  const saveMoodWithHabit = async () => {
    if (!pendingHabitLog || !habit?.id) return;
    
    setIsLogging(true);
    
    try {
      const { completed, date, time } = pendingHabitLog;
      const dateToUse = date || new Date();
      const formattedDate = dateToUse.toISOString().split('T')[0];
      
      const moodData = selectedMood === 'Other' && customMood.trim() 
        ? customMood.trim() 
        : selectedMood;
      
      console.log('Logging progress with mood:', { 
        habitId: habit.id, 
        completed, 
        date: formattedDate, 
        time,
        mood: moodData
      });
      
      // Pass the mood data to logHabitProgress
      await logHabitProgress(habit.id, completed, formattedDate, time, moodData);
      console.log('Progress with mood logged successfully');
    } catch (error) {
      console.error('Error logging mood with progress:', error.message);
      alert(`Failed to log mood: ${error.message}`);
    } finally {
      setIsLogging(false);
      resetAllStates();
    }
  };

  const handleLogProgress = async (completed, logDate = null) => {
    if (!habit?.id || isLogging) return;
    
    // If it's a completion (not a missed habit), show mood tracker
    if (completed) {
      setPendingHabitLog({
        completed,
        date: logDate,
        time: formatTimeForStorage()
      });
      setShowMoodModal(true);
      setShowTimeModal(false);
      return;
    }
    
    // For missed habits, just log as before (no mood tracking)
    setIsLogging(true);
    
    try {
      const dateToUse = logDate || new Date();
      const formattedDate = dateToUse.toISOString().split('T')[0];
      const timeString = formatTimeForStorage();
      
      console.log('Logging progress:', { habitId: habit.id, completed, date: formattedDate, time: timeString });
      
      await logHabitProgress(habit.id, completed, formattedDate, timeString);
      console.log('Progress logged successfully');
    } catch (error) {
      console.error('Error logging progress:', error.message);
      alert(`Failed to log progress: ${error.message}`);
    } finally {
      setIsLogging(false);
      resetAllStates();
    }
  };

  // Handler for native DateTimePicker
  const handleDateChange = (event, date) => {
    setShowNativeDatePicker(false);
    
    if (date) {
      setSelectedDate(date);
      // After selecting with native picker, show the completion options
      setPendingLog({ 
        date: date,
        completed: null // Will be set later
      });
      setShowCompletionOptionsModal(true);
    }
  };

  // Custom handlers
  const handleTodayLog = (completed) => {
    setPendingLog({
      date: null, // null means today
      completed
    });
    setShowTimeModal(true);
  };

  const selectCompletion = (completed) => {
    if (pendingLog) {
      setPendingLog({
        ...pendingLog,
        completed
      });
      
      setShowCompletionOptionsModal(false);
      setShowTimeModal(true);
    }
  };

  // Format helpers
  const formatTime = (hour, minute, am) => {
    return `${hour}:${minute} ${am ? 'AM' : 'PM'}`;
  };
  
  const getTodayStatus = () => {
    if (!habit?.logs) return null;
    const today = new Date().toISOString().split('T')[0];
    return habit.logs.find(log => log.date === today);
  };

  // Loading states handling
  if (contextLoading) {
    return <SafeAreaView style={styles.safeArea}><Text>Loading habits...</Text></SafeAreaView>;
  }

  if (contextError) {
    return <SafeAreaView style={styles.safeArea}><Text>Error: {contextError}</Text></SafeAreaView>;
  }

  if (!habit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
        </View>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {!habits || habits.length === 0 ? 'No habits available' : 'Loading habit...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const todayLog = getTodayStatus();
  const daysElapsed = habit ? Math.floor((new Date() - new Date(habit.startDate)) / (1000 * 60 * 60 * 24)) : 0;
  const completedDays = habit?.completedDays || 0;
  const completionsRemaining = habit ? Math.max(0, habit.targetCompletions - completedDays) : 0;
  const progressPercentage = habit ? Math.min(100, (completedDays / habit.targetCompletions) * 100) : 0;
  const timeframeDaysRemaining = habit?.timeframe ? Math.max(0, habit.timeframe - daysElapsed) : null;

  // Format date for display
  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{habit.name}</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={styles.habitHeader}>
            <Text style={styles.description}>{habit.description}</Text>
            {habit.targetTime ? (
              <Text style={styles.targetTimeText}>Target Time: {habit.targetTime}</Text>
            ) : (
              <Text style={styles.targetTimeText}>No Target Time Set</Text>
            )}
          </View>

          <View style={styles.statsContainer}>
            {habit.trackStreak && (
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{habit.streak || 0}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            )}
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{completedDays}/{habit.targetCompletions}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>Progress</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {completedDays >= habit.targetCompletions 
                ? "Goal Met!" 
                : `${completionsRemaining} completions to go`}
              {habit.timeframe && `, ${timeframeDaysRemaining} days left`}
            </Text>
            <Text style={styles.progressSubText}>
              {daysElapsed} days since start
            </Text>
          </View>

          <View style={styles.logContainer}>
            <Text style={styles.logTitle}>Today's Progress</Text>
            {todayLog ? (
              <Text style={styles.logStatusText}>
                {todayLog.completed ? 'Completed' : 'Missed'} at {todayLog.time}
                {todayLog.mood ? ` - Felt: ${todayLog.mood}` : ''}
              </Text>
            ) : (
              <Text style={styles.logStatusText}>Not logged yet</Text>
            )}
            <View style={styles.buttonGroup}>
              <Pressable
                style={[
                  styles.logButton,
                  todayLog?.completed === true && styles.logButtonActive,
                  isLogging && styles.logButtonDisabled
                ]}
                onPress={() => handleTodayLog(true)}
                disabled={isLogging}
              >
                <Text style={[
                  styles.logButtonText,
                  todayLog?.completed === true && styles.logButtonTextActive
                ]}>✓ Complete</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.logButton,
                  todayLog?.completed === false && styles.logButtonActive,
                  isLogging && styles.logButtonDisabled
                ]}
                onPress={() => handleTodayLog(false)}
                disabled={isLogging}
              >
                <Text style={[
                  styles.logButtonText,
                  todayLog?.completed === false && styles.logButtonTextActive
                ]}>✗ Missed</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.datePickerButton}
              onPress={() => {
                setSelectedDate(new Date());
                if (Platform.OS === 'ios') {
                  setShowDatePicker(true);
                } else {
                  setShowNativeDatePicker(true);
                }
              }}
              disabled={isLogging}
            >
              <Text style={styles.datePickerButtonText}>Log Another Day</Text>
            </Pressable>

            <View style={styles.logHistoryContainer}>
              <Text style={styles.logHistoryTitle}>Log History</Text>
              {habit.logs && habit.logs.length > 0 ? (
                habit.logs.slice().reverse().map((log, index) => (
                  <Text key={index} style={styles.logHistoryItem}>
                    {log.date}: {log.completed ? 'Completed' : 'Missed'} at {log.time || 'No time'}
                    {log.mood ? ` - Felt: ${log.mood}` : ''}
                  </Text>
                ))
              ) : (
                <Text style={styles.logHistoryItem}>No logs yet</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Android native date picker - only shown when needed */}
      {showNativeDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(habit.startDate)}
        />
      )}

      {/* Modal date picker for iOS */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date to Log</Text>
            
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={(_, date) => date && setSelectedDate(date)}
              maximumDate={new Date()}
              minimumDate={new Date(habit.startDate)}
              style={styles.datePickerIOS}
            />
            
            <View style={styles.modalButtonGroup}>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  setShowDatePicker(false);
                  setPendingLog({ date: selectedDate, completed: null });
                  setShowCompletionOptionsModal(true);
                }}
              >
                <Text style={styles.modalButtonText}>Confirm Date</Text>
              </Pressable>
              
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Completion Options Modal */}
      <Modal
        visible={showCompletionOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompletionOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log for {formatDate(selectedDate)}</Text>
            
            <View style={styles.modalButtonGroup}>
              <Pressable
                style={[styles.modalButton, styles.completeButton]}
                onPress={() => selectCompletion(true)}
              >
                <Text style={styles.modalButtonText}>Completed</Text>
              </Pressable>
              
              <Pressable
                style={[styles.modalButton, styles.missedButton]}
                onPress={() => selectCompletion(false)}
              >
                <Text style={styles.modalButtonText}>Missed</Text>
              </Pressable>
            </View>
            
            <Pressable
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowCompletionOptionsModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Custom Time Input Modal */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {pendingLog?.completed !== null 
                ? (pendingLog?.completed ? 'Completed at what time?' : 'Missed at what time?')
                : 'Select time'}
            </Text>
            
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
                {formatTime(selectedHour, selectedMinute, isAM)}
              </Text>
            </View>
            
            <View style={styles.modalButtonGroup}>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  if (pendingLog) {
                    handleLogProgress(pendingLog.completed, pendingLog.date);
                  }
                }}
                disabled={isLogging}
              >
                {isLogging ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Confirm</Text>
                )}
              </Pressable>
              
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTimeModal(false)}
                disabled={isLogging}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Mood Tracking Modal */}
      <Modal
        visible={showMoodModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMoodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How do you feel after completing this habit?</Text>
            
            <FlatList
              data={moodOptions}
              numColumns={2}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.moodGrid}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.moodButton,
                    selectedMood === item && styles.moodButtonSelected
                  ]}
                  onPress={() => setSelectedMood(item)}
                >
                  <Text 
                    style={[
                      styles.moodButtonText,
                      selectedMood === item && styles.moodButtonTextSelected
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
            />
            
            {selectedMood === 'Other' && (
              <TextInput
                style={styles.moodInput}
                placeholder="Describe how you feel..."
                value={customMood}
                onChangeText={setCustomMood}
                multiline
                numberOfLines={2}
              />
            )}
            
            <View style={styles.modalButtonGroup}>
              <Pressable
                style={[
                  styles.modalButton, 
                  styles.confirmButton,
                  (!selectedMood || (selectedMood === 'Other' && !customMood.trim())) && styles.buttonDisabled
                ]}
                onPress={saveMoodWithHabit}
                disabled={!selectedMood || (selectedMood === 'Other' && !customMood.trim()) || isLogging}
              >
                {isLogging ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Save</Text>
                )}
              </Pressable>
              
              <Pressable
                style={[styles.modalButton, styles.skipButton]}
                onPress={() => {
                  // Skip mood tracking and just log the habit
                  if (pendingHabitLog) {
                    const { completed, date, time } = pendingHabitLog;
                    handleLogProgress(completed, date);
                  }
                  setShowMoodModal(false);
                }}
                disabled={isLogging}
              >
                <Text style={styles.modalButtonText}>Skip</Text>
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
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  habitHeader: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  targetTimeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  progressSubText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  logContainer: {
    marginTop: 24,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  logStatusText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  logButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logButtonActive: {
    backgroundColor: '#007AFF',
  },
  logButtonDisabled: {
    opacity: 0.5,
  },
  logButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logButtonTextActive: {
    color: '#fff',
  },
  datePickerButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  datePickerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logHistoryContainer: {
    marginTop: 24,
  },
  logHistoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  logHistoryItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
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
  completeButton: {
    backgroundColor: '#34c759', // Green
  },
  missedButton: {
    backgroundColor: '#ff9500', // Orange
  },
  skipButton: {
    backgroundColor: '#8e8e93', // Gray
  },
  cancelButton: {
    backgroundColor: '#ff3b30', // Red
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
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
  datePickerIOS: {
    width: 300,
    height: 200,
  },
  androidDateButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  androidDateButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '500',
  },
  
  // Mood styles
  moodGrid: {
    width: '100%',
  },
  moodButton: {
    flex: 1,
    margin: 4,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    minWidth: '45%',
  },
  moodButtonSelected: {
    backgroundColor: '#007AFF',
  },
  moodButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  moodButtonTextSelected: {
    color: 'white',
  },
  moodInput: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
    fontSize: 16,
  },
});