import React from 'react';

interface CategoryEditorProps {
    tempCategories: string[];
    errorIndexes: Record<number, string>;
    onCategoryChange: (index: number, value: string) => void;
    onSave: (original: string, updated: string, index: number) => void;
    onDelete: (category: string) => void;
    onDone: () => void;
}

const CategoryEditor: React.FC<CategoryEditorProps> = ({
    tempCategories,
    errorIndexes,
    onCategoryChange,
    onSave,
    onDelete,
    onDone,
}) => {
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
                            onCategoryChange(index, e.target.value)
                        }
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
                            onSave(cat, tempCategories[index], index)
                        }
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
