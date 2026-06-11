import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../../../constants/theme';

const TABS = ['Général', 'Prédic.', 'Équipes'];

const MOCK_LEADERBOARD = [
  { rank: 1, username: 'Clubiste_1920', coins: 12450, highlight: true },
  { rank: 2, username: 'Africain_4ever', coins: 11200, highlight: true },
  { rank: 3, username: 'RedWhite', coins: 10300, highlight: true },
  { rank: 4, username: 'CA_Tunis', coins: 9850 },
  { rank: 5, username: 'LegendCA', coins: 8700 },
  { rank: 6, username: 'Sans Gêne', coins: 7600 },
  { rank: 7, username: 'Winn_CA', coins: 6900 },
];

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Classement</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.listHeader}>
          <Text style={[styles.col, { flex: 0.5 }]}>#</Text>
          <Text style={[styles.col, { flex: 2 }]}>Utilisateur</Text>
          <Text style={[styles.col, { flex: 1, textAlign: 'right' }]}>🪙</Text>
        </View>
        {MOCK_LEADERBOARD.map((entry) => (
          <View key={entry.rank} style={[styles.row, entry.highlight && styles.rowHighlight]}>
            <Text style={[styles.rank, entry.highlight && styles.rankGold, { flex: 0.5 }]}>
              {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
            </Text>
            <Text style={[styles.username, { flex: 2 }]}>{entry.username}</Text>
            <Text style={[styles.coins, { flex: 1, textAlign: 'right' }]}>{entry.coins.toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.surface, borderRadius: Radius.btn, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: FontSize.body, fontWeight: '600' },
  tabTextActive: { color: Colors.white },
  listHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' },
  col: { color: Colors.textSecondary, fontSize: FontSize.caption, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  rowHighlight: { backgroundColor: '#1A1000' },
  rank: { fontSize: FontSize.body, fontWeight: '700', color: Colors.textPrimary },
  rankGold: { color: Colors.gold },
  username: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600' },
  coins: { color: Colors.gold, fontSize: FontSize.body, fontWeight: '700' },
});
