import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function HabitCard({ habit, onPress, onDelete }) {  
  console.log("Rendering HabitCard for:", habit?.id, habit?.name);

  return (
    <View style={styles.card}>
      <Pressable 
        style={styles.habitContent}
        onPress={onPress}
      >
        <Text style={styles.habitTitle}>{habit.name}</Text>
        <Text style={styles.habitDesc}>{habit.description}</Text>
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${habit.completionRate}%` }
            ]} 
          />
        </View>
        <Text style={styles.streakText}>
          Current streak: {habit.streak} days
        </Text>
      </Pressable>

      <Pressable 
        style={({pressed}) => [
          styles.deleteButton,
          pressed && {opacity: 0.7}
        ]}
        onPress={() => {
          console.log("Delete button clicked for habit ID:", habit.id);
          if (onDelete) {
            onDelete(habit.id);
          } else {
            console.error("onDelete function is undefined!");
          }
        }}  
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  habitContent: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  habitDesc: {
    color: '#666',
    marginBottom: 12,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    overflow: 'hidden',
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
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  }
});