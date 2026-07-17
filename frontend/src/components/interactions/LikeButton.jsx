import React, { useState, useEffect } from 'react'
import { FiHeart, FiHeart as FiHeartOutline } from 'react-icons/fi'
import { likeService } from '../../services/likeService'
import { useNotification } from '../../hooks/useNotification'

const LikeButton = ({ blogId }) => {
    const [liked, setLiked] = useState(false)
    const [count, setCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const { addNotification } = useNotification()

    useEffect(() => {
        const fetchLikeStatus = async () => {
            try {
                const [checkRes, countRes] = await Promise.all([
                    likeService.checkLiked(blogId),
                    likeService.getLikeCount(blogId),
                ])

                if (checkRes.success) {
                    setLiked(checkRes.data.liked)
                }
                if (countRes.success) {
                    setCount(countRes.data.count)
                }
            } catch (error) {
                console.error('Failed to fetch like status:', error)
            }
        }

        fetchLikeStatus()
    }, [blogId])

    const handleLike = async () => {
        if (loading) return

        try {
            setLoading(true)
            const response = await likeService.toggleLike(blogId)

            if (response.success) {
                setLiked(response.data.liked)
                setCount(response.data.count)
                addNotification(response.data.liked ? 'Blog liked!' : 'Blog unliked', 'success')
            }
        } catch (error) {
            addNotification('Failed to toggle like', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleLike}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${liked
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {liked ? <FiHeart size={20} fill="currentColor" /> : <FiHeartOutline size={20} />}
            <span>{count}</span>
        </button>
    )
}

export default LikeButton