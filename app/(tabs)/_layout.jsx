//(tabs)/_layout.jsx
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { HabitProvider } from '../../context/HabitContext';

export default function TabsLayout() {
  return (
    <HabitProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 0,
            elevation: 0,
            // Safe area insets for iOS
            height: Platform.OS === 'ios' ? 88 : 60,
            paddingBottom: Platform.OS === 'ios' ? 28 : 0,
          },
          // Add padding for status bar in iOS
          tabBarItemStyle: {
            paddingTop: 4,
          }
        }}
      >
        <Tabs.Screen
          name="habits"
          options={{
            title: 'Habits',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="check-circle" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="bar-chart" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="settings" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </HabitProvider>
  );
}