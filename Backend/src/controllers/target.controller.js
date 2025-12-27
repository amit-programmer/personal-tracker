const Target = require('../models/target.model');

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

    // include userId if present on req.user (optional)
    if (req.user && req.user.sub) data.userId = req.user.sub;

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
    const { start, end, userId } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (req.user && req.user.sub) filter.userId = req.user.sub;

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
    const item = await Target.findById(id);
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

    const updated = await Target.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
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
    const existing = await Target.findById(id);
    if (!existing) return res.status(404).json({ ok: false, error: 'Target not found' });
    const removed = await Target.findByIdAndDelete(id);
    return res.json({ ok: true, data: removed });
  } catch (err) {
    console.error('Delete target error', err);
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to delete target' });
  }
}

async function markAsAchieved(req, res) {
  try {
    const { id } = req.params;
    const item = await Target.findById(id);
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
  markAsAchieved
};
