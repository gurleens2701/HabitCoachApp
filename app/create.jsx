import { View, TextInput, Pressable, Text, StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { HabitProvider } from '../context/HabitContext';
import { useHabitContext } from '../context/HabitContext';

export default function CreateHabitScreenWrapper() {
  return (
    <HabitProvider>
      <CreateHabitScreen />
    </HabitProvider>
  );
}

function CreateHabitScreen() {
  const { addHabit } = useHabitContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [habitData, setHabitData] = useState({
    name: '',
    description: '',
    targetCompletions: '21',
    timeframe: '',
    trackStreak: false,
  });

  useFocusEffect(
    useCallback(() => {
      console.log('Create habit screen focused - resetting form');
      setHabitData({
        name: '',
        description: '',
        targetCompletions: '21',
        timeframe: '',
        trackStreak: false,
      });
      setIsSubmitting(false);
      
      return () => {};
    }, [])
  );

  const handleCreate = async () => {
    if (isSubmitting) return;
    
    if (!habitData.name.trim()) {
      alert('Please enter a habit name');
      return;
    }
  
    try {
      setIsSubmitting(true);
      console.log('Starting habit creation:', habitData);
      const success = await addHabit(habitData);
      console.log('Habit creation result:', success);
      
      if (success) {
        console.log('Successfully created habit');
        router.back();
      } else {
        alert('Failed to create habit');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error creating habit:', error);
      alert('Error creating habit');
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Create Habit</Text>
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
            autoFocus={true}
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
          
          <Pressable 
            style={[
              styles.button,
              isSubmitting && styles.buttonDisabled
            ]}
            onPress={handleCreate}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.buttonText}>Creating...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Create Habit</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
});