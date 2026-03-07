import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { createClient } from '@libsql/client';

const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@ignite26.edu.in').trim().toLowerCase();
const adminPassword = String(process.env.ADMIN_PASSWORD || 'admin123');

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256');
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

function resolveDatabaseUrl() {
  const tursoUrl = String(process.env.TURSO_DATABASE_URL || '').trim();
  if (tursoUrl) return tursoUrl;

  const configuredPath = String(process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'ignite26.db')).trim();
  const absolutePath = path.isAbsolute(configuredPath) ? configuredPath : path.join(process.cwd(), configuredPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  return pathToFileURL(absolutePath).href;
}

const client = createClient({
  url: resolveDatabaseUrl(),
  authToken: String(process.env.TURSO_AUTH_TOKEN || '').trim() || undefined,
});

function normalizeRow(row) {
  if (!row) return null;
  return Object.fromEntries(Object.entries(row));
}

function normalizeRows(rows) {
  return Array.isArray(rows) ? rows.map(normalizeRow) : [];
}

async function executeStatement(sql, args = []) {
  const result = await client.execute({ sql, args });
  return {
    rows: normalizeRows(result.rows),
    rowsAffected: Number(result.rowsAffected || 0),
    lastInsertRowid: result.lastInsertRowid == null ? undefined : Number(result.lastInsertRowid),
  };
}

const schemaStatements = [
  `
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
    )
  `,
  `
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
    )
  `,
  `
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
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS auth_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES auth_users(id)
    )
  `,
  `
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
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      action TEXT NOT NULL,
      actor_email TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
  `
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
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS participant_share_access (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      token TEXT NOT NULL DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS registration_control (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS validation_handler_access (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      token TEXT NOT NULL DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 0,
      password_hash TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
];

async function columnExists(tableName, columnName) {
  const result = await executeStatement(`PRAGMA table_info(${tableName})`);
  return result.rows.some((column) => column.name === columnName);
}

async function ensureColumn(tableName, columnName, definition) {
  if (!(await columnExists(tableName, columnName))) {
    await executeStatement(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function initSchema() {
  for (const sql of schemaStatements) {
    await executeStatement(sql);
  }

  await ensureColumn('participants', 'payment_verified', "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn('media', 'thumb_url', "TEXT NOT NULL DEFAULT ''");
  await ensureColumn('media', 'status', "TEXT NOT NULL DEFAULT 'approved'");
  await ensureColumn('media', 'uploaded_by', "TEXT NOT NULL DEFAULT 'admin'");
  await ensureColumn('management_team', 'profile_image', "TEXT NOT NULL DEFAULT ''");

  const shareAccess = await executeStatement('SELECT id FROM participant_share_access WHERE id = 1');
  if (!shareAccess.rows[0]) {
    await executeStatement(
      'INSERT INTO participant_share_access (id, token, enabled, updated_at) VALUES (1, ?, 0, ?)',
      [crypto.randomBytes(24).toString('hex'), new Date().toISOString()]
    );
  }

  const registrationControl = await executeStatement('SELECT id FROM registration_control WHERE id = 1');
  if (!registrationControl.rows[0]) {
    await executeStatement(
      'INSERT INTO registration_control (id, enabled, updated_at) VALUES (1, 1, ?)',
      [new Date().toISOString()]
    );
  }

  const defaultHandlerPassword = String(process.env.VALIDATION_HANDLER_PASSWORD || 'ignite-handler-26');
  const defaultHandlerPasswordHash = crypto.createHash('sha256').update(defaultHandlerPassword).digest('hex');
  const validationAccess = await executeStatement('SELECT id FROM validation_handler_access WHERE id = 1');
  if (!validationAccess.rows[0]) {
    await executeStatement(
      'INSERT INTO validation_handler_access (id, token, enabled, password_hash, updated_at) VALUES (1, ?, 0, ?, ?)',
      [crypto.randomBytes(24).toString('hex'), defaultHandlerPasswordHash, new Date().toISOString()]
    );
  } else {
    await executeStatement(
      'UPDATE validation_handler_access SET password_hash = ?, updated_at = ? WHERE id = 1',
      [defaultHandlerPasswordHash, new Date().toISOString()]
    );
  }

  const adminUser = await executeStatement('SELECT id FROM auth_users WHERE email = ? LIMIT 1', [adminEmail]);
  const adminHash = hashPassword(adminPassword);
  if (!adminUser.rows[0]) {
    await executeStatement('INSERT INTO auth_users (email, password_hash) VALUES (?, ?)', [adminEmail, adminHash]);
  } else {
    await executeStatement('UPDATE auth_users SET password_hash = ? WHERE id = ?', [adminHash, adminUser.rows[0].id]);
  }
}

const ready = initSchema();

const db = {
  async exec(sql) {
    await ready;
    const statements = String(sql)
      .split(/;\s*(?:\r?\n|$)/)
      .map((statement) => statement.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await executeStatement(statement);
    }
  },
  prepare(sql) {
    return {
      async get(...args) {
        await ready;
        const result = await executeStatement(sql, args);
        return result.rows[0];
      },
      async all(...args) {
        await ready;
        const result = await executeStatement(sql, args);
        return result.rows;
      },
      async run(...args) {
        await ready;
        const result = await executeStatement(sql, args);
        return {
          changes: result.rowsAffected,
          lastInsertRowid: result.lastInsertRowid,
        };
      },
    };
  },
};

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
