const mongoose = require('mongoose');

// Define schema for each item inside the packing list
const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, default: 'Uncategorized' },
    quantity: { type: Number, default: 1, min: 1 }, // Ensure quantity is at least 1
});

const weatherSchema = new mongoose.Schema({
    date: String,
    temp: Number,
    conditions: String,
    humidity: Number,
});

// Define a schema for the packing list
const packingListSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true }, // Name of the trip, trimmed for whitespace
        destination: { type: String, required: true, trim: true }, // Destination of the trip
        startDate: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    return value < this.endDate; // Ensure startDate is before endDate
                },
                message: 'Start date must be before end date',
            },
        },
        endDate: { type: Date, required: true },
        items: [itemSchema], // Using itemSchema ensures each item gets an _id
        categories: {
            type: [String],
            default: ['Clothes', 'Toiletries', 'Electronics', 'Miscellaneous'], // Default categories
        },
        tags: {
            type: [String],
            default: [
                'Working',
                'Ski',
                'Beach',
                'Running',
                'Half Marathon',
                'Winter',
            ],
        },
        weather: [weatherSchema],
    },
    {
        timestamps: true, // Adds `createdAt` and `updatedAt` fields automatically
    },
);

// Add an index for frequently queried fields (optional)
packingListSchema.index({ name: 1 });
packingListSchema.index({ destination: 1 });

// Export the model
module.exports = mongoose.model('PackingList', packingListSchema);
