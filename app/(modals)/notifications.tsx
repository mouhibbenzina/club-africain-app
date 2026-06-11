import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Colors, FontSize, Radius } from '../../constants/theme';

const TABS = ['Toutes', 'Matchs', 'Jeux', 'Offres'];

const typeIcons: Record<string, string> = {
  general: 'logo-bitcoin',
  match: 'football',
  game: 'trophy',
  offer: 'gift',
};

const typeTabMap: Record<string, number> = {
  general: 0,
  match: 1,
  game: 2,
  offer: 3,
};

export default function NotificationsModal() {
  const user = useAuthStore((s) => s.user);
  const { notifications, unreadCount, fetch, markRead, markAllRead } = useNotificationStore();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (user) fetch(user.id);
  }, [user]);

  const filtered = activeTab === 0
    ? notifications
    : notifications.filter((n) => {
        const tabIndex = typeTabMap[n.type] ?? 0;
        return tabIndex === activeTab;
      });

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications {unreadCount > 0 && `(${unreadCount})`}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={{ color: Colors.primary, fontSize: FontSize.body, fontWeight: '600' }}>Tout lu</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.map((n) => (
        <TouchableOpacity key={n.id} style={[styles.notifRow, !n.read && { backgroundColor: '#220000' }]} onPress={() => !n.read && markRead(n.id)}>
          <Ionicons name={(typeIcons[n.type] || 'logo-bitcoin') as any} size={20} color={Colors.primary} />
          <View style={styles.notifInfo}>
            <Text style={[styles.notifTitle, n.read && { opacity: 0.6 }]}>{n.title}</Text>
            <Text style={styles.notifTime}>{timeAgo(n.created_at)}</Text>
          </View>
          {!n.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary }} />}
        </TouchableOpacity>
      ))}
      {filtered.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Text style={{ color: Colors.textSecondary }}>Aucune notification</Text>
        </View>
      )}
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
