import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  limit,
} from 'firebase/firestore'
import { db } from '../firebase/config'

// ── Invite code ───────────────────────────────────────────────

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateInviteCode() {
  let code = 'SCR-'
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

// ── Room operations ───────────────────────────────────────────

/**
 * Creates a new room and adds the creator as owner.
 * Also stores the roomId on the user's profile document (roomIds array)
 * so the dashboard can load rooms without a collectionGroup index.
 */
export async function createRoom({ name, description, ownerId }) {
  const inviteCode = generateInviteCode()

  const roomRef = await addDoc(collection(db, 'rooms'), {
    name: name.trim(),
    description: description.trim(),
    ownerId,
    inviteCode,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Add owner membership doc
  await setDoc(doc(db, 'rooms', roomRef.id, 'members', ownerId), {
    userId: ownerId,
    joinedAt: serverTimestamp(),
    role: 'owner',
  })

  // Track roomId on the user's profile for easy dashboard queries.
  // merge: true creates the doc if it doesn't exist yet.
  await setDoc(doc(db, 'users', ownerId), {
    roomIds: arrayUnion(roomRef.id),
  }, { merge: true })

  return roomRef.id
}

export async function getRoom(roomId) {
  const snap = await getDoc(doc(db, 'rooms', roomId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function findRoomByInviteCode(inviteCode) {
  const snap = await getDocs(
    query(collection(db, 'rooms'), where('inviteCode', '==', inviteCode), limit(1))
  )
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// ── Membership ────────────────────────────────────────────────

export async function isRoomMember(roomId, userId) {
  const snap = await getDoc(doc(db, 'rooms', roomId, 'members', userId))
  return snap.exists()
}

export async function getMembership(roomId, userId) {
  const snap = await getDoc(doc(db, 'rooms', roomId, 'members', userId))
  if (!snap.exists()) return null
  return { userId: snap.id, ...snap.data() }
}

/**
 * Adds a user as a member and records the roomId on their profile.
 */
export async function joinRoom(roomId, userId) {
  await setDoc(doc(db, 'rooms', roomId, 'members', userId), {
    userId,
    joinedAt: serverTimestamp(),
    role: 'member',
  })

  // Track roomId on user profile
  await setDoc(doc(db, 'users', userId), {
    roomIds: arrayUnion(roomId),
  }, { merge: true })
}

/**
 * Removes a user's membership and removes the roomId from their profile.
 */
export async function leaveRoom(roomId, userId) {
  await deleteDoc(doc(db, 'rooms', roomId, 'members', userId))

  await setDoc(doc(db, 'users', userId), {
    roomIds: arrayRemove(roomId),
  }, { merge: true })
}

export async function getRoomMembers(roomId) {
  const snap = await getDocs(collection(db, 'rooms', roomId, 'members'))
  return snap.docs.map((d) => ({ userId: d.id, ...d.data() }))
}

// ── Real-time dashboard subscription ─────────────────────────

/**
 * Subscribes to all rooms the user is a member of.
 *
 * Strategy: listen to the user's profile document which holds a `roomIds`
 * array. For each roomId, fetch the room document. No collectionGroup
 * index required — works immediately without any Firebase console setup.
 *
 * @param {string} userId
 * @param {({ rooms, loading, error }) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeUserRooms(userId, callback) {
  const userRef = doc(db, 'users', userId)

  const unsubscribe = onSnapshot(
    userRef,
    async (userSnap) => {
      try {
        if (!userSnap.exists()) {
          callback({ rooms: [], loading: false, error: null })
          return
        }

        const roomIds = userSnap.data().roomIds || []

        if (roomIds.length === 0) {
          callback({ rooms: [], loading: false, error: null })
          return
        }

        // Fetch all room documents in parallel
        const roomPromises = roomIds.map(async (roomId) => {
          const roomSnap = await getDoc(doc(db, 'rooms', roomId))
          if (!roomSnap.exists()) return null

          // Also get the user's role in this room
          const memberSnap = await getDoc(doc(db, 'rooms', roomId, 'members', userId))
          const myRole = memberSnap.exists() ? memberSnap.data().role : 'member'

          return { id: roomSnap.id, ...roomSnap.data(), myRole }
        })

        const rooms = (await Promise.all(roomPromises)).filter(Boolean)

        // Sort newest first
        rooms.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))

        callback({ rooms, loading: false, error: null })
      } catch (err) {
        callback({ rooms: [], loading: false, error: err.message })
      }
    },
    (err) => {
      callback({ rooms: [], loading: false, error: err.message })
    }
  )

  return unsubscribe
}
