interface EditButtonProps {
    onEdit: () => void;
}

const EditButton = ({ onEdit }: EditButtonProps): JSX.Element => {
    return (
        <button
            className="edit-button"
            aria-label="Edit item"
            onClick={(e) => {
                e.stopPropagation();
                onEdit(); // Trigger the edit
            }}
        >
            Edit
        </button>
    );
};

export default EditButton;
