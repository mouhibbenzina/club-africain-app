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
    { id: 2, home_team: 'Club Africain', away_team: 'US Monastir', date: '2025-10-15T17:00:00Z', venue: 'Stade Olympique', is_live: false, viewers: 0, status: 'upcoming' as const },
    { id: 3, home_team: 'Club Africain', away_team: 'Étoile du Sahel', date: '2025-10-22T19:00:00Z', venue: 'Stade Olympique', is_live: false, viewers: 0, status: 'upcoming' as const },
  ],
  past: [
    { id: 4, home_team: 'Club Africain', away_team: 'CS Sfaxien', date: '2025-10-05T17:00:00Z', venue: 'Stade Olympique', is_live: false, viewers: 0, status: 'finished' as const, home_score: 2, away_score: 1 },
  ],
};

export const MOCK_SPORTS = [
  { id: 1, name: 'football', label: 'Football', icon: 'football', color: '#CC0000', enabled: 1 },
  { id: 2, name: 'handball', label: 'Handball', icon: 'handball', color: '#E67E22', enabled: 1 },
  { id: 3, name: 'basketball', label: 'Basketball', icon: 'basketball', color: '#3498DB', enabled: 1 },
  { id: 4, name: 'volleyball', label: 'Volleyball', icon: 'volleyball', color: '#9B59B6', enabled: 1 },
  { id: 5, name: 'boxing', label: 'Boxe', icon: 'fitness', color: '#27AE60', enabled: 1 },
];

export const MOCK_SPORT_MATCHES = [
  { id: 1, sport_id: 1, home_team: 'Club Africain', away_team: 'Espérance ST', date: new Date().toISOString(), venue: 'Stade Olympique', is_live: 1, viewers: 18700, status: 'live', competition: 'Ligue 1', sport_name: 'football', sport_label: 'Football', sport_color: '#CC0000', round: 'J27' },
  { id: 2, sport_id: 1, home_team: 'Club Africain', away_team: 'US Monastir', date: '2025-10-19T16:00:00Z', venue: 'Stade Olympique', is_live: 0, viewers: 0, status: 'upcoming', competition: 'Ligue 1', sport_name: 'football', sport_label: 'Football', sport_color: '#CC0000' },
  { id: 3, sport_id: 2, home_team: 'Club Africain', away_team: 'Espérance ST', date: '2025-10-18T15:00:00Z', venue: 'Salle Chérif Bellamine', is_live: 0, viewers: 0, status: 'upcoming', competition: 'Nationale A', sport_name: 'handball', sport_label: 'Handball', sport_color: '#E67E22' },
  { id: 4, sport_id: 3, home_team: 'Club Africain', away_team: 'US Monastir', date: '2025-10-20T17:00:00Z', venue: 'Salle de Radès', is_live: 0, viewers: 0, status: 'upcoming', competition: 'Nationale 1', sport_name: 'basketball', sport_label: 'Basketball', sport_color: '#3498DB' },
  { id: 5, sport_id: 2, home_team: 'Club Africain', away_team: 'AS Hammamet', date: '2025-10-12T16:00:00Z', venue: 'Salle Chérif Bellamine', is_live: 0, viewers: 0, status: 'finished', competition: 'Nationale A', sport_name: 'handball', sport_label: 'Handball', sport_color: '#E67E22', home_score: 28, away_score: 22 },
  { id: 6, sport_id: 3, home_team: 'ES Goulettoise', away_team: 'Club Africain', date: '2025-10-13T16:00:00Z', venue: 'Salle Goulette', is_live: 0, viewers: 0, status: 'finished', competition: 'Nationale 1', sport_name: 'basketball', sport_label: 'Basketball', sport_color: '#3498DB', home_score: 65, away_score: 71 },
];

export const MOCK_NEWS = [
  { id: 1, sport_id: 1, title: 'Le Club Africain reprend les commandes du championnat!', excerpt: "Grâce à une victoire maîtrisée 3-1 face à la JS Kairouanaise, notre cher Club Africain s'empare provisoirement de la tête du classement.", image_url: '/news/ca-victory.jpg', author: 'Mouhib Benzina', sport_label: 'Football', created_at: new Date().toISOString() },
  { id: 2, sport_id: 2, title: 'Handball : Large victoire du CA face à AS Hammamet', excerpt: 'Les handballeurs du Club Africain s\'imposent 28-22 dans un match maîtrisé de bout en bout.', image_url: '/news/ca-handball.jpg', author: 'Section Handball', sport_label: 'Handball', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, sport_id: null, title: "CA champion de Tunisie après 11 ans d'attente", excerpt: "Le Club Africain remporte le titre tant attendu après une saison exceptionnelle. Retour en Ligue des Champions de la CAF.", image_url: '/news/ca-champion.jpg', author: 'Club Africain Media', sport_label: null, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 4, sport_id: 3, title: 'Basket : Le CA s\'impose à l\'extérieur', excerpt: 'Belle performance des basketteurs du Club Africain qui ramènent la victoire de Goulette 71-65.', image_url: '/news/ca-basket.jpg', author: 'Section Basket', sport_label: 'Basketball', created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: 5, sport_id: 1, title: 'Mercato : Le CA recrute un milieu offensif', excerpt: 'Le Club Africain annonce la signature d\'un nouveau joueur pour renforcer l\'effectif en vue de la Ligue des Champions.', image_url: '/news/ca-mercato.jpg', author: 'Direction Sportive', sport_label: 'Football', created_at: new Date(Date.now() - 28800000).toISOString() },
];

export const MOCK_PLAYERS = [
  { id: 1, sport_id: 1, name: 'Houssem Ben Ali', number: 1, position: 'G', nationality: 'Tunisien', age: 28, sport_label: 'Football' },
  { id: 2, sport_id: 1, name: 'Raed Bouchniba', number: 13, position: 'D', nationality: 'Tunisien', age: 22, sport_label: 'Football' },
  { id: 3, sport_id: 1, name: 'Mohamed Amine Ben Hamida', number: 20, position: 'D', nationality: 'Tunisien', age: 29, sport_label: 'Football' },
  { id: 4, sport_id: 1, name: 'Hamza Jlassi', number: 6, position: 'D', nationality: 'Tunisien', age: 33, sport_label: 'Football' },
  { id: 5, sport_id: 1, name: 'Yassine Meriah', number: 5, position: 'D', nationality: 'Tunisien', age: 31, sport_label: 'Football' },
  { id: 6, sport_id: 1, name: 'Khalil Ben Rhouma', number: 8, position: 'M', nationality: 'Tunisien', age: 26, sport_label: 'Football' },
  { id: 7, sport_id: 1, name: 'Hamdi Ltaief', number: 10, position: 'M', nationality: 'Tunisien', age: 28, sport_label: 'Football' },
  { id: 8, sport_id: 1, name: 'Saber Zaddem', number: 19, position: 'M', nationality: 'Tunisien', age: 24, sport_label: 'Football' },
  { id: 9, sport_id: 1, name: 'Hamdi Hamdi', number: 7, position: 'A', nationality: 'Tunisien', age: 27, sport_label: 'Football' },
  { id: 10, sport_id: 1, name: 'Mourad Jebali', number: 9, position: 'A', nationality: 'Tunisien', age: 26, sport_label: 'Football' },
  { id: 11, sport_id: 2, name: 'Makram Missaoui', number: 12, position: 'G', nationality: 'Tunisien', age: 34, sport_label: 'Handball' },
  { id: 12, sport_id: 2, name: 'Achraf Saafi', number: 23, position: 'D', nationality: 'Tunisien', age: 30, sport_label: 'Handball' },
  { id: 13, sport_id: 2, name: 'Anouar Ben Abdallah', number: 7, position: 'A', nationality: 'Tunisien', age: 28, sport_label: 'Handball' },
];

export const MOCK_STANDINGS = [
  { id: 1, sport_id: 1, team_name: 'Espérance ST', played: 26, won: 20, drawn: 2, lost: 4, goals_for: 52, goals_against: 16, points: 62, season: '2025-2026', sport_label: 'Football' },
  { id: 2, sport_id: 1, team_name: 'Club Africain', played: 26, won: 18, drawn: 5, lost: 3, goals_for: 45, goals_against: 18, points: 59, season: '2025-2026', sport_label: 'Football' },
  { id: 3, sport_id: 1, team_name: 'Étoile du Sahel', played: 26, won: 16, drawn: 6, lost: 4, goals_for: 38, goals_against: 20, points: 54, season: '2025-2026', sport_label: 'Football' },
  { id: 4, sport_id: 1, team_name: 'CS Sfaxien', played: 26, won: 14, drawn: 5, lost: 7, goals_for: 35, goals_against: 25, points: 47, season: '2025-2026', sport_label: 'Football' },
  { id: 5, sport_id: 1, team_name: 'US Monastir', played: 26, won: 12, drawn: 7, lost: 7, goals_for: 30, goals_against: 24, points: 43, season: '2025-2026', sport_label: 'Football' },
  { id: 6, sport_id: 2, team_name: 'Espérance ST', played: 10, won: 9, drawn: 0, lost: 1, goals_for: 300, goals_against: 190, points: 27, season: '2025-2026', sport_label: 'Handball' },
  { id: 7, sport_id: 2, team_name: 'Club Africain', played: 10, won: 8, drawn: 1, lost: 1, goals_for: 280, goals_against: 210, points: 25, season: '2025-2026', sport_label: 'Handball' },
  { id: 8, sport_id: 2, team_name: 'AS Hammamet', played: 10, won: 6, drawn: 1, lost: 3, goals_for: 250, goals_against: 220, points: 19, season: '2025-2026', sport_label: 'Handball' },
];

export const MOCK_MEDIA = [
  { id: 1, sport_id: 1, type: 'highlight', title: 'CA vs EST - But de la victoire', thumbnail_url: '/thumbnails/ca-est-goal.jpg', duration: 45, sport_label: 'Football' },
  { id: 2, sport_id: 1, type: 'video', title: 'Interview Faouzi Benzarti après le match', thumbnail_url: '/thumbnails/benzarti-int.jpg', duration: 180, sport_label: 'Football' },
  { id: 3, sport_id: 1, type: 'highlight', title: 'Résumé CA vs CS Sfax 2-1', thumbnail_url: '/thumbnails/ca-sfax.jpg', duration: 120, sport_label: 'Football' },
  { id: 4, sport_id: 3, type: 'highlight', title: 'Basket : CA vs ES Goulette 71-65', thumbnail_url: '/thumbnails/ca-basket-hl.jpg', duration: 90, sport_label: 'Basketball' },
];

export const MOCK_FAN_POSTS = [
  { id: 1, user_id: 'u1', username: 'Clubiste_1920', content: 'FORZA CA !!! Ce soir on gagne ! 🔴⚪', likes: 24, replies: 5, created_at: new Date().toISOString() },
  { id: 2, user_id: 'u2', username: 'Africain_4ever', content: 'Quel match incroyable, les gars ont tout donné !', likes: 18, replies: 3, created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 3, user_id: 'u3', username: 'RedWhite', content: "Le nouvel entraîneur a changé l'équipe complètement", likes: 12, replies: 8, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 4, user_id: 'u4', username: 'CA_Tunis', content: 'Objectif LDC cette saison inchallah', likes: 30, replies: 6, created_at: new Date(Date.now() - 7200000).toISOString() },
];

export const MOCK_DASHBOARD = {
  liveMatches: [
    { id: 1, sport_id: 1, home_team: 'Club Africain', away_team: 'Espérance ST', date: new Date().toISOString(), venue: 'Stade Olympique', is_live: 1, viewers: 18700, status: 'live', competition: 'Ligue 1', sport_name: 'football', sport_label: 'Football', sport_color: '#CC0000' },
  ],
  news: MOCK_NEWS.slice(0, 3),
  nextMatch: { id: 2, sport_id: 1, home_team: 'Club Africain', away_team: 'US Monastir', date: '2025-10-19T16:00:00Z', venue: 'Stade Olympique', status: 'upcoming', competition: 'Ligue 1', sport_label: 'Football' },
  standings: MOCK_STANDINGS.filter(s => s.sport_id === 1).slice(0, 5),
  unreadNotifs: 3,
};

export const MOCK_TICKETS = [
  { id: 1, match_id: 2, category: 'VIP', price_dt: 60, tribune: 'B', rang: 12, siege: 45, qr_code: 'CA1920TV', used: false, match: { home_team: 'Club Africain', away_team: 'US Monastir', date: '2025-10-15T17:00:00Z', venue: 'Stade Olympique' } },
];

export const MOCK_MISSIONS = [
  { id: 1, mission_type: 'login', label: 'Se connecter', coins: 20, completed: true, claimed: false, progress: '1/1' },
  { id: 2, mission_type: 'watch_ad', label: 'Regarder 1 pub', coins: 50, completed: true, claimed: false, progress: '1/1' },
  { id: 3, mission_type: 'predict', label: 'Prédire un match', coins: 30, completed: false, claimed: false, progress: '0/1' },
  { id: 4, mission_type: 'team', label: 'Composer équipe', coins: 40, completed: false, claimed: false, progress: '0/1' },
  { id: 5, mission_type: 'share', label: "Partager l'app", coins: 25, completed: false, claimed: false, progress: '0/1' },
  { id: 6, mission_type: 'news_read', label: 'Lire une actualité', coins: 15, completed: false, claimed: false, progress: '0/3' },
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
  { id: 6, title: 'Rappel : Match CA vs EST à 19h', type: 'match' as const, read: false, created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: 7, title: 'Nouvelle actualité publiée', type: 'general' as const, read: true, created_at: new Date(Date.now() - 21600000).toISOString() },
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
