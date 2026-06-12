import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../constants/theme';

interface ActionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
}

const actions: ActionItem[] = [
  { icon: 'tv', label: 'Matchs', route: '/(tabs)/matches' },
  { icon: 'newspaper', label: 'Actus', route: '/(tabs)/news' },
  { icon: 'chatbubbles', label: 'Communauté', route: '/(tabs)/community' },
  { icon: 'cash', label: 'Caisse', route: '/(modals)/donate' },
  { icon: 'trophy', label: 'Classement', route: '/(tabs)/games/leaderboard' },
  { icon: 'game-controller', label: 'Jeux', route: '/(tabs)/games' },
  { icon: 'flag', label: 'Missions', route: '/(modals)/missions' },
  { icon: 'ticket', label: 'Billets', route: '/(tabs)/tickets' },
];

export function QuickActions() {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {actions.map((item) => (
          <TouchableOpacity key={item.label} style={styles.actionBtn} onPress={() => router.push(item.route as any)}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={22} color={Colors.primary} />
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  actionBtn: { width: '25%', alignItems: 'center', paddingVertical: 12, gap: 6 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  label: { color: Colors.textSecondary, fontSize: FontSize.caption, fontWeight: '600' },
});
