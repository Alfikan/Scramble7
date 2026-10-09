import { useState, useEffect } from 'react'
import { subscribeToPresence } from '../firebase/presence'
import styles from './MemberItem.module.css'

/**
 * MemberItem
 *
 * Renders a single member row with a real-time online/offline indicator.
 *
 * Props:
 *   member  — { userId, displayName, role }
 *   isYou   — boolean
 */
export default function MemberItem({ member, isYou }) {
  const [presence, setPresence] = useState({ state: 'offline', lastChanged: null })

  // Subscribe to this member's presence in real time
  useEffect(() => {
    const unsubscribe = subscribeToPresence(member.userId, setPresence)
    return unsubscribe
  }, [member.userId])

  const isOnline = presence.state === 'online'
  const lastSeen = formatLastSeen(presence.lastChanged)

  return (
    <li className={styles.item}>
      <div className={styles.avatarWrap}>
        <span className={styles.avatar} aria-hidden="true">
          {member.displayName[0].toUpperCase()}
        </span>
        {/* Presence dot */}
        <span
          className={[styles.dot, isOnline ? styles.dotOnline : styles.dotOffline].join(' ')}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      </div>

      <div className={styles.info}>
        <span className={styles.name}>
          {member.displayName}
          {isYou && <span className={styles.you}> (you)</span>}
        </span>

        <span className={styles.status}>
          {isOnline ? (
            <span className={styles.statusOnline}>● Online</span>
          ) : (
            <span className={styles.statusOffline}>
              {lastSeen ? `Last seen ${lastSeen}` : 'Offline'}
            </span>
          )}
        </span>

        {member.role === 'owner' && (
          <span className={styles.ownerBadge}>Owner</span>
        )}
      </div>
    </li>
  )
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Returns a human-readable "last seen" string from an RTDB server timestamp.
 * RTDB server timestamps are stored as Unix milliseconds (number).
 */
function formatLastSeen(lastChanged) {
  if (!lastChanged) return null

  const diffMs   = Date.now() - lastChanged
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHrs  = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffSecs < 60)   return 'just now'
  if (diffMins < 60)   return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHrs  < 24)   return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
}
