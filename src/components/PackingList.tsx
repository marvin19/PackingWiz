import DeleteButton from './DeleteButton';
import EditButton from './EditButton';
import { useState } from 'react';
import { useInputValidation } from '../hooks/useInputValidation';
import { useCategories } from '../hooks/useCategories';
import SelectCategory from './SelectCategory';

interface Item {
    _id: string;
    name: string;
    category: string;
    packed?: boolean;
    quantity: number;
}

interface PackingListProps {
    items: Item[];
    id: string;
    updatedCategory: string | null;
    onDeleteItem: (id: string) => void;
    onEditItem: (id: string, updatedItem: Partial<Item>) => void;
}

const PackingList = ({
    items,
    id,
    onDeleteItem,
    onEditItem,
}: PackingListProps): JSX.Element => {
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editedItem, setEditedItem] = useState<Partial<Item>>({});

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
        </div>
    );
};

export default PackingList;
