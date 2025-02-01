import { useState, useEffect, useCallback } from 'react';
import { calculateDaysGone } from '../utils/utilities';
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
    tags: string[];
}

interface WeatherData {
    current: {
        temp: number;
        humidity: number;
        weather: { description: string }[];
    };
    daily: Array<{
        dt: number;
        temp: { day: number };
        weather: { description: string }[];
        humidity: number;
    }>;
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
    const [weather, setWeather] = useState<WeatherData | null>(null);

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

    const daysUntilTripStart = (startDate: string): number => {
        const today = new Date();
        const tripStart = new Date(startDate);
        return Math.ceil(
            (tripStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
    };

    // Fetch weather data
    const fetchWeatherForTrip = useCallback(async (trip: Trip) => {
        const latLon = getLatLon(trip.destination);
        if (!latLon) {
            console.error(
                'Coordinates not found for destination:',
                trip.destination,
            );
            return;
        }

        const { latitude, longitude } = latLon;
        try {
            const response = await Axios.get(
                'http://localhost:5001/api/weather',
                {
                    params: { lat: latitude, lon: longitude },
                },
            );

            const weatherData = response.data;

            // Filter daily forecast for the trip dates
            const tripStart = new Date(trip.startDate).getTime();
            const tripEnd = new Date(trip.endDate).getTime();
            const filteredDaily = weatherData.daily.filter(
                (day: { dt: number }) => {
                    const forecastDate = new Date(day.dt * 1000).getTime(); // Convert UNIX timestamp to milliseconds
                    return forecastDate >= tripStart && forecastDate <= tripEnd;
                },
            );

            setWeather({ ...weatherData, daily: filteredDaily }); // Save filtered daily data
        } catch (error) {
            console.error('Error fetching weather data:', error);
        }
    }, []);

    // Automatically fetch weather data if the trip is 7 days away
    useEffect(() => {
        if (
            selectedTrip &&
            daysUntilTripStart(selectedTrip.startDate) <= 7 &&
            !weather
        ) {
            fetchWeatherForTrip(selectedTrip);
        }
    }, [selectedTrip, weather, fetchWeatherForTrip]);

    const handleAddTrip = async (trip: {
        name: string;
        destination: string;
        startDate: string;
        endDate: string;
        tags: string[];
    }) => {
        try {
            const response = await Axios.post(LOCALHOST_URL, {
                name: trip.name,
                destination: trip.destination,
                startDate: trip.startDate,
                endDate: trip.endDate,
                tags: trip.tags,
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
            tags: updatedTrip.tags ?? existingTrip.tags, // Ensure tags are updated
        };

        try {
            console.log('CompleteTrip', completeTrip);
            const response = await Axios.put(
                `${LOCALHOST_URL}/${id}`,
                completeTrip,
            );

            console.log('Trip updated successfully:', response.data);

            // Update frontend state with the modified trip
            const updatedTrips = trips.map((trip) =>
                trip.id === id ? { ...trip, ...response.data } : trip,
            );
            setTrips(updatedTrips);

            // Refetch the updated trip to ensure data is up-to-date
            await handleSelectTrip(id);
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
        const selected = trips.find((trip) => trip.id === id) || null; // Default to null if not found

        // Fetch weather data if the trip is found
        if (selected) {
            const latLon = getLatLon(selected.destination);
            if (latLon) {
                const { latitude, longitude } = latLon;
                const weatherData = await fetchWeatherData(latitude, longitude);
                if (weatherData) {
                    setWeather(weatherData);
                }
            } else {
                console.error(
                    `Coordinates not found for destination: ${selected.destination}`,
                );
            }
        }

        // Prevent re-fetching the same trip
        if (selectedTrip && selectedTrip.id === id) {
            return;
        }

        setSelectedTrip(selected); // Set the selected trip or null
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

    const fetchWeatherData = async (lat: number, lon: number) => {
        try {
            const response = await Axios.get(
                'http://localhost:5001/api/weather',
                {
                    params: {
                        lat,
                        lon,
                    },
                },
            );

            const weatherData = response.data;
            console.log('Weather data fetched: ', weatherData);
            return weatherData;
        } catch (error) {
            console.error('Error fetching weather data:', error);
        }
    };

    const getLatLon = (
        destination: string,
    ): { latitude: number; longitude: number } => {
        // Use a geocoding API to get the latitude and longitude
        // For now, return a default value
        const destinations: Record<
            string,
            { latitude: number; longitude: number }
        > = {
            Sevilla: { latitude: 37.3886, longitude: -5.9823 },
            Athens: { latitude: 37.9838, longitude: 23.7275 },
            Berlin: { latitude: 52.52, longitude: 13.405 },
            Valencia: { latitude: 39.4699, longitude: -0.3763 },
            Oslo: { latitude: 59.9139, longitude: 10.7522 },
            London: { latitude: 51.5074, longitude: -0.1278 },
        };
        return destinations[destination] || { latitude: 0, longitude: 0 };
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
                        daysGone={calculateDaysGone(
                            selectedTrip.startDate,
                            selectedTrip.endDate,
                        )}
                        weather={weather}
                        daysUntilTripStart={daysUntilTripStart(
                            selectedTrip.startDate,
                        )}
                    />
                    {daysUntilTripStart(selectedTrip.startDate) > 7 && (
                        <p>
                            Weather forecast will be available 7 days prior to
                            your trip
                        </p>
                    )}
                    <PackingList
                        items={items}
                        id={selectedTrip._id}
                        selectedTrip={selectedTrip}
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
