import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function ScreensLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.bg },
      animation: 'slide_from_right',
    }}>
      <Stack.Screen name="standings" />
      <Stack.Screen name="players" />
      <Stack.Screen name="player-detail" />
      <Stack.Screen name="sport-hub" />
      <Stack.Screen name="media" />
      <Stack.Screen name="news-detail" />
      <Stack.Screen name="match-detail" />
    </Stack>
  );
}
