import { useState, FormEvent } from 'react';

interface TripFormProps {
    onAddTrip: (trip: {
        name: string;
        destination: string;
        date: string;
    }) => void;
}

const TripForm = ({ onAddTrip }: TripFormProps): JSX.Element => {
    const [name, setName] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onAddTrip({ name, destination, date });
        setName('');
        setDestination('');
        setDate('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Add New Trip:</h2>
            <label>Name:</label>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            <label>Destination:</label>
            <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
            />
            <label>Date:</label>
            <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
            />
            <button type="submit">Add Trip</button>
        </form>
    );
};

export default TripForm;
