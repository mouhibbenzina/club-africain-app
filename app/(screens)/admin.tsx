import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/localApi';
import { useAuthStore } from '../../stores/authStore';
import { Colors, FontSize, Radius, Shadow } from '../../constants/theme';

type Section = 'stats' | 'users' | 'news' | 'matches';

const roleColors: Record<string, string> = { fan: Colors.textMuted, vip: Colors.blue, admin: Colors.gold };
const sportNames: Record<string, string> = { 1: 'Football', 2: 'Handball', 3: 'Basket', 4: 'Volley', 5: 'Boxe' };

export default function AdminScreen() {
  const user = useAuthStore((s) => s.user);
  const [section, setSection] = useState<Section>('stats');

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [news, setNews] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const [newNewsTitle, setNewNewsTitle] = useState('');
  const [newNewsExcerpt, setNewNewsExcerpt] = useState('');
  const [newHome, setNewHome] = useState('');
  const [newAway, setNewAway] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newComp, setNewComp] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') return;
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading('stats');
    try { setStats(await api.getAdminStats()); } catch {} finally { setLoading(null); }
  };

  const loadUsers = async (q?: string) => {
    setLoading('users');
    try { setUsers(await api.getAdminUsers(q)); } catch {} finally { setLoading(null); }
  };

  const loadNews = async () => {
    setLoading('news');
    try { setNews(await api.getAdminNews()); } catch {} finally { setLoading(null); }
  };

  const loadMatches = async () => {
    setLoading('matches');
    try { setMatches(await api.getAdminMatches()); } catch {} finally { setLoading(null); }
  };

  const switchSection = (s: Section) => {
    setSection(s);
    if (s === 'users' && users.length === 0) loadUsers();
    if (s === 'news' && news.length === 0) loadNews();
    if (s === 'matches' && matches.length === 0) loadMatches();
  };

  const setRole = async (id: string, role: 'fan' | 'vip' | 'admin') => {
    try { await api.setUserRole(id, role); await loadUsers(userQuery); } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const createNews = async () => {
    if (!newNewsTitle.trim()) return;
    try {
      await api.createAdminNews({ title: newNewsTitle.trim(), excerpt: newNewsExcerpt.trim(), sport_id: 1, published: true });
      setNewNewsTitle(''); setNewNewsExcerpt('');
      await loadNews();
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const toggleNews = async (item: any) => {
    try { await api.updateAdminNews(item.id, { published: item.published ? false : true }); await loadNews(); } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const deleteNews = (item: any) => {
    Alert.alert('Supprimer', `Supprimer « ${item.title} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { try { await api.deleteAdminNews(item.id); await loadNews(); } catch (e: any) { Alert.alert('Erreur', e.message); } } },
    ]);
  };

  const createMatch = async () => {
    if (!newHome.trim() || !newAway.trim() || !newDate.trim()) return;
    try {
      await api.createAdminMatch({ sport_id: 1, home_team: newHome.trim(), away_team: newAway.trim(), date: newDate.trim(), competition: newComp.trim() || 'Ligue 1', venue: 'Stade Olympique' });
      setNewHome(''); setNewAway(''); setNewDate(''); setNewComp('');
      await loadMatches();
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const setScore = async (id: number, field: string, value: string) => {
    const num = value === '' ? null : Number(value);
    if (num !== null && Number.isNaN(num)) return;
    try {
      await api.updateAdminMatch(id, { [field]: num });
      setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: num } : m)));
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const setMatchStatus = async (id: number, status: string) => {
    try {
      await api.updateAdminMatch(id, { status });
      setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const renderStats = () => {
    const items = stats ? [
      { label: 'Supporters', value: stats.users, icon: 'people', color: Colors.primary },
      { label: 'Admins', value: stats.admins, icon: 'shield-checkmark', color: Colors.gold },
      { label: 'Publications', value: stats.fan_posts, icon: 'chatbubble', color: Colors.blue },
      { label: 'Dons (DT)', value: Math.round(stats.donations_total), icon: 'heart', color: Colors.orange },
      { label: 'Billets vendus', value: stats.tickets_sold, icon: 'ticket', color: Colors.green },
      { label: 'Prédictions', value: stats.predictions, icon: 'analytics', color: Colors.purple },
      { label: 'Actualités', value: stats.news_count, icon: 'newspaper', color: Colors.primaryLight },
      { label: 'Scores', value: stats.matches, icon: 'football', color: Colors.green },
      { label: 'Transactions', value: stats.transactions, icon: 'swap-horizontal', color: Colors.textSecondary },
    ] : [];
    return (
      <View style={styles.grid}>
        {loading === 'stats' && !stats ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> : null}
        {items.map((it) => (
          <View key={it.label} style={[styles.statCard, Shadow.card]}>
            <Ionicons name={it.icon as any} size={20} color={it.color} />
            <Text style={styles.statValue}>{it.value}</Text>
            <Text style={styles.statLabel}>{it.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderUsers = () => (
    <>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une adresse ou un pseudo..."
          placeholderTextColor={Colors.textMuted}
          value={userQuery}
          onChangeText={(t) => { setUserQuery(t); loadUsers(t); }}
          autoCapitalize="none"
        />
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        ListEmptyComponent={loading === 'users' ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> : <Text style={styles.emptyText}>Aucun utilisateur</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, Shadow.card]}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.username}>{item.username} <Text style={[styles.roleText, { color: roleColors[item.role] }]}>{item.role}</Text></Text>
                <Text style={styles.emailText}>{item.email}</Text>
                <Text style={styles.meta}>{item.cat_coins} Coins · {item.real_money_dt} DT · {new Date(item.created_at).toLocaleDateString('fr-FR')}</Text>
              </View>
            </View>
            <View style={styles.roleBtns}>
              {(['fan', 'vip', 'admin'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleBtn, item.role === r && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                  onPress={() => setRole(item.id, r)}
                >
                  <Text style={[styles.roleBtnText, item.role === r && { color: Colors.white }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />
    </>
  );

  const renderNews = () => (
    <>
      <View style={[styles.formCard, Shadow.card]}>
        <Text style={styles.formTitle}>Nouvelle actualité</Text>
        <TextInput style={styles.input} placeholder="Titre" placeholderTextColor={Colors.textMuted} value={newNewsTitle} onChangeText={setNewNewsTitle} />
        <TextInput style={styles.input} placeholder="Extrait" placeholderTextColor={Colors.textMuted} value={newNewsExcerpt} onChangeText={setNewNewsExcerpt} multiline />
        <TouchableOpacity style={[styles.primaryBtn, !newNewsTitle.trim() && { opacity: 0.5 }]} onPress={createNews} disabled={!newNewsTitle.trim()}>
          <Text style={styles.primaryBtnText}>Publier</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={news}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        ListEmptyComponent={loading === 'news' ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> : <Text style={styles.emptyText}>Aucune actualité</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, Shadow.card]}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.username} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.meta}>{new Date(item.created_at).toLocaleDateString('fr-FR')} · {sportNames[item.sport_id] || 'Général'}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: item.published ? 'rgba(39,174,96,0.15)' : 'rgba(102,102,102,0.2)' }]}>
                <Text style={[styles.pillText, { color: item.published ? Colors.green : Colors.textMuted }]}>{item.published ? 'Publié' : 'Masqué'}</Text>
              </View>
            </View>
            <View style={styles.rowBtns}>
              <TouchableOpacity style={[styles.smallBtn, styles.ghostBtn]} onPress={() => toggleNews(item)}>
                <Text style={styles.ghostBtnText}>{item.published ? 'Masquer' : 'Publier'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, styles.dangerBtn]} onPress={() => deleteNews(item)}>
                <Text style={styles.dangerBtnText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </>
  );

  const renderMatches = () => (
    <>
      <View style={[styles.formCard, Shadow.card]}>
        <Text style={styles.formTitle}>Nouveau match (Football)</Text>
        <View style={styles.rowInputs}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Domicile" placeholderTextColor={Colors.textMuted} value={newHome} onChangeText={setNewHome} />
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Extérieur" placeholderTextColor={Colors.textMuted} value={newAway} onChangeText={setNewAway} />
        </View>
        <TextInput style={styles.input} placeholder="Date (ex: 2026-10-01T17:00:00Z)" placeholderTextColor={Colors.textMuted} value={newDate} onChangeText={setNewDate} />
        <TextInput style={styles.input} placeholder="Compétition" placeholderTextColor={Colors.textMuted} value={newComp} onChangeText={setNewComp} />
        <TouchableOpacity style={[styles.primaryBtn, (!newHome.trim() || !newAway.trim() || !newDate.trim()) && { opacity: 0.5 }]} onPress={createMatch} disabled={!newHome.trim() || !newAway.trim() || !newDate.trim()}>
          <Text style={styles.primaryBtnText}>Créer le match</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={matches}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        ListEmptyComponent={loading === 'matches' ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> : <Text style={styles.emptyText}>Aucun match</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, Shadow.card]}>
            <Text style={styles.username} numberOfLines={1}>{item.home_team} vs {item.away_team}</Text>
            <Text style={styles.meta}>{new Date(item.date).toLocaleString('fr-FR')} · {sportNames[item.sport_id] || 'Football'}</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Score</Text>
              <TextInput
                style={styles.scoreInput}
                keyboardType="number-pad"
                value={item.home_score == null ? '' : String(item.home_score)}
                onChangeText={(v) => setScore(item.id, 'home_score', v)}
                placeholder="–"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.scoreSep}>–</Text>
              <TextInput
                style={styles.scoreInput}
                keyboardType="number-pad"
                value={item.away_score == null ? '' : String(item.away_score)}
                onChangeText={(v) => setScore(item.id, 'away_score', v)}
                placeholder="–"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.rowBtns}>
              {(['upcoming', 'live', 'finished'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.smallBtn, item.status === st ? styles.primaryBtn : styles.ghostBtn]}
                  onPress={() => setMatchStatus(item.id, st)}
                >
                  <Text style={item.status === st ? styles.primaryBtnText : styles.ghostBtnText}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />
    </>
  );

  const tabs: { key: Section; label: string; icon: string }[] = [
    { key: 'stats', label: 'Stats', icon: 'stats-chart' },
    { key: 'users', label: 'Membres', icon: 'people' },
    { key: 'news', label: 'Actus', icon: 'newspaper' },
    { key: 'matches', label: 'Matchs', icon: 'football' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Administration</Text>
      </View>

      <View style={styles.tabs}>
        {tabs.map((t) => (
          <TouchableOpacity key={t.key} style={[styles.tab, section === t.key && styles.tabActive]} onPress={() => switchSection(t.key)}>
            <Ionicons name={t.icon as any} size={15} color={section === t.key ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.tabText, section === t.key && { color: Colors.white }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {section === 'stats' && renderStats()}
      {section === 'users' && renderUsers()}
      {section === 'news' && renderNews()}
      {section === 'matches' && renderMatches()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 52, paddingBottom: 8 },
  backBtn: { padding: 6, marginRight: 8 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surface },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 16, gap: 12 },
  statCard: { width: '31%', backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 14, alignItems: 'center', gap: 6 },
  statValue: { color: Colors.textPrimary, fontSize: FontSize.title, fontWeight: '800' },
  statLabel: { color: Colors.textSecondary, fontSize: FontSize.caption, textAlign: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 10, backgroundColor: Colors.surface, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.body },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 14, marginHorizontal: 16, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start' },
  username: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '700' },
  roleText: { fontSize: FontSize.caption },
  emailText: { color: Colors.textSecondary, fontSize: FontSize.label, marginTop: 2 },
  meta: { color: Colors.textMuted, fontSize: FontSize.caption, marginTop: 2 },
  roleBtns: { flexDirection: 'row', gap: 8, marginTop: 10 },
  roleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.btn, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceLight },
  roleBtnText: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '700' },
  formCard: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 14, margin: 16, marginBottom: 6 },
  formTitle: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '700', marginBottom: 10 },
  input: { backgroundColor: Colors.surfaceLight, borderRadius: Radius.btn, padding: 12, color: Colors.textPrimary, fontSize: FontSize.body, marginBottom: 8 },
  rowInputs: { flexDirection: 'row', gap: 8 },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 12, alignItems: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.body, fontWeight: '700' },
  pill: { borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: FontSize.caption, fontWeight: '700' },
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 10 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.btn },
  ghostBtn: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceLight },
  ghostBtnText: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '700' },
  dangerBtn: { backgroundColor: 'rgba(204,0,0,0.15)', borderWidth: 1, borderColor: Colors.primary },
  dangerBtnText: { color: Colors.primary, fontSize: FontSize.label, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  scoreLabel: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '700', width: 45 },
  scoreInput: { backgroundColor: Colors.surfaceLight, borderRadius: Radius.btn, width: 50, textAlign: 'center', color: Colors.textPrimary, fontSize: FontSize.body, paddingVertical: 6 },
  scoreSep: { color: Colors.textSecondary, fontSize: FontSize.body },
  emptyText: { color: Colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: FontSize.body },
});