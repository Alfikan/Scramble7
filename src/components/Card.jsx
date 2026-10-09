import styles from './Card.module.css'

/**
 * Card component
 *
 * Props:
 *   padding  — 'none' | 'sm' | 'md' | 'lg'
 *   hoverable — boolean (adds hover effect)
 *   onClick   — function (makes card interactive)
 *   as        — element type ('div', 'article', 'li', etc.)
 *   children  — React node
 */
export default function Card({
  padding = 'md',
  hoverable = false,
  onClick,
  as: Tag = 'div',
  children,
  className = '',
  ...rest
}) {
  const isInteractive = hoverable || !!onClick

  return (
    <Tag
      className={[
        styles.card,
        styles[`card--p-${padding}`],
        isInteractive ? styles['card--hoverable'] : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick(e)
          : undefined
      }
      {...rest}
    >
      {children}
    </Tag>
  )
}
