import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME } from '../constants/parlour';
import FormField from '../components/FormField';
import { authApi } from '../services/api';
import { useAuth } from '../context/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSendOtp = async () => {
    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid Email Address.');
      return;
    }
    setLoading(true);
    try {
      await authApi.sendOtp(email);
      setStep('otp');
      // Using 123456 explicitly as it's the mock code in our backend
      Alert.alert('OTP Sent', 'For testing purposes, the OTP is 123456');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const data = await authApi.verifyOtp(email, otp);
      await signIn(data.token, data.user);
    } catch (err: any) {
      Alert.alert('Invalid OTP', 'The code you entered is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Note: To make this real, you need @react-native-google-signin/google-signin
    // This is currently a mocked bypass as requested.
    setLoading(true);
    try {
      const data = await authApi.googleLogin('mock_google_token', 'test@google.com', 'Google User');
      await signIn(data.token, data.user);
    } catch (err: any) {
      Alert.alert('Error', 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[THEME.colors.primary, THEME.colors.primaryDark]} style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="sparkles" size={48} color={THEME.colors.surface} />
        </View>
        <Text style={styles.title}>Bhagyoday Parlour</Text>
        <Text style={styles.subtitle}>Welcome Back</Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        {step === 'email' ? (
          <>
            <FormField
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter Your Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleSendOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Send Login Code</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.instructions}>Enter the 6-digit code sent to {email}</Text>
            <FormField
              label="OTP Code"
              value={otp}
              onChangeText={setOtp}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Verify & Login</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('email')} disabled={loading}>
              <Text style={styles.secondaryButtonText}>Back to Email</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={loading}>
          <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 8 }} />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  header: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  iconContainer: {
    width: 80, height: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: THEME.colors.surface },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  formContainer: { flex: 1, padding: 24, marginTop: -20 },
  instructions: { fontSize: 14, color: THEME.colors.textSecondary, marginBottom: 16, textAlign: 'center' },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
    padding: 16, borderRadius: THEME.borderRadius.md,
    alignItems: 'center', marginTop: 16,
  },
  primaryButtonText: { color: THEME.colors.surface, fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { padding: 16, alignItems: 'center', marginTop: 8 },
  secondaryButtonText: { color: THEME.colors.textSecondary, fontSize: 14 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 32 },
  divider: { flex: 1, height: 1, backgroundColor: THEME.colors.border },
  dividerText: { marginHorizontal: 16, color: THEME.colors.textSecondary, fontWeight: '500' },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: THEME.colors.surface, padding: 16,
    borderRadius: THEME.borderRadius.md, borderWidth: 1, borderColor: THEME.colors.border,
  },
  googleButtonText: { color: THEME.colors.text, fontSize: 16, fontWeight: '600' }
});
