import { useState, useEffect } from 'react';
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
    const [newCategory, setNewCategory] = useState('');

    // Fetch existing categories from the database on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(
                    `${LOCALHOST_URL}/${id}/categories`,
                );

                if (Array.isArray(response.data.categories)) {
                    setCategories(response.data.categories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                setCategories([]); // Fallback to empty array if invalid data
            }
        };
        fetchCategories();
    }, [id]);

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCategory(e.target.value);
        setIsAddingNewCategory(false); // Reset new category state if a category is selected
    };

    const handleNewCategoryChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setNewCategory(e.target.value);
    };

    const handleAddNewCategory = async () => {
        if (newCategory.trim() === '') return;

        try {
            await axios.put(`${LOCALHOST_URL}/${id}/categories`, {
                category: newCategory,
            });
            const addedCategory = newCategory; // Use the submitted category name
            setCategories((prev) => [...prev, addedCategory]);
            setCategory(addedCategory);
            setNewCategory('');
            setIsAddingNewCategory(false);
        } catch (error) {
            console.error('Error adding category:', error);
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
                    value={category}
                    onChange={handleCategoryChange}
                    required
                >
                    <option value="">- Select a category -</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                    <option value="uncategorized">Uncategorized</option>
                </select>
                <button
                    type="button"
                    onClick={() => setIsAddingNewCategory(true)}
                >
                    Add new category
                </button>
                {isAddingNewCategory && (
                    <div style={{ display: 'inline-block', marginLeft: '8px' }}>
                        <input
                            type="text"
                            value={newCategory}
                            onChange={handleNewCategoryChange}
                        />
                        <button type="button" onClick={handleAddNewCategory}>
                            Add to categories
                        </button>
                    </div>
                )}
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
