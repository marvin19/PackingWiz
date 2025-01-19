import { useState, useEffect } from 'react';
import axios from 'axios';

const LOCALHOST_URL = 'http://localhost:5001/api/packing-list';
export const useCategories = (id: string) => {
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [tempCategories, setTempCategories] = useState<string[]>([]);
    const [errorIndexes, setErrorIndexes] = useState<Record<number, string>>(
        {},
    );
    const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [isEditingCategories, setIsEditingCategories] = useState(false);

    const sortCategories = (categories: string[]) =>
        categories.sort((a, b) => a.localeCompare(b));

    useEffect(() => {
        setTempCategories([...categories]);
    }, [categories]);

    // Fetch existing categories from the backend
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(
                    `${LOCALHOST_URL}/${id}/categories`,
                );
                const uniqueCategories: string[] = Array.from(
                    new Set(response.data.categories),
                );
                setCategories(sortCategories(uniqueCategories));
            } catch (error) {
                console.error('Error fetching categories:', error);
                setCategories([]);
            }
        };
        fetchCategories();
    }, [id]);

    const addCategory = async (newCategory: string): Promise<string> => {
        if (!newCategory.trim()) {
            throw new Error('Category cannot be empty');
        }

        if (
            categories.some(
                (cat) => cat.toLowerCase() === newCategory.toLowerCase(),
            )
        ) {
            throw new Error('Category already exists');
        }

        try {
            const response = await axios.put(
                `${LOCALHOST_URL}/${id}/categories`,
                { category: newCategory },
            );

            const updatedCategories = response.data.categories || [];
            setCategories(sortCategories(updatedCategories)); // Ensure state updates
            console.log('Updated categories:', updatedCategories); // Debug log
            return newCategory; // Return the new category for selection
        } catch (error) {
            console.error('Error adding category:', error);
            throw new Error('Error adding category');
        }
    };

    const saveCategory = async (
        originalCategory: string,
        newCategory: string,
        index: number,
        onCategoryUpdate: (original: string, updated: string) => void,
    ) => {
        try {
            await axios.put(
                `${LOCALHOST_URL}/${id}/categories/${encodeURIComponent(
                    originalCategory,
                )}`,
                { newCategory },
            );

            await axios.patch(`${LOCALHOST_URL}/${id}/categories`, {
                oldCategory: originalCategory,
                newCategory,
            });

            onCategoryUpdate(originalCategory, newCategory);

            setErrorIndexes((prev) => {
                const updatedErrors = { ...prev };
                delete updatedErrors[index];
                return updatedErrors;
            });
        } catch (error) {
            console.error('Error saving category:', error);
        }
    };

    const deleteCategory = async (
        categoryToDelete: string,
        onCategoryDeleted: (deletedCategory: string) => void,
    ) => {
        try {
            await axios.delete(
                `${LOCALHOST_URL}/${id}/categories/${categoryToDelete}`,
            );

            const updatedCategories = tempCategories.filter(
                (cat) => cat !== categoryToDelete,
            );
            setTempCategories(updatedCategories);
            setCategories(updatedCategories);

            onCategoryDeleted(categoryToDelete);
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    return {
        category,
        categories,
        tempCategories,
        setCategory,
        setTempCategories,
        errorIndexes,
        addCategory,
        saveCategory,
        deleteCategory,
        sortCategories,
        isAddingNewCategory,
        setIsAddingNewCategory,
        newCategory,
        setNewCategory,
        isEditingCategories,
        setIsEditingCategories,
    };
};
