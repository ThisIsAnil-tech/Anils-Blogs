import { useState, useEffect } from 'react'

export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error)
            return initialValue
        }
    })

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(storedValue))
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error)
        }
    }, [key, storedValue])

    const remove = () => {
        try {
            localStorage.removeItem(key)
            setStoredValue(initialValue)
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error)
        }
    }

    return [storedValue, setStoredValue, remove]
}