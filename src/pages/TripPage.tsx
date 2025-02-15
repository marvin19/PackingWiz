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
    const [updatedCategory, setUpdatedCategory] = useState<string | null>(null);

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

    const handleEditTrip = async (id: string, updatedTrip: Partial<Trip>) => {
        console.log('Editing trip:', id, 'with data:', updatedTrip);

        const existingTrip = trips.find((trip) => trip.id === id);

        if (!existingTrip) {
            console.error('Trip not found');
            return;
        }

        const completeTrip = {
            ...existingTrip,
            ...updatedTrip, // Merge updated fields with existing trip
            startDate: updatedTrip.startDate
                ? new Date(updatedTrip.startDate).toISOString()
                : existingTrip.startDate,
            endDate: updatedTrip.endDate
                ? new Date(updatedTrip.endDate).toISOString()
                : existingTrip.endDate,
        };

        try {
            console.log('CompleteTrip', completeTrip);
            const response = await Axios.put(
                `${LOCALHOST_URL}/${id}`,
                completeTrip,
            );

            console.log('Trip updated successfully:', response.data);

            // Optionally, update the state directly with the updated trip
            const updatedTrips = trips.map((trip) =>
                trip.id === id ? { ...trip, ...response.data } : trip,
            );
            setTrips(updatedTrips);

            // Refetch the updated trip to ensure data is up-to-date
            await handleSelectTrip(id); // This will refetch the updated trip details and set them in state
        } catch (error) {
            console.error('Error editing trip:', error);
        }
    };

    const handleDeleteTrip = async (id: string) => {
        console.log('Deleting trip', id);
        console.log(`Attempting DELETE request to: ${LOCALHOST_URL}/${id}`);

        try {
            // Make DELETE request to the backend
            await Axios.delete(`${LOCALHOST_URL}/${id}`);

            // Update the frontend state by filtering out the deleted trip
            setTrips(trips.filter((trip) => trip.id !== id));
        } catch (error) {
            console.error('Error deleting trip', error);
        }
    };

    // Handle selecting a trip and fetching its items
    const handleSelectTrip = async (id: string) => {
        const selected = trips.find((trip) => trip.id === id) || null;

        // Only update the state if the selected trip is different
        if (selectedTrip && selectedTrip.id === id) {
            return; // Prevent re-fetching the same trip
        }

        setSelectedTrip(selected); // Set the selected trip in state

        if (selected) {
            try {
                // Make the backend request only if the trip is selected
                const response = await Axios.get(`${LOCALHOST_URL}/${id}`);
                console.log('response data', response.data);

                // Set the items in the state
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

    const handleDeleteItem = async (tripId: string, itemId: string) => {
        console.log('handleDeleteItem', tripId, itemId);
        try {
            // Delete the item from the backend
            await Axios.delete(`${LOCALHOST_URL}/${tripId}/items/${itemId}`);

            // Update frontend state by removing the deleted item
            const updatedItems = items.filter((item) => item._id !== itemId);
            setItems(updatedItems); // Update the items state
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const handleEditItem = async (
        tripId: string,
        itemId: string,
        updatedItem: Partial<Item>,
    ) => {
        try {
            // Call the backend to update the item
            await Axios.put(
                `${LOCALHOST_URL}/${tripId}/items/${itemId}`,
                updatedItem,
            );

            console.log(updatedItem, 'is edited');

            // Update the frontend state with the updated item
            const updatedItems = items.map((item) =>
                item._id === itemId ? { ...item, ...updatedItem } : item,
            );
            setItems(updatedItems);
        } catch (error) {
            console.error('Error updating item:', error);
        }
    };

    const handleCategoryUpdate = async (original: string, updated: string) => {
        console.log('Updating items with new category:', { original, updated });

        try {
            // Update the backend with the new category
            await Axios.patch(
                `${LOCALHOST_URL}/${selectedTrip?._id}/categories`,
                {
                    oldCategory: original,
                    newCategory: updated,
                },
            );

            // Fetch the updated items from the backend
            if (selectedTrip) {
                const response = await Axios.get(
                    `${LOCALHOST_URL}/${selectedTrip._id}`,
                );
                const itemsWithId = response.data.items.map((item: Item) => ({
                    ...item,
                    id: item._id, // Map _id to id
                }));
                setItems(itemsWithId);
            }

            setUpdatedCategory(updated); // Update the state with the new category
        } catch (error) {
            console.error('Error updating category:', error);
        }
    };

    const handleCategoryDeleted = (deletedCategory: string) => {
        console.log('Category deleted:', deletedCategory);

        const updatedItems = items.map((item) =>
            item.category === deletedCategory
                ? { ...item, category: 'Uncategorized' } // Assign "Uncategorized"
                : item,
        );

        setItems(updatedItems);
    };

    return (
        <div>
            <TripForm onAddTrip={handleAddTrip} />
            <AllTripList
                trips={trips}
                onSelectTrip={(id) => handleSelectTrip(id)}
                onDeleteTrip={handleDeleteTrip}
                onEditTrip={handleEditTrip}
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
                    <PackingList
                        items={items}
                        id={selectedTrip._id}
                        updatedCategory={updatedCategory} // Pass the updated category to PackingList
                        onDeleteItem={(id) =>
                            handleDeleteItem(selectedTrip._id, id)
                        }
                        onEditItem={(id, updatedItem) => {
                            // Ensure that name, category, and quantity are defined before passing to handleEditItem
                            const completeItem = {
                                name: updatedItem.name || 'Default Name', // Provide a default value if undefined
                                category:
                                    updatedItem.category || 'Default Category', // Provide a default value if undefined
                                quantity: updatedItem.quantity || 1, // Provide a default value if undefined
                            };
                            handleEditItem(selectedTrip._id, id, completeItem);
                        }}
                    />
                    <ItemForm
                        onAddItem={handleAddItem}
                        id={selectedTrip._id}
                        onCategoryUpdate={handleCategoryUpdate}
                        handleCategoryDeleted={handleCategoryDeleted}
                    />
                </div>
            )}
        </div>
    );
};

export default TripPage;
