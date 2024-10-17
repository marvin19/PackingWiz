interface Item {
    _id: string;
    name: string;
    category: string;
    packed?: boolean;
    quantity: number;
}

interface PackingListProps {
    items: Item[];
}

const PackingList = ({ items }: PackingListProps): JSX.Element => {
    return (
        <div>
            <h2>PackingList</h2>
            <ul>
                {items.map((item) => (
                    <li key={item._id}>
                        {item.name} - {item.category} (Qty: {item.quantity})
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PackingList;
