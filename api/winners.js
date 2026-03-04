import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('winners').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { participant_id, name, roll_no, branch, award_title, image_url, description } = req.body;
      if (!name || !award_title) return res.status(400).json({ error: 'Name and award title are required' });
      const { data, error } = await supabase
        .from('winners')
        .insert({ participant_id, name, roll_no, branch, award_title, image_url: image_url || '', description: description || '' })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Winner ID required' });
      const { error } = await supabase.from('winners').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Winners API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
