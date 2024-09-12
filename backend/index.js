const express = require('express');
const cors = require('cors'); // Might be dealing with CORS issues between frontend and backend
const app = express();
const mongoose = require('mongoose');
const PackingList = require('./models/PackingList');

// Middleware, parsing incoming JSON requests
app.use(express.json());
// Allows cross-origin requests
app.use(cors());

// Define a test route
app.get('/', (req, res) => {
    res.send('Hello from Express!');
});

// Define API routes 
app.get('/api/packing-list', (req, res) => {
    res.json({message: 'Your packing list API is working'});
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

mongoose.connect('mongodb://localhost:27017/packing-list')
.then(async () => {
    console.log('MongoDB connected')

    // Create a new packing list
    const newList = new PackingList({
        name: 'Weekend Trip',
        items: ['Toothbrush', 'Socks', 'Phone Charger']
    });

    await newList.save();
    console.log('Packing list saved');
})
.catch(err => console.log('MongoDB connection error:', err));
