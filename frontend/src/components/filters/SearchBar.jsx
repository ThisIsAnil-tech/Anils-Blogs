import React, { useState, useEffect } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import { useDebounce } from '../../hooks/useDebounce'

const SearchBar = ({ onSearch, placeholder = 'Search blogs...', className = '' }) => {
    const [query, setQuery] = useState('')
    const debouncedQuery = useDebounce(query, 500)

    useEffect(() => {
        onSearch(debouncedQuery)
    }, [debouncedQuery, onSearch])

    const handleClear = () => {
        setQuery('')
        onSearch('')
    }

    return (
        <div className={`relative ${className}`}>
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
            />
            {query && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <FiX size={20} />
                </button>
            )}
        </div>
    )
}

export default SearchBar