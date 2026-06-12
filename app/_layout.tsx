import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  const { isLoading, isAuthenticated, loadSession } = useAuthStore();

  useEffect(() => {
    loadSession();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
        {!isAuthenticated ? (
          <Stack.Screen name="auth/index" options={{ title: 'Connexion' }} />
        ) : (
          <Stack.Screen name="(tabs)" />
        )}
        <Stack.Screen name="auth/register" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(modals)/missions" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(modals)/donate" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(modals)/rewards" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(modals)/profile" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(modals)/notifications" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(modals)/celebration" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(screens)" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
