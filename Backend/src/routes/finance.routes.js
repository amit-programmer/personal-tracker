const express = require('express');
const controller = require('../controllers/finance.controller');
const financeMiddleware = require('../middlewares/finance.validator');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Require auth for all finance routes (token in cookie or Authorization header)
router.use(authMiddleware);

// Create new finance record
router.post('/', financeMiddleware.createRules, controller.createRecord);

// Get list (supports ?start=YYYY-MM-DD&end=YYYY-MM-DD)
router.get('/', controller.listRecords);

// Get totals for a range (same query params as list)
router.get('/totals', controller.totalsForRange);

// Query Notion finance database directly
// Notion totals (income/expense/net)
router.get('/notion/totals', controller.notionTotals);
// Query Notion finance database directly
router.get('/notion', controller.queryNotion);
// Create a page in the Notion finance database. Expect `properties` in body.
router.post('/notion', controller.createNotionPage);
// Update an existing Notion page by page id and sync to Mongo
router.patch('/notion/:pageId', controller.updateNotionPageById);
// Debug endpoint to inspect notion client shape (requires NOTION_DEBUG=1)
// router.get('/notion/debug', controller.notionClientInfo);

// Get single record
router.get('/:id', controller.getRecordById);

// Update record
router.patch('/:id', financeMiddleware.updateRules, controller.updateRecord);

// Delete record
router.delete('/:id', controller.deleteRecord);

module.exports = router;
