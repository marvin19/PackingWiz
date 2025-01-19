import { useCategories } from '../hooks/useCategories';

interface SelectCategoryProps {
    category: string;
    id: string;
    onCategoryChange: (value: string) => void; // Add this prop
    onAddNewCategory: (value: boolean) => void; // Add this prop
    allowAddNewCategory?: boolean;
}

const SelectCategory = ({
    category,
    id,
    onCategoryChange,
    onAddNewCategory,
    allowAddNewCategory = true,
}: SelectCategoryProps): JSX.Element => {
    const { categories } = useCategories(id); // Fetch categories, but avoid state conflicts

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'add-new-category' && allowAddNewCategory) {
            onAddNewCategory(true); // Notify parent to display "Add New Category" UI
            onCategoryChange(''); // Clear the category
        } else {
            onAddNewCategory(false); // Hide the "Add New Category" UI
            onCategoryChange(value); // Notify parent about the selected category
        }
    };

    return (
        <select
            key={categories.join(',')} // Force re-render if categories change
            value={category}
            onChange={handleCategoryChange}
            required
        >
            <option value="">- Select a category -</option>
            {categories
                .filter((cat) => cat !== 'Uncategorized')
                .map((cat, index) => (
                    <option key={`${cat}-${index}`} value={cat}>
                        {cat}
                    </option>
                ))}
            {allowAddNewCategory && (
                <option value="add-new-category">+ Add new category</option>
            )}
        </select>
    );
};
export default SelectCategory;
