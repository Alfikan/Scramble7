import { useNavigate } from 'react-router-dom'
import Card from './Card'
import styles from './RoomCard.module.css'

/**
 * RoomCard
 *
 * Displays a summary of a room on the Dashboard.
 *
 * Props:
 *   room — { id, name, description, inviteCode, myRole, createdAt }
 */
export default function RoomCard({ room }) {
  const navigate = useNavigate()

  function handleClick() {
    navigate(`/room/${room.id}`)
  }

  const createdDate = room.createdAt?.seconds
    ? new Date(room.createdAt.seconds * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <li>
      <Card padding="sm" hoverable as="article" onClick={handleClick}>
        <div className={styles.inner}>
          <div className={styles.content}>
            <div className={styles.titleRow}>
              <span className={styles.name}>{room.name}</span>
              <span className={[styles.badge, room.myRole === 'owner' ? styles.badgeOwner : styles.badgeMember].join(' ')}>
                {room.myRole === 'owner' ? 'Owner' : 'Member'}
              </span>
            </div>
            {room.description && (
              <p className={styles.description}>{room.description}</p>
            )}
            <div className={styles.meta}>
              <span className={styles.code}>{room.inviteCode}</span>
              {createdDate && <span className={styles.date}>{createdDate}</span>}
            </div>
          </div>
        </div>
      </Card>
    </li>
  )
}
