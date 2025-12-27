const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['cardio', 'strength', 'flexibility', 'sports', 'other'],
        default: 'other'
    },
    intensity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    notes: {
        type: String,
        trim: true
    },
    // Checkbox-like field to mark whether the exercise was done
    done: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now,
        index: true // Important: Index for date-based queries
    }
}, {
    timestamps: true
});

const habitSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['health', 'productivity', 'learning', 'social', 'other'],
        default: 'other'
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily'
    },
    targetCount: {
        type: Number,
        default: 1
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    // Checkbox-like field to indicate a simple done/not-done state
    done: {
        type: Boolean,
        default: false
    },
    reminder: {
        enabled: {
            type: Boolean,
            default: false
        },
        time: String
    }
}, {
    timestamps: true
});

// Indexes: avoid referencing non-existent userId field
exerciseSchema.index({ date: -1 });
habitSchema.index({ isActive: 1 });

// Format `date` in Exercise to YYYY-MM-DD when serialized to JSON
exerciseSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        const pad = (n) => String(n).padStart(2, '0');
        const dateVal = ret.date || doc.date;
        if (dateVal) {
            const d = new Date(dateVal);
            ret.date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        } else {
            ret.date = null;
        }
        return ret;
    }
});

// Format `completedDates` array in Habit to YYYY-MM-DD strings when serialized
habitSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        const pad = (n) => String(n).padStart(2, '0');
        if (Array.isArray(ret.completedDates)) {
            ret.completedDates = ret.completedDates.map(dt => {
                const d = new Date(dt);
                if (isNaN(d)) return null;
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            });
        } else {
            ret.completedDates = [];
        }
        return ret;
    }
});

const Exercise = mongoose.model('exercise', exerciseSchema);

const Habit = mongoose.model('habit', habitSchema);

module.exports = { Exercise, Habit };