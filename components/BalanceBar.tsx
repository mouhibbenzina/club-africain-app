import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../constants/theme';

interface BalanceBarProps {
  coins: number;
  money_dt: number;
}

export function BalanceBar({ coins, money_dt }: BalanceBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.chip}>
        <Ionicons name="logo-bitcoin" size={16} color={Colors.gold} />
        <Text style={styles.chipText}>
          {coins.toLocaleString()} CAT Coins
        </Text>
      </View>
      <View style={styles.chip}>
        <Ionicons name="heart" size={16} color={Colors.green} />
        <Text style={styles.chipText}>{money_dt} DT Mon argent</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  chipText: {
    color: Colors.white,
    fontSize: FontSize.label,
    fontWeight: '700',
  },
});
