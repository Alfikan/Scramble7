import { useState, useEffect } from 'react'
import { BookOpen, Plus, Hash, Brain } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createRoom, findRoomByInviteCode, isRoomMember, joinRoom, subscribeUserRooms } from '../services/roomService'
import { getRecentUserResults } from '../services/quizService'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import RoomCard from '../components/RoomCard'
import CreateRoomModal from '../components/CreateRoomModal'
import JoinRoomModal from '../components/JoinRoomModal'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const userName = currentUser?.displayName || 'there'

  const [rooms, setRooms]           = useState([])
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [roomsError, setRoomsError] = useState(null)

  const [activity, setActivity]         = useState([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [activityError, setActivityError]   = useState(null)

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin]     = useState(false)

  // Subscribe to user's rooms in real time
  useEffect(() => {
    if (!currentUser) return
    setRoomsLoading(true)
    const unsubscribe = subscribeUserRooms(currentUser.uid, ({ rooms, loading, error }) => {
      setRooms(rooms)
      setRoomsLoading(loading)
      setRoomsError(error)
    })
    return unsubscribe
  }, [currentUser])

  // Fetch recent quiz activity (one-time on mount)
  useEffect(() => {
    if (!currentUser) return
    setActivityLoading(true)
    getRecentUserResults(currentUser.uid)
      .then((results) => {
        console.log('[Dashboard] activity results:', results.length)
        setActivity(results)
        setActivityLoading(false)
      })
      .catch((err) => {
        console.error('[Dashboard] activity fetch failed — code:', err?.code, 'msg:', err?.message)
        setActivityError(`Could not load activity. (${err?.code || err?.message || 'unknown error'})`)
        setActivityLoading(false)
      })
  }, [currentUser])

  async function handleCreateRoom({ name, description }) {
    const roomId = await createRoom({ name, description, ownerId: currentUser.uid })
    setShowCreate(false)
    navigate(`/room/${roomId}`)
  }

  async function handleJoinRoom(inviteCode) {
    const room = await findRoomByInviteCode(inviteCode)
    if (!room) throw new Error('Room not found. Check the code and try again.')
    const alreadyMember = await isRoomMember(room.id, currentUser.uid)
    if (!alreadyMember) await joinRoom(room.id, currentUser.uid)
    setShowJoin(false)
    navigate(`/room/${room.id}`)
  }

  return (
    <>
      <div className={styles.page}>
        <div className={`container ${styles.inner}`}>

          {/* Welcome + Actions */}
          <div className={styles.topRow}>
            <div>
              <h1 className={styles.welcomeTitle}>
                Good to see you, {userName} 👋
              </h1>
              <p className={styles.welcomeSubtitle}>
                Pick up where you left off or start a new session.
              </p>
            </div>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => setShowJoin(true)}>
                <Hash size={16} />
                Join a room
              </Button>
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                <Plus size={16} />
                Create room
              </Button>
            </div>
          </div>

          <hr className="divider" />

          {/* Main grid */}
          <div className={styles.grid}>

            {/* My Rooms */}
            <section className={styles.section} aria-labelledby="rooms-heading">
              <h2 id="rooms-heading" className={styles.sectionTitle}>My rooms</h2>
              {roomsLoading ? (
                <div className={styles.loadingWrap}><Loading size="md" /></div>
              ) : roomsError ? (
                <Card padding="sm">
                  <p className={styles.errorText}>Could not load rooms. Please refresh the page.</p>
                </Card>
              ) : rooms.length === 0 ? (
                <Card padding="none">
                  <EmptyState
                    icon={<BookOpen size={22} />}
                    title="No rooms yet"
                    description="Create a room to start studying with your group, or join one using a room code."
                    action={
                      <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
                        <Plus size={14} />
                        Create your first room
                      </Button>
                    }
                  />
                </Card>
              ) : (
                <ul className={styles.roomList}>
                  {rooms.map((room) => <RoomCard key={room.id} room={room} />)}
                </ul>
              )}
            </section>

            {/* Recent Activity */}
            <section className={styles.section} aria-labelledby="activity-heading">
              <h2 id="activity-heading" className={styles.sectionTitle}>Recent activity</h2>

              {activityLoading ? (
                <div className={styles.loadingWrap}><Loading size="sm" /></div>
              ) : activityError ? (
                <Card padding="sm">
                  <p className={styles.errorText}>{activityError}</p>
                </Card>
              ) : activity.length === 0 ? (
                <Card padding="none">
                  <EmptyState
                    title="Nothing yet"
                    description="Your recent quiz results and room activity will show up here."
                  />
                </Card>
              ) : (
                <Card padding="none">
                  <ul className={styles.activityList}>
                    {activity.map((item) => (
                      <ActivityItem key={`${item.quizId}`} item={item} />
                    ))}
                  </ul>
                </Card>
              )}
            </section>

          </div>
        </div>
      </div>

      {showCreate && (
        <CreateRoomModal onClose={() => setShowCreate(false)} onSubmit={handleCreateRoom} />
      )}
      {showJoin && (
        <JoinRoomModal onClose={() => setShowJoin(false)} onSubmit={handleJoinRoom} />
      )}
    </>
  )
}

/* ── ActivityItem sub-component ─────────────────────────────── */
function ActivityItem({ item }) {
  const timeLabel = formatRelativeTime(item.completedAt)
  const pctColor  = item.percentage >= 70 ? 'var(--color-success)'
                  : item.percentage >= 50 ? 'var(--color-warning)'
                  : 'var(--color-error)'

  return (
    <li className={styles.activityItem}>
      <div className={styles.activityIcon} aria-hidden="true">
        <Brain size={15} />
      </div>
      <div className={styles.activityContent}>
        <p className={styles.activityTitle}>{item.title}</p>
        <p className={styles.activityMeta}>
          <span style={{ color: pctColor, fontWeight: 'var(--font-semibold)' }}>
            {item.percentage}%
          </span>
          {' · '}
          {item.score}/{item.totalQuestions} correct
        </p>
      </div>
      <span className={styles.activityTime}>{timeLabel}</span>
    </li>
  )
}

/* ── Relative time helper ────────────────────────────────────── */
function formatRelativeTime(timestamp) {
  if (!timestamp?.seconds) return ''

  const now     = Date.now()
  const then    = timestamp.seconds * 1000
  const diffMs  = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr  = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr  / 24)

  if (diffSec < 60)   return 'Just now'
  if (diffMin < 60)   return `${diffMin}m ago`
  if (diffHr  < 24)   return `${diffHr}h ago`
  if (diffDay === 1)  return 'Yesterday'
  if (diffDay < 7)    return `${diffDay} days ago`

  // Older than a week — show date
  return new Date(then).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}
