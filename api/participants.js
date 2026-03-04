import supabase from './_supabase.js';

const ALLOWED_YEARS = ['1st Year', '2nd Year'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { search, branch } = req.query;
      let query = supabase.from('participants').select('*').order('registered_at', { ascending: false });
      if (search) query = query.or(`full_name.ilike.%${search}%,roll_number.ilike.%${search}%,email.ilike.%${search}%,payment_id.ilike.%${search}%,whatsapp_number.ilike.%${search}%`);
      if (branch && branch !== 'all') query = query.eq('branch', branch);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { email, full_name, roll_number, branch, year, skills, payment_id, whatsapp_number } = req.body;
      if (!email || !full_name || !roll_number || !branch || !year || !skills || !payment_id || !whatsapp_number)
        return res.status(400).json({ error: 'All fields are required' });
      if (!/^\d{13}$/.test(String(roll_number))) {
        return res.status(400).json({ error: 'Roll number must be exactly 13 digits' });
      }
      if (!/^\d{10}$/.test(String(whatsapp_number))) {
        return res.status(400).json({ error: 'WhatsApp number must be exactly 10 digits' });
      }
      if (!Array.isArray(skills)) {
        return res.status(400).json({ error: 'Invalid skills value' });
      }
      if (!ALLOWED_YEARS.includes(year)) {
        return res.status(400).json({ error: 'Only 1st Year and 2nd Year registrations are allowed' });
      }

      // Uniqueness check
      const { data: existing } = await supabase.from('participants').select('id').eq('roll_number', roll_number).single();
      if (existing) return res.status(409).json({ error: 'This roll number is already registered' });

      const { data: existingEmail } = await supabase.from('participants').select('id').eq('email', email).single();
      if (existingEmail) return res.status(409).json({ error: 'This email address is already registered' });

      const { data: existingPayment } = await supabase.from('participants').select('id').eq('payment_id', payment_id).single();
      if (existingPayment) return res.status(409).json({ error: 'This registration payment ID is already used' });

      const { data: existingWhatsapp } = await supabase.from('participants').select('id').eq('whatsapp_number', whatsapp_number).single();
      if (existingWhatsapp) return res.status(409).json({ error: 'This WhatsApp number is already registered' });

      const { data, error } = await supabase
        .from('participants')
        .insert({ email, full_name, roll_number, branch, year, skills, payment_id, whatsapp_number })
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
