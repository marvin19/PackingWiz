const mongoose = require('mongoose');

// Define a schema for the packing list
const packingListSchema = new mongoose.Schema(
    {
        name: { type: String, required: true }, // Name of the trip
        destination: { type: String, required: true }, // Destination of the trip
        startDate: { type: Date, required: true }, // Start date of the trip
        endDate: { type: Date, required: true }, // End date of the trip
        items: [
            {
                name: { type: String, required: true }, // Name of the item (e.g., "Toothbrush")
                category: { type: String, default: 'General' }, // Optional category (e.g., "Toiletries")
                quantity: { type: Number, default: 1 }, // Quantity of the item (default: 1)
            },
        ],
    },
    {
        timestamps: true, // Adds `createdAt` and `updatedAt` fields automatically
    },
);

module.exports = mongoose.model('PackingList', packingListSchema);
