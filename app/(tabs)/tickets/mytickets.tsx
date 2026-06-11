import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Radius } from '../../../constants/theme';

const MOCK_TICKET = {
  home: 'Club Africain',
  away: 'US Monastir',
  date: '25 Mai 2024',
  time: '17:00',
  venue: 'Radès',
  tribune: 'B',
  rang: 12,
  siege: 45,
  code: 'CA1920TV',
};

export default function MyTicketsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.matchTitle}>{MOCK_TICKET.home}</Text>
          <Text style={styles.vs}>VS</Text>
          <Text style={styles.matchTitle}>{MOCK_TICKET.away}</Text>
        </View>
        <Text style={styles.date}>{MOCK_TICKET.date} - {MOCK_TICKET.time}</Text>
        <Text style={styles.venue}>{MOCK_TICKET.venue}</Text>

        <View style={styles.divider} />

        <View style={styles.seatGrid}>
          {[['Tribune', MOCK_TICKET.tribune], ['Rang', MOCK_TICKET.rang], ['Siège', MOCK_TICKET.siege]].map(([label, value]) => (
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

        <Text style={styles.code}>Code: {MOCK_TICKET.code}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', padding: 16 },
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
