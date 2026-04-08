import { useState, type ChangeEvent } from "react";

export const useForm = <T extends Record<string, string>>(initialValues: T) => {
    const [values, setValues] = useState(initialValues);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setValues({ ...values, [name]: value });
    };

    const isEmailValid = /\S+@\S+\.\S+/.test(values.email);
    const isPasswordValid = values.password.length >= 8;
    const isFormValid = isEmailValid && isPasswordValid;

    return {
        values,
        handleChange,
        isEmailValid,
        isPasswordValid,
        isFormValid,
    };
};