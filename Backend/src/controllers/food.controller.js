const Food = require('../models/food.model');
const Finance = require('../models/finance.model');

// Helper to safely extract values from Notion properties
function extractNotionValue(prop) {
  if (!prop) return undefined;
  if (prop.title && Array.isArray(prop.title) && prop.title[0]) return prop.title[0].plain_text || prop.title[0].text?.content;
  if (prop.rich_text && Array.isArray(prop.rich_text) && prop.rich_text[0]) return prop.rich_text[0].plain_text || prop.rich_text[0].text?.content;
  if (typeof prop.number === 'number') return prop.number;
  if (prop.select && typeof prop.select === 'object') return prop.select.name || undefined;
  if (prop.multi_select && Array.isArray(prop.multi_select)) return prop.multi_select.map(s => s.name).join(', ');
  if (prop.date && prop.date.start) return prop.date.start;
  if (prop.type === 'checkbox') return !!prop.checkbox;
  if (prop.plain_text) return prop.plain_text;
  return undefined;
}

// Create or sync a food item from a Notion page payload (expects properties)
async function createNotionPage(req, res) {
  try {
    const payload = req.body || {};

    // Try to find properties in several possible Notion webhook/agent shapes
    function findProperties(p) {
      if (!p) return undefined;
      // direct properties
      if (p.properties && typeof p.properties === 'object') return p.properties;
      // some webhooks wrap under page/record/resource
      if (p.page && p.page.properties) return p.page.properties;
      if (p.record && p.record.properties) return p.record.properties;
      if (p.resource && p.resource.properties) return p.resource.properties;
      // Notion's recordMap style: recordMap.block[id].value.properties
      if (p.recordMap && p.recordMap.block) {
        const blocks = p.recordMap.block;
        const keys = Object.keys(blocks);
        if (keys.length) {
          const first = blocks[keys[0]];
          if (first && first.value && first.value.properties) return first.value.properties;
        }
      }
      // older or alternative payloads where properties are directly the body
      const knownKeys = ['Name','Price','Quantity','Category','Unit','Purchase Date','Notes','foodName','price','quantity'];
      const hasKnown = knownKeys.some(k => Object.prototype.hasOwnProperty.call(p, k) || Object.prototype.hasOwnProperty.call(p, k.toLowerCase()));
      if (hasKnown) return p; // treat payload itself as properties-like object
      return undefined;
    }

    const page = payload.page || payload.record || payload.resource || payload;
    const pageId = page?.id || payload?.id || payload?.page_id || payload?.pageId || payload?.notionPageId;
    const properties = findProperties(payload);

    // If we couldn't find any properties-like data, but body contains direct fields, fall back to them.
    if (!properties) {
      // still try direct fields below, so do not return error here — continue to create using direct values
      console.warn('createNotionPage: properties not found, falling back to direct payload fields');
    }

    const getProp = (names) => {
      if (!properties) return undefined;
      for (const n of names) {
        if (properties[n]) return properties[n];
        const lower = n.toLowerCase();
        if (properties[lower]) return properties[lower];
        // Notion sometimes stores values as arrays keyed by property name
        for (const key of Object.keys(properties)) {
          if (key.toLowerCase() === lower) return properties[key];
        }
      }
      return undefined;
    };

    // Helper to fallback to direct payload fields when properties missing
    const direct = (keys) => {
      for (const k of keys) {
        if (payload[k] !== undefined) return payload[k];
        const lower = k.toLowerCase();
        if (payload[lower] !== undefined) return payload[lower];
      }
      return undefined;
    };

    const foodName = extractNotionValue(getProp(['Name', 'Title', 'Food Name', 'foodName'])) || direct(['foodName','name','Name','title']);
    const priceVal = extractNotionValue(getProp(['Price', 'price', 'Cost', 'Amount'])) || direct(['price','Price','amount','Amount','cost','Cost']);
    const quantityVal = extractNotionValue(getProp(['Quantity', 'quantity', 'Qty', 'qty'])) || direct(['quantity','qty','Quantity']);
    const category = extractNotionValue(getProp(['Category', 'category'])) || direct(['category']);
    const unit = extractNotionValue(getProp(['Unit', 'unit'])) || direct(['unit']);
    const purchaseDateRaw = extractNotionValue(getProp(['Purchase Date', 'Date', 'purchaseDate'])) || direct(['purchaseDate','date','Date']);
    const notes = extractNotionValue(getProp(['Notes', 'notes', 'Description', 'description', 'Notes/Description'])) || direct(['notes','description','Notes','Description']);

    const data = {
      foodName: foodName || undefined,
      price: typeof priceVal !== 'undefined' && priceVal !== null ? Number(priceVal) : undefined,
      quantity: typeof quantityVal !== 'undefined' && quantityVal !== null ? Number(quantityVal) : undefined,
      category: category || undefined,
      unit: unit || undefined,
      purchaseDate: purchaseDateRaw ? new Date(purchaseDateRaw) : undefined,
      notes: notes || undefined,
      notionPageId: pageId || undefined
    };

    // remove undefined properties
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    // Idempotent: update existing food item if notionPageId exists
    let item;
    if (pageId) {
      const existing = await Food.findOne({ notionPageId: pageId });
      if (existing) {
        item = await Food.findByIdAndUpdate(existing._id, data, { new: true, runValidators: true });
      } else {
        item = await Food.create(data);
      }
    } else {
      // no notion id provided — create a new record
      item = await Food.create(data);
    }

    // Sync to finance (create or update by notion page id)
    try {
      const expense = Number(item.price || 0);
      const financeData = {
        day: item.purchaseDate || new Date(),
        rupees: expense,
        description: item.foodName || item.notes,
        notionPageId: pageId || undefined,
        type: 'expense',
        currency: 'INR'
      };

      if (pageId) {
        await Finance.findOneAndUpdate({ notionPageId: pageId }, financeData, { upsert: true, new: true, setDefaultsOnInsert: true });
      } else {
        await Finance.create(financeData);
      }
    } catch (ferr) {
      console.error('Failed to create/update finance record for Notion food item', ferr);
    }

    return res.status(item ? 200 : 201).json({ ok: true, data: item });
  } catch (err) {
    console.error('createNotionPage error', err);
    return res.status(500).json({ ok: false, error: 'Failed to create/update food item from Notion' });
  }
}

// Create a new food item
async function createItem(req, res) {
  try {
    const { foodName, price, quantity, category, unit, purchaseDate, notes } = req.body;
    const data = {
      foodName,
      price: typeof price !== 'undefined' ? Number(price) : undefined,
      quantity: typeof quantity !== 'undefined' ? Number(quantity) : undefined,
      category,
      unit,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      notes
    };

    // remove undefined properties
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const item = await Food.create(data);

    // Also create a finance record for this food purchase
    try {
      const expense = Number(item.price || 0);
      const financeData = {
        day: item.purchaseDate || new Date(),
        expense,
        gain: 0,
        assetsBuy: 0,
        rupees: expense, // rupees = gain + assetsBuy + expense
        currency: 'INR',
        upi: undefined,
        // description: use category if present otherwise foodName
        description: item.foodName || item.notes
      };
      await Finance.create(financeData);
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
    const item = await Food.findById(id);
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
    const { foodName, price, quantity, category, unit, purchaseDate, notes } = req.body;
    const updates = {};
    if (typeof foodName !== 'undefined') updates.foodName = foodName;
    if (typeof price !== 'undefined') updates.price = Number(price);
    if (typeof quantity !== 'undefined') updates.quantity = Number(quantity);
    if (typeof category !== 'undefined') updates.category = category;
    if (typeof unit !== 'undefined') updates.unit = unit;
    if (typeof purchaseDate !== 'undefined') updates.purchaseDate = new Date(purchaseDate);
    if (typeof notes !== 'undefined') updates.notes = notes;

    const updated = await Food.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ ok: false, error: 'Food item not found' });
    return res.json({ ok: true, data: updated });
  } catch (err) {
    console.error('Update Food item error', err);
    return res.status(500).json({ ok: false, error: 'Failed to update food item' });
  }
}

async function deleteItem(req, res) {
  try {
    const { id } = req.params;
    const removed = await Food.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ ok: false, error: 'Food item not found' });
    return res.json({ ok: true, data: removed });
  } catch (err) {
    console.error('Delete Food item error', err);
    return res.status(500).json({ ok: false, error: 'Failed to delete food item' });
  }
}

module.exports = {
  createItem,
  createNotionPage,
  listItems,
  getItemById,
  updateItem,
  deleteItem
};
