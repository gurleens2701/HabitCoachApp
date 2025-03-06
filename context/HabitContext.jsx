// context/HabitContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../data/storage';

const HabitContext = createContext();

export function HabitProvider({ children }) {
  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingHabitIds, setProcessingHabitIds] = useState(new Set());

  useEffect(() => {
    let unsubscribe;
    try {
      console.log('Subscribing to habits...');
      unsubscribe = storage.subscribeToHabits((updatedHabits) => {
        const uniqueHabits = Array.from(
          new Map(updatedHabits.map(habit => [habit.id, habit])).values()
        );
        console.log(`Received ${updatedHabits.length} habits, deduplicated to ${uniqueHabits.length}`);
        setHabits(uniqueHabits);
        setIsLoading(false);
        setError(null);
      }, (err) => {
        console.error('Subscription error:', err);
        setError(err.message);
        setIsLoading(false);
      });
    } catch (err) {
      console.error('Error subscribing to habits:', err);
      setError(err.message);
      setIsLoading(false);
    }
    return () => {
      console.log('Unsubscribing from habits...');
      unsubscribe && unsubscribe();
    };
  }, []);

  const loadHabits = async () => {
    setIsLoading(true);
    try {
      console.log('Loading habits manually...');
      const loadedHabits = await storage.getHabits();
      const uniqueHabits = Array.from(
        new Map(loadedHabits.map(habit => [habit.id, habit])).values()
      );
      console.log('Loaded habits:', uniqueHabits.length);
      setHabits(uniqueHabits);
      setError(null);
    } catch (error) {
      console.error('Error loading habits:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addHabit = async (habitData) => {
    try {
      console.log('Adding habit:', habitData);
      const newHabit = await storage.saveHabit(habitData);
      if (newHabit) {
        setHabits((prev) => [...prev, newHabit]);
        console.log('Habit added:', newHabit.id);
        return true;
      }
      console.log('Failed to add habit: no newHabit returned');
      return false;
    } catch (error) {
      console.error('Error adding habit:', error);
      setError(error.message);
      return false;
    }
  };

  const editHabit = async (habitId, habitData) => {
    if (processingHabitIds.has(habitId)) {
      console.log(`Already processing habit ${habitId}, skipping edit`);
      return false;
    }

    try {
      console.log('Editing habit:', habitId, habitData);
      setProcessingHabitIds(prev => new Set(prev).add(habitId));
      const updatedHabit = await storage.updateHabit(habitId, habitData);
      if (updatedHabit) {
        setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
        console.log('Habit edited successfully:', updatedHabit.id);
        return true;
      }
      console.log('Failed to edit habit: no updatedHabit returned');
      return false;
    } catch (error) {
      console.error('Error editing habit:', error);
      setError(error.message);
      return false;
    } finally {
      setProcessingHabitIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(habitId);
        return newSet;
      });
    }
  };

  const logHabitProgress = async (habitId, completed, date, logTime, mood = null) => {
    if (processingHabitIds.has(habitId)) {
      console.log(`Already processing habit ${habitId}, skipping`);
      return false;
    }
    
    try {
      setProcessingHabitIds(prev => new Set(prev).add(habitId));
      
      const updatedHabit = await storage.updateHabitLog(habitId, completed, date, logTime, mood);
      if (updatedHabit) {
        setHabits((prev) =>
          prev.map((habit) => (habit.id === habitId ? updatedHabit : habit))
        );
        setError(null); // Clear error on success
        return true;
      }
      return false;
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setProcessingHabitIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(habitId);
        return newSet;
      });
    }
  };

  const deleteHabit = async (habitId) => {
    if (processingHabitIds.has(habitId)) {
      console.log(`Already processing habit ${habitId}, skipping delete`);
      return false;
    }

    try {
      console.log('Attempting to delete habit:', habitId);
      setProcessingHabitIds(prev => new Set(prev).add(habitId));
      const success = await storage.deleteHabit(habitId);
      console.log('Storage delete result:', success);
      if (success) {
        setHabits(currentHabits => {
          const newHabits = currentHabits.filter(habit => habit.id !== habitId);
          console.log('Updated habit list after delete:', newHabits.length);
          return newHabits;
        });
        return true;
      }
      console.log('Failed to delete habit: storage returned false');
      return false;
    } catch (error) {
      console.error('Error deleting habit in context:', error);
      setError(error.message);
      return false;
    } finally {
      setProcessingHabitIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(habitId);
        return newSet;
      });
    }
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        isLoading,
        error, // Expose error state for debugging
        addHabit,
        editHabit,
        deleteHabit,
        logHabitProgress,
        refreshHabits: loadHabits
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export const useHabitContext = () => {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabitContext must be used within a HabitProvider');
  }
  return context;
};