import DeleteButton from './DeleteButton';
import EditButton from './EditButton';
import { useState } from 'react';

interface Item {
    _id: string;
    name: string;
    category: string;
    packed?: boolean;
    quantity: number;
}

interface PackingListProps {
    items: Item[];
    onDeleteItem: (id: string) => void;
    onEditItem: (id: string, updatedItem: Partial<Item>) => void;
}

const PackingList = ({
    items,
    onDeleteItem,
    onEditItem,
}: PackingListProps): JSX.Element => {
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editedItem, setEditedItem] = useState<Partial<Item>>({});

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

    const handleUpdateClick = (id: string) => {
        onEditItem(id, editedItem); // Call function passed down from the parent
        setEditingItemId(null); // Exit edit mode
    };

    return (
        <div>
            <h2>Packing List</h2>
            <ul>
                {items.map((item) => (
                    <li key={item._id}>
                        {editingItemId === item._id ? (
                            <>
                                <input
                                    type="text"
                                    name="name"
                                    value={editedItem.name || ''}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="text"
                                    name="category"
                                    value={editedItem.category || ''}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="number"
                                    name="quantity"
                                    value={editedItem.quantity || 1}
                                    onChange={handleInputChange}
                                />
                                <button
                                    onClick={() => handleUpdateClick(item._id)}
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
        </div>
    );
};

export default PackingList;
