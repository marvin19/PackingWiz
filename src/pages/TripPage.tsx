import { useState } from 'react';
import AllTripList from '../components/AllTripList';
import TripDetails from '../components/TripDetails';
import PackingList from '../components/PackingList';
import TripForm from '../components/TripForm';
import ItemForm from '../components/ItemForm';

const TripPage: React.FC = () => {
    const [trips, setTrips] = useState([
        {
            id: 1,
            name: 'Trip to Paris',
            startDate: '2021-07-01',
            endDate: '2021-07-05',
        },
    ]);

    const [selectedTrip, setSelectedTrip] = useState<any>(null);
    const [items, setItems] = useState([
        { id: 1, name: 'Toothbrush', category: 'Toiletries', quantity: 1 },
    ]);

    const handleAddTrip = (trip: {
        name: string;
        destination: string;
        date: string;
    }) => {
        const newTrip = { ...trip, id: trips.length + 1 };
        setTrips([...trips, newTrip]);
    };

    const handleAddItem = (item: {
        name: string;
        category: string;
        quantity: number;
    }) => {
        const newItem = { ...item, id: items.length + 1 };
        setItems([...items, newItem]);
    };

    return (
        <div>
            <TripForm onAddTrip={handleAddTrip} />
            <AllTripList
                trips={trips}
                onSelectTrip={(id) =>
                    setSelectedTrip(trips.find((trip) => trip.id === id))
                }
            />

            {selectedTrip && (
                <div>
                    <TripDetails
                        name={selectedTrip.name}
                        destination={selectedTrip.destination}
                        date={selectedTrip.date}
                        daysGone={2} // TODO calculate days gone instead of hardcoding
                        weather={'Sunny'} // TODO get weather data based on either average for destination or current weather if available
                    />
                    <PackingList items={items} />
                    <ItemForm onAddItem={handleAddItem} />
                </div>
            )}
        </div>
    );
};

export default TripPage;
