const express = require('express');
const authController = require('../controllers/auth.controller')
const validator = require("../middlewares/vaidator.midddleware")
const { authMiddleware } = require('../middlewares/auth.middleware')

const router = express.Router();

// Signup route
router.post('/signup',validator.registerValidationRules, authController.signup)

// Login route
router.post('/login',validator.loginUserValidations, authController.login)

// Get current user (protected)
router.get('/me', authMiddleware, authController.me)

// Logout route
router.post('/logout', authController.logout)

// Get user by ID
router.get('/:id', authController.getUserById)

module.exports = router;
