import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { sendMessage, subscribeToMessages } from '../services/chatService'
import { getUser } from '../services/userService'
import QuizCard from './QuizCard'
import Loading from './Loading'
import styles from './ChatBox.module.css'

const MAX_LENGTH = 500

export default function ChatBox({ roomId }) {
  const { currentUser } = useAuth()

  const [messages, setMessages]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [text, setText]           = useState('')
  const [sending, setSending]     = useState(false)
  const [sendError, setSendError] = useState('')

  // Resolved display name — Auth profile can lag after signup, so we
  // fall back to the Firestore user document if displayName is null.
  const [senderName, setSenderName] = useState('')

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // ── Resolve display name ──────────────────────────────────
  useEffect(() => {
    if (!currentUser) return

    if (currentUser.displayName) {
      setSenderName(currentUser.displayName)
      return
    }

    // Auth displayName not yet propagated — fetch from Firestore
    getUser(currentUser.uid).then((profile) => {
      setSenderName(profile?.displayName || currentUser.email?.split('@')[0] || 'User')
    })
  }, [currentUser])

  // ── Subscribe to messages ─────────────────────────────────
  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToMessages(roomId, ({ messages, loading, error }) => {
      setMessages(messages)
      setLoading(loading)
      setError(error)
    })
    return unsubscribe
  }, [roomId])

  // ── Auto-scroll to newest message ─────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send ──────────────────────────────────────────────────
  async function handleSend(e) {
    e.preventDefault()
    setSendError('')

    const trimmed = text.trim()
    if (!trimmed || !currentUser) return

    setSending(true)
    try {
      // Pass a user-like object with the resolved senderName
      await sendMessage(roomId, { uid: currentUser.uid, displayName: senderName }, trimmed)
      setText('')
      inputRef.current?.focus()
    } catch (err) {
      setSendError(err.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  const canSend = text.trim().length > 0 && text.length <= MAX_LENGTH && !sending && !!senderName

  return (
    <div className={styles.chatBox}>
      {/* Message list */}
      <div className={styles.messageList} aria-live="polite" aria-label="Chat messages">
        {loading ? (
          <div className={styles.centered}>
            <Loading size="md" />
          </div>
        ) : error ? (
          <div className={styles.centered}>
            <p className={styles.errorText}>Could not load messages.</p>
            <p className={styles.errorHint}>
              If this just happened, make sure the Firestore rules are published in the Firebase console.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.centered}>
            <p className={styles.emptyTitle}>No messages yet</p>
            <p className={styles.emptyText}>Say hello to start the session.</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              // Quiz messages get a special card; missing type = backward-compat text
              if (msg.type === 'quiz') {
                return (
                  <div key={msg.id} className={styles.quizMessageWrap}>
                    <span className={styles.senderName}>{msg.senderName}</span>
                    <QuizCard message={msg} />
                  </div>
                )
              }
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === currentUser?.uid}
                  showSender={
                    msg.senderId !== currentUser?.uid &&
                    (i === 0 || messages[i - 1].senderId !== msg.senderId)
                  }
                />
              )
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {sendError && (
        <div className={styles.sendError} role="alert">{sendError}</div>
      )}

      {text.length > MAX_LENGTH - 50 && (
        <div className={styles.charCount} aria-live="polite">
          {text.length} / {MAX_LENGTH}
        </div>
      )}

      <form onSubmit={handleSend} className={styles.inputRow} aria-label="Send a message">
        <textarea
          ref={inputRef}
          className={styles.input}
          placeholder="Type a message… (Enter to send)"
          value={text}
          onChange={(e) => { setText(e.target.value); if (sendError) setSendError('') }}
          onKeyDown={handleKeyDown}
          disabled={sending || !currentUser}
          rows={1}
          aria-label="Message text"
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!canSend}
          aria-label="Send message"
          title="Send (Enter)"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}

function MessageBubble({ message, isOwn, showSender }) {
  const time = formatTime(message.createdAt)
  return (
    <div className={[styles.message, isOwn ? styles.messageOwn : styles.messageOther].join(' ')}>
      {showSender && !isOwn && (
        <span className={styles.senderName}>{message.senderName}</span>
      )}
      <div className={styles.bubble}>
        <span className={styles.bubbleText}>{message.text}</span>
        <span className={styles.bubbleTime}>{time}</span>
      </div>
    </div>
  )
}

function formatTime(timestamp) {
  if (!timestamp?.seconds) return ''
  return new Date(timestamp.seconds * 1000).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  })
}
