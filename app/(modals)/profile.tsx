import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Colors, FontSize, Radius } from '../../constants/theme';
import { API, testConnection } from '../../constants/api';
import { api } from '../../services/localApi';

export default function ProfileModal() {
  const { user, signOut, updateUser } = useAuthStore();
  const [connStatus, setConnStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(api.connected);

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const unsub = api.onConnectionChange((v) => setConnected(v));
    return () => { unsub(); };
  }, []);

  const startEdit = () => {
    setUsername(user?.username || '');
    setFullName(user?.full_name || '');
    setPhone(user?.phone || '');
    setAvatar(user?.avatar || '');
    setSaveMsg(null);
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    if (username.trim().length < 3) {
      setSaveMsg("Le nom d'utilisateur doit contenir au moins 3 caractères");
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await api.updateProfile({
        username: username.trim(),
        full_name: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        avatar: avatar.trim() || '',
      });
      updateUser(res);
      setSaveMsg('Profil mis à jour avec succès');
      setEditing(false);
    } catch (e: any) {
      setSaveMsg(e.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw.length < 8 || !/[A-Za-z]/.test(newPw) || !/[0-9]/.test(newPw)) {
      setPwMsg({ ok: false, text: 'Le nouveau mot de passe doit contenir 8 caractères minimum, dont une lettre et un chiffre' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: 'Les nouveaux mots de passe ne correspondent pas' });
      return;
    }
    setSavingPw(true);
    setPwMsg(null);
    try {
      await api.changePassword(curPw, newPw);
      setPwMsg({ ok: true, text: 'Mot de passe mis à jour. Reconnectez-vous.' });
      setCurPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) {
      setPwMsg({ ok: false, text: e.message || 'Erreur lors du changement de mot de passe' });
    } finally {
      setSavingPw(false);
    }
  };

  const [sendingVerify, setSendingVerify] = useState(false);

  const resendVerify = async () => {
    setSendingVerify(true);
    setSaveMsg(null);
    try {
      await api.resendVerify();
      setSaveMsg('Email de confirmation renvoyé. Vérifiez votre boîte mail.');
    } catch (e: any) {
      setSaveMsg(e.message || 'Erreur lors du renvoi');
    } finally {
      setSendingVerify(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setConnStatus(null);
    const result = await testConnection();
    setConnStatus(result);
    setTesting(false);
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.avatar || user?.username || 'U')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>{user?.username || 'Utilisateur'}</Text>
          {user?.full_name ? <Text style={styles.fullName}>{user.full_name}</Text> : null}
          <Text style={styles.email}>{user?.email || ''}</Text>
          <Text style={styles.role}>{user?.role === 'admin' ? 'Administrateur' : user?.role === 'vip' ? 'Supporteur VIP' : 'Vrai supporter'}</Text>
          {user && !user.email_verified ? (
            <View style={styles.verifyRow}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.gold} />
              <Text style={styles.verifyText}>Email non confirmée</Text>
              <TouchableOpacity onPress={resendVerify} disabled={sendingVerify}>
                <Text style={styles.editLink}>{sendingVerify ? '...' : 'Renvoyer'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {saveMsg ? <Text style={styles.saveMsg}>{saveMsg}</Text> : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes informations</Text>
            {!editing ? (
              <TouchableOpacity onPress={startEdit}>
                <Text style={styles.editLink}>Modifier</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {editing ? (
            <>
              <TextInput style={styles.input} placeholder="Nom d'utilisateur" placeholderTextColor={Colors.textSecondary} value={username} onChangeText={setUsername} autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Nom complet (optionnel)" placeholderTextColor={Colors.textSecondary} value={fullName} onChangeText={setFullName} />
              <TextInput style={styles.input} placeholder="N° de téléphone (optionnel)" placeholderTextColor={Colors.textSecondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <TextInput style={styles.input} placeholder="Avatar (ex: CA, A, ⚽)" placeholderTextColor={Colors.textSecondary} value={avatar} onChangeText={setAvatar} maxLength={8} />
              {saveMsg ? <Text style={[styles.inlineMsg, { color: saveMsg.startsWith('Profil') ? Colors.green : Colors.primary }]}>{saveMsg}</Text> : null}
              <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.primaryBtn, saving && styles.btnDisabled]} onPress={handleSaveProfile} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.primaryBtnText}>Enregistrer</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.ghostBtn} onPress={() => { setEditing(false); setSaveMsg(null); }}>
                  <Text style={styles.ghostBtnText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{user?.email || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nom complet</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{user?.full_name || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{user?.phone || '—'}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changer le mot de passe</Text>
          <TextInput style={styles.input} placeholder="Mot de passe actuel" placeholderTextColor={Colors.textSecondary} value={curPw} onChangeText={setCurPw} secureTextEntry />
          <TextInput style={styles.input} placeholder="Nouveau mot de passe (min. 6)" placeholderTextColor={Colors.textSecondary} value={newPw} onChangeText={setNewPw} secureTextEntry />
          <TextInput style={styles.input} placeholder="Confirmer le nouveau mot de passe" placeholderTextColor={Colors.textSecondary} value={confirmPw} onChangeText={setConfirmPw} secureTextEntry />
          {pwMsg ? <Text style={[styles.inlineMsg, { color: pwMsg.ok ? Colors.green : Colors.primary }]}>{pwMsg.text}</Text> : null}
          <TouchableOpacity style={[styles.primaryBtn, savingPw && styles.btnDisabled]} onPress={handleChangePassword} disabled={savingPw}>
            {savingPw ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.primaryBtnText}>Mettre à jour</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Matchs vus', value: '48' },
            { label: 'Prédictions', value: '32' },
            { label: 'Score moyen', value: '85%' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.menuSection}>
          {([
            { label: 'Mes amis', onPress: () => router.push('/friends') },
            { label: 'Mes tickets', onPress: () => {} },
            { label: 'Mes équipes', onPress: () => {} },
            { label: 'Mes récompenses', onPress: () => {} },
          ].concat(
            user?.role === 'admin'
              ? [{ label: 'Administration', onPress: () => router.push('/admin') }]
              : []
          )).map((item, idx) => (
            <TouchableOpacity key={item.label + idx} style={styles.menuRow} onPress={item.onPress}>
              <Text style={styles.menuText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.menuSection}>
          {['Paramètres', 'Aide & Support'].map((item) => (
            <TouchableOpacity key={item} style={styles.menuRow}>
              <Text style={styles.menuText}>{item}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>🛡️ Diagnostic connexion</Text>
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Statut</Text>
            <View style={[styles.statusDot, { backgroundColor: connected ? Colors.green : Colors.primary }]} />
            <Text style={styles.debugValue}>{connected ? 'Connecté' : 'Déconnecté'}</Text>
          </View>
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Serveur</Text>
            <Text style={styles.debugValue} numberOfLines={1}>{API.BASE_URL}</Text>
          </View>
          {connStatus && (
            <Text style={[styles.debugMessage, { color: connStatus.ok ? Colors.green : Colors.primary }]}>
              {connStatus.message}
            </Text>
          )}
          <TouchableOpacity style={styles.testBtn} onPress={handleTestConnection} disabled={testing}>
            {testing ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.testBtnText}>Tester la connexion</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingTop: 60 },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 20 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  profileCard: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: Colors.white, fontSize: 24, fontWeight: '900' },
  username: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  fullName: { color: Colors.textSecondary, fontSize: FontSize.body, marginTop: 2 },
  email: { color: Colors.textSecondary, fontSize: FontSize.body, marginTop: 2 },
  role: { color: Colors.textSecondary, fontSize: FontSize.caption, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 },
  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: 'rgba(237,170,0,0.12)', borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  verifyText: { color: Colors.gold, fontSize: FontSize.label, fontWeight: '700', flex: 1 },
  saveMsg: { color: Colors.textSecondary, fontSize: FontSize.label, marginTop: 10, textAlign: 'center' },
  section: { marginHorizontal: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '700', marginBottom: 8 },
  editLink: { color: Colors.primary, fontSize: FontSize.body, fontWeight: '700' },
  infoCard: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { color: Colors.textSecondary, fontSize: FontSize.body, flex: 1 },
  infoValue: { color: Colors.textPrimary, fontSize: FontSize.body, flex: 2, textAlign: 'right', fontWeight: '600' },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.btn, padding: 14, color: Colors.textPrimary, fontSize: FontSize.body, marginBottom: 10 },
  inlineMsg: { fontSize: FontSize.caption, marginBottom: 8 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 14, alignItems: 'center', flex: 1 },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.body, fontWeight: '700' },
  ghostBtn: { borderRadius: Radius.btn, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary, flex: 1 },
  ghostBtnText: { color: Colors.primary, fontSize: FontSize.body, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: Radius.card, padding: 16, marginBottom: 20 },
  statItem: { alignItems: 'center' },
  statValue: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '800' },
  statLabel: { color: Colors.textSecondary, fontSize: FontSize.caption },
  menuSection: { marginHorizontal: 16, marginBottom: 12 },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 16, marginBottom: 8 },
  menuText: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600' },
  logoutBtn: { backgroundColor: Colors.surface, borderRadius: Radius.card, marginHorizontal: 16, padding: 16, alignItems: 'center', marginTop: 12 },
  logoutText: { color: Colors.primary, fontSize: FontSize.subtitle, fontWeight: '700' },
  debugSection: { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 16 },
  debugTitle: { color: Colors.textSecondary, fontSize: FontSize.caption, marginBottom: 12, fontWeight: '700', textTransform: 'uppercase' },
  debugRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  debugLabel: { color: Colors.textSecondary, fontSize: FontSize.body, flex: 1 },
  debugValue: { color: Colors.textPrimary, fontSize: FontSize.body, flex: 2, textAlign: 'right' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  debugMessage: { fontSize: FontSize.caption, marginTop: 4, marginBottom: 8 },
  testBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 12, alignItems: 'center', marginTop: 8 },
  testBtnText: { color: Colors.white, fontSize: FontSize.body, fontWeight: '700' },
});