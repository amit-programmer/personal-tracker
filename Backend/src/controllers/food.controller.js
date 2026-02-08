const Food = require('../models/food.model');
const Finance = require('../models/finance.model');
const path = require('path');
const fs = require('fs');
const writeFileAtomic = require('write-file-atomic');

// (Notion integration removed) Food items are created via `createItem` and logged in Finance collection.

// Create a new food item
async function createItem(req, res) {
  try {
    const { foodName, price, quantity, category, unit, purchaseDate, calories, notes } = req.body;
    const data = {
      // associate item with authenticated user
      user: req.user && req.user.sub,
      foodName,
      price: typeof price !== 'undefined' ? Number(price) : undefined,
      quantity: typeof quantity !== 'undefined' ? Number(quantity) : undefined,
      category,
      unit,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      calories,
      notes
    };

    // remove undefined properties
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const item = await Food.create(data);

    // Also create a finance record for this food purchase only if price > 0
    try {
      const expense = Number(item.price || 0);
      if (expense > 0) {
        const financeData = {
          user: item.user || (req.user && req.user.sub),
          day: item.purchaseDate || new Date(),
          expense,
          gain: 0,
          assetsBuy: 0,
          rupees: expense, // rupees = gain + assetsBuy + expense
          currency: 'INR',
          upi: undefined,
          // description: use category if present otherwise foodName
          name: item.foodName,
          description: item.notes
        };
        await Finance.create(financeData);
      }
    } catch (ferr) {
      console.error('Failed to create finance record for food item', ferr);
      // don't fail the whole request; food item was created
    }

    return res.status(201).json({ ok: true, data: item });
  } catch (err) {
    console.error('Create Food error', err);
    return res.status(500).json({ ok: false, error: 'Failed to create food item' });
  }
}

// List items (supports optional ?category= and ?start=&end= for purchaseDate)
async function listItems(req, res) {
  try {
    const { category, start, end } = req.query;
    const filter = {};
    // always restrict to current user
    if (req.user && req.user.sub) filter.user = req.user.sub;
    if (category) filter.category = category;
    if (start || end) {
      filter.purchaseDate = {};
      if (start) filter.purchaseDate.$gte = new Date(start);
      if (end) filter.purchaseDate.$lte = new Date(end);
    }

    const items = await Food.find(filter).sort({ purchaseDate: -1 });
    return res.json({ ok: true, data: items });
  } catch (err) {
    console.error('List Food error', err);
    return res.status(500).json({ ok: false, error: 'Failed to list food items' });
  }
}

async function getItemById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.sub;
    const item = await Food.findOne({ _id: id, user: userId });
    if (!item) return res.status(404).json({ ok: false, error: 'Food item not found' });
    return res.json({ ok: true, data: item });
  } catch (err) {
    console.error('Get Food item error', err);
    return res.status(500).json({ ok: false, error: 'Failed to fetch food item' });
  }
}

async function updateItem(req, res) {
  try {
    const { id } = req.params;
    const { foodName, price, quantity, category, unit, purchaseDate, calories, notes } = req.body;
    const updates = {};
    if (typeof foodName !== 'undefined') updates.foodName = foodName;
    if (typeof price !== 'undefined') updates.price = Number(price);
    if (typeof quantity !== 'undefined') updates.quantity = Number(quantity);
    if (typeof category !== 'undefined') updates.category = category;
    if (typeof unit !== 'undefined') updates.unit = unit;
    if (typeof purchaseDate !== 'undefined') updates.purchaseDate = new Date(purchaseDate);
    if (typeof calories !== 'undefined') updates.calories = calories;
    if (typeof notes !== 'undefined') updates.notes = notes;

    const userId = req.user && req.user.sub;
    const updated = await Food.findOneAndUpdate({ _id: id, user: userId }, updates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ ok: false, error: 'Food item not found or not owned by user' });
    return res.json({ ok: true, data: updated });
  } catch (err) {
    console.error('Update Food item error', err);
    return res.status(500).json({ ok: false, error: 'Failed to update food item' });
  }
}

async function deleteItem(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.sub;
    const removed = await Food.findOneAndDelete({ _id: id, user: userId });
    if (!removed) return res.status(404).json({ ok: false, error: 'Food item not found or not owned by user' });
    return res.json({ ok: true, data: removed });
  } catch (err) {
    console.error('Delete Food item error', err);
    return res.status(500).json({ ok: false, error: 'Failed to delete food item' });
  }
}

// Export food items between two dates to a text file
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
    const filter = { purchaseDate: { $gte: startDate, $lte: endDate }, user: userId };
    const items = await Food.find(filter).sort({ purchaseDate: -1 });

    // Prepare export dir
    const exportDir = path.join(__dirname, '..', '..', 'exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const lines = items.map((it) => {
      const day = it.purchaseDate ? new Date(it.purchaseDate).toISOString().split('T')[0] : '';
      return ` day: ${day} | name: ${it.foodName || ''} | price: ${it.price || 0} | qty: ${it.quantity || ''} | category: ${it.category || ''} | notes: ${it.notes || ''}`;
    });

    const filename = `food_export_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}_${Date.now()}.txt`;
    const filepath = path.join(exportDir, filename);

    let content;
    if (lines.length) {
      content = `Total records: ${lines.length}\n` + lines.join('\n');
    } else {
      content = `Total records: 0\nNo records for range ${startDate.toISOString()} - ${endDate.toISOString()}`;
    }

    await writeFileAtomic(filepath, content);

    const wantDownload = (req.query.download === '1' || req.query.download === 'true') || (req.headers.accept && req.headers.accept.includes('text/html'));
    if (wantDownload) {
      return res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Error sending food export', err);
          if (!res.headersSent) return res.status(500).json({ ok: false, error: 'Failed to send file' });
        }
        try { if (fs.existsSync(filepath)) fs.unlinkSync(filepath); } catch (e) { console.error(e); }
      });
    }

    return res.json({ ok: true, file: `exports/${filename}`, count: items.length });
  } catch (err) {
    console.error('Export food range error', err);
    return res.status(500).json({ ok: false, error: 'Failed to export food items' });
  }
}

module.exports = {
  createItem,
  listItems,
  getItemById,
  updateItem,
  deleteItem,
  exportRange
};

