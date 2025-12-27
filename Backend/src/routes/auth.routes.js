const express = require('express');
const authController = require('../controllers/auth.controller')
const validator = require("../middlewares/vaidator.midddleware")

const router = express.Router();

// Signup route
router.post('/signup',validator.registerValidationRules, authController.signup)

// Login route
router.post('/login',validator.loginUserValidations, authController.login)

module.exports = router;
