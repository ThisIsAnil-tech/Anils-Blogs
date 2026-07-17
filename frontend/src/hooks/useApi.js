import { useState, useEffect, useCallback } from 'react'
import { getErrorMessage } from '../utils/helpers'

export const useApi = (apiFunction, options = {}) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const execute = useCallback(
        async (...args) => {
            try {
                setLoading(true)
                setError(null)
                const result = await apiFunction(...args)
                setData(result)
                return result
            } catch (err) {
                const message = getErrorMessage(err)
                setError(message)
                if (options.onError) {
                    options.onError(message)
                }
                throw err
            } finally {
                setLoading(false)
            }
        },
        [apiFunction, options]
    )

    useEffect(() => {
        if (options.autoFetch) {
            execute()
        }
    }, [])

    const reset = useCallback(() => {
        setData(null)
        setError(null)
        setLoading(false)
    }, [])

    return { data, loading, error, execute, reset }
}