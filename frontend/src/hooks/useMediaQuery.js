import { useState, useEffect } from 'react'

export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        const media = window.matchMedia(query)

        const updateMatch = () => {
            setMatches(media.matches)
        }

        updateMatch()

        media.addEventListener('change', updateMatch)

        return () => {
            media.removeEventListener('change', updateMatch)
        }
    }, [query])

    return matches
}