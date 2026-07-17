import React from 'react'
import { SkeletonCard } from '../common/Skeleton'

const BlogSkeleton = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(count)].map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    )
}

export default BlogSkeleton