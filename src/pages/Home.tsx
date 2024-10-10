import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div>
            <h1>Welcome to PackingWiz! 🪄</h1>
            <p>
                Your go-to app for managing packing lists and organizing trips.
            </p>
            <Link to="/trips">
                <button type="button">View Trips</button>
            </Link>
        </div>
    );
};

export default Home;
