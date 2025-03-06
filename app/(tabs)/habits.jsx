//(tabs)//habits.jsx
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useHabits } from '../../hooks/useHabits';
import { useState, useMemo } from 'react';

export default function HabitsScreen() {
  const { habits, isLoading, deleteHabit } = useHabits();
  const [deletingHabitIds, setDeletingHabitIds] = useState(new Set());

  // Use useMemo to ensure consistent habit IDs for rendering
  const uniqueHabits = useMemo(() => {
    // Ensure we have unique habits by ID
    const habitMap = new Map();
    habits.forEach(habit => {
      if (!habitMap.has(habit.id)) {
        habitMap.set(habit.id, habit);
      }
    });
    return Array.from(habitMap.values());
  }, [habits]);

  const handleDelete = async (habitId) => {
    // Prevent duplicate delete operations
    if (deletingHabitIds.has(habitId)) {
      console.log('Delete already in progress for habit:', habitId);
      return;
    }
    
    console.log('Delete button clicked for habit:', habitId);
    if (!deleteHabit) {
      console.log('deleteHabit function is missing!');
      return;
    }

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
  
    Alert.alert(
      "Delete Habit",
      `Are you sure you want to delete "${habit.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => console.log('Delete cancelled')
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log('Delete confirmed by user');
            try {
              // Mark this habit as being deleted
              setDeletingHabitIds(prev => new Set(prev).add(habitId));
              
              console.log('Calling deleteHabit with ID:', habitId);
              const success = await deleteHabit(habitId);
              console.log('Delete operation result:', success);
              
              if (!success) {
                console.log('Delete operation failed');
                Alert.alert("Error", "Failed to delete habit");
              }
            } catch (error) {
              console.error('Error during deletion:', error);
              Alert.alert("Error", "Failed to delete habit");
            } finally {
              // Remove from deleting set when done
              setDeletingHabitIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(habitId);
                return newSet;
              });
            }
          }
        }
      ]
    );
  };

  const navigateToHabitDetail = (habitId) => {
    // Navigate to the progress screen (outside tabs) with the habit ID
    router.push({
      pathname: '/progress',
      params: { id: habitId }
    });
  };

  const navigateToCreateHabit = () => {
    // Navigate to the create habit screen as a modal
    router.push('/create');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <Text>Loading habits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Habits</Text>
          <Pressable 
            style={styles.addButton}
            onPress={navigateToCreateHabit}
          >
            <Text style={styles.addButtonText}>+ Add Habit</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.list}>
          {uniqueHabits.map(habit => (
            <View key={`habit-${habit.id}`} style={styles.card}>
              <Pressable 
                style={styles.habitContent}
                onPress={() => navigateToHabitDetail(habit.id)}
                disabled={deletingHabitIds.has(habit.id)}
              >
                <Text style={styles.habitTitle}>{habit.name}</Text>
                <Text style={styles.habitDesc}>{habit.description}</Text>
                <View style={styles.progressContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${habit.completionRate || 0}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.streakText}>
                  Current streak: {habit.streak || 0} days
                </Text>
              </Pressable>
              
              <Pressable 
                style={({pressed}) => [
                  styles.deleteButton,
                  pressed && {opacity: 0.7},
                  deletingHabitIds.has(habit.id) && styles.deleteButtonDisabled
                ]}
                onPress={() => handleDelete(habit.id)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                disabled={deletingHabitIds.has(habit.id)}
              >
                <Text style={styles.deleteButtonText}>×</Text>
              </Pressable>
            </View>
          ))}

          {uniqueHabits.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No habits yet. Start by adding one!
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  habitContent: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  habitDesc: {
    color: '#666',
    marginBottom: 12,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  streakText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    zIndex: 10,
    elevation: 3,
  },
  deleteButtonDisabled: {
    backgroundColor: '#ffaaa7',
    opacity: 0.5,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});