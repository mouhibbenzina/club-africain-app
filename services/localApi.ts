import Constants from 'expo-constants';

const DEV_API = 'http://10.54.30.98:3001';
const PROD_API = 'https://club-africain-app.onrender.com';

const API_BASE = __DEV__ ? DEV_API : PROD_API;

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (token) {
      try { require('./secureStorage').SecureStorage.setToken(token); } catch {}
    }
  }

  async loadToken() {
    try {
      const t = await require('./secureStorage').SecureStorage.getToken();
      if (t) this.token = t;
    } catch {}
  }

  private async request(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  }

  get(path: string) { return this.request(path); }
  post(path: string, body?: any) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); }
  put(path: string, body?: any) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); }

  signIn(email: string, password: string) { return this.post('/auth/signin', { email, password }); }
  signUp(email: string, password: string, username: string) { return this.post('/auth/signup', { email, password, username }); }
  getCurrentUser() { return this.get('/auth/user'); }
  getBalances() { return this.get('/api/balances'); }
  getMatches() { return this.get('/api/matches'); }
  getTickets() { return this.get('/api/tickets'); }
  getPredictions() { return this.get('/api/predictions'); }
  submitPrediction(matchId: number, home: number, away: number) { return this.post('/api/predictions', { match_id: matchId, home_score: home, away_score: away }); }
  getFantasyTeam() { return this.get('/api/fantasy_teams'); }
  saveFantasyTeam(formation: string, players: string[]) { return this.post('/api/fantasy_teams', { formation, players }); }
  votePlayer(matchId: number, player: string) { return this.post('/api/player_votes', { match_id: matchId, player_name: player }); }
  getMissions() { return this.get('/api/missions'); }
  claimMission(missionId: number) { return this.post('/api/missions/claim', { mission_id: missionId }); }
  claimAllMissions() { return this.post('/api/missions/claim-all'); }
  getTransactions() { return this.get('/api/transactions'); }
  getNotifications() { return this.get('/api/notifications'); }
  markNotificationRead(id: number) { return this.post('/api/notifications/read', { id }); }
  markAllNotificationsRead() { return this.post('/api/notifications/read-all'); }
  getLeaderboard() { return this.get('/api/leaderboard'); }
  getDonationSummary() { return this.get('/api/donations/summary'); }
  getTopDonors() { return this.get('/api/donations/top'); }
  getCoinPacks() { return this.get('/api/coin_packs'); }
  buyCoinPack(packId: number) { return this.post('/api/coin_packs/buy', { pack_id: packId }); }
  convertGameMoney(amountSca: number) { return this.post('/api/convert', { amount_sca: amountSca }); }
  watchAd() { return this.post('/api/ads/watch'); }
  makeDonation(amountDt: number) { return this.post('/api/donations', { amount_dt: amountDt }); }
  buyTicket(matchId: number, category: string) { return this.post('/api/tickets/buy', { match_id: matchId, category }); }
}

export const api = new ApiClient();
