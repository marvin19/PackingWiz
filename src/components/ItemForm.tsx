import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import CategoryEditor from './CategoryEditor';
import { useInputValidation } from '../hooks/useInputValidation';

interface ItemFormProps {
    id: string;
    onAddItem: (item: {
        name: string;
        category: string;
        quantity: number;
    }) => void;
    onCategoryUpdate: (original: string, updated: string) => void;
    handleCategoryDeleted: (category: string) => void;
}

const ItemForm: React.FC<ItemFormProps> = ({
    onAddItem,
    id,
    onCategoryUpdate,
    handleCategoryDeleted,
}) => {
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

    const { inputErrors, validateInput } = useInputValidation();

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
                    onChange={(e) => {
                        if (validateInput(0, e.target.value)) {
                            setName(e.target.value);
                        }
                    }}
                    required
                    style={{
                        border: inputErrors[0]
                            ? '1px solid red'
                            : '1px solid #ccc',
                        marginBottom: '4px',
                    }}
                />
                {inputErrors[0] && (
                    <p style={{ color: 'red', fontSize: '0.9rem' }}>
                        {inputErrors[0]}
                    </p>
                )}
            </div>
            <div>
                <label>Category:</label>
                <select
                    value={category}
                    onChange={handleCategoryChange}
                    required
                >
                    <option value="">- Select a category -</option>
                    {categories
                        .filter((cat) => cat !== 'Uncategorized') // Exclude "Uncategorized"
                        .map((cat, index) => (
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
                        onChange={(e) => {
                            if (validateInput(1, e.target.value)) {
                                setNewCategory(e.target.value);
                            }
                        }}
                        placeholder="Enter new category"
                        style={{
                            border: inputErrors[1]
                                ? '1px solid red'
                                : '1px solid #ccc',
                            marginBottom: '4px',
                        }}
                    />
                    {inputErrors[1] && (
                        <p style={{ color: 'red', fontSize: '0.9rem' }}>
                            {inputErrors[1]}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                const addedCategory =
                                    await addCategory(newCategory); // Add and retrieve the new category
                                setCategory(addedCategory); // Set the new category as selected
                                setNewCategory(''); // Clear the input field
                                setIsAddingNewCategory(false); // Close the "Add new category" UI
                            } catch (error) {
                                console.error(error);
                            }
                        }}
                        disabled={!!inputErrors[1]} // Disable add button if there's an input error
                    >
                        Add
                    </button>
                </div>
            )}
            {isEditingCategories && (
                <CategoryEditor
                    categories={categories}
                    tempCategories={tempCategories}
                    errorIndexes={errorIndexes}
                    onCategoryChange={(index, value) => {
                        const updatedCategories = [...tempCategories];
                        updatedCategories[index] = value;
                        setTempCategories(updatedCategories);
                    }}
                    onSave={(original, updated, index) => {
                        saveCategory(
                            original,
                            updated,
                            index,
                            onCategoryUpdate,
                        );
                    }}
                    onDelete={(category) => {
                        deleteCategory(category, handleCategoryDeleted); // Pass the callback
                    }}
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
