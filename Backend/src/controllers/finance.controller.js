const Finance = require('../models/finance.model');
const notion = require('../notionClient');
// const { createPageInDatabase, queryDatabase } = require('../utils/notion.util');
const https = require('https');


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
    
    // Build Notion properties (adjust property names to match your Notion DB)
    try {
      const dateStr = (record.day ? new Date(record.day) : new Date()).toISOString().split('T')[0];
      // Prefer property names that match the target Notion DB (per provided screenshot):
      // - Title column: `Transaction`
      // - Date column: `day`
      // - Type column: `Type` (select with values like "expense", "gain", "assetsbuy")
      // - Currency: `currency`
      // - Description: `description`
      // - Amount: `rupees`
      // Determine Notion `Type` value. Prefer `record.type` (new model); normalize to simple values used in Notion.
      let notionType = 'other';
      if (record && record.type) {
        const t = String(record.type).toLowerCase();
        if (t.includes('asset')) notionType = 'assetbuy';
        else if (t.includes('gain')) notionType = 'gain';
        else if (t.includes('expens')) notionType = 'expense';
        else notionType = t;
      } else {
        // fallback to request-level numeric values (we captured them above as reqExpense/reqGain/reqAssets)
        if (typeof reqAssets !== 'undefined' && reqAssets > 0) notionType = 'assetbuy';
        else if (typeof reqGain !== 'undefined' && reqGain > 0) notionType = 'gain';
        else if (typeof reqExpense !== 'undefined' && reqExpense > 0) notionType = 'expense';
      }

      // Build properties using the model-friendly names: Transaction/day/Type/rupees/currency/description.
      // For a safe fallback (when DB schema is not known) send only commonly-present properties with conservative types:
      // - `Transaction` as title
      // - `day` as date
      // - `Type` as select
      // - `rupees` as number
      // - `currency` as select (many DBs use select for currency values)
      // - `description` as rich_text
      const notionProps = {
        Transaction: { title: [{ text: { content: record.name || `Finance ${record._id}` } }] },
        day: { date: { start: dateStr } },
        Type: { select: { name: notionType } },
        rupees: { number: record.rupees || 0 },
        currency: { select: { name: record.currency || 'INR' } },
        description: { rich_text: [{ text: { content: record.description || '' } }] }
      };

      // Log created DB id locally
      console.log('Finance record created in MongoDB:', record._id);

      // Use DB id from environment (consistent variable name)
      const dbId = process.env.NOTION_FINANCE_DB;
      // Allow per-request override: ?notion=1 or body.syncToNotion = true
      const reqForcesNotion = (req && (req.query && (req.query.notion === '1' || req.query.notion === 'true'))) ||
        (req && req.body && (req.body.syncToNotion === true || req.body.syncToNotion === '1' || req.body.syncToNotion === 'true'));
      // Enable Notion sync by default unless explicitly disabled with NOTION_SYNC='0'
      const envAllowsNotion = process.env.NOTION_SYNC !== '0';
      const doNotionSync = envAllowsNotion || reqForcesNotion;

      if (!dbId) {
        console.warn('NOTION_FINANCE_DB environment variable not set — skipping Notion sync');
      } else if (!doNotionSync) {
        // Keep Notion sync opt-in to avoid noisy errors during development
        console.log('NOTION_SYNC!=1 — skipping Notion sync for this record. To force for this request, set body.syncToNotion=true or add ?notion=1');
      } else {
        // Await the Notion call and log result / error so issues show in server console
        try {
          // Try to retrieve DB schema
          let dbInfo = null;
          try {
            if (notion && notion.databases && typeof notion.databases.retrieve === 'function') {
              dbInfo = await notion.databases.retrieve({ database_id: dbId });
            } else {
              // fallback: HTTPS GET
              dbInfo = await new Promise((resolve, reject) => {
                const options = {
                  hostname: 'api.notion.com',
                  path: `/v1/databases/${dbId}`,
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
                    'Notion-Version': process.env.NOTION_VERSION || '2022-06-28'
                  }
                };
                const r = https.request(options, (resp) => {
                  let body = '';
                  resp.on('data', (chunk) => (body += chunk));
                  resp.on('end', () => {
                    try { resolve(JSON.parse(body || '{}')); } catch (e) { reject(e); }
                  });
                });
                r.on('error', (e) => reject(e));
                r.end();
              });
            }
          } catch (e) {
            dbInfo = null;
          }

          // If the DB info doesn't include properties, warn and try to recover by retrying a DB retrieve.
          // If that still fails, skip the Notion create to avoid API errors (property-mismatch errors).
          if (!dbInfo || !dbInfo.properties || Object.keys(dbInfo.properties).length === 0) {
            console.warn('Notion DB properties missing or empty. Will retry retrieve before attempting any create.');
            console.warn('Possible causes: wrong NOTION_FINANCE_DB id, integration not shared with the database, or API key lacking permission.');
            console.warn('Full DB retrieve response (for debugging):');
            console.warn(JSON.stringify(dbInfo || {}, null, 2));

            // Try one more time to fetch DB schema via SDK (if available)
            try {
              if (notion && notion.databases && typeof notion.databases.retrieve === 'function') {
                const retry = await notion.databases.retrieve({ database_id: dbId });
                if (retry && retry.properties && Object.keys(retry.properties).length) {
                  dbInfo = retry;
                }
              }
            } catch (e) {
              // ignore — we'll handle below by skipping
            }

            // If still missing, try a best-effort create using the hard-coded `notionProps`.
            if (!dbInfo || !dbInfo.properties || Object.keys(dbInfo.properties).length === 0) {
              console.warn('Unable to determine Notion DB properties after retry. Will attempt best-effort create using fallback property mapping.');
              console.warn('Possible causes: wrong NOTION_FINANCE_DB id, integration not shared with the database, or API key lacking permission.');
              try {
                const toSend = notionProps;
                const notionRes = await notionCreatePage(dbId, toSend);
                console.log('Notion page created (fallback properties):', notionRes && (notionRes.id || notionRes.object));
              } catch (fallbackErr) {
                console.warn('Fallback Notion create failed:', fallbackErr && fallbackErr.message ? fallbackErr.message : String(fallbackErr));
                console.warn('Skipping Notion sync. Ensure the integration is shared with the database and NOTION_FINANCE_DB is correct.');
              }
            } else {
              // proceed to mapping using the newly retrieved dbInfo
              // Build a simple candidate map of values we want to send. Include both `assetbuy` and `assetsbuy` aliases so mapping matches either DB naming.
              const candidate = {
                name: record.name || `Finance ${record._id}`,
                date: dateStr,
                expense: record.expense || 0,
                gain: record.gain || 0,
                assetsbuy: record.assetsBuy || 0,
                assetbuy: record.assetsBuy || 0,
                rupees: record.rupees || 0,
                currency: record.currency || 'INR',
                description: record.description || ''
              };

              // Map candidate values to DB property names
              let mappedProps = {};
              const props = dbInfo.properties;
              const lowerToKey = Object.keys(props).reduce((acc, key) => { acc[key.toLowerCase()] = key; return acc; }, {});
              // For each db property, decide value based on type and candidate keys
              Object.entries(props).forEach(([propName, propDef]) => {
                const lname = propName.toLowerCase();
                // try direct matches
                const tryKeys = [lname, lname.replace(/[^a-z0-9]/g, ''), lname.split(' ').join(''), lname.split('_').join('')];
                let found = null;
                for (const tk of tryKeys) {
                  if (candidate.hasOwnProperty(tk)) { found = tk; break; }
                }
                // also try matching by common synonyms
                if (!found) {
                  const synonyms = { title: 'name', name: 'name', date: 'date', expense: 'expense', gain: 'gain', assets: 'assetsbuy', assetsbuy: 'assetsbuy', rupees: 'rupees', currency: 'currency', description: 'description' };
                  Object.keys(synonyms).forEach(k => { if (!found && lname.indexOf(k) !== -1 && candidate.hasOwnProperty(synonyms[k])) found = synonyms[k]; });
                }

                const valueKey = found;
                if (!valueKey) return;

                const val = candidate[valueKey];
                if (val === undefined || val === null) return;

                // Build property payload based on Notion property type
                switch (propDef.type) {
                  case 'title':
                    mappedProps[propName] = { title: [{ text: { content: String(val) } }] };
                    break;
                  case 'rich_text':
                  case 'text':
                    mappedProps[propName] = { rich_text: [{ text: { content: String(val) } }] };
                    break;
                  case 'number':
                    mappedProps[propName] = { number: Number(val) };
                    break;
                  case 'date':
                    mappedProps[propName] = { date: { start: String(val) } };
                    break;
                  default:
                    // best-effort: send as rich_text
                    mappedProps[propName] = { rich_text: [{ text: { content: String(val) } }] };
                }
              });

              const toSend = Object.keys(mappedProps).length ? mappedProps : notionProps;
              try {
                const notionRes = await notionCreatePage(dbId, toSend);
                console.log('Notion page created (retry mapping):', notionRes && (notionRes.id || notionRes.object));
              } catch (err) {
                console.warn('Notion create after retry failed:', err && err.message ? err.message : String(err));
              }
            }
          } else {
            // Build a simple candidate map of values we want to send. Include both `assetbuy` and `assetsbuy` aliases so mapping matches either DB naming.
            const candidate = {
              name: record.name || `Finance ${record._id}`,
              date: dateStr,
              expense: record.expense || 0,
              gain: record.gain || 0,
              assetsbuy: record.assetsBuy || 0,
              assetbuy: record.assetsBuy || 0,
              rupees: record.rupees || 0,
              currency: record.currency || 'INR',
              description: record.description || ''
            };

            // Map candidate values to DB property names
            let mappedProps = {};
            const props = dbInfo.properties;
            const lowerToKey = Object.keys(props).reduce((acc, key) => { acc[key.toLowerCase()] = key; return acc; }, {});
            // For each db property, decide value based on type and candidate keys
            Object.entries(props).forEach(([propName, propDef]) => {
              const lname = propName.toLowerCase();
              // try direct matches
              const tryKeys = [lname, lname.replace(/[^a-z0-9]/g, ''), lname.split(' ').join(''), lname.split('_').join('')];
              let found = null;
              for (const tk of tryKeys) {
                if (candidate.hasOwnProperty(tk)) { found = tk; break; }
              }
              // also try matching by prop type common names
              if (!found) {
                if (lname.includes('name') || lname === 'title') found = 'name';
                else if (lname.includes('date')) found = 'date';
                else if (lname.includes('expens')) found = 'expense';
                else if (lname.includes('gain')) found = 'gain';
                else if (lname.includes('asset')) found = 'assetsbuy';
                else if (lname.includes('rupee') || lname.includes('amount')) found = 'rupees';
                else if (lname.includes('currency')) found = 'currency';
                else if (lname.includes('desc') || lname.includes('note')) found = 'description';
              }

              const valueKey = found;
              if (!valueKey) return;

              const val = candidate[valueKey];
              if (val === undefined || val === null) return;

              // Build property payload based on Notion property type
              switch (propDef.type) {
                case 'title':
                  mappedProps[propName] = { title: [{ text: { content: String(val) } }] };
                  break;
                case 'date':
                  mappedProps[propName] = { date: { start: typeof val === 'string' ? val : (val.toISOString ? val.toISOString() : String(val)) } };
                  break;
                case 'number':
                  mappedProps[propName] = { number: Number(val) };
                  break;
                case 'rich_text':
                case 'text':
                  mappedProps[propName] = { rich_text: [{ text: { content: String(val) } }] };
                  break;
                case 'select':
                  mappedProps[propName] = { select: { name: String(val) } };
                  break;
                case 'multi_select':
                  mappedProps[propName] = { multi_select: Array.isArray(val) ? val.map(v => ({ name: String(v) })) : [{ name: String(val) }] };
                  break;
                default:
                  // fallback to rich_text
                  mappedProps[propName] = { rich_text: [{ text: { content: String(val) } }] };
              }
            });

            // If mapping produced properties, use them; otherwise use original notionProps and try
            const toSend = Object.keys(mappedProps).length ? mappedProps : notionProps;
            const notionRes = await notionCreatePage(dbId, toSend);
            console.log('Notion page created:', notionRes && (notionRes.id || notionRes.object));
          }
        } catch (err) {
          const msg = err && err.message ? err.message : String(err);
          console.warn('Notion create page failed:', msg);

          // If Notion reports missing properties, fetch DB schema to show correct property names
          try {
            if (notion && notion.databases && typeof notion.databases.retrieve === 'function') {
              const dbInfo2 = await notion.databases.retrieve({ database_id: dbId });
              if (dbInfo2 && dbInfo2.properties && Object.keys(dbInfo2.properties).length) {
                console.warn('Notion DB properties (name -> type):');
                Object.entries(dbInfo2.properties).forEach(([k, v]) => {
                  console.warn(`  ${k} -> ${v.type}`);
                });
              } else {
                // Log full dbInfo to help debugging if properties absent
                console.warn('Unable to read Notion DB properties from retrieve response — full response:');
                console.warn(JSON.stringify(dbInfo2, null, 2));
              }
            } else {
              console.warn('Notion SDK does not support databases.retrieve on this client — cannot fetch schema');
            }
          } catch (schemaErr) {
            console.warn('Failed to retrieve Notion DB schema:', schemaErr && schemaErr.message ? schemaErr.message : String(schemaErr));
          }
        }
      }
    } catch (err) {
      console.warn('Notion mapping/submit error', err);
    }

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
      const startDate = start ? new Date(start) : new Date(0);
      const endDate = end ? new Date(end) : new Date();
      const records = await Finance.findByDateRange(startDate, endDate);
      return res.json({ ok: true, data: records });
    }

    // Default: fetch Mongo records
    const records = await Finance.find().sort({ day: -1 });

    // Optionally include Notion data when caller passes ?notion=1 or ?includeNotion=1
    const includeNotion = req.query.notion === '1' || req.query.notion === 'true' || req.query.includeNotion === '1' || req.query.includeNotion === 'true';
    if (includeNotion) {
      const dbId = process.env.NOTION_FINANCE_DB;
      if (!dbId) {
        console.warn('NOTION_FINANCE_DB environment variable not set — skipping Notion query');
        return res.json({ ok: true, data: records, notion: { ok: false, error: 'NOTION_FINANCE_DB not set' } });
      }

      try {
        const notionResults = await notionQueryDatabase(dbId);
        console.log('Notion query returned', Array.isArray(notionResults) ? notionResults.length : 0, 'items');
        return res.json({ ok: true, data: records, notion: { ok: true, data: notionResults } });
      } catch (err) {
        console.warn('Notion query failed:', err && err.message ? err.message : err);
        return res.json({ ok: true, data: records, notion: { ok: false, error: err && err.message ? err.message : String(err) } });
      }
    }

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
      // If the Mongo record has a linked Notion page id, attempt a safe update
      let notionResp = null;
      try {
        if (updated.notionPageId) {
          const pageId = updated.notionPageId;

          // Candidate values derived from the updated Mongo doc
          const dateStr = updated.day ? new Date(updated.day).toISOString().split('T')[0] : undefined;
          const candidate = {
            name: typeof updated.name !== 'undefined' ? updated.name : undefined,
            date: typeof dateStr !== 'undefined' ? dateStr : undefined,
            rupees: typeof updated.rupees !== 'undefined' ? updated.rupees : undefined,
            currency: typeof updated.currency !== 'undefined' ? updated.currency : undefined,
            description: typeof updated.description !== 'undefined' ? updated.description : undefined,
            type: typeof updated.type !== 'undefined' ? updated.type : undefined
          };

          // Determine DB id by retrieving the page (SDK or HTTP fallback)
          const notionClient = require('../notionClient');
          let pageObj = null;
          try {
            if (notionClient && notionClient.pages && typeof notionClient.pages.retrieve === 'function') {
              pageObj = await notionClient.pages.retrieve({ page_id: pageId });
            }
          } catch (e) {
            pageObj = null;
          }
          if (!pageObj) {
            try {
              pageObj = await new Promise((resolve, reject) => {
                const options = {
                  hostname: 'api.notion.com',
                  path: `/v1/pages/${pageId}`,
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
                    'Notion-Version': process.env.NOTION_VERSION || '2022-06-28'
                  }
                };
                const r = https.request(options, (resp) => {
                  let body = '';
                  resp.on('data', (chunk) => (body += chunk));
                  resp.on('end', () => {
                    try { resolve(JSON.parse(body || '{}')); } catch (err) { reject(err); }
                  });
                });
                r.on('error', (err) => reject(err));
                r.end();
              });
            } catch (e) {
              pageObj = null;
            }
          }

          const dbId = (pageObj && pageObj.parent && pageObj.parent.database_id) || process.env.NOTION_FINANCE_DB;
          if (!dbId) throw new Error('Unable to determine Notion database id for page');

          // Retrieve DB schema
          let dbInfo = null;
          try {
            if (notionClient && notionClient.databases && typeof notionClient.databases.retrieve === 'function') {
              dbInfo = await notionClient.databases.retrieve({ database_id: dbId });
            }
          } catch (e) { dbInfo = null; }
          if (!dbInfo) {
            try {
              dbInfo = await new Promise((resolve, reject) => {
                const options = {
                  hostname: 'api.notion.com',
                  path: `/v1/databases/${dbId}`,
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
                    'Notion-Version': process.env.NOTION_VERSION || '2022-06-28'
                  }
                };
                const r = https.request(options, (resp) => {
                  let body = '';
                  resp.on('data', (chunk) => (body += chunk));
                  resp.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch (err) { reject(err); } });
                });
                r.on('error', (err) => reject(err));
                r.end();
              });
            } catch (e) { dbInfo = null; }
          }

          // Map candidate to Notion properties using heuristics from updateNotionPageById
          const buildMapping = (props) => {
            const out = {};
            Object.entries(props).forEach(([propName, propDef]) => {
              const lname = propName.toLowerCase();
              let keyMatch = null;
              if (/^transaction$|title|name|txn|transaction/i.test(lname) || lname.includes('transaction') || lname.includes('title') || lname.includes('name')) keyMatch = 'name';
              else if (lname.includes('date')) keyMatch = 'date';
              else if (/rupee|amount|price|money|total|rupees|amounts|value/.test(lname)) keyMatch = 'rupees';
              else if (/currency|curr|ccy/.test(lname)) keyMatch = 'currency';
              else if (/type|category|kind/.test(lname)) keyMatch = 'type';
              else if (/desc|description|note|details/.test(lname)) keyMatch = 'description';

              let val = undefined;
              if (keyMatch === 'name') val = candidate.name;
              else if (keyMatch === 'date') val = candidate.date;
              else if (keyMatch === 'rupees') val = candidate.rupees;
              else if (keyMatch === 'currency') val = candidate.currency;
              else if (keyMatch === 'type') val = candidate.type;
              else if (keyMatch === 'description') val = candidate.description || candidate.name;

              if (typeof val === 'undefined' || val === null) return;

              switch (propDef.type) {
                case 'title': out[propName] = { title: [{ text: { content: String(val) } }] }; break;
                case 'date': out[propName] = { date: { start: String(val) } }; break;
                case 'number': out[propName] = { number: Number(val) }; break;
                case 'select': out[propName] = { select: { name: String(val) } }; break;
                case 'multi_select': out[propName] = { multi_select: Array.isArray(val) ? val.map(v => ({ name: String(v) })) : [{ name: String(val) }] }; break;
                case 'rich_text':
                case 'text': out[propName] = { rich_text: [{ text: { content: String(val) } }] }; break;
                default: out[propName] = { rich_text: [{ text: { content: String(val) } }] };
              }
            });
            return out;
          };

          let mappedProps = {};
          if (dbInfo && dbInfo.properties) mappedProps = buildMapping(dbInfo.properties);

          // Conservative fallback if nothing mapped
          if (!Object.keys(mappedProps).length) {
            const fallback = {};
            if (candidate.name) fallback.Transaction = { title: [{ text: { content: String(candidate.name) } }] };
            if (candidate.date) fallback.day = { date: { start: String(candidate.date) } };
            if (typeof candidate.rupees !== 'undefined') fallback.rupees = { number: Number(candidate.rupees) };
            if (candidate.currency) fallback.currency = { select: { name: String(candidate.currency) } };
            if (candidate.description) fallback.description = { rich_text: [{ text: { content: String(candidate.description) } }] };
            if (candidate.type) fallback.Type = { select: { name: String(candidate.type) } };
            mappedProps = fallback;
          }

          // Attempt Notion update and retry once if Notion complains about properties
          try {
            notionResp = await notionUpdatePage(pageId, mappedProps);
          } catch (err) {
            const msg = err && err.message ? err.message : String(err);
            console.warn('Initial Notion update failed in updateRecord:', msg);
            if (/not a property that exists|property .* does not exist|invalid property/i.test(msg.toLowerCase())) {
              // try refresh schema and remap
              try {
                if (notionClient && notionClient.databases && typeof notionClient.databases.retrieve === 'function') {
                  dbInfo = await notionClient.databases.retrieve({ database_id: dbId });
                }
              } catch (e) { dbInfo = dbInfo || null; }

              if (!dbInfo || !dbInfo.properties) {
                try {
                  dbInfo = await new Promise((resolve, reject) => {
                    const options = {
                      hostname: 'api.notion.com',
                      path: `/v1/databases/${dbId}`,
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
                        'Notion-Version': process.env.NOTION_VERSION || '2022-06-28'
                      }
                    };
                    const r = https.request(options, (resp) => {
                      let body = '';
                      resp.on('data', (chunk) => (body += chunk));
                      resp.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch (err) { reject(err); } });
                    });
                    r.on('error', (err) => reject(err));
                    r.end();
                  });
                } catch (e) { dbInfo = dbInfo || null; }
              }

              if (dbInfo && dbInfo.properties) {
                const retryMapped = buildMapping(dbInfo.properties);
                if (Object.keys(retryMapped).length) {
                  try {
                    notionResp = await notionUpdatePage(pageId, retryMapped);
                  } catch (err2) {
                    console.warn('Retry Notion update in updateRecord also failed:', err2 && err2.message ? err2.message : String(err2));
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('Notion update failed in updateRecord:', e && e.message ? e.message : String(e));
      }

      return res.json({ ok: true, data: updated, notion: notionResp || null });
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

    // If there's a linked Notion page, attempt to archive it
    let notionResp = null;
    if (record.notionPageId) {
      try {
        notionResp = await notionDeletePage(record.notionPageId);
        console.log('Notion page archived for', record.notionPageId);
      } catch (e) {
        // Log and continue to attempt Mongo deletion
        console.warn('Failed to delete/archive Notion page:', e && e.message ? e.message : String(e));
        notionResp = { ok: false, error: e && e.message ? e.message : String(e) };
      }
    }

    // Delete Mongo record
    const removed = await Finance.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ ok: false, error: 'Record not found after delete attempt' });

    return res.json({ ok: true, data: removed, notion: notionResp || null });
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

// --- Notion helpers: query the finance DB and create pages directly ---
async function queryNotion(req, res) {
  try {
    const dbId = req.query.dbId || process.env.NOTION_FINANCE_DB;
    if (!dbId) return res.status(500).json({ ok: false, error: 'NOTION_FINANCE_DB not set' });

    const raw = await notionQueryDatabase(dbId);
    // `raw` may already be an array or an object with `results`
    const pages = Array.isArray(raw) ? raw : (raw && raw.results ? raw.results : []);

    // Helper to extract readable value from a Notion property
    const extractPlainText = (prop) => {
      if (!prop) return '';
      if (prop.type === 'title' && Array.isArray(prop.title)) return prop.title.map(t => t.plain_text || '').join('');
      if ((prop.type === 'rich_text' || prop.type === 'text') && Array.isArray(prop.rich_text || prop.text)) {
        const arr = prop.rich_text || prop.text;
        return arr.map(t => t.plain_text || (t.text && t.text.content) || '').join('');
      }
      return '';
    };

    const mapped = pages.map(p => {
      const props = p.properties || {};
      // Find title property (type === 'title')
      const titlePropKey = Object.keys(props).find(k => props[k] && props[k].type === 'title') || Object.keys(props).find(k => /name|title/i.test(k));
      const datePropKey = Object.keys(props).find(k => props[k] && props[k].type === 'date') || Object.keys(props).find(k => /date/i.test(k));
      const numberPropKey = Object.keys(props).find(k => props[k] && props[k].type === 'number') || Object.keys(props).find(k => /rupee|amount|money|price/i.test(k));
      const selectTypeKey = Object.keys(props).find(k => props[k] && props[k].type === 'select' && /type|category/i.test(k)) || Object.keys(props).find(k => props[k] && props[k].type === 'select');
      const currencyKey = Object.keys(props).find(k => props[k] && props[k].type === 'select' && /currency|curr/i.test(k));
      const descKey = Object.keys(props).find(k => props[k] && (props[k].type === 'rich_text' || props[k].type === 'text')) || Object.keys(props).find(k => /desc|description|note/i.test(k));

      const name = titlePropKey ? extractPlainText(props[titlePropKey]) : '';
      const date = datePropKey && props[datePropKey] && props[datePropKey].date ? props[datePropKey].date.start : null;
      const rupees = numberPropKey && props[numberPropKey] && typeof props[numberPropKey].number !== 'undefined' ? props[numberPropKey].number : null;
      const typeVal = selectTypeKey && props[selectTypeKey] && props[selectTypeKey].select ? props[selectTypeKey].select.name : null;
      const currencyVal = currencyKey && props[currencyKey] && props[currencyKey].select ? props[currencyKey].select.name : null;
      const description = descKey ? extractPlainText(props[descKey]) : '';

      return {
        id: p.id,
        name: name || null,
        date: date || null,
        type: typeVal || null,
        rupees: rupees,
        currency: currencyVal || null,
        description: description || null,
        url: p.url || null,
        public_url: p.public_url || null,
        created_time: p.created_time || null,
        last_edited_time: p.last_edited_time || null
      };
    });

    return res.json({ ok: true, data: mapped });
  } catch (err) {
    console.error('Notion query error', err);
    return res.status(500).json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}

// Compute totals (income/expense/net) from Notion finance DB
async function notionTotals(req, res) {
  try {
    const dbId = req.query.dbId || process.env.NOTION_FINANCE_DB;
    if (!dbId) return res.status(500).json({ ok: false, error: 'NOTION_FINANCE_DB not set' });

    const raw = await notionQueryDatabase(dbId);
    const pages = Array.isArray(raw) ? raw : (raw && raw.results ? raw.results : []);

    const extractPlainText = (prop) => {
      if (!prop) return '';
      if (prop.type === 'title' && Array.isArray(prop.title)) return prop.title.map(t => t.plain_text || '').join('');
      if ((prop.type === 'rich_text' || prop.type === 'text') && Array.isArray(prop.rich_text || prop.text)) {
        const arr = prop.rich_text || prop.text;
        return arr.map(t => t.plain_text || (t.text && t.text.content) || '').join('');
      }
      return '';
    };

    const mapped = pages.map(p => {
      const props = p.properties || {};
      const titlePropKey = Object.keys(props).find(k => props[k] && props[k].type === 'title') || Object.keys(props).find(k => /name|title/i.test(k));
      const datePropKey = Object.keys(props).find(k => props[k] && props[k].type === 'date') || Object.keys(props).find(k => /date/i.test(k));
      const numberPropKey = Object.keys(props).find(k => props[k] && props[k].type === 'number') || Object.keys(props).find(k => /rupee|amount|money|price/i.test(k));
      const selectTypeKey = Object.keys(props).find(k => props[k] && props[k].type === 'select' && /type|category/i.test(k)) || Object.keys(props).find(k => props[k] && props[k].type === 'select');

      const name = titlePropKey ? extractPlainText(props[titlePropKey]) : '';
      const date = datePropKey && props[datePropKey] && props[datePropKey].date ? props[datePropKey].date.start : null;
      const rupees = numberPropKey && props[numberPropKey] && typeof props[numberPropKey].number !== 'undefined' ? props[numberPropKey].number : 0;
      const typeVal = selectTypeKey && props[selectTypeKey] && props[selectTypeKey].select ? props[selectTypeKey].select.name : null;

      return { id: p.id, name: name || null, date: date || null, type: typeVal || null, rupees: rupees };
    });

    let totalIncome = 0;
    let totalExpense = 0;

    mapped.forEach(m => {
      const amt = Number(m.rupees) || 0;
      const t = (m.type || '').toString().toLowerCase();
      if (!t) {
        // no type -> treat as expense by default
        totalExpense += amt;
      } else if (t.includes('gain') || t.includes('income') || t.includes('credit') || t.includes('deposit')) {
        totalIncome += amt;
      } else {
        // treat everything else (expense, asset buy, etc.) as expense
        totalExpense += amt;
      }
    });

    const netBalance = totalIncome - totalExpense;
    return res.json({ ok: true, data: { totalIncome, totalExpense, netBalance, count: mapped.length } });
  } catch (err) {
    console.error('notionTotals error', err);
    return res.status(500).json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}


// Helper: query a Notion database with SDK or HTTPS fallback
async function notionQueryDatabase(dbId) {
  // Use a local require to ensure the client is available at call time
  const notionClient = require('../notionClient');
  if (notionClient && notionClient.databases && typeof notionClient.databases.query === 'function') {
    const res = await notionClient.databases.query({ database_id: dbId });
    return res.results || res;
  }

  const postData = JSON.stringify({});
  return await new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: `/v1/databases/${dbId}/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': process.env.NOTION_VERSION || '2022-06-28',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const r = https.request(options, (resp) => {
      let body = '';
      resp.on('data', (chunk) => (body += chunk));
      resp.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          resolve(parsed.results || parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    r.on('error', (e) => reject(e));
    r.write(postData);
    r.end();
  });
}

// Helper: create a Notion page in a database (SDK or HTTPS fallback)
async function notionCreatePage(databaseId, properties) {
  const notionClient = require('../notionClient');
  if (notionClient && notionClient.pages && typeof notionClient.pages.create === 'function') {
    return await notionClient.pages.create({ parent: { database_id: databaseId }, properties });
  }

  const postData = JSON.stringify({ parent: { database_id: databaseId }, properties });
  return await new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: `/v1/pages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': process.env.NOTION_VERSION || '2022-06-28',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const r = https.request(options, (resp) => {
      let body = '';
      resp.on('data', (chunk) => (body += chunk));
      resp.on('end', () => {
        try {
          resolve(JSON.parse(body || '{}'));
        } catch (e) {
          reject(e);
        }
      });
    });

    r.on('error', (e) => reject(e));
    r.write(postData);
    r.end();
  });
}

async function createNotionPage(req, res) {
  try {
    const dbId = req.query.dbId || process.env.NOTION_FINANCE_DB;
    if (!dbId) return res.status(500).json({ ok: false, error: 'NOTION_FINANCE_DB not set' });
    // Allow per-request override; by default enable Notion unless NOTION_SYNC='0'
    const reqForcesNotion = (req && req.query && (req.query.notion === '1' || req.query.notion === 'true')) ||
      (req && req.body && (req.body.syncToNotion === true || req.body.syncToNotion === '1' || req.body.syncToNotion === 'true'));
    const envAllowsNotion = process.env.NOTION_SYNC !== '0';
    const doNotionSync = envAllowsNotion || reqForcesNotion;
    if (!doNotionSync) return res.status(200).json({ ok: true, notion: { skipped: true, reason: 'NOTION_SYNC=0' } });

    // If caller provided explicit Notion `properties`, try to derive simple fields
    let candidate = null;
    if (req.body.properties && Object.keys(req.body.properties).length) {
      const props = req.body.properties;
      // extract common fields
      const titleKey = Object.keys(props).find(k => props[k] && props[k].type === 'title') || Object.keys(props).find(k => /name|title/i.test(k));
      const dateKey = Object.keys(props).find(k => props[k] && props[k].type === 'date') || Object.keys(props).find(k => /date/i.test(k));
      const numberKey = Object.keys(props).find(k => props[k] && props[k].type === 'number') || Object.keys(props).find(k => /rupee|amount|money|price/i.test(k));
      const selectTypeKey = Object.keys(props).find(k => props[k] && props[k].type === 'select' && /type|category/i.test(k)) || Object.keys(props).find(k => props[k] && props[k].type === 'select');
      const currencyKey = Object.keys(props).find(k => props[k] && props[k].type === 'select' && /currency|curr/i.test(k));
      const descKey = Object.keys(props).find(k => props[k] && (props[k].type === 'rich_text' || props[k].type === 'text')) || Object.keys(props).find(k => /desc|description|note/i.test(k));

      const extractText = (p) => {
        if (!p) return null;
        if (p.type === 'title' && Array.isArray(p.title)) return p.title.map(t => t.plain_text || (t.text && t.text.content) || '').join('');
        if ((p.type === 'rich_text' || p.type === 'text') && Array.isArray(p.rich_text || p.text)) {
          const arr = p.rich_text || p.text;
          return arr.map(t => t.plain_text || (t.text && t.text.content) || '').join('');
        }
        if (p.type === 'select' && p.select) return p.select.name;
        if (p.type === 'number') return p.number;
        if (p.type === 'date' && p.date) return p.date.start;
        return null;
      };

      candidate = {
        name: titleKey ? extractText(props[titleKey]) : (req.body.name || null),
        date: dateKey ? extractText(props[dateKey]) : (req.body.day || (new Date()).toISOString().split('T')[0]),
        rupees: numberKey ? Number(extractText(props[numberKey])) : (typeof req.body.rupees !== 'undefined' ? Number(req.body.rupees) : null),
        currency: currencyKey ? extractText(props[currencyKey]) : (req.body.currency || null),
        description: descKey ? extractText(props[descKey]) : (req.body.description || null),
        type: selectTypeKey ? extractText(props[selectTypeKey]) : (req.body.type || null)
      };
    } else {
      // Otherwise, accept a simple payload and map to DB properties.
      const { name, type, rupees, currency, description, day } = req.body || {};
      candidate = {
        name: name || null,
        date: day || (new Date()).toISOString().split('T')[0],
        rupees: typeof rupees !== 'undefined' ? Number(rupees) : null,
        currency: currency || null,
        description: description || null,
        type: type || null
      };
    }

    // Retrieve DB schema to map property names safely
    const notionClient = require('../notionClient');
    let dbInfo = null;
    try {
      if (notionClient && notionClient.databases && typeof notionClient.databases.retrieve === 'function') {
        dbInfo = await notionClient.databases.retrieve({ database_id: dbId });
      }
    } catch (e) {
      dbInfo = null;
    }

    // Create a MongoDB Finance record for this Notion page (use candidate values)
    const mongoDoc = {
      name: candidate.name || `Finance ${Date.now()}`,
      day: candidate.date ? new Date(candidate.date) : new Date(),
      type: candidate.type || 'expense',
      rupees: typeof candidate.rupees === 'number' && !isNaN(candidate.rupees) ? candidate.rupees : 0,
      currency: candidate.currency || 'INR',
      description: candidate.description || ''
    };
    let createdRecord = null;
    try {
      createdRecord = await Finance.create(mongoDoc);
    } catch (e) {
      // If Mongo create fails, log and continue — we still attempt Notion create
      console.warn('Failed to create Mongo record for Notion page:', e && e.message ? e.message : e);
    }

    // Build mapped properties according to DB schema when available
    let mappedProps = {};
    if (dbInfo && dbInfo.properties) {
      const props = dbInfo.properties;
      Object.entries(props).forEach(([propName, propDef]) => {
        const lname = propName.toLowerCase();
        // decide which candidate key to use
        let val = null;
        if (propDef.type === 'title') val = candidate.name;
        else if (propDef.type === 'date') val = candidate.date;
        else if (propDef.type === 'number') val = candidate.rupees;
        else if (propDef.type === 'select') {
          // prefer currency/selects based on name
          if (/currency|curr/i.test(lname)) val = candidate.currency;
          else if (/type|category/i.test(lname)) val = candidate.type;
          else val = candidate.type || candidate.currency;
        }
        else if (propDef.type === 'rich_text' || propDef.type === 'text') val = candidate.description || candidate.name;

        if (val === null || typeof val === 'undefined') return;

        switch (propDef.type) {
          case 'title':
            mappedProps[propName] = { title: [{ text: { content: String(val) } }] };
            break;
          case 'date':
            mappedProps[propName] = { date: { start: String(val) } };
            break;
          case 'number':
            mappedProps[propName] = { number: Number(val) };
            break;
          case 'select':
            mappedProps[propName] = { select: { name: String(val) } };
            break;
          case 'rich_text':
          case 'text':
            mappedProps[propName] = { rich_text: [{ text: { content: String(val) } }] };
            break;
          default:
            mappedProps[propName] = { rich_text: [{ text: { content: String(val) } }] };
        }
      });
    }

    // If mapping produced nothing, attempt a conservative fallback using common property names
    if (!Object.keys(mappedProps).length) {
      const fallback = {
        Name: { title: [{ text: { content: candidate.name || '' } }] },
        Date: { date: { start: candidate.date } },
        Rupees: { number: candidate.rupees },
        Currency: { select: { name: candidate.currency || 'INR' } },
        Description: { rich_text: [{ text: { content: candidate.description || '' } }] },
        Type: { select: { name: candidate.type || 'Expense' } }
      };
      mappedProps = fallback;
    }

    const created = await notionCreatePage(dbId, mappedProps);
    // Determine returned Notion page id (SDK and REST formats)
    const notionId = created && (created.id || created.page_id || (created.page && created.page.id));

    try {
      if (notionId) {
        if (createdRecord && createdRecord._id) {
          // persist notionPageId on the created mongo record and return the updated mongo doc
          const saved = await Finance.findByIdAndUpdate(createdRecord._id, { notionPageId: notionId }, { new: true });
          createdRecord = saved || createdRecord;
        } else {
          // If mongo record wasn't created earlier, create one now with notionPageId
          try {
            const doc = Object.assign({}, mongoDoc, { notionPageId: notionId });
            const saved = await Finance.create(doc);
            createdRecord = saved;
          } catch (e) {
            console.warn('Failed to create Mongo record with notionPageId:', e && e.message ? e.message : e);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to persist notionPageId to Mongo record:', e && e.message ? e.message : e);
    }

    return res.status(201).json({ ok: true, notion: created, mongo: createdRecord || null });
  } catch (err) {
    console.error('Notion create page error', err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
}

// Helper: update an existing Notion page (SDK or HTTPS fallback)
async function notionUpdatePage(pageId, properties) {
  const notionClient = require('../notionClient');
  if (notionClient && notionClient.pages && typeof notionClient.pages.update === 'function') {
    return await notionClient.pages.update({ page_id: pageId, properties });
  }

  const postData = JSON.stringify({ properties });
  return await new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: `/v1/pages/${pageId}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': process.env.NOTION_VERSION || '2022-06-28',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const r = https.request(options, (resp) => {
      let body = '';
      resp.on('data', (chunk) => (body += chunk));
      resp.on('end', () => {
        try {
          resolve(JSON.parse(body || '{}'));
        } catch (e) {
          reject(e);
        }
      });
    });

    r.on('error', (e) => reject(e));
    r.write(postData);
    r.end();
  });
}

// Helper: delete (archive) a Notion page by id (SDK or HTTPS fallback)
async function notionDeletePage(pageId) {
  const notionClient = require('../notionClient');
  if (notionClient && notionClient.pages && typeof notionClient.pages.update === 'function') {
    return await notionClient.pages.update({ page_id: pageId, archived: true });
  }

  const postData = JSON.stringify({ archived: true });
  return await new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: `/v1/pages/${pageId}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': process.env.NOTION_VERSION || '2022-06-28',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const r = https.request(options, (resp) => {
      let body = '';
      resp.on('data', (chunk) => (body += chunk));
      resp.on('end', () => {
        try {
          resolve(JSON.parse(body || '{}'));
        } catch (e) {
          reject(e);
        }
      });
    });

    r.on('error', (e) => reject(e));
    r.write(postData);
    r.end();
  });
}

// Debug: return shape of notion client (only when NOTION_DEBUG=1)
// async function notionClientInfo(req, res) {
//   if (process.env.NOTION_DEBUG !== '1') return res.status(403).json({ ok: false, error: 'Debug disabled' });
//   try {
//     const info = {
//       keys: Object.keys(notionClient || {}),
//       hasDatabases: !!(notionClient && notionClient.databases),
//       databasesKeys: notionClient && notionClient.databases ? Object.keys(notionClient.databases) : [],
//       hasPages: !!(notionClient && notionClient.pages),
//       pagesKeys: notionClient && notionClient.pages ? Object.keys(notionClient.pages) : [],
//       hasRequest: typeof notionClient.request === 'function'
//     };
//     return res.json({ ok: true, data: info });
//   } catch (err) {
//     return res.status(500).json({ ok: false, error: err && err.message ? err.message : String(err) });
//   }
// }



// Controller: update Notion page by pageId and sync Mongo record
async function updateNotionPageById(req, res) {
  try {
    const pageId = req.params.pageId || req.params.id || req.params.page_id;
    if (!pageId) return res.status(400).json({ ok: false, error: 'pageId required' });

    // Accept common fields from body
    const { name, day, rupees, currency, description, type } = req.body || {};

    // Determine database id by fetching the page (SDK or HTTP fallback)
    const notionClient = require('../notionClient');
    let pageObj = null;
    try {
      if (notionClient && notionClient.pages && typeof notionClient.pages.retrieve === 'function') {
        pageObj = await notionClient.pages.retrieve({ page_id: pageId });
      }
    } catch (e) {
      pageObj = null;
    }

    if (!pageObj) {
      // HTTPS fallback to GET /v1/pages/:pageId
      try {
        pageObj = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'api.notion.com',
            path: `/v1/pages/${pageId}`,
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
              'Notion-Version': process.env.NOTION_VERSION || '2022-06-28'
            }
          };
          const r = https.request(options, (resp) => {
            let body = '';
            resp.on('data', (chunk) => (body += chunk));
            resp.on('end', () => {
              try { resolve(JSON.parse(body || '{}')); } catch (err) { reject(err); }
            });
          });
          r.on('error', (err) => reject(err));
          r.end();
        });
      } catch (e) {
        pageObj = null;
      }
    }

    const dbId = (pageObj && pageObj.parent && pageObj.parent.database_id) || process.env.NOTION_FINANCE_DB;
    if (!dbId) return res.status(500).json({ ok: false, error: 'Unable to determine Notion database id for page' });

    // Retrieve DB schema to map property names
    let dbInfo = null;
    try {
      if (notionClient && notionClient.databases && typeof notionClient.databases.retrieve === 'function') {
        dbInfo = await notionClient.databases.retrieve({ database_id: dbId });
      }
    } catch (e) {
      dbInfo = null;
    }

    if (!dbInfo) {
      try {
        dbInfo = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'api.notion.com',
            path: `/v1/databases/${dbId}`,
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
              'Notion-Version': process.env.NOTION_VERSION || '2022-06-28'
            }
          };
          const r = https.request(options, (resp) => {
            let body = '';
            resp.on('data', (chunk) => (body += chunk));
            resp.on('end', () => {
              try { resolve(JSON.parse(body || '{}')); } catch (err) { reject(err); }
            });
          });
          r.on('error', (err) => reject(err));
          r.end();
        });
      } catch (e) {
        dbInfo = null;
      }
    }

    // Build candidate object
    const candidate = {
      name: typeof name !== 'undefined' ? name : undefined,
      date: typeof day !== 'undefined' ? (new Date(day)).toISOString().split('T')[0] : undefined,
      rupees: typeof rupees !== 'undefined' ? rupees : undefined,
      currency: typeof currency !== 'undefined' ? currency : undefined,
      description: typeof description !== 'undefined' ? description : undefined,
      type: typeof type !== 'undefined' ? type : undefined
    };

    // Map candidate to DB properties using heuristics that match the DB property names.
    let mappedProps = {};
    const buildMapping = (props) => {
      const out = {};
      Object.entries(props).forEach(([propName, propDef]) => {
        const lname = propName.toLowerCase();
        // Heuristic matches based on property name
        let keyMatch = null;
        if (/^transaction$|title|name|txn|transaction/i.test(lname) || lname.includes('transaction') || lname.includes('title') || lname.includes('name')) keyMatch = 'name';
        else if (lname.includes('date')) keyMatch = 'date';
        else if (/rupee|amount|price|money|total|rupees|amounts|value/.test(lname)) keyMatch = 'rupees';
        else if (/currency|curr|ccy/.test(lname)) keyMatch = 'currency';
        else if (/type|category|kind/.test(lname)) keyMatch = 'type';
        else if (/desc|description|note|details/.test(lname)) keyMatch = 'description';

        let val = undefined;
        if (keyMatch === 'name') val = candidate.name;
        else if (keyMatch === 'date') val = candidate.date;
        else if (keyMatch === 'rupees') val = candidate.rupees;
        else if (keyMatch === 'currency') val = candidate.currency;
        else if (keyMatch === 'type') val = candidate.type;
        else if (keyMatch === 'description') val = candidate.description || candidate.name;

        if (typeof val === 'undefined' || val === null) return;

        // Build payload based on property type
        switch (propDef.type) {
          case 'title': out[propName] = { title: [{ text: { content: String(val) } }] }; break;
          case 'date': out[propName] = { date: { start: String(val) } }; break;
          case 'number': out[propName] = { number: Number(val) }; break;
          case 'select': out[propName] = { select: { name: String(val) } }; break;
          case 'multi_select': out[propName] = { multi_select: Array.isArray(val) ? val.map(v => ({ name: String(v) })) : [{ name: String(val) }] }; break;
          case 'rich_text':
          case 'text': out[propName] = { rich_text: [{ text: { content: String(val) } }] }; break;
          default: out[propName] = { rich_text: [{ text: { content: String(val) } }] };
        }
      });
      return out;
    };

    if (dbInfo && dbInfo.properties) {
      mappedProps = buildMapping(dbInfo.properties);
    }


    // Conservative fallback if mapping produced nothing (use common names but only as last resort)
    if (!Object.keys(mappedProps).length) {
      const fallback = {};
      if (candidate.name) fallback.Transaction = { title: [{ text: { content: String(candidate.name) } }] };
      if (candidate.date) fallback.day = { date: { start: String(candidate.date) } };
      if (typeof candidate.rupees !== 'undefined') fallback.rupees = { number: Number(candidate.rupees) };
      if (candidate.currency) fallback.currency = { select: { name: String(candidate.currency) } };
      if (candidate.description) fallback.description = { rich_text: [{ text: { content: String(candidate.description) } }] };
      if (candidate.type) fallback.Type = { select: { name: String(candidate.type) } };
      mappedProps = fallback;
    }

    // Attempt Notion update and retry once if Notion reports missing properties
    let notionResp = null;
    try {
      notionResp = await notionUpdatePage(pageId, mappedProps);
    } catch (err) {
      // If Notion error mentions missing properties, fetch DB schema and remap using exact property keys then retry
      const msg = err && err.message ? err.message : String(err);
      console.warn('Initial Notion update failed:', msg);
      console.warn('Attempted Notion properties:', JSON.stringify(mappedProps, null, 2));
      try {
        if (dbInfo && dbInfo.properties) {
          console.warn('Known DB properties (name -> type):');
          Object.entries(dbInfo.properties).forEach(([k, v]) => console.warn(`  ${k} -> ${v.type}`));
        } else {
          console.warn('DB properties not available locally before retry');
        }
      } catch (logErr) {
        console.warn('Failed to log DB properties:', logErr && logErr.message ? logErr.message : logErr);
      }
      if (/not a property that exists|property .* does not exist|invalid property/i.test(msg.toLowerCase())) {
        try {
          // refresh dbInfo via SDK
          if (notionClient && notionClient.databases && typeof notionClient.databases.retrieve === 'function') {
            dbInfo = await notionClient.databases.retrieve({ database_id: dbId });
          }
        } catch (e) {
          dbInfo = dbInfo || null;
        }

        // If SDK didn't return schema, try HTTPS GET fallback
        if (!dbInfo || !dbInfo.properties) {
          try {
            dbInfo = await new Promise((resolve, reject) => {
              const options = {
                hostname: 'api.notion.com',
                path: `/v1/databases/${dbId}`,
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
                  'Notion-Version': process.env.NOTION_VERSION || '2022-06-28'
                }
              };
              const r = https.request(options, (resp) => {
                let body = '';
                resp.on('data', (chunk) => (body += chunk));
                resp.on('end', () => {
                  try { resolve(JSON.parse(body || '{}')); } catch (err) { reject(err); }
                });
              });
              r.on('error', (err) => reject(err));
              r.end();
            });
          } catch (e) {
            dbInfo = dbInfo || null;
          }
        }

        if (dbInfo && dbInfo.properties) {
          const retryMapped = buildMapping(dbInfo.properties);
          // only retry if we can produce at least one property that differs from previous attempt
          const retryKeys = Object.keys(retryMapped || {});
          if (retryKeys.length) {
            try {
              notionResp = await notionUpdatePage(pageId, retryMapped);
            } catch (err2) {
              console.warn('Retry Notion update also failed:', err2 && err2.message ? err2.message : String(err2));
              return res.status(500).json({ ok: false, error: 'Notion update failed (retry)', detail: err2 && err2.message ? err2.message : String(err2) });
            }
          } else {
            return res.status(500).json({ ok: false, error: 'Notion update failed and could not remap properties' });
          }
        } else {
          return res.status(500).json({ ok: false, error: 'Notion update failed and DB schema unavailable', detail: msg });
        }
      } else {
        return res.status(500).json({ ok: false, error: 'Notion update failed', detail: msg });
      }
    }

    // Update Mongo record if exists (match by notionPageId)
    let mongo = null;
    try {
      const mongoUpdates = {};
      if (typeof candidate.name !== 'undefined') mongoUpdates.name = candidate.name;
      if (typeof candidate.date !== 'undefined') mongoUpdates.day = new Date(candidate.date);
      if (typeof candidate.rupees !== 'undefined') mongoUpdates.rupees = Number(candidate.rupees);
      if (typeof candidate.currency !== 'undefined') mongoUpdates.currency = candidate.currency;
      if (typeof candidate.description !== 'undefined') mongoUpdates.description = candidate.description;
      if (typeof candidate.type !== 'undefined') mongoUpdates.type = candidate.type;

      if (Object.keys(mongoUpdates).length) {
        mongo = await Finance.findOneAndUpdate({ notionPageId: pageId }, mongoUpdates, { new: true, runValidators: true });
      }
    } catch (e) {
      // Non-fatal
      console.warn('Failed to update Mongo record for notion page:', e && e.message ? e.message : e);
    }

    return res.json({ ok: true, notion: notionResp, mongo: mongo || null });
  } catch (err) {
    console.error('updateNotionPageById error', err);
    return res.status(500).json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}


module.exports = {
  createRecord,
  listRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  totalsForRange,
  // Notion endpoints
  queryNotion,
  createNotionPage,
  // Update an existing Notion page and sync to Mongo record
  updateNotionPageById,
  notionTotals,
  // notionClientInfo
};