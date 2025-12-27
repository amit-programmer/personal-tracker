const { Client } = require('@notionhq/client');
require('dotenv').config();

// Export a configured Notion client or null when no API key present
const notion = process.env.NOTION_API_KEY ? new Client({ auth: process.env.NOTION_API_KEY }) : null;

module.exports = notion;
