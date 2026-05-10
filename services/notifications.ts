import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const PUSH_TOKEN_KEY = 'expo_push_token';
const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';
const isExpoGo =
  Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';

export async function getNotificationsEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  if (raw == null) return true;
  return raw === 'true';
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (isExpoGo) {
    console.log(
      '[notifications] Expo Go does not support Android remote push notifications. Skipping token registration.'
    );
    return null;
  }

  const Notifications = await import('expo-notifications');

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[notifications] Permission not granted');
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    console.log(
      '[notifications] Missing EAS projectId. Skipping Expo push token registration.'
    );
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData.data;

  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  console.log('[notifications] Expo push token:', token);

  return token;
}

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

export async function clearStoredPushToken(): Promise<void> {
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}

export async function syncPushTokenWithBackend(
  token: string,
  accessToken: string,
): Promise<void> {
  if (!API_URL) return;

  try {
    const response = await fetch(`${API_URL}/api/notifications/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      throw new Error(`register failed: ${response.status}`);
    }
  } catch (err) {
    console.warn('[notifications] Failed to sync push token with backend', err);
  }
}

export async function disablePushNotificationsOnBackend(
  accessToken: string,
): Promise<void> {
  if (!API_URL) return;

  try {
    const response = await fetch(`${API_URL}/api/notifications/disable`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      throw new Error(`disable failed: ${response.status}`);
    }
  } catch (err) {
    console.warn('[notifications] Failed to disable push notifications on backend', err);
  }
}

export async function scheduleDailyHabitReminder(): Promise<void> {
  if (isExpoGo) {
    return;
  }

  const Notifications = await import('expo-notifications');

  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Atomy',
      body: 'Your habit is ready 🔥',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });

  console.log('[notifications] Daily reminder scheduled for 9:00 AM');
}

export async function cancelDailyHabitReminder(): Promise<void> {
  if (isExpoGo) {
    return;
  }

  const Notifications = await import('expo-notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[notifications] Daily reminder cancelled');
}
