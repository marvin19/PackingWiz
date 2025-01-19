import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import CategoryEditor from './CategoryEditor';
import SelectCategory from './SelectCategory';
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
    const [quantity, setQuantity] = useState<number>(1);

    const {
        category,
        categories,
        tempCategories,
        setTempCategories,
        errorIndexes,
        addCategory,
        saveCategory,
        deleteCategory,
        isAddingNewCategory,
        setIsAddingNewCategory,
        newCategory,
        setNewCategory,
        setCategory,
        isEditingCategories,
        setIsEditingCategories,
    } = useCategories(id);

    const { inputErrors, validateInput } = useInputValidation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddItem({ name, category, quantity });
        setName('');
        setCategory('');
        setQuantity(1);
    };

    return (
        <form onSubmit={handleSubmit}>
            {!isEditingCategories && (
                <div className="hide">
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
                        <SelectCategory
                            category={category}
                            id={id}
                            onCategoryChange={(value) => setCategory(value)}
                            onAddNewCategory={(isAdding) =>
                                setIsAddingNewCategory(isAdding)
                            }
                            key={categories.join(',')} // Ensure updates trigger a re-render
                        />
                        <button
                            type="button"
                            onClick={() => setIsEditingCategories(true)}
                            style={{ marginLeft: '8px' }}
                        >
                            Edit Categories
                        </button>
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
                                    <p
                                        style={{
                                            color: 'red',
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        {inputErrors[1]}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            if (!newCategory.trim()) {
                                                throw new Error(
                                                    'Category name cannot be empty.',
                                                );
                                            }
                                            const addedCategory =
                                                await addCategory(newCategory);
                                            setCategory(addedCategory); // Update the selected category
                                            setNewCategory(''); // Clear the input field
                                            setIsAddingNewCategory(false); // Close the input field
                                        } catch (error) {
                                            console.error(
                                                'Error adding category:',
                                                error.message,
                                            );
                                        }
                                    }}
                                    disabled={
                                        !!inputErrors[1] || !newCategory.trim()
                                    } // Disable the button for errors or empty input
                                >
                                    Add
                                </button>
                            </div>
                        )}
                    </div>
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
            {!isEditingCategories && (
                <div className="hide">
                    <div>
                        <label>Quantity:</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(Math.max(1, +e.target.value))
                            }
                            required
                        />
                    </div>
                    <button type="submit">Add Item</button>
                </div>
            )}
        </form>
    );
};

export default ItemForm;
