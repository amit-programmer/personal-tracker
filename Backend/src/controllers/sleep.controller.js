const Sleep = require('../models/sleep.model');
const path = require('path');
const fs = require('fs');
const writeFileAtomic = require('write-file-atomic');

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

    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const data = {
      user: userId,
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

    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    filter.user = userId;

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
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const item = await Sleep.findOne({ _id: id, user: userId });
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
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const updated = await Sleep.findOneAndUpdate({ _id: id, user: userId }, updates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ ok: false, error: 'Sleep record not found or not owned by user' });
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
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const existing = await Sleep.findOne({ _id: id, user: userId });
    if (!existing) return res.status(404).json({ ok: false, error: 'Sleep record not found' });
    const removed = await Sleep.findOneAndDelete({ _id: id, user: userId });
    return res.json({ ok: true, data: removed });
  } catch (err) {
    console.error('Delete sleep error', err);
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to delete sleep record' });
  }
}

// Export sleep records between two dates to a text file
async function exportRange(req, res) {
  try {
    const { start, end } = req.query;
    let startDate = start ? new Date(start) : new Date(0);
    let endDate = end ? new Date(end) : new Date();

    // include full end day
    endDate = new Date(endDate);
    endDate.setHours(23, 59, 59, 999);

    // swap if inverted
    if (startDate > endDate) {
      const tmp = startDate;
      startDate = endDate;
      endDate = tmp;
    }

    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const filter = { date: { $gte: startDate, $lte: endDate }, user: userId };
    const items = await Sleep.find(filter).sort({ date: -1 });

    // Prepare export dir
    const exportDir = path.join(__dirname, '..', '..', 'exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const lines = items.map((it) => {
      const day = it.date ? new Date(it.date).toISOString().split('T')[0] : '';
      return `id: ${String(it._id)} | date: ${day} | duration: ${it.duration} | quality: ${it.quality || ''} | notes: ${it.notes || ''}`;
    });

    const filename = `sleep_export_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}_${Date.now()}.txt`;
    const filepath = path.join(exportDir, filename);

    let content;
    if (lines.length) content = `Total records: ${lines.length}\n` + lines.join('\n');
    else content = `Total records: 0\nNo records for range ${startDate.toISOString()} - ${endDate.toISOString()}`;

    await writeFileAtomic(filepath, content);

    const wantDownload = (req.query.download === '1' || req.query.download === 'true') || (req.headers.accept && req.headers.accept.includes('text/html'));
    if (wantDownload) {
      return res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Error sending sleep export', err);
          if (!res.headersSent) return res.status(500).json({ ok: false, error: 'Failed to send file' });
        }
        try { if (fs.existsSync(filepath)) fs.unlinkSync(filepath); } catch (e) { console.error(e); }
      });
    }

    return res.json({ ok: true, file: `exports/${filename}`, count: items.length });
  } catch (err) {
    console.error('Export sleep range error', err);
    return res.status(500).json({ ok: false, error: 'Failed to export sleep records' });
  }
}

module.exports = {
  createSleep,
  listSleeps,
  getSleepById,
  updateSleep,
  deleteSleep,
  exportRange
};



