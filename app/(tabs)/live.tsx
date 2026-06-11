import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../../constants/theme';

export default function LiveScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live</Text>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📺</Text>
        <Text style={styles.emptyText}>Aucun match en direct</Text>
        <Text style={styles.emptySub}>Revenez pendant un match pour regarder</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '600' },
  emptySub: { color: Colors.textSecondary, fontSize: FontSize.body, textAlign: 'center', marginTop: 8 },
});
