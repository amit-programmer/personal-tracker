const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    day: {
        type: Date,
        required: true,
        default: Date.now
    },
    type:{
      type: String,
      enum:["expense", "income", "investment"],
      default: "expense"
    },
    rupees: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        enum:['INR', 'UPI'],
        default: 'INR',
        uppercase: true
    },
    notionPageId: {
        type: String,
        trim: true,
        index: true
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Automatically compute `rupees` before validation if not provided
financeSchema.pre('validate', function() {
    if (typeof this.rupees === 'undefined' || this.rupees === null) {
        const expense = typeof this.expense === 'number' ? this.expense : 0;
        const gain = typeof this.gain === 'number' ? this.gain : 0;
        const assetsBuy = typeof this.assetsBuy === 'number' ? this.assetsBuy : 0;
        this.rupees = gain + assetsBuy + expense;
    }
    // Ensure currency stored uppercase
    if (this.currency && typeof this.currency === 'string') this.currency = this.currency.toUpperCase();
    // Ensure a readable name exists
    if (!this.name || typeof this.name !== 'string' || this.name.trim() === '') {
        // Prefer existing _id if available, otherwise timestamp
        const idPart = this._id ? String(this._id) : String(Date.now());
        this.name = `Finance ${idPart}`;
    }
});

// Index for faster queries
financeSchema.index({ day: -1 });
financeSchema.index({ createdAt: -1 });

// Static method to find records by date range
financeSchema.statics.findByDateRange = function(startDate, endDate) {
    return this.find({
        day: {
            $gte: startDate,
            $lte: endDate
        }
    }).sort({ day: -1 });
};

// Static method to calculate total for a period
financeSchema.statics.calculateTotals = async function(startDate, endDate) {
    const records = await this.find({
        day: { $gte: startDate, $lte: endDate }
    });
    
    return records.reduce((acc, record) => {
        acc.totalExpense += record.expense;
        acc.totalGain += record.gain;
        acc.netBalance = acc.totalGain - acc.totalExpense;
        return acc;
    }, { totalExpense: 0, totalGain: 0, netBalance: 0 });
};

const Finance = mongoose.model('finance', financeSchema);

module.exports = Finance;