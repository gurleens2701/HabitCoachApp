//(tabs)///stats.jsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useHabits } from '../../hooks/useHabits';

export default function StatsScreen() {
  const { habits } = useHabits();

  // Calculate overall stats
  const totalHabits = habits.length;
  const activeHabits = habits.filter(habit => habit.streak > 0).length;
  const averageStreak = totalHabits > 0 
    ? habits.reduce((sum, habit) => sum + (habit.streak || 0), 0) / totalHabits 
    : 0;
  const averageCompletion = totalHabits > 0
    ? habits.reduce((sum, habit) => sum + (habit.completionRate || 0), 0) / totalHabits
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Your Progress</Text>
        
        <ScrollView style={styles.content}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalHabits}</Text>
              <Text style={styles.statLabel}>Total Habits</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{activeHabits}</Text>
              <Text style={styles.statLabel}>Active Habits</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{averageStreak.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg. Streak</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{averageCompletion.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Avg. Completion</Text>
            </View>
          </View>
          
          <Text style={styles.sectionTitle}>Habit Details</Text>
          
          {habits.length > 0 ? (
            habits.map(habit => (
              <View key={habit.id} style={styles.habitCard}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <View style={styles.habitStats}>
                  <View style={styles.habitStat}>
                    <Text style={styles.habitStatValue}>{habit.streak || 0}</Text>
                    <Text style={styles.habitStatLabel}>Streak</Text>
                  </View>
                  <View style={styles.habitStat}>
                    <Text style={styles.habitStatValue}>{habit.completionRate || 0}%</Text>
                    <Text style={styles.habitStatLabel}>Complete</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Add habits to see your statistics here!
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  habitCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  habitStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  habitStat: {
    alignItems: 'center',
  },
  habitStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  habitStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});