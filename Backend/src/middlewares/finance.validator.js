const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  next();
};

const createRules = [
  body('day').optional().isISO8601().toDate().withMessage('Invalid date'),
  body('expense').optional().isFloat({ min: 0 }).withMessage('Expense must be a non-negative number'),
  body('gain').optional().isFloat({ min: 0 }).withMessage('Gain must be a non-negative number'),
  body('assetsBuy').optional().isFloat({ min: 0 }).withMessage('assetsBuy must be a non-negative number'),
  body('currency').optional().isString().isLength({ min: 1 }).withMessage('Currency must be a string'),
  body('upi').optional().isString().trim(),
  body('description').optional().isString().trim(),
  validate
];

const updateRules = [
  body('day').optional().isISO8601().toDate().withMessage('Invalid date'),
  body('expense').optional().isFloat({ min: 0 }).withMessage('Expense must be a non-negative number'),
  body('gain').optional().isFloat({ min: 0 }).withMessage('Gain must be a non-negative number'),
  body('assetsBuy').optional().isFloat({ min: 0 }).withMessage('assetsBuy must be a non-negative number'),
  body('currency').optional().isString().withMessage('Currency must be a string'),
  body('upi').optional().isString().trim(),
  body('description').optional().isString().trim(),
  validate
];

module.exports = { createRules, updateRules };
