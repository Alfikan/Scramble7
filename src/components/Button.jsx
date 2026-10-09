import styles from './Button.module.css'

/**
 * Button component
 *
 * Props:
 *   as       — element or component to render as (default: 'button')
 *              e.g. as={Link} renders a React Router Link styled as a button
 *   variant  — 'primary' | 'secondary' | 'ghost' | 'danger'
 *   size     — 'sm' | 'md' | 'lg'
 *   fullWidth — boolean
 *   disabled  — boolean
 *   loading   — boolean
 *   onClick   — function
 *   type      — 'button' | 'submit' | 'reset'
 *   children  — React node
 */
export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  children,
  className = '',
  ...rest
}) {
  const classes = [
    styles.btn,
    styles[`btn--${variant}`],
    styles[`btn--${size}`],
    fullWidth ? styles['btn--full'] : '',
    loading ? styles['btn--loading'] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // Only pass type to actual button elements, not to Link components
  const isButton = Tag === 'button'

  return (
    <Tag
      {...(isButton ? { type } : {})}
      className={classes}
      disabled={isButton ? (disabled || loading) : undefined}
      onClick={onClick}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span className={styles.spinner} aria-hidden="true" />
      )}
      <span className={loading ? styles.btnText : undefined}>{children}</span>
    </Tag>
  )
}
