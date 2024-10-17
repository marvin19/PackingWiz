import React from 'react';
import DeleteItemButton from './DeleteItemButton';

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
    onDeleteTrip: (id: string) => void;
}

const AllTripList: React.FC<AllTripListProps> = ({
    trips,
    onSelectTrip,
    onDeleteTrip,
}) => {
    console.log('Trips:', trips);

    return (
        <div>
            <h2>All Trips</h2>
            <ul>
                {trips.map((trip) => (
                    <li key={trip.id} onClick={() => onSelectTrip(trip.id)}>
                        <strong>{trip.name}</strong> - {trip.destination} -{' '}
                        {trip.id} ({trip.startDate})
                        <DeleteItemButton
                            onDelete={() => onDeleteTrip(trip.id)}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AllTripList;
