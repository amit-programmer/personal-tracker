const { Client } = require('@notionhq/client');
require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });
(async ()=> {
  try {
    const db = await notion.databases.retrieve({ database_id: process.env.NOTION_FOOD_DB });
    console.log('DB OK:', db.id);
  } catch (err) {
    // Print detailed error info to help debugging (status/code/body)
    try {
      console.error('Notion error message:', err && err.message ? err.message : err);
      if (err.status) console.error('Status:', err.status);
      if (err.code) console.error('Code:', err.code);
      if (err.body) console.error('Body:', JSON.stringify(err.body, null, 2));
    } catch (e) {
      console.error('Error while printing Notion error:', e);
    }
  }
})();