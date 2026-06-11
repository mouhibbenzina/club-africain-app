import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../stores/authStore';
import { useTicketStore } from '../../../stores/ticketStore';
import { Colors, FontSize, Radius } from '../../../constants/theme';

export default function MyTicketsScreen() {
  const user = useAuthStore((s) => s.user);
  const { myTickets, fetchMyTickets } = useTicketStore();

  useEffect(() => {
    if (user) fetchMyTickets(user.id);
  }, [user]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 40 }}>
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Mes billets</Text>
      </View>

      {myTickets.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>Aucun billet</Text>
        </View>
      ) : (
        myTickets.map((ticket) => (
          <View key={ticket.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.matchTitle}>{ticket.match?.home_team || 'Club Africain'}</Text>
              <Text style={styles.vs}>VS</Text>
              <Text style={styles.matchTitle}>{ticket.match?.away_team || 'Adversaire'}</Text>
            </View>
            <Text style={styles.date}>{ticket.match?.date ? new Date(ticket.match.date).toLocaleDateString() : ''}</Text>
            <Text style={styles.venue}>{ticket.match?.venue || ''}</Text>

            <View style={styles.divider} />

            <View style={styles.seatGrid}>
              {[
                ['Catégorie', ticket.category],
                ['Prix', `${ticket.price_dt} DT`],
                ['QR', ticket.qr_code || 'N/A'],
              ].map(([label, value]) => (
                <View key={label} style={styles.seatItem}>
                  <Text style={styles.seatLabel}>{label}</Text>
                  <Text style={styles.seatValue}>{value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrIcon}>▚▚▚</Text>
              <Text style={styles.qrText}>QR CODE</Text>
            </View>

            <Text style={styles.code}>Code: {ticket.qr_code || 'N/A'}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700', marginLeft: 12 },
  card: { backgroundColor: Colors.primary, borderRadius: Radius.card, padding: 24, alignItems: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  matchTitle: { color: Colors.white, fontSize: FontSize.title, fontWeight: '800' },
  vs: { color: Colors.white, fontSize: FontSize.body, fontWeight: '700', opacity: 0.7 },
  date: { color: Colors.white, fontSize: FontSize.body, fontWeight: '600', opacity: 0.9 },
  venue: { color: Colors.white, fontSize: FontSize.body, fontWeight: '600', opacity: 0.9, marginBottom: 16 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', width: '100%', marginBottom: 16 },
  seatGrid: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
  seatItem: { alignItems: 'center' },
  seatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.caption },
  seatValue: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '700' },
  qrPlaceholder: { width: 120, height: 120, backgroundColor: Colors.white, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  qrIcon: { fontSize: 32, color: Colors.black },
  qrText: { color: Colors.black, fontSize: FontSize.caption, fontWeight: '600' },
  code: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.body },
});
