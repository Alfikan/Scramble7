/**
 * firebaseErrors.js
 *
 * Converts Firebase Auth error codes into friendly user-facing messages.
 * Firebase error codes are documented at:
 * https://firebase.google.com/docs/auth/admin/errors
 */

const ERROR_MESSAGES = {
  'auth/email-already-in-use':    'An account with this email already exists.',
  'auth/invalid-email':           'Please enter a valid email address.',
  'auth/weak-password':           'Password must be at least 6 characters.',
  'auth/user-not-found':          'No account found with this email.',
  'auth/wrong-password':          'Incorrect password. Please try again.',
  'auth/invalid-credential':      'Incorrect email or password.',
  'auth/too-many-requests':       'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed':  'Network error. Check your connection and try again.',
  'auth/user-disabled':           'This account has been disabled.',
  'auth/operation-not-allowed':   'Email/password sign-in is not enabled.',
}

/**
 * Returns a human-readable error message for a Firebase Auth error.
 * Falls back to a generic message for unrecognised error codes.
 *
 * @param {import('firebase/auth').AuthError} error
 * @returns {string}
 */
export function getAuthErrorMessage(error) {
  return ERROR_MESSAGES[error?.code] ?? 'Something went wrong. Please try again.'
}
