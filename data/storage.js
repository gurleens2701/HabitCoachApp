import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
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
        completedDays: 0,
        logs: [],
        streak: 0,
        completionRate: 0,
      };
      
      const docRef = await addDoc(collection(db, HABITS_COLLECTION), newHabit);
      return {
        id: docRef.id,
        ...newHabit
      };
    } catch (error) {
      console.error('Error saving habit:', error);
      return null;
    }
  },

  async updateHabitLog(habitId, isCompleted, date) {
    try {
      const habitRef = doc(db, HABITS_COLLECTION, habitId);
      const logDate = date || new Date().toISOString().split('T')[0];
      
      const habits = await this.getHabits();
      const habit = habits.find(h => h.id === habitId);
      
      if (!habit) return null;

      if (logDate > new Date().toISOString().split('T')[0] || logDate < habit.startDate) {
        console.error('Invalid date for logging:', logDate);
        return null;
      }
      
      const logs = [...(habit.logs || [])];
      const logIndex = logs.findIndex(log => log.date === logDate);
      
      if (logIndex >= 0) {
        logs[logIndex] = { date: logDate, completed: isCompleted };
      } else {
        logs.push({ date: logDate, completed: isCompleted });
      }

      const updatedHabit = {
        ...habit,
        logs,
        streak: habit.trackStreak ? this.calculateStreak(logs) : 0,
        completionRate: this.calculateCompletionRate(logs),
        completedDays: this.calculateCompletedDays(logs),
      };

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