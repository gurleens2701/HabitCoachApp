import React, { useState } from 'react';
import { db, auth } from '../../firebase/config';
import { View, Text, StyleSheet, Pressable, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { useHabits } from '../../hooks/useHabits';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { habits, refreshHabits } = useHabits();
  const [isResetting, setIsResetting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const user = auth.currentUser;
  const userId = 'test-user-123'; // Must match storage.js; replace with auth.currentUser.uid later

  const handleResetAllData = async () => {
    if (isResetting) return;
    
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to delete all habits? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsResetting(true);
               
              // Updated to user-specific collection
              const habitsCollection = collection(db, `users/${userId}/habits`);
              const snapshot = await getDocs(habitsCollection);
              
              if (snapshot.empty) {
                console.log('No habits to delete');
                Alert.alert('Info', 'No habits to delete.');
                setIsResetting(false);
                return;
              }
              
              const batch = writeBatch(db);
              snapshot.docs.forEach((document) => {
                batch.delete(document.ref);
              });
              
              await batch.commit();
              console.log(`Successfully deleted ${snapshot.size} habits`);
              
              await refreshHabits(); // Refresh local state
              
              Alert.alert('Success', 'All habits have been deleted.');
            } 
            catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert('Error', 'Failed to reset data');
            }
            finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'default',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await signOut(auth);
              router.replace('/login');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout');
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.userSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <Pressable 
            style={[
              styles.logoutButton,
              isLoggingOut && styles.buttonDisabled
            ]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.buttonText}>Logging out...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Logout</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <Pressable 
            style={[
              styles.settingButton,
              isResetting && styles.settingButtonDisabled
            ]}
            onPress={handleResetAllData}
            disabled={isResetting}
          >
            {isResetting ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.settingButtonText}>Resetting...</Text>
              </View>
            ) : (
              <Text style={styles.settingButtonText}>Reset All Habits</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Habits:</Text>
            <Text style={styles.infoValue}>{habits.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  userSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#7FB5F5',
    opacity: 0.8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  settingsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  settingButton: {
    backgroundColor: '#ff3b30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingButtonDisabled: {
    backgroundColor: '#ffaaa7',
  },
  settingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});