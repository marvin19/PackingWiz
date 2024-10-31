import { useState } from 'react';
import DeleteButton from './DeleteButton';
import EditButton from './EditButton';

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
    onEditTrip: (id: string, updatedTrip: Partial<Trip>) => void;
}

const AllTripList = ({
    trips,
    onSelectTrip,
    onDeleteTrip,
    onEditTrip,
}: AllTripListProps): JSX.Element => {
    const [editingTripId, setEditingTripId] = useState<string | null>(
        undefined,
    );
    const [editedTrip, setEditedTrip] = useState<Partial<Trip>>({});

    const handleEditClick = (trip: Trip) => {
        setEditingTripId(trip.id);
        setEditedTrip({ ...trip });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedTrip((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleUpdateClick = (id: string) => {
        onEditTrip(id, editedTrip);
        setEditingTripId(null);
    };

    return (
        <div>
            <h2>All Trips</h2>
            <ul>
                {trips.map((trip) => (
                    <li key={trip.id} onClick={() => onSelectTrip(trip.id)}>
                        {editingTripId === trip.id ? (
                            <>
                                <input
                                    type="text"
                                    name="name"
                                    value={editedTrip.name || ''}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="text"
                                    name="destination"
                                    value={editedTrip.destination || ''}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="date"
                                    name="startDate"
                                    value={editedTrip.startDate || ''}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="date"
                                    name="endDate"
                                    value={editedTrip.endDate || ''}
                                    onChange={handleInputChange}
                                />
                                <button
                                    onClick={() => handleUpdateClick(trip.id)}
                                >
                                    Update
                                </button>
                            </>
                        ) : (
                            <>
                                <strong>{trip.name}</strong> -{' '}
                                {trip.destination} - {trip.id} ({trip.startDate}
                                )
                                <EditButton
                                    onEdit={() => handleEditClick(trip)}
                                />
                            </>
                        )}
                        <DeleteButton onDelete={() => onDeleteTrip(trip.id)} />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AllTripList;
