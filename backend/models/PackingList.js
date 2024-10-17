const mongoose = require('mongoose');

// Define schema for each item inside the packing list
const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    quantity: { type: Number, default: 1 },
});

// Define a schema for the packing list
const packingListSchema = new mongoose.Schema(
    {
        name: { type: String, required: true }, // Name of the trip
        destination: { type: String, required: true }, // Destination of the trip
        startDate: { type: Date, required: true }, // Start date of the trip
        endDate: { type: Date, required: true }, // End date of the trip
        items: [itemSchema], // Using itemSchema ensures each item gets an _id
    },
    {
        timestamps: true, // Adds `createdAt` and `updatedAt` fields automatically
    },
);

module.exports = mongoose.model('PackingList', packingListSchema);
