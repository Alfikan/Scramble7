import { createContext, useContext, useState, useEffect, useRef } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { createUserDocument } from '../services/userService'
import { startPresence } from '../firebase/presence'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Keep a ref to the presence cleanup so we can call it on logout
  const stopPresenceRef = useRef(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // If a previous presence session is running, stop it first
      if (stopPresenceRef.current) {
        stopPresenceRef.current()
        stopPresenceRef.current = null
      }

      setCurrentUser(user)
      setLoading(false)

      // Start tracking presence whenever a user is signed in
      if (user) {
        stopPresenceRef.current = startPresence(user.uid)
      }
    })

    return () => {
      unsubscribe()
      // Clean up presence if the provider unmounts
      if (stopPresenceRef.current) {
        stopPresenceRef.current()
      }
    }
  }, [])

  async function signup(name, email, password) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(user, { displayName: name })
    await createUserDocument(user.uid, name, email)
  }

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    // Manually stop presence before signing out so the write goes through
    if (stopPresenceRef.current) {
      stopPresenceRef.current()
      stopPresenceRef.current = null
    }
    await signOut(auth)
  }

  const value = { currentUser, loading, signup, login, logout }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>.')
  }
  return context
}
