import { useState, FormEvent } from 'react';

interface TripFormProps {
    onAddTrip: (trip: {
        name: string;
        destination: string;
        startDate: string;
        endDate: string;
    }) => void;
}

const TripForm = ({ onAddTrip }: TripFormProps): JSX.Element => {
    const [name, setName] = useState('');
    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onAddTrip({ name, destination, startDate, endDate });
        setName('');
        setDestination('');
        setStartDate('');
        setEndDate('');
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
            <label>Start Date:</label>
            <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
            />
            <label>End Date:</label>
            <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
            />
            <button type="submit">Add Trip</button>
        </form>
    );
};

export default TripForm;
