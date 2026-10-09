import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAuthErrorMessage } from '../utils/firebaseErrors'
import Button from '../components/Button'
import Input from '../components/Input'
import styles from './Auth.module.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // If the user was redirected here from a protected route, send them back there after login
  const redirectTo = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
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
    if (!form.email.trim())                      next.email    = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email))  next.email    = 'Enter a valid email address.'
    if (!form.password)                          next.password = 'Password is required.'
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
      await login(form.email, form.password)
      navigate(redirectTo, { replace: true })
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
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to your account to continue.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          {serverError && (
            <div className={styles.serverError} role="alert">
              {serverError}
            </div>
          )}

          <Input
            id="login-email"
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
            id="login-password"
            name="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            disabled={loading}
          />

          <Button type="submit" fullWidth size="lg" loading={loading} disabled={loading}>
            Log in
          </Button>
        </form>

        <p className={styles.footerNote}>
          Don&apos;t have an account?{' '}
          <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  )
}
