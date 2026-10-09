import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

// ── Groq configuration ────────────────────────────────────────
// Key lives in .env as VITE_GROQ_API_KEY — never hardcoded.
// Groq exposes an OpenAI-compatible HTTP API, so no SDK is needed.
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL   = 'openai/gpt-oss-120b'

/**
 * Calls Groq directly from the browser to generate quiz questions.
 * Uses the OpenAI-compatible chat completions endpoint.
 * Returns the same shape that QuizSetup.jsx and Quiz.jsx expect.
 *
 * @param {{ topic: string, difficulty: string, questionCount: number }} params
 * @returns {Promise<{ title, topic, difficulty, questionCount, questions }>}
 */
export async function generateQuiz({ topic, difficulty, questionCount }) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  console.debug(
    '[Groq] key exists:', !!apiKey,
    '| length:', apiKey?.length ?? 0
  )

  if (!apiKey) {
    console.warn('[Groq] VITE_GROQ_API_KEY is undefined — restart the dev server after updating .env')
    throw new Error('Groq API key is not configured. Add VITE_GROQ_API_KEY to your .env file and restart the dev server.')
  }

  const prompt = buildPrompt(topic, difficulty, questionCount)

  let res
  try {
    res = await fetch(GROQ_API_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    })
  } catch (err) {
    // Network-level failure (no internet, DNS error, etc.)
    console.error('[Groq] fetch failed:', err)
    throw new Error('Could not reach the quiz generator. Check your connection and try again.')
  }

  // Handle HTTP-level errors
  if (!res.ok) {
    const status = res.status
    let body = ''
    try { body = await res.text() } catch { /* ignore */ }
    console.error(`[Groq] HTTP ${status}:`, body)

    if (status === 401 || status === 403) {
      throw new Error('Quiz generation failed: invalid API key. Check VITE_GROQ_API_KEY.')
    }
    if (status === 429) {
      throw new Error('The quiz generator is under high demand right now. Please wait a moment and try again.')
    }
    if (status === 503 || status === 502) {
      throw new Error('The quiz generator is temporarily unavailable. Please try again in a moment.')
    }
    throw new Error('Quiz generation failed. Please try again.')
  }

  // Parse the Groq response envelope
  let envelope
  try {
    envelope = await res.json()
  } catch {
    throw new Error('Quiz generation returned unexpected data. Please try again.')
  }

  const rawText = (envelope?.choices?.[0]?.message?.content ?? '').trim()
  if (!rawText) {
    console.error('[Groq] empty content in response:', envelope)
    throw new Error('Quiz generation returned no content. Please try again.')
  }

  // Log the first 300 chars of the raw response so we can see what the model returned
  console.debug('[Groq] raw content (first 300 chars):', rawText.slice(0, 300))

  // Strip markdown fences — handle all common patterns:
  // ```json\n{...}\n```   or   ```\n{...}\n```   or   just {  ...  }
  // Also handles cases where there is text before or after the JSON block
  let cleaned = rawText
  // If the response contains a code fence, extract just the content inside it
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim()
    console.debug('[Groq] extracted from code fence, length:', cleaned.length)
  } else {
    // No fences — find the JSON object directly (starts with { ends with })
    const jsonStart = rawText.indexOf('{')
    const jsonEnd   = rawText.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = rawText.slice(jsonStart, jsonEnd + 1).trim()
    }
  }

  console.debug('[Groq] cleaned content (first 300 chars):', cleaned.slice(0, 300))

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('[Groq] invalid JSON from model:', cleaned)
    throw new Error('Quiz generation returned unexpected data. Please try again.')
  }

      console.log('[Quiz] Groq response received, validating...')

  const validationError = validateQuizData(parsed, questionCount)
  if (validationError) {
    console.error('[Groq] validation failed:', validationError, '| parsed keys:', Object.keys(parsed || {}))
    throw new Error('Quiz generation returned incomplete data. Please try again.')
  }

  console.log('[Quiz] Quiz validation successful')

  return {
    title:         parsed.title,
    questions:     parsed.questions,
    topic,
    difficulty,
    questionCount,
  }
}

// ── Prompt ────────────────────────────────────────────────────

function buildPrompt(topic, difficulty, questionCount) {
  return `You are an educational quiz generator. Generate a ${difficulty} difficulty multiple-choice quiz about "${topic}".

Create exactly ${questionCount} questions.

Requirements:
- Each question must have exactly 4 answer options.
- correctAnswer must be an integer from 0 to 3 (the index of the correct option).
- Explanations must be concise (1–2 sentences).
- Questions must match the ${difficulty} difficulty level.
- Do not include markdown formatting.
- Do not include code fences.
- Return ONLY valid JSON, nothing else.

Return this exact JSON structure:
{
  "title": "${topic} Quiz",
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

// ── Validation ────────────────────────────────────────────────

function validateQuizData(data, expectedCount) {
  if (!data || typeof data !== 'object')           return 'Response is not an object'
  if (typeof data.title !== 'string' || !data.title.trim()) return 'Missing title'
  if (!Array.isArray(data.questions))              return 'questions is not an array'
  if (data.questions.length !== expectedCount)
    return `Expected ${expectedCount} questions, got ${data.questions.length}`

  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i]
    if (typeof q.question !== 'string' || !q.question.trim())
      return `Question ${i + 1}: missing question text`
    if (!Array.isArray(q.options) || q.options.length !== 4)
      return `Question ${i + 1}: must have exactly 4 options`
    for (let j = 0; j < 4; j++) {
      if (typeof q.options[j] !== 'string' || !q.options[j].trim())
        return `Question ${i + 1}, option ${j + 1}: must be a non-empty string`
    }
    if (
      typeof q.correctAnswer !== 'number' ||
      !Number.isInteger(q.correctAnswer) ||
      q.correctAnswer < 0 ||
      q.correctAnswer > 3
    ) return `Question ${i + 1}: correctAnswer must be 0–3`
    if (typeof q.explanation !== 'string' || !q.explanation.trim())
      return `Question ${i + 1}: missing explanation`
  }

  return null // valid
}

// ── Firestore operations (unchanged) ─────────────────────────

/**
 * Saves a generated quiz to Firestore under quizzes/{quizId}.
 * @returns {Promise<string>} the new quizId
 */
export async function saveQuiz({ roomId, createdBy, topic, difficulty, questionCount, title, questions }) {
  console.log('[Quiz] About to save quiz to Firestore...')
  try {
    const ref = await addDoc(collection(db, 'quizzes'), {
      roomId,
      createdBy,
      topic,
      difficulty,
      questionCount,
      title,
      questions,
      createdAt: serverTimestamp(),
    })
    console.log('[Quiz] Quiz saved successfully, id:', ref.id)
    return ref.id
  } catch (err) {
    console.error('[Quiz] Save failed:', err?.code, err?.message)
    // ERR_BLOCKED_BY_CLIENT means a browser extension (ad blocker) is
    // blocking the Firestore network request — not a code or auth issue.
    if (err?.message?.includes('BLOCKED') || err?.name === 'TypeError') {
      throw new Error('Firestore request was blocked. Please disable your ad blocker for this site and try again.')
    }
    throw err
  }
}

/**
 * Saves a user's quiz result. setDoc overwrites on re-submission.
 */
export async function saveResult({ quizId, userId, roomId, score, totalQuestions, percentage }) {
  await setDoc(
    doc(db, 'quizzes', quizId, 'results', userId),
    {
      userId,
      roomId,
      score,
      totalQuestions,
      percentage,
      completedAt: serverTimestamp(),
    }
  )
}

/**
 * Fetches a quiz document by ID.
 */
export async function getQuiz(quizId) {
  const snap = await getDoc(doc(db, 'quizzes', quizId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

/**
 * Fetches a user's result for a specific quiz.
 * Returns null if the user hasn't completed it.
 */
export async function getUserResult(quizId, userId) {
  const snap = await getDoc(doc(db, 'quizzes', quizId, 'results', userId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

/**
 * Fetches all quizzes for a room (for leaderboard aggregation).
 * @param {string} roomId
 * @returns {Promise<Array>}
 */
export async function getQuizzesByRoom(roomId) {
  const snap = await getDocs(
    query(collection(db, 'quizzes'), where('roomId', '==', roomId))
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Builds a leaderboard for a room.
 */
export async function getRoomLeaderboard(roomId) {
  const quizzes = await getQuizzesByRoom(roomId)
  if (quizzes.length === 0) return []

  const userStats = {}

  await Promise.all(
    quizzes.map(async (quiz) => {
      const resultsSnap = await getDocs(
        collection(db, 'quizzes', quiz.id, 'results')
      )
      resultsSnap.docs.forEach((rd) => {
        const r = rd.data()
        if (!userStats[r.userId]) {
          userStats[r.userId] = { pcts: [] }
        }
        userStats[r.userId].pcts.push(r.percentage ?? 0)
      })
    })
  )

  const rows = Object.entries(userStats).map(([userId, stats]) => {
    const pcts = stats.pcts
    const avgPct  = Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length)
    const bestPct = Math.max(...pcts)
    return { userId, quizzesCompleted: pcts.length, avgPct, bestPct }
  })

  rows.sort((a, b) => {
    if (b.avgPct !== a.avgPct)                     return b.avgPct - a.avgPct
    if (b.quizzesCompleted !== a.quizzesCompleted) return b.quizzesCompleted - a.quizzesCompleted
    return b.bestPct - a.bestPct
  })

  return rows
}

/**
 * Fetches the current user's most recent quiz results across all rooms.
 *
 * Uses collectionGroup('results') filtered by userId, ordered by
 * completedAt desc, limited to 5. For each result, fetches the parent
 * quiz document to get the title.
 *
 * Security: the results rule allows isOwner(userId) to read their own docs.
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
/**
 * Fetches the current user's most recent quiz results across all rooms.
 *
 * Strategy: use the user's roomIds array (already on their profile) to
 * find all quizzes in those rooms, then for each quiz check if the user
 * has a result document. This uses only getDoc/getDocs calls which are
 * covered by existing security rules — no collectionGroup index needed.
 *
 * Falls back to collectionGroup if roomIds is empty (e.g. old accounts).
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getRecentUserResults(userId) {
  console.log('[Activity] fetching for userId:', userId)

  // 1. Get user's roomIds from their profile
  const userSnap = await getDoc(doc(db, 'users', userId))
  const roomIds  = userSnap.exists() ? (userSnap.data().roomIds || []) : []
  console.log('[Activity] roomIds:', roomIds)

  if (roomIds.length === 0) {
    console.log('[Activity] no rooms — returning empty')
    return []
  }

  // 2. For each room, fetch all quizzes
  const allQuizzes = []
  await Promise.all(
    roomIds.map(async (roomId) => {
      try {
        const snap = await getDocs(
          query(collection(db, 'quizzes'), where('roomId', '==', roomId))
        )
        snap.docs.forEach((d) => allQuizzes.push({ id: d.id, ...d.data() }))
      } catch (err) {
        console.warn('[Activity] could not fetch quizzes for room', roomId, err?.code)
      }
    })
  )
  console.log('[Activity] total quizzes found:', allQuizzes.length)

  // 3. For each quiz, check if the user has a result (single getDoc — no index needed)
  const resultItems = []
  await Promise.all(
    allQuizzes.map(async (quiz) => {
      try {
        const resultSnap = await getDoc(
          doc(db, 'quizzes', quiz.id, 'results', userId)
        )
        if (resultSnap.exists()) {
          const r = resultSnap.data()
          resultItems.push({
            quizId:         quiz.id,
            title:          quiz.title || 'Quiz',
            score:          r.score,
            totalQuestions: r.totalQuestions,
            percentage:     r.percentage,
            roomId:         r.roomId,
            completedAt:    r.completedAt,
          })
          console.log('[Activity] result found for quiz', quiz.id, '— percentage:', r.percentage)
        }
      } catch (err) {
        console.warn('[Activity] could not fetch result for quiz', quiz.id, err?.code)
      }
    })
  )

  // 4. Sort newest first, take top 5
  resultItems.sort((a, b) => {
    const aT = a.completedAt?.seconds ?? 0
    const bT = b.completedAt?.seconds ?? 0
    return bT - aT
  })

  const recent = resultItems.slice(0, 5)
  console.log('[Activity] returning', recent.length, 'results')
  return recent
}
