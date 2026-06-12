import { Platform } from 'react-native';
import Constants from 'expo-constants';

const EXTRA = (Constants.expoConfig as any)?.extra || {};

const DEFAULT_SERVER_IP = EXTRA.serverIp || '10.54.30.98';
const SERVER_PORT = EXTRA.serverPort || 3001;

function getBaseUrl(): string {
  if (EXTRA.apiUrl) return EXTRA.apiUrl;

  const useLocalhost = !Constants.isDevice && Platform.OS === 'ios';
  const useEmulatorIp = !Constants.isDevice && Platform.OS === 'android';

  if (useLocalhost) return `http://localhost:${SERVER_PORT}`;
  if (useEmulatorIp) return `http://10.0.2.2:${SERVER_PORT}`;

  return `http://${DEFAULT_SERVER_IP}:${SERVER_PORT}`;
}

export const API = {
  BASE_URL: getBaseUrl(),
  TIMEOUT_MS: Number(EXTRA.apiTimeout) || 8000,
  MAX_RETRIES: Number(EXTRA.apiRetries) || 2,
  get sports() { return `${this.BASE_URL}/api/sports`; },
  get dashboard() { return `${this.BASE_URL}/api/dashboard`; },
  get matches() { return `${this.BASE_URL}/api/matches`; },
  get sportMatches() { return `${this.BASE_URL}/api/sport_matches`; },
  get news() { return `${this.BASE_URL}/api/news`; },
  get players() { return `${this.BASE_URL}/api/players`; },
  get standings() { return `${this.BASE_URL}/api/standings`; },
  get media() { return `${this.BASE_URL}/api/media`; },
  get fanPosts() { return `${this.BASE_URL}/api/fan_posts`; },
  get tickets() { return `${this.BASE_URL}/api/tickets`; },
  get predictions() { return `${this.BASE_URL}/api/predictions`; },
  get fantasyTeams() { return `${this.BASE_URL}/api/fantasy_teams`; },
  get missions() { return `${this.BASE_URL}/api/missions`; },
  get playerVotes() { return `${this.BASE_URL}/api/player_votes`; },
  get leaderboard() { return `${this.BASE_URL}/api/leaderboard`; },
  get transactions() { return `${this.BASE_URL}/api/transactions`; },
  get notifications() { return `${this.BASE_URL}/api/notifications`; },
  get auth() { return `${this.BASE_URL}/auth`; },
  get convert() { return `${this.BASE_URL}/api/convert`; },
  get donations() { return `${this.BASE_URL}/api/donations`; },
  get coinPacks() { return `${this.BASE_URL}/api/coin_packs`; },
  get ads() { return `${this.BASE_URL}/api/ads`; },
  get liveScores() { return `${this.BASE_URL}/api/live_scores`; },
  get balances() { return `${this.BASE_URL}/api/balances`; },
};

export async function testConnection(url?: string): Promise<{ ok: boolean; message: string }> {
  const base = url || API.BASE_URL;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${base}/api/sports`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) return { ok: true, message: `✅ Serveur OK (${base})` };
    return { ok: false, message: `❌ Erreur ${res.status} (${base})` };
  } catch (e: any) {
    return { ok: false, message: `❌ ${e.message || 'Connexion refusée'} (${base})` };
  }
}
