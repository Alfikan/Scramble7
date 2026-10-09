import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Trophy, Check, X, ArrowLeft, RotateCcw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { saveResult } from '../services/quizService'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import styles from './QuizResult.module.css'

export default function QuizResult() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { currentUser } = useAuth()

  const state = location.state

  // Guard — no valid result data
  if (!state?.questions || state.score === undefined) {
    return (
      <div className={styles.page}>
        <div className="container">
          <Card padding="none">
            <EmptyState
              icon={<Trophy size={22} />}
              title="No result to show"
              description="Complete a quiz first to see your results here."
              action={
                <Button as={Link} to="/dashboard" variant="primary" size="sm">
                  Back to dashboard
                </Button>
              }
            />
          </Card>
        </div>
      </div>
    )
  }

  const { quizId, roomId, title, questions, answers, score, total, percentage } = state

  // Save result once — useRef prevents double-save in React Strict Mode
  const savedRef = useRef(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (savedRef.current || !currentUser || !quizId) return
    savedRef.current = true

    saveResult({
      quizId,
      userId:         currentUser.uid,
      roomId,
      score,
      totalQuestions: total,
      percentage,
    }).catch((err) => {
      console.error('Failed to save result:', err)
      setSaveError('Your result could not be saved, but you can still review your answers.')
    })
  }, [quizId, currentUser, roomId, score, total, percentage])

  function getScoreLabel(pct) {
    if (pct >= 90) return { label: 'Excellent!',  color: 'var(--color-success)' }
    if (pct >= 70) return { label: 'Good work!',  color: 'var(--color-accent)'  }
    if (pct >= 50) return { label: 'Keep it up!', color: 'var(--color-warning)' }
    return         { label: 'Keep studying',      color: 'var(--color-error)'   }
  }

  const { label: scoreLabel, color: scoreColor } = getScoreLabel(percentage)

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.inner}>

          {/* Score card */}
          <Card padding="lg">
            <div className={styles.scoreCard}>
              <div className={styles.trophyWrap} aria-hidden="true">
                <Trophy size={28} />
              </div>
              <h1 className={styles.quizTitle}>{title}</h1>
              <p className={styles.scoreLabel} style={{ color: scoreColor }}>
                {scoreLabel}
              </p>
              <p className={styles.scoreFraction}>
                <span className={styles.scoreNum}>{score}</span>
                <span className={styles.scoreDenom}> / {total}</span>
              </p>
              <p className={styles.scorePct}>{percentage}% correct</p>

              <div className={styles.scoreMeta}>
                <span className={styles.scoreChip}>
                  <Check size={12} /> {score} correct
                </span>
                <span className={[styles.scoreChip, styles.scoreChipWrong].join(' ')}>
                  <X size={12} /> {total - score} incorrect
                </span>
              </div>
            </div>
          </Card>

          {saveError && (
            <p className={styles.saveError} role="alert">{saveError}</p>
          )}

          {/* Question breakdown */}
          <h2 className={styles.breakdownTitle}>Question breakdown</h2>

          <div className={styles.breakdown}>
            {questions.map((q, i) => {
              const userAnswer    = answers[i] ?? null
              const isCorrect     = userAnswer === q.correctAnswer
              return (
                <Card key={i} padding="md">
                  <div className={styles.breakdownItem}>
                    <div className={styles.breakdownStatus}>
                      {isCorrect
                        ? <span className={styles.correctIcon}><Check size={14} /></span>
                        : <span className={styles.wrongIcon}><X size={14} /></span>
                      }
                    </div>
                    <div className={styles.breakdownContent}>
                      <p className={styles.breakdownQ}>
                        <span className={styles.qNum}>Q{i + 1}.</span> {q.question}
                      </p>

                      {!isCorrect && userAnswer !== null && (
                        <p className={styles.yourAnswer}>
                          Your answer:{' '}
                          <span className={styles.wrongText}>
                            {q.options[userAnswer]}
                          </span>
                        </p>
                      )}
                      {!isCorrect && userAnswer === null && (
                        <p className={styles.yourAnswer}>
                          <span className={styles.wrongText}>Not answered</span>
                        </p>
                      )}

                      <p className={styles.correctAnswer}>
                        Correct answer:{' '}
                        <span className={styles.correctText}>
                          {q.options[q.correctAnswer]}
                        </span>
                      </p>

                      <p className={styles.explanation}>{q.explanation}</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            {roomId && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/room/${roomId}`)}
              >
                <ArrowLeft size={15} />
                Back to room
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => navigate('/quiz/setup', { state: { roomId } })}
            >
              <RotateCcw size={15} />
              New quiz
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
