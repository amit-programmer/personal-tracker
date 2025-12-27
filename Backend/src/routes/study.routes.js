const express = require('express');
const controller = require('../controllers/study.controller');
const studyMiddleware = require('../middlewares/study.validator');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware)

// Create
router.post('/', studyMiddleware.createRules, controller.createStudy);

// List
router.get('/', controller.listStudies);

// Get single
router.get('/:id', controller.getStudyById);

// Update
router.patch('/:id', studyMiddleware.updateRules, controller.updateStudy);

// Delete
router.delete('/:id', controller.deleteStudy);

module.exports = router;
