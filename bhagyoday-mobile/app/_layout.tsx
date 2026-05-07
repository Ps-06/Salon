import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { THEME } from '../constants/parlour';
import { AuthProvider, useAuth } from '../context/auth';

function RootLayoutNav() {
  const { userToken, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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

  if (isLoading) return null; // Shows nothing while checking AsyncStorage

  return (
    <Stack
      screenOptions={{
        headerStyle: { 
          backgroundColor: THEME.colors.primary 
        },
        headerTintColor: THEME.colors.surface,
        headerTitleStyle: { 
          fontWeight: 'bold' 
        },
        headerTitleAlign: 'center',
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
        <StatusBar style="light" backgroundColor={THEME.colors.primaryDark} />
        {/* Wrap the app in the AuthProvider */}
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
