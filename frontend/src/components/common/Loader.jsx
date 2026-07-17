import React from 'react'

const Loader = ({ size = 'md', color = 'black', fullScreen = false }) => {
    const sizes = {
        sm: 'h-6 w-6',
        md: 'h-10 w-10',
        lg: 'h-16 w-16',
    }

    const colors = {
        black: 'border-black dark:border-white',
        white: 'border-white',
        gray: 'border-gray-500',
    }

    const spinner = (
        <div
            className={`inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent ${sizes[size]} ${colors[color]}`}
            role="status"
        >
            <span className="sr-only">Loading...</span>
        </div>
    )

    if (fullScreen) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                {spinner}
            </div>
        )
    }

    return spinner
}

export default Loader