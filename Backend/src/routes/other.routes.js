const express = require('express');
const ctrl = require('../controllers/other.controller');
const validator = require('../middlewares/other.validator');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes below require authentication via `authMiddleware`
router.use(authMiddleware);

// ---------------------- Exercises APIs ----------------------
// POST  /exercises
// - Purpose: Create a new exercise entry
// - Auth: required
// - Body: { name: string (required), type?, intensity?, notes?, done?, date? }
// - Response: created Exercise object
router.post('/exercises', validator.exerciseCreateRules, ctrl.createExercise);

// GET /exercises
// - Purpose: List exercises (supports optional query filters)
// - Auth: required
// - Query: start?, end?, done?, type?
// - Response: array of Exercise objects (sorted by date desc)
router.get('/exercises', validator.listRules, ctrl.listExercises);

// Export exercises between two dates to a text file
// Query: ?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/exercises/export', ctrl.exportExercises);

// GET /exercises/:id
// - Purpose: Fetch a single exercise by id
// - Auth: required
// - Params: id (exercise id)
// - Response: single Exercise object
router.get('/exercises/:id', ctrl.getExerciseById);

// PATCH /exercises/:id
// - Purpose: Update fields on an existing exercise
// - Auth: required
// - Params: id
// - Body: any updatable fields (name, type, intensity, notes, done, date)
// - Response: updated Exercise object
router.patch('/exercises/:id', validator.exerciseUpdateRules, ctrl.updateExercise);

// DELETE /exercises/:id
// - Purpose: Remove an exercise record
// - Auth: required
// - Params: id
// - Response: removed Exercise object
router.delete('/exercises/:id', ctrl.deleteExercise);

// PATCH /exercises/:id/toggle
// - Purpose: Toggle the exercise `done` boolean (checkbox behavior)
// - Auth: required
// - Params: id
// - Response: exercise object with toggled `done`
router.patch('/exercises/:id/toggle', ctrl.toggleExerciseDone);

// ----------------------- Habits APIs ------------------------
// POST /habits
// - Purpose: Create a new habit
// - Auth: required
// - Body: { name: string (required), category?, frequency?, targetCount?, reminder? }
// - Response: created Habit object
router.post('/habits', validator.habitCreateRules, ctrl.createHabit);

// GET /habits
// - Purpose: List habits (supports simple filters)
// - Auth: required
// - Query: category?, frequency?, done?
// - Response: array of Habit objects
router.get('/habits', ctrl.listHabits);

// Export habits between two dates to a text file
// Query: ?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/habits/export', ctrl.exportHabits);
// GET /habits/:id
// - Purpose: Fetch a single habit by id
// - Auth: required
// - Params: id
// - Response: single Habit object
router.get('/habits/:id', ctrl.getHabitById);

// PATCH /habits/:id
// - Purpose: Update habit fields
// - Auth: required
// - Params: id
// - Body: any updatable habit fields (name, category, frequency, done, reminder, etc.)
// - Response: updated Habit object
router.patch('/habits/:id', validator.habitUpdateRules, ctrl.updateHabit);

// DELETE /habits/:id
// - Purpose: Remove a habit
// - Auth: required
// - Params: id
// - Response: removed Habit object
router.delete('/habits/:id', ctrl.deleteHabit);

// PATCH /habits/:id/toggle
// - Purpose: Toggle the habit `done` boolean (simple checkbox toggle)
// - Auth: required
// - Params: id
// - Response: habit object with toggled `done`
router.patch('/habits/:id/toggle', ctrl.toggleHabitDone);

// POST /habits/:id/complete
// - Purpose: Add a completed date to a habit's `completedDates` array
// - Auth: required
// - Params: id
// - Body: { date? } (optional; defaults to today)
// - Response: updated Habit object
router.post('/habits/:id/complete', ctrl.addCompletedDate);

module.exports = router;
