import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getQuiz, getUserResult } from '../services/quizService'
import styles from './QuizCard.module.css'

/**
 * QuizCard
 *
 * Rendered inside ChatBox when a message has type === 'quiz'.
 * Shows quiz metadata and a "Take Quiz" / "Completed" CTA.
 *
 * Props:
 *   message — { quizId, quizTitle, quizDifficulty, quizCount, senderName, createdAt }
 */
export default function QuizCard({ message }) {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [result, setResult]   = useState(undefined)  // undefined = loading, null = not done
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // Check if current user has already completed this quiz
  useEffect(() => {
    if (!currentUser || !message.quizId) return
    getUserResult(message.quizId, currentUser.uid).then(setResult)
  }, [message.quizId, currentUser])

  const difficultyLabel = message.quizDifficulty
    ? message.quizDifficulty.charAt(0).toUpperCase() + message.quizDifficulty.slice(1)
    : ''

  async function handleTakeQuiz() {
    if (!message.quizId || !currentUser) return
    setLoading(true)
    setError(null)
    try {
      const quiz = await getQuiz(message.quizId)
      if (!quiz) { setError('Quiz not found.'); setLoading(false); return }
      navigate('/quiz', {
        state: {
          quizId:    quiz.id,
          roomId:    quiz.roomId,
          title:     quiz.title,
          questions: quiz.questions,
        },
      })
    } catch (err) {
      setError('Could not load quiz. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Brain size={16} />
        </span>
        <div className={styles.meta}>
          <span className={styles.title}>{message.quizTitle || 'Quiz'}</span>
          {(difficultyLabel || message.quizCount) && (
            <span className={styles.sub}>
              {[difficultyLabel, message.quizCount ? `${message.quizCount} questions` : null]
                .filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.by}>Created by {message.senderName}</span>

        {result === undefined ? (
          // Still loading previous result
          null
        ) : result ? (
          // User already completed this quiz
          <div className={styles.completed}>
            <CheckCircle size={13} />
            Completed · {result.percentage}%
          </div>
        ) : (
          // Not yet taken
          <button
            className={styles.takeBtn}
            onClick={handleTakeQuiz}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Take Quiz'}
          </button>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
