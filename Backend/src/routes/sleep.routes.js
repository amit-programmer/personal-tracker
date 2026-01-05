const express = require('express');
const controller = require('../controllers/sleep.controller');
const sleepMiddleware = require('../middlewares/sleep.validator');
const router = express.Router();


// Create
router.post('/', sleepMiddleware.createRules, controller.createSleep);

// List (user's records)
router.get('/', controller.listSleeps);

// Export sleep records between two dates to a text file
// Query: ?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/export', controller.exportRange);

// Get single
router.get('/:id', controller.getSleepById);

// Update
router.patch('/:id', sleepMiddleware.updateRules, controller.updateSleep);

// Delete
router.delete('/:id', controller.deleteSleep);

module.exports = router;
