require('dotenv').config();
const app = require("./src/app");
const { connectDB } = require("./src/db/db");
// const notion = require('./src/notionClient');
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });


// Log the Mongo URI for debugging (do NOT commit sensitive credentials)
console.log('MONGODB_URI (raw)=', process.env.MONGODB_URI);

// (async () => {
//     try {
//         await connectDB();
//         // Validate Notion configuration (if present) so errors are clearer at startup
//         async function validateNotion() {
//             const apiKey = process.env.NOTION_API_KEY;
//             const financeDb = process.env.NOTION_FINANCE_DB;
//             if (!apiKey) {
//                 console.warn('NOTION_API_KEY not set — Notion sync disabled');
//                 return;
//             }
//             if (!financeDb) {
//                 console.warn('NOTION_Finance_DB not set — Notion sync disabled');
//                 return;
//             }
//             try {
//                 // Try to retrieve the database to ensure the token has access
//                 await notion.databases.retrieve({ database_id: financeDb });
//                 console.log('Notion database validated:', financeDb);
//             } catch (err) {
//                 console.warn('Notion database validation failed for ID', financeDb, '-', err && err.message ? err.message : err);
//                 console.warn('Make sure the database exists and is shared with your integration: Open the database in Notion → Share → Invite your integration.');
//             }
//         }

//         // Run validation but don't stop server on failure — we only give guidance
//         await validateNotion();
//         app.listen(3000, () => {
//             console.log("Server is running on port 3000");
//         });
//     } catch (err) {
//         console.error('Failed to start server due to DB connection error:', err && err.message ? err.message : err);

//     }
// })();


// Start server: connect DB, validate Notion DB (if configured), then listen
(async () => {
  try {
    await connectDB();

    // Validate Notion configuration (if present) so errors are clearer at startup
    async function validateNotion() {
      const apiKey = process.env.NOTION_API_KEY;
      if (!apiKey) {
        console.warn('NOTION_API_KEY not set — Notion sync disabled');
        return;
      }

      // Validate multiple Notion DB ids (finance, food, etc.) if configured
      const checks = [
        { env: 'NOTION_FINANCE_DB', id: process.env.NOTION_FINANCE_DB, label: 'finance' },
        { env: 'NOTION_FOOD_DB', id: process.env.NOTION_FOOD_DB, label: 'food' }
      ];

      for (const c of checks) {
        if (!c.id) {
          console.warn(`${c.env} not set — skipping Notion validation for ${c.label} DB`);
          continue;
        }
        try {
          await notion.databases.retrieve({ database_id: c.id });
          console.log(`Notion ${c.label} database validated:`, c.id);
        } catch (err) {
          console.warn(`Notion ${c.label} database validation failed for ID`, c.id, '-', err && err.message ? err.message : err);
          console.warn('Make sure the database exists and is shared with your integration: Open the database in Notion → Share → Invite your integration.');
        }
      }
    }

    // Run validation but don't stop server on failure — only give guidance
    await validateNotion();

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server due to DB connection error:', err && err.message ? err.message : err);
  }
})();