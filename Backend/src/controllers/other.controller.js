const { Exercise, Habit } = require('../models/other.model');

/* Exercise controllers */
async function createExercise(req, res) {
  try {
    const { name, type, intensity, notes, done, date } = req.body;
    if (!name) return res.status(400).json({ ok: false, error: 'Name is required' });
    const data = { name, type, intensity, notes, done: typeof done !== 'undefined' ? Boolean(done) : false };
    if (date) data.date = new Date(date);
    const rec = await Exercise.create(data);
    return res.status(201).json({ ok: true, data: rec });
  } catch (err) {
    console.error('Create exercise error', err);
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).map(k => ({ field: k, message: err.errors[k].message }));
      return res.status(400).json({ ok: false, error: 'Validation failed', details: errors });
    }
    return res.status(500).json({ ok: false, error: err.message || 'Failed to create exercise' });
  }
}

async function listExercises(req, res) {
  try {
    const { start, end, done, type } = req.query;
    const filter = {};
    if (typeof done !== 'undefined') filter.done = done === 'true' || done === true;
    if (type) filter.type = type;
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) filter.date.$lte = new Date(end);
    }
    const items = await Exercise.find(filter).sort({ date: -1 });
    return res.json({ ok: true, data: items });
  } catch (err) {
    console.error('List exercises error', err);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to list exercises' });
  }
}

async function getExerciseById(req, res) {
  try {
    const { id } = req.params;
    const item = await Exercise.findById(id);
    if (!item) return res.status(404).json({ ok: false, error: 'Exercise not found' });
    return res.json({ ok: true, data: item });
  } catch (err) {
    console.error('Get exercise error', err);
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to fetch exercise' });
  }
}

async function updateExercise(req, res) {
  try {
    const { id } = req.params;
    const updates = {};
    ['name', 'type', 'intensity', 'notes', 'done', 'date'].forEach(f => {
      if (typeof req.body[f] !== 'undefined') updates[f] = req.body[f];
    });
    if (updates.date) updates.date = new Date(updates.date);
    if (typeof updates.done !== 'undefined') updates.done = Boolean(updates.done);
    const updated = await Exercise.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    return res.json({ ok: true, data: updated });
  } catch (err) {
    console.error('Update exercise error', err);
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).map(k => ({ field: k, message: err.errors[k].message }));
      return res.status(400).json({ ok: false, error: 'Validation failed', details: errors });
    }
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id or value' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to update exercise' });
  }
}

async function deleteExercise(req, res) {
  try {
    const { id } = req.params;
    const existing = await Exercise.findById(id);
    if (!existing) return res.status(404).json({ ok: false, error: 'Exercise not found' });
    const removed = await Exercise.findByIdAndDelete(id);
    return res.json({ ok: true, data: removed });
  } catch (err) {
    console.error('Delete exercise error', err);
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to delete exercise' });
  }
}

async function toggleExerciseDone(req, res) {
  try {
    const { id } = req.params;
    const item = await Exercise.findById(id);
    if (!item) return res.status(404).json({ ok: false, error: 'Exercise not found' });
    item.done = !item.done;
    await item.save();
    return res.json({ ok: true, data: item });
  } catch (err) {
    console.error('Toggle exercise done error', err);
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to toggle' });
  }
}

/* Habit controllers */
async function createHabit(req, res) {
  try {
    const { name, category, frequency, targetCount, currentStreak, longestStreak, done, reminder } = req.body;
    if (!name) return res.status(400).json({ ok: false, error: 'Name is required' });
    const data = { name };
    if (category) data.category = category;
    if (frequency) data.frequency = frequency;
    if (typeof targetCount !== 'undefined') data.targetCount = Number(targetCount);
    if (typeof currentStreak !== 'undefined') data.currentStreak = Number(currentStreak);
    if (typeof longestStreak !== 'undefined') data.longestStreak = Number(longestStreak);
    if (typeof done !== 'undefined') data.done = Boolean(done);
    if (reminder) data.reminder = reminder;
    const rec = await Habit.create(data);
    return res.status(201).json({ ok: true, data: rec });
  } catch (err) {
    console.error('Create habit error', err);
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).map(k => ({ field: k, message: err.errors[k].message }));
      return res.status(400).json({ ok: false, error: 'Validation failed', details: errors });
    }
    return res.status(500).json({ ok: false, error: err.message || 'Failed to create habit' });
  }
}

async function listHabits(req, res) {
  try {
    const { category, frequency, done } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (frequency) filter.frequency = frequency;
    if (typeof done !== 'undefined') filter.done = done === 'true' || done === true;
    const items = await Habit.find(filter).sort({ createdAt: -1 });
    return res.json({ ok: true, data: items });
  } catch (err) {
    console.error('List habits error', err);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to list habits' });
  }
}

async function getHabitById(req, res) {
  try {
    const { id } = req.params;
    const item = await Habit.findById(id);
    if (!item) return res.status(404).json({ ok: false, error: 'Habit not found' });
    return res.json({ ok: true, data: item });
  } catch (err) {
    console.error('Get habit error', err);
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to fetch habit' });
  }
}

async function updateHabit(req, res) {
  try {
    const { id } = req.params;
    const updates = {};
    const fields = ['name','category','frequency','targetCount','currentStreak','longestStreak','done','reminder'];
    fields.forEach(f => { if (typeof req.body[f] !== 'undefined') updates[f] = req.body[f]; });
    if (typeof updates.targetCount !== 'undefined') updates.targetCount = Number(updates.targetCount);
    if (typeof updates.currentStreak !== 'undefined') updates.currentStreak = Number(updates.currentStreak);
    if (typeof updates.longestStreak !== 'undefined') updates.longestStreak = Number(updates.longestStreak);
    if (typeof updates.done !== 'undefined') updates.done = Boolean(updates.done);
    const updated = await Habit.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    return res.json({ ok: true, data: updated });
  } catch (err) {
    console.error('Update habit error', err);
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).map(k => ({ field: k, message: err.errors[k].message }));
      return res.status(400).json({ ok: false, error: 'Validation failed', details: errors });
    }
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id or value' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to update habit' });
  }
}

async function deleteHabit(req, res) {
  try {
    const { id } = req.params;
    const existing = await Habit.findById(id);
    if (!existing) return res.status(404).json({ ok: false, error: 'Habit not found' });
    const removed = await Habit.findByIdAndDelete(id);
    return res.json({ ok: true, data: removed });
  } catch (err) {
    console.error('Delete habit error', err);
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to delete habit' });
  }
}

async function toggleHabitDone(req, res) {
  try {
    const { id } = req.params;

    const item = await Habit.findById(id);

    if (!item) return res.status(404).json({ ok: false, error: 'Habit not found' });

    item.done = !item.done;
    await item.save();

    return res.json({ ok: true, data: item });
    
  } catch (err) {
    console.error('Toggle habit done error', err);
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to toggle' });
  }
}

async function addCompletedDate(req, res) {
  try {
    const { id } = req.params;
    const { date } = req.body;
    const d = date ? new Date(date) : new Date();
    const item = await Habit.findById(id);
    if (!item) return res.status(404).json({ ok: false, error: 'Habit not found' });
    item.completedDates = item.completedDates || [];
    item.completedDates.push(d);
    // Simple streak logic: update currentStreak/longestStreak could be added later
    await item.save();
    return res.json({ ok: true, data: item });
  } catch (err) {
    console.error('Add completed date error', err);
    if (err.name === 'CastError') return res.status(400).json({ ok: false, error: 'Invalid id' });
    return res.status(500).json({ ok: false, error: err.message || 'Failed to add completed date' });
  }
}

module.exports = {
  createExercise,
  listExercises,
  getExerciseById,
  updateExercise,
  deleteExercise,
  toggleExerciseDone,
  createHabit,
  listHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  toggleHabitDone,
  addCompletedDate
};
