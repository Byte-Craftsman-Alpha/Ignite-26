import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { search, branch } = req.query;
      let query = supabase.from('participants').select('*').order('registered_at', { ascending: false });
      if (search) query = query.or(`name.ilike.%${search}%,roll_no.ilike.%${search}%,email.ilike.%${search}%`);
      if (branch && branch !== 'all') query = query.eq('branch', branch);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { name, roll_no, branch, email, phone, food_pref } = req.body;
      if (!name || !roll_no || !branch || !email || !phone || !food_pref)
        return res.status(400).json({ error: 'All fields are required' });

      // Uniqueness check
      const { data: existing } = await supabase.from('participants').select('id').eq('roll_no', roll_no).single();
      if (existing) return res.status(409).json({ error: 'This Roll Number is already registered' });

      const { data: existingEmail } = await supabase.from('participants').select('id').eq('email', email).single();
      if (existingEmail) return res.status(409).json({ error: 'This email is already registered' });

      const { data, error } = await supabase
        .from('participants')
        .insert({ name, roll_no, branch, email, phone, food_pref })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Participants API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
