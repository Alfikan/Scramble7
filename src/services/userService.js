import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Creates a user profile document in Firestore.
 * Called once after a new account is created in Firebase Auth.
 */
export async function createUserDocument(uid, displayName, email) {
  await setDoc(doc(db, 'users', uid), {
    displayName,
    email,
    photoURL: null,
    createdAt: serverTimestamp(),
  })
}

/**
 * Fetches a user's profile document from Firestore.
 * Returns null if the document doesn't exist.
 */
export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { uid: snap.id, ...snap.data() }
}
