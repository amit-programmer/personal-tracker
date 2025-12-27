const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  next();
};

const createRules = [
  body('subject').isString().trim().notEmpty().withMessage('Subject is required'),
  body('time').isFloat({ min: 0 }).withMessage('Time (minutes) is required and must be >= 0'),
  body('date').optional().isISO8601().toDate().withMessage('Invalid date'),
  body('notes').optional().isString().trim(),
  validate
];

const updateRules = [
  body('subject').optional().isString().trim().notEmpty().withMessage('Subject must be a non-empty string'),
  body('time').optional().isFloat({ min: 0 }).withMessage('Time must be >= 0'),
  body('date').optional().isISO8601().toDate().withMessage('Invalid date'),
  body('notes').optional().isString().trim(),
  validate
];

module.exports = { createRules, updateRules };
