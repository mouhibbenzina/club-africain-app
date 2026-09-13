const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ---------- Configuration (env / .env) ----------
(function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx <= 0) continue;
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
})();

const CONFIG = {
  HOST: process.env.HOST || '0.0.0.0',
  PORT: parseInt(process.env.PORT, 10) || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PUBLIC_URL: (process.env.PUBLIC_URL || `http://localhost:${parseInt(process.env.PORT, 10) || 3001}`).replace(/\/+$/, ''),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  TRUST_PROXY: process.env.TRUST_PROXY === 'true',
  JWT_TTL_SECONDS: parseInt(process.env.JWT_TTL_SECONDS, 10) || (60 * 60 * 24 * 30),
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 120,
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 15,
  LOCKOUT_THRESHOLD: parseInt(process.env.LOCKOUT_THRESHOLD, 10) || 5,
  LOCKOUT_MINUTES: parseInt(process.env.LOCKOUT_MINUTES, 10) || 15,
  REQUIRE_EMAIL_VERIFICATION: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
  EMAIL_VERIFY_TTL_HOURS: parseInt(process.env.EMAIL_VERIFY_TTL_HOURS, 10) || 24,
  PASSWORD_RESET_TTL_MINUTES: parseInt(process.env.PASSWORD_RESET_TTL_MINUTES, 10) || 60,
  MAILER: process.env.MAILER || 'console',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  MAIL_FROM: process.env.MAIL_FROM || 'Club Africain App <no-reply@clubafricain.tn>',
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'mock',
  PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET || '',
  AUTO_BACKUP: process.env.AUTO_BACKUP !== 'false',
  BACKUP_INTERVAL_HOURS: parseInt(process.env.BACKUP_INTERVAL_HOURS, 10) || 24,
  BACKUP_KEEP: parseInt(process.env.BACKUP_KEEP, 10) || 30,
  JSON_BODY_LIMIT: process.env.JSON_BODY_LIMIT || '1mb',
};

const app = express();
const PORT = CONFIG.PORT;
const DB_PATH = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(__dirname, 'club_africain.db');
const TOKEN_TTL_SECONDS = CONFIG.JWT_TTL_SECONDS;

function loadOrCreateSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const secretFile = path.join(__dirname, '.jwt-secret');
  try {
    if (fs.existsSync(secretFile)) {
      const existing = fs.readFileSync(secretFile, 'utf8').trim();
      if (existing) return existing;
    }
    const fresh = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretFile, fresh, { mode: 0o600 });
    return fresh;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}
const JWT_SECRET = loadOrCreateSecret();

// ---------- Logging ----------
const LOG_DIR = path.join(__dirname, 'logs');
const BACKUP_DIR = path.join(__dirname, 'backups');
for (const d of [LOG_DIR, BACKUP_DIR]) fs.mkdirSync(d, { recursive: true });

function writeLog(file, line) {
  try { fs.appendFileSync(path.join(LOG_DIR, file), `[${new Date().toISOString()}] ${line}\n`); } catch (err) {}
}
function accessLog(line) { if (CONFIG.NODE_ENV !== 'test') writeLog('access.log', line); }
function errorLog(line) { if (CONFIG.NODE_ENV !== 'test') writeLog('error.log', line); }
function securityLog(line) { writeLog('security.log', line); }
function mailLog(line) { writeLog('mail.log', line); }

// ---------- Rate Limiting (in-memory sliding window) ----------
const rateBuckets = new Map();
function rateLimit({ windowMs, max, prefix = 'rl' }) {
  return (req, res, next) => {
    if (!CONFIG.RATE_LIMIT_ENABLED) return next();
    const now = Date.now();
    if (rateBuckets.size > 20000) {
      for (const [k, bucket] of rateBuckets) if (now - bucket.start > windowMs) rateBuckets.delete(k);
    }
    const key = `${prefix}:${req.ip || 'unknown'}`;
    let bucket = rateBuckets.get(key);
    if (!bucket || now - bucket.start >= windowMs) bucket = { start: now, count: 0 };
    bucket.count += 1;
    rateBuckets.set(key, bucket);
    if (bucket.count > max) {
      return res.status(429).json({ error: 'Trop de requêtes. Réessayez dans quelques instants.' });
    }
    next();
  };
}
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: CONFIG.AUTH_RATE_LIMIT_MAX, prefix: 'auth' });
const apiLimiter = rateLimit({ windowMs: CONFIG.RATE_LIMIT_WINDOW_MS, max: CONFIG.RATE_LIMIT_MAX, prefix: 'api' });

app.set('trust proxy', CONFIG.TRUST_PROXY);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});
app.use(cors({ origin: CONFIG.CORS_ORIGIN === '*' ? true : CONFIG.CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: CONFIG.JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    accessLog(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms ip=${req.ip}`);
  });
  next();
});

app.use(['/auth', '/payments'], authLimiter);
app.use('/api', apiLimiter);

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}
function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), String(salt), 64).toString('hex');
}
function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
function publicUser(p) {
  return {
    id: p.id,
    email: p.email || null,
    username: p.username,
    avatar: p.avatar || '',
    role: p.role,
    full_name: p.full_name || null,
    phone: p.phone || null,
    email_verified: p.email_verified ? 1 : 0,
  };
}
function signToken(userId, tokenVersion) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    ver: tokenVersion || 0,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}
function verifyToken(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest('base64url');
    const a = Buffer.from(expected);
    const b = Buffer.from(parts[2]);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (!payload.sub) return null;
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.sub, ver: payload.ver || 0 };
  } catch {
    return null;
  }
}

// ========== Database Setup ==========
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------- Security / Mail / Orders / Backup helpers ----------
function logEvent(event, data = {}) {
  try {
    db.prepare('INSERT INTO security_events (event, user_id, email, ip, detail) VALUES (?, ?, ?, ?, ?)').run(
      event,
      data.user_id || null,
      data.email || null,
      data.ip || null,
      data.detail ? String(data.detail).slice(0, 1000) : null,
    );
  } catch (err) {}
  const who = data.user_id || data.email || '-';
  securityLog(`${event} user=${who} ip=${data.ip || '-'}${data.detail ? ' detail=' + data.detail : ''}`);
}

async function sendMail({ to, subject, html }) {
  mailLog(`${subject} -> ${to}`);
  if (CONFIG.MAILER === 'smtp') {
    let nodemailer = null;
    try { nodemailer = require('nodemailer'); } catch (err) {}
    if (nodemailer && CONFIG.SMTP_HOST) {
      try {
        const transporter = nodemailer.createTransport({
          host: CONFIG.SMTP_HOST,
          port: CONFIG.SMTP_PORT,
          secure: CONFIG.SMTP_SECURE,
          auth: CONFIG.SMTP_USER ? { user: CONFIG.SMTP_USER, pass: CONFIG.SMTP_PASS } : undefined,
        });
        await transporter.sendMail({ from: CONFIG.MAIL_FROM, to, subject, html });
        return;
      } catch (err) {
        errorLog(`mail send failed: ${err.message}`);
      }
    }
  }
  if (CONFIG.NODE_ENV !== 'test') {
    writeLog('mail.outbox.log', JSON.stringify({ to, subject, html }));
    if (CONFIG.NODE_ENV === 'development') {
      console.log(`\n  📧 [MAIL] ${subject}\n  À: ${to}\n  ${html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 300)}\n`);
    }
  }
}

function htmlPage(title, body) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Club Africain</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; background: #121212; color: #eee; display: flex; flex-direction: column; min-height: 100vh; }
  header { background: #0d0d0d; padding: 20px 24px; border-bottom: 3px solid #cc0000; }
  header .badge { font-size: 15px; color: #cc0000; font-weight: 800; }
  main { flex: 1; max-width: 520px; width: 100%; margin: 40px auto; padding: 0 20px; }
  .card { background: #1e1e1e; border-radius: 16px; padding: 28px; box-shadow: 0 8px 30px rgba(0,0,0,.4); }
  h1 { font-size: 22px; margin-bottom: 10px; }
  p { color: #bbb; font-size: 15px; line-height: 1.5; margin-bottom: 16px; }
  .ok { color: #27ae60; font-weight: 700; }
  .ko { color: #e74c3c; font-weight: 700; }
  label { display: block; font-size: 13px; color: #aaa; margin-bottom: 6px; }
  input { width: 100%; padding: 13px 14px; border-radius: 10px; border: 1px solid #333; background: #121212; color: #eee; font-size: 15px; margin-bottom: 16px; }
  button { width: 100%; padding: 14px; border-radius: 10px; border: 0; background: #cc0000; color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; }
  button:disabled { opacity: .5; }
  .muted { font-size: 13px; color: #777; }
  footer { text-align: center; padding: 24px; color: #555; font-size: 13px; }
</style>
</head>
<body>
<header><span class="badge">🏟️ CLUB AFRICAIN</span></header>
<main>${body}</main>
<footer>Club Africain — Application officielle des supporters</footer>
</body>
</html>`;
}

function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createEmailToken(userId, kind) {
  const ttlSeconds = kind === 'verify'
    ? CONFIG.EMAIL_VERIFY_TTL_HOURS * 3600
    : CONFIG.PASSWORD_RESET_TTL_MINUTES * 60;
  const token = randomToken();
  const expires = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  db.prepare('INSERT INTO email_tokens (user_id, kind, token, expires_at) VALUES (?, ?, ?, ?)').run(userId, kind, token, expires);
  return token;
}

function consumeEmailToken(kind, token) {
  if (typeof token !== 'string' || !token) return null;
  const row = validateEmailToken(kind, token);
  if (!row) return null;
  db.prepare('UPDATE email_tokens SET used = 1 WHERE id = ?').run(row.id);
  return row;
}

function validateEmailToken(kind, token) {
  if (typeof token !== 'string' || !token) return null;
  const row = db.prepare('SELECT * FROM email_tokens WHERE token = ? AND kind = ?').get(token, kind);
  if (!row || row.used) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row;
}

function orderRef() {
  return `CAF-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}
function receiptNumber() {
  const d = new Date();
  const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const c = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE strftime('%Y-%m', created_at) = ?").get(monthPrefix).c;
  return `RCP-${monthPrefix}-${String(c + 1).padStart(4, '0')}`;
}
function createOrder(userId, { kind, amount_dt, provider, item_summary }) {
  const result = db.prepare('INSERT INTO orders (user_id, kind, ref, amount_dt, provider, item_summary) VALUES (?, ?, ?, ?, ?, ?)')
    .run(userId, kind, orderRef(), amount_dt, provider || CONFIG.PAYMENT_PROVIDER, item_summary || null);
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
}
function markOrderPaid(order, externalRef) {
  const receipt = receiptNumber();
  db.prepare("UPDATE orders SET status = 'paid', external_ref = ?, receipt_number = ?, paid_at = datetime('now') WHERE id = ?")
    .run(externalRef || null, receipt, order.id);
  db.prepare('INSERT INTO notifications (user_id, title, type) VALUES (?, ?, ?)')
    .run(order.user_id, `Paiement confirmé — reçu ${receipt}`, 'offer');
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
}

function backupDB() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(BACKUP_DIR, `club_africain-${stamp}.db`);
  return db.backup(dest).then(() => {
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith('club_africain-') && f.endsWith('.db')).sort();
    while (files.length > CONFIG.BACKUP_KEEP) {
      fs.unlinkSync(path.join(BACKUP_DIR, files.shift()));
    }
    accessLog(`backup created ${path.basename(dest)}`);
    console.log(`  💾  Sauvegarde: ${path.basename(dest)}`);
    return dest;
  });
}

function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

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

    CREATE TABLE IF NOT EXISTS club_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year TEXT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'other' CHECK (category IN ('founding', 'golden-era', 'historic-win', 'modern', 'other')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trophies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('domestic', 'continental', 'regional', 'intercontinental')),
      count INTEGER NOT NULL,
      years TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS legendary_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sport_id INTEGER REFERENCES sports(id),
      name TEXT NOT NULL,
      position TEXT,
      nationality TEXT,
      era TEXT,
      achievements TEXT
    );

    CREATE TABLE IF NOT EXISTS presidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      period_start TEXT,
      period_end TEXT,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS coaches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nationality TEXT,
      period TEXT,
      achievements TEXT
    );

    CREATE TABLE IF NOT EXISTS historic_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_date TEXT,
      competition TEXT NOT NULL,
      opponent TEXT NOT NULL,
      result TEXT,
      score TEXT,
      venue TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS club_facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      value TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      friend_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
      action_user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, friend_id)
    );

    CREATE TABLE IF NOT EXISTS security_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event TEXT NOT NULL,
      user_id TEXT,
      email TEXT,
      ip TEXT,
      detail TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS email_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('verify', 'reset')),
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profiles(id),
      kind TEXT NOT NULL CHECK (kind IN ('coin_pack', 'donation')),
      ref TEXT UNIQUE NOT NULL,
      amount_dt REAL NOT NULL,
      currency TEXT DEFAULT 'TND',
      provider TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
      external_ref TEXT,
      item_summary TEXT,
      meta TEXT,
      receipt_number TEXT UNIQUE,
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  ensureColumn('profiles', 'email', 'email TEXT');
  ensureColumn('profiles', 'password_hash', 'password_hash TEXT');
  ensureColumn('profiles', 'password_salt', 'password_salt TEXT');
  ensureColumn('profiles', 'full_name', 'full_name TEXT');
  ensureColumn('profiles', 'phone', 'phone TEXT');
  ensureColumn('profiles', 'email_verified', 'email_verified INTEGER DEFAULT 0');
  ensureColumn('profiles', 'failed_attempts', 'failed_attempts INTEGER DEFAULT 0');
  ensureColumn('profiles', 'locked_until', 'locked_until TEXT');
  ensureColumn('profiles', 'token_version', 'token_version INTEGER DEFAULT 0');

  ensureColumn('orders', 'meta', 'meta TEXT');

  db.prepare("UPDATE profiles SET email = id WHERE email IS NULL").run();
  db.prepare("UPDATE profiles SET email = 'demo@clubafricain.tn' WHERE id = 'demo-user'").run();
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email)');
}

function seedDB() {
  const count = db.prepare('SELECT COUNT(*) as c FROM profiles').get();
  if (count.c > 0) return;

  const insertProfile = db.prepare('INSERT OR IGNORE INTO profiles (id, username, role) VALUES (?, ?, ?)');
  const insertBalance = db.prepare('INSERT OR IGNORE INTO balances (user_id, cat_coins, real_money_dt, game_money_sca) VALUES (?, ?, ?, ?)');
  const insertMatch = db.prepare('INSERT INTO matches (home_team, away_team, date, venue, is_live, viewers, status, home_score, away_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
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

    insertMatch.run('Club Africain', 'Espérance ST', new Date().toISOString(), 'Stade Olympique', 1, 23400, 'live', null, null);
    insertMatch.run('Club Africain', 'US Monastir', '2025-10-15T17:00:00Z', 'Stade Olympique', 0, 0, 'upcoming', null, null);
    insertMatch.run('Club Africain', 'Étoile du Sahel', '2025-10-22T19:00:00Z', 'Stade Olympique', 0, 0, 'upcoming', null, null);
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

function seedHistory() {
  const isTableEmpty = (table) =>
    db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c === 0;

  const insertHistory = db.prepare('INSERT INTO club_history (year, title, description, category) VALUES (?, ?, ?, ?)');
  const insertTrophy = db.prepare('INSERT INTO trophies (competition, category, count, years, description) VALUES (?, ?, ?, ?, ?)');
  const insertLegend = db.prepare('INSERT INTO legendary_players (sport_id, name, position, nationality, era, achievements) VALUES (?, ?, ?, ?, ?, ?)');
  const insertPresident = db.prepare('INSERT INTO presidents (name, period_start, period_end, note) VALUES (?, ?, ?, ?)');
  const insertCoach = db.prepare('INSERT INTO coaches (name, nationality, period, achievements) VALUES (?, ?, ?, ?)');
  const insertHistoricMatch = db.prepare('INSERT INTO historic_matches (match_date, competition, opponent, result, score, venue, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertFact = db.prepare('INSERT INTO club_facts (category, title, value, description) VALUES (?, ?, ?, ?)');
  const insertHistoricNews = db.prepare('INSERT INTO news (sport_id, title, excerpt, image_url, author, created_at) VALUES (?, ?, ?, ?, ?, ?)');

  const tx = db.transaction(() => {
    if (isTableEmpty('club_history')) {
      const history = [
        ['1915', 'Fondation du Stade africain', 'Association sportive locale fondée dans la médina de Tunis, précurseur direct du Club Africain.', 'founding'],
        ['1918', 'Dissolution du Stade africain', 'Le Stade africain cesse ses activités en 1918, mais son noyau de joueurs et ses couleurs survivront.', 'founding'],
        ['1919-1920', 'Projet « Club islamique africain »', "Les fondateurs réclament la création d'un club nommé « Club islamique africain », appellation refusée par les autorités du protectorat français.", 'founding'],
        ['4 octobre 1920', 'Fondation officielle du Club Africain', "Fondation à Bab Jedid (Tunis), lors d'une réunion constitutive tenue dans un café du quartier. Les fondateurs imposent un bureau entièrement tunisien et des couleurs rouge et blanc, malgré l'opposition des autorités coloniales.", 'founding'],
        ['1920', 'Premier bureau directeur', 'Présidé par Béchir Ben Mustapha, avec Chedly Alwerfeli au poste de secrétaire général.', 'founding'],
        ['1937', "Accession à l'élite nationale", 'Le Club Africain accède à la première division du football tunisien.', 'other'],
        ['1946-47', 'Premier titre de champion de Tunisie', 'Le Club Africain remporte son premier championnat de Tunisie.', 'historic-win'],
        ['1947-48', 'Deuxième titre consécutif', 'Le CA enchaîne un second titre de champion : premier doublé de son histoire.', 'historic-win'],
        ['1960s', "L'ère dorée de Fabio Roccheggiani", "Sous la direction de l'Italien Fabio Roccheggiani, le CA domine le championnat et établit des records défensifs.", 'golden-era'],
        ['1964-65', 'Première Coupe de Tunisie', 'Le Club Africain remporte sa première Coupe de Tunisie.', 'historic-win'],
        ['1971', 'Premier trophée international', 'Le CA devient le premier club tunisien à soulever un titre international : la Coupe des vainqueurs de coupe du Maghreb.', 'historic-win'],
        ['1974-1976', 'Triplé maghrébin', 'Trois Coupes des champions maghrébines consécutives (1974, 1975, 1976).', 'golden-era'],
        ['1991', "Champion d'Afrique !", "Premier club tunisien à remporter la Coupe des clubs champions africaine : victoire 7-3 au total face aux Ougandais de Villa SC, sous la conduite du Roumain Ilie Balaci.", 'historic-win'],
        ['1991-92', 'La saison du quadruplé', 'Championnat, Coupe de Tunisie, Coupe des clubs champions africaine et Coupe afro-asiatique : le CA réussit un quadruplé historique.', 'historic-win'],
        ['1992', 'Coupe afro-asiatique', 'Victoire lors de la Coupe afro-asiatique des clubs champions 1992 face à Al-Hilal (Arabie saoudite).', 'historic-win'],
        ['1995', 'Coupe arabe des vainqueurs de coupe', 'Premier trophée arabe : la Coupe arabe des vainqueurs de coupe 1995.', 'modern'],
        ['1997', 'Ligue des champions arabe', 'Le CA remporte la Ligue des champions arabe 1997.', 'modern'],
        ['2007-08', 'Retour sur le trône', 'Le Club Africain renoue avec le titre de champion de Tunisie douze ans après le précédent.', 'modern'],
        ['2008 / 2010', 'Coupes nord-africaines', 'Deux Coupes nord-africaines des clubs champions (2008 et 2010).', 'modern'],
        ['2014-15', 'Champion de Tunisie', "Le CA remporte le championnat après 19 ans d'attente.", 'modern'],
        ['2017-2018', 'Doublé en Coupe de Tunisie', 'Deux Coupes de Tunisie consécutives, en 2017 et 2018.', 'modern'],
        ['2025-26', 'Champion de Tunisie 2025-2026', '14e titre de champion, obtenu grâce à une saison exceptionnelle, avec le retour en Ligue des champions de la CAF.', 'modern'],
      ];
      for (const h of history) insertHistory.run(...h);
    }

    if (isTableEmpty('trophies')) {
      const trophies = [
        ['Tunisian Ligue Professionnelle 1', 'domestic', 14, "1946-47, 1947-48, 1963-64, 1966-67, 1972-73, 1973-74, 1978-79, 1979-80, 1989-90, 1991-92, 1995-96, 2007-08, 2014-15, 2025-26", 'Championnat national de Tunisie.'],
        ['Coupe de Tunisie', 'domestic', 13, "1964-65, 1966-67, 1967-68, 1968-69, 1969-70, 1971-72, 1972-73, 1975-76, 1991-92, 1997-98, 1999-2000, 2016-17, 2017-18", 'Coupe nationale.'],
        ['Super Coupe de Tunisie', 'domestic', 3, '1968, 1970, 1979', 'Supercoupe nationale.'],
        ["Coupe des clubs champions africaine (Ligue des champions CAF)", 'continental', 1, '1991', "Premier club tunisien champion d'Afrique."],
        ['Coupe arabe des vainqueurs de coupe', 'regional', 1, '1995', 'Trophée arabe.'], 
        ['Ligue des champions arabe', 'regional', 1, '1997', 'Trophée arabe.'],
        ['Coupe nord-africaine des clubs champions', 'regional', 2, '2008, 2010', 'Trophées régionaux.'],
        ["Coupe des vainqueurs de coupe du Maghreb", 'regional', 1, '1971', "Premier trophée international d'un club tunisien."],
        ['Coupe des champions maghrébine', 'regional', 3, '1974, 1975, 1976', 'Trophées régionaux.'],
        ['Coupe afro-asiatique des clubs', 'intercontinental', 1, '1992', 'Vainqueur face à Al-Hilal (Arabie saoudite).'],
      ];
      for (const t of trophies) insertTrophy.run(...t);
    }

    if (isTableEmpty('legendary_players')) {
      const legends = [
        [1, 'Mohamed Soudani', 'Attaquant', 'Tunisien', '1915-1920s', 'Figure fondatrice venue du Stade africain, capitaine des premières équipes du CA.'],
        [1, 'Ahmed Ben Amor', 'Gardien', 'Tunisien', '1920s', "Premier gardien de but de l'histoire du club."],
        [1, 'Faouzi Rouissi', 'Attaquant', 'Tunisien', 'fin 1980s - début 1990s', "Co-meilleur buteur de la Coupe des clubs champions africaine 1991 (6 buts), auteur d'un doublé en finale (6-2)."],
        [1, 'Adel Sellimi', 'Milieu offensif', 'Tunisien', 'fin 1980s - début 1990s', 'Co-meilleur buteur de la campagne africaine 1991 (6 buts), buteur lors de la finale aller.'],
        [1, 'Mohamed Ali Mahjoubi', 'Milieu', 'Tunisien', '1990s', "Champion d'Afrique 1991, champion de Tunisie 1989-90 et 1991-92."],
        [1, 'Wissem Ben Yahia', 'Milieu', 'Tunisien', '2005-2011, 2015-2024', "Recordman des apparitions au CA (215 matches), champion 2007-08, 34 sélections avec la Tunisie."],
        [1, 'Zouheir Dhaouadi', 'Ailier gauche', 'Tunisien', '2006-2024', 'Symbole du club : champion 2014-15, Coupes 2017 et 2018, 34 sélections avec la Tunisie.'],
        [1, 'Bilel Ifa', 'Défenseur central', 'Tunisien', '2007-2021', 'Capitaine emblématique, champion 2014-15, vainqueur des Coupes 2017 et 2018.'],
        [1, 'Hamza Agrebi', 'Latéral droit', 'Tunisien', '2006-2018', '188 apparitions, champion 2007-08, Coupes de Tunisie 2017 et 2018.'],
        [1, 'Ahmed Khalil', 'Milieu', 'Tunisien', '2010s', '190 apparitions sous le maillot rouge et blanc.'],
        [1, 'Saber Khlifa', 'Attaquant', 'Tunisien', '2010-2014', 'Buteur vedette du début des années 2010 et international tunisien.'],
        [2, 'Oualid Ben Amor', 'Arrière', 'Tunisien', '2010s', 'Légende de la section handball du CA et du handball tunisien.'],
        [2, 'Amine Bannour', 'Arrière droit', 'Tunisien', '2010s', 'International tunisien, cadre de la section handball du CA.'],
        [2, 'Oussama Boughanmi', 'Ailier', 'Tunisien', '2010s', 'Figure de la section handball du CA.'],
        [2, 'Abdelhak Ben Salah', 'Arrière', 'Tunisien', '2010s', 'International tunisien, pilier de la section handball du CA.'],
        [3, 'Mourad El Mabrouk', 'Meneur', 'Tunisien', '2000s-2010s', 'International tunisien, figure historique du basket du CA.'],
        [3, 'Marouan Kechrid', 'Meneur', 'Tunisien', '2010s', 'International tunisien, vainqueur de la Coupe de Tunisie avec le CA.'],
        [3, 'Naim Dhifallah', 'Ailier', 'Tunisien', '2000s-2010s', "Auteur du panier décisif qui offre au CA son premier championnat en 2003-04."],
      ];
      for (const l of legends) insertLegend.run(...l);
    }

    if (isTableEmpty('presidents')) {
      const presidents = [
        ['Béchir Ben Mustapha', '1920', '1921', 'Premier président, l’un des pères fondateurs.'],
        ['Hadi Ginati', '1921', '1922', ''],
        ['Béchir Ben Mustapha', '1922', '1923', ''],
        ['Ouannes Laâjimi', '1923', '1924', ''],
        ['Hsouna Abdelkefi', '1924', '1926', ''],
        ['Abdelaziz Ounaies', '1926', '1927', ''],
        ['Mustapha Sfar', '1927', '1930', ''],
        ['Abdelaziz Ounaies', '1930', '1931', ''],
        ['Ali Belhaj', '1931', '1932', ''],
        ['Abdelaziz Ounaies', '1932', '1934', ''],
        ['Moncef El Okby', '1934', '1946', "Long mandat d'avant-guerre."],
        ['Salah Aouidj', '1946', '1950', 'Président lors des deux premiers titres de champion.'],
        ['Mhammed Mestiri', '1950', '1953', ''],
        ['Mohamed El Asmi', '1953', '1954', ''],
        ['Salah Aouidj', '1954', '1957', ''],
        ['Mohamed El Asmi', '1957', '1958', ''],
        ['Salah Aouidj', '1958', '1964', ''],
        ['Abdelaziz Lasram', '1964', '1966', ''],
        ['Mahmoud Mestiri', '1966', '1967', ''],
        ['Fathi Zouhir', '1967', '1970', ''],
        ['Abdeljelil Mehiri', '1970', '1971', ''],
        ['Abdelaziz Lasram', '1971', '1977', ''],
        ['Farid Mokhtar', '1977', '1980', ''],
        ['Ridha Azzabi', '1980', '1981', ''],
        ['Farid Mokhtar', '1981', '1986', ''],
        ['Mahmoud Mestiri', '1986', '1987', ''],
        ['Ridha Azzabi', '1987', '1988', ''],
        ['Hamadi Bousbiaâ', '1988', '1990', ''],
        ['Farid Abbes', '1990', '1991', ''],
        ['Ridha Azzabi', '1991', '1992', 'Président durant le sacre africain de 1991.'],
        ['Chérif Bellamine', '1992', '1993', ''],
        ['Hamadi Bousbiaâ', '1993', '1994', ''],
        ['Hammouda Ben Ammar', '1994', '1996', ''],
        ['Saïd Néji', '1996', '1997', ''],
        ['Chérif Bellamine', '1997', '2000', ''],
        ['Farid Abbes', '2000', '2002', ''],
        ['Chérif Bellamine', '2002', '2006', ''],
        ['Kamel Idir', '2005', '2010', ''],
        ['Jamel Atrous', '2010', '2010', ''],
        ['Chérif Bellamine', '2010', '2010', ''],
        ['Jamel Atrous', '2011', '2012', ''],
        ['Slim Riahi', '2012', '2017', ''],
        ['Marwen Hamoudia', '2017', '2018', ''],
        ['Abdessalem Younsi', '2018', '2021', ''],
        ['Youssef El Almi', '2021', '2024', ''],
        ['Haykel Dkhil', '2024', '2025', ''],
        ['Mohsen Trabelsi', '2025', '', 'Président actuel.'],
      ];
      for (const p of presidents) insertPresident.run(...p);
    }

    if (isTableEmpty('coaches')) {
      const coaches = [
        ['Fabio Roccheggiani', 'Italie', 'années 1960', "Âge d'or : plusieurs titres de champion de Tunisie et records défensifs."],
        ['Ilie Balaci', 'Roumanie', '1991-1992', 'Coupe des clubs champions africaine 1991 et quadruplé 1991-92 (championnat, coupe, Afrique, coupe afro-asiatique).'],
        ['Faouzi Benzarti', 'Tunisie', 'plusieurs passages (1990s-2020s)', 'Plus grand entraîneur tunisien de sa génération, revenu à plusieurs reprises à la tête du CA.'],
        ['Maher Kanzari', 'Tunisie', '2019-2020, 2026-', 'Entraîneur actuel du Club Africain.'],
        ['Kouki', 'Tunisie', 'années 2010', "Entraîneur du CA à l'époque récente."],
        ['Labidi', 'Tunisie', 'années 2010', "Entraîneur du CA à l'époque récente."],
        ['Koster', 'Pays-Bas', 'années 2010', "Entraîneur du CA à l'époque récente."],
        ['Chauvin', 'France', '2010s-2020s', "Entraîneur du CA à l'époque récente."],
        ['Kebaier', 'Tunisie', '2010s-2020s', "Entraîneur du CA à l'époque récente."],
        ['Yacoubi', 'Tunisie', 'années 2020', "Entraîneur du CA à l'époque récente."],
        ['Louhichi', 'Tunisie', 'années 2020', "Entraîneur du CA à l'époque récente."],
      ];
      for (const c of coaches) insertCoach.run(...c);
    }

    if (isTableEmpty('historic_matches')) {
      const matches = [
        ['1991-11-23', 'Coupe des clubs champions africaine (finale aller)', 'SC Villa (Ouganda)', 'Victoire', '6-2', 'Stade El Menzah, Tunis (40 000 spectateurs)', "Mhaissi (30', 49'), Touati (44'), Sellimi (57'), Rouissi (79', pen. 84') ; Kato (33'), Musisi (81') pour Villa."],
        ['1991-12-14', 'Coupe des clubs champions africaine (finale retour)', 'SC Villa (Ouganda)', 'Match nul', '1-1', 'Stade Nakivubo, Kampala (25 000)', "Touati (51') ouvre le score, Butambuze (71') égalise. Le CA s'impose 7-3 au total et devient champion d'Afrique."],
        ['1991', 'Coupe des clubs champions africaine (demi-finale)', 'Nkana Red Devils (Zambie)', 'Qualification', '4-4 au total', '3-0 à Tunis, 1-4 à Kitwe', "Le CA atteint sa première finale continentale grâce à la règle des buts marqués à l'extérieur."],
        ['1992', 'Coupe afro-asiatique des clubs', 'Al-Hilal (Arabie saoudite)', 'Vainqueur', '', 'Match aller-retour', 'Titre de la Coupe afro-asiatique 1992, 4e trophée du quadruplé 1991-92.'],
        ['1971', 'Coupe des vainqueurs de coupe du Maghreb', 'Finale du Maghreb', 'Champion', '', '-', "Premier trophée international remporté par un club tunisien."],
        ['1998', 'Coupe de Tunisie (finale 1997-98)', 'Olympique de Béja', 'Victoire (aux tirs au but)', '1-1 (4-3 tab)', '-', 'Le CA remporte la Coupe de Tunisie aux tirs au but.'],
        ['2000', 'Coupe de Tunisie (finale 1999-2000)', 'CS Sfaxien', 'Victoire (aux tirs au but)', '0-0 (4-2 tab)', '-', ''],
        ['2003', 'Coupe de Tunisie (finale 2002-03)', 'Stade Tunisien', 'Défaite', '0-1', '-', ''],
        ['2006', 'Coupe de Tunisie (finale 2005-06)', 'Espérance de Tunis', 'Défaite (aux tirs au but)', '2-2 (5-4 tab)', '-', 'Derby de Tunis en finale.'],
        ['2017', 'Coupe de Tunisie (finale 2016-17)', 'US Ben Guerdane', 'Victoire', '1-0', '-', ''],
        ['2018', 'Coupe de Tunisie (finale 2017-18)', 'Étoile du Sahel', 'Victoire', '4-1', '-', 'Le CA conserve son trophée.'],
      ];
      for (const m of matches) insertHistoricMatch.run(...m);
    }

    if (isTableEmpty('club_facts')) {
      const facts = [
        ['Identité', 'Nom complet', 'Club Africain', 'Club omnisports tunisien fondé à Tunis.'],
        ['Identité', 'Fondation', '4 octobre 1920', 'À Bab Jedid, dans la médina de Tunis.'],
        ['Identité', 'Prédécesseur', 'Stade africain (1915-1918)', 'Le CA est considéré comme le prolongement naturel du Stade africain.'],
        ['Identité', 'Couleurs', 'Rouge et blanc', "Couleurs nationales de la Tunisie, imposées dès la fondation malgré l'opposition du protectorat."],
        ['Identité', 'Surnoms', 'El Ghalia, Al-Afriki, Les Clubistes', '« El Ghalia » signifie « la Bien-aimée ».'],
        ['Identité', 'Abréviation', 'CA', ''],
        ['Stade', 'Stade principal', 'Stade olympique Hammadi Agrebi (Radès)', 'Capacité : 65 000 places, ouvert en 2001.'],
        ['Stade', "Ancienne enceinte", "Stade olympique d'El Menzah (45 000)", "Stade historique du club pendant des décennies."],
        ['Stade', 'Ancienne enceinte', 'Stade Chedly Zouiten', ''],
        ['Club', 'Siège social', '57, avenue Bab Jedid, Tunis', ''],
        ['Records', "Premier club tunisien champion d'Afrique", '1991', 'Victoire en Coupe des clubs champions africaine (7-3 face à Villa SC).'],
        ['Records', 'Premier trophée international tunisien', '1971', 'Coupe des vainqueurs de coupe du Maghreb.'],
        ['Rivalités', 'Derby de Tunis', 'Espérance de Tunis', "L'un des derbys les plus importants d'Afrique du Nord."],
        ['Rivalités', 'Big Four', 'EST, ESS, CSS', 'Le CA fait partie des « quatre grands » du football tunisien.'],
        ['Supporters', 'Ultras', 'Club Africain Ultras', 'Supporters virage du CA.'],
        ['Structure', "Centre d'entraînement", 'Parc Mounir-Kebaili', ''],
        ['Sections', 'Sections actives', 'Football, Basketball, Handball, Volleyball, Natation, Water-polo', 'Le CA est l’un des plus grands clubs omnisports de Tunisie.'],
        ['Médias', 'Chaîne du club', 'CA-TV Online', ''],
      ];
      for (const f of facts) insertFact.run(...f);
    }

    const historicNews = [
      ['1947-06-01T00:00:00Z', '1946-47 : le Club Africain remporte son premier titre de champion de Tunisie', "Premier sacre national d'une longue histoire rouge et blanc.", '/news/ca-1947.jpg', 'Archives Club Africain'],
      ['1971-06-01T00:00:00Z', '1971 : première coupe maghrébine pour le CA', 'Le Club Africain devient le premier club tunisien à soulever un trophée international.', '/news/ca-1971.jpg', 'Archives Club Africain'],
      ['1991-12-14T00:00:00Z', "14 décembre 1991 : le Club Africain champion d'Afrique !", '7-3 au total face à Villa SC : le CA est le premier club tunisien sacré sur le continent.', '/news/ca-1991.jpg', 'Archives Club Africain'],
      ['1992-06-01T00:00:00Z', '1991-92 : le quadruplé historique du Club Africain', 'Championnat, coupe nationale, Afrique et coupe afro-asiatique : une saison inoubliable.', '/news/ca-1992.jpg', 'Archives Club Africain'],
      ['2008-06-01T00:00:00Z', '2007-08 : le CA champion de Tunisie', "Après 12 ans d'attente, le Club Africain renoue avec le titre national.", '/news/ca-2008.jpg', 'CA Media'],
      ['2015-06-01T00:00:00Z', '2014-15 : le CA champion de Tunisie', '19 ans après le dernier sacre, El Ghalia retrouve le trône.', '/news/ca-2015.jpg', 'CA Media'],
      ['2018-07-01T00:00:00Z', '2018 : le CA conserve la Coupe de Tunisie', "Deuxième Coupe consécutive (4-1 face à l'ESS) pour le Club Africain.", '/news/ca-2018.jpg', 'CA Media'],
    ];
    for (const [date, title, excerpt, image, author] of historicNews) {
      const exists = db.prepare('SELECT COUNT(*) as c FROM news WHERE title = ?').get(title).c;
      if (exists === 0) insertHistoricNews.run(1, title, excerpt, image, author, date);
    }
  });
  tx();
}

initDB();
seedDB();
seedHistory();
seedAdmin();

function seedAdmin() {
  const existingAdmin = db.prepare("SELECT id FROM profiles WHERE role = 'admin'").get();
  if (existingAdmin) return;

  const email = (process.env.ADMIN_EMAIL || 'admin@clubafricain.tn').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const hasEmail = db.prepare('SELECT id FROM profiles WHERE email = ?').get(email);
  if (hasEmail) return;

  const id = 'adm_' + crypto.randomBytes(8).toString('hex');
  const salt = generateSalt();
  db.transaction(() => {
    db.prepare('INSERT INTO profiles (id, username, email, password_hash, password_salt, role, avatar, full_name, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, 'Admin CA', email, hashPassword(password, salt), salt, 'admin', '', null, null);
    db.prepare('INSERT INTO balances (user_id, cat_coins, real_money_dt, game_money_sca) VALUES (?, 0, 0, 0)').run(id);
  })();
  console.log(`  👑  Compte admin créé: ${email} / ${password}  (changez ce mot de passe !)`);
  console.log(`  🔑  Utilisez ADMIN_EMAIL / ADMIN_PASSWORD pour personnaliser`);
}

// ========== Auth Middleware ==========
function readToken(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

function authIdentity(req) {
  const decoded = readToken(req);
  if (!decoded) return null;
  const profile = db.prepare('SELECT id, token_version FROM profiles WHERE id = ?').get(decoded.userId);
  if (!profile) return null;
  if ((profile.token_version || 0) !== (decoded.ver || 0)) return null;
  return decoded;
}

function requireAuth(req, res, next) {
  const identity = authIdentity(req);
  if (!identity) return res.status(401).json({ error: 'Non authentifié' });
  req.userId = identity.userId;
  next();
}

function optionalAuth(req, res, next) {
  const decoded = readToken(req);
  req.userId = null;
  if (decoded) {
    const profile = db.prepare('SELECT id, token_version FROM profiles WHERE id = ?').get(decoded.userId);
    if (profile && (profile.token_version || 0) === (decoded.ver || 0)) req.userId = decoded.userId;
  }
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    const profile = db.prepare('SELECT role FROM profiles WHERE id = ?').get(req.userId);
    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    next();
  });
}

app.use('/api', optionalAuth);

// ========== Auth Routes ==========
app.post('/auth/signup', (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  let username = typeof req.body.username === 'string' ? req.body.username.trim() : '';

  if (!isValidEmail(email)) return res.status(400).json({ error: 'Adresse email invalide' });
  if (password.length < 8) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins une lettre et un chiffre' });
  }
  if (!username) username = (email.split('@')[0] || 'fan').replace(/[^a-zA-Z0-9_-]/g, '') || 'fan';
  if (username.length < 3 || username.length > 30) return res.status(400).json({ error: "Le nom d'utilisateur doit contenir entre 3 et 30 caractères" });
  if (db.prepare('SELECT id FROM profiles WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'Cette adresse email est déjà utilisée' });
  }
  if (db.prepare('SELECT id FROM profiles WHERE username = ?').get(username)) {
    return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris" });
  }

  const id = 'usr_' + crypto.randomBytes(8).toString('hex');
  const salt = generateSalt();
  db.transaction(() => {
    db.prepare('INSERT INTO profiles (id, username, email, password_hash, password_salt, role, avatar, full_name, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, username, email, hashPassword(password, salt), salt, 'fan', '', null, null);
    db.prepare('INSERT INTO balances (user_id, cat_coins, real_money_dt, game_money_sca) VALUES (?, 0, 0, 0)').run(id);
  })();

  logEvent('auth.signup', { user_id: id, email, ip: req.ip });
  const verifyTokenStr = createEmailToken(id, 'verify');
  const verifyUrl = `${CONFIG.PUBLIC_URL}/auth/verify?token=${verifyTokenStr}`;
  sendMail({
    to: email,
    subject: 'Confirmez votre adresse email',
    html: `<p>Bienvenue, ${username} !</p><p>Confirmez votre adresse email pour terminer votre inscription :</p><p><a href="${verifyUrl}" style="display:inline-block;background:#cc0000;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700">Confirmer mon email</a></p><p class="muted">Valable ${CONFIG.EMAIL_VERIFY_TTL_HOURS} h. Si le bouton ne fonctionne pas : ${verifyUrl}</p>`,
  });

  const profileRow = { id, username, email, avatar: '', role: 'fan', full_name: null, phone: null, email_verified: 0 };
  const token = signToken(id, 0);
  res.status(201).json({
    access_token: token,
    token_type: 'Bearer',
    expires_in: TOKEN_TTL_SECONDS,
    requires_email_verification: CONFIG.REQUIRE_EMAIL_VERIFICATION,
    user: publicUser(profileRow),
  });
});

app.post('/auth/signin', (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  const profile = db.prepare('SELECT * FROM profiles WHERE email = ?').get(email);
  if (!profile || !profile.password_hash || !profile.password_salt) {
    logEvent('auth.login_failed', { email, ip: req.ip, detail: 'no account' });
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  if (profile.locked_until && new Date(profile.locked_until).getTime() > Date.now()) {
    return res.status(423).json({ error: 'Compte temporairement verrouillé. Réessayez plus tard.' });
  }

  const hash = hashPassword(password, profile.password_salt);
  const a = Buffer.from(hash);
  const b = Buffer.from(profile.password_hash);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!ok) {
    const attempts = (profile.failed_attempts || 0) + 1;
    if (attempts >= CONFIG.LOCKOUT_THRESHOLD) {
      const until = new Date(Date.now() + CONFIG.LOCKOUT_MINUTES * 60000).toISOString();
      db.prepare('UPDATE profiles SET failed_attempts = 0, locked_until = ? WHERE id = ?').run(until, profile.id);
      logEvent('auth.lockout', { user_id: profile.id, email, ip: req.ip, detail: `${CONFIG.LOCKOUT_MINUTES} min` });
      return res.status(423).json({ error: 'Trop de tentatives. Compte verrouillé quelques minutes.' });
    }
    db.prepare('UPDATE profiles SET failed_attempts = ? WHERE id = ?').run(attempts, profile.id);
    logEvent('auth.login_failed', { user_id: profile.id, email, ip: req.ip, detail: 'bad password' });
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  db.prepare('UPDATE profiles SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(profile.id);
  if (CONFIG.REQUIRE_EMAIL_VERIFICATION && !profile.email_verified) {
    return res.status(403).json({ error: 'Adresse email non confirmée. Vérifiez votre boîte mail.' });
  }

  logEvent('auth.login', { user_id: profile.id, ip: req.ip });
  const token = signToken(profile.id, profile.token_version || 0);
  res.json({ access_token: token, token_type: 'Bearer', expires_in: TOKEN_TTL_SECONDS, requires_email_verification: CONFIG.REQUIRE_EMAIL_VERIFICATION, user: publicUser(profile) });
});

app.get('/auth/user', requireAuth, (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.userId);
  if (!profile) return res.status(401).json({ error: 'Utilisateur introuvable' });
  res.json(publicUser(profile));
});

app.post('/auth/change-password', requireAuth, (req, res) => {
  const { current_password, new_password } = req.body;
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.userId);
  if (!profile) return res.status(401).json({ error: 'Utilisateur introuvable' });

  if (!profile.password_hash) return res.status(400).json({ error: 'Compte sans mot de passe, contactez un administrateur' });
  const currentHash = hashPassword(current_password || '', profile.password_salt);
  const a = Buffer.from(currentHash);
  const b = Buffer.from(profile.password_hash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    logEvent('auth.change_password_failed', { user_id: req.userId, ip: req.ip });
    return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
  }
  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
  }
  if (!/[A-Za-z]/.test(new_password) || !/[0-9]/.test(new_password)) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins une lettre et un chiffre' });
  }

  const salt = generateSalt();
  const nextVer = (profile.token_version || 0) + 1;
  db.prepare('UPDATE profiles SET password_hash = ?, password_salt = ?, token_version = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?')
    .run(hashPassword(new_password, salt), salt, nextVer, req.userId);
  logEvent('auth.password_changed', { user_id: req.userId, ip: req.ip });
  res.json({ success: true, message: 'Mot de passe mis à jour. Vous devez vous reconnecter.' });
});

// ---------- Email verification ----------
app.post('/auth/verify/resend', requireAuth, (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.userId);
  if (!profile) return res.status(401).json({ error: 'Utilisateur introuvable' });
  if (profile.email_verified) return res.status(400).json({ error: 'Email déjà vérifiée' });
  const t = createEmailToken(profile.id, 'verify');
  const url = `${CONFIG.PUBLIC_URL}/auth/verify?token=${t}`;
  sendMail({
    to: profile.email,
    subject: 'Confirmez votre adresse email',
    html: `<p>Bonjour ${profile.username},</p><p>Confirmez votre adresse email :</p><p><a href="${url}" style="display:inline-block;background:#cc0000;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700">Confirmer mon email</a></p><p class="muted">${url}</p>`,
  });
  logEvent('auth.verify_resend', { user_id: profile.id, ip: req.ip });
  res.json({ success: true, message: 'Email de confirmation renvoyé' });
});

app.get('/auth/verify', (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  const row = consumeEmailToken('verify', token);
  if (!row) return res.status(400).send(htmlPage('Confirmation', `<div class="card"><h1 class="ko">Lien invalide ou expiré</h1><p>Ce lien de confirmation est invalide ou a expiré. Demandez un nouveau lien depuis l'application.</p></div>`));
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(row.user_id);
  if (!profile) return res.status(400).send(htmlPage('Confirmation', `<div class="card"><h1 class="ko">Compte introuvable</h1><p>Réessayez depuis l'application.</p></div>`));
  db.prepare('UPDATE profiles SET email_verified = 1 WHERE id = ?').run(profile.id);
  logEvent('auth.email_verified', { user_id: profile.id, email: profile.email, ip: req.ip });
  res.send(htmlPage('Confirmation', `<div class="card"><h1 class="ok">✔ Email confirmée</h1><p>Votre compte <strong>${profile.username}</strong> est maintenant vérifié. Vous pouvez vous connecter depuis l'application.</p></div>`));
});

// ---------- Password reset ----------
app.post('/auth/forgot-password', (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const profile = isValidEmail(email) ? db.prepare('SELECT * FROM profiles WHERE email = ?').get(email) : null;
  if (profile) {
    const t = createEmailToken(profile.id, 'reset');
    const url = `${CONFIG.PUBLIC_URL}/auth/reset?token=${t}`;
    sendMail({
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `<p>Bonjour ${profile.username},</p><p>Cliquez pour choisir un nouveau mot de passe :</p><p><a href="${url}" style="display:inline-block;background:#cc0000;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700">Réinitialiser</a></p><p class="muted">Lien valable ${CONFIG.PASSWORD_RESET_TTL_MINUTES} minutes : ${url}</p>`,
    });
    logEvent('auth.reset_requested', { user_id: profile.id, ip: req.ip });
  }
  res.json({ success: true, message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
});

app.get('/auth/forgot', (req, res) => {
  res.send(htmlPage('Mot de passe oublié', `<div class="card"><h1>Mot de passe oublié</h1><p>Saisissez l'adresse email de votre compte. Un lien de réinitialisation vous sera envoyé.</p><form method="post" action="/auth/forgot-password"><input type="email" name="email" placeholder="votre@email.tn" required><button>Envoyer le lien</button></form></div>`));
});

app.get('/auth/reset', (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) return res.redirect('/auth/forgot');
  const row = validateEmailToken('reset', token);
  if (!row) return res.status(400).send(htmlPage('Réinitialisation', `<div class="card"><h1 class="ko">Lien invalide ou expiré</h1><p>Redemandez un lien de réinitialisation.</p><p><a href="/auth/forgot" style="color:#cc0000">Demander un nouveau lien</a></p></div>`));
  res.send(htmlPage('Nouveau mot de passe', `<div class="card"><h1>Nouveau mot de passe</h1><p>Choisissez un mot de passe d'au moins 8 caractères (lettres et chiffres).</p><form method="post" action="/auth/reset"><input type="hidden" name="token" value="${token}"><input type="password" name="password" placeholder="Nouveau mot de passe" required minlength="8"><button>Mettre à jour</button></form></div>`));
});

app.post('/auth/reset', (req, res) => {
  const token = typeof req.body.token === 'string' ? req.body.token : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const row = consumeEmailToken('reset', token);
  if (!row) return res.status(400).send(htmlPage('Réinitialisation', `<div class="card"><h1 class="ko">Lien invalide ou expiré</h1><p>Redemandez un lien de réinitialisation.</p></div>`));
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).send(htmlPage('Réinitialisation', `<div class="card"><h1 class="ko">Mot de passe trop faible</h1><p>Au moins 8 caractères, avec une lettre et un chiffre.</p><p><a href="/auth/reset?token=${token}" style="color:#cc0000">Réessayer</a></p></div>`));
  }
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(row.user_id);
  if (!profile) return res.status(400).send(htmlPage('Réinitialisation', `<div class="card"><h1 class="ko">Compte introuvable</h1></div>`));
  const salt = generateSalt();
  const nextVer = (profile.token_version || 0) + 1;
  db.prepare('UPDATE profiles SET password_hash = ?, password_salt = ?, token_version = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?')
    .run(hashPassword(password, salt), salt, nextVer, profile.id);
  logEvent('auth.password_reset', { user_id: profile.id, ip: req.ip });
  res.send(htmlPage('Réinitialisation', `<div class="card"><h1 class="ok">✔ Mot de passe mis à jour</h1><p>Vous pouvez maintenant vous connecter depuis l'application avec votre nouveau mot de passe.</p></div>`));
});

// ========== API Routes ==========

// Profiles
app.get('/api/profiles', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.userId);
  res.json(row ? [publicUser(row)] : []);
});

app.put('/api/profiles', requireAuth, (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.userId);
  if (!profile) return res.status(401).json({ error: 'Utilisateur introuvable' });

  const updates = [];
  const params = [];
  const { username, full_name, phone, avatar } = req.body;

  if (username !== undefined && username !== null) {
    const uname = String(username).trim();
    if (uname.length < 3 || uname.length > 30) return res.status(400).json({ error: "Le nom d'utilisateur doit contenir entre 3 et 30 caractères" });
    if (db.prepare('SELECT id FROM profiles WHERE username = ? AND id != ?').get(uname, req.userId)) {
      return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris" });
    }
    updates.push('username = ?'); params.push(uname);
  }
  if (full_name !== undefined) { updates.push('full_name = ?'); params.push(full_name ? String(full_name).slice(0, 60) : null); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone ? String(phone).slice(0, 20) : null); }
  if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar ? String(avatar).slice(0, 50) : ''); }

  if (updates.length === 0) return res.status(400).json({ error: 'Aucune modification fournie' });
  params.push(req.userId);
  db.prepare(`UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.userId);
  res.json(publicUser(updated));
});

// Balances
app.get('/api/balances', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM balances WHERE user_id = ?').get(req.userId);
  res.json(row ? [row] : []);
});

// Matches
app.get('/api/matches', (req, res) => {
  const rows = db.prepare('SELECT * FROM matches ORDER BY date DESC').all();
  res.json(rows);
});

// Tickets
app.get('/api/tickets', requireAuth, (req, res) => {
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
app.get('/api/predictions', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM predictions WHERE user_id = ?').all(req.userId);
  res.json(rows);
});

app.post('/api/predictions', requireAuth, (req, res) => {
  const { match_id, home_score, away_score } = req.body;
  db.prepare('INSERT OR REPLACE INTO predictions (user_id, match_id, home_score, away_score) VALUES (?, ?, ?, ?)').run(req.userId, match_id, home_score, away_score);
  const row = db.prepare('SELECT * FROM predictions WHERE user_id = ? AND match_id = ?').get(req.userId, match_id);
  res.json(row);
});

// Fantasy Teams
app.get('/api/fantasy_teams', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM fantasy_teams WHERE user_id = ?').get(req.userId);
  res.json(row ? [row] : []);
});

app.post('/api/fantasy_teams', requireAuth, (req, res) => {
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
app.post('/api/player_votes', requireAuth, (req, res) => {
  const { match_id, player_name } = req.body;
  db.prepare('INSERT OR REPLACE INTO player_votes (user_id, match_id, player_name) VALUES (?, ?, ?)').run(req.userId, match_id, player_name);
  res.json({ match_id, player_name });
});

// Missions
app.get('/api/missions', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM missions WHERE user_id = ?').all(req.userId);
  res.json(rows);
});

app.post('/api/missions/claim', requireAuth, (req, res) => {
  const { mission_id } = req.body;
  const mission = db.prepare('SELECT * FROM missions WHERE id = ? AND user_id = ?').get(mission_id, req.userId);
  if (mission && mission.completed && !mission.claimed) {
    db.prepare('UPDATE missions SET claimed = 1 WHERE id = ?').run(mission_id);
    db.prepare('UPDATE balances SET cat_coins = cat_coins + ? WHERE user_id = ?').run(mission.coins, req.userId);
    db.prepare("INSERT INTO transactions (user_id, type, currency, amount, description) VALUES (?, 'earn', 'CAT', ?, ?)").run(req.userId, mission.coins, `Mission: ${mission.label}`);
  }
  res.json({ success: true });
});

app.post('/api/missions/claim-all', requireAuth, (req, res) => {
  const missions = db.prepare('SELECT * FROM missions WHERE user_id = ? AND completed = 1 AND claimed = 0').all(req.userId);
  const total = missions.reduce((sum, m) => sum + m.coins, 0);
  if (total > 0) {
    db.prepare('UPDATE missions SET claimed = 1 WHERE user_id = ? AND completed = 1 AND claimed = 0').run(req.userId);
    db.prepare('UPDATE balances SET cat_coins = cat_coins + ? WHERE user_id = ?').run(total, req.userId);
  }
  res.json({ total_coins: total });
});

// Transactions
app.get('/api/transactions', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(rows);
});

// Notifications
app.get('/api/notifications', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(rows);
});

app.post('/api/notifications/read', requireAuth, (req, res) => {
  const { id } = req.body;
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(id, req.userId);
  res.json({ success: true });
});

app.post('/api/notifications/read-all', requireAuth, (req, res) => {
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

app.post('/api/coin_packs/buy', requireAuth, (req, res) => {
  const { pack_id } = req.body;
  const pack = db.prepare('SELECT * FROM coin_packs WHERE id = ?').get(pack_id);
  if (!pack) return res.status(404).json({ error: 'Pack introuvable' });
  const bonus = Math.floor(pack.coins * (pack.bonus_pct / 100));
  const total = pack.coins + bonus;
  const order = createOrder(req.userId, {
    kind: 'coin_pack',
    amount_dt: pack.price_dt,
    item_summary: `Pack ${pack.coins} Coins (+${bonus})`,
  });
  db.prepare('UPDATE orders SET meta = ? WHERE id = ?').run(JSON.stringify({ coins: total }), order.id);

  if (CONFIG.PAYMENT_PROVIDER === 'mock') {
    const paid = markOrderPaid(order, order.ref);
    db.prepare('UPDATE balances SET cat_coins = cat_coins + ? WHERE user_id = ?').run(total, req.userId);
    db.prepare("INSERT INTO transactions (user_id, type, currency, amount, description) VALUES (?, 'purchase', 'CAT', ?, ?)").run(req.userId, total, `Achat pack ${pack.coins} Coins`);
    return res.json({ status: 'paid', coins_added: total, pack, order: paid });
  }

  res.json({
    status: order.status,
    message: 'Paiement en attente. Finalisez avec votre moyen de paiement.',
    order: { ref: order.ref, amount_dt: order.amount_dt, currency: order.currency },
  });
});

app.get('/api/orders', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(req.userId);
  res.json(rows);
});

app.get('/api/orders/:ref', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE ref = ? AND user_id = ?').get(req.params.ref, req.userId);
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  res.json(order);
});

app.get('/api/orders/:ref/receipt', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE ref = ? AND user_id = ?').get(req.params.ref, req.userId);
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  if (order.status !== 'paid' || !order.receipt_number) return res.status(400).json({ error: 'Aucun reçu disponible pour cette commande' });
  const profile = db.prepare('SELECT username, full_name FROM profiles WHERE id = ?').get(order.user_id);
  res.json({
    receipt_number: order.receipt_number,
    ref: order.ref,
    date: order.paid_at,
    customer: profile.full_name || profile.username,
    item: order.item_summary,
    amount_dt: order.amount_dt,
    currency: order.currency,
    status: 'paid',
    provider: order.provider,
  });
});

// ---------- Payment webhook ----------
app.post('/payments/webhook/:provider', (req, res) => {
  const provider = String(req.params.provider || '').toLowerCase();
  const body = req.body || {};

  if (CONFIG.PAYMENT_WEBHOOK_SECRET) {
    const provided = body.secret || req.headers['x-webhook-secret'] || req.headers['x-webhook-signature'] || '';
    if (String(provided) !== CONFIG.PAYMENT_WEBHOOK_SECRET) {
      logEvent('pay.webhook_bad_secret', { ip: req.ip, detail: provider });
      return res.status(401).json({ error: 'invalid signature' });
    }
  }

  const ref = body.order_ref || body.reference || (typeof body.order === 'object' && body.order ? body.order.ref : null) || null;
  if (!ref) return res.status(400).json({ error: 'missing order ref' });
  const order = db.prepare('SELECT * FROM orders WHERE ref = ?').get(ref);
  if (!order) return res.status(404).json({ error: 'order not found' });
  if (order.status === 'paid') return res.json({ ok: true, already: true });

  const isPaid = body.status === 'paid' || body.paid === true || body.success === true;
  if (isPaid) {
    const externalRef = body.transaction_id || body.id || body.payment_id || null;
    markOrderPaid(order, externalRef);
    if (order.kind === 'coin_pack') {
      let coins = 0;
      try { coins = (JSON.parse(order.meta || '{}').coins) || 0; } catch (err) {}
      if (coins > 0) {
        db.prepare('UPDATE balances SET cat_coins = cat_coins + ? WHERE user_id = ?').run(coins, order.user_id);
        db.prepare("INSERT INTO transactions (user_id, type, currency, amount, description) VALUES (?, 'purchase', 'CAT', ?, ?)").run(order.user_id, coins, order.item_summary || 'Achat de Coins');
      }
    } else if (order.kind === 'donation') {
      db.prepare('INSERT INTO donations (user_id, amount_dt) VALUES (?, ?)').run(order.user_id, order.amount_dt);
      db.prepare("INSERT INTO transactions (user_id, type, currency, amount, description) VALUES (?, 'donation', 'DT', ?, ?)").run(order.user_id, order.amount_dt, 'Don au Club Africain');
    }
    logEvent('pay.webhook_paid', { user_id: order.user_id, ip: req.ip, detail: `${provider} ${order.ref}` });
    return res.json({ ok: true });
  }
  if (body.status === 'failed' || body.failed === true) {
    db.prepare("UPDATE orders SET status = 'failed', external_ref = ? WHERE id = ?").run(externalRefOf(body), order.id);
    return res.json({ ok: true });
  }
  res.json({ ok: true, status: order.status });
});

function externalRefOf(body) {
  return body.transaction_id || body.id || body.payment_id || null;
}

app.post('/api/donations', requireAuth, (req, res) => {
  const { amount_dt } = req.body;
  if (!amount_dt || amount_dt <= 0) return res.status(400).json({ error: 'Montant invalide' });
  const amount = Number(amount_dt);
  const order = createOrder(req.userId, { kind: 'donation', amount_dt: amount, item_summary: 'Don au Club Africain' });

  if (CONFIG.PAYMENT_PROVIDER === 'mock') {
    const paid = markOrderPaid(order, order.ref);
    db.prepare('INSERT INTO donations (user_id, amount_dt) VALUES (?, ?)').run(req.userId, amount);
    db.prepare("INSERT INTO transactions (user_id, type, currency, amount, description) VALUES (?, 'donation', 'DT', ?, ?)").run(req.userId, amount, 'Don au Club Africain');
    return res.json({ success: true, amount_dt: amount, order: { ref: paid.ref, receipt_number: paid.receipt_number, amount_dt: paid.amount_dt, currency: paid.currency } });
  }

  res.json({ success: false, message: 'Paiement en attente. Finalisez avec votre moyen de paiement.', order: { ref: order.ref, amount_dt: order.amount_dt, currency: order.currency } });
});

app.post('/api/convert', requireAuth, (req, res) => {
  const { amount_sca } = req.body;
  if (!amount_sca || amount_sca < 100000) return res.status(400).json({ error: 'Minimum 100 000 $CA' });
  const rate = 200;
  const coins = Math.floor(amount_sca / rate);
  const balance = db.prepare('SELECT game_money_sca FROM balances WHERE user_id = ?').get(req.userId);
  if (!balance || balance.game_money_sca < amount_sca) return res.status(400).json({ error: 'Game money insuffisant' });
  db.prepare('UPDATE balances SET game_money_sca = game_money_sca - ?, cat_coins = cat_coins + ? WHERE user_id = ?').run(amount_sca, coins, req.userId);
  db.prepare("INSERT INTO transactions (user_id, type, currency, amount, description) VALUES (?, 'convert', 'SCA', ?, ?)").run(req.userId, amount_sca, `Conversion en Coins`);
  res.json({ coins_earned: coins, amount_sca });
});

app.post('/api/ads/watch', requireAuth, (req, res) => {
  const coins = 50;
  db.prepare('UPDATE balances SET cat_coins = cat_coins + ? WHERE user_id = ?').run(coins, req.userId);
  db.prepare("INSERT INTO transactions (user_id, type, currency, amount, description) VALUES (?, 'earn', 'CAT', ?, ?)").run(req.userId, coins, 'Regarder une pub');
  res.json({ coins_earned: coins });
});

app.post('/api/donations', requireAuth, (req, res) => {
  const { amount_dt } = req.body;
  if (!amount_dt || amount_dt <= 0) return res.status(400).json({ error: 'Montant invalide' });
  db.prepare('INSERT INTO donations (user_id, amount_dt) VALUES (?, ?)').run(req.userId, amount_dt);
  db.prepare('UPDATE balances SET real_money_dt = real_money_dt - ? WHERE user_id = ?').run(amount_dt, req.userId);
  res.json({ success: true, amount_dt });
});

app.post('/api/tickets/buy', requireAuth, (req, res) => {
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

app.post('/api/fan_posts', requireAuth, (req, res) => {
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
  const unreadNotifs = req.userId
    ? db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read = 0').get(req.userId).c
    : 0;
  res.json({ liveMatches, news, nextMatch, standings, unreadNotifs });
});

// ========== Community: Member Directory ==========
app.get('/api/community/members', (req, res) => {
  const { query } = req.query;
  let sql = `
    SELECT p.id as user_id, p.username, p.avatar, p.role,
      COALESCE(b.cat_coins, 0) as cat_coins,
      (SELECT COUNT(*) FROM donations d WHERE d.user_id = p.id) as donations_count,
      (SELECT COUNT(*) FROM predictions pr WHERE pr.user_id = p.id) as predictions_count,
      (SELECT COUNT(*) FROM fan_posts fp WHERE fp.user_id = p.id) as posts_count,
      (SELECT COUNT(*) FROM friendships f2 WHERE (f2.user_id = p.id OR f2.friend_id = p.id) AND f2.status = 'accepted') as friends_count
    FROM profiles p
    LEFT JOIN balances b ON b.user_id = p.id
  `;
  const params = [];
  if (query) {
    sql += ' WHERE LOWER(p.username) LIKE ?';
    params.push(`%${String(query).toLowerCase()}%`);
  }
  sql += ' ORDER BY b.cat_coins DESC, p.username ASC LIMIT 100';
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/community/members/:id', (req, res) => {
  const member = db.prepare(`
    SELECT p.id as user_id, p.username, p.avatar, p.role, p.created_at,
      COALESCE(b.cat_coins, 0) as cat_coins, COALESCE(b.game_money_sca, 0) as game_money_sca,
      (SELECT COUNT(*) FROM donations d WHERE d.user_id = p.id) as donations_count,
      (SELECT COALESCE(SUM(d.amount_dt), 0) FROM donations d WHERE d.user_id = p.id) as donations_total,
      (SELECT COUNT(*) FROM predictions pr WHERE pr.user_id = p.id) as predictions_count,
      (SELECT COUNT(*) FROM fan_posts fp WHERE fp.user_id = p.id) as posts_count,
      (SELECT COUNT(*) FROM friendships f2 WHERE (f2.user_id = p.id OR f2.friend_id = p.id) AND f2.status = 'accepted') as friends_count
    FROM profiles p
    LEFT JOIN balances b ON b.user_id = p.id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Membre introuvable' });
  res.json(member);
});

// ========== Friends ==========
// My friends (both directions, accepted)
app.get('/api/friends', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT f.friend_id as user_id, p.username, p.avatar, p.role, f.created_at
    FROM friendships f JOIN profiles p ON p.id = f.friend_id
    WHERE f.user_id = ? AND f.status = 'accepted'
    UNION
    SELECT f.user_id as user_id, p.username, p.avatar, p.role, f.created_at
    FROM friendships f JOIN profiles p ON p.id = f.user_id
    WHERE f.friend_id = ? AND f.status = 'accepted'
  `).all(req.userId, req.userId);
  res.json(rows);
});

// Incoming requests (received by me, still pending)
app.get('/api/friends/requests', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT f.id as request_id, f.user_id, p.username, p.avatar, p.role, f.created_at
    FROM friendships f JOIN profiles p ON p.id = f.user_id
    WHERE f.friend_id = ? AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `).all(req.userId);
  res.json(rows);
});

// Requests I sent (still pending)
app.get('/api/friends/sent', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT f.friend_id as user_id, p.username, p.avatar, p.role, f.created_at
    FROM friendships f JOIN profiles p ON p.id = f.friend_id
    WHERE f.user_id = ? AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `).all(req.userId);
  res.json(rows);
});

app.post('/api/friends/request', requireAuth, (req, res) => {
  const { to_user_id } = req.body;
  if (!to_user_id || to_user_id === req.userId) return res.status(400).json({ error: 'Destinataire invalide' });
  const target = db.prepare('SELECT id FROM profiles WHERE id = ?').get(to_user_id);
  if (!target) return res.status(404).json({ error: 'Membre introuvable' });

  // Mutual request: accept it immediately
  const inverse = db.prepare('SELECT * FROM friendships WHERE user_id = ? AND friend_id = ?').get(to_user_id, req.userId);
  if (inverse) {
    if (inverse.status === 'accepted') return res.status(409).json({ error: 'Vous êtes déjà amis' });
    db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").run(inverse.id);
    return res.json({ status: 'accepted', message: 'Vous êtes maintenant amis' });
  }

  const existing = db.prepare('SELECT * FROM friendships WHERE user_id = ? AND friend_id = ?').get(req.userId, to_user_id);
  if (existing) {
    return res.status(409).json({ error: existing.status === 'accepted' ? 'Vous êtes déjà amis' : 'Demande déjà envoyée' });
  }
  db.prepare("INSERT INTO friendships (user_id, friend_id, status, action_user_id) VALUES (?, ?, 'pending', ?)").run(req.userId, to_user_id, req.userId);
  res.status(201).json({ status: 'pending' });
});

app.post('/api/friends/accept', requireAuth, (req, res) => {
  const { request_id } = req.body;
  const rel = db.prepare("SELECT * FROM friendships WHERE id = ? AND friend_id = ? AND status = 'pending'").get(request_id, req.userId);
  if (!rel) return res.status(404).json({ error: 'Demande introuvable' });
  db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").run(request_id);
  res.json({ success: true });
});

app.post('/api/friends/decline', requireAuth, (req, res) => {
  const { request_id } = req.body;
  db.prepare('DELETE FROM friendships WHERE id = ? AND friend_id = ?').run(request_id, req.userId);
  res.json({ success: true });
});

app.post('/api/friends/cancel', requireAuth, (req, res) => {
  const { user_id } = req.body;
  db.prepare("DELETE FROM friendships WHERE user_id = ? AND friend_id = ? AND status = 'pending'").run(req.userId, user_id);
  res.json({ success: true });
});

app.delete('/api/friends/:userId', requireAuth, (req, res) => {
  const uid = req.params.userId;
  db.prepare('DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)').run(req.userId, uid, uid, req.userId);
  res.json({ success: true });
});

// ========== Admin ==========
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  res.json({
    users: db.prepare('SELECT COUNT(*) as c FROM profiles').get().c,
    admins: db.prepare("SELECT COUNT(*) as c FROM profiles WHERE role = 'admin'").get().c,
    fan_posts: db.prepare('SELECT COUNT(*) as c FROM fan_posts').get().c,
    donations_total: db.prepare('SELECT COALESCE(SUM(amount_dt), 0) as t FROM donations').get().t,
    donations_count: db.prepare('SELECT COUNT(*) as c FROM donations').get().c,
    tickets_sold: db.prepare('SELECT COUNT(*) as c FROM tickets').get().c,
    predictions: db.prepare('SELECT COUNT(*) as c FROM predictions').get().c,
    news_count: db.prepare('SELECT COUNT(*) as c FROM news').get().c,
    matches: db.prepare('SELECT COUNT(*) as c FROM sport_matches').get().c,
    transactions: db.prepare('SELECT COUNT(*) as c FROM transactions').get().c,
  });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const { query } = req.query;
  let sql = `SELECT p.id, p.username, p.email, p.role, p.avatar, p.created_at,
      COALESCE(b.cat_coins, 0) as cat_coins, COALESCE(b.real_money_dt, 0) as real_money_dt
    FROM profiles p LEFT JOIN balances b ON b.user_id = p.id`;
  const params = [];
  if (query) {
    sql += ' WHERE LOWER(p.username) LIKE ? OR LOWER(p.email) LIKE ?';
    params.push(`%${String(query).toLowerCase()}%`, `%${String(query).toLowerCase()}%`);
  }
  sql += ' ORDER BY p.created_at DESC LIMIT 200';
  res.json(db.prepare(sql).all(...params));
});

app.put('/api/admin/users/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['fan', 'vip', 'admin'].includes(role)) return res.status(400).json({ error: 'Rôle invalide' });
  const target = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' });
  if (target.id === req.userId) return res.status(400).json({ error: 'Impossible de modifier votre propre rôle' });
  db.prepare('UPDATE profiles SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json(publicUser({ ...target, role }));
});

app.get('/api/admin/news', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT n.*, s.label as sport_label FROM news n LEFT JOIN sports s ON s.id = n.sport_id ORDER BY n.created_at DESC LIMIT 100').all();
  res.json(rows);
});

app.post('/api/admin/news', requireAdmin, (req, res) => {
  const { sport_id, title, excerpt, content, image_url, published } = req.body;
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Titre requis' });
  const result = db.prepare('INSERT INTO news (sport_id, title, excerpt, content, image_url, author, published) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(sport_id ? Number(sport_id) : null, String(title).trim(), excerpt || '', content || '', image_url || '', 'Admin', published === false ? 0 : 1);
  res.status(201).json(db.prepare('SELECT * FROM news WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/admin/news/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM news WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Actualité introuvable' });
  const { sport_id, title, excerpt, content, image_url, published } = req.body;
  const fields = [];
  const params = [];
  if (sport_id !== undefined) { fields.push('sport_id = ?'); params.push(sport_id ? Number(sport_id) : null); }
  if (title !== undefined) { fields.push('title = ?'); params.push(String(title).trim() || 'Sans titre'); }
  if (excerpt !== undefined) { fields.push('excerpt = ?'); params.push(String(excerpt)); }
  if (content !== undefined) { fields.push('content = ?'); params.push(String(content)); }
  if (image_url !== undefined) { fields.push('image_url = ?'); params.push(String(image_url)); }
  if (published !== undefined) { fields.push('published = ?'); params.push(published ? 1 : 0); }
  if (fields.length === 0) return res.status(400).json({ error: 'Aucune modification' });
  params.push(req.params.id);
  db.prepare(`UPDATE news SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  res.json(db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id));
});

app.delete('/api/admin/news/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Actualité introuvable' });
  res.json({ success: true });
});

app.get('/api/admin/matches', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM sport_matches ORDER BY date DESC LIMIT 100').all());
});

app.post('/api/admin/matches', requireAdmin, (req, res) => {
  const { sport_id, home_team, away_team, date, venue, competition, status, home_score, away_score } = req.body;
  if (!home_team || !away_team || !date) return res.status(400).json({ error: 'Champs requis manquants (équipes et date)' });
  const result = db.prepare('INSERT INTO sport_matches (sport_id, home_team, away_team, date, venue, competition, status, home_score, away_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(sport_id ? Number(sport_id) : 1, home_team, away_team, date, venue || '', competition || '', status || 'upcoming', home_score ?? null, away_score ?? null);
  res.status(201).json(db.prepare('SELECT * FROM sport_matches WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/admin/matches/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM sport_matches WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Match introuvable' });
  const { home_score, away_score, status, date, venue, competition } = req.body;
  const fields = [];
  const params = [];
  if (home_score !== undefined) { fields.push('home_score = ?'); params.push(home_score); }
  if (away_score !== undefined) { fields.push('away_score = ?'); params.push(away_score); }
  if (status !== undefined) { fields.push('status = ?'); params.push(status); }
  if (date !== undefined) { fields.push('date = ?'); params.push(date); }
  if (venue !== undefined) { fields.push('venue = ?'); params.push(venue); }
  if (competition !== undefined) { fields.push('competition = ?'); params.push(competition); }
  if (fields.length === 0) return res.status(400).json({ error: 'Aucune modification' });
  params.push(req.params.id);
  db.prepare(`UPDATE sport_matches SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  res.json(db.prepare('SELECT * FROM sport_matches WHERE id = ?').get(req.params.id));
});

// ========== History Routes ==========
app.get('/api/history/overview', (req, res) => {
  const totals = {
    trophies: db.prepare('SELECT COALESCE(SUM(count), 0) as t FROM trophies').get().t,
    legendary_players: db.prepare('SELECT COUNT(*) as c FROM legendary_players').get().c,
    presidents: db.prepare('SELECT COUNT(*) as c FROM presidents').get().c,
    coaches: db.prepare('SELECT COUNT(*) as c FROM coaches').get().c,
    history_events: db.prepare('SELECT COUNT(*) as c FROM club_history').get().c,
    historic_matches: db.prepare('SELECT COUNT(*) as c FROM historic_matches').get().c,
  };
  res.json({
    club: {
      name: 'Club Africain',
      founded: '4 octobre 1920',
      colors: 'Rouge & blanc',
      stadium: 'Stade olympique Hammadi Agrebi (Radès, 65 000 places)',
      nicknames: ['El Ghalia', 'Al-Afriki', 'Les Clubistes'],
      rivalry: 'Derby de Tunis vs Espérance de Tunis',
    },
    totals,
  });
});

app.get('/api/history', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM club_history';
  const params = [];
  if (category) { query += ' WHERE category = ?'; params.push(category); }
  query += ' ORDER BY substr(year, 1, 4) ASC, id ASC';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/history/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM club_history WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Event not found' });
  res.json(row);
});

app.get('/api/trophies', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM trophies';
  const params = [];
  if (category) { query += ' WHERE category = ?'; params.push(category); }
  query += ' ORDER BY id ASC';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/legendary_players', (req, res) => {
  const { sport_id } = req.query;
  let query = 'SELECT lp.*, s.label as sport_label, s.color as sport_color FROM legendary_players lp LEFT JOIN sports s ON s.id = lp.sport_id';
  const params = [];
  if (sport_id) { query += ' WHERE lp.sport_id = ?'; params.push(sport_id); }
  query += ' ORDER BY lp.id ASC';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/presidents', (req, res) => {
  res.json(db.prepare('SELECT * FROM presidents ORDER BY id ASC').all());
});

app.get('/api/coaches', (req, res) => {
  res.json(db.prepare('SELECT * FROM coaches ORDER BY id ASC').all());
});

app.get('/api/historic_matches', (req, res) => {
  res.json(db.prepare('SELECT * FROM historic_matches ORDER BY id ASC').all());
});

app.get('/api/club_facts', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM club_facts';
  const params = [];
  if (category) { query += ' WHERE category = ?'; params.push(category); }
  query += ' ORDER BY id ASC';
  res.json(db.prepare(query).all(...params));
});

// ========== Not Found & Errors ==========
app.use((req, res) => {
  if (req.method !== 'GET') return res.status(404).json({ error: 'Route introuvable' });
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API introuvable' });
  res.status(404).send(htmlPage('Page introuvable', `<div class="card"><h1 class="ko">404</h1><p>Cette page n'existe pas.</p></div>`));
});

app.use((err, req, res, next) => {
  errorLog(`${err.status || 500} ${req.method} ${req.originalUrl} ${err.message} ip=${req.ip}`);
  if (res.headersSent) return next(err);
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Corps de requête trop volumineux' });
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// ========== Start ==========
let backupTimer = null;
let server = null;

function startBackupLoop() {
  if (!CONFIG.AUTO_BACKUP) return;
  backupDB().catch((err) => errorLog(`backup failed: ${err.message}`));
  backupTimer = setInterval(() => {
    backupDB().catch((err) => errorLog(`backup failed: ${err.message}`));
  }, CONFIG.BACKUP_INTERVAL_HOURS * 3600 * 1000);
  if (backupTimer.unref) backupTimer.unref();
}

server = app.listen(CONFIG.PORT, CONFIG.HOST, () => {
  console.log(`\n  🏟️  Club Africain API Server running at http://${CONFIG.HOST}:${CONFIG.PORT}`);
  console.log(`  🔐  Authentification JWT active (mots de passe hachés côté serveur)`);
  console.log(`  📦  Base de données: ${DB_PATH}`);
  console.log(`  🌍  URL publique: ${CONFIG.PUBLIC_URL}`);
  console.log(`  📧  Mailer: ${CONFIG.MAILER}  |  💳  Paiement: ${CONFIG.PAYMENT_PROVIDER}\n`);
  startBackupLoop();
});

function shutdown(signal) {
  console.log(`\n  ⏹️  ${signal} reçu, arrêt propre...`);
  if (backupTimer) clearInterval(backupTimer);
  if (server) server.close(() => {
    try { db.close(); } catch (err) {}
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 4000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
