import { useState } from 'react';

export const useInputValidation = () => {
    const [inputErrors, setInputErrors] = useState<Record<number, string>>({});
    const [successMessages, setSuccessMessages] = useState<
        Record<number, string>
    >({});

    const validateInput = (index: number, value: string) => {
        const regex = /^[A-Za-z\s]*$/; // Only allow alphabetic characters and spaces
        if (!regex.test(value)) {
            setInputErrors((prev) => ({
                ...prev,
                [index]: 'Numbers or special characters are not allowed',
            }));
            return false;
        } else {
            setInputErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[index];
                return newErrors;
            });
            return true;
        }
    };

    const setSuccessMessage = (index: number, message: string) => {
        setSuccessMessages((prev) => ({
            ...prev,
            [index]: message,
        }));
        setTimeout(() => {
            setSuccessMessages((prev) => {
                const newMessages = { ...prev };
                delete newMessages[index];
                return newMessages;
            });
        }, 3000); // Clear the message after 3 seconds
    };

    return { inputErrors, validateInput, successMessages, setSuccessMessage };
};
