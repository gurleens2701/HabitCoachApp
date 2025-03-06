//habit/habitlist.jsx
import React, { useState, useEffect } from 'react';
import { View, FlatList } from 'react-native';
import HabitCard from './HabitCard';
import { storage } from '../utils/storage';

export default function HabitList() {
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    async function fetchHabits() {
      const storedHabits = await storage.getHabits();
      setHabits(storedHabits);
    }
    fetchHabits();
  }, []);

  const handleDeleteHabit = async (habitId) => {
    await storage.deleteHabit(habitId);
    setHabits((prevHabits) => prevHabits.filter(habit => habit.id !== habitId));
  };

  return (
    <View>
      <FlatList
        data={habits}
        keyExtractor={(habit) => habit.id}
        renderItem={({ item }) => (
          <HabitCard 
            habit={item} 
            onPress={() => console.log('Habit Clicked:', item.name)}
            onDelete={handleDeleteHabit}
          />
        )}
      />
    </View>
  );
}