import React from 'react'
import { Link } from 'react-router-dom'

const TagCloud = ({ tags, limit = 10 }) => {
    if (!tags || tags.length === 0) return null

    const displayTags = tags.slice(0, limit)

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-1">
                Popular Tags:
            </span>
            {displayTags.map((tag) => (
                <Link
                    key={tag._id}
                    to={`/tags/${tag.slug}`}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    #{tag.name} {tag.count && <span className="text-xs text-gray-500">({tag.count})</span>}
                </Link>
            ))}
        </div>
    )
}

export default TagCloud