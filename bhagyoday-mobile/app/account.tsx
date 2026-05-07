import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME } from '../constants/parlour';
import { useAuth } from '../context/auth';

export default function Account() {
  const { signOut } = useAuth();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('userData').then(data => {
      if (data) setUserData(JSON.parse(data));
    });
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userData?.name ? userData.name.charAt(0).toUpperCase() : userData?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{userData?.name || 'Administrator'}</Text>
        <Text style={styles.email}>{userData?.email || 'admin@bhagyoday.com'}</Text>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="business-outline" size={24} color={THEME.colors.textSecondary} />
          <Text style={styles.menuItemText}>Parlour Details</Text>
          <Ionicons name="chevron-forward" size={20} color={THEME.colors.border} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color={THEME.colors.textSecondary} />
          <Text style={styles.menuItemText}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color={THEME.colors.border} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Ionicons name="log-out-outline" size={24} color={THEME.colors.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  profileSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', color: THEME.colors.text },
  email: { fontSize: 14, color: THEME.colors.textSecondary, marginTop: 4 },
  menuSection: { padding: 16, marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: THEME.colors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: 16,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 12,
  },
  menuItemText: { flex: 1, fontSize: 16, color: THEME.colors.text, marginLeft: 16 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEbee',
    margin: 16,
    padding: 16,
    borderRadius: THEME.borderRadius.md,
    marginTop: 32,
  },
  logoutText: { color: THEME.colors.error, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
