import React from 'react';
import { useInputValidation } from '../hooks/useInputValidation';

interface CategoryEditorProps {
    tempCategories: string[];
    categories: string[];
    errorIndexes: Record<number, string>;
    onCategoryChange: (index: number, value: string) => void;
    onSave: (original: string, updated: string, index: number) => void;
    onDelete: (category: string) => void;
    onDone: () => void;
}

const CategoryEditor: React.FC<CategoryEditorProps> = ({
    tempCategories,
    categories,
    errorIndexes,
    onCategoryChange,
    onSave,
    onDelete,
    onDone,
}) => {
    const { inputErrors, validateInput } = useInputValidation();

    const handleInputChange = (index: number, value: string) => {
        if (validateInput(index, value)) {
            onCategoryChange(index, value); // Call the prop function only if the input is valid
        }
    };

    return (
        <div style={{ marginTop: '16px' }}>
            <h3>Edit Categories</h3>
            {tempCategories.map((cat, index) => (
                <div
                    key={index}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        marginBottom: '8px',
                    }}
                >
                    <input
                        type="text"
                        value={cat}
                        onChange={(e) =>
                            handleInputChange(index, e.target.value)
                        }
                        style={{
                            border:
                                errorIndexes[index] || inputErrors[index]
                                    ? '1px solid red'
                                    : '1px solid #ccc',
                            marginBottom: '4px',
                        }}
                    />
                    {inputErrors[index] && (
                        <p style={{ color: 'red', fontSize: '0.9rem' }}>
                            {inputErrors[index]}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            onSave(categories[index], cat, index);
                        }}
                        disabled={!!inputErrors[index]} // Disable save button if there's an input error
                    >
                        Save
                    </button>
                    <button type="button" onClick={() => onDelete(cat)}>
                        Delete
                    </button>
                    {errorIndexes[index] && (
                        <p style={{ color: 'red', fontSize: '0.9rem' }}>
                            {errorIndexes[index]}
                        </p>
                    )}
                </div>
            ))}
            <button type="button" onClick={onDone} style={{ marginTop: '8px' }}>
                Done
            </button>
        </div>
    );
};

export default CategoryEditor;
