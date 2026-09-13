import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../constants/theme';

interface GameMoneyBannerProps {
  amount: number;
  onPress?: () => void;
}

export function GameMoneyBanner({ amount, onPress }: GameMoneyBannerProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.left}>
        <Ionicons name="cash" size={20} color={Colors.gold} />
        <View>
          <Text style={styles.amount}>
            {amount.toLocaleString()} $CA
          </Text>
          <Text style={styles.subtext}>Game Money</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amount: {
    color: Colors.gold,
    fontSize: FontSize.title,
    fontWeight: '800',
  },
  subtext: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
  },
});
