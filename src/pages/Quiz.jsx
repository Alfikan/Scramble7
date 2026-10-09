import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Brain, ArrowLeft, ArrowRight } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import styles from './Quiz.module.css'

export default function Quiz() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const state = location.state

  // If someone navigates to /quiz without going through QuizSetup
  if (!state?.questions?.length) {
    return (
      <div className={styles.page}>
        <div className="container">
          <Card padding="none">
            <EmptyState
              icon={<Brain size={22} />}
              title="No quiz loaded"
              description="Generate a quiz from a study room first."
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

  const { quizId, roomId, title, questions } = state
  const total = questions.length

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers,      setAnswers]      = useState({})   // { [questionIndex]: selectedOptionIndex }
  const [attempted,    setAttempted]    = useState(false) // track if Next was clicked without answer

  const question    = questions[currentIndex]
  const selected    = answers[currentIndex] ?? null
  const isLast      = currentIndex === total - 1
  const isFirst     = currentIndex === 0

  function handleSelect(optionIndex) {
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }))
    setAttempted(false)
  }

  function handleNext() {
    if (selected === null) { setAttempted(true); return }
    setAttempted(false)
    if (isLast) {
      finishQuiz()
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  function handlePrev() {
    setAttempted(false)
    setCurrentIndex((i) => i - 1)
  }

  function finishQuiz() {
    // Calculate score
    let score = 0
    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score++
    })
    const percentage = Math.round((score / total) * 100)

    navigate('/quiz/result', {
      state: { quizId, roomId, title, questions, answers, score, total, percentage },
      replace: true,
    })
  }

  const answeredCount = Object.keys(answers).length
  const progress      = Math.round((answeredCount / total) * 100)

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.inner}>

          {/* Header */}
          <div className={styles.quizHeader}>
            <h1 className={styles.quizTitle}>{title}</h1>
            <span className={styles.counter}>
              Question {currentIndex + 1} of {total}
            </span>
          </div>

          {/* Progress bar */}
          <div className={styles.progressBar} role="progressbar"
            aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}
            aria-label={`${answeredCount} of ${total} questions answered`}
          >
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>

          {/* Question card */}
          <Card padding="lg">
            <div className={styles.questionWrap}>
              <p className={styles.questionText}>{question.question}</p>

              <ul className={styles.options}>
                {question.options.map((opt, i) => (
                  <li key={i}>
                    <button
                      className={[
                        styles.option,
                        selected === i ? styles.optionSelected : '',
                      ].join(' ')}
                      onClick={() => handleSelect(i)}
                      aria-pressed={selected === i}
                    >
                      <span className={styles.optionLetter}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className={styles.optionText}>{opt}</span>
                    </button>
                  </li>
                ))}
              </ul>

              {attempted && selected === null && (
                <p className={styles.selectHint} role="alert">
                  Please select an answer before continuing.
                </p>
              )}
            </div>
          </Card>

          {/* Navigation */}
          <div className={styles.nav}>
            <Button
              variant="secondary"
              onClick={handlePrev}
              disabled={isFirst}
            >
              <ArrowLeft size={15} />
              Previous
            </Button>

            <Button
              variant="primary"
              onClick={handleNext}
            >
              {isLast ? 'Finish quiz' : 'Next'}
              {!isLast && <ArrowRight size={15} />}
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
