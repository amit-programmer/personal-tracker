const Sleep = require('../models/sleep.model');

// Create sleep record (no userId required)
async function createSleep(req, res) {
  try {
    const { date, duration, quality, notes } = req.body;

    // Basic server-side checks in case validator was bypassed
    if (typeof duration === 'undefined' || duration === null || duration === '') {
      return res.status(400).json({ ok: false, error: 'Duration (hours) is required' });
    }

    const durNum = Number(duration);
    if (Number.isNaN(durNum) || durNum < 0) {
      return res.status(400).json({ ok: false, error: 'Duration must be a non-negative number' });
    }

    const data = {
      date: date ? new Date(date) : new Date(),
      duration: durNum,
      quality,
      notes
    };

    const rec = await Sleep.create(data);
    return res.status(201).json({ ok: true, data: rec });
  } catch (err) {
    console.error('Create sleep error', err);
    if (err.name === 'ValidationError') {
      // Build friendly validation response
      const errors = Object.keys(err.errors).map(k => ({ field: k, message: err.errors[k].message }));
      return res.status(400).json({ ok: false, error: 'Validation failed', details: errors });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ ok: false, error: `Invalid value for ${err.path}` });
    }
    return res.status(500).json({ ok: false, error: err.message || 'Failed to create sleep record' });
  }
}

// List sleep records (optional date range)
async function listSleeps(req, res) {
  try {
    const { start, end } = req.query;
    const filter = {};
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) filter.date.$lte = new Date(end);
    }

    const items = await Sleep.find(filter).sort({ date: -1 });
    return res.json({ ok: true, data: items });
  } catch (err) {
    console.error('List sleep error', err);
    return res.status(500).json({ ok: false, error: 'Failed to list sleep records' });
  }
}

async function getSleepById(req, res) {
  try {
    const { id } = req.params;
    const item = await Sleep.findById(id);
    if (!item) return res.status(404).json({ ok: false, error: 'Sleep record not found' });
    return res.json({ ok: true, data: item });
  } catch (err) {
    console.error('Get sleep error', err);
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to fetch sleep record' });
  }
}

async function updateSleep(req, res) {
  try {
    const { id } = req.params;
    const { date, duration, quality, notes } = req.body;
    const updates = {};
    if (typeof date !== 'undefined') updates.date = new Date(date);
    if (typeof duration !== 'undefined') updates.duration = Number(duration);
    if (typeof quality !== 'undefined') updates.quality = quality;
    if (typeof notes !== 'undefined') updates.notes = notes;
    const updated = await Sleep.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    return res.json({ ok: true, data: updated });
  } catch (err) {
    console.error('Update sleep error', err);
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).map(k => ({ field: k, message: err.errors[k].message }));
      return res.status(400).json({ ok: false, error: 'Validation failed', details: errors });
    }
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id or value' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to update sleep record' });
  }
}

async function deleteSleep(req, res) {
  try {
    const { id } = req.params;
    const existing = await Sleep.findById(id);
    if (!existing) return res.status(404).json({ ok: false, error: 'Sleep record not found' });
    const removed = await Sleep.findByIdAndDelete(id);
    return res.json({ ok: true, data: removed });
  } catch (err) {
    console.error('Delete sleep error', err);
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to delete sleep record' });
  }
}

module.exports = {
  createSleep,
  listSleeps,
  getSleepById,
  updateSleep,
  deleteSleep
};
