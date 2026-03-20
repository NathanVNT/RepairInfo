import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type NotificationsContextValue = {
  pushToken: string | null;
  enabled: boolean;
  initNotifications: () => Promise<void>;
  sendLocalNotification: (title: string, body: string) => Promise<void>;
};

const PUSH_TOKEN_KEY = 'repairinfo.mobile.pushToken';

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    undefined;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(PUSH_TOKEN_KEY).then((token) => {
      if (token) setPushToken(token);
    });
  }, []);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      pushToken,
      enabled: Boolean(pushToken),
      initNotifications: async () => {
        const token = await registerForPushNotificationsAsync();
        if (!token) return;

        setPushToken(token);
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      },
      sendLocalNotification: async (title: string, body: string) => {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
          },
          trigger: null,
        });
      },
    }),
    [pushToken]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }

  return context;
}
