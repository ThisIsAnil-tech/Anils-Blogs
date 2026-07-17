import React from 'react'

const StatsCard = ({ title, value, subtitle, icon, color = 'black' }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {title}
                    </p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className="text-3xl opacity-50">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    )
}

export default StatsCard