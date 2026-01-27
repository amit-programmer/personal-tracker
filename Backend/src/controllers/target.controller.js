const Target = require('../models/target.model');
const path = require('path');
const fs = require('fs');
const writeFileAtomic = require('write-file-atomic');

async function createTarget(req, res) {
  try {
    const { title, description, targetDate, isAchieved, achievedAt, category, priority } = req.body;

    if (!title || !targetDate) {
      return res.status(400).json({ ok: false, error: 'Title and targetDate are required' });
    }

    const data = {
      title,
      description,
      targetDate: new Date(targetDate),
      isAchieved: typeof isAchieved !== 'undefined' ? Boolean(isAchieved) : false,
      achievedAt: achievedAt ? new Date(achievedAt) : undefined,
      category,
      priority
    };

    // require authenticated user and attach owner
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    data.userId = userId;

    const rec = await Target.create(data);
    return res.status(201).json({ ok: true, data: rec });
  } catch (err) {
    console.error('Create target error', err);
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).map(k => ({ field: k, message: err.errors[k].message }));
      return res.status(400).json({ ok: false, error: 'Validation failed', details: errors });
    }
    return res.status(500).json({ ok: false, error: err.message || 'Failed to create target' });
  }
}

async function listTargets(req, res) {
  try {
    const { start, end } = req.query;
    const filter = {};
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    filter.userId = userId;

    if (start || end) {
      filter.targetDate = {};
      if (start) filter.targetDate.$gte = new Date(start);
      if (end) filter.targetDate.$lte = new Date(end);
    }

    const items = await Target.find(filter).sort({ priority: -1, createdAt: 1 });
    return res.json({ ok: true, data: items });
  } catch (err) {
    console.error('List targets error', err);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to list targets' });
  }
}

async function getTargetById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const item = await Target.findOne({ _id: id, userId });
    if (!item) return res.status(404).json({ ok: false, error: 'Target not found' });
    return res.json({ ok: true, data: item });
  } catch (err) {
    console.error('Get target error', err);
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to fetch target' });
  }
}

async function updateTarget(req, res) {
  try {
    const { id } = req.params;
    const updates = {};
    const fields = ['title', 'description', 'targetDate', 'isAchieved', 'achievedAt', 'category', 'priority'];
    fields.forEach(f => {
      if (typeof req.body[f] !== 'undefined') updates[f] = req.body[f];
    });
    if (updates.targetDate) updates.targetDate = new Date(updates.targetDate);
    if (typeof updates.isAchieved !== 'undefined') updates.isAchieved = Boolean(updates.isAchieved);
    if (updates.achievedAt) updates.achievedAt = new Date(updates.achievedAt);

    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const updated = await Target.findOneAndUpdate({ _id: id, userId }, updates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ ok: false, error: 'Target not found or not owned by user' });
    return res.json({ ok: true, data: updated });
  } catch (err) {
    console.error('Update target error', err);
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).map(k => ({ field: k, message: err.errors[k].message }));
      return res.status(400).json({ ok: false, error: 'Validation failed', details: errors });
    }
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id or value' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to update target' });
  }
}

async function deleteTarget(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const existing = await Target.findOne({ _id: id, userId });
    if (!existing) return res.status(404).json({ ok: false, error: 'Target not found' });
    const removed = await Target.findOneAndDelete({ _id: id, userId });
    return res.json({ ok: true, data: removed });
  } catch (err) {
    console.error('Delete target error', err);
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to delete target' });
  }
}

// Export targets between two dates to a text file
async function exportRange(req, res) {
  try {
    const { start, end } = req.query;
    let startDate = start ? new Date(start) : new Date(0);
    let endDate = end ? new Date(end) : new Date();

    // include full end day
    endDate = new Date(endDate);
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      const tmp = startDate;
      startDate = endDate;
      endDate = tmp;
    }

    const filter = {};
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    filter.userId = userId;
    filter.targetDate = { $gte: startDate, $lte: endDate };

    const items = await Target.find(filter).sort({ priority: -1, createdAt: 1 });

    const exportDir = path.join(__dirname, '..', '..', 'exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const lines = items.map((it) => {
      const day = it.targetDate ? new Date(it.targetDate).toISOString().split('T')[0] : '';
      return `id: ${String(it._id)} | title: ${it.title || ''} | date: ${day} | achieved: ${it.isAchieved ? 'yes' : 'no'} | category: ${it.category || ''} | priority: ${it.priority || ''}`;
    });

    const filename = `target_export_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}_${Date.now()}.txt`;
    const filepath = path.join(exportDir, filename);

    let content;
    if (lines.length) content = `Total records: ${lines.length}\n` + lines.join('\n');
    else content = `Total records: 0\nNo records for range ${startDate.toISOString()} - ${endDate.toISOString()}`;

    await writeFileAtomic(filepath, content);

    const wantDownload = (req.query.download === '1' || req.query.download === 'true') || (req.headers.accept && req.headers.accept.includes('text/html'));
    if (wantDownload) {
      return res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Error sending target export', err);
          if (!res.headersSent) return res.status(500).json({ ok: false, error: 'Failed to send file' });
        }
        try { if (fs.existsSync(filepath)) fs.unlinkSync(filepath); } catch (e) { console.error(e); }
      });
    }

    return res.json({ ok: true, file: `exports/${filename}`, count: items.length });
  } catch (err) {
    console.error('Export target range error', err);
    return res.status(500).json({ ok: false, error: 'Failed to export targets' });
  }
}



async function markAsAchieved(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const item = await Target.findOne({ _id: id, userId });
    if (!item) return res.status(404).json({ ok: false, error: 'Target not found' });
    await item.markAsAchieved();
    return res.json({ ok: true, data: item });
  } catch (err) {
    console.error('Mark achieved error', err);
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to mark achieved' });
  }
}



module.exports = {
  createTarget,
  listTargets,
  getTargetById,
  updateTarget,
  deleteTarget,
  markAsAchieved,
  exportRange
};