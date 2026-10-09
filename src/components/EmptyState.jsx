import styles from './EmptyState.module.css'

/**
 * EmptyState component
 *
 * Props:
 *   icon     — React node (e.g. a Lucide icon)
 *   title    — string
 *   description — string
 *   action   — React node (e.g. a Button)
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className={styles.emptyState}>
      {icon && (
        <div className={styles.iconWrap} aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && (
        <p className={styles.description}>{description}</p>
      )}
      {action && (
        <div className={styles.action}>{action}</div>
      )}
    </div>
  )
}
