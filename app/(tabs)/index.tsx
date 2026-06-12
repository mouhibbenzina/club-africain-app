import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useBalanceStore } from '../../stores/balanceStore';
import { useMatchStore } from '../../stores/matchStore';
import { useSportStore } from '../../stores/sportStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { BalanceBar } from '../../components/BalanceBar';
import { GameMoneyBanner } from '../../components/GameMoneyBanner';
import { MatchCard } from '../../components/MatchCard';
import { QuickActions } from '../../components/QuickActions';
import { ErrorBanner, LoadingSkeleton, ConnectionBanner } from '../../components/StateViews';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { catCoins, realMoneyDt, gameMoneySca, fetch: fetchBalance, error: balanceError } = useBalanceStore();
  const { liveMatch, fetchMatches, error: matchError } = useMatchStore();
  const { liveMatches, sports, fetchLiveScores, fetchSports } = useSportStore();
  const { unreadCount, fetch: fetchNotifs } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      fetchBalance(user.id),
      fetchMatches(),
      fetchNotifs(user.id),
      fetchSports(),
      fetchLiveScores(),
    ]);
  }, [user]);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      if (user) {
        fetchBalance(user.id);
        fetchMatches();
        fetchLiveScores();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(modals)/profile')}>
          <Ionicons name="menu" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Club Africain</Text>
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

      <ConnectionBanner />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <BalanceBar coins={catCoins} money_dt={realMoneyDt} />
        <GameMoneyBanner amount={gameMoneySca} onPress={() => router.push('/(tabs)/wallet')} />

        {balanceError && <ErrorBanner message={balanceError} onRetry={() => user && fetchBalance(user.id)} />}
        {matchError && <ErrorBanner message={matchError} onRetry={fetchMatches} />}

        {liveMatch && (
          <MatchCard
            home={liveMatch.home_team}
            away={liveMatch.away_team}
            viewers={liveMatch.viewers}
            is_live={liveMatch.is_live}
          />
        )}

        {liveMatches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>En direct</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {liveMatches.map((m) => (
                <TouchableOpacity key={m.id} style={[styles.liveMiniCard, Shadow.card]}>
                  <View style={[styles.sportIndicator, { backgroundColor: (m as any).sport_color || Colors.primary }]} />
                  <Text style={styles.liveMiniSport}>{(m as any).sport_label}</Text>
                  <Text style={styles.liveMiniTeams}>{m.home_team} vs {m.away_team}</Text>
                  <Text style={styles.liveMiniViewers}>{(m.viewers || 0) > 1000 ? `${(m.viewers! / 1000).toFixed(1)}K` : m.viewers || 0} viewers</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.quickLinks}>
          <Text style={styles.sectionLabel}>Sections</Text>
          <View style={styles.quickLinksGrid}>
            <TouchableOpacity style={[styles.quickLink, Shadow.card]} onPress={() => router.push('/(tabs)/matches')}>
              <Ionicons name="tv" size={22} color={Colors.primary} />
              <Text style={styles.quickLinkLabel}>Matchs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickLink, Shadow.card]} onPress={() => router.push('/(tabs)/news')}>
              <Ionicons name="newspaper" size={22} color={Colors.gold} />
              <Text style={styles.quickLinkLabel}>Actus</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickLink, Shadow.card]} onPress={() => router.push('/(tabs)/community')}>
              <Ionicons name="chatbubbles" size={22} color={Colors.green} />
              <Text style={styles.quickLinkLabel}>Communauté</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickLink, Shadow.card]} onPress={() => router.push('/(screens)/standings')}>
              <Ionicons name="trophy" size={22} color={Colors.orange} />
              <Text style={styles.quickLinkLabel}>Classement</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickLink, Shadow.card]} onPress={() => router.push('/(screens)/players')}>
              <Ionicons name="people" size={22} color={Colors.blue} />
              <Text style={styles.quickLinkLabel}>Effectif</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickLink, Shadow.card]} onPress={() => router.push('/(screens)/media')}>
              <Ionicons name="videocam" size={22} color={Colors.purple} />
              <Text style={styles.quickLinkLabel}>Médias</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickLink, Shadow.card]} onPress={() => router.push('/(modals)/missions')}>
              <Ionicons name="flag" size={22} color={Colors.primaryLight} />
              <Text style={styles.quickLinkLabel}>Missions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickLink, Shadow.card]} onPress={() => router.push('/(tabs)/games')}>
              <Ionicons name="game-controller" size={22} color={Colors.purple} />
              <Text style={styles.quickLinkLabel}>Jeux</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickLink, Shadow.card]} onPress={() => router.push('/(tabs)/wallet')}>
              <Ionicons name="wallet" size={22} color={Colors.greenDark} />
              <Text style={styles.quickLinkLabel}>Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>

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
  section: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sectionLabel: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: Spacing.lg, marginBottom: 10 },
  horizontalScroll: { paddingHorizontal: Spacing.lg, gap: 10 },
  liveMiniCard: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 14, width: 160, position: 'relative', overflow: 'hidden' },
  sportIndicator: { width: 4, height: 40, borderRadius: 2, position: 'absolute', left: 0, top: 12 },
  liveMiniSport: { color: Colors.primary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  liveMiniTeams: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '700', marginBottom: 4 },
  liveMiniViewers: { color: Colors.textMuted, fontSize: FontSize.caption },
  quickLinks: { marginTop: Spacing.xl, marginBottom: Spacing.sm },
  quickLinksGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: 10 },
  quickLink: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 14, alignItems: 'center', justifyContent: 'center', width: '30%', aspectRatio: 1, gap: 6 },
  quickLinkLabel: { color: Colors.textPrimary, fontSize: FontSize.label, fontWeight: '600' },
});
