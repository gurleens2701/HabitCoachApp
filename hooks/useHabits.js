import { useHabitContext } from '../context/HabitContext';

export function useHabits() {
  return useHabitContext();
}