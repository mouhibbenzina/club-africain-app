#!/usr/bin/env node
/* Standalone SQLite backup (WAL-safe via better-sqlite3 db.backup).
   Usage: node scripts/backup.js [keep-count]
   Schedule daily via Task Scheduler / cron: node scripts/backup.js 14
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const DB_PATH = path.join(__dirname, '..', 'club_africain.db');
const KEEP = Math.max(1, parseInt(process.argv[2], 10) || 30);

fs.mkdirSync(BACKUP_DIR, { recursive: true });

if (!fs.existsSync(DB_PATH)) {
  console.error('Base de données introuvable:', DB_PATH);
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dest = path.join(BACKUP_DIR, `club_africain-${stamp}.db`);

const db = new Database(DB_PATH, { readonly: true });
db.backup(dest)
  .then(() => {
    db.close();
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith('club_africain-') && f.endsWith('.db')).sort();
    while (files.length > KEEP) fs.unlinkSync(path.join(BACKUP_DIR, files.shift()));
    console.log(`Sauvegarde OK: ${path.basename(dest)} (${KEEP} conservées)`);
  })
  .catch((err) => {
    db.close();
    console.error('Sauvegarde échouée:', err.message);
    process.exit(1);
  });