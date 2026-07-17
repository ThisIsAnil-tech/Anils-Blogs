import React, { forwardRef } from 'react'

const Textarea = forwardRef(({
    label,
    name,
    value,
    onChange,
    onBlur,
    placeholder,
    error,
    required = false,
    disabled = false,
    rows = 4,
    className = '',
    ...props
}, ref) => {
    const baseStyles = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 transition-colors resize-y'

    const stateStyles = error
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-300 dark:border-gray-700 focus:ring-black dark:focus:ring-white'

    const classes = `${baseStyles} ${stateStyles} ${className}`

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <textarea
                ref={ref}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                className={classes}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    )
})

Textarea.displayName = 'Textarea'

export default Textarea