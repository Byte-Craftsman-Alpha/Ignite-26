import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { roll_no, phone } = req.body;
    if (!roll_no || !phone) return res.status(400).json({ error: 'Roll number and phone required' });

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('roll_no', roll_no)
      .eq('phone', phone)
      .single();

    if (error || !data) return res.status(404).json({ error: 'No participant found with those credentials' });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
