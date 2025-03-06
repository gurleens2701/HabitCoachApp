//app/_layout.jsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="create" options={{ 
        presentation: 'modal',
        animation: 'slide_from_bottom'
      }} />
      <Stack.Screen name="progress" />
      <Stack.Screen name="index" />
    </Stack>
  );
}