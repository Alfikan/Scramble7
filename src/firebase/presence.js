import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database'
import { rtdb } from './config'

/**
 * Starts tracking online/offline presence for a user.
 *
 * How it works:
 * 1. We listen to the special /.info/connected path in RTDB, which Firebase
 *    sets to true when the client has an active connection.
 * 2. When connected: write { state: "online" } to presence/{userId}.
 * 3. Register an onDisconnect hook: Firebase's server will automatically
 *    write { state: "offline" } if the connection drops (even on crash/tab close).
 *
 * @param {string} userId
 * @returns {() => void}  cleanup function — call on logout or unmount
 */
export function startPresence(userId) {
  const userPresenceRef = ref(rtdb, `presence/${userId}`)
  const connectedRef    = ref(rtdb, '.info/connected')

  // Listen to the connection state
  const unsubscribe = onValue(connectedRef, (snap) => {
    if (!snap.val()) return   // Not connected yet — wait

    // Register what happens when this client disconnects
    onDisconnect(userPresenceRef).set({
      state:       'offline',
      lastChanged: serverTimestamp(),
    })

    // Now mark the user as online
    set(userPresenceRef, {
      state:       'online',
      lastChanged: serverTimestamp(),
    })
  })

  // Return a cleanup function that marks the user offline immediately
  // (used on explicit logout, not just tab close)
  return () => {
    unsubscribe()
    set(userPresenceRef, {
      state:       'offline',
      lastChanged: serverTimestamp(),
    })
  }
}

/**
 * Subscribes to a single user's presence state in real time.
 *
 * @param {string} userId
 * @param {({ state, lastChanged }) => void} callback
 * @returns {() => void}  unsubscribe function
 */
export function subscribeToPresence(userId, callback) {
  const userPresenceRef = ref(rtdb, `presence/${userId}`)

  const unsubscribe = onValue(userPresenceRef, (snap) => {
    if (snap.exists()) {
      callback(snap.val())       // { state: 'online'|'offline', lastChanged: number }
    } else {
      callback({ state: 'offline', lastChanged: null })
    }
  })

  return unsubscribe
}
