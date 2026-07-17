import React, { useState } from 'react'
import { FiShare2, FiTwitter, FiFacebook, FiLinkedin, FiLink } from 'react-icons/fi'
import { FaWhatsapp, FaTelegram } from 'react-icons/fa'
import { getShareUrl, copyToClipboard } from '../../utils/helpers'
import { useNotification } from '../../hooks/useNotification'

const ShareButtons = ({ url, title }) => {
    const [showDropdown, setShowDropdown] = useState(false)
    const { addNotification } = useNotification()

    const sharePlatforms = [
        { id: 'twitter', icon: FiTwitter, label: 'Twitter', color: '#1DA1F2' },
        { id: 'facebook', icon: FiFacebook, label: 'Facebook', color: '#4267B2' },
        { id: 'linkedin', icon: FiLinkedin, label: 'LinkedIn', color: '#0077B5' },
        { id: 'whatsapp', icon: FaWhatsapp, label: 'WhatsApp', color: '#25D366' },
        { id: 'telegram', icon: FaTelegram, label: 'Telegram', color: '#0088CC' },
    ]

    const handleShare = (platform) => {
        const shareUrl = getShareUrl(platform, url, title)
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400')
        }
        setShowDropdown(false)
    }

    const handleCopyLink = async () => {
        try {
            await copyToClipboard(url)
            addNotification('Link copied to clipboard!', 'success')
            setShowDropdown(false)
        } catch (error) {
            addNotification('Failed to copy link', 'error')
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <FiShare2 size={20} />
                <span>Share</span>
            </button>

            {showDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[200px] z-10">
                    <div className="space-y-1">
                        {sharePlatforms.map((platform) => (
                            <button
                                key={platform.id}
                                onClick={() => handleShare(platform.id)}
                                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <platform.icon size={18} style={{ color: platform.color }} />
                                <span>{platform.label}</span>
                            </button>
                        ))}
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                        <button
                            onClick={handleCopyLink}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <FiLink size={18} />
                            <span>Copy Link</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ShareButtons