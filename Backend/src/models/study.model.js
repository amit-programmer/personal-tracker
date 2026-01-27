const mongoose = require('mongoose');

const studySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: [true, 'User is required'],
        index: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        default: "dev"
    },
    time: {
        type: Number, // in minutes
        required: true,
        min: 0
    },
    date: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Format `date` to only show YYYY-MM-DD in JSON output
studySchema.set('toJSON', {
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

    // Index for faster queries including user
    studySchema.index({ date: -1, user: 1 });

const Study = mongoose.model('study', studySchema);

module.exports = Study;