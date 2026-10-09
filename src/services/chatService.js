import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const MAX_MESSAGE_LENGTH = 500

/**
 * Sends a message to a room's messages subcollection.
 *
 * @param {string} roomId
 * @param {{ uid: string, displayName: string }} user  — current Firebase Auth user
 * @param {string} text  — raw message text (trimmed here before write)
 * @returns {Promise<void>}
 */
export async function sendMessage(roomId, user, text) {
  const trimmed = text.trim()

  if (!trimmed) throw new Error('Message cannot be empty.')
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`)
  }

  await addDoc(collection(db, 'rooms', roomId, 'messages'), {
    type:       'text',
    senderId:   user.uid,
    senderName: user.displayName || 'Anonymous',
    text:       trimmed,
    createdAt:  serverTimestamp(),
  })
}

/**
 * Sends a quiz notification card to the room chat.
 * The message type is "quiz" so ChatBox renders a special card.
 *
 * @param {string} roomId
 * @param {{ uid: string, displayName: string }} user
 * @param {{ quizId: string, title: string, difficulty: string, questionCount: number }} quizMeta
 */
export async function sendQuizMessage(roomId, user, { quizId, title, difficulty, questionCount }) {
  await addDoc(collection(db, 'rooms', roomId, 'messages'), {
    type:          'quiz',
    senderId:      user.uid,
    senderName:    user.displayName || 'Anonymous',
    text:          `New quiz: ${title}`,   // fallback text; rule requires text > 0
    quizId,
    quizTitle:     title,
    quizDifficulty: difficulty,
    quizCount:     questionCount,
    createdAt:     serverTimestamp(),
  })
}

/**
 * Subscribes to messages in a room, ordered oldest → newest.
 *
 * @param {string} roomId
 * @param {({ messages, loading, error }) => void} callback
 * @returns {() => void}  unsubscribe function — call on component unmount
 */
export function subscribeToMessages(roomId, callback) {
  const q = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('createdAt', 'asc')
  )

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
      callback({ messages, loading: false, error: null })
    },
    (err) => {
      callback({ messages: [], loading: false, error: err.message })
    }
  )

  return unsubscribe
}
