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

// Export study records between two dates to a text file
// Query: ?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/export', controller.exportRange);

// Get single
router.get('/:id', controller.getStudyById);

// Update
router.patch('/:id', studyMiddleware.updateRules, controller.updateStudy);

// Delete
router.delete('/:id', controller.deleteStudy);

module.exports = router;
