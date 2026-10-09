import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Users, Copy, Check, Brain, LogOut, Trophy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getRoom, getMembership, getRoomMembers, leaveRoom } from '../services/roomService'
import { getUser } from '../services/userService'
import Button from '../components/Button'
import Loading from '../components/Loading'
import ChatBox from '../components/ChatBox'
import MemberItem from '../components/MemberItem'
import Leaderboard from '../components/Leaderboard'
import styles from './Room.module.css'

export default function Room() {
  const { roomId } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [room, setRoom]               = useState(null)
  const [membership, setMembership]   = useState(null)
  const [members, setMembers]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [error, setError]             = useState(null)
  const [copied, setCopied]           = useState(false)
  const [leaving, setLeaving]         = useState(false)
  const [leaveError, setLeaveError]   = useState('')
  const [activeTab, setActiveTab]     = useState('chat')  // 'chat' | 'leaderboard'

  // ── Load room data + verify membership ─────────────────────
  useEffect(() => {
    if (!currentUser) return

    async function loadRoom() {
      setLoading(true)
      try {
        const roomData = await getRoom(roomId)
        if (!roomData) { setAccessDenied(true); setLoading(false); return }

        const memberDoc = await getMembership(roomId, currentUser.uid)
        if (!memberDoc) { setAccessDenied(true); setLoading(false); return }

        setRoom(roomData)
        setMembership(memberDoc)

        const memberDocs = await getRoomMembers(roomId)
        const enriched = await Promise.all(
          memberDocs.map(async (m) => {
            const profile = await getUser(m.userId)
            return { userId: m.userId, role: m.role, displayName: profile?.displayName || 'Unknown' }
          })
        )
        enriched.sort((a, b) => {
          if (a.role === 'owner') return -1
          if (b.role === 'owner') return 1
          return a.displayName.localeCompare(b.displayName)
        })
        setMembers(enriched)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadRoom()
  }, [roomId, currentUser])

  async function handleCopyCode() {
    if (!room?.inviteCode) return
    try { await navigator.clipboard.writeText(room.inviteCode) } catch { /* ignored */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleLeave() {
    setLeaveError('')
    if (membership?.role === 'owner') {
      setLeaveError("Room owners can't leave their room yet.")
      return
    }
    setLeaving(true)
    try {
      await leaveRoom(roomId, currentUser.uid)
      navigate('/dashboard')
    } catch (err) {
      setLeaveError(err.message || 'Failed to leave room.')
      setLeaving(false)
    }
  }

  if (loading) return <Loading fullPage />

  if (accessDenied) {
    return (
      <div className={styles.accessDeniedPage}>
        <div className={styles.accessDeniedCard}>
          <h1 className={styles.accessDeniedTitle}>Access denied</h1>
          <p className={styles.accessDeniedText}>
            You&apos;re not a member of this room. Ask the owner for an invite code.
          </p>
          <Button as={Link} to="/dashboard" variant="primary">Back to dashboard</Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.accessDeniedPage}>
        <div className={styles.accessDeniedCard}>
          <h1 className={styles.accessDeniedTitle}>Something went wrong</h1>
          <p className={styles.accessDeniedText}>{error}</p>
          <Button as={Link} to="/dashboard" variant="secondary">Back to dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className={styles.roomHeader}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <Link to="/dashboard" className={styles.backLink} aria-label="Back to dashboard">
              <ArrowLeft size={18} />
            </Link>
            <div className={styles.headerTitles}>
              <h1 className={styles.roomName}>{room.name}</h1>
              {room.description && (
                <p className={styles.roomDescription}>{room.description}</p>
              )}
            </div>
          </div>

          <div className={styles.headerRight}>
            <button className={styles.codeBtn} onClick={handleCopyCode} title="Copy invite code">
              <span className={styles.codeText}>{room.inviteCode}</span>
              {copied
                ? <Check size={13} className={styles.codeIconSuccess} />
                : <Copy size={13} className={styles.codeIcon} />}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeave}
              disabled={leaving}
              title={membership?.role === 'owner' ? "Owners can't leave" : 'Leave room'}
            >
              <LogOut size={14} />
              Leave
            </Button>
          </div>
        </div>

        {leaveError && (
          <div className={styles.leaveError} role="alert">{leaveError}</div>
        )}
      </header>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className={styles.body}>

        {/* Members sidebar */}
        <aside className={styles.sidebar} aria-label="Room members">
          <h2 className={styles.sidebarTitle}>
            <Users size={13} />
            Members · {members.length}
          </h2>
          <ul className={styles.memberList}>
            {members.map((m) => (
              <MemberItem
                key={m.userId}
                member={m}
                isYou={m.userId === currentUser.uid}
              />
            ))}
          </ul>
        </aside>

        {/* Main content area */}
        <main className={styles.main}>

          {/* Tab bar */}
          <div className={styles.tabBar}>
            <button
              className={[styles.tab, activeTab === 'chat' ? styles.tabActive : ''].join(' ')}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button
              className={[styles.tab, activeTab === 'leaderboard' ? styles.tabActive : ''].join(' ')}
              onClick={() => setActiveTab('leaderboard')}
            >
              <Trophy size={13} />
              Leaderboard
            </button>

            {/* Generate quiz pushed to the right */}
            <div className={styles.tabSpacer} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/quiz/setup', { state: { roomId } })}
            >
              <Brain size={14} />
              Generate quiz
            </Button>
          </div>

          {/* Tab content */}
          <div className={styles.tabContent}>
            {activeTab === 'chat' ? (
              <ChatBox roomId={roomId} />
            ) : (
              <Leaderboard roomId={roomId} />
            )}
          </div>

        </main>
      </div>
    </div>
  )
}
