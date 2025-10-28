import { useState } from 'react';
import { validateForm, validateField } from '../utils/validationSchemas';

export const useFormValidation = (schema, initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate single field with Zod
    const fieldValidation = validateField(schema, name, values[name]);
    if (!fieldValidation.isValid) {
      setErrors(prev => ({
        ...prev,
        [name]: fieldValidation.error
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validate = () => {
    const validation = validateForm(schema, values);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return { isValid: false, data: null };
    }

    setErrors({});
    return { isValid: true, data: validation.data };
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  const getFieldProps = (name) => ({
    name,
    value: values[name] || '',
    onChange: handleChange,
    onBlur: handleBlur,
    className: `${errors[name] && touched[name] ? 'border-red-500' : 'border-gray-300'}`
  });

  const getFieldError = (name) => {
    return errors[name] && touched[name] ? errors[name] : null;
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    getFieldProps,
    getFieldError,
    setValues,
    setErrors,
    setTouched
  };
};