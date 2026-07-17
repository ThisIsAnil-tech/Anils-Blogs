import React from 'react'

const Card = ({
    children,
    className = '',
    hover = false,
    padding = true,
    ...props
}) => {
    const baseStyles = 'bg-white dark:bg-gray-800 rounded-lg shadow'

    const hoverStyles = hover ? 'hover:shadow-lg transition-shadow duration-300' : ''

    const paddingStyles = padding ? 'p-6' : ''

    const classes = `
    ${baseStyles}
    ${hoverStyles}
    ${paddingStyles}
    ${className}
  `

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    )
}

export default Card