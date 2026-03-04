import db from './_db.js';

export function getAdminFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);
  if (!token) return null;

  return db
    .prepare(
      `
        SELECT u.id, u.email
        FROM auth_sessions s
        JOIN auth_users u ON u.id = s.user_id
        WHERE s.id = ? AND s.expires_at > ?
        LIMIT 1
      `
    )
    .get(token, new Date().toISOString()) || null;
}

export function requireAdmin(req, res) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return admin;
}
