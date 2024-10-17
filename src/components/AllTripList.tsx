import React from 'react';

interface Trip {
    id: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
}

interface AllTripListProps {
    trips: Trip[];
    onSelectTrip: (id: string) => void;
}

const AllTripList: React.FC<AllTripListProps> = ({ trips, onSelectTrip }) => {
    console.log('Trips:', trips);

    return (
        <div>
            <h2>All Trips</h2>
            <ul>
                {trips.map((trip) => (
                    <li key={trip.id} onClick={() => onSelectTrip(trip.id)}>
                        <strong>{trip.name}</strong> - {trip.destination} -{' '}
                        {trip.id} ({trip.startDate})
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AllTripList;
