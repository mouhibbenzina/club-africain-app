const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'club_africain.db');
const JWT_SECRET = crypto.randomBytes(32).toString('hex');

app.use(cors());
app.use(express.json());

// ========== Database Setup ==========
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      avatar TEXT,
      role TEXT DEFAULT 'fan' CHECK (role IN ('fan', 'vip', 'admin')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS balances (
      user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      cat_coins INTEGER DEFAULT 0,
      real_money_dt REAL DEFAULT 0,
      game_money_sca INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      date TEXT NOT NULL,
      venue TEXT,
      is_live INTEGER DEFAULT 0,
      viewers INTEGER DEFAULT 0,
      home_score INTEGER,
      away_score INTEGER,
      status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'finished')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profiles(id),
      match_id INTEGER NOT NULL REFERENCES matches(id),
      category TEXT NOT NULL,
      price_dt REAL NOT NULL,
      tribune TEXT,
      rang INTEGER,
      siege INTEGER,
      qr_code TEXT UNIQUE,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profiles(id),
      match_id INTEGER NOT NULL REFERENCES matches(id),
      home_score INTEGER NOT NULL,
      away_score INTEGER NOT NULL,
      points_earned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, match_id)
    );

    CREATE TABLE IF NOT EXISTS fantasy_teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profiles(id),
      name TEXT DEFAULT 'Mon Équipe',
      formation TEXT DEFAULT '4-3-3',
      players TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS player_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profiles(id),
      match_id INTEGER NOT NULL REFERENCES matches(id),
      player_name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, match_id)
    );

    CREATE TABLE IF NOT EXISTS missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profiles(id),
      mission_type TEXT NOT NULL,
      label TEXT NOT NULL,
      coins INTEGER NOT NULL,
      completed INTEGER DEFAULT 0,
      claimed INTEGER DEFAULT 0,
      progress TEXT DEFAULT '0/1',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, mission_type)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profiles(id),
      type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'convert', 'purchase', 'donation')),
      currency TEXT NOT NULL CHECK (currency IN ('DT', 'SCA', 'CAT')),
      amount REAL NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profiles(id),
      title TEXT NOT NULL,
      type TEXT DEFAULT 'general' CHECK (type IN ('general', 'match', 'game', 'offer')),
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profiles(id),
      amount_dt REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS coin_packs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coins INTEGER NOT NULL,
      price_dt REAL NOT NULL,
      bonus_pct INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      icon TEXT,
      color TEXT DEFAULT '#CC0000',
      enabled INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS sport_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sport_id INTEGER NOT NULL REFERENCES sports(id),
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      date TEXT NOT NULL,
      venue TEXT,
      is_live INTEGER DEFAULT 0,
      viewers INTEGER DEFAULT 0,
      home_score INTEGER,
      away_score INTEGER,
      status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'finished')),
      competition TEXT,
      round TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sport_id INTEGER REFERENCES sports(id),
      title TEXT NOT NULL,
      excerpt TEXT,
      content TEXT,
      image_url TEXT,
      author TEXT,
      published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sport_id INTEGER NOT NULL REFERENCES sports(id),
      name TEXT NOT NULL,
      number INTEGER,
      position TEXT,
      nationality TEXT,
      age INTEGER,
      image_url TEXT,
      stats TEXT DEFAULT '{}',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS standings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sport_id INTEGER NOT NULL REFERENCES sports(id),
      team_name TEXT NOT NULL,
      played INTEGER DEFAULT 0,
      won INTEGER DEFAULT 0,
      drawn INTEGER DEFAULT 0,
      lost INTEGER DEFAULT 0,
      goals_for INTEGER DEFAULT 0,
      goals_against INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      season TEXT,
      UNIQUE(sport_id, team_name, season)
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sport_id INTEGER REFERENCES sports(id),
      type TEXT CHECK (type IN ('video', 'image', 'highlight')),
      title TEXT NOT NULL,
      url TEXT,
      thumbnail_url TEXT,
      duration INTEGER,
      published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fan_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profiles(id),
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      replies INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function seedDB() {
  const count = db.prepare('SELECT COUNT(*) as c FROM profiles').get();
  if (count.c > 0) return;

  const insertProfile = db.prepare('INSERT OR IGNORE INTO profiles (id, username, role) VALUES (?, ?, ?)');
  const insertBalance = db.prepare('INSERT OR IGNORE INTO balances (user_id, cat_coins, real_money_dt, game_money_sca) VALUES (?, ?, ?, ?)');
  const insertMatch = db.prepare('INSERT INTO matches (home_team, away_team, date, venue, is_live, viewers, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertSportMatch = db.prepare('INSERT INTO sport_matches (sport_id, home_team, away_team, date, venue, is_live, viewers, status, competition, home_score, away_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertMission = db.prepare('INSERT OR IGNORE INTO missions (user_id, mission_type, label, coins, completed, claimed, progress) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertPack = db.prepare('INSERT OR IGNORE INTO coin_packs (id, coins, price_dt, bonus_pct) VALUES (?, ?, ?, ?)');
  const insertNotif = db.prepare('INSERT INTO notifications (user_id, title, type) VALUES (?, ?, ?)');
  const insertSport = db.prepare('INSERT OR IGNORE INTO sports (id, name, label, icon, color) VALUES (?, ?, ?, ?, ?)');
  const insertNews = db.prepare('INSERT INTO news (sport_id, title, excerpt, image_url, author) VALUES (?, ?, ?, ?, ?)');
  const insertPlayer = db.prepare('INSERT INTO players (sport_id, name, number, position, nationality, age) VALUES (?, ?, ?, ?, ?, ?)');
  const insertStanding = db.prepare('INSERT OR IGNORE INTO standings (sport_id, team_name, played, won, drawn, lost, goals_for, goals_against, points, season) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertMedia = db.prepare('INSERT INTO media (sport_id, type, title, thumbnail_url, duration) VALUES (?, ?, ?, ?, ?)');

  const tx = db.transaction(() => {
    insertProfile.run('demo-user', 'Clubiste_1920', 'fan');
    insertBalance.run('demo-user', 12450, 35, 250000);

    insertMatch.run('Club Africain', 'Espérance ST', new Date().toISOString(), 'Stade Olympique', 1, 23400, 'live');
    insertMatch.run('Club Africain', 'US Monastir', '2025-10-15T17:00:00Z', 'Stade Olympique', 0, 0, 'upcoming');
    insertMatch.run('Club Africain', 'Étoile du Sahel', '2025-10-22T19:00:00Z', 'Stade Olympique', 0, 0, 'upcoming');
    insertMatch.run('Club Africain', 'CS Sfaxien', '2025-10-05T17:00:00Z', 'Stade Olympique', 0, 0, 'finished', 2, 1);

    // Sports
    insertSport.run(1, 'football', 'Football', 'football', '#CC0000');
    insertSport.run(2, 'handball', 'Handball', 'handball', '#E67E22');
    insertSport.run(3, 'basketball', 'Basketball', 'basketball', '#3498DB');
    insertSport.run(4, 'volleyball', 'Volleyball', 'volleyball', '#9B59B6');
    insertSport.run(5, 'boxing', 'Boxe', 'fitness', '#27AE60');

    // Multi-sport matches
    const now = new Date().toISOString();
    insertSportMatch.run(1, 'Club Africain', 'Espérance ST', now, 'Stade Olympique', 1, 18700, 'live', 'Ligue 1', null, null);
    insertSportMatch.run(1, 'Club Africain', 'US Monastir', '2025-10-19T16:00:00Z', 'Stade Olympique', 0, 0, 'upcoming', 'Ligue 1', null, null);
    insertSportMatch.run(1, 'CS Sfaxien', 'Club Africain', '2025-10-26T18:00:00Z', 'Stade 4 Août', 0, 0, 'upcoming', 'Ligue 1', null, null);
    insertSportMatch.run(2, 'Club Africain', 'Espérance ST', '2025-10-18T15:00:00Z', 'Salle Chérif Bellamine', 0, 0, 'upcoming', 'Championnat National A', null, null);
    insertSportMatch.run(2, 'Club Africain', 'AS Hammamet', '2025-10-12T16:00:00Z', 'Salle Chérif Bellamine', 0, 0, 'finished', 'Championnat National A', 28, 22);
    insertSportMatch.run(3, 'Club Africain', 'US Monastir', '2025-10-20T17:00:00Z', 'Salle de Radès', 0, 0, 'upcoming', 'Nationale 1', null, null);
    insertSportMatch.run(3, 'ES Goulettoise', 'Club Africain', '2025-10-13T16:00:00Z', 'Salle Goulette', 0, 0, 'finished', 'Nationale 1', 65, 71);
    insertSportMatch.run(4, 'Club Africain', 'ES Tunis', '2025-10-21T16:00:00Z', 'Salle de Radès', 0, 0, 'upcoming', 'Nationale 1', null, null);

    // News
    insertNews.run(1, 'Le Club Africain reprend les commandes du championnat!', 'Grâce à une victoire maîtrisée 3-1 face à la JS Kairouanaise, notre cher Club Africain s\'empare provisoirement de la tête du classement.', '/news/ca-victory.jpg', 'Mouhib Benzina');
    insertNews.run(1, 'CA champion de Tunisie 2025-2026 après 11 ans', 'Le Club Africain remporte le titre tant attendu après une saison exceptionnelle. Retour en Ligue des Champions de la CAF.', '/news/ca-champion.jpg', 'Club Africain Media');
    insertNews.run(2, 'Handball : Large victoire du CA face à AS Hammamet', 'Les handballeurs du Club Africain s\'imposent 28-22 dans un match maîtrisé de bout en bout.', '/news/ca-handball.jpg', 'Section Handball');
    insertNews.run(3, 'Basket : Le CA s\'impose à l\'extérieur', 'Belle performance des basketteurs du Club Africain qui ramènent la victoire de Goulette 71-65.', '/news/ca-basket.jpg', 'Section Basket');
    insertNews.run(1, 'Mercato : Le CA recrute un milieu offensif', 'Le Club Africain annonce la signature d\'un nouveau joueur pour renforcer l\'effectif en vue de la Ligue des Champions.', '/news/ca-mercato.jpg', 'Direction Sportive');

    // Players - Football
    const footballPlayers = [
      ['Houssem Ben Ali', 1, 'G', 'Tunisien', 28],
      ['Mohamed Sedki Debchi', 26, 'G', 'Tunisien', 25],
      ['Raed Bouchniba', 13, 'D', 'Tunisien', 22],
      ['Mohamed Amine Ben Hamida', 20, 'D', 'Tunisien', 29],
      ['Hamza Jlassi', 6, 'D', 'Tunisien', 33],
      ['Yassine Meriah', 5, 'D', 'Tunisien', 31],
      ['Aymen Ben Mohamed', 22, 'D', 'Tunisien', 30],
      ['Mohamed Amine Tougai', 15, 'D', 'Algérien', 25],
      ['Khalil Ben Rhouma', 8, 'M', 'Tunisien', 26],
      ['Hamdi Ltaief', 10, 'M', 'Tunisien', 28],
      ['Mohamed Bguir', 11, 'M', 'Tunisien', 29],
      ['Saber Zaddem', 19, 'M', 'Tunisien', 24],
      ['Hamdi Hamdi', 7, 'A', 'Tunisien', 27],
      ['Mourad Jebali', 9, 'A', 'Tunisien', 26],
      ['Youssef Hamza', 17, 'A', 'Tunisien', 23],
    ];
    for (const [name, number, pos, nat, age] of footballPlayers) {
      insertPlayer.run(1, name, number, pos, nat, age);
    }

    // Players - Handball
    const handballPlayers = [
      ['Makram Missaoui', 12, 'G', 'Tunisien', 34],
      ['Achraf Saafi', 23, 'D', 'Tunisien', 30],
      ['Anouar Ben Abdallah', 7, 'A', 'Tunisien', 28],
      ['Mohamed Soussi', 14, 'M', 'Tunisien', 27],
      ['Yassine Belkhir', 9, 'A', 'Tunisien', 26],
    ];
    for (const [name, number, pos, nat, age] of handballPlayers) {
      insertPlayer.run(2, name, number, pos, nat, age);
    }

    // Standings - Ligue 1
    insertStanding.run(1, 'Club Africain', 26, 18, 5, 3, 45, 18, 59, '2025-2026');
    insertStanding.run(1, 'Espérance ST', 26, 20, 2, 4, 52, 16, 62, '2025-2026');
    insertStanding.run(1, 'Étoile du Sahel', 26, 16, 6, 4, 38, 20, 54, '2025-2026');
    insertStanding.run(1, 'CS Sfaxien', 26, 14, 5, 7, 35, 25, 47, '2025-2026');
    insertStanding.run(1, 'US Monastir', 26, 12, 7, 7, 30, 24, 43, '2025-2026');
    insertStanding.run(1, 'Stade Tunisien', 26, 11, 8, 7, 28, 22, 41, '2025-2026');

    // Standings - Handball
    insertStanding.run(2, 'Club Africain', 10, 8, 1, 1, 280, 210, 25, '2025-2026');
    insertStanding.run(2, 'Espérance ST', 10, 9, 0, 1, 300, 190, 27, '2025-2026');
    insertStanding.run(2, 'AS Hammamet', 10, 6, 1, 3, 250, 220, 19, '2025-2026');

    // Media
    insertMedia.run(1, 'highlight', 'CA vs EST - But de la victoire', '/thumbnails/ca-est-goal.jpg', 45);
    insertMedia.run(1, 'video', 'Interview Faouzi Benzarti après le match', '/thumbnails/benzarti-int.jpg', 180);
    insertMedia.run(1, 'highlight', 'Résumé CA vs CS Sfax 2-1', '/thumbnails/ca-sfax.jpg', 120);
    insertMedia.run(3, 'highlight', 'Basket : CA vs ES Goulette 71-65', '/thumbnails/ca-basket-hl.jpg', 90);

    // Missions
    const missionTypes = [
      ['login', 'Se connecter', 20, 1, 0, '1/1'],
      ['watch_ad', 'Regarder 1 pub', 50, 1, 0, '1/1'],
      ['predict', 'Prédire un match', 30, 0, 0, '0/1'],
      ['team', 'Composer équipe', 40, 0, 0, '0/1'],
      ['share', "Partager l'app", 25, 0, 0, '0/1'],
      ['news_read', 'Lire une actualité', 15, 0, 0, '0/3'],
      ['comment', 'Commenter un match', 20, 0, 0, '0/1'],
    ];
    for (const m of missionTypes) {
      insertMission.run('demo-user', ...m);
    }

    const packs = [
      [1, 500, 2, 0], [2, 1200, 5, 0], [3, 5000, 15, 5],
      [4, 12000, 30, 10], [5, 25000, 60, 15],
    ];
    for (const p of packs) insertPack.run(...p);

    const notifs = [
      ['Vous avez gagné 50 Coins', 'general'],
      ['Mission quotidienne complétée', 'general'],
      ['Début match CA vs USM', 'match'],
      ['Vous êtes dans le Top 10', 'game'],
      ['Nouvelle offre disponible', 'offer'],
      ['Rappel : Match CA vs EST à 19h', 'match'],
      ['Nouvelle actualité publiée', 'general'],
    ];
    for (const n of notifs) insertNotif.run('demo-user', ...n);
  });
  tx();
}

initDB();
seedDB();

// ========== Auth Middleware ==========
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    req.userId = 'demo-user';
    return next();
  }
  try {
    const token = auth.replace('Bearer ', '');
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    req.userId = payload.sub;
    next();
  } catch {
    req.userId = 'demo-user';
    next();
  }
}

app.use('/api', requireAuth);

// ========== Auth Routes ==========
app.post('/auth/signin', (req, res) => {
  const { email, password } = req.body;
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 'demo-user', email, iat: Date.now() / 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  const token = `${header}.${payload}.${signature}`;
  res.json({ access_token: token, user: { id: 'demo-user', email, aud: 'authenticated' } });
});

app.post('/auth/signup', (req, res) => {
  const { email, password, username } = req.body;
  db.prepare('INSERT OR IGNORE INTO profiles (id, username, role) VALUES (?, ?, ?)').run(email, username, 'fan');
  db.prepare('INSERT OR IGNORE INTO balances (user_id, cat_coins, real_money_dt, game_money_sca) VALUES (?, 0, 0, 0)').run(email);
  res.json({ user: { id: email, email }, session: { access_token: 'mock-token' } });
});

app.get('/auth/user', (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.userId);
  res.json({ id: req.userId, ...profile, aud: 'authenticated' });
});

// ========== API Routes ==========

// Profiles
app.get('/api/profiles', (req, res) => {
  const rows = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.userId);
  res.json(rows ? [rows] : []);
});

// Balances
app.get('/api/balances', (req, res) => {
  const row = db.prepare('SELECT * FROM balances WHERE user_id = ?').get(req.userId);
  res.json(row ? [row] : []);
});

// Matches
app.get('/api/matches', (req, res) => {
  const rows = db.prepare('SELECT * FROM matches ORDER BY date DESC').all();
  res.json(rows);
});

// Tickets
app.get('/api/tickets', (req, res) => {
  const rows = db.prepare(`
    SELECT t.*, m.home_team, m.away_team, m.date as match_date, m.venue as match_venue
    FROM tickets t
    LEFT JOIN matches m ON m.id = t.match_id
    WHERE t.user_id = ?
    ORDER BY t.created_at DESC
  `).all(req.userId);
  res.json(rows);
});

// Predictions
app.get('/api/predictions', (req, res) => {
  const rows = db.prepare('SELECT * FROM predictions WHERE user_id = ?').all(req.userId);
  res.json(rows);
});

app.post('/api/predictions', (req, res) => {
  const { match_id, home_score, away_score } = req.body;
  db.prepare('INSERT OR REPLACE INTO predictions (user_id, match_id, home_score, away_score) VALUES (?, ?, ?, ?)').run(req.userId, match_id, home_score, away_score);
  const row = db.prepare('SELECT * FROM predictions WHERE user_id = ? AND match_id = ?').get(req.userId, match_id);
  res.json(row);
});

// Fantasy Teams
app.get('/api/fantasy_teams', (req, res) => {
  const row = db.prepare('SELECT * FROM fantasy_teams WHERE user_id = ?').get(req.userId);
  res.json(row ? [row] : []);
});

app.post('/api/fantasy_teams', (req, res) => {
  const { formation, players } = req.body;
  const existing = db.prepare('SELECT id FROM fantasy_teams WHERE user_id = ?').get(req.userId);
  if (existing) {
    db.prepare('UPDATE fantasy_teams SET formation = ?, players = ?, updated_at = datetime("now") WHERE user_id = ?').run(formation, JSON.stringify(players), req.userId);
  } else {
    db.prepare('INSERT INTO fantasy_teams (user_id, formation, players) VALUES (?, ?, ?)').run(req.userId, formation, JSON.stringify(players));
  }
  res.json({ formation, players });
});

// Player Votes
app.post('/api/player_votes', (req, res) => {
  const { match_id, player_name } = req.body;
  db.prepare('INSERT OR REPLACE INTO player_votes (user_id, match_id, player_name) VALUES (?, ?, ?)').run(req.userId, match_id, player_name);
  res.json({ match_id, player_name });
});

// Missions
app.get('/api/missions', (req, res) => {
  const rows = db.prepare('SELECT * FROM missions WHERE user_id = ?').all(req.userId);
  res.json(rows);
});

app.post('/api/missions/claim', (req, res) => {
  const { mission_id } = req.body;
  const mission = db.prepare('SELECT * FROM missions WHERE id = ? AND user_id = ?').get(mission_id, req.userId);
  if (mission && mission.completed && !mission.claimed) {
    db.prepare('UPDATE missions SET claimed = 1 WHERE id = ?').run(mission_id);
    db.prepare('UPDATE balances SET cat_coins = cat_coins + ? WHERE user_id = ?').run(mission.coins, req.userId);
    db.prepare('INSERT INTO transactions (user_id, type, currency, amount, description) VALUES (?, "earn", "CAT", ?, ?)').run(req.userId, mission.coins, `Mission: ${mission.label}`);
  }
  res.json({ success: true });
});

app.post('/api/missions/claim-all', (req, res) => {
  const missions = db.prepare('SELECT * FROM missions WHERE user_id = ? AND completed = 1 AND claimed = 0').all(req.userId);
  const total = missions.reduce((sum, m) => sum + m.coins, 0);
  if (total > 0) {
    db.prepare('UPDATE missions SET claimed = 1 WHERE user_id = ? AND completed = 1 AND claimed = 0').run(req.userId);
    db.prepare('UPDATE balances SET cat_coins = cat_coins + ? WHERE user_id = ?').run(total, req.userId);
  }
  res.json({ total_coins: total });
});

// Transactions
app.get('/api/transactions', (req, res) => {
  const rows = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(rows);
});

// Notifications
app.get('/api/notifications', (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(rows);
});

app.post('/api/notifications/read', (req, res) => {
  const { id } = req.body;
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(id, req.userId);
  res.json({ success: true });
});

app.post('/api/notifications/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.userId);
  res.json({ success: true });
});

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const rows = db.prepare(`
    SELECT p.id as user_id, p.username, p.avatar, b.cat_coins,
      ROW_NUMBER() OVER (ORDER BY b.cat_coins DESC) as rank
    FROM profiles p
    JOIN balances b ON b.user_id = p.id
    ORDER BY b.cat_coins DESC
    LIMIT 50
  `).all();
  res.json(rows);
});

// Donations
app.get('/api/donations/summary', (req, res) => {
  const total = db.prepare('SELECT COALESCE(SUM(amount_dt), 0) as total FROM donations').get();
  res.json({ goal: 500000, raised: total.total, percentage: Math.min(100, (total.total / 500000) * 100) });
});

app.get('/api/donations/top', (req, res) => {
  const rows = db.prepare(`
    SELECT p.username, SUM(d.amount_dt) as total
    FROM donations d
    JOIN profiles p ON p.id = d.user_id
    GROUP BY d.user_id
    ORDER BY total DESC
    LIMIT 10
  `).all();
  res.json(rows);
});

// Coin Packs
app.get('/api/coin_packs', (req, res) => {
  const rows = db.prepare('SELECT * FROM coin_packs ORDER BY id').all();
  res.json(rows);
});

app.post('/api/coin_packs/buy', (req, res) => {
  const { pack_id } = req.body;
  const pack = db.prepare('SELECT * FROM coin_packs WHERE id = ?').get(pack_id);
  if (!pack) return res.status(404).json({ error: 'Pack not found' });
  const bonus = Math.floor(pack.coins * (pack.bonus_pct / 100));
  const total = pack.coins + bonus;
  db.prepare('UPDATE balances SET cat_coins = cat_coins + ? WHERE user_id = ?').run(total, req.userId);
  db.prepare('INSERT INTO transactions (user_id, type, currency, amount, description) VALUES (?, "purchase", "CAT", ?, ?)').run(req.userId, total, `Achat pack ${pack.coins} Coins`);
  res.json({ coins_added: total, pack });
});

app.post('/api/convert', (req, res) => {
  const { amount_sca } = req.body;
  if (!amount_sca || amount_sca < 100000) return res.status(400).json({ error: 'Minimum 100 000 $CA' });
  const rate = 200;
  const coins = Math.floor(amount_sca / rate);
  const balance = db.prepare('SELECT game_money_sca FROM balances WHERE user_id = ?').get(req.userId);
  if (!balance || balance.game_money_sca < amount_sca) return res.status(400).json({ error: 'Game money insuffisant' });
  db.prepare('UPDATE balances SET game_money_sca = game_money_sca - ?, cat_coins = cat_coins + ? WHERE user_id = ?').run(amount_sca, coins, req.userId);
  db.prepare('INSERT INTO transactions (user_id, type, currency, amount, description) VALUES (?, "convert", "SCA", ?, ?)').run(req.userId, amount_sca, `Conversion en Coins`);
  res.json({ coins_earned: coins, amount_sca });
});

app.post('/api/ads/watch', (req, res) => {
  const coins = 50;
  db.prepare('UPDATE balances SET cat_coins = cat_coins + ? WHERE user_id = ?').run(coins, req.userId);
  db.prepare('INSERT INTO transactions (user_id, type, currency, amount, description) VALUES (?, "earn", "CAT", ?, ?)').run(req.userId, coins, 'Regarder une pub');
  res.json({ coins_earned: coins });
});

app.post('/api/donations', (req, res) => {
  const { amount_dt } = req.body;
  if (!amount_dt || amount_dt <= 0) return res.status(400).json({ error: 'Montant invalide' });
  db.prepare('INSERT INTO donations (user_id, amount_dt) VALUES (?, ?)').run(req.userId, amount_dt);
  db.prepare('UPDATE balances SET real_money_dt = real_money_dt - ? WHERE user_id = ?').run(amount_dt, req.userId);
  res.json({ success: true, amount_dt });
});

app.post('/api/tickets/buy', (req, res) => {
  const { match_id, category } = req.body;
  const prices = { pelouse: 10, enceinte: 25, virage: 40, vip: 60, mouhib: 100 };
  const price = prices[category];
  if (!price) return res.status(400).json({ error: 'Catégorie invalide' });
  const balance = db.prepare('SELECT real_money_dt FROM balances WHERE user_id = ?').get(req.userId);
  if (!balance || balance.real_money_dt < price) return res.status(400).json({ error: 'Solde insuffisant' });
  const code = `CA${Date.now().toString(36).toUpperCase()}`;
  const result = db.prepare('INSERT INTO tickets (user_id, match_id, category, price_dt, qr_code) VALUES (?, ?, ?, ?, ?)').run(req.userId, match_id, category, price, code);
  db.prepare('UPDATE balances SET real_money_dt = real_money_dt - ? WHERE user_id = ?').run(price, req.userId);
  res.json({ id: result.lastInsertRowid, qr_code: code, category, price_dt: price });
});

// ========== Multi-Sport Routes ==========
app.get('/api/sports', (req, res) => {
  const rows = db.prepare('SELECT * FROM sports WHERE enabled = 1 ORDER BY id').all();
  res.json(rows);
});

app.get('/api/sport_matches', (req, res) => {
  const { sport_id, status } = req.query;
  let query = 'SELECT sm.*, s.name as sport_name, s.label as sport_label, s.color as sport_color FROM sport_matches sm JOIN sports s ON s.id = sm.sport_id';
  const conditions = [];
  const params = [];
  if (sport_id) { conditions.push('sm.sport_id = ?'); params.push(sport_id); }
  if (status) { conditions.push('sm.status = ?'); params.push(status); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY sm.date DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

app.get('/api/sport_matches/:id', (req, res) => {
  const row = db.prepare('SELECT sm.*, s.name as sport_name, s.label as sport_label, s.color as sport_color FROM sport_matches sm JOIN sports s ON s.id = sm.sport_id WHERE sm.id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Match not found' });
  res.json(row);
});

// News
app.get('/api/news', (req, res) => {
  const { sport_id } = req.query;
  let query = 'SELECT n.*, s.label as sport_label, s.color as sport_color FROM news n LEFT JOIN sports s ON s.id = n.sport_id WHERE n.published = 1';
  const params = [];
  if (sport_id) { query += ' AND n.sport_id = ?'; params.push(sport_id); }
  query += ' ORDER BY n.created_at DESC LIMIT 50';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

app.get('/api/news/:id', (req, res) => {
  const row = db.prepare('SELECT n.*, s.label as sport_label FROM news n LEFT JOIN sports s ON s.id = n.sport_id WHERE n.id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'News not found' });
  res.json(row);
});

// Players
app.get('/api/players', (req, res) => {
  const { sport_id } = req.query;
  let query = 'SELECT p.*, s.label as sport_label, s.name as sport_name FROM players p JOIN sports s ON s.id = p.sport_id WHERE p.active = 1';
  const params = [];
  if (sport_id) { query += ' AND p.sport_id = ?'; params.push(sport_id); }
  query += ' ORDER BY p.number ASC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

app.get('/api/players/:id', (req, res) => {
  const row = db.prepare('SELECT p.*, s.label as sport_label FROM players p JOIN sports s ON s.id = p.sport_id WHERE p.id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Player not found' });
  res.json(row);
});

// Standings
app.get('/api/standings', (req, res) => {
  const { sport_id, season } = req.query;
  let query = 'SELECT st.*, s.label as sport_label, s.color as sport_color FROM standings st JOIN sports s ON s.id = st.sport_id';
  const conditions = [];
  const params = [];
  if (sport_id) { conditions.push('st.sport_id = ?'); params.push(sport_id); }
  if (season) { conditions.push('st.season = ?'); params.push(season); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY st.points DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// Media
app.get('/api/media', (req, res) => {
  const { sport_id, type } = req.query;
  let query = 'SELECT m.*, s.label as sport_label FROM media m LEFT JOIN sports s ON s.id = m.sport_id WHERE m.published = 1';
  const params = [];
  if (sport_id) { query += ' AND m.sport_id = ?'; params.push(sport_id); }
  if (type) { query += ' AND m.type = ?'; params.push(type); }
  query += ' ORDER BY m.created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// Fan Posts (Community)
app.get('/api/fan_posts', (req, res) => {
  const rows = db.prepare(`
    SELECT fp.*, p.username, p.avatar
    FROM fan_posts fp
    JOIN profiles p ON p.id = fp.user_id
    ORDER BY fp.created_at DESC
    LIMIT 50
  `).all();
  res.json(rows);
});

app.post('/api/fan_posts', (req, res) => {
  const { content } = req.body;
  if (!content || content.trim().length === 0) return res.status(400).json({ error: 'Content required' });
  const result = db.prepare('INSERT INTO fan_posts (user_id, content) VALUES (?, ?)').run(req.userId, content.trim());
  const post = db.prepare('SELECT fp.*, p.username, p.avatar FROM fan_posts fp JOIN profiles p ON p.id = fp.user_id WHERE fp.id = ?').get(result.lastInsertRowid);
  res.json(post);
});

app.post('/api/fan_posts/:id/like', (req, res) => {
  db.prepare('UPDATE fan_posts SET likes = likes + 1 WHERE id = ?').run(req.params.id);
  const row = db.prepare('SELECT likes FROM fan_posts WHERE id = ?').get(req.params.id);
  res.json(row);
});

app.post('/api/fan_posts/:id/reply', (req, res) => {
  db.prepare('UPDATE fan_posts SET replies = replies + 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Live scores aggregation
app.get('/api/live_scores', (req, res) => {
  const rows = db.prepare(`
    SELECT sm.*, s.label as sport_label, s.name as sport_name, s.color as sport_color
    FROM sport_matches sm
    JOIN sports s ON s.id = sm.sport_id
    WHERE sm.status = 'live'
    ORDER BY sm.viewers DESC
  `).all();
  res.json(rows);
});

// Dashboard aggregation
app.get('/api/dashboard', (req, res) => {
  const liveMatches = db.prepare(`
    SELECT sm.*, s.label as sport_label, s.name as sport_name, s.color as sport_color
    FROM sport_matches sm JOIN sports s ON s.id = sm.sport_id
    WHERE sm.status = 'live' ORDER BY sm.viewers DESC
  `).all();
  const news = db.prepare('SELECT * FROM news WHERE published = 1 ORDER BY created_at DESC LIMIT 3').all();
  const nextMatch = db.prepare(`
    SELECT sm.*, s.label as sport_label FROM sport_matches sm
    JOIN sports s ON s.id = sm.sport_id
    WHERE sm.status = 'upcoming' ORDER BY sm.date ASC LIMIT 1
  `).get();
  const standings = db.prepare('SELECT * FROM standings WHERE sport_id = 1 ORDER BY points DESC LIMIT 5').all();
  const unreadNotifs = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read = 0').get(req.userId);
  res.json({ liveMatches, news, nextMatch, standings, unreadNotifs: unreadNotifs.c });
});

// ========== Start ==========
app.listen(PORT, () => {
  console.log(`\n  🏟️  Club Africain API Server running at http://localhost:${PORT}`);
  console.log(`  📝  Demo user: demo-user (auto-login)`);
  console.log(`  📦  Database: ${DB_PATH}\n`);
});
