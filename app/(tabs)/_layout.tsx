import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="matches" options={{ title: 'Matchs', tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="tv" size={size} color={color} /> }} />
      <Tabs.Screen name="news" options={{ title: 'Actus', tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="newspaper" size={size} color={color} /> }} />
      <Tabs.Screen name="community" options={{ title: 'Communauté', tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="chatbubbles" size={size} color={color} /> }} />
      <Tabs.Screen name="games" options={{ title: 'Jeux', tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="game-controller" size={size} color={color} /> }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet', tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="wallet" size={size} color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: '#222',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: FontSize.caption,
    fontWeight: '600',
  },
});
