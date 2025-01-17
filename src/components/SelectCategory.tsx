import { useCategories } from '../hooks/useCategories';

interface SelectCategoryProps {
    category: string;
    id: string;
    onCategoryChange: (value: string) => void; // Add this prop
}

const SelectCategory = ({
    category,
    id,
    onCategoryChange,
}: SelectCategoryProps): JSX.Element => {
    const { categories, setIsAddingNewCategory } = useCategories(id);

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'add-new-category') {
            setIsAddingNewCategory(true);
            onCategoryChange(''); // Clear category in parent
        } else {
            onCategoryChange(value); // Notify parent
            setIsAddingNewCategory(false);
        }
    };

    return (
        <select value={category} onChange={handleCategoryChange} required>
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
    );
};

export default SelectCategory;
