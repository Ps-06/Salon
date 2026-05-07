import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState, useCallback } from 'react';
import { THEME } from '../constants/parlour';
import { AuthProvider, useAuth } from '../context/auth';
import AppLoadingScreen from '../components/AppLoadingScreen';

function RootLayoutNav() {
  const { userToken, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [bootAnimationComplete, setBootAnimationComplete] = useState(false);

  const handleBootAnimationComplete = useCallback(() => {
    setBootAnimationComplete(true);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // Check if the user is currently on the login screen
    const inAuthGroup = segments[0] === 'login';

    if (!userToken && !inAuthGroup) {
      // If not logged in and trying to access a protected screen, redirect to login
      router.replace('/login');
    } else if (userToken && inAuthGroup) {
      // If logged in and trying to access the login screen, redirect to dashboard
      router.replace('/');
    }
  }, [userToken, isLoading, segments]);

  if (isLoading || !bootAnimationComplete) {
    return <AppLoadingScreen onAnimationComplete={handleBootAnimationComplete} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Bhagyoday Parlour' }} 
      />
      <Stack.Screen 
        name="orders" 
        options={{ title: 'All Orders' }} 
      />
      <Stack.Screen 
        name="new-order" 
        options={{ title: 'New Order' }} 
      />
      <Stack.Screen 
        name="reports" 
        options={{ title: 'Business Reports' }} 
      />
      {/* Login Screen should not have the generic header */}
      <Stack.Screen 
        name="login" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Wrap the app in the AuthProvider */}
        <AuthProvider>
          <StatusBar
            hidden={true}
            translucent
            backgroundColor="transparent"
          />
          <RootLayoutNav />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
