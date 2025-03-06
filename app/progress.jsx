import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, ActivityIndicator, Platform } from 'react-native';
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
  
  const { habits, logHabitProgress } = useHabitContext();
  const [habit, setHabit] = useState(null);
  const [isLogging, setIsLogging] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (habitId) {
      const currentHabit = habits.find(h => h.id === habitId);
      setHabit(currentHabit);
    }
  }, [habitId, habits]);

  const handleLogProgress = async (completed, selectedDate) => {
    if (!habit?.id) return;
    
    setIsLogging(true);
    try {
      const logDate = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      await logHabitProgress(habit.id, completed, logDate);
    } catch (error) {
      console.error('Error logging progress:', error);
      alert('Failed to log progress');
    } finally {
      setIsLogging(false);
    }
  };

  const getTodayStatus = () => {
    if (!habit?.logs) return null;
    const today = new Date().toISOString().split('T')[0];
    return habit.logs.find(log => log.date === today)?.completed;
  };

  if (!habit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
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

  const todayStatus = getTodayStatus();
  const daysElapsed = habit ? Math.floor((new Date() - new Date(habit.startDate)) / (1000 * 60 * 60 * 24)) : 0;
  const completedDays = habit?.completedDays || 0;
  const completionsRemaining = habit ? Math.max(0, habit.targetCompletions - completedDays) : 0;
  const progressPercentage = habit ? Math.min(100, (completedDays / habit.targetCompletions) * 100) : 0;
  const timeframeDaysRemaining = habit?.timeframe ? Math.max(0, habit.timeframe - daysElapsed) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{habit.name}</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={styles.habitHeader}>
            <Text style={styles.description}>{habit.description}</Text>
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
            <Text style={styles.logTitle}>Today’s Progress</Text>
            <View style={styles.buttonGroup}>
              <Pressable
                style={[
                  styles.logButton,
                  todayStatus === true && styles.logButtonActive,
                  isLogging && styles.logButtonDisabled
                ]}
                onPress={() => handleLogProgress(true)}
                disabled={isLogging}
              >
                <Text style={[
                  styles.logButtonText,
                  todayStatus === true && styles.logButtonTextActive
                ]}>✓ Complete</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.logButton,
                  todayStatus === false && styles.logButtonActive,
                  isLogging && styles.logButtonDisabled
                ]}
                onPress={() => handleLogProgress(false)}
                disabled={isLogging} // Fixed: was isLoading
              >
                <Text style={[
                  styles.logButtonText,
                  todayStatus === false && styles.logButtonTextActive
                ]}>✗ Missed</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.datePickerButton}
              onPress={() => setShowPicker(true)}
              disabled={isLogging}
            >
              <Text style={styles.datePickerButtonText}>Log Another Day</Text>
            </Pressable>
            {showPicker && (
              <DateTimePicker
                value={date}
                mode="date"
                maximumDate={new Date()}
                minimumDate={new Date(habit.startDate)}
                onChange={(event, selectedDate) => {
                  setShowPicker(Platform.OS === 'ios');
                  const newDate = selectedDate || date;
                  setDate(newDate);
                  if (Platform.OS !== 'ios') {
                    handleLogProgress(true, newDate);
                  }
                }}
              />
            )}
            {showPicker && Platform.OS === 'ios' && (
              <View style={styles.buttonGroup}>
                <Pressable
                  style={styles.logButton}
                  onPress={() => {
                    handleLogProgress(true, date);
                    setShowPicker(false);
                  }}
                  disabled={isLogging}
                >
                  <Text style={styles.logButtonText}>✓ Complete</Text>
                </Pressable>
                <Pressable
                  style={styles.logButton}
                  onPress={() => {
                    handleLogProgress(false, date);
                    setShowPicker(false);
                  }}
                  disabled={isLogging}
                >
                  <Text style={styles.logButtonText}>✗ Missed</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
});
