import { useState, FormEvent, useEffect } from 'react';
import { useInputValidation } from '../hooks/useInputValidation';
import Axios from 'axios';

interface TripFormProps {
    onAddTrip: (trip: {
        name: string;
        destination: string;
        startDate: string;
        endDate: string;
        tags: string[];
    }) => void;
}

const TripForm = ({ onAddTrip }: TripFormProps): JSX.Element => {
    const [name, setName] = useState('');
    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [tags, setTags] = useState<string[]>([]); // Store selected tags
    const [defaultTags, setDefaultTags] = useState<string[]>([]); // Tags from backend

    const { inputErrors, validateInput } = useInputValidation();

    useEffect(() => {
        const fetchDefaultTags = async () => {
            try {
                const response = await Axios.get(
                    'http://localhost:5001/api/default-tags',
                );
                setDefaultTags(response.data.tags); // Set default tags
            } catch (error) {
                console.error('Error fetching default tags:', error);
            }
        };
        fetchDefaultTags();
    }, []);

    const handleTagChange = (tag: string) => {
        setTags((prevTags) =>
            prevTags.includes(tag)
                ? prevTags.filter((t) => t !== tag)
                : [...prevTags, tag],
        );
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        onAddTrip({
            name,
            destination,
            startDate: parsedStartDate.toISOString(),
            endDate: parsedEndDate.toISOString(),
            tags,
        });

        setName('');
        setDestination('');
        setStartDate('');
        setEndDate('');
        setTags([]);
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
            <label>Tags:</label>
            <div>
                {defaultTags.map((tag) => (
                    <label key={tag}>
                        <input
                            type="checkbox"
                            value={tag}
                            checked={tags.includes(tag)}
                            onChange={() => handleTagChange(tag)}
                        />{' '}
                        {tag}
                    </label>
                ))}
            </div>
            <button type="submit">Add Trip</button>
        </form>
    );
};

export default TripForm;
