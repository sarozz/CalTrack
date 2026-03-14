import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const REMINDER_ID_KEY = 'caltrack_reminder_notification_id_v1';

function parseHHMM(hhmm: string): { hour: number; minute: number } {
  const [h, m] = String(hhmm || '20:00').split(':');
  const hour = Math.max(0, Math.min(23, Number(h) || 20));
  const minute = Math.max(0, Math.min(59, Number(m) || 0));
  return { hour, minute };
}

export async function cancelDailyReminder() {
  const id = await AsyncStorage.getItem(REMINDER_ID_KEY);
  if (id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // ignore
    }
  }
  await AsyncStorage.removeItem(REMINDER_ID_KEY);
}

export async function scheduleDailyReminder(timeHHMM: string) {
  const { hour, minute } = parseHHMM(timeHHMM);

  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) {
    const req = await Notifications.requestPermissionsAsync();
    if (!req.granted) return { ok: false as const, reason: 'permission_denied' as const };
  }

  // Replace any existing scheduled reminder.
  await cancelDailyReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'CalTrack',
      body: 'Quick reminder: log what you ate today.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });

  await AsyncStorage.setItem(REMINDER_ID_KEY, id);
  return { ok: true as const, id };
}

export async function sendTestNotification() {
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) {
    const req = await Notifications.requestPermissionsAsync();
    if (!req.granted) return { ok: false as const, reason: 'permission_denied' as const };
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'CalTrack',
      body: 'Test notification — reminders are working.',
    },
    trigger: null,
  });

  return { ok: true as const };
}
