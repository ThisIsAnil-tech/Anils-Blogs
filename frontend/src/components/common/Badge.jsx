import React from 'react'

const Badge = ({
    children,
    variant = 'default',
    size = 'md',
    className = '',
}) => {
    const variants = {
        default: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
        primary: 'bg-black dark:bg-white text-white dark:text-black',
        success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
        danger: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
        warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
        info: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    }

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
    }

    const classes = `
    inline-flex items-center rounded-full font-medium
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `

    return <span className={classes}>{children}</span>
}

export default Badge