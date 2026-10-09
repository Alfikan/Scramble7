import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import Button from './Button'
import Input from './Input'
import styles from './Modal.module.css'

const NAME_MAX = 60
const DESC_MAX = 200

/**
 * CreateRoomModal
 *
 * Props:
 *   onClose   — () => void
 *   onSubmit  — ({ name, description }) => Promise<void>
 */
export default function CreateRoomModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  // Focus the name input when the modal opens
  const nameRef = useRef(null)
  useEffect(() => { nameRef.current?.focus() }, [])

  // Close on Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (serverError) setServerError('')
  }

  function validate() {
    const next = {}
    if (!form.name.trim())                next.name = 'Room name is required.'
    else if (form.name.length > NAME_MAX) next.name = `Room name must be ${NAME_MAX} characters or fewer.`
    if (form.description.length > DESC_MAX) next.description = `Description must be ${DESC_MAX} characters or fewer.`
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return }

    setLoading(true)
    try {
      await onSubmit({ name: form.name, description: form.description })
    } catch (err) {
      setServerError(err.message || 'Failed to create room. Please try again.')
      setLoading(false)
    }
    // Note: we don't setLoading(false) on success because the parent will
    // redirect away, unmounting this component.
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="create-room-title">
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 id="create-room-title" className={styles.modalTitle}>Create a room</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className={styles.modalBody}>
          {serverError && (
            <div className={styles.serverError} role="alert">{serverError}</div>
          )}

          <Input
            ref={nameRef}
            id="room-name"
            name="name"
            label="Room name"
            type="text"
            placeholder="e.g. Biology Midterms"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            disabled={loading}
            maxLength={NAME_MAX}
          />

          <div className={styles.fieldWrap}>
            <label htmlFor="room-desc" className={styles.label}>
              Description <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="room-desc"
              name="description"
              className={[styles.textarea, errors.description ? styles.textareaError : ''].join(' ')}
              placeholder="What will you be studying?"
              value={form.description}
              onChange={handleChange}
              disabled={loading}
              maxLength={DESC_MAX}
              rows={3}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className={styles.fieldError} role="alert">{errors.description}</p>
            )}
          </div>

          <div className={styles.modalFooter}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={loading}>
              Create room
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
