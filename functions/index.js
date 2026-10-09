const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { setGlobalOptions }  = require('firebase-functions/v2')
const { defineSecret }       = require('firebase-functions/params')
const admin                  = require('firebase-admin')
const { GoogleGenerativeAI } = require('@google/generative-ai')

// ── Init ──────────────────────────────────────────────────────
admin.initializeApp()
const db = admin.firestore()

// Keep functions in us-central1 (default, lowest latency for most users)
setGlobalOptions({ region: 'us-central1' })

// Declare the Gemini API key as a Firebase secret.
// Set it with: firebase functions:secrets:set GEMINI_API_KEY
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY')

// ── Constants ─────────────────────────────────────────────────
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard']
const MIN_QUESTIONS = 3
const MAX_QUESTIONS = 10
const MAX_TOPIC_LENGTH = 200

// ── generateQuiz callable function ───────────────────────────
exports.generateQuiz = onCall(
  { secrets: [GEMINI_API_KEY] },
  async (request) => {

    // 1. Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to generate a quiz.')
    }

    const uid = request.auth.uid
    const { topic, difficulty, questionCount, roomId } = request.data

    // 2. Validate input
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Topic is required.')
    }
    if (topic.trim().length > MAX_TOPIC_LENGTH) {
      throw new HttpsError('invalid-argument', `Topic must be ${MAX_TOPIC_LENGTH} characters or fewer.`)
    }
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      throw new HttpsError('invalid-argument', 'Difficulty must be easy, medium, or hard.')
    }
    if (
      typeof questionCount !== 'number' ||
      !Number.isInteger(questionCount) ||
      questionCount < MIN_QUESTIONS ||
      questionCount > MAX_QUESTIONS
    ) {
      throw new HttpsError('invalid-argument', `Question count must be between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}.`)
    }
    if (!roomId || typeof roomId !== 'string') {
      throw new HttpsError('invalid-argument', 'Room ID is required.')
    }

    // 3. Verify user is a member of the room
    const memberRef = db.doc(`rooms/${roomId}/members/${uid}`)
    const memberSnap = await memberRef.get()
    if (!memberSnap.exists) {
      throw new HttpsError('permission-denied', 'You are not a member of this room.')
    }

    // 4. Build the Gemini prompt
    const prompt = buildPrompt(topic.trim(), difficulty, questionCount)

    // 5. Call Gemini API
    let quizData
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value())
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      const result = await model.generateContent(prompt)
      const rawText = result.response.text().trim()

      // Strip any accidental markdown fences Gemini might add
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

      quizData = JSON.parse(cleaned)
    } catch (err) {
      console.error('Gemini API error:', err.message)
      throw new HttpsError('internal', 'Failed to generate quiz. Please try again.')
    }

    // 6. Validate the Gemini response structure
    const validationError = validateQuizData(quizData, questionCount)
    if (validationError) {
      console.error('Gemini response validation failed:', validationError, quizData)
      throw new HttpsError('internal', 'Quiz generation returned invalid data. Please try again.')
    }

    // 7. Return the validated quiz data to the client
    //    The client will save to Firestore (so the user's auth context is used for the write)
    return {
      title:         quizData.title,
      questions:     quizData.questions,
      topic:         topic.trim(),
      difficulty,
      questionCount,
    }
  }
)

// ── Helpers ───────────────────────────────────────────────────

function buildPrompt(topic, difficulty, questionCount) {
  return `You are an educational quiz generator. Generate a ${difficulty} difficulty multiple-choice quiz about "${topic}".

Create exactly ${questionCount} questions.

Requirements:
- Each question must have exactly 4 answer options.
- correctAnswer must be an integer from 0 to 3 (the index of the correct option).
- Explanations must be concise (1–2 sentences).
- Questions must be appropriate for the ${difficulty} difficulty level.
- Do not include markdown formatting.
- Do not include code fences.
- Return ONLY valid JSON, nothing else.

Return this exact JSON structure:
{
  "title": "<topic> Quiz",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this answer is correct."
    }
  ]
}`
}

function validateQuizData(data, expectedCount) {
  if (!data || typeof data !== 'object') return 'Response is not an object'
  if (typeof data.title !== 'string' || data.title.trim() === '') return 'Missing or empty title'
  if (!Array.isArray(data.questions)) return 'questions is not an array'
  if (data.questions.length !== expectedCount) {
    return `Expected ${expectedCount} questions, got ${data.questions.length}`
  }

  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i]
    if (typeof q.question !== 'string' || q.question.trim() === '') {
      return `Question ${i + 1}: missing question text`
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return `Question ${i + 1}: must have exactly 4 options`
    }
    for (let j = 0; j < q.options.length; j++) {
      if (typeof q.options[j] !== 'string' || q.options[j].trim() === '') {
        return `Question ${i + 1}, option ${j + 1}: must be a non-empty string`
      }
    }
    if (
      typeof q.correctAnswer !== 'number' ||
      !Number.isInteger(q.correctAnswer) ||
      q.correctAnswer < 0 ||
      q.correctAnswer > 3
    ) {
      return `Question ${i + 1}: correctAnswer must be 0, 1, 2, or 3`
    }
    if (typeof q.explanation !== 'string' || q.explanation.trim() === '') {
      return `Question ${i + 1}: missing explanation`
    }
  }

  return null // valid
}
