const { body, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ ok: false, errors: errors.array() });
  next();
};

const exerciseCreateRules = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('type').optional().isIn(['cardio', 'strength', 'flexibility', 'sports', 'other']).withMessage('Invalid type'),
  body('intensity').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid intensity'),
  body('notes').optional().isString().trim().isLength({ max: 1000 }).withMessage('Notes too long'),
  body('done').optional().isBoolean().withMessage('Done must be boolean'),
  body('date').optional().isISO8601().toDate().withMessage('Invalid date'),
  validate
];

const exerciseUpdateRules = [
  body('name').optional().isString().trim().notEmpty().withMessage('Name must be a non-empty string'),
  body('type').optional().isIn(['cardio', 'strength', 'flexibility', 'sports', 'other']),
  body('intensity').optional().isIn(['low', 'medium', 'high']),
  body('notes').optional().isString().trim().isLength({ max: 1000 }),
  body('done').optional().isBoolean(),
  body('date').optional().isISO8601().toDate(),
  validate
];

const habitCreateRules = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('category').optional().isIn(['health', 'productivity', 'learning', 'social', 'other']).withMessage('Invalid category'),
  body('frequency').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
  body('targetCount').optional().isInt({ min: 1 }).withMessage('targetCount must be >= 1'),
  body('currentStreak').optional().isInt({ min: 0 }),
  body('longestStreak').optional().isInt({ min: 0 }),
  body('done').optional().isBoolean(),
  body('reminder.enabled').optional().isBoolean(),
  body('reminder.time').optional().isString(),
  validate
];

const habitUpdateRules = [
  body('name').optional().isString().trim().notEmpty(),
  body('category').optional().isIn(['health', 'productivity', 'learning', 'social', 'other']),
  body('frequency').optional().isIn(['daily', 'weekly', 'monthly']),
  body('targetCount').optional().isInt({ min: 1 }),
  body('currentStreak').optional().isInt({ min: 0 }),
  body('longestStreak').optional().isInt({ min: 0 }),
  body('done').optional().isBoolean(),
  body('reminder.enabled').optional().isBoolean(),
  body('reminder.time').optional().isString(),
  validate
];

const listRules = [
  query('start').optional().isISO8601().toDate(),
  query('end').optional().isISO8601().toDate(),
  query('done').optional().isBoolean(),
  query('type').optional().isString(),
  validate
];

module.exports = {
  exerciseCreateRules,
  exerciseUpdateRules,
  habitCreateRules,
  habitUpdateRules,
  listRules
};
