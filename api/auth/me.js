import supabase from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.replace('Bearer ', '');

    const { data: session, error } = await supabase
      .from('auth_sessions')
      .select('user_id, auth_users(id, email)')
      .eq('id', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) return res.status(401).json({ error: 'Invalid or expired token' });
    return res.status(200).json({ user: session.auth_users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
