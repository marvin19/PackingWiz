import { useState, useEffect } from 'react';
import AllTripList from '../components/AllTripList';
import TripDetails from '../components/TripDetails';
import PackingList from '../components/PackingList';
import TripForm from '../components/TripForm';
import ItemForm from '../components/ItemForm';
import Axios from 'axios';

interface Trip {
    _id: string; // MongoDB ID
    id: string; // Frontend ID
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
}

interface Item {
    _id: string;
    name: string;
    category: string;
    quantity: number;
}

const LOCALHOST_URL = 'http://localhost:5001/api/packing-list';
const TripPage: React.FC = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [items, setItems] = useState<Item[]>([]);

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const response = await Axios.get(
                    'http://localhost:5001/api/packing-list',
                );
                if (Array.isArray(response.data)) {
                    const tripsWithId = response.data.map((trip: Trip) => {
                        if (!trip._id) {
                            console.error('Trip missing _id:', trip); // Log any trips missing _id
                        }
                        return {
                            ...trip,
                            id: trip._id, // Map _id to id
                        };
                    });
                    setTrips(tripsWithId);
                } else {
                    console.error(
                        'Expected an array but received:',
                        response.data,
                    );
                }
            } catch (error) {
                console.error('Error fetching trips', error);
            }
        };
        fetchTrips();
    }, []);

    const handleAddTrip = async (trip: {
        name: string;
        destination: string;
        startDate: string;
        endDate: string;
    }) => {
        try {
            const response = await Axios.post(LOCALHOST_URL, {
                name: trip.name,
                destination: trip.destination,
                startDate: trip.startDate,
                endDate: trip.endDate,
                items: [], // Initially empty
            });
            const savedTrip = response.data;
            setTrips([...trips, { ...savedTrip, id: savedTrip._id }]);
        } catch (error) {
            console.error('Error adding trip', error);
        }
    };

    // Handle selecting a trip and fetching its items
    const handleSelectTrip = async (id: string) => {
        const selected = trips.find((trip) => trip.id === id) || null;
        setSelectedTrip(selected);

        if (selected) {
            try {
                // You might have items associated with trips in the backend
                const response = await Axios.get(`${LOCALHOST_URL}/${id}`);
                console.log('response data', response.data);
                const itemsWithId = response.data.items.map((item: Item) => ({
                    ...item,
                    id: item._id, // Map _id to id
                }));
                setItems(itemsWithId);
            } catch (error) {
                console.error('Error fetching items', error);
            }
        }
    };

    const handleAddItem = async (item: {
        name: string;
        category: string;
        quantity: number;
    }) => {
        if (!selectedTrip) return;

        const newItem = {
            name: item.name,
            category: item.category,
            quantity: item.quantity,
        };
        console.log('newItem', newItem);

        try {
            console.log(
                'Attempting PUT request to:',
                `${LOCALHOST_URL}/${selectedTrip._id}/items`,
            );
            // Post new item to the backend
            const response = await Axios.put(
                `${LOCALHOST_URL}/${selectedTrip._id}/items`, // Use the selectedTrip's _id in the URL
                newItem,
            );

            console.log('Item added to backend: ', response.data);
            setItems([
                ...items,
                response.data.items[response.data.items.length - 1],
            ]);
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    return (
        <div>
            <TripForm onAddTrip={handleAddTrip} />
            <AllTripList
                trips={trips}
                onSelectTrip={(id) => handleSelectTrip(id)}
            />
            {selectedTrip && (
                <div>
                    <TripDetails
                        name={selectedTrip.name}
                        destination={selectedTrip.destination}
                        startDate={selectedTrip.startDate}
                        endDate={selectedTrip.endDate}
                        daysGone={2} // TODO: Calculate days gone
                        weather={'Sunny'} // TODO: Fetch weather data
                    />
                    <PackingList items={items} />
                    <ItemForm onAddItem={handleAddItem} />
                </div>
            )}
        </div>
    );
};

export default TripPage;
