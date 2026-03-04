import db, { encodeSkills, toParticipant } from './_db.js';
import { requireAdmin } from './_auth.js';
import { writeActivity } from './_activity.js';
import { sendRegistrationConfirmationEmail } from './_mailer.js';

const ALLOWED_YEARS = ['1st Year', '2nd Year'];

function validateParticipantInput(payload) {
  const { email, full_name, roll_number, branch, year, skills, payment_id, whatsapp_number } = payload;
  if (!email || !full_name || !roll_number || !branch || !year || skills === undefined || !payment_id || !whatsapp_number) {
    return 'All fields are required';
  }
  if (!/^\d{13}$/.test(String(roll_number))) return 'Roll number must be exactly 13 digits';
  if (!/^\d{10}$/.test(String(whatsapp_number))) return 'WhatsApp number must be exactly 10 digits';
  if (!Array.isArray(skills)) return 'Invalid skills value';
  if (!ALLOWED_YEARS.includes(year)) return 'Only 1st Year and 2nd Year registrations are allowed';
  return null;
}

function checkDuplicate(field, value, currentId = null) {
  if (!value) return false;
  if (currentId) {
    return db.prepare(`SELECT id FROM participants WHERE ${field} = ? AND id != ?`).get(value, currentId);
  }
  return db.prepare(`SELECT id FROM participants WHERE ${field} = ?`).get(value);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const { search, branch } = req.query;
      const params = [];
      let where = '1=1';

      if (search) {
        where += ' AND (full_name LIKE ? OR roll_number LIKE ? OR email LIKE ? OR payment_id LIKE ? OR whatsapp_number LIKE ?)';
        const needle = `%${search}%`;
        params.push(needle, needle, needle, needle, needle);
      }
      if (branch && branch !== 'all') {
        where += ' AND branch = ?';
        params.push(branch);
      }

      const rows = db
        .prepare(`SELECT * FROM participants WHERE ${where} ORDER BY registered_at DESC`)
        .all(...params)
        .map(toParticipant);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const validationError = validateParticipantInput(req.body || {});
      if (validationError) return res.status(400).json({ error: validationError });

      const { email, full_name, roll_number, branch, year, skills, payment_id, whatsapp_number, otp_token } = req.body;

      if (!otp_token) {
        return res.status(403).json({ error: 'Email OTP verification is required before registration' });
      }

      const verifiedOtp = db
        .prepare(
          `
            SELECT id
            FROM email_otp_sessions
            WHERE email = ? AND verification_token = ? AND verified = 1 AND consumed = 0 AND expires_at > ?
            ORDER BY id DESC
            LIMIT 1
          `
        )
        .get(String(email).trim().toLowerCase(), otp_token, new Date().toISOString());

      if (!verifiedOtp) {
        return res.status(403).json({ error: 'Invalid or expired OTP verification. Please verify your email again.' });
      }

      if (checkDuplicate('roll_number', roll_number)) {
        return res.status(409).json({ error: 'This roll number is already registered' });
      }
      if (checkDuplicate('email', email)) {
        return res.status(409).json({ error: 'This email address is already registered' });
      }
      if (checkDuplicate('payment_id', payment_id)) {
        return res.status(409).json({ error: 'This registration payment ID is already used' });
      }
      if (checkDuplicate('whatsapp_number', whatsapp_number)) {
        return res.status(409).json({ error: 'This WhatsApp number is already registered' });
      }

      const result = db
        .prepare(
          `
            INSERT INTO participants (email, full_name, roll_number, branch, year, skills, payment_id, whatsapp_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `
        )
        .run(email, full_name, roll_number, branch, year, encodeSkills(skills), payment_id, whatsapp_number);

      const row = db.prepare('SELECT * FROM participants WHERE id = ?').get(result.lastInsertRowid);
      const participant = toParticipant(row);

      writeActivity({
        entity_type: 'participant',
        entity_id: participant.id,
        action: 'registration_created',
        actor_email: participant.email,
        details: {
          full_name: participant.full_name,
          roll_number: participant.roll_number,
          branch: participant.branch,
          year: participant.year,
        },
      });

      db.prepare('UPDATE email_otp_sessions SET consumed = 1 WHERE id = ?').run(verifiedOtp.id);

      try {
        await sendRegistrationConfirmationEmail(participant);
      } catch (mailErr) {
        console.error('Confirmation mail error:', mailErr);
      }

      return res.status(201).json(participant);
    }

    if (req.method === 'PUT') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const { id, email, full_name, roll_number, branch, year, skills, payment_id, whatsapp_number } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Participant ID required' });

      const existing = db.prepare('SELECT * FROM participants WHERE id = ?').get(id);
      if (!existing) return res.status(404).json({ error: 'Participant not found' });

      const validationError = validateParticipantInput({ email, full_name, roll_number, branch, year, skills, payment_id, whatsapp_number });
      if (validationError) return res.status(400).json({ error: validationError });

      if (checkDuplicate('roll_number', roll_number, id)) {
        return res.status(409).json({ error: 'This roll number is already registered' });
      }
      if (checkDuplicate('email', email, id)) {
        return res.status(409).json({ error: 'This email address is already registered' });
      }
      if (checkDuplicate('payment_id', payment_id, id)) {
        return res.status(409).json({ error: 'This registration payment ID is already used' });
      }
      if (checkDuplicate('whatsapp_number', whatsapp_number, id)) {
        return res.status(409).json({ error: 'This WhatsApp number is already registered' });
      }

      db
        .prepare(
          `
            UPDATE participants
            SET email = ?, full_name = ?, roll_number = ?, branch = ?, year = ?, skills = ?, payment_id = ?, whatsapp_number = ?
            WHERE id = ?
          `
        )
        .run(email, full_name, roll_number, branch, year, encodeSkills(skills), payment_id, whatsapp_number, id);

      const updated = toParticipant(db.prepare('SELECT * FROM participants WHERE id = ?').get(id));
      const previous = toParticipant(existing);

      writeActivity({
        entity_type: 'participant',
        entity_id: updated.id,
        action: 'registration_updated',
        actor_email: admin.email,
        details: {
          before: previous,
          after: updated,
        },
      });

      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Participant ID required' });

      const existing = db.prepare('SELECT * FROM participants WHERE id = ?').get(id);
      if (!existing) return res.status(404).json({ error: 'Participant not found' });

      db.prepare('DELETE FROM participants WHERE id = ?').run(id);

      writeActivity({
        entity_type: 'participant',
        entity_id: Number(id),
        action: 'registration_deleted',
        actor_email: admin.email,
        details: {
          deleted_record: toParticipant(existing),
        },
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Participants API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
