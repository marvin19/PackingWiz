const express = require('express');
const cors = require('cors'); // Might be dealing with CORS issues between frontend and backend
const app = express();
const mongoose = require('mongoose');
const PackingList = require('./models/PackingList');

// Middleware, parsing incoming JSON requests
app.use(express.json());
// Allows cross-origin requests
app.use(cors());

// Connect to MongoDB
mongoose
    .connect('mongodb://localhost:27017/packing-list')
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.log('MongoDB connection error:', err);
    });

// GET: Fetch all packing lists
app.get('/api/packing-list', async (req, res) => {
    try {
        const packingLists = await PackingList.find();
        console.log('Packing Lists:', packingLists); // Log the fetched trips
        res.json(packingLists); // This should be an array
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST: Create a new packing list
app.post('/api/packing-list', async (req, res) => {
    try {
        console.log('Received request data:', req.body); // Log incoming data
        const { name, destination, startDate, endDate, items } = req.body;

        // Check if data is missing or invalid
        if (!name || !destination || !startDate || !endDate) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newTrip = new PackingList({
            name,
            destination,
            startDate,
            endDate,
            items,
        });

        const savedTrip = await newTrip.save();
        console.log('Trip saved successfully:', savedTrip); // Log the saved trip
        res.status(201).json(savedTrip); // Return the newly created trip
    } catch (error) {
        console.error('Error saving the trip:', error); // Log the error
        res.status(500).json({ message: 'Error saving the trip' });
    }
});

// GET: Fetch a spesific packing list by ID
app.get('/api/packing-list/:id', async (req, res) => {
    try {
        const packingList = await PackingList.findById(req.params.id);
        if (!packingList) {
            return res.status(404).json({ message: 'Packinglist not found' });
        }
        res.json(packingList);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT: Update a packing list by ID
app.put('/api/packing-list/:id', async (req, res) => {
    try {
        const { name, destination, startDate, endDate, items } = req.body;

        // Update the packing list and check if it exists in one step
        const updatedPackingList = await PackingList.findByIdAndUpdate(
            req.params.id,
            { name, destination, startDate, endDate, items },
            { new: true }, // Returns the updated document
        );

        if (!updatedPackingList) {
            return res.status(404).json({ message: 'Packing list not found' });
        }
        console.log('Trip saved successfully', updatedPackingList);

        res.json(updatedPackingList);
    } catch (error) {
        console.error('Error updating packing list:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT: Add an item to a specific packing list's items array
app.put('/api/packing-list/:id/items', async (req, res) => {
    try {
        const { name, category, quantity } = req.body;

        // Make sure the required fields are present
        if (!name || !quantity) {
            return res
                .status(400)
                .json({ message: 'Item name and quantity are required' });
        }

        // Find the packing list and push the new item to the items array
        const updatedPackingList = await PackingList.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    items: { name, category, quantity },
                },
            },
            { new: true }, // To return the updated version
        );

        if (!updatedPackingList) {
            return res.status(404).json({ message: 'Packing list not found' });
        }

        // Log the updated packing list to see if the item was added
        console.log('Updated Packing List:', updatedPackingList);

        res.json(updatedPackingList); // Send the updated packing list back
    } catch (error) {
        console.error('Error updating packing list:', error); // Log any errors
        res.status(500).json({ message: 'Error updating the packing list' });
    }
});

// DELETE: Remove an packing list by ID
app.delete('/api/packing-list/:id', async (req, res) => {
    try {
        const packingList = await PackingList.findByIdAndDelete(req.params.id);
        if (!packingList) {
            return res.status(404).json({ message: 'Packing list not found' });
        }
        res.json({ message: 'Packing list deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete packing list' });
    }
});

// DELETE: Remove an item from a specific packing list's items array
app.delete('/api/packing-list/:tripId/items/:itemId', async (req, res) => {
    try {
        const { tripId, itemId } = req.params;
        console.log('Received tripId:', tripId);

        // Find the packing list and remove the item from its items array
        const updatedPackingList = await PackingList.findByIdAndUpdate(
            tripId,
            { $pull: { items: { _id: itemId } } }, // $pull removes the item with the given _id
            { new: true }, // Return the updated packing list
        );

        if (!updatedPackingList) {
            return res.status(404).json({ message: 'Packing list not found' });
        }

        res.json(updatedPackingList); // Return the updated packing list
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            message: 'Error deleting item from the packing list',
        });
    }
});

// PUT: Edit an item in a specific packing list
app.put('/api/packing-list/:tripId/items/:itemId', async (req, res) => {
    console.log('Route is working');
    try {
        const { tripId, itemId } = req.params;
        const { name, category, quantity } = req.body;

        // Update the specific item inside the items array using arrayFilters
        const updatedPackingList = await PackingList.findOneAndUpdate(
            { _id: tripId, 'items._id': itemId },
            {
                $set: {
                    'items.$.name': name,
                    'items.$.category': category,
                    'items.$.quantity': quantity,
                },
            },
            { new: true },
        );

        if (!updatedPackingList) {
            return res
                .status(404)
                .json({ message: 'Packing list or item not found' });
        }

        res.json(updatedPackingList);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error editing an item:', error });
    }
});

// GET: Get all categories for a specific packing list
// app.get('/api/packing-list/:tripId/categories', async (req, res) => {
//     console.log('Received tripId:', req.params.tripId); // Log to verify
// });
app.get('/api/packing-list/:tripId/categories', async (req, res) => {
    try {
        const { tripId } = req.params; // Trip ID from the route
        const { category } = req.body; // New category from the request body

        console.log('try in backend');

        // Validate the packing list ID
        console.log('trip id', tripId);
        if (!mongoose.Types.ObjectId.isValid(tripId)) {
            return res.status(400).json({ message: 'Invalid packing list ID' });
        }

        // Fetch the packing list from the database
        const packingList = await PackingList.findById(tripId);

        if (!packingList) {
            return res.status(404).json({ message: 'Packing list not found' });
        }

        // Combine default categories with additional categories
        const categories = packingList.categories;

        res.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT: Add a category to a specific packing list
app.put('/api/packing-list/:tripId/categories', async (req, res) => {
    try {
        const { tripId } = req.params; // Trip ID from the route
        const { category } = req.body; // New category from the request body

        // Validate Trip ID
        if (!mongoose.Types.ObjectId.isValid(tripId)) {
            return res.status(400).json({ message: 'Invalid packing list ID' });
        }

        // Ensure category is provided
        if (!category) {
            return res.status(400).json({ message: 'Category is required' });
        }

        // Update the categories array in the specified trip's packing list
        const updatedPackingList = await PackingList.findByIdAndUpdate(
            tripId,
            { $addToSet: { categories: category } }, // Prevent duplicate categories
            { new: true }, // Return the updated document
        );

        if (!updatedPackingList) {
            return res.status(404).json({ message: 'Packing list not found' });
        }

        res.json(updatedPackingList);
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ message: 'Error adding category' });
    }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
