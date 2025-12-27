const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  next();
};

const qualities = ['poor', 'fair', 'good', 'excellent'];

const createRules = [
  body('date').optional().isISO8601().toDate().withMessage('Invalid date'),
  body('duration').isFloat({ min: 0 }).withMessage('Duration (hours) is required and must be >= 0'),
  body('quality').optional().isIn(qualities).withMessage('Invalid quality'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes too long'),
  validate
];

const updateRules = [
  body('date').optional().isISO8601().toDate().withMessage('Invalid date'),
  body('duration').optional().isFloat({ min: 0 }).withMessage('Duration must be >= 0'),
  body('quality').optional().isIn(qualities).withMessage('Invalid quality'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes too long'),
  validate
];

module.exports = { createRules, updateRules };
