import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'user_goal';

export async function getGoal(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}

export async function saveGoal(goal: string): Promise<void> {
  await AsyncStorage.setItem(KEY, goal.trim());
}

export async function clearGoal(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
