export const MOCK_USER = {
  id: 'mock-user-1',
  username: 'Clubiste_1920',
  avatar: undefined,
  role: 'fan' as const,
};

export const MOCK_BALANCE = {
  cat_coins: 12450,
  real_money_dt: 35,
  game_money_sca: 250000,
};

export const MOCK_MATCHES = {
  live: {
    id: 1,
    home_team: 'Club Africain',
    away_team: 'Espérance ST',
    date: new Date().toISOString(),
    venue: 'Stade Olympique',
    is_live: true,
    viewers: 23400,
    status: 'live' as const,
  },
  upcoming: [
    { id: 2, home_team: 'Club Africain', away_team: 'US Monastir', date: '2024-06-15T17:00:00Z', venue: 'Stade Olympique', is_live: false, viewers: 0, status: 'upcoming' as const },
    { id: 3, home_team: 'Club Africain', away_team: 'Étoile du Sahel', date: '2024-06-22T19:00:00Z', venue: 'Stade Olympique', is_live: false, viewers: 0, status: 'upcoming' as const },
  ],
  past: [
    { id: 4, home_team: 'Club Africain', away_team: 'CS Sfaxien', date: '2024-05-20T17:00:00Z', venue: 'Stade Olympique', is_live: false, viewers: 0, status: 'finished' as const, home_score: 2, away_score: 1 },
  ],
};

export const MOCK_TICKETS = [
  { id: 1, match_id: 2, category: 'VIP', price_dt: 60, tribune: 'B', rang: 12, siege: 45, qr_code: 'CA1920TV', used: false, match: { home_team: 'Club Africain', away_team: 'US Monastir', date: '2024-06-15T17:00:00Z', venue: 'Stade Olympique' } },
];

export const MOCK_MISSIONS = [
  { id: 1, mission_type: 'login', label: 'Se connecter', coins: 20, completed: true, claimed: false, progress: '1/1' },
  { id: 2, mission_type: 'watch_ad', label: 'Regarder 1 pub', coins: 50, completed: true, claimed: false, progress: '1/1' },
  { id: 3, mission_type: 'predict', label: 'Prédire un match', coins: 30, completed: false, claimed: false, progress: '0/1' },
  { id: 4, mission_type: 'team', label: 'Composer équipe', coins: 40, completed: false, claimed: false, progress: '0/1' },
  { id: 5, mission_type: 'share', label: "Partager l'app", coins: 25, completed: false, claimed: false, progress: '0/1' },
];

export const MOCK_LEADERBOARD = [
  { user_id: 'u1', username: 'Clubiste_1920', cat_coins: 12450, rank: 1 },
  { user_id: 'u2', username: 'Africain_4ever', cat_coins: 11200, rank: 2 },
  { user_id: 'u3', username: 'RedWhite', cat_coins: 10300, rank: 3 },
  { user_id: 'u4', username: 'CA_Tunis', cat_coins: 9850, rank: 4 },
  { user_id: 'u5', username: 'LegendCA', cat_coins: 8700, rank: 5 },
  { user_id: 'u6', username: 'Sans Gêne', cat_coins: 7600, rank: 6 },
  { user_id: 'u7', username: 'Winn_CA', cat_coins: 6900, rank: 7 },
];

export const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'Vous avez gagné 50 Coins', type: 'general' as const, read: false, created_at: new Date(Date.now() - 120000).toISOString() },
  { id: 2, title: 'Mission quotidienne complétée', type: 'general' as const, read: false, created_at: new Date(Date.now() - 600000).toISOString() },
  { id: 3, title: 'Début match CA vs USM', type: 'match' as const, read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 4, title: 'Vous êtes dans le Top 10', type: 'game' as const, read: true, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 5, title: 'Nouvelle offre disponible', type: 'offer' as const, read: true, created_at: new Date(Date.now() - 10800000).toISOString() },
];

export const MOCK_TRANSACTIONS = [
  { id: 1, type: 'earn', currency: 'CAT', amount: 50, description: 'Mission: Regarder 1 pub', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, type: 'earn', currency: 'CAT', amount: 20, description: 'Mission: Se connecter', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 3, type: 'convert', currency: 'SCA', amount: 100000, description: 'Conversion en Coins', created_at: new Date(Date.now() - 86400000).toISOString() },
];

export const MOCK_FANTASY_TEAM = {
  formation: '4-3-3',
  players: ['Hassen', 'Abdi', 'Yahia', 'Ben Y', 'Drager', 'Ltaief', 'BenR', 'Khalil', 'Hamdi', 'Bguir', 'Jebali'],
};
