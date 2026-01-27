const Study = require('../models/study.model');
const path = require('path');
const fs = require('fs');
const writeFileAtomic = require('write-file-atomic');

// Create a new study record
async function createStudy(req, res) {
  try {
    const { subject, time, date, notes } = req.body;
    const data = {
      user: req.user && req.user.sub,
      subject,
      time: typeof time !== 'undefined' ? Number(time) : undefined,
      date: date ? new Date(date) : undefined,
      notes
    };

    Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

    const rec = await Study.create(data);
    return res.status(201).json({ ok: true, data: rec });
  } catch (err) {
    console.error('Create study error', err);
    return res.status(500).json({ ok: false, error: 'Failed to create study record' });
  }
}

// List studies; supports optional ?subject=&start=&end=
async function listStudies(req, res) {
  try {
    const { subject, start, end } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) filter.date.$lte = new Date(end);
    }

    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    filter.user = userId;

    const items = await Study.find(filter).sort({ date: -1 });
    return res.json({ ok: true, data: items });
  } catch (err) {
    console.error('List study error', err);
    return res.status(500).json({ ok: false, error: 'Failed to list study records' });
  }
}

async function getStudyById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const item = await Study.findOne({ _id: id, user: userId });
    if (!item) return res.status(404).json({ ok: false, error: 'Study record not found' });
    return res.json({ ok: true, data: item });
  } catch (err) {
    console.error('Get study error', err);
    return res.status(500).json({ ok: false, error: 'Failed to fetch study record' });
  }
}

async function updateStudy(req, res) {
  try {
    const { id } = req.params;
    const { subject, time, date, notes } = req.body;
    const updates = {};
    if (typeof subject !== 'undefined') updates.subject = subject;
    if (typeof time !== 'undefined') updates.time = Number(time);
    if (typeof date !== 'undefined') updates.date = new Date(date);
    if (typeof notes !== 'undefined') updates.notes = notes;

    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const updated = await Study.findOneAndUpdate({ _id: id, user: userId }, updates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ ok: false, error: 'Study record not found or not owned by user' });
    return res.json({ ok: true, data: updated });
  } catch (err) {
    console.error('Update study error', err);
    return res.status(500).json({ ok: false, error: 'Failed to update study record' });
  }
}

async function deleteStudy(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const removed = await Study.findOneAndDelete({ _id: id, user: userId });
    if (!removed) return res.status(404).json({ ok: false, error: 'Study record not found' });
    return res.json({ ok: true, data: removed });
  } catch (err) {
    console.error('Delete study error', err);
    return res.status(500).json({ ok: false, error: 'Failed to delete study record' });
  }
}

// Export study records between two dates to a text file
async function exportRange(req, res) {
  try {
    const { subject, start, end } = req.query;
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

    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const filter = {};
    if (subject) filter.subject = subject;
    filter.date = { $gte: startDate, $lte: endDate };
    filter.user = userId;

    const items = await Study.find(filter).sort({ date: -1 });

    const exportDir = path.join(__dirname, '..', '..', 'exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const lines = items.map((it) => {
      const day = it.date ? new Date(it.date).toISOString().split('T')[0] : '';
      return `id: ${String(it._id)} | date: ${day} | subject: ${it.subject || ''} | time: ${it.time || 0} | notes: ${it.notes || ''}`;
    });

    const filename = `study_export_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}_${Date.now()}.txt`;
    const filepath = path.join(exportDir, filename);

    let content;
    if (lines.length) content = `Total records: ${lines.length}\n` + lines.join('\n');
    else content = `Total records: 0\nNo records for range ${startDate.toISOString()} - ${endDate.toISOString()}`;

    await writeFileAtomic(filepath, content);

    const wantDownload = (req.query.download === '1' || req.query.download === 'true') || (req.headers.accept && req.headers.accept.includes('text/html'));
    if (wantDownload) {
      return res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Error sending study export', err);
          if (!res.headersSent) return res.status(500).json({ ok: false, error: 'Failed to send file' });
        }
        try { if (fs.existsSync(filepath)) fs.unlinkSync(filepath); } catch (e) { console.error(e); }
      });
    }

    return res.json({ ok: true, file: `exports/${filename}`, count: items.length });
  } catch (err) {
    console.error('Export study range error', err);
    return res.status(500).json({ ok: false, error: 'Failed to export study records' });
  }
}

module.exports = {
  createStudy,
  listStudies,
  getStudyById,
  updateStudy,
  deleteStudy,
  exportRange
};



