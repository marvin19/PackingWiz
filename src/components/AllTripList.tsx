import React from 'react';

interface Trip {
    id: number;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
}

interface AllTripListProps {
    trips: Trip[];
    onSelectTrip: (id: number) => void;
}

const AllTripList: React.FC<AllTripListProps> = ({ trips, onSelectTrip }) => {
    return (
        <div>
            <h2>All Trips</h2>
            <ul>
                {trips.map((trip) => (
                    <li key={trip.id} onClick={() => onSelectTrip(trip.id)}>
                        <strong>{trip.name}</strong> - {trip.destination} (
                        {trip.startDate})
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AllTripList;
