import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBalanceStore } from '../../../stores/balanceStore';
import { useWalletStore } from '../../../stores/walletStore';
import { Colors, FontSize, Radius } from '../../../constants/theme';

export default function ShopScreen() {
  const fetchBalance = useBalanceStore((s) => s.fetch);
  const { buyCoinPack } = useWalletStore();
  const [packs, setPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPacks = async () => {
      try {
        const { api } = require('../../../services/localApi');
        const data = await api.getCoinPacks();
        setPacks(data);
      } catch {
        setPacks([
          { id: 1, coins: 500, price_dt: 2, bonus_pct: 0 },
          { id: 2, coins: 1200, price_dt: 5, bonus_pct: 0 },
          { id: 3, coins: 5000, price_dt: 15, bonus_pct: 5 },
          { id: 4, coins: 12000, price_dt: 30, bonus_pct: 10 },
          { id: 5, coins: 25000, price_dt: 60, bonus_pct: 15 },
        ]);
      }
      setLoading(false);
    };
    loadPacks();
  }, []);

  const handleBuy = async (pack: any) => {
    try {
      await buyCoinPack(pack.id);
      await fetchBalance('');
      Alert.alert('Achat réussi', `${pack.coins} Coins ajoutés !`);
    } catch {
      Alert.alert('Erreur', "Impossible d'acheter ce pack");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Boutique Coins</Text>
        <View style={{ width: 24 }} />
      </View>

      {packs.map((pack: any) => {
        const bonus = pack.bonus_pct || 0;
        const totalCoins = pack.coins + Math.floor(pack.coins * bonus / 100);
        return (
          <TouchableOpacity key={pack.id} style={styles.packRow} onPress={() => handleBuy(pack)}>
            <View style={styles.packLeft}>
              <Text style={styles.packIcon}>🪙</Text>
              <View>
                <Text style={styles.packCoins}>{totalCoins.toLocaleString()} Coins</Text>
                {bonus > 0 && (
                  <View style={styles.bonusBadge}>
                    <Text style={styles.bonusText}>+{bonus}%</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{pack.price_dt} DT</Text>
            </View>
          </TouchableOpacity>
        );
      })}
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
