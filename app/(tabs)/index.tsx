import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useBalanceStore } from '../../stores/balanceStore';
import { useMatchStore } from '../../stores/matchStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Colors, FontSize } from '../../constants/theme';
import { BalanceBar } from '../../components/BalanceBar';
import { GameMoneyBanner } from '../../components/GameMoneyBanner';
import { MatchCard } from '../../components/MatchCard';
import { QuickActions } from '../../components/QuickActions';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { catCoins, realMoneyDt, gameMoneySca, fetch: fetchBalance } = useBalanceStore();
  const { liveMatch, fetchMatches } = useMatchStore();
  const { unreadCount, fetch: fetchNotifs } = useNotificationStore();

  useEffect(() => {
    if (user) {
      fetchBalance(user.id);
      fetchMatches();
      fetchNotifs(user.id);
    }
    const interval = setInterval(() => {
      if (user) {
        fetchBalance(user.id);
        fetchMatches();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(modals)/profile')}>
          <Ionicons name="menu" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accueil</Text>
        <TouchableOpacity onPress={() => router.push('/(modals)/notifications')}>
          <View>
            <Ionicons name="notifications" size={24} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <BalanceBar coins={catCoins} money_dt={realMoneyDt} />
        <GameMoneyBanner amount={gameMoneySca} onPress={() => router.push('/(tabs)/wallet')} />
        {liveMatch && (
          <MatchCard
            home={liveMatch.home_team}
            away={liveMatch.away_team}
            viewers={liveMatch.viewers}
            is_live={liveMatch.is_live}
          />
        )}
        <QuickActions />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.title, fontWeight: '700' },
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: Colors.primary, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
});
