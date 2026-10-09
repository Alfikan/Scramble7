import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAuthErrorMessage } from '../utils/firebaseErrors'
import Button from '../components/Button'
import Input from '../components/Input'
import styles from './Auth.module.css'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (serverError) setServerError('')
  }

  function validate() {
    const next = {}
    if (!form.name.trim())                            next.name            = 'Full name is required.'
    if (!form.email.trim())                           next.email           = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email))       next.email           = 'Enter a valid email address.'
    if (!form.password)                               next.password        = 'Password is required.'
    else if (form.password.length < 6)                next.password        = 'Password must be at least 6 characters.'
    if (!form.confirmPassword)                        next.confirmPassword = 'Please confirm your password.'
    else if (form.password !== form.confirmPassword)  next.confirmPassword = 'Passwords do not match.'
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      await signup(form.name, form.email, form.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setServerError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Link to="/" className={styles.wordmark}>Scramble</Link>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Join thousands of students studying smarter.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          {serverError && (
            <div className={styles.serverError} role="alert">
              {serverError}
            </div>
          )}

          <Input
            id="signup-name"
            name="name"
            label="Full name"
            type="text"
            placeholder="Alex Johnson"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            disabled={loading}
          />

          <Input
            id="signup-email"
            name="email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            disabled={loading}
          />

          <Input
            id="signup-password"
            name="password"
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            hint={!errors.password ? 'Minimum 6 characters.' : undefined}
            disabled={loading}
          />

          <Input
            id="signup-confirm"
            name="confirmPassword"
            label="Confirm password"
            type="password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            disabled={loading}
          />

          <Button type="submit" fullWidth size="lg" loading={loading} disabled={loading}>
            Create account
          </Button>
        </form>

        <p className={styles.footerNote}>
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
