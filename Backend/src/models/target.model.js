const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    targetDate: {
        type: Date,
        required: true,
        index: true // Important: Index for date-based queries
    },
    isAchieved: {
        type: Boolean,
        default: false
    },
    achievedAt: {
        type: Date
    },
    category: {
        type: String,
        enum: ['work', 'health', 'personal', 'finance', 'learning', 'other'],
        default: 'other'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    }
}, {
    timestamps: true // Important: Adds createdAt and updatedAt automatically
});

// Important: Compound index for userId and targetDate queries
targetSchema.index({ userId: 1, targetDate: 1 });

// Important: Static method to find daily targets
targetSchema.statics.findDailyTargets = function(userId, date) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    return this.find({
        userId,
        targetDate: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ priority: -1, createdAt: 1 });
};

// Important: Instance method to mark as achieved
targetSchema.methods.markAsAchieved = function() {
    this.isAchieved = true;
    this.achievedAt = new Date();
    return this.save();
};

const Target = mongoose.model('Target', targetSchema);

module.exports = Target;