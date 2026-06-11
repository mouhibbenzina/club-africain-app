import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMatchStore } from '../../stores/matchStore';
import { Colors, FontSize, Radius } from '../../constants/theme';

const CATEGORIES = [
  { id: 'pelouse', label: 'Pelouse', price_dt: 10, color: '#27AE60' },
  { id: 'enceinte', label: 'Enceinte', price_dt: 25, color: '#3498DB' },
  { id: 'virage', label: 'Virage', price_dt: 40, color: '#E67E22' },
  { id: 'vip', label: 'VIP', price_dt: 60, color: '#9B59B6' },
  { id: 'mouhib', label: 'محب وفي', price_dt: 100, color: '#CC0000', subtitle: 'Accès VIP + Avantages' },
];

export default function TicketsScreen() {
  const { upcomingMatches, fetchMatches } = useMatchStore();
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const match = upcomingMatches[0];

  const handleBuy = async (categoryId: string, price: number) => {
    if (!match) {
      Alert.alert('Aucun match disponible');
      return;
    }
    setBuying(true);
    try {
      const { api } = require('../services/localApi');
      await api.buyTicket(match.id, categoryId);
      Alert.alert('Achat réussi', `Billet ${CATEGORIES.find((c) => c.id === categoryId)?.label} acheté`);
    } catch {
      Alert.alert('Erreur', 'Solde insuffisant ou erreur');
    }
    setBuying(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Billets</Text>
        <TouchableOpacity onPress={() => router.push('/(modals)/notifications')}>
          <Ionicons name="notifications" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {match ? (
          <View style={styles.matchCard}>
            <View style={styles.matchTeams}>
              <View style={styles.team}>
                <View style={[styles.logo, { backgroundColor: Colors.primary }]}>
                  <Text style={styles.logoText}>CA</Text>
                </View>
                <Text style={styles.teamName}>{match.home_team}</Text>
              </View>
              <Text style={styles.vs}>VS</Text>
              <View style={styles.team}>
                <View style={[styles.logo, { backgroundColor: '#222' }]}>
                  <Text style={styles.logoText}>{(match.away_team || '???').slice(0, 3).toUpperCase()}</Text>
                </View>
                <Text style={styles.teamName}>{match.away_team}</Text>
              </View>
            </View>
            <Text style={styles.matchInfo}>{new Date(match.date).toLocaleDateString()} - {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            <Text style={styles.matchInfo}>{match.venue}</Text>
          </View>
        ) : (
          <View style={styles.matchCard}>
            <Text style={{ color: Colors.textSecondary, textAlign: 'center' }}>Aucun match à venir</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Choisissez votre place:</Text>

        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.categoryRow} onPress={() => handleBuy(cat.id, cat.price_dt)}>
            <View style={[styles.dot, { backgroundColor: cat.color }]} />
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
              {cat.subtitle && <Text style={styles.categorySub}>{cat.subtitle}</Text>}
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{cat.price_dt} DT</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.myTicketsBtn} onPress={() => router.push('/(tabs)/tickets/mytickets')}>
          <Text style={styles.myTicketsText}>Mes billets</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  matchCard: { backgroundColor: Colors.surface, borderRadius: Radius.card, marginHorizontal: 16, padding: 20, marginBottom: 20 },
  matchTeams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 12 },
  team: { alignItems: 'center', gap: 8 },
  logo: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '900' },
  vs: { color: Colors.textSecondary, fontSize: FontSize.title, fontWeight: '800' },
  teamName: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600' },
  matchInfo: { color: Colors.textSecondary, fontSize: FontSize.body, textAlign: 'center' },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '600', marginHorizontal: 16, marginBottom: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 16, marginBottom: 8, borderRadius: Radius.card, padding: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  categoryInfo: { flex: 1 },
  categoryLabel: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600' },
  categorySub: { color: Colors.textSecondary, fontSize: FontSize.caption, marginTop: 2 },
  priceBadge: { backgroundColor: Colors.green, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
  priceText: { color: Colors.white, fontSize: FontSize.body, fontWeight: '700' },
  myTicketsBtn: { backgroundColor: Colors.surface, borderRadius: Radius.card, marginHorizontal: 16, marginTop: 12, marginBottom: 32, padding: 16, alignItems: 'center' },
  myTicketsText: { color: Colors.primary, fontSize: FontSize.subtitle, fontWeight: '700' },
});
