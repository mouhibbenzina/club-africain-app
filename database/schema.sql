-- ============================================================
-- Club Africain Fan App - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'fan' CHECK (role IN ('fan', 'vip', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Balances
CREATE TABLE balances (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  cat_coins BIGINT DEFAULT 0,
  real_money_dt DECIMAL(10,2) DEFAULT 0,
  game_money_sca BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;

-- Matches
CREATE TABLE matches (
  id BIGSERIAL PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  venue TEXT,
  is_live BOOLEAN DEFAULT false,
  viewers INTEGER DEFAULT 0,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'finished')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Tickets
CREATE TABLE tickets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  price_dt DECIMAL(10,2) NOT NULL,
  tribune TEXT,
  rang INTEGER,
  siege INTEGER,
  qr_code TEXT UNIQUE,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Predictions
CREATE TABLE predictions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, match_id)
);
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Fantasy Teams
CREATE TABLE fantasy_teams (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Mon Équipe',
  formation TEXT DEFAULT '4-3-3',
  players JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE fantasy_teams ENABLE ROW LEVEL SECURITY;

-- Player Votes
CREATE TABLE player_votes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, match_id)
);
ALTER TABLE player_votes ENABLE ROW LEVEL SECURITY;

-- Daily Missions
CREATE TABLE missions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_type TEXT NOT NULL,
  label TEXT NOT NULL,
  coins INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  claimed BOOLEAN DEFAULT false,
  progress TEXT DEFAULT '0/1',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mission_type)
);
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Transactions
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'convert', 'purchase', 'donation')),
  currency TEXT NOT NULL CHECK (currency IN ('DT', 'SCA', 'CAT')),
  amount DECIMAL(20,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'match', 'game', 'offer')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Donations
CREATE TABLE donations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_dt DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Leaderboard (materialized view)
CREATE MATERIALIZED VIEW leaderboard AS
SELECT
  p.id AS user_id,
  p.username,
  p.avatar,
  b.cat_coins,
  ROW_NUMBER() OVER (ORDER BY b.cat_coins DESC) AS rank
FROM profiles p
JOIN balances b ON b.user_id = p.id
ORDER BY b.cat_coins DESC;

-- Coin Packs (static lookup table)
CREATE TABLE coin_packs (
  id BIGSERIAL PRIMARY KEY,
  coins INTEGER NOT NULL,
  price_dt DECIMAL(10,2) NOT NULL,
  bonus_pct INTEGER DEFAULT 0
);
INSERT INTO coin_packs (coins, price_dt, bonus_pct) VALUES
  (500, 2, 0),
  (1200, 5, 0),
  (5000, 15, 5),
  (12000, 30, 10),
  (25000, 60, 15);

-- RLS Policies (basic - customize per your needs)
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can read own balance" ON balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own tickets" ON tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own predictions" ON predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own teams" ON fantasy_teams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own missions" ON missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Anyone can read leaderboard" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Anyone can read coin_packs" ON coin_packs FOR SELECT USING (true);
