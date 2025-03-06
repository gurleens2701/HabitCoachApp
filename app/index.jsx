//app/index.jsx
import { useEffect } from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // For simplicity, always redirect to login
  return <Redirect href="/login" />;
}