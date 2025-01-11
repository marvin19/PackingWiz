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
    const [errorIndexes, setErrorIndexes] = useState<Record<number, string>>(
        {},
    );
    const [quantity, setQuantity] = useState<number>(1);
    const [categories, setCategories] = useState<string[]>([]);
    const [tempCategories, setTempCategories] = useState<string[]>([]);
    const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
    const [isEditingCategories, setIsEditingCategories] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const sortCategories = (categories: string[]) =>
        categories.sort((a, b) => a.localeCompare(b));

    // Fetch existing categories from the backend
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(
                    `${LOCALHOST_URL}/${id}/categories`,
                );
                const uniqueCategories: string[] = Array.from(
                    new Set(response.data.categories),
                );
                setCategories(sortCategories(uniqueCategories));
            } catch (error) {
                console.error('Error fetching categories:', error);
                setCategories([]);
            }
        };
        fetchCategories();
    }, [id]);

    useEffect(() => {
        if (isEditingCategories) {
            setTempCategories([...categories]); // Copy original categories into tempCategories
        }
    }, [isEditingCategories, categories]);

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;

        if (value === 'add-new-category') {
            setIsAddingNewCategory(true);
            setCategory('');
        } else {
            setCategory(value);
            setIsAddingNewCategory(false);
        }
    };

    const handleNewCategoryChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setNewCategory(e.target.value);
    };

    const handleAddNewCategory = async () => {
        if (newCategory.trim() === '') return;

        if (
            categories.some(
                (cat) => cat.toLowerCase() === newCategory.toLowerCase(),
            )
        ) {
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
            setErrorMessage(null);
        } catch (error) {
            setErrorMessage('Unexpected error occurred. Please try again.');
            console.error('Error adding category:', error);
        }
    };

    const handleSaveCategory = async (
        originalCategory: string,
        newCategory: string,
        index: number,
    ) => {
        if (originalCategory === newCategory) return;

        // Validate against original categories to avoid duplicate detection issues
        if (
            categories.some(
                (cat) =>
                    cat.toLowerCase() === newCategory.toLowerCase() &&
                    cat !== originalCategory,
            )
        ) {
            setErrorIndexes((prev) => ({
                ...prev,
                [index]: 'Category already exists',
            }));
            return;
        }

        try {
            const response = await axios.put(
                `${LOCALHOST_URL}/${id}/categories/${originalCategory}`,
                { newCategory },
            );

            const uniqueCategories: string[] = Array.from(
                new Set(response.data.categories),
            );
            setTempCategories(uniqueCategories); // Update tempCategories after successful save
            setErrorIndexes((prev) => {
                const updatedErrors = { ...prev };
                delete updatedErrors[index];
                return updatedErrors;
            });
        } catch (error) {
            console.error('Error saving category:', error);
        }
    };

    const handleDeleteCategory = async (categoryToDelete: string) => {
        try {
            await axios.delete(
                `${LOCALHOST_URL}/${id}/categories/${categoryToDelete}`,
            );

            const updatedCategories = tempCategories.filter(
                (cat) => cat !== categoryToDelete,
            );
            setTempCategories(updatedCategories);
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    const handleDoneEditing = () => {
        setCategories(sortCategories(tempCategories)); // Sort and update main categories
        setIsEditingCategories(false); // Exit edit mode
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validQuantity = Math.max(quantity || 1, 1);

        onAddItem({ name, category, quantity: validQuantity });

        setName('');
        setCategory('');
        setQuantity(1);
        setNewCategory('');
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (value === '') {
            setQuantity(0);
        } else {
            const parsedValue = parseInt(value, 10);
            if (!isNaN(parsedValue)) {
                setQuantity(Math.max(parsedValue, 1));
            }
        }
    };

    return (
        <form>
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
                    {categories.map((cat, index) => (
                        <option key={`${cat}-${index}`} value={cat}>
                            {cat}
                        </option>
                    ))}
                    <option value="add-new-category">+ Add new category</option>
                </select>

                <button
                    type="button"
                    onClick={() => setIsEditingCategories(true)}
                    style={{ marginLeft: '8px' }}
                >
                    Edit categories
                </button>
            </div>

            {isEditingCategories && (
                <div style={{ marginTop: '16px' }}>
                    <h3>Edit Categories</h3>
                    {tempCategories.map((cat, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '8px',
                                flexDirection: 'column',
                            }}
                        >
                            <input
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                value={tempCategories[index]}
                                onChange={(e) => {
                                    const updatedTempCategories = [
                                        ...tempCategories,
                                    ];
                                    updatedTempCategories[index] =
                                        e.target.value;
                                    setTempCategories(updatedTempCategories);

                                    setErrorIndexes((prev) => {
                                        const updatedErrors = { ...prev };
                                        delete updatedErrors[index];
                                        return updatedErrors;
                                    });
                                }}
                                style={{
                                    border: errorIndexes[index]
                                        ? '1px solid red'
                                        : '1px solid #ccc',
                                    marginBottom: '4px',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    handleSaveCategory(
                                        categories[index],
                                        tempCategories[index],
                                        index,
                                    )
                                }
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat)}
                            >
                                Delete
                            </button>
                            {errorIndexes[index] && (
                                <p
                                    style={{
                                        color: 'red',
                                        fontSize: '0.9rem',
                                        marginTop: '4px',
                                    }}
                                >
                                    {errorIndexes[index]}
                                </p>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleDoneEditing}
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

            {errorMessage && !isEditingCategories && (
                <p style={{ color: 'red' }}>{errorMessage}</p>
            )}

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
            <button type="submit" onClick={handleSubmit}>
                Add Item
            </button>
        </form>
    );
};

export default ItemForm;
