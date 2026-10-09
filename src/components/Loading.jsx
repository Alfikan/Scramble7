import styles from './Loading.module.css'

/**
 * Loading component
 *
 * Props:
 *   size    — 'sm' | 'md' | 'lg'
 *   label   — string (screen-reader text, defaults to "Loading...")
 *   fullPage — boolean (centers in full viewport)
 */
export default function Loading({
  size = 'md',
  label = 'Loading...',
  fullPage = false,
}) {
  const spinner = (
    <div
      className={[styles.spinner, styles[`spinner--${size}`]].join(' ')}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  )

  if (fullPage) {
    return (
      <div className={styles.fullPage}>
        {spinner}
      </div>
    )
  }

  return spinner
}
