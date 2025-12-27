const express = require('express');
const controller = require('../controllers/target.controller');
const validator = require('../middlewares/target.validator');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

// Create
router.post('/', validator.createRules, controller.createTarget);

// List (filter by date range and optional userId)
router.get('/', validator.listRules, controller.listTargets);

// Get single
router.get('/:id', controller.getTargetById);

// Update
router.patch('/:id', validator.updateRules, controller.updateTarget);

// Mark as achieved
router.patch('/:id/achieve', controller.markAsAchieved);

// Delete
router.delete('/:id', controller.deleteTarget);

module.exports = router;
