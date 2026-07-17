import React from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 1,
}) => {
    const range = (start, end) => {
        const length = end - start + 1
        return Array.from({ length }, (_, i) => start + i)
    }

    const getPageNumbers = () => {
        const totalPageNumbers = siblingCount * 2 + 5

        if (totalPages <= totalPageNumbers) {
            return range(1, totalPages)
        }

        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
        const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

        const shouldShowLeftDots = leftSiblingIndex > 2
        const shouldShowRightDots = rightSiblingIndex < totalPages - 2

        if (!shouldShowLeftDots && shouldShowRightDots) {
            const leftRange = range(1, totalPageNumbers - 2)
            return [...leftRange, '...', totalPages]
        }

        if (shouldShowLeftDots && !shouldShowRightDots) {
            const rightRange = range(totalPages - (totalPageNumbers - 3), totalPages)
            return [1, '...', ...rightRange]
        }

        if (shouldShowLeftDots && shouldShowRightDots) {
            const middleRange = range(leftSiblingIndex, rightSiblingIndex)
            return [1, '...', ...middleRange, '...', totalPages]
        }
    }

    const pageNumbers = getPageNumbers()

    if (totalPages <= 1) return null

    return (
        <nav className="flex items-center justify-center gap-1">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <FiChevronLeft size={20} />
            </button>

            {pageNumbers.map((page, index) => (
                <button
                    key={index}
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    className={`px-4 py-2 rounded-lg transition-colors ${page === currentPage
                            ? 'bg-black dark:bg-white text-white dark:text-black'
                            : page === '...'
                                ? 'cursor-default'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    disabled={page === '...'}
                >
                    {page}
                </button>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <FiChevronRight size={20} />
            </button>
        </nav>
    )
}

export default Pagination