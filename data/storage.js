// data/storage.js
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  getDoc, // Added for direct fetch
  enableIndexedDbPersistence
} from 'firebase/firestore';

const userId = 'test-user-123'; // Temporary user ID
const HABITS_COLLECTION = `users/${userId}/habits`;

enableIndexedDbPersistence(db).catch((err) => {
  console.error('Error enabling persistence:', err);
});

export const storage = {
  subscribeToHabits(onUpdate) {
    const habitsRef = collection(db, HABITS_COLLECTION);
    return onSnapshot(habitsRef, (snapshot) => {
      const habits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(habits);
    }, (error) => {
      console.error('Subscription error:', error);
    });
  },

  async getHabits() {
    try {
      console.log('Fetching habits...');
      const habitsRef = collection(db, HABITS_COLLECTION);
      const snapshot = await getDocs(habitsRef);
      console.log('Habits fetched:', snapshot.size);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error reading habits:', error);
      return [];
    }
  },

  async saveHabit(habit) {
    try {
      const newHabit = {
        ...habit,
        createdAt: new Date().toISOString(),
        startDate: new Date().toISOString().split('T')[0],
        targetCompletions: parseInt(habit.targetCompletions) || 21,
        timeframe: habit.timeframe ? parseInt(habit.timeframe) : null,
        trackStreak: habit.trackStreak || false,
        targetTime: habit.targetTime || null,
        completedDays: 0,
        logs: [],
        streak: 0,
        completionRate: 0,
      };
      console.log('Saving habit:', newHabit);
      const docRef = await addDoc(collection(db, HABITS_COLLECTION), newHabit);
      console.log('Habit saved with ID:', docRef.id);
      return {
        id: docRef.id,
        ...newHabit
      };
    } catch (error) {
      console.error('Error saving habit:', error);
      return null;
    }
  },

  async updateHabit(habitId, habitData) {
    try {
      const habitRef = doc(db, HABITS_COLLECTION, habitId);
      const currentHabits = await this.getHabits();
      const currentHabit = currentHabits.find(h => h.id === habitId);
      if (!currentHabit) {
        console.error('Habit not found:', habitId);
        return null;
      }

      const updatedHabit = {
        ...currentHabit,
        name: habitData.name,
        description: habitData.description || '',
        targetCompletions: parseInt(habitData.targetCompletions) || 21,
        timeframe: habitData.timeframe ? parseInt(habitData.timeframe) : null,
        trackStreak: habitData.trackStreak || false,
        targetTime: habitData.targetTime || null,
        // Preserve existing fields not edited
        createdAt: currentHabit.createdAt,
        startDate: currentHabit.startDate,
        logs: currentHabit.logs,
        completedDays: currentHabit.completedDays,
        streak: currentHabit.streak,
        completionRate: currentHabit.completionRate,
      };

      console.log('Updating habit:', updatedHabit);
      await updateDoc(habitRef, updatedHabit);
      return updatedHabit;
    } catch (error) {
      console.error('Error updating habit:', error);
      return null;
    }
  },

  async updateHabitLog(habitId, isCompleted, date, completionTime = null, mood = null) {
    try {
      const habitRef = doc(db, HABITS_COLLECTION, habitId);
      const habitDoc = await getDoc(habitRef);
      if (!habitDoc.exists()) {
        console.error('Habit not found:', habitId);
        return null;
      }
      const habit = { id: habitDoc.id, ...habitDoc.data() };
  
      const logDate = date || new Date().toISOString().split('T')[0];
      const logTime = completionTime || new Date().toTimeString().split(' ')[0].slice(0, 5);
      
      if (logDate > new Date().toISOString().split('T')[0] || logDate < habit.startDate) {
        console.error('Invalid date for logging:', logDate);
        return null;
      }
      
      const logs = [...(habit.logs || [])];
      const logIndex = logs.findIndex(log => log.date === logDate);
      
      const logEntry = { 
        date: logDate, 
        completed: isCompleted, 
        time: logTime
      };
      
      // Add mood if provided
      if (mood) {
        logEntry.mood = mood;
      }
      
      if (logIndex >= 0) {
        logs[logIndex] = logEntry;
      } else {
        logs.push(logEntry);
      }
  
      const updatedHabit = {
        ...habit,
        logs,
        streak: habit.trackStreak ? this.calculateStreak(logs) : 0,
        completionRate: this.calculateCompletionRate(logs),
        completedDays: this.calculateCompletedDays(logs),
      };
  
      console.log('Updating habit log:', updatedHabit);
      await updateDoc(habitRef, updatedHabit);
      return updatedHabit;
    } catch (error) {
      console.error('Error updating habit log:', error);
      return null;
    }
  },

  async deleteHabit(habitId) {
    try {
      const habitRef = doc(db, HABITS_COLLECTION, habitId);
      await deleteDoc(habitRef);
      console.log('Habit deleted:', habitId);
      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      return false;
    }
  },

  calculateStreak(logs) {
    if (!logs?.length) return 0;
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date(today);

    for (const log of [...logs].reverse()) {
      if (log.date === checkDate.toISOString().split('T')[0] && log.completed) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  },

  calculateCompletionRate(logs) {
    if (!logs?.length) return 0;
    return Math.round((logs.filter(log => log.completed).length / logs.length) * 100);
  },

  calculateCompletedDays(logs) {
    if (!logs?.length) return 0;
    return logs.filter(log => log.completed).length;
  },

  calculateDaysElapsed(startDate) {
    const start = new Date(startDate);
    const today = new Date();
    return Math.floor((today - start) / (1000 * 60 * 60 * 24));
  }
};