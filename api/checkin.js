import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id, check_in_status } = req.body;
    if (!id) return res.status(400).json({ error: 'Participant ID required' });

    const updateData = { check_in_status };
    if (check_in_status) {
      updateData.check_in_time = new Date().toISOString();
    } else {
      updateData.check_in_time = null;
    }

    const { data, error } = await supabase
      .from('participants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ error: err.message });
  }
}
