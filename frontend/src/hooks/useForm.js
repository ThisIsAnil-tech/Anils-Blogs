import { useState, useCallback } from 'react'

export const useForm = (initialValues = {}, onSubmit = null) => {
    const [values, setValues] = useState(initialValues)
    const [errors, setErrors] = useState({})
    const [touched, setTouched] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target
        setValues((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }, [])

    const handleBlur = useCallback((e) => {
        const { name } = e.target
        setTouched((prev) => ({
            ...prev,
            [name]: true,
        }))
    }, [])

    const setFieldValue = useCallback((name, value) => {
        setValues((prev) => ({
            ...prev,
            [name]: value,
        }))
    }, [])

    const setFieldError = useCallback((name, error) => {
        setErrors((prev) => ({
            ...prev,
            [name]: error,
        }))
    }, [])

    const setFieldTouched = useCallback((name, isTouched = true) => {
        setTouched((prev) => ({
            ...prev,
            [name]: isTouched,
        }))
    }, [])

    const resetForm = useCallback(() => {
        setValues(initialValues)
        setErrors({})
        setTouched({})
        setIsSubmitting(false)
    }, [initialValues])

    const handleSubmit = useCallback(
        async (e) => {
            if (e) e.preventDefault()

            if (!onSubmit) return

            setIsSubmitting(true)

            try {
                await onSubmit(values)
                resetForm()
            } catch (error) {
                console.error('Form submission error:', error)
            } finally {
                setIsSubmitting(false)
            }
        },
        [onSubmit, values, resetForm]
    )

    return {
        values,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        setFieldValue,
        setFieldError,
        setFieldTouched,
        resetForm,
    }
}