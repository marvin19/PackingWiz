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

// PUTT INN HeR

// PUT: Update the category of all items in a specific packing list
// app.put(
//     '/api/packing-list/:id/items/items-update-category',
//     async (req, res) => {
//         const { id } = req.params;
//         const { oldCategory, newCategory } = req.query;

//         console.log('Route hit with params:', id, 'Query:', {
//             oldCategory,
//             newCategory,
//         });

//         if (!oldCategory || !newCategory) {
//             return res
//                 .status(400)
//                 .json({
//                     message: 'Both oldCategory and newCategory are required',
//                 });
//         }

//         try {
//             const packingList = await PackingList.findById(id);
//             if (!packingList) {
//                 return res
//                     .status(404)
//                     .json({ message: 'Packing list not found' });
//             }

//             packingList.items = packingList.items.map((item) =>
//                 item.category === oldCategory
//                     ? { ...item, category: newCategory }
//                     : item,
//             );

//             await packingList.save();
//             res.status(200).json({ items: packingList.items });
//         } catch (error) {
//             console.error('Error updating items:', error);
//             res.status(500).json({ message: 'Internal server error' });
//         }
//     },
// );

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
app.put('/api/packing-list/:id/categories', async (req, res) => {
    try {
        const { id } = req.params;
        const { category } = req.body;

        if (!category || typeof category !== 'string') {
            return res.status(400).json({ message: 'Category is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid packing list ID' });
        }

        const packingList = await PackingList.findById(id);

        if (!packingList) {
            return res.status(404).json({ message: 'Packing list not found' });
        }

        if (packingList.categories.includes(category)) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        packingList.categories.push(category);
        await packingList.save();

        res.json({ categories: packingList.categories });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT: editing a category in a specific packing list
app.put(
    '/api/packing-list/:id/categories/:originalCategory',
    async (req, res) => {
        const { id, originalCategory } = req.params;
        const { newCategory } = req.body;

        console.log('Received ID:', id);
        console.log('Received original category:', originalCategory);
        console.log('Received new category:', newCategory);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid packing list ID' });
        }

        try {
            const packingList = await PackingList.findById(id);
            if (!packingList) {
                return res
                    .status(404)
                    .json({ message: 'Packing list not found' });
            }

            // Check if the original category exists
            const categoryIndex = packingList.categories.findIndex(
                (cat) => cat.toLowerCase() === originalCategory.toLowerCase(),
            );
            if (categoryIndex === -1) {
                return res
                    .status(404)
                    .json({ message: 'Original category not found' });
            }

            // Check for duplicate categories
            if (
                packingList.categories.some(
                    (cat) => cat.toLowerCase() === newCategory.toLowerCase(),
                )
            ) {
                return res
                    .status(400)
                    .json({ message: 'Category already exists' });
            }

            // Update the category
            packingList.categories[categoryIndex] = newCategory;
            await packingList.save();

            res.json({ categories: packingList.categories });
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
);

// DELETE: Remove a category from a specific packing list
app.delete('/api/packing-list/:id/categories/:category', async (req, res) => {
    const { id, category } = req.params;

    try {
        const packingList = await PackingList.findById(id);

        if (!packingList) {
            return res.status(404).json({ message: 'Packing list not found' });
        }

        packingList.categories = packingList.categories.filter(
            (cat) => cat !== category,
        );
        await packingList.save();

        res.json({ categories: packingList.categories });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.patch('/api/packing-list/:id/categories', async (req, res) => {
    const { id } = req.params; // Packing list ID
    const { oldCategory, newCategory } = req.body; // Categories to update

    if (!oldCategory || !newCategory) {
        return res
            .status(400)
            .json({ message: 'Both oldCategory and newCategory are required' });
    }

    try {
        const packingList = await PackingList.findById(id);
        if (!packingList) {
            return res.status(404).json({ message: 'Packing list not found' });
        }

        // Update all items with the old category
        packingList.items = packingList.items.map((item) =>
            item.category === oldCategory
                ? { ...item, category: newCategory }
                : item,
        );

        await packingList.save();
        res.status(200).json({ items: packingList.items });
    } catch (error) {
        console.error('Error updating categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
