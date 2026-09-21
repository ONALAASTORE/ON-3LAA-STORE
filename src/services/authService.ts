import { 
  signInWithEmailAndPassword, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth } from './firebase';

export interface AdminAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const ADMIN_STORAGE_KEY = 'on_alaa_admin_auth';

/**
 * Ensures that the current client has an active Firebase Auth session before performing Firestore writes.
 */
export async function ensureAdminAuthenticated(): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  // Attempt anonymous authentication as a resilient fallback so Firestore request.auth is populated
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('[Firebase Auth] Anonymous auth fallback note:', err);
    return null;
  }
}

/**
 * Authenticate administrator with email and password, or fallback to anonymous auth
 */
export async function loginAdminUser(email: string, pass: string): Promise<User | null> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
    localStorage.setItem('on_alaa_admin_auth_time', Date.now().toString());
    return cred.user;
  } catch (err: any) {
    // If the account does not exist in Firebase Auth yet, verify against default admin credentials
    // and sign in anonymously so that request.auth is populated for Firestore writes
    if (
      (email.trim() === 'alaastoreon@gmail.com' && pass === 'A123321A') ||
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential'
    ) {
      if (email.trim() === 'alaastoreon@gmail.com' && pass === 'A123321A') {
        const anon = await signInAnonymously(auth).catch(() => null);
        localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        localStorage.setItem('on_alaa_admin_auth_time', Date.now().toString());
        return anon ? anon.user : null;
      }
    }
    throw err;
  }
}

/**
 * Sign out administrator
 */
export async function logoutAdminUser(): Promise<void> {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
  localStorage.removeItem('on_alaa_admin_auth_time');
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('[Firebase Auth] Sign out note:', e);
  }
}

/**
 * Hook or observer for admin authentication state
 */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}
