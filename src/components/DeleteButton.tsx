import React from 'react';

interface DeleteItemButtonProps {
    onDelete: () => void;
}

const DeleteItemButton = ({ onDelete }: DeleteItemButtonProps): JSX.Element => {
    return (
        <>
            <button
                className="delete-button"
                aria-label="Delete item"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(); // Trigger the deletion
                }}
            >
                X
            </button>
        </>
    );
};

export default DeleteItemButton;
