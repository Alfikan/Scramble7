import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import Button from './Button'
import Input from './Input'
import styles from './Modal.module.css'

/**
 * JoinRoomModal
 *
 * Props:
 *   onClose   — () => void
 *   onSubmit  — (inviteCode: string) => Promise<void>
 */
export default function JoinRoomModal({ onClose, onSubmit }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleChange(e) {
    setCode(e.target.value)
    if (error) setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const normalised = code.trim().toUpperCase()
    if (!normalised) { setError('Please enter a room code.'); return }

    setLoading(true)
    try {
      await onSubmit(normalised)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="join-room-title">
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 id="join-room-title" className={styles.modalTitle}>Join a room</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className={styles.modalBody}>
          <Input
            ref={inputRef}
            id="join-code"
            name="code"
            label="Room code"
            type="text"
            placeholder="e.g. SCR-7K2M"
            value={code}
            onChange={handleChange}
            error={error}
            disabled={loading}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck="false"
          />
          <p className={styles.hint}>
            Ask the room owner for their invite code.
          </p>

          <div className={styles.modalFooter}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={loading}>
              Join room
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
