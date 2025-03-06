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
      unsubscribe = storage.subscribeToHabits((updatedHabits) => {
        const uniqueHabits = Array.from(
          new Map(updatedHabits.map(habit => [habit.id, habit])).values()
        );
        console.log(`Received ${updatedHabits.length} habits, deduplicated to ${uniqueHabits.length}`);
        setHabits(uniqueHabits);
        setIsLoading(false);
        setError(null);
      });
    } catch (err) {
      console.error('Error subscribing to habits:', err);
      setError(err.message);
      setIsLoading(false);
    }

    return () => unsubscribe && unsubscribe();
  }, []);

  const loadHabits = async () => {
    setIsLoading(true);
    try {
      const loadedHabits = await storage.getHabits();
      const uniqueHabits = Array.from(
        new Map(loadedHabits.map(habit => [habit.id, habit])).values()
      );
      setHabits(uniqueHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addHabit = async (habitData) => {
    try {
      const newHabit = await storage.saveHabit(habitData);
      if (newHabit) {
        setHabits((prev) => [...prev, newHabit]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding habit:', error);
      return false;
    }
  };

  const logHabitProgress = async (habitId, completed, date) => {
    if (processingHabitIds.has(habitId)) {
      console.log(`Already processing habit ${habitId}, skipping`);
      return false;
    }
    
    try {
      setProcessingHabitIds(prev => new Set(prev).add(habitId));
      
      const updatedHabit = await storage.updateHabitLog(habitId, completed, date);
      if (updatedHabit) {
        setHabits((prev) =>
          prev.map((habit) => (habit.id === habitId ? updatedHabit : habit))
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error logging progress:', error);
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
    console.log('Delete in context called for:', habitId);
    
    if (processingHabitIds.has(habitId)) {
      console.log(`Already processing habit ${habitId}, skipping`);
      return false;
    }
    
    try {
      setProcessingHabitIds(prev => new Set(prev).add(habitId));
      
      const success = await storage.deleteHabit(habitId);
      console.log('Storage delete result:', success);
      
      if (success) {
        setHabits(currentHabits => {
          const newHabits = currentHabits.filter(habit => habit.id !== habitId);
          console.log("Updated habit list after delete:", newHabits);
          return newHabits;
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error in context deleteHabit:', error);
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
        addHabit,
        deleteHabit,
        logHabitProgress,
        refreshHabits: loadHabits
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export const useHabitContext = () => useContext(HabitContext);