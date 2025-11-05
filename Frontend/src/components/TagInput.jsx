import { useState } from 'react';
import { X } from 'lucide-react';

const TagInput = ({ tags = [], onChange, placeholder = "Add a tag...", disabled = false, maxTags = 10 }) => {
    const [inputValue, setInputValue] = useState('');

    const addTag = (tag) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
            onChange([...tags, trimmedTag]);
        }
        setInputValue('');
    };

    const removeTag = (indexToRemove) => {
        onChange(tags.filter((_, index) => index !== indexToRemove));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (inputValue.trim()) {
                addTag(inputValue);
            }
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const handleBlur = () => {
        if (inputValue.trim()) {
            addTag(inputValue);
        }
    };

    return (
        <div className={`border rounded-lg p-3 min-h-[50px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500 ${
            disabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
        }`}>
            {/* Display existing tags */}
            {tags.map((tag, index) => (
                <span
                    key={index}
                    className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm flex items-center gap-2 animate-fadeIn"
                >
                    {tag}
                    {!disabled && (
                        <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="text-sky-600 hover:text-sky-800 hover:bg-sky-200 rounded-full p-0.5 transition-colors"
                            title={`Remove ${tag}`}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </span>
            ))}
            
            {/* Input for new tags */}
            {!disabled && tags.length < maxTags && (
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    placeholder={tags.length === 0 ? placeholder : "Add another..."}
                    className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-700 placeholder-gray-400"
                />
            )}
            
            {/* Max tags reached message */}
            {tags.length >= maxTags && (
                <span className="text-xs text-gray-500 italic">
                    Maximum {maxTags} subjects allowed
                </span>
            )}
        </div>
    );
};

export default TagInput;