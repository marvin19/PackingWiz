import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface ItemFormProps {
    id: string;
    onAddItem: (item: {
        name: string;
        category: string;
        quantity: number;
    }) => void;
}

const LOCALHOST_URL = 'http://localhost:5001/api/packing-list';
const ItemForm = ({ onAddItem, id }: ItemFormProps): JSX.Element => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [quantity, setQuantity] = useState<number>(1);
    const [categories, setCategories] = useState<string[]>([]);
    const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
    const [isEditingCategories, setIsEditingCategories] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const sortCategories = (categories: string[]) => {
        return categories.sort((a, b) => a.localeCompare(b));
    };

    // Fetch existing categories from the database on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(
                    `${LOCALHOST_URL}/${id}/categories`,
                );

                if (Array.isArray(response.data.categories)) {
                    setCategories(sortCategories(response.data.categories));
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                setCategories([]); // Fallback to empty array if invalid data
            }
        };
        fetchCategories();
    }, [id]);

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;

        if (value === 'add-new-category') {
            setIsAddingNewCategory(true);
            setCategory('');
        } else {
            setCategory(value);
            setIsAddingNewCategory(false); // Reset new category state if a category is selected
        }
    };

    const handleNewCategoryChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setNewCategory(e.target.value);
    };

    const handleAddNewCategory = async () => {
        if (newCategory.trim() === '') return;

        // Frontend duplicate check
        if (categories.includes(newCategory)) {
            setErrorMessage('Category already exists');
            return;
        }

        try {
            await axios.put(`${LOCALHOST_URL}/${id}/categories`, {
                category: newCategory,
            });

            setCategories((prev) => sortCategories([...prev, newCategory]));
            setCategory(newCategory);
            setNewCategory('');
            setIsAddingNewCategory(false);
            setErrorMessage(null); // Clear error message on success
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 400) {
                // Set error message from backend
                setErrorMessage(
                    error.response.data.message || 'Error adding category',
                );
            } else {
                setErrorMessage('Unexpected error occurred. Please try again.');
                console.error('Error adding category:', error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validQuantity = Math.max(quantity || 1, 1);

        onAddItem({ name, category, quantity: validQuantity });

        // Reset form fields
        setName('');
        setCategory('');
        setQuantity(1); // Reset to default
        setNewCategory('');
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value; // Always a string

        if (value === '') {
            setQuantity(0); // Temporarily allow cleared input
        } else {
            const parsedValue = parseInt(value, 10);
            if (!isNaN(parsedValue)) {
                setQuantity(Math.max(parsedValue, 1)); // Ensure minimum value of 1
            }
        }
    };

    const handleSaveCategory = async (
        originalCategory: string,
        newCategory: string,
    ) => {
        if (originalCategory === newCategory) return; // No changes

        try {
            const response = await axios.put(
                `${LOCALHOST_URL}/${id}/categories/${originalCategory}`,
                { newCategory },
            );

            setCategories(response.data.categories);
        } catch (error) {
            console.error('Error saving category:', error);
        }
    };

    const handleDeleteCategory = async (categoryToDelete: string) => {
        try {
            const response = await axios.delete(
                `${LOCALHOST_URL}/${id}/categories/${categoryToDelete}`,
            );

            setCategories(response.data.categories);
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Add New Item</h2>
            <div>
                <label>Item name: </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Category: </label>
                <select
                    value={isAddingNewCategory ? 'add-new-category' : category}
                    onChange={handleCategoryChange}
                    required
                >
                    <option value="">- Select a category -</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                    <option value="add-new-category">+ Add new category</option>
                </select>
                <button
                    type="button"
                    onClick={() => {
                        setIsEditingCategories(true);
                    }}
                    style={{ marginLeft: '8px' }}
                >
                    - Edit categories
                </button>
                {isEditingCategories && (
                    <div style={{ marginTop: '16px' }}>
                        <h3>Edit Categories</h3>
                        {categories.map((cat, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '8px',
                                }}
                            >
                                <input
                                    ref={(el) => {
                                        inputRefs.current[cat] = el;
                                    }}
                                    type="text"
                                    value={categories[index]}
                                    onChange={(e) => {
                                        const updatedCategories = [
                                            ...categories,
                                        ];
                                        updatedCategories[index] =
                                            e.target.value;
                                        setCategories(updatedCategories);
                                    }}
                                    style={{ flex: '1', marginRight: '8px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleSaveCategory(
                                            cat,
                                            categories[index],
                                        )
                                    }
                                    style={{ marginRight: '8px' }}
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(cat)}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setIsEditingCategories(false)}
                            style={{ marginTop: '8px' }}
                        >
                            Done
                        </button>
                    </div>
                )}
                {isAddingNewCategory && (
                    <div style={{ marginTop: '8px' }}>
                        <input
                            type="text"
                            value={newCategory}
                            onChange={handleNewCategoryChange}
                            placeholder="Enter new category"
                        />
                        <button type="button" onClick={handleAddNewCategory}>
                            Add
                        </button>
                    </div>
                )}
                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            </div>
            <div>
                <label>Quantity: </label>
                <input
                    type="number"
                    value={quantity === 0 ? '' : quantity}
                    onChange={handleQuantityChange}
                    required
                    min="1"
                />
            </div>
            <button type="submit">Add Item</button>
        </form>
    );
};

export default ItemForm;
