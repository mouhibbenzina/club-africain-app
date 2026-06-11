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
  `);
}

function seedDB() {
  const count = db.prepare('SELECT COUNT(*) as c FROM profiles').get();
  if (count.c > 0) return;

  const insertProfile = db.prepare('INSERT OR IGNORE INTO profiles (id, username, role) VALUES (?, ?, ?)');
  const insertBalance = db.prepare('INSERT OR IGNORE INTO balances (user_id, cat_coins, real_money_dt, game_money_sca) VALUES (?, ?, ?, ?)');
  const insertMatch = db.prepare('INSERT INTO matches (home_team, away_team, date, venue, is_live, viewers, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertMission = db.prepare('INSERT OR IGNORE INTO missions (user_id, mission_type, label, coins, completed, claimed, progress) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertPack = db.prepare('INSERT OR IGNORE INTO coin_packs (id, coins, price_dt, bonus_pct) VALUES (?, ?, ?, ?)');
  const insertNotif = db.prepare('INSERT INTO notifications (user_id, title, type) VALUES (?, ?, ?)');

  const tx = db.transaction(() => {
    insertProfile.run('demo-user', 'Clubiste_1920', 'fan');
    insertBalance.run('demo-user', 12450, 35, 250000);

    insertMatch.run('Club Africain', 'Espérance ST', new Date().toISOString(), 'Stade Olympique', 1, 23400, 'live');
    insertMatch.run('Club Africain', 'US Monastir', '2024-06-15T17:00:00Z', 'Stade Olympique', 0, 0, 'upcoming');
    insertMatch.run('Club Africain', 'Étoile du Sahel', '2024-06-22T19:00:00Z', 'Stade Olympique', 0, 0, 'upcoming');
    insertMatch.run('Club Africain', 'CS Sfaxien', '2024-05-20T17:00:00Z', 'Stade Olympique', 0, 0, 'finished');

    const missionTypes = [
      ['login', 'Se connecter', 20, 1, 0, '1/1'],
      ['watch_ad', 'Regarder 1 pub', 50, 1, 0, '1/1'],
      ['predict', 'Prédire un match', 30, 0, 0, '0/1'],
      ['team', 'Composer équipe', 40, 0, 0, '0/1'],
      ['share', "Partager l'app", 25, 0, 0, '0/1'],
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

// ========== Start ==========
app.listen(PORT, () => {
  console.log(`\n  🏟️  Club Africain API Server running at http://localhost:${PORT}`);
  console.log(`  📝  Demo user: demo-user (auto-login)`);
  console.log(`  📦  Database: ${DB_PATH}\n`);
});
