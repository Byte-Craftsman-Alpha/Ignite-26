import db from './_db.js';
import { getAdminFromRequest, requireAdmin } from './_auth.js';
import { storeMediaUpload } from './_media-storage.js';
import { writeActivity } from './_activity.js';

const ALLOWED_STATUSES = new Set(['pending', 'approved', 'rejected']);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const admin = getAdminFromRequest(req);
      const { category, status } = req.query;
      const params = [];
      let where = '1=1';

      if (category && category !== 'all') {
        where += ' AND category = ?';
        params.push(category);
      }

      if (admin) {
        if (status && status !== 'all') {
          where += ' AND status = ?';
          params.push(status);
        }
      } else {
        where += " AND status = 'approved'";
      }

      const rows = db.prepare(`SELECT * FROM media WHERE ${where} ORDER BY uploaded_at DESC`).all(...params);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const admin = getAdminFromRequest(req);
      const {
        url,
        thumb_url,
        caption,
        type,
        category,
        file_data_url,
        preview_data_url,
      } = req.body || {};

      if (!type || !category) {
        return res.status(400).json({ error: 'Type and category are required' });
      }

      let mediaUrl = String(url || '').trim();
      let thumbUrl = '';

      if (file_data_url) {
        const stored = storeMediaUpload({
          category,
          originalDataUrl: file_data_url,
          previewDataUrl: preview_data_url || file_data_url,
        });
        mediaUrl = stored.url;
        thumbUrl = stored.thumb_url;
      }

      if (!mediaUrl) {
        return res.status(400).json({ error: 'URL or uploaded file is required' });
      }

      const status = admin ? 'approved' : 'pending';
      const uploadedBy = admin ? admin.email : 'public';
      const mediaThumb = String(thumb_url || '').trim();

      const result = db
        .prepare('INSERT INTO media (url, thumb_url, caption, type, category, status, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(mediaUrl, thumbUrl || mediaThumb || mediaUrl, caption || '', type, category, status, uploadedBy);

      const row = db.prepare('SELECT * FROM media WHERE id = ?').get(result.lastInsertRowid);

      writeActivity({
        entity_type: 'media',
        entity_id: row.id,
        action: admin ? 'media_added_by_admin' : 'media_submitted_public',
        actor_email: uploadedBy,
        details: {
          type: row.type,
          category: row.category,
          status: row.status,
        },
      });

      return res.status(201).json(row);
    }

    if (req.method === 'PUT') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const { id, status } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Media ID required' });
      if (!ALLOWED_STATUSES.has(String(status))) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const existing = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
      if (!existing) return res.status(404).json({ error: 'Media not found' });

      db.prepare('UPDATE media SET status = ? WHERE id = ?').run(status, id);
      const updated = db.prepare('SELECT * FROM media WHERE id = ?').get(id);

      writeActivity({
        entity_type: 'media',
        entity_id: updated.id,
        action: status === 'approved' ? 'media_approved' : status === 'rejected' ? 'media_rejected' : 'media_marked_pending',
        actor_email: admin.email,
        details: {
          previous_status: existing.status,
          new_status: updated.status,
          category: updated.category,
          type: updated.type,
        },
      });

      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Media ID required' });

      const existing = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
      if (!existing) return res.status(404).json({ error: 'Media not found' });

      db.prepare('DELETE FROM media WHERE id = ?').run(id);

      writeActivity({
        entity_type: 'media',
        entity_id: Number(id),
        action: 'media_deleted',
        actor_email: admin.email,
        details: {
          deleted_record: {
            id: existing.id,
            category: existing.category,
            type: existing.type,
            status: existing.status,
          },
        },
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Media API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
