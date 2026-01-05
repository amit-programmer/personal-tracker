const express = require('express');
const controller = require('../controllers/food.controller');
const foodMiddleware = require('../middlewares/food.validator');
const { authMiddleware } = require('../middlewares/auth.middleware');



const router = express.Router();


router.use(authMiddleware)
// Create
router.post('/', foodMiddleware.createRules, controller.createItem);



// List (optional ?category=&start=&end=)
router.get('/', controller.listItems);

// Export food items between two dates to a text file
// Query: ?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/export', controller.exportRange);

// Get single
router.get('/:id', controller.getItemById);

// Update
router.patch('/:id', foodMiddleware.updateRules, controller.updateItem);

// Delete
router.delete('/:id', controller.deleteItem);

module.exports = router;
