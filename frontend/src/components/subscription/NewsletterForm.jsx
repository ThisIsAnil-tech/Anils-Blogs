import React, { useState } from 'react'
import { subscriberService } from '../../services/subscriberService'
import { useNotification } from '../../hooks/useNotification'
import Input from '../common/Input'
import Button from '../common/Button'

const NewsletterForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
    })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const { addNotification } = useNotification()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.email.trim()) {
            addNotification('Please enter your email', 'error')
            return
        }

        try {
            setLoading(true)
            const response = await subscriberService.subscribe(formData)

            if (response.success) {
                setSuccess(true)
                setFormData({ username: '', email: '' })
                addNotification('Subscribed successfully! Please check your email to verify.', 'success')
            }
        } catch (error) {
            addNotification(error.response?.data?.message || 'Failed to subscribe', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-green-600 dark:text-green-400 font-medium">
                    ✅ Subscribed successfully!
                </p>
                <p className="text-sm text-green-500 dark:text-green-300 mt-1">
                    Check your email to verify your subscription.
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <Input
                name="username"
                placeholder="Your name (optional)"
                value={formData.username}
                onChange={handleChange}
                className="text-sm"
            />
            <Input
                name="email"
                type="email"
                placeholder="Your email *"
                value={formData.email}
                onChange={handleChange}
                required
                className="text-sm"
            />
            <Button
                type="submit"
                loading={loading}
                fullWidth
                size="sm"
            >
                Subscribe
            </Button>
        </form>
    )
}

export default NewsletterForm