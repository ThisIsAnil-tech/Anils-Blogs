import React, { useState } from 'react'

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
    const [showAll, setShowAll] = useState(false)
    const displayCategories = showAll ? categories : categories.slice(0, 6)

    if (!categories || categories.length === 0) return null

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                onClick={() => onSelectCategory('')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${!selectedCategory
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
            >
                All
            </button>

            {displayCategories.map((category) => (
                <button
                    key={category._id}
                    onClick={() => onSelectCategory(category.slug)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedCategory === category.slug
                            ? 'bg-black dark:bg-white text-white dark:text-black'
                            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                >
                    {category.name}
                </button>
            ))}

            {categories.length > 6 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400 hover:underline"
                >
                    {showAll ? 'Show less' : `+${categories.length - 6} more`}
                </button>
            )}
        </div>
    )
}

export default CategoryFilter