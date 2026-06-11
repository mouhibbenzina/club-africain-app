import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../../constants/theme';

const TABS = ['Toutes', 'Matchs', 'Jeux', 'Offres'];

const NOTIFICATIONS = [
  { icon: 'logo-bitcoin', title: 'Vous avez gagné 50 Coins', time: 'il y a 2 min', type: 0 },
  { icon: 'checkmark-circle', title: 'Mission quotidienne complétée', time: 'il y a 10 min', type: 0 },
  { icon: 'football', title: 'Début match CA vs USM', time: 'il y a 1h', type: 1 },
  { icon: 'trophy', title: 'Vous êtes dans le Top 10', time: 'il y a 2h', type: 2 },
  { icon: 'gift', title: 'Nouvelle offre disponible', time: 'il y a 3h', type: 3 },
];

export default function NotificationsModal() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab} style={[styles.tab, i === 0 && styles.tabActive]}>
            <Text style={[styles.tabText, i === 0 && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {NOTIFICATIONS.map((n, i) => (
        <View key={i} style={styles.notifRow}>
          <Ionicons name={n.icon as any} size={20} color={Colors.primary} />
          <View style={styles.notifInfo}>
            <Text style={styles.notifTitle}>{n.title}</Text>
            <Text style={styles.notifTime}>{n.time}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  tabRow: { maxHeight: 44, marginBottom: 16 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surface },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.white },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  notifInfo: { flex: 1 },
  notifTitle: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600' },
  notifTime: { color: Colors.textSecondary, fontSize: FontSize.caption, marginTop: 2 },
});
