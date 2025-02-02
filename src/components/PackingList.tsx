import DeleteButton from './DeleteButton';
import EditButton from './EditButton';
import { useState } from 'react';
import { useInputValidation } from '../hooks/useInputValidation';
import { useCategories } from '../hooks/useCategories';
import SelectCategory from './SelectCategory';
import Axios from 'axios';

interface Item {
    _id: string;
    name: string;
    category: string;
    packed?: boolean;
    quantity: number;
}

interface WeatherData {
    daily: Array<{
        dt: number;
        temp: { day: number };
        weather: Array<{ description: string }>;
        humidity: number;
    }>;
}

interface Trip {
    _id: string; // MongoDB ID
    id: string; // Frontend ID
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    tags: string[];
    daysGone?: number;
    weather?: WeatherData | null;
}

interface PackingListProps {
    items: Item[];
    setItems: (items: Item[]) => void;
    id: string;
    updatedCategory: string | null;
    selectedTrip: Trip | null;
    onDeleteItem: (id: string) => void;
    onEditItem: (id: string, updatedItem: Partial<Item>) => void;
}

const PackingList = ({
    items,
    setItems,
    id,
    selectedTrip,
    onDeleteItem,
    onEditItem,
}: PackingListProps): JSX.Element => {
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editedItem, setEditedItem] = useState<Partial<Item>>({});
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [aiResponse, setAiResponse] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const { inputErrors, validateInput, successMessages, setSuccessMessage } =
        useInputValidation();

    const { categories, setIsAddingNewCategory } = useCategories(id);

    const handleEditClick = (item: Item) => {
        setEditingItemId(item._id);
        // Add current values to input fields
        setEditedItem({ ...item });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedItem((prev) => ({
            ...prev,
            [name]: name === 'quantity' ? Number(value) : value,
        }));
    };

    const handleUpdateClick = (id: string, index: number) => {
        onEditItem(id, editedItem); // Call function passed down from the parent
        setEditingItemId(null); // Exit edit mode
        setSuccessMessage(index, 'Item edited successfully');
    };

    const handleGeneratePackingList = async () => {
        if (!selectedTrip) {
            console.error('No trip selected');
            return;
        }

        setIsChatOpen(true); // Ensure the AI section is open
        setIsLoading(true);

        try {
            const response = await Axios.post(
                'http://localhost:8000/generate_packing_list',
                {
                    trip_name: selectedTrip.name,
                    destination: selectedTrip.destination,
                    days_gone: selectedTrip.daysGone ?? 1,
                    tags: selectedTrip.tags ?? [],
                    items: items.map((item) => item.name),
                    weather: selectedTrip.weather ?? [],
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            console.log('✅ AI Response Received:', response.data);

            // Make sure the response is not null before setting it
            if (response.data) {
                setAiResponse(response.data);
            } else {
                setAiResponse('<p>Failed to generate packing list.</p>');
            }
        } catch (error) {
            console.error('❌ Error generating packing list:', error);
            setAiResponse('<p>Error: Failed to generate packing list.</p>');
        } finally {
            setIsLoading(false);
        }
    };

    const parseAiResponse = (htmlString: string) => {
        const tempElement = document.createElement('div');
        tempElement.innerHTML = htmlString;

        const items: { name: string; category: string; quantity: number }[] =
            [];

        tempElement.querySelectorAll('li').forEach((li) => {
            const match = li.textContent?.match(/(.+) - (.+) \(Qty: (\d+)\)/);
            if (match) {
                items.push({
                    name: match[1].trim(),
                    category: match[2].trim(),
                    quantity: parseInt(match[3], 10),
                });
            }
        });

        return items;
    };

    const handleAddSuggestedItems = async () => {
        if (!selectedTrip) {
            console.error('❌ No trip selected');
            return;
        }

        try {
            // ✅ Step 1: Parse the AI-generated HTML list into structured objects
            const suggestedItems = parseAiResponse(aiResponse);

            if (!suggestedItems.length) {
                console.error('❌ No suggested items found.');
                return;
            }

            console.log('📌 Parsed AI Suggestions:', suggestedItems);

            // ✅ Step 2: Ensure no empty `_id` fields exist before sending data
            const itemsToSend = suggestedItems;

            console.log('📌 Cleaned Items to Send:', itemsToSend);

            // ✅ Step 3: Send items to the backend
            const response = await Axios.put(
                `http://localhost:5001/api/packing-list/${selectedTrip._id}/items`,
                { items: itemsToSend },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            console.log(
                '✅ Suggested items added successfully!',
                response.data,
            );

            // Update frontend state with new items
            // @ts-expect-error TODO: Fix this
            setItems((prevItems: Item[]) => {
                return [...(prevItems || []), ...response.data.items];
            });
        } catch (error) {
            console.error('❌ Error adding suggested items:', error);
        }
    };

    return (
        <div>
            <h2>Packing List</h2>
            <ul>
                {items.map((item, index) => (
                    <li key={item._id}>
                        {editingItemId === item._id ? (
                            <>
                                <input
                                    type="text"
                                    name="name"
                                    value={editedItem.name || ''}
                                    onChange={(e) => {
                                        if (
                                            validateInput(index, e.target.value)
                                        ) {
                                            handleInputChange(e);
                                        }
                                    }}
                                    style={{
                                        border: inputErrors[index]
                                            ? '1px solid red'
                                            : '1px solid #ccc',
                                        marginBottom: '4px',
                                    }}
                                />
                                {inputErrors[index] && (
                                    <p
                                        style={{
                                            color: 'red',
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        {inputErrors[index]}
                                    </p>
                                )}
                                {successMessages[index] && (
                                    <p
                                        style={{
                                            color: 'green',
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        {successMessages[index]}
                                    </p>
                                )}
                                <SelectCategory
                                    category={
                                        editedItem.category || item.category
                                    }
                                    id={id}
                                    onCategoryChange={(value) =>
                                        setEditedItem((prev) => ({
                                            ...prev,
                                            category: value,
                                        }))
                                    }
                                    onAddNewCategory={(isAdding) =>
                                        setIsAddingNewCategory(isAdding)
                                    }
                                    key={categories.join(',')} // Ensure updates trigger a re-render
                                    allowAddNewCategory={false}
                                />
                                <input
                                    type="number"
                                    name="quantity"
                                    value={editedItem.quantity || 1}
                                    onChange={handleInputChange}
                                />
                                <button
                                    onClick={() =>
                                        handleUpdateClick(item._id, index)
                                    }
                                >
                                    Update
                                </button>
                            </>
                        ) : (
                            <>
                                {item.name} - {item.category} (Qty:{' '}
                                {item.quantity})
                                <EditButton
                                    onEdit={() => handleEditClick(item)}
                                />
                            </>
                        )}
                        <DeleteButton onDelete={() => onDeleteItem(item._id)} />
                    </li>
                ))}
            </ul>
            <button onClick={handleGeneratePackingList}>
                Generate packing list
            </button>

            {isChatOpen && (
                <div>
                    <h3>AI Suggestions:</h3>
                    {isLoading ? (
                        <p>Generating...</p>
                    ) : (
                        <div>
                            <div
                                dangerouslySetInnerHTML={{ __html: aiResponse }}
                            />
                            <button onClick={handleAddSuggestedItems}>
                                Add suggested items to packing list
                            </button>
                            <button>
                                Tweak packing list with PackingWiz 🪄
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PackingList;
