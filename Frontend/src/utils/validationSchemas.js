import { z } from 'zod';

// Helper functions for custom validations
const noUnderscores = (val) => !val.includes('_');
const onlyLettersAndSpaces = (val) => /^[a-zA-Z\s]+$/.test(val);
const safeTextPattern = (val) => /^[a-zA-Z0-9\s\-\.\,\:\(\)\!\?\'\"\n\r]+$/.test(val);
const safeTitlePattern = (val) => /^[a-zA-Z0-9\s\-\.\,\:\(\)]+$/.test(val);

// Course validation schema
export const courseSchema = z.object({
    title: z.string()
        .min(3, "Course title must be at least 3 characters long")
        .max(100, "Course title cannot exceed 100 characters")
        .refine(noUnderscores, "Course title cannot contain underscores")
        .refine(safeTitlePattern, "Course title can only contain letters, numbers, spaces, and basic punctuation (- . , : ( ))")
        .refine(val => val.trim().length > 0, "Course title cannot be empty or just spaces"),

    category: z.string()
        .min(1, "Please select a category"),

    description: z.string()
        .min(10, "Description must be at least 10 characters long")
        .max(1000, "Description cannot exceed 1000 characters")
        .refine(safeTextPattern, "Description contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed.")
        .refine(val => val.trim().length >= 10, "Description must have at least 10 meaningful characters"),

    price: z.string()
        .min(1, "Price is required")
        .refine(val => !isNaN(parseFloat(val)), "Price must be a valid number")
        .refine(val => parseFloat(val) > 0, "Price must be greater than 0")
        .refine(val => parseFloat(val) <= 100000, "Price cannot exceed ₹100,000"),

    offer_percentage: z.string()
        .optional()
        .default("")
        .refine(val => {
            if (!val || val === "") return true;
            const num = parseFloat(val);
            return !isNaN(num) && num >= 0 && num <= 90;
        }, "Offer percentage must be between 0 and 90"),

    course_thumbnail: z.string()
        .url("Invalid thumbnail URL")
        .min(1, "Please upload a course thumbnail")
});

// Lesson validation schema
export const lessonSchema = z.object({
    title: z.string()
        .min(3, "Lesson title must be at least 3 characters long")
        .max(100, "Lesson title cannot exceed 100 characters")
        .refine(noUnderscores, "Lesson title cannot contain underscores")
        .refine(safeTitlePattern, "Lesson title can only contain letters, numbers, spaces, and basic punctuation (- . , : ( ))")
        .refine(val => val.trim().length > 0, "Lesson title cannot be empty or just spaces"),

    description: z.string()
        .min(10, "Description must be at least 10 characters long")
        .max(500, "Description cannot exceed 500 characters")
        .refine(safeTextPattern, "Description contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed.")
        .refine(val => val.trim().length >= 10, "Description must have at least 10 meaningful characters"),

    duration: z.string()
        .optional()
        .refine(val => !val || /^(\d{1,2}:\d{2}|\d{1,3})\s*(minutes?|mins?|hours?|hrs?)?$/i.test(val),
            "Duration format should be like '15:30 minutes' or '90 minutes'"),

    videoFile: z.string()
        .url("Invalid video URL")
        .optional()
        .or(z.literal(""))
        .or(z.null()),

    pdfFile: z.string()
        .url("Invalid PDF URL")
        .optional()
        .or(z.literal(""))
        .or(z.null()),

    thumbnailFile: z.string()
        .url("Invalid thumbnail URL")
        .optional()
        .or(z.literal(""))
        .or(z.null())
});

// User registration validation schema
export const userRegistrationSchema = z.object({
    full_name: z.string()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name cannot exceed 50 characters")
        .refine(onlyLettersAndSpaces, "Name can only contain letters and spaces")
        .refine(val => val.trim().length >= 2, "Name cannot be empty or just spaces")
        .refine(val => !val.match(/\d/), "Name cannot contain numbers")
        .refine(val => !val.includes('_'), "Name cannot contain underscores")
        .refine(val => !/[^a-zA-Z\s]/.test(val), "Name can only contain letters and spaces"),

    email: z.string()
        .email("Please enter a valid email address")
        .min(1, "Email is required"),

    phone: z.string()
        .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number starting with 6-9")
        .length(10, "Phone number must be exactly 10 digits")
        .refine(val => /^\d+$/.test(val), "Phone number can only contain digits"),

    password: z.string()
        .min(8, "Password must be at least 8 characters long")
        .max(30, "Password cannot exceed 30 characters")
        .refine(val => /[a-z]/.test(val), "Password must contain at least one lowercase letter")
        .refine(val => /[A-Z]/.test(val), "Password must contain at least one uppercase letter")
        .refine(val => /\d/.test(val), "Password must contain at least one number")
        .refine(val => /[@$!%*?&]/.test(val), "Password must contain at least one special character (@$!%*?&)"),

    confirmPassword: z.string()
        .min(1, "Please confirm your password")
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});

// Login validation schema
export const loginSchema = z.object({
    email: z.string()
        .email("Please enter a valid email address")
        .min(1, "Email is required"),

    password: z.string()
        .min(1, "Password is required")
});

// Profile update validation schema
export const profileUpdateSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name cannot exceed 50 characters")
        .refine(onlyLettersAndSpaces, "Name can only contain letters and spaces")
        .refine(val => !val.match(/\d/), "Name cannot contain numbers")
        .refine(val => !val.includes('_'), "Name cannot contain underscores")
        .refine(val => !/[^a-zA-Z\s]/.test(val), "Name can only contain letters and spaces")
        .optional(),

    phone: z.string()
        .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number starting with 6-9")
        .length(10, "Phone number must be exactly 10 digits")
        .refine(val => /^\d+$/.test(val), "Phone number can only contain digits")
        .optional(),

    subjects: z.string()
        .max(200, "Subjects cannot exceed 200 characters")
        .refine(safeTitlePattern, "Subjects can only contain letters, numbers, spaces, and basic punctuation (- . , : ( ))")
        .refine(val => !val.includes('_'), "Subjects cannot contain underscores")
        .optional(),

    bio: z.string()
        .max(500, "Bio cannot exceed 500 characters")
        .refine(safeTextPattern, "Bio contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed.")
        .optional()
});

// Tutor registration validation schema
export const tutorRegistrationSchema = z.object({
    full_name: z.string()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name cannot exceed 50 characters")
        .refine(onlyLettersAndSpaces, "Name can only contain letters and spaces")
        .refine(val => val.trim().length >= 2, "Name cannot be empty or just spaces")
        .refine(val => !val.match(/\d/), "Name cannot contain numbers")
        .refine(val => !val.includes('_'), "Name cannot contain underscores")
        .refine(val => !/[^a-zA-Z\s]/.test(val), "Name can only contain letters and spaces"),

    email: z.string()
        .email("Please enter a valid email address")
        .min(1, "Email is required"),

    phone: z.string()
        .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number starting with 6-9")
        .length(10, "Phone number must be exactly 10 digits")
        .refine(val => /^\d+$/.test(val), "Phone number can only contain digits"),

    password: z.string()
        .min(8, "Password must be at least 8 characters long")
        .max(30, "Password cannot exceed 30 characters")
        .refine(val => /[a-z]/.test(val), "Password must contain at least one lowercase letter")
        .refine(val => /[A-Z]/.test(val), "Password must contain at least one uppercase letter")
        .refine(val => /\d/.test(val), "Password must contain at least one number")
        .refine(val => /[@$!%*?&]/.test(val), "Password must contain at least one special character (@$!%*?&)"),

    confirmPassword: z.string()
        .min(1, "Please confirm your password")
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});

// Admin login validation schema
export const adminLoginSchema = z.object({
    email: z.string()
        .email("Please enter a valid email address")
        .min(1, "Email is required"),

    password: z.string()
        .min(1, "Password is required")
});

// Contact form validation schema
export const contactSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name cannot exceed 50 characters")
        .refine(onlyLettersAndSpaces, "Name can only contain letters and spaces")
        .refine(val => !val.match(/\d/), "Name cannot contain numbers")
        .refine(val => val.trim().length >= 2, "Name cannot be empty or just spaces"),

    email: z.string()
        .email("Please enter a valid email address")
        .min(1, "Email is required"),

    subject: z.string()
        .min(5, "Subject must be at least 5 characters long")
        .max(100, "Subject cannot exceed 100 characters")
        .refine(safeTextPattern, "Subject contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed.")
        .refine(val => val.trim().length >= 5, "Subject must have at least 5 meaningful characters"),

    message: z.string()
        .min(10, "Message must be at least 10 characters long")
        .max(1000, "Message cannot exceed 1000 characters")
        .refine(safeTextPattern, "Message contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed.")
        .refine(val => val.trim().length >= 10, "Message must have at least 10 meaningful characters")
});

// Validation helper function
export const validateForm = (schema, data) => {
    try {
        const validatedData = schema.parse(data);
        return { isValid: true, errors: {}, data: validatedData };
    } catch (error) {
        if (error.errors) {
            const errors = {};
            error.errors.forEach(err => {
                const path = err.path.join('.');
                errors[path] = err.message;
            });
            return { isValid: false, errors, data: null };
        }
        return { isValid: false, errors: { general: "Validation failed" }, data: null };
    }
};

// Helper function for single field validation
export const validateField = (schema, fieldName, value) => {
    try {
        const fieldSchema = schema.shape[fieldName];
        if (fieldSchema) {
            fieldSchema.parse(value);
            return { isValid: true, error: null };
        }
        return { isValid: true, error: null };
    } catch (error) {
        let errorMessage = "Invalid value";
        
        if (error.errors && error.errors.length > 0) {
            // For price field, prioritize the most relevant error message
            if (fieldName === 'price') {
                if (!value || value.toString().trim() === '') {
                    errorMessage = "Price is required";
                } else if (isNaN(parseFloat(value))) {
                    errorMessage = "Price must be a valid number";
                } else if (parseFloat(value) <= 0) {
                    errorMessage = "Price must be greater than 0";
                } else if (parseFloat(value) > 100000) {
                    errorMessage = "Price cannot exceed ₹100,000";
                } else {
                    errorMessage = error.errors[0].message;
                }
            } else {
                // For other fields, use the first error message
                errorMessage = error.errors[0].message;
            }
        }
        
        return { isValid: false, error: errorMessage };
    }
};

// Helper function to validate specific field with full form context (for confirmPassword)
export const validateFieldWithContext = (schema, fieldName, value, formData) => {
    try {
        // For confirmPassword, we need to validate with the full form context
        if (fieldName === 'confirmPassword') {
            const tempData = { ...formData, [fieldName]: value };
            schema.parse(tempData);
            return { isValid: true, error: null };
        } else {
            return validateField(schema, fieldName, value);
        }
    } catch (error) {
        const fieldError = error.errors?.find(err => err.path.includes(fieldName));
        return { 
            isValid: false, 
            error: fieldError?.message || error.errors?.[0]?.message || "Invalid value" 
        };
    }
};