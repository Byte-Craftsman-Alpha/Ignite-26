import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'ignite26.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256');
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

function columnExists(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some(column => column.name === columnName);
}

function ensureColumn(tableName, columnName, definition) {
  if (!columnExists(tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      roll_number TEXT NOT NULL UNIQUE,
      branch TEXT NOT NULL,
      year TEXT NOT NULL,
      skills TEXT NOT NULL DEFAULT '[]',
      payment_id TEXT NOT NULL UNIQUE,
      whatsapp_number TEXT NOT NULL UNIQUE,
      payment_verified INTEGER NOT NULL DEFAULT 0,
      check_in_status INTEGER NOT NULL DEFAULT 0,
      check_in_time TEXT,
      registered_at TEXT NOT NULL DEFAULT (datetime('now')),
      CHECK (length(roll_number) = 13),
      CHECK (length(whatsapp_number) = 10)
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      thumb_url TEXT NOT NULL DEFAULT '',
      caption TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved',
      uploaded_by TEXT NOT NULL DEFAULT 'admin',
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER,
      name TEXT NOT NULL,
      roll_no TEXT,
      branch TEXT,
      award_title TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS auth_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES auth_users(id)
    );

    CREATE TABLE IF NOT EXISTS management_team (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      branch TEXT NOT NULL,
      year TEXT NOT NULL,
      roles TEXT NOT NULL DEFAULT '[]',
      fields TEXT NOT NULL DEFAULT '',
      profile_image TEXT NOT NULL DEFAULT '',
      whatsapp_number TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      action TEXT NOT NULL,
      actor_email TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS email_otp_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      verified INTEGER NOT NULL DEFAULT 0,
      verification_token TEXT,
      consumed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  ensureColumn('participants', 'payment_verified', "INTEGER NOT NULL DEFAULT 0");
  ensureColumn('media', 'thumb_url', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('media', 'status', "TEXT NOT NULL DEFAULT 'approved'");
  ensureColumn('media', 'uploaded_by', "TEXT NOT NULL DEFAULT 'admin'");
  ensureColumn('management_team', 'profile_image', "TEXT NOT NULL DEFAULT ''");

  const userCount = db.prepare('SELECT COUNT(*) AS c FROM auth_users').get().c;
  if (userCount === 0) {
    db.prepare('INSERT INTO auth_users (email, password_hash) VALUES (?, ?)')
      .run('admin@ignite26.edu.in', hashPassword('admin123'));
  }
}

initSchema();

export function toParticipant(row) {
  if (!row) return null;
  return {
    ...row,
    skills: safeJsonArray(row.skills),
    payment_verified: Boolean(row.payment_verified),
    check_in_status: Boolean(row.check_in_status),
  };
}

export function safeJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function encodeSkills(skills) {
  return JSON.stringify(Array.isArray(skills) ? skills : []);
}

export function toManagementMember(row) {
  if (!row) return null;
  return {
    ...row,
    roles: safeJsonArray(row.roles),
  };
}

export function encodeRoles(roles) {
  return JSON.stringify(Array.isArray(roles) ? roles : []);
}

export default db;
