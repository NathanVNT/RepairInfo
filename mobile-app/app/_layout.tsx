import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationsProvider } from '@/context/NotificationsContext';

function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Connexion' }} />
      <Stack.Screen name="reparations/index" options={{ title: 'Reparations' }} />
      <Stack.Screen name="reparations/[id]" options={{ title: 'Detail reparation' }} />
      <Stack.Screen name="reparations/scan" options={{ title: 'Scanner une reference' }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <NotificationsProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </NotificationsProvider>
  );
}
