const mongoose = require('mongoose');

const sleepSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: [true, 'User is required'],
            index: true
        },

        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        duration: {
            type: Number, // in hours
            required: true,
        },
        quality: {
            type: String,
            enum: ['poor', 'fair', 'good', 'excellent'],
            default: 'fair',
        },
        notes: {
            type: String,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries (no userId field present)
sleepSchema.index({ date: -1, user: 1 });

// Method to calculate duration (kept for compatibility if sleepTime/wakeTime used elsewhere)
// Use a synchronous pre-save hook (no `next`) so middleware invocation
// style differences across mongoose/kareem versions won't break.
sleepSchema.pre('save', function () {
    if (this.sleepTime && this.wakeTime) {
        const diffMs = this.wakeTime - this.sleepTime;
        this.duration = diffMs / (1000 * 60 * 60); // Convert to hours
    }
    // Normalize `date` to date-only (midnight UTC) to avoid storing time-of-day
    if (this.date) {
        const d = new Date(this.date);
        const norm = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        this.date = norm;
    } else {
        const now = new Date();
        const norm = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        this.date = norm;
    }
});

// When updating via findOneAndUpdate / findByIdAndUpdate, normalize date in the update payload
sleepSchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate();
    if (!update) return;
    const applyDate = (raw) => {
        if (!raw) return;
        const d = new Date(raw);
        if (isNaN(d)) return;
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    };

    if (update.date) {
        const n = applyDate(update.date);
        if (n) update.date = n;
    }
    if (update.$set && update.$set.date) {
        const n = applyDate(update.$set.date);
        if (n) update.$set.date = n;
    }
    this.setUpdate(update);
});

// Format `date` to YYYY-MM-DD in JSON output
sleepSchema.set('toJSON', {
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

const Sleep = mongoose.model('sleep', sleepSchema);

module.exports = Sleep;