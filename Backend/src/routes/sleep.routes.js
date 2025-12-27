const express = require('express');
const controller = require('../controllers/sleep.controller');
const sleepMiddleware = require('../middlewares/sleep.validator');
const router = express.Router();


// Create
router.post('/', sleepMiddleware.createRules, controller.createSleep);

// List (user's records)
router.get('/', controller.listSleeps);

// Get single
router.get('/:id', controller.getSleepById);

// Update
router.patch('/:id', sleepMiddleware.updateRules, controller.updateSleep);

// Delete
router.delete('/:id', controller.deleteSleep);

module.exports = router;
