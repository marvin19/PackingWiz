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
        res.json(packingLists);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST: Create a new packing list
app.post('/api/packing-list', async (req, res) => {
    try {
        const { name, items } = req.body;
        const newList = new PackingList({ name, items });
        await newList.save();
        res.status(201).json(newList);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create packing list' });
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
        const { name, items } = req.body;
        const packingList = await PackingList.findByIdAndUpdate(
            req.params.id,
            { name, items },
            { new: true },
        );
        if (!packingList) {
            return res.status(404).json({ message: 'Packinglist not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE: Delete a packing list by ID
app.delete('/api/packing-list/:id', async (req, res) => {
    try {
        const packingList = await PackingList.findByIdAndDelete(req.params.id);
        if (!packingList) {
            return res.status(404).json({ message: 'Packinglist not found' });
        }
        res.json({ message: 'Packinglist deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete packing list' });
    }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

/*mongoose
    .connect('mongodb://localhost:27017/packing-list')
    .then(async () => {
        console.log('MongoDB connected');

        // Create a new packing list
        const newList = new PackingList({
            name: 'Weekend Trip',
            items: ['Toothbrush', 'Socks', 'Phone Charger'],
        });

        await newList.save();
        console.log('Packing list saved');
    })
    .catch((err) => console.log('MongoDB connection error:', err));*/
