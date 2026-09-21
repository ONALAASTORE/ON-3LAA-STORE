import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import localConfig from '../../firebase-applet-config.json';

// Support Vercel / GitHub Actions env vars with fallback to local config
const resolvedConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || localConfig.firestoreDatabaseId,
};

// Initialize Firebase App instance (prevent re-initializing in dev)
export const app = getApps().length > 0 ? getApp() : initializeApp(resolvedConfig);

// Initialize Firestore with specific databaseId if specified
export const db = resolvedConfig.firestoreDatabaseId
  ? getFirestore(app, resolvedConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Storage for product images and digital assets
export const storage = getStorage(app);

// Initialize Firebase Auth for administrator access
export const auth = getAuth(app);

export const PRODUCTS_COLLECTION = 'products';
