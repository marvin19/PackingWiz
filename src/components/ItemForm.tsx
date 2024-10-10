import { useState } from 'react'

interface ItemFormProps {
    onAddItem: (item: { name: string; category: string; quantity: number }) => void;
}

const ItemForm = ({ onAddItem }: ItemFormProps): JSX.Element => {

    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [quantity, setQuantity] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddItem({ name, category, quantity});
        setName('');
        setCategory('');
        setQuantity(1);
    }


  return (
    <form onSubmit={handleSubmit}>
        <h2>Add or Edit Item</h2>
        <div>
            <label>Item name: </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required/>
        </div>
        <div>
            <label>Category: </label>
            <input type="text" value={category} onChange={e => setCategory(e.target.value)} required/>
        </div>
        <div>
            <label>Quantity: </label>
            <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} required/>
        </div>
        <button type="submit">Add Item</button>
    </form>
  )
}

export default ItemForm