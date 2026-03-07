import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'ignite26.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@ignite26.edu.in').trim().toLowerCase();
const adminPassword = String(process.env.ADMIN_PASSWORD || 'admin123');

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

    CREATE TABLE IF NOT EXISTS participant_share_access (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      token TEXT NOT NULL DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS registration_control (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS validation_handler_access (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      token TEXT NOT NULL DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 0,
      password_hash TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  ensureColumn('participants', 'payment_verified', "INTEGER NOT NULL DEFAULT 0");
  ensureColumn('media', 'thumb_url', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('media', 'status', "TEXT NOT NULL DEFAULT 'approved'");
  ensureColumn('media', 'uploaded_by', "TEXT NOT NULL DEFAULT 'admin'");
  ensureColumn('management_team', 'profile_image', "TEXT NOT NULL DEFAULT ''");

  const shareAccess = db.prepare('SELECT id FROM participant_share_access WHERE id = 1').get();
  if (!shareAccess) {
    db.prepare('INSERT INTO participant_share_access (id, token, enabled, updated_at) VALUES (1, ?, 0, ?)')
      .run(crypto.randomBytes(24).toString('hex'), new Date().toISOString());
  }

  const registrationControl = db.prepare('SELECT id FROM registration_control WHERE id = 1').get();
  if (!registrationControl) {
    db.prepare('INSERT INTO registration_control (id, enabled, updated_at) VALUES (1, 1, ?)')
      .run(new Date().toISOString());
  }

  const defaultHandlerPassword = String(process.env.VALIDATION_HANDLER_PASSWORD || 'ignite-handler-26');
  const defaultHandlerPasswordHash = crypto.createHash('sha256').update(defaultHandlerPassword).digest('hex');
  const validationAccess = db.prepare('SELECT id FROM validation_handler_access WHERE id = 1').get();
  if (!validationAccess) {
    db.prepare('INSERT INTO validation_handler_access (id, token, enabled, password_hash, updated_at) VALUES (1, ?, 0, ?, ?)')
      .run(crypto.randomBytes(24).toString('hex'), defaultHandlerPasswordHash, new Date().toISOString());
  } else {
    db.prepare('UPDATE validation_handler_access SET password_hash = ?, updated_at = ? WHERE id = 1')
      .run(defaultHandlerPasswordHash, new Date().toISOString());
  }

  const adminUser = db.prepare('SELECT id FROM auth_users WHERE email = ? LIMIT 1').get(adminEmail);
  const adminHash = hashPassword(adminPassword);
  if (!adminUser) {
    db.prepare('INSERT INTO auth_users (email, password_hash) VALUES (?, ?)')
      .run(adminEmail, adminHash);
  } else {
    db.prepare('UPDATE auth_users SET password_hash = ? WHERE id = ?')
      .run(adminHash, adminUser.id);
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
