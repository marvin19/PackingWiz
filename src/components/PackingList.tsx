import DeleteButton from './DeleteButton';

interface Item {
    _id: string;
    name: string;
    category: string;
    packed?: boolean;
    quantity: number;
}

interface PackingListProps {
    items: Item[];
    onDeleteItem: (id: string) => void;
}

const PackingList = ({
    items,
    onDeleteItem,
}: PackingListProps): JSX.Element => {
    return (
        <div>
            <h2>PackingList</h2>
            <ul>
                {items.map((item) => (
                    <li key={item._id}>
                        {item.name} - {item.category} (Qty: {item.quantity})
                        <DeleteButton onDelete={() => onDeleteItem(item._id)} />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PackingList;
