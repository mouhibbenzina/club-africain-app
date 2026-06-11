import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../../../constants/theme';

const PACKS = [
  { coins: 500, price: 2, bonus: 0 },
  { coins: 1200, price: 5, bonus: 0 },
  { coins: 5000, price: 15, bonus: 5 },
  { coins: 12000, price: 30, bonus: 10 },
  { coins: 25000, price: 60, bonus: 15 },
];

export default function ShopScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Boutique Coins</Text>
        <View style={{ width: 24 }} />
      </View>

      {PACKS.map((pack) => (
        <TouchableOpacity key={pack.coins} style={styles.packRow}>
          <View style={styles.packLeft}>
            <Text style={styles.packIcon}>🪙</Text>
            <View>
              <Text style={styles.packCoins}>{pack.coins.toLocaleString()} Coins</Text>
              {pack.bonus > 0 && (
                <View style={styles.bonusBadge}>
                  <Text style={styles.bonusText}>+{pack.bonus}%</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{pack.price} DT</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  packRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, marginHorizontal: 16, marginBottom: 8, borderRadius: Radius.card, padding: 16 },
  packLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  packIcon: { fontSize: 28 },
  packCoins: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '700' },
  bonusBadge: { backgroundColor: Colors.gold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  bonusText: { color: Colors.black, fontSize: FontSize.caption, fontWeight: '700' },
  priceTag: { backgroundColor: Colors.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill },
  priceText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '700' },
});
