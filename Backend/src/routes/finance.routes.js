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

// Export records between two dates to a text file
// Query: ?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/export', controller.exportRange);


// Get single record
router.get('/:id', controller.getRecordById);

// Update record
router.patch('/:id', financeMiddleware.updateRules, controller.updateRecord);

// Delete record
router.delete('/:id', controller.deleteRecord);

module.exports = router;
