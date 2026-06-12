import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNewsStore } from '../../stores/newsStore';
import { useSportStore } from '../../stores/sportStore';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { ErrorBanner, EmptyState, ConnectionBanner } from '../../components/StateViews';

export default function NewsScreen() {
  const { news, fetchNews, isLoading, error } = useNewsStore();
  const { sports } = useSportStore();
  const [activeSport, setActiveSport] = useState<number | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    fetchNews(activeSport);
  }, [activeSport]);

  useEffect(() => {
    load();
  }, [activeSport]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNews(activeSport);
    setRefreshing(false);
  }, [activeSport]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Actualités</Text>
        <Text style={styles.headerSub}>Toute l'actualité du Club</Text>
      </View>

      <ConnectionBanner />
      {error && <ErrorBanner message={error} onRetry={load} />}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportStrip} contentContainerStyle={styles.sportStripContent}>
        <TouchableOpacity
          style={[styles.sportChip, activeSport === undefined && styles.sportChipActive]}
          onPress={() => setActiveSport(undefined)}
        >
          <Text style={[styles.sportChipText, activeSport === undefined && styles.sportChipTextActive]}>Toutes</Text>
        </TouchableOpacity>
        {sports.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sportChip, activeSport === s.id && { backgroundColor: s.color }]}
            onPress={() => setActiveSport(s.id)}
          >
            <Text style={[styles.sportChipText, activeSport === s.id && styles.sportChipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        {isLoading && news.length === 0 && (
          <View style={styles.skeleton}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.skeletonCard, { opacity: 1 - (i - 1) * 0.15 }]}>
                <View style={styles.skeletonImage} />
                <View style={styles.skeletonContent}>
                  <View style={styles.skeletonLine} />
                  <View style={[styles.skeletonLine, { width: '60%' }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {!isLoading && news.length === 0 && (
          <EmptyState icon="newspaper-outline" title="Aucune actualité" subtitle="Revenez plus tard pour les dernières nouvelles du Club" />
        )}

        {news.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.newsCard, Shadow.card]}>
            <View style={styles.newsImagePlaceholder}>
              <Ionicons name="newspaper" size={32} color={Colors.textMuted} />
              {item.sport_label && (
                <View style={[styles.newsSportBadge, { backgroundColor: (sports.find(s => s.label === item.sport_label)?.color || Colors.primary) }]}>
                  <Text style={styles.newsSportBadgeText}>{item.sport_label}</Text>
                </View>
              )}
            </View>
            <View style={styles.newsContent}>
              <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
              {item.excerpt && <Text style={styles.newsExcerpt} numberOfLines={2}>{item.excerpt}</Text>}
              <View style={styles.newsFooter}>
                <Text style={styles.newsDate}>{new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                {item.author && <Text style={styles.newsAuthor}>{item.author}</Text>}
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 8 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  headerSub: { color: Colors.textSecondary, fontSize: FontSize.label, marginTop: 2 },
  sportStrip: { maxHeight: 40, marginTop: 8 },
  sportStripContent: { paddingHorizontal: Spacing.lg, gap: 8, alignItems: 'center' },
  sportChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Colors.surface },
  sportChipActive: { backgroundColor: Colors.primary },
  sportChipText: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '600' },
  sportChipTextActive: { color: Colors.white },
  list: { flex: 1, marginTop: 12 },
  skeleton: { paddingHorizontal: Spacing.lg, gap: 12 },
  skeletonCard: { flexDirection: 'row', height: 90, backgroundColor: Colors.surface, borderRadius: Radius.card, overflow: 'hidden' },
  skeletonImage: { width: 90, backgroundColor: Colors.surfaceLight },
  skeletonContent: { flex: 1, padding: 12, gap: 8 },
  skeletonLine: { height: 12, backgroundColor: Colors.surfaceLight, borderRadius: Radius.sm },
  newsCard: { flexDirection: 'row', backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, marginBottom: 12, borderRadius: Radius.card, overflow: 'hidden' },
  newsImagePlaceholder: { width: 90, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  newsSportBadge: { position: 'absolute', top: 6, left: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.pill },
  newsSportBadgeText: { color: Colors.white, fontSize: 8, fontWeight: '700' },
  newsContent: { flex: 1, padding: 12, gap: 4 },
  newsTitle: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '700', lineHeight: 18 },
  newsExcerpt: { color: Colors.textSecondary, fontSize: FontSize.caption, lineHeight: 15 },
  newsFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  newsDate: { color: Colors.textMuted, fontSize: 10 },
  newsAuthor: { color: Colors.primary, fontSize: 10, fontWeight: '600' },
});
