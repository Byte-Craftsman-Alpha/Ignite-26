import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data: participants, error: pErr } = await supabase.from('participants').select('id, check_in_status, branch, food_pref');
    if (pErr) throw pErr;

    const total = participants.length;
    const checkedIn = participants.filter(p => p.check_in_status).length;
    const branchCounts = participants.reduce((acc, p) => { acc[p.branch] = (acc[p.branch] || 0) + 1; return acc; }, {});
    const foodCounts = participants.reduce((acc, p) => { acc[p.food_pref] = (acc[p.food_pref] || 0) + 1; return acc; }, {});

    return res.status(200).json({ total, checkedIn, notCheckedIn: total - checkedIn, branchCounts, foodCounts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
