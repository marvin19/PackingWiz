import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import CategoryEditor from './CategoryEditor';

interface ItemFormProps {
    id: string;
    onAddItem: (item: {
        name: string;
        category: string;
        quantity: number;
    }) => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ onAddItem, id }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [quantity, setQuantity] = useState<number>(1);
    const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [isEditingCategories, setIsEditingCategories] = useState(false);

    const {
        categories,
        tempCategories,
        setTempCategories,
        errorIndexes,
        addCategory,
        saveCategory,
        deleteCategory,
    } = useCategories(id);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddItem({ name, category, quantity });
        setName('');
        setCategory('');
        setQuantity(1);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Add New Item</h2>
            <div>
                <label>Item Name:</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Category:</label>
                <select
                    value={category}
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
                    Edit Categories
                </button>
            </div>
            {isAddingNewCategory && (
                <div style={{ marginTop: '8px' }}>
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Enter new category"
                    />
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await addCategory(newCategory);
                                setNewCategory('');
                                setIsAddingNewCategory(false);
                            } catch (error) {
                                console.error(error);
                            }
                        }}
                    >
                        Add
                    </button>
                </div>
            )}
            {isEditingCategories && (
                <CategoryEditor
                    tempCategories={tempCategories}
                    errorIndexes={errorIndexes}
                    onCategoryChange={(index, value) => {
                        const updatedCategories = [...tempCategories];
                        updatedCategories[index] = value;
                        setTempCategories(updatedCategories);
                    }}
                    onSave={saveCategory}
                    onDelete={deleteCategory}
                    onDone={() => setIsEditingCategories(false)}
                />
            )}
            <div>
                <label>Quantity:</label>
                <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, +e.target.value))}
                    required
                />
            </div>
            <button type="submit">Add Item</button>
        </form>
    );
};

export default ItemForm;
