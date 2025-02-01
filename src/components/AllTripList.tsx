import { useState } from 'react';
import { formatDate } from '../utils/utilities';
import DeleteButton from './DeleteButton';
import EditButton from './EditButton';

interface Trip {
    id: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    tags: string[]; // tags should be an array
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
    const [editingTripId, setEditingTripId] = useState<string | null>(null);
    const [editedTrip, setEditedTrip] = useState<Partial<Trip>>({});

    const handleEditClick = (trip: Trip) => {
        setEditingTripId(trip.id);
        setEditedTrip({
            ...trip,
            startDate: trip.startDate
                ? new Date(trip.startDate).toISOString().split('T')[0]
                : '',
            endDate: trip.endDate
                ? new Date(trip.endDate).toISOString().split('T')[0]
                : '',
        });
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
                                    value={editedTrip.name ?? ''}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="text"
                                    name="destination"
                                    value={editedTrip.destination ?? ''}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="date"
                                    name="startDate"
                                    value={editedTrip.startDate ?? ''}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="date"
                                    name="endDate"
                                    value={editedTrip.endDate || ''}
                                    onChange={handleInputChange}
                                />
                                <label>Tags:</label>
                                <div>
                                    {['Work', 'Ski', 'Christmas', 'Beach'].map(
                                        (tag) => (
                                            <label key={tag}>
                                                <input
                                                    type="checkbox"
                                                    value={tag}
                                                    checked={
                                                        editedTrip.tags?.includes(
                                                            tag,
                                                        ) || false
                                                    }
                                                    onChange={() => {
                                                        setEditedTrip(
                                                            (prev) => ({
                                                                ...prev,
                                                                tags: prev.tags?.includes(
                                                                    tag,
                                                                )
                                                                    ? prev.tags.filter(
                                                                          (t) =>
                                                                              t !==
                                                                              tag,
                                                                      )
                                                                    : [
                                                                          ...(prev.tags ||
                                                                              []),
                                                                          tag,
                                                                      ],
                                                            }),
                                                        );
                                                    }}
                                                />{' '}
                                                {tag}
                                            </label>
                                        ),
                                    )}
                                </div>
                                <button
                                    onClick={() => handleUpdateClick(trip.id)}
                                >
                                    Update
                                </button>
                            </>
                        ) : (
                            <>
                                <strong>{trip.name}</strong> -{' '}
                                {trip.destination} - {trip.id} (
                                {formatDate(trip.startDate)})
                                {/* Render tags with a check to ensure it's defined */}
                                <div>
                                    {Array.isArray(trip.tags) &&
                                    trip.tags.length > 0 ? (
                                        <span>
                                            Tags: {trip.tags.join(', ')}
                                        </span>
                                    ) : (
                                        <span>No tags</span>
                                    )}
                                </div>
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
