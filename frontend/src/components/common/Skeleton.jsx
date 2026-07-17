import React from 'react'

const Skeleton = ({ variant = 'text', width = 'w-full', height = 'h-4', className = '' }) => {
    const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded'

    const variants = {
        text: `${baseClasses} ${height} ${width}`,
        circle: `${baseClasses} rounded-full ${width} ${height}`,
        rectangle: `${baseClasses} ${width} ${height}`,
        card: `${baseClasses} ${width} ${height} rounded-lg`,
    }

    return <div className={`${variants[variant]} ${className}`} />
}

export const SkeletonText = ({ lines = 3, className = '' }) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {[...Array(lines)].map((_, i) => (
                <Skeleton key={i} width={i === 0 ? 'w-3/4' : 'w-full'} />
            ))}
        </div>
    )
}

export const SkeletonCard = ({ className = '' }) => {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
            <Skeleton variant="rectangle" width="w-full" height="h-48" />
            <div className="mt-4">
                <Skeleton width="w-3/4" />
                <SkeletonText lines={2} />
                <div className="flex justify-between mt-4">
                    <Skeleton width="w-1/3" />
                    <Skeleton width="w-1/4" />
                </div>
            </div>
        </div>
    )
}

export default Skeleton