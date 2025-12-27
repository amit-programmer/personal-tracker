const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    foodName: {
        type: String,
        required: [true, 'Food name is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    category: {
        type: String,
        enum: ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Meat', 'Snacks', 'Beverages', 'Other'],
        default: 'Other',
        optional: true
    },
    unit: {
        type: String,
        enum: ['kg', 'gm', 'l', 'ml', 'pieces', 'packets'],
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    },
     notionPageId: {
        type: String,
        trim: true,
        index: true
    }
}, {
    timestamps: true
});

// Index for faster queries
foodSchema.index({ foodName: 1, purchaseDate: -1 });

// Add Notion linkage id for optional sync
foodSchema.add({
    notionPageId: { type: String, trim: true, index: true }
});

// Format `purchaseDate` to only show YYYY-MM-DD in JSON output
foodSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        const pad = (n) => String(n).padStart(2, '0');
        const dateVal = ret.purchaseDate || doc.purchaseDate;
        if (dateVal) {
            const d = new Date(dateVal);
            ret.purchaseDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        } else {
            ret.purchaseDate = null;
        }
        return ret;
    }
});

const Food = mongoose.model('food', foodSchema);
module.exports = Food;