import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNewsStore } from '../../stores/newsStore';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { ErrorBanner, LoadingSkeleton } from '../../components/StateViews';

export default function NewsDetailScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { selectedNews, fetchNewsItem, isLoading, error, clearSelected } = useNewsStore();

  useEffect(() => {
    if (id) fetchNewsItem(Number(id));
    return () => clearSelected();
  }, [id]);

  const item = selectedNews;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Actualité</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {error && <ErrorBanner message={error} />}

      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoading && !item && <LoadingSkeleton lines={8} />}

        {item && (
          <>
            <View style={styles.imageHero}>
              <Ionicons name="newspaper" size={48} color={Colors.textMuted} />
              {item.sport_label && (
                <View style={styles.sportTag}>
                  <Text style={styles.sportTagText}>{item.sport_label}</Text>
                </View>
              )}
            </View>

            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>

              <View style={styles.meta}>
                {item.author && (
                  <View style={styles.metaRow}>
                    <Ionicons name="person" size={14} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{item.author}</Text>
                  </View>
                )}
                <View style={styles.metaRow}>
                  <Ionicons name="time" size={14} color={Colors.textMuted} />
                  <Text style={styles.metaText}>
                    {new Date(item.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {item.excerpt && (
                <Text style={styles.excerpt}>{item.excerpt}</Text>
              )}

              {item.content && (
                <Text style={styles.body}>{item.content}</Text>
              )}

              {!item.content && item.excerpt && (
                <Text style={styles.body}>{item.excerpt}</Text>
              )}

              <Text style={styles.placeholderText}>
                Article complet disponible dans une prochaine mise à jour.
                Suivez-nous pour ne rien manquer de l'actualité du Club Africain.
              </Text>
            </View>

            <View style={{ height: 48 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 8 },
  backBtn: { padding: 4 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  imageHero: { height: 200, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  sportTag: { position: 'absolute', top: 12, left: 12, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.pill },
  sportTagText: { color: Colors.white, fontSize: FontSize.label, fontWeight: '700' },
  content: { padding: Spacing.lg },
  title: { color: Colors.textPrimary, fontSize: FontSize.display, fontWeight: '800', lineHeight: 32 },
  meta: { marginTop: 16, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: Colors.textMuted, fontSize: FontSize.body },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 20 },
  excerpt: { color: Colors.gold, fontSize: FontSize.subtitle, fontWeight: '600', lineHeight: 24, fontStyle: 'italic' },
  body: { color: Colors.textPrimary, fontSize: FontSize.body, lineHeight: 22, marginTop: 16 },
  placeholderText: { color: Colors.textMuted, fontSize: FontSize.body, lineHeight: 20, marginTop: 24, fontStyle: 'italic', textAlign: 'center' },
});
