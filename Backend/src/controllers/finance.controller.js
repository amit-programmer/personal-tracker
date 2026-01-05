const Finance = require('../models/finance.model');
const path = require('path');
const fs = require('fs');
const writeFileAtomic = require('write-file-atomic');


async function createRecord(req, res) {
  try {
    // Accept both new model fields (`type`, `rupees`) and legacy numeric parts (expense/gain/assetsBuy)
    const { name, day, type, rupees, expense, gain, assetsBuy, currency, upi, description } = req.body;
    const data = {};
    if (typeof name !== 'undefined') data.name = name;
    if (typeof day !== 'undefined') data.day = day ? new Date(day) : undefined;
    if (typeof type !== 'undefined') data.type = type;
    if (typeof currency !== 'undefined') data.currency = currency;
    if (typeof description !== 'undefined') data.description = description;

    // Compute `rupees`: prefer explicit `rupees` from request, otherwise compute from expense/gain/assetsBuy if provided
    const reqExpense = typeof expense !== 'undefined' ? Number(expense) : 0;
    const reqGain = typeof gain !== 'undefined' ? Number(gain) : 0;
    const reqAssets = typeof assetsBuy !== 'undefined' ? Number(assetsBuy) : 0;
    data.rupees = typeof rupees !== 'undefined' ? Number(rupees) : (reqExpense + reqGain + reqAssets);
    // If `type` not supplied, infer from provided numeric values for backwards compatibility
    if (!data.type) {
      if (reqAssets > 0) data.type = 'assetsBuy';
      else if (reqGain > 0) data.type = 'gain';
      else if (reqExpense > 0) data.type = 'expenses';
    }

    const record = await Finance.create(data);
    return res.status(201).json({ ok: true, data: record });
  } catch (err) {
    console.error('Create finance record error', err);
    return res.status(500).json({ ok: false, error: 'Failed to create record' });
  }
}

async function listRecords(req, res) {
  try {
    // support optional date range via query params
    const { start, end } = req.query;
    if (start || end) {
      let startDate = start ? new Date(start) : new Date(0);
      let endDate = end ? new Date(end) : new Date();

      // If user accidentally passed start > end, swap the dates
      if (startDate > endDate) {
        const tmp = startDate;
        startDate = endDate;
        endDate = tmp;
      }

      // Use model helper if available, otherwise query Mongo directly
      let records;
      if (typeof Finance.findByDateRange === 'function') {
        records = await Finance.findByDateRange(startDate, endDate);
      } else {
        records = await Finance.find({ day: { $gte: startDate, $lte: endDate } }).sort({ day: -1 });
      }

      return res.json({ ok: true, data: records });
    }

    // Default: fetch Mongo records
    const records = await Finance.find().sort({ day: -1 });

    // Return Mongo records only

    return res.json({ ok: true, data: records });
  } catch (err) {
    console.error('List finance records error', err);
    return res.status(500).json({ ok: false, error: 'Failed to list records' });
  }
}

async function getRecordById(req, res) {
  try {
    const { id } = req.params;
    const record = await Finance.findById(id);
    if (!record) return res.status(404).json({ ok: false, error: 'Record not found' });



    return res.json({ ok: true, data: record });
  } catch (err) {
    console.error('Get finance record error', err);
    return res.status(500).json({ ok: false, error: 'Failed to fetch record' });
  }
}

  async function updateRecord(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ ok: false, error: 'id required' });

      // Only allow updates to the MongoDB fields; No Notion interaction
      const allowed = ['name', 'day', 'type', 'rupees', 'currency', 'description'];
      const updates = {};
      allowed.forEach((k) => {
        if (typeof req.body[k] !== 'undefined') {
          if (k === 'day') updates.day = req.body.day ? new Date(req.body.day) : null;
          else if (k === 'rupees') updates.rupees = req.body.rupees === null ? null : Number(req.body.rupees);
          else updates[k] = req.body[k];
        }
      });

      if (!Object.keys(updates).length) return res.status(400).json({ ok: false, error: 'No valid fields to update' });

      const updated = await Finance.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ ok: false, error: 'Record not found' });
      return res.json({ ok: true, data: updated });
    } catch (err) {
      console.error('Update finance record error', err);
      return res.status(500).json({ ok: false, error: 'Failed to update record' });
    }
  }




async function deleteRecord(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ ok: false, error: 'id required' });

    // Find the record first
    const record = await Finance.findById(id);
    if (!record) return res.status(404).json({ ok: false, error: 'Record not found' });

    // No external sync — delete Mongo record only

    // Delete Mongo record
    const removed = await Finance.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ ok: false, error: 'Record not found after delete attempt' });

    return res.json({ ok: true, data: removed });
  } catch (err) {
    console.error('Delete finance record error', err);
    return res.status(500).json({ ok: false, error: 'Failed to delete record' });
  }
}

async function totalsForRange(req, res) {
  try {
    const { start, end } = req.query;
    const startDate = start ? new Date(start) : new Date(0);
    const endDate = end ? new Date(end) : new Date();
    const totals = await Finance.calculateTotals(startDate, endDate);
    return res.json({ ok: true, data: totals });
  } catch (err) {
    console.error('Calculate totals error', err);
    return res.status(500).json({ ok: false, error: 'Failed to calculate totals' });
  }
}





// Export records between two dates to a text file (plain text)
async function exportRange(req, res) {
  try {
    const { start, end } = req.query;
    let startDate = start ? new Date(start) : new Date(0);
    let endDate = end ? new Date(end) : new Date();

    // Include the full end day (set to end of day) to avoid missing records
    endDate = new Date(endDate);
    endDate.setHours(23, 59, 59, 999);

    // swap if inverted
    if (startDate > endDate) {
      const tmp = startDate;
      startDate = endDate;
      endDate = tmp;
    }

    // Reuse existing helper if available, otherwise query directly
    let records;
    if (typeof Finance.findByDateRange === 'function') {
      records = await Finance.findByDateRange(startDate, endDate);
    } else {
      records = await Finance.find({ day: { $gte: startDate, $lte: endDate } }).sort({ day: -1 });
    }

    // Prepare export directory
    const exportDir = path.join(__dirname, '..', '..', 'exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    // Format records into a simple text representation
    const lines = records.map((r) => {
      const day = r.day ? new Date(r.day).toISOString().split('T')[0] : '';
      const parts = [ `day: ${day}`, `type: ${r.type || ''}`, `rupees: ${r.rupees || 0}`, `currency: ${r.currency || ''}`, `description: ${r.description || ''}`];
      return parts.join(' | ');
    });

    const filename = `finance_export_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}_${Date.now()}.txt`;
    const filepath = path.join(exportDir, filename);

    // Build content with a header showing total records
    let content;
    if (lines.length) {
      content = `Total records: ${lines.length}\n` + lines.join('\n');
    } else {
      content = `Total records: 0\nNo records for range ${startDate.toISOString()} - ${endDate.toISOString()}`;
    }

    // Atomically write the file
    await writeFileAtomic(filepath, content);

    console.log(`Exported ${records.length} records to ${filepath}`);

    // If request looks like a browser visit or explicit download requested, send file as attachment
    const wantDownload = (req.query.download === '1' || req.query.download === 'true')
      || (req.headers.accept && req.headers.accept.includes('text/html'));

    if (wantDownload) {
      // Stream file as attachment and delete after download completes (or errors)
      // Note: auth middleware still applies. Browser must include auth cookie or token.
      return res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Error sending download', err);
          if (!res.headersSent) return res.status(500).json({ ok: false, error: 'Failed to send file' });
        }

        // Attempt to remove the file after sending
        try {
          if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        } catch (unlinkErr) {
          console.error('Failed to delete export file after download', unlinkErr);
        }
      });
    }

    return res.json({ ok: true, file: `exports/${filename}`, count: records.length });
  } catch (err) {
    console.error('Export finance range error', err);
    return res.status(500).json({ ok: false, error: 'Failed to export records' });
  }
}


module.exports = {
  createRecord,
  listRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  totalsForRange,
  exportRange,
  // Notion endpoints

  // notionClientInfo
}