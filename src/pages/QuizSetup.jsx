import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Brain, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { generateQuiz, saveQuiz } from '../services/quizService'
import { sendQuizMessage } from '../services/chatService'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'
import styles from './QuizSetup.module.css'

export default function QuizSetup() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { currentUser } = useAuth()

  // roomId is passed from Room.jsx via router state
  const roomId = location.state?.roomId || null

  const [form, setForm] = useState({
    topic:         '',
    numQuestions:  '5',
    difficulty:    'medium',
  })
  const [errors,      setErrors]      = useState({})
  const [serverError, setServerError] = useState('')
  const [loading,     setLoading]     = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name])  setErrors((prev) => ({ ...prev, [name]: '' }))
    if (serverError)   setServerError('')
  }

  function validate() {
    const next = {}
    if (!form.topic.trim())
      next.topic = 'Please enter a topic.'
    else if (form.topic.trim().length > 200)
      next.topic = 'Topic must be 200 characters or fewer.'

    const n = Number(form.numQuestions)
    if (!form.numQuestions || isNaN(n) || n < 3 || n > 10)
      next.numQuestions = 'Choose between 3 and 10 questions.'

    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return }
    if (!roomId) { setServerError('No room selected. Go back and enter a room first.'); return }
    if (!currentUser) { setServerError('You must be signed in.'); return }

    setLoading(true)
    try {
      // 1. Call Cloud Function — Gemini runs server-side
      const quizData = await generateQuiz({
        topic:         form.topic.trim(),
        difficulty:    form.difficulty,
        questionCount: Number(form.numQuestions),
        roomId,
      })

      // 2. Save the quiz to Firestore
      const quizId = await saveQuiz({
        roomId,
        createdBy:     currentUser.uid,
        topic:         quizData.topic,
        difficulty:    quizData.difficulty,
        questionCount: quizData.questionCount,
        title:         quizData.title,
        questions:     quizData.questions,
      })

      // 3. Post a quiz card to the room chat so all members see it
      try {
        await sendQuizMessage(roomId, {
          uid:         currentUser.uid,
          displayName: currentUser.displayName || 'Someone',
        }, {
          quizId,
          title:         quizData.title,
          difficulty:    quizData.difficulty,
          questionCount: quizData.questionCount,
        })
      } catch (chatErr) {
        // Non-fatal — quiz is saved, chat notification is best-effort
        console.warn('[Quiz] Could not post quiz message to chat:', chatErr)
      }

      // 4. Navigate to quiz page with all data in router state
      navigate('/quiz', {
        state: {
          quizId,
          roomId,
          topic:      quizData.topic,
          difficulty: quizData.difficulty,
          title:      quizData.title,
          questions:  quizData.questions,
        },
        replace: true,
      })
    } catch (err) {
      // Surface friendly messages — never expose raw errors or the API key
      const msg = err?.message || ''
      if (msg.includes('not configured'))
        setServerError('Groq API key is not configured. Add VITE_GROQ_API_KEY to your .env file and restart the dev server.')
      else if (msg.includes('invalid API key'))
        setServerError('Quiz generation failed: invalid API key. Check VITE_GROQ_API_KEY in your .env file.')
      else if (msg.includes('connection') || msg.includes('reach'))
        setServerError('Could not reach the quiz generator. Check your connection and try again.')
      else if (msg.includes('blocked') || msg.includes('ad blocker'))
        setServerError('A browser extension is blocking Firestore. Please disable your ad blocker for this site and try again.')
      else if (msg.includes('high demand') || msg.includes('unavailable') || msg.includes('busy'))
        setServerError('The quiz generator is temporarily busy. Please wait a moment and try again.')
      else if (msg.includes('unexpected data') || msg.includes('incomplete') || msg.includes('no content'))
        setServerError('Quiz generation returned unexpected data. Please try again.')
      else
        setServerError('Quiz generation failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.inner}>

          {/* Back link */}
          {roomId && (
            <button
              className={styles.backBtn}
              onClick={() => navigate(`/room/${roomId}`)}
            >
              <ArrowLeft size={16} />
              Back to room
            </button>
          )}

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.iconWrap} aria-hidden="true">
              <Brain size={22} />
            </div>
            <div>
              <h1 className={styles.title}>Generate a quiz</h1>
              <p className={styles.subtitle}>
                Powered by Groq AI. Results typically appear in seconds.
              </p>
            </div>
          </div>

          <Card padding="lg">
            <form onSubmit={handleSubmit} noValidate className={styles.form}>

              {serverError && (
                <div className={styles.serverError} role="alert">{serverError}</div>
              )}

              <Input
                id="quiz-topic"
                name="topic"
                label="Topic"
                type="text"
                placeholder="e.g. Operating Systems, The French Revolution, React hooks…"
                value={form.topic}
                onChange={handleChange}
                error={errors.topic}
                disabled={loading}
              />

              <Input
                id="quiz-num"
                name="numQuestions"
                label="Number of questions"
                type="number"
                min="3"
                max="10"
                value={form.numQuestions}
                onChange={handleChange}
                error={errors.numQuestions}
                hint={!errors.numQuestions ? 'Between 3 and 10.' : undefined}
                disabled={loading}
              />

              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Difficulty</legend>
                <div className={styles.radioGroup}>
                  {['easy', 'medium', 'hard'].map((level) => (
                    <label key={level} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="difficulty"
                        value={level}
                        checked={form.difficulty === level}
                        onChange={handleChange}
                        className={styles.radioInput}
                        disabled={loading}
                      />
                      <span className={styles.radioText}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className={styles.formActions}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => roomId ? navigate(`/room/${roomId}`) : navigate('/dashboard')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={loading} disabled={loading}>
                  <Brain size={15} />
                  {loading ? 'Generating…' : 'Generate quiz'}
                </Button>
              </div>

            </form>
          </Card>

        </div>
      </div>
    </div>
  )
}
