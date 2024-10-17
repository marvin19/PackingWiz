const mongoose = require('mongoose');
const PackingList = require('./models/PackingList'); // Adjust the path if necessary

mongoose
    .connect('mongodb://localhost:27017/packing-list')
    .then(async () => {
        console.log('MongoDB connected');

        // Fetch all packing lists
        const packingLists = await PackingList.find();

        // Iterate over each packing list and ensure items have _id fields
        for (const list of packingLists) {
            let updated = false;

            list.items.forEach((item) => {
                // If the item does not have an _id, generate one
                if (!item._id) {
                    item._id = new mongoose.Types.ObjectId(); // Generates a new ObjectId
                    updated = true;
                }
            });

            // Save the updated packing list if any item was updated
            if (updated) {
                await list.save();
                console.log(`Updated packing list with ID: ${list._id}`);
            }
        }

        console.log('Finished updating items with _id');
        mongoose.disconnect();
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
