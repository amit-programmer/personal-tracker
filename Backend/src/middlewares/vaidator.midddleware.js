const { body, validationResult } = require("express-validator");

const responseWithValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};

const registerValidationRules = [
  body("name")
    .isString()
    .withMessage("Username must be a string")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long")
    .notEmpty()
    .withMessage("Username is required"),
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .notEmpty()
    .withMessage("Email is required")
    .isLength({ min: 6 })
    .withMessage("Email must be at least 6 characters long"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .notEmpty()
    .withMessage("Password is required"),
    body("logo")
    .optional()
    .isString()
    .withMessage("Logo URL must be a string"),
  responseWithValidationErrors
];


const loginUserValidations = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .notEmpty()
    .withMessage("Password is required"),
  (req, res, next) => {
    // Custom validation: at least username or email required
    if (!req.body.username && !req.body.email) {
      return res.status(400).json({ message: 'email is required' });
    }
    next();
  },
  responseWithValidationErrors
];



module.exports = {
  registerValidationRules,
  loginUserValidations
};
