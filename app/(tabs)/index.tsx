import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useBalanceStore } from '../../stores/balanceStore';
import { useMatchStore } from '../../stores/matchStore';
import { useEffect } from 'react';
import { Colors, FontSize } from '../../constants/theme';
import { BalanceBar } from '../../components/BalanceBar';
import { GameMoneyBanner } from '../../components/GameMoneyBanner';
import { MatchCard } from '../../components/MatchCard';
import { QuickActions } from '../../components/QuickActions';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { catCoins, realMoneyDt, gameMoneySca, fetch: fetchBalance } = useBalanceStore();
  const { liveMatch, fetchMatches } = useMatchStore();

  useEffect(() => {
    if (user) {
      fetchBalance(user.id);
      fetchMatches();
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(modals)/profile')}>
          <Ionicons name="menu" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accueil</Text>
        <TouchableOpacity onPress={() => router.push('/(modals)/notifications')}>
          <Ionicons name="notifications" size={24} color={Colors.textPrimary} />
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
});
