import { useState, useEffect, useCallback, useRef } from 'react'

export const useInfiniteScroll = (fetchMore, hasMore, loading) => {
    const [page, setPage] = useState(1)
    const observerRef = useRef(null)
    const lastElementRef = useRef(null)

    useEffect(() => {
        if (loading || !hasMore) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    setPage(prev => prev + 1)
                    fetchMore(page + 1)
                }
            },
            {
                root: null,
                rootMargin: '0px 0px 200px 0px',
                threshold: 0.1,
            }
        )

        if (lastElementRef.current) {
            observer.observe(lastElementRef.current)
        }

        observerRef.current = observer

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [loading, hasMore, fetchMore, page])

    const resetPagination = useCallback(() => {
        setPage(1)
    }, [])

    return { lastElementRef, resetPagination }
}