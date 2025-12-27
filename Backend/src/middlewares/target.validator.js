const { body, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ ok: false, errors: errors.array() });
  next();
};

const categories = ['work', 'health', 'personal', 'finance', 'learning', 'other'];
const priorities = ['low', 'medium', 'high'];

const createRules = [
  body('title').isString().trim().notEmpty().withMessage('Title is required'),
  body('description').optional().isString().trim(),
  body('targetDate').isISO8601().toDate().withMessage('targetDate is required and must be a valid date'),
  body('isAchieved').optional().isBoolean().withMessage('isAchieved must be boolean'),
  body('achievedAt').optional().isISO8601().toDate(),
  body('category').optional().isIn(categories).withMessage('Invalid category'),
  body('priority').optional().isIn(priorities).withMessage('Invalid priority'),
  validate
];

const updateRules = [
  body('title').optional().isString().trim().notEmpty().withMessage('Title must be a non-empty string'),
  body('description').optional().isString().trim(),
  body('targetDate').optional().isISO8601().toDate().withMessage('Invalid date'),
  body('isAchieved').optional().isBoolean().withMessage('isAchieved must be boolean'),
  body('achievedAt').optional().isISO8601().toDate(),
  body('category').optional().isIn(categories).withMessage('Invalid category'),
  body('priority').optional().isIn(priorities).withMessage('Invalid priority'),
  validate
];

const listRules = [
  query('start').optional().isISO8601().toDate(),
  query('end').optional().isISO8601().toDate(),
  query('userId').optional().isString().trim(),
  validate
];

module.exports = { createRules, updateRules, listRules };
