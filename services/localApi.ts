import { API } from '../constants/api';

const API_BASE = API.BASE_URL;
const MAX_RETRIES = API.MAX_RETRIES;
const TIMEOUT_MS = API.TIMEOUT_MS;

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

class ApiClient {
  private token: string | null = null;
  private isConnected: boolean = true;
  private listeners: Set<(connected: boolean) => void> = new Set();

  onConnectionChange(cb: (connected: boolean) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  get connected() { return this.isConnected; }

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

  private async request(path: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal });
      clearTimeout(timeout);

      if (!this.isConnected) {
        this.isConnected = true;
        this.listeners.forEach(cb => cb(true));
      }

      const body = res.headers.get('content-type')?.includes('application/json')
        ? await res.json()
        : await res.text();

      if (!res.ok) {
        throw new ApiError(
          body?.error || body?.message || `Erreur ${res.status}`,
          res.status,
          body
        );
      }

      return body;
    } catch (err: any) {
      clearTimeout(timeout);

      if (err instanceof ApiError) throw err;

      const isNetworkError = err.name === 'AbortError' ||
        err.message?.includes('Network request failed') ||
        err.message?.includes('fetch');

      if (isNetworkError) {
        if (this.isConnected) {
          this.isConnected = false;
          this.listeners.forEach(cb => cb(false));
        }
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000));
          return this.request(path, options, retries - 1);
        }
        throw new ApiError('Impossible de contacter le serveur. Vérifiez votre connexion.', 0);
      }

      throw new ApiError(err.message || 'Erreur inconnue', 0);
    }
  }

  async get(path: string) { return this.request(path); }
  async post(path: string, body?: any) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); }
  async put(path: string, body?: any) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); }

  signIn = (email: string, password: string) => this.post('/auth/signin', { email, password });
  signUp = (email: string, password: string, username: string) => this.post('/auth/signup', { email, password, username });
  getCurrentUser = () => this.get('/auth/user');
  getBalances = () => this.get('/api/balances');
  getMatches = () => this.get('/api/matches');
  getTickets = () => this.get('/api/tickets');
  getPredictions = () => this.get('/api/predictions');
  submitPrediction = (matchId: number, home: number, away: number) => this.post('/api/predictions', { match_id: matchId, home_score: home, away_score: away });
  getFantasyTeam = () => this.get('/api/fantasy_teams');
  saveFantasyTeam = (formation: string, players: string[]) => this.post('/api/fantasy_teams', { formation, players });
  votePlayer = (matchId: number, player: string) => this.post('/api/player_votes', { match_id: matchId, player_name: player });
  getMissions = () => this.get('/api/missions');
  claimMission = (missionId: number) => this.post('/api/missions/claim', { mission_id: missionId });
  claimAllMissions = () => this.post('/api/missions/claim-all');
  getTransactions = () => this.get('/api/transactions');
  getNotifications = () => this.get('/api/notifications');
  markNotificationRead = (id: number) => this.post('/api/notifications/read', { id });
  markAllNotificationsRead = () => this.post('/api/notifications/read-all');
  getLeaderboard = () => this.get('/api/leaderboard');
  getDonationSummary = () => this.get('/api/donations/summary');
  getTopDonors = () => this.get('/api/donations/top');
  getCoinPacks = () => this.get('/api/coin_packs');
  buyCoinPack = (packId: number) => this.post('/api/coin_packs/buy', { pack_id: packId });
  convertGameMoney = (amountSca: number) => this.post('/api/convert', { amount_sca: amountSca });
  watchAd = () => this.post('/api/ads/watch');
  makeDonation = (amountDt: number) => this.post('/api/donations', { amount_dt: amountDt });
  buyTicket = (matchId: number, category: string) => this.post('/api/tickets/buy', { match_id: matchId, category });
  getSports = () => this.get('/api/sports');
  getSportMatches = (sportId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (sportId) params.set('sport_id', String(sportId));
    if (status) params.set('status', status);
    const q = params.toString();
    return this.get(`/api/sport_matches${q ? '?' + q : ''}`);
  };
  getSportMatch = (id: number) => this.get(`/api/sport_matches/${id}`);
  getNews = (sportId?: number) => this.get(`/api/news${sportId ? '?sport_id=' + sportId : ''}`);
  getNewsItem = (id: number) => this.get(`/api/news/${id}`);
  getPlayers = (sportId?: number) => this.get(`/api/players${sportId ? '?sport_id=' + sportId : ''}`);
  getPlayer = (id: number) => this.get(`/api/players/${id}`);
  getStandings = (sportId?: number, season?: string) => {
    const params = new URLSearchParams();
    if (sportId) params.set('sport_id', String(sportId));
    if (season) params.set('season', season);
    const q = params.toString();
    return this.get(`/api/standings${q ? '?' + q : ''}`);
  };
  getMedia = (sportId?: number, type?: string) => {
    const params = new URLSearchParams();
    if (sportId) params.set('sport_id', String(sportId));
    if (type) params.set('type', type);
    const q = params.toString();
    return this.get(`/api/media${q ? '?' + q : ''}`);
  };
  getLiveScores = () => this.get('/api/live_scores');
  getDashboard = () => this.get('/api/dashboard');
  getFanPosts = () => this.get('/api/fan_posts');
  createFanPost = (content: string) => this.post('/api/fan_posts', { content });
  likeFanPost = (id: number) => this.post(`/api/fan_posts/${id}/like`);
  replyFanPost = (id: number) => this.post(`/api/fan_posts/${id}/reply`);
}

export const api = new ApiClient();
