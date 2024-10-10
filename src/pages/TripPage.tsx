import { useState } from 'react';
import AllTripList from '../components/AllTripList';
import TripDetails from '../components/TripDetails';
import PackingList from '../components/PackingList';
import TripForm from '../components/TripForm';
import ItemForm from '../components/ItemForm';

interface Trip {
    id: number;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
}

const TripPage: React.FC = () => {
    const [trips, setTrips] = useState<Trip[]>([
        {
            id: 1,
            name: 'Trip to Paris',
            destination: 'Paris',
            startDate: '2021-07-01',
            endDate: '2021-07-05',
        },
    ]);

    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [items, setItems] = useState([
        { id: 1, name: 'Toothbrush', category: 'Toiletries', quantity: 1 },
    ]);

    const handleAddTrip = (trip: {
        name: string;
        destination: string;
        startDate: string;
        endDate: string;
    }) => {
        const newTrip: Trip = {
            id: trips.length + 1,
            name: trip.name,
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate,
        };
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
                    setSelectedTrip(
                        trips.find((trip) => trip.id === id) || null,
                    )
                }
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
