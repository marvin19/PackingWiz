import { useState, FormEvent } from 'react';
import { useInputValidation } from '../hooks/useInputValidation';
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

    const { inputErrors, validateInput } = useInputValidation();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        // Log the data to be sent to the parent component
        console.log({
            name,
            destination,
            startDate: parsedStartDate.toISOString(),
            endDate: parsedEndDate.toISOString(),
        });

        onAddTrip({
            name,
            destination,
            startDate: parsedStartDate.toISOString(),
            endDate: parsedEndDate.toISOString(),
        });

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
                onChange={(e) => {
                    if (validateInput(0, e.target.value)) {
                        setName(e.target.value);
                    }
                }}
                required
                style={{
                    border: inputErrors[0] ? '1px solid red' : '1px solid #ccc',
                    marginBottom: '4px',
                }}
            />
            {inputErrors[0] && (
                <p style={{ color: 'red', fontSize: '0.9rem' }}>
                    {inputErrors[0]}
                </p>
            )}
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
