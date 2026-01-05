const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  next();
};

const categories = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Meat', 'Snacks', 'Beverages', 'Other'];
const units = ['kg', 'gm', 'l', 'ml', 'pieces', 'packets'];

const createRules = [
  body('foodName').isString().trim().notEmpty().withMessage('Food name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price is required and must be >= 0'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity is required and must be >= 0'),
  body('category').optional().isIn(categories).withMessage('Invalid category'),
  body('unit').optional().isIn(units).withMessage('Invalid unit'),
  body('purchaseDate').optional().isISO8601().toDate().withMessage('Invalid purchase date'),
  body('calories').optional().isString().trim().withMessage('Calories must be a string'),
  body('notes').optional().isString().trim(),
  validate
];

const updateRules = [
  body('foodName').optional().isString().trim().notEmpty().withMessage('Food name must be a non-empty string'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be >= 0'),
  body('quantity').optional().isFloat({ min: 0 }).withMessage('Quantity must be >= 0'),
  body('category').optional().isIn(categories).withMessage('Invalid category'),
  body('unit').optional().isIn(units).withMessage('Invalid unit'),
  body('purchaseDate').optional().isISO8601().toDate().withMessage('Invalid purchase date'),
  body('calories').optional().isString().trim().withMessage('Calories must be a string'),
  body('notes').optional().isString().trim(),
  validate
];

module.exports = { createRules, updateRules };
