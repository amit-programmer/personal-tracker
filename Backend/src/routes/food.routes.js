const express = require('express');
const controller = require('../controllers/food.controller');
const foodMiddleware = require('../middlewares/food.validator');
const { authMiddleware } = require('../middlewares/auth.middleware');



const router = express.Router();


router.use(authMiddleware)
// Create
router.post('/', foodMiddleware.createRules, controller.createItem);

// Create via Notion payload and sync to finance DB
router.post('/notion', controller.createNotionPage);
// router.post('/notion', controller.createNotionPage);

// List (optional ?category=&start=&end=)
router.get('/', controller.listItems);

// Get single
router.get('/:id', controller.getItemById);

// Update
router.patch('/:id', foodMiddleware.updateRules, controller.updateItem);

// Delete
router.delete('/:id', controller.deleteItem);

module.exports = router;
