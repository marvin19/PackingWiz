const mongoose = require('mongoose');

// Define a schema for the packing list
const packingListSchema = new mongoose.Schema({
    name: String,
    items: [String],
});

module.exports = mongoose.model('PackingList', packingListSchema);
