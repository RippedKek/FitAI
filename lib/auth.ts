import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

