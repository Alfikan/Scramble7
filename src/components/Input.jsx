import { forwardRef } from 'react'
import styles from './Input.module.css'

/**
 * Input component
 *
 * Props:
 *   id        — string (required for accessibility)
 *   label     — string
 *   type      — input type (text, email, password, etc.)
 *   error     — string | null   (error message)
 *   hint      — string | null   (helper text)
 *   fullWidth — boolean
 *   ref       — forwarded ref (used by modals for autofocus)
 *   ...rest   — any native input props (value, onChange, placeholder, disabled, etc.)
 */
const Input = forwardRef(function Input(
  { id, label, type = 'text', error, hint, fullWidth = true, className = '', ...rest },
  ref
) {
  const inputId = id || rest.name
  const errorId = `${inputId}-error`
  const hintId  = `${inputId}-hint`

  const describedBy = [
    error ? errorId : null,
    hint  ? hintId  : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={[
        styles.field,
        fullWidth ? styles['field--full'] : '',
        error     ? styles['field--error'] : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}

      <input
        ref={ref}
        id={inputId}
        type={type}
        className={styles.input}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        {...rest}
      />

      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
